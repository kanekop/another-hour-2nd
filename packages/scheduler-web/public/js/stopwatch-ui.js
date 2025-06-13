// public/js/stopwatch-ui.js
import { convertToScaledMs } from './ah-time.js';
import { getCurrentScalingInfo } from './scaling-utils.js';

const display = document.querySelector('.stopwatch-display');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const resetBtn = document.getElementById('reset');

let startTime = null;
let pausedTime = 0;
let animationFrameId = null;
let accumulatedPausedTime = 0;

function formatDisplayTime(scaledMs) {
  const totalHundredths = Math.floor(scaledMs / 10);
  const hundredths = String(totalHundredths % 100).padStart(2, '0');

  const totalSeconds = Math.floor(scaledMs / 1000);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const minutes = String(Math.floor(totalSeconds / 60) % 60).padStart(2, '0');
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');

  display.textContent = `${hours}:${minutes}:${seconds}.${hundredths.substring(0,1)}`;
}

function update() {
  if (startTime) {
    const realElapsed = Date.now() - startTime;
    const { scaleFactor } = getCurrentScalingInfo();
    const scaledElapsed = convertToScaledMs(realElapsed, scaleFactor);
    formatDisplayTime(scaledElapsed);
  }
  animationFrameId = requestAnimationFrame(update);
}

startBtn.addEventListener('click', () => {
  if (!startTime) {
    startTime = Date.now() - accumulatedPausedTime;
    accumulatedPausedTime = 0;
  } else if (animationFrameId === null) {
     startTime = Date.now() - accumulatedPausedTime;
  }

  if(animationFrameId) {
    return;
  }
  animationFrameId = requestAnimationFrame(update);
});

stopBtn.addEventListener('click', () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    if(startTime) {
        accumulatedPausedTime = Date.now() - startTime;
    }
  }
});

resetBtn.addEventListener('click', () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  startTime = null;
  accumulatedPausedTime = 0;
  formatDisplayTime(0);
});

// 初期表示
formatDisplayTime(0);