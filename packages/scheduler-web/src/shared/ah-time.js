// src/shared/ah-time.js

/**
 * 実時間のミリ秒を、指定されたスケールファクターに基づいてスケールされたミリ秒に変換します。
 * @param {number} realMs - 実時間のミリ秒。
 * @param {number} scaleFactor - 適用するスケールファクター。
 * @returns {number} スケールされたミリ秒。
 */
export const convertToScaledMs = (realMs, scaleFactor) => {
  if (scaleFactor === 0) return realMs; // スケールファクター0は未定義の動作なので、実時間をそのまま返すかエラー処理
  if (scaleFactor === Infinity) return 0; // 無限大スケールの場合、経過時間は0に収束すると考える (またはエラー)
  return realMs * scaleFactor;
};

/**
 * 指定されたスケールファクターに基づいてスケールされたミリ秒を、実時間のミリ秒に変換します。
 * @param {number} scaledMs - スケールされたミリ秒。
 * @param {number} scaleFactor - 適用されたスケールファクター。
 * @returns {number} 実時間のミリ秒。
 */
export const convertFromScaledMs = (scaledMs, scaleFactor) => {
  if (scaleFactor === 0 || scaleFactor === Infinity) return scaledMs; // 不適切なスケールファクターの場合は入力値をそのまま返すかエラー処理
  return scaledMs / scaleFactor;
};