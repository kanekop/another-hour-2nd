// public/js/timezone-manager.js

// city-timezones.js からタイムゾーン候補のデータをインポート
import { cityCandidatesByOffset } from './city-timezones.js';

// World Clock で表示する基準となるUTCオフセット（分単位）
const TARGET_UTC_OFFSETS_MINUTES = [
  720, 660, 600, 540, 480, 420, 360, 300, 240, 180, 120, 60,
  0, -60, -120, -180, -240, -300, -360, -420, -480, -540, -600, -660
].sort((a, b) => b - a); // オフセットが大きい順（例: UTC+12 から UTC-11 へ）

/**
 * 表示用のタイムゾーンリストを生成します。
 * World Clock と Main Clock のドロップダウンで使用することを想定しています。
 * Moment.js がロードされている必要があります。
 * @returns {Array<Object>} タイムゾーンオブジェクトの配列。各オブジェクトは以下の形式:
 * {
 * timezone: string,     // IANAタイムゾーン名 (例: "Asia/Tokyo")
 * city: string,         // 表示用の都市名 (例: "Tokyo (Japan)")
 * offset: number,       // 現在のUTCオフセット（分単位）
 * offsetString: string, // 表示用のオフセット文字列 (例: "UTC+9")
 * displayText: string   // ドロップダウン用の表示テキスト (例: "Tokyo (Japan) (UTC+9)")
 * }
 */
export function getDisplayTimezones() {
  if (typeof moment === 'undefined' || typeof moment.tz === 'undefined') {
    console.error("Moment.js and Moment Timezone are not loaded for getDisplayTimezones.");
    return [];
  }

  const selectedTimezones = new Set(); // 重複するIANA名を選択しないようにするため
  const displayTimezones = [];

  TARGET_UTC_OFFSETS_MINUTES.forEach(targetOffset => {
    const candidates = cityCandidatesByOffset[targetOffset.toString()] || [];
    let bestCandidate = null;

    // ターゲットオフセットに完全に一致し、まだ選択されていないものを探す (type 'dst' と 'std' を優先)
    for (const type of ['dst', 'std', 'any']) {
        for (const candidate of candidates) {
            if ((candidate.type === type || candidate.type === 'any') && !selectedTimezones.has(candidate.timezone)) {
                const currentActualOffset = moment.tz(candidate.timezone).utcOffset();
                if (currentActualOffset === targetOffset) {
                    if (!bestCandidate || candidate.priority < bestCandidate.priority) {
                        bestCandidate = candidate;
                    }
                }
            }
        }
        if (bestCandidate) break; // 優先タイプで見つかればループを抜ける
    }


    // 見つからなければ、オフセットが異なる可能性を許容してフォールバック (優先度順)
    if (!bestCandidate) {
      for (const candidate of candidates.sort((a, b) => a.priority - b.priority)) {
        if (!selectedTimezones.has(candidate.timezone)) {
          bestCandidate = candidate;
          break;
        }
      }
    }

    if (bestCandidate) {
      selectedTimezones.add(bestCandidate.timezone);
      const currentOffset = moment.tz(bestCandidate.timezone).utcOffset();
      const offsetHours = currentOffset / 60;
      const sign = offsetHours >= 0 ? '+' : '-';
      const absOffsetHours = Math.abs(offsetHours);
      const offsetString = `UTC${sign}${String(Math.floor(absOffsetHours)).padStart(2, '0')}${absOffsetHours % 1 !== 0 ? (':' + String(Math.abs(currentOffset % 60)).padStart(2, '0')) : ''}`;


      displayTimezones.push({
        timezone: bestCandidate.timezone,
        city: bestCandidate.city, // cityCandidatesByOffset で定義された都市名
        offset: currentOffset,
        offsetString: offsetString,
        displayText: `${bestCandidate.city} (${offsetString})`
      });
    } else {
      // フォールバック (非常に稀なケースのはず)
      const offsetHours = targetOffset / 60;
      const sign = offsetHours >= 0 ? '+' : '-';
      const absOffsetHours = Math.abs(offsetHours);
      const genericTimezoneName = `Etc/GMT${offsetHours >= 0 ? '-' : '+'}${Math.floor(absOffsetHours)}${absOffsetHours % 1 !== 0 ? (':' + String(Math.abs(targetOffset % 60)).padStart(2, '0')) : ''}`;
      const fallbackCityName = `UTC${sign}${String(Math.floor(absOffsetHours)).padStart(2, '0')}${absOffsetHours % 1 !== 0 ? (':' + String(Math.abs(targetOffset % 60)).padStart(2, '0')) : ''}`;

      if (!selectedTimezones.has(genericTimezoneName)) {
          selectedTimezones.add(genericTimezoneName);
          displayTimezones.push({
              timezone: genericTimezoneName,
              city: fallbackCityName,
              offset: targetOffset,
              offsetString: fallbackCityName,
              displayText: `${fallbackCityName}`
          });
      }
    }
  });

  // 最終的なリストをオフセットの降順（UTC+12, +11,...）にソートし、
  // 同じオフセット内では都市名の昇順にソート
  displayTimezones.sort((a, b) => {
    if (b.offset === a.offset) {
      return a.city.localeCompare(b.city);
    }
    return b.offset - a.offset;
  });

  return displayTimezones;
}

/**
 * ユーザーのローカルIANAタイムゾーン名を取得します。
 * @returns {string|null} IANAタイムゾーン名、または取得失敗時はnull
 */
export function getUserLocalTimezone() {
  if (typeof moment === 'undefined' || typeof moment.tz === 'undefined') {
    console.error("Moment.js and Moment Timezone are not loaded for getUserLocalTimezone.");
    return null;
  }
  return moment.tz.guess();
}

/**
 * 指定されたIANAタイムゾーン名に対応する都市名を取得します。
 * `cityCandidatesByOffset` から検索します。
 * @param {string} timezoneName - IANAタイムゾーン名
 * @returns {string} 都市名。見つからない場合は、タイムゾーン名から推測した名前。
 */
export function getCityNameByTimezone(timezoneName) {
    for (const offsetKey in cityCandidatesByOffset) {
        const candidates = cityCandidatesByOffset[offsetKey];
        const found = candidates.find(c => c.timezone === timezoneName);
        if (found) {
            return found.city; // cityCandidatesByOffset で定義された city 名
        }
    }
    // 見つからない場合、タイムゾーン名を整形して返す
    const parts = timezoneName.split('/');
    return parts.length > 1 ? parts[parts.length - 1].replace(/_/g, ' ') : timezoneName;
}