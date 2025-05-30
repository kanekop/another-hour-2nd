// public/js/aph-graph-demo.js

/**
 * 分を時間と分の文字列にフォーマットします。
 * 例: 1380 -> "23 hours 0 minutes"
 * @param {number} totalMinutes - 合計分数
 * @returns {string} フォーマットされた時間文字列
 */
export function formatDuration(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hours ${minutes} minutes`;
}

/**
 * APHグラフのバーを描画します。
 * @param {HTMLElement} aphGraphBarElement - APHグラフのバーを描画するコンテナ要素
 * @param {number} normalAphDayMinutes - 通常のAPH日の期間（分単位）
 */
export function drawAphGraph(aphGraphBarElement, normalAphDayMinutes) {
    if (!aphGraphBarElement) {
        console.error("APH graph bar element not provided for drawing.");
        return;
    }
    aphGraphBarElement.innerHTML = ''; // 既存の描画をクリア

    const totalRealMinutesInDay = 24 * 60;
    const aphDurationMinutes = totalRealMinutesInDay - normalAphDayMinutes;

    const normalColor = '#f0ad4e'; // 通常期間の色
    const aphColor = '#d9534f';    // APH期間の色

    let normalPartPercent = (normalAphDayMinutes / totalRealMinutesInDay) * 100;
    let aphPartPercent = (aphDurationMinutes / totalRealMinutesInDay) * 100;

    // パーセンテージの丸め誤差や境界条件の処理
    if (normalAphDayMinutes <= 0) {
        normalPartPercent = 0;
        aphPartPercent = 100;
    } else if (aphDurationMinutes <= 0) {
        normalPartPercent = 100;
        aphPartPercent = 0;
    }
    // 浮動小数点数演算による誤差を補正
    if (normalPartPercent > 0 && aphPartPercent > 0 && Math.abs(normalPartPercent + aphPartPercent - 100) > 0.0001) {
        aphPartPercent = 100 - normalPartPercent;
    }


    // 通常期間のブロック (オレンジ)
    if (normalPartPercent > 0) {
        const normalSegmentBlock = document.createElement('div');
        normalSegmentBlock.classList.add('bar-segment-block');
        normalSegmentBlock.style.height = `${normalPartPercent}%`;
        normalSegmentBlock.style.backgroundColor = normalColor;

        const numberOfLabelsInNormalPart = 24; // 0から23までのラベル
        for (let i = 0; i < numberOfLabelsInNormalPart; i++) {
            const labelDiv = document.createElement('div');
            labelDiv.classList.add('segment-hour-label');
            labelDiv.textContent = i;
            normalSegmentBlock.appendChild(labelDiv);
        }
        aphGraphBarElement.appendChild(normalSegmentBlock);
    }

    // APH期間のブロック (赤)
    if (aphPartPercent > 0) {
        const aphSegmentBlock = document.createElement('div');
        aphSegmentBlock.classList.add('bar-segment-block');
        aphSegmentBlock.style.height = `${aphPartPercent}%`;
        aphSegmentBlock.style.backgroundColor = aphColor;
        aphSegmentBlock.textContent = 'Another Hour'; // テキストラベル
        // スタイル調整 (元コードから引用・調整)
        aphSegmentBlock.style.display = 'flex';
        aphSegmentBlock.style.alignItems = 'center';
        aphSegmentBlock.style.justifyContent = 'center';
        const aphSingleHourPercent = (1 / 24) * 100 * 0.8; // フォントサイズ調整のための閾値
        aphSegmentBlock.style.fontSize = aphPartPercent < aphSingleHourPercent ? '0.5em' : '0.7em';
        aphSegmentBlock.style.overflow = 'hidden';
        aphSegmentBlock.style.lineHeight = '1.1';
        aphGraphBarElement.appendChild(aphSegmentBlock);
    }
}

/**
 * APHグラフのY軸ラベルと補助線を更新します。
 * @param {HTMLElement} aphAxisLabelContainerElement - APHグラフのY軸ラベルを描画するコンテナ要素
 * @param {HTMLElement} aphGraphContainerElement - APHグラフ全体のコンテナ要素 (補助線の基準用)
 * @param {number} normalAphDayMinutes - 通常のAPH日の期間（分単位）
 */
export function updateAphAxisLabels(aphAxisLabelContainerElement, aphGraphContainerElement, normalAphDayMinutes) {
    if (!aphAxisLabelContainerElement) {
        console.error("APH axis label container element not provided.");
        return;
    }
    if (!aphGraphContainerElement) {
        console.error("APH graph container element not provided for axis labels.");
        return;
    }
    aphAxisLabelContainerElement.innerHTML = ''; // 既存のラベルをクリア

    const totalRealMinutesInDay = 24 * 60;
    const normalPartPercent = (normalAphDayMinutes / totalRealMinutesInDay) * 100;
    const ah24PositionPercent = normalPartPercent; // AH 24 の位置は通常期間の終端

    // --- AH 24 インジケーターラベル ---
    const ah24Label = document.createElement('div');
    ah24Label.classList.add('dynamic-aph-axis-label');
    ah24Label.textContent = 'D_24';
    ah24Label.style.position = 'absolute';
    ah24Label.style.top = `${ah24PositionPercent}%`;
    ah24Label.style.left = `calc(100% + 5px)`; // ラベルコンテナの右外側
    ah24Label.style.transform = 'translateY(-50%)';
    ah24Label.style.color = '#d9534f'; // 赤色
    aphAxisLabelContainerElement.appendChild(ah24Label);

    // --- 水平補助線 ---
    let globalLine = aphGraphContainerElement.querySelector('.aph-start-indicator-line');
    if (!globalLine) {
        globalLine = document.createElement('div');
        globalLine.classList.add('aph-start-indicator-line');
        globalLine.style.position = 'absolute';
        globalLine.style.left = '0';
        globalLine.style.width = '100%';
        // スタイルはCSSで定義されている前提 (`aph-graph-demo.css` 内)
        // .aph-start-indicator-line { height:0; border-top: 2px solid #d9534f; z-index:5; transform: translateY(-1px); }
        aphGraphContainerElement.insertBefore(globalLine, aphGraphContainerElement.firstChild); // コンテナの最初の子として挿入
    }
    globalLine.style.top = `${ah24PositionPercent}%`;


    // --- AH 0, 6, 12, 18 のラベル ---
    const aphMilestones = [
        { aphHour: 0, text: "D__0" },
        { aphHour: 6, text: "D__6" },
        { aphHour: 12, text: "D_12" },
        { aphHour: 18, text: "D_18" },
    ];

    aphMilestones.forEach(milestone => {
        let percentTop;
        if (milestone.aphHour === 0) {
            percentTop = 0;
        } else {
            if (normalAphDayMinutes === 0) { // 通常期間が0の場合はAH 0以外のマイルストーンは表示しない
                return;
            }
            // 通常期間内での相対的な位置を計算
            const relativePositionInNormalAph = milestone.aphHour / 23; // 23時間ベースで計算
            const correspondingRealMinutes = relativePositionInNormalAph * normalAphDayMinutes;
            percentTop = (correspondingRealMinutes / totalRealMinutesInDay) * 100;

            // 通常期間のパーセンテージを超える場合は表示しない
            if (percentTop > normalPartPercent + 0.1) { // 若干の許容誤差
                return;
            }
        }

        const labelElement = document.createElement('div');
        labelElement.classList.add('dynamic-aph-axis-label');
        labelElement.textContent = milestone.text;
        labelElement.style.position = 'absolute';
        labelElement.style.top = `${percentTop}%`;
        labelElement.style.left = `calc(100% + 5px)`;
        labelElement.style.transform = 'translateY(-50%)';
        aphAxisLabelContainerElement.appendChild(labelElement);
    });
}


// ---------------------------------------------------------------------------------
// 以下は aph-graph-demo.html が単独で動作する場合の初期化処理とイベントリスナー
// モジュールとして利用する場合は、呼び出し元で同様の処理を実装します。
// ---------------------------------------------------------------------------------

/**
 * スライダーの値に基づいて、関連するテキスト表示を更新します。
 * (aph-graph-demo.html 専用の想定)
 * @param {HTMLInputElement} normalDurationSlider - 通常期間設定スライダー
 * @param {HTMLElement} normalDurationValueDisplay - 通常期間表示用要素
 * @param {HTMLElement} anotherHourDurationDisplay - APH期間表示用要素
 * @param {HTMLElement} sliderRealTimeLabel - スライダー下のリアルタイム表示用要素
 * @param {HTMLElement} sliderRealTimeIndicator - スライダー下のリアルタイムインジケーター親要素
 */
function updateDemoSliderDisplays(
    normalDurationSlider,
    normalDurationValueDisplay,
    anotherHourDurationDisplay,
    sliderRealTimeLabel,
    sliderRealTimeIndicator
) {
    if (!normalDurationSlider || !normalDurationValueDisplay || !anotherHourDurationDisplay || !sliderRealTimeLabel || !sliderRealTimeIndicator) {
        // console.warn("One or more slider display elements are missing for updateDemoSliderDisplays.");
        return;
    }
    const normalAphDayMinutes = parseInt(normalDurationSlider.value, 10);

    normalDurationValueDisplay.textContent = formatDuration(normalAphDayMinutes);

    const totalRealMinutesInDay = 24 * 60;
    const aphDurationMinutes = totalRealMinutesInDay - normalAphDayMinutes;
    anotherHourDurationDisplay.textContent = `Another Hour Duration: ${formatDuration(aphDurationMinutes)}`;

    const realTimeHourEquivalent = Math.floor(normalAphDayMinutes / 60);
    const realTimeMinuteEquivalent = normalAphDayMinutes % 60;
    sliderRealTimeLabel.textContent = `${String(realTimeHourEquivalent).padStart(2, '0')}:${String(realTimeMinuteEquivalent).padStart(2, '0')}`;

    const sliderMin = parseInt(normalDurationSlider.min, 10);
    const sliderMax = parseInt(normalDurationSlider.max, 10);
    let thumbPositionRatio = 0;
    if (sliderMax - sliderMin !== 0) {
        thumbPositionRatio = (normalAphDayMinutes - sliderMin) / (sliderMax - sliderMin);
    }

    sliderRealTimeIndicator.style.setProperty('--slider-thumb-position', `${thumbPositionRatio * 100}%`);
    normalDurationSlider.style.setProperty('--slider-progress-percent', `${thumbPositionRatio * 100}%`);
}


/**
 * APH Graph Demoページ専用の初期化関数
 */
function initializeAphGraphDemoPage() {
    // aph-graph-demo.html 内の要素への参照を取得
    const aphGraphBar = document.getElementById('aphGraphBar');
    const normalDurationSlider = document.getElementById('normal-duration-slider');
    const normalDurationValueDisplay = document.getElementById('normal-duration-value-display');
    const anotherHourDurationDisplay = document.getElementById('another-hour-duration-display');
    const sliderRealTimeLabel = document.getElementById('slider-real-time-label');
    const sliderRealTimeIndicator = document.querySelector('.slider-real-time-indicator');
    const aphAxisLabelContainer = document.querySelector('.aph-graph-container .axis-labels');
    const aphGraphContainer = document.querySelector('.aph-graph-container'); // updateAphAxisLabels で補助線の親として必要

    // 要素の存在チェック
    if (!aphGraphBar || !normalDurationSlider || !normalDurationValueDisplay || !anotherHourDurationDisplay || !sliderRealTimeLabel || !sliderRealTimeIndicator || !aphAxisLabelContainer || !aphGraphContainer) {
        console.error("One or more critical elements for APH Graph Demo page are missing.");
        return;
    }

    const initialNormalAphDayMinutes = parseInt(normalDurationSlider.value, 10);

    // 初期表示更新
    updateDemoSliderDisplays(
        normalDurationSlider,
        normalDurationValueDisplay,
        anotherHourDurationDisplay,
        sliderRealTimeLabel,
        sliderRealTimeIndicator
    );
    drawAphGraph(aphGraphBar, initialNormalAphDayMinutes);
    updateAphAxisLabels(aphAxisLabelContainer, aphGraphContainer, initialNormalAphDayMinutes);

    // イベントリスナー設定
    normalDurationSlider.addEventListener('input', (event) => {
        const currentNormalAphDayMinutes = parseInt(event.target.value, 10);
        updateDemoSliderDisplays(
            normalDurationSlider,
            normalDurationValueDisplay,
            anotherHourDurationDisplay,
            sliderRealTimeLabel,
            sliderRealTimeIndicator
        );
        drawAphGraph(aphGraphBar, currentNormalAphDayMinutes);
        updateAphAxisLabels(aphAxisLabelContainer, aphGraphContainer, currentNormalAphDayMinutes);
    });

    // ウィンドウリサイズ時の再描画（補助線のため）
    // 注意: このリサイズ処理は、Personalized AH Clockに組み込む際には不要になる可能性があります。
    // グラフのサイズがCSSで固定されているか、親要素に追従するかに依存します。
    // Personalized AH ClockのSettings画面では、グラフエリアのサイズが固定的なら不要です。
    window.addEventListener('resize', () => {
        // 既存の補助線をクリア (aphGraphContainerElement を使うように変更)
        const existingLine = aphGraphContainer.querySelector('.aph-start-indicator-line');
        if (existingLine) existingLine.remove(); // 一度削除して再作成するアプローチ

        const currentNormalAphDayMinutes = parseInt(normalDurationSlider.value, 10);
        drawAphGraph(aphGraphBar, currentNormalAphDayMinutes);
        updateAphAxisLabels(aphAxisLabelContainer, aphGraphContainer, currentNormalAphDayMinutes);
    });
    // console.log("APH Graph Demo page event listeners initialized.");
}

// aph-graph-demo.html で直接このスクリプトが読み込まれた場合にのみ初期化処理を実行
// 他のJSファイルからモジュールとしてインポートされた場合は実行しない
if (document.getElementById('aphGraphBar') && document.getElementById('normal-duration-slider')) {
    // DOMContentLoaded を待って実行するのがより安全
    document.addEventListener('DOMContentLoaded', initializeAphGraphDemoPage);
}