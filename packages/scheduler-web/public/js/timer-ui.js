// public/js/timer-ui.js
import { convertToScaledMs, convertFromScaledMs } from './ah-time.js';
import { getCurrentScalingInfo } from './scaling-utils.js';

const display = document.querySelector('.timer-display');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const resetBtn = document.getElementById('reset');
const hoursInput = document.getElementById('hours');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');

let targetRealTime = 0;
let animationFrameId = null;
let remainingScaledMsAtPause = 0;

function formatDisplayTime(scaledMs) {
  if (scaledMs < 0) scaledMs = 0;
  const totalSeconds = Math.floor(scaledMs / 1000);
  const s = String(totalSeconds % 60).padStart(2, '0');
  const m = String(Math.floor(totalSeconds / 60) % 60).padStart(2, '0');
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  display.textContent = `${h}:${m}:${s}`;
}

function update() {
  const now = Date.now();
  const realMsRemaining = Math.max(0, targetRealTime - now);

  if (realMsRemaining <= 0) {
    formatDisplayTime(0);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    alert('Time is up!');
    return;
  }

  const { scaleFactor } = getCurrentScalingInfo();
  const scaledMsRemaining = convertToScaledMs(realMsRemaining, scaleFactor);
  formatDisplayTime(scaledMsRemaining);
  remainingScaledMsAtPause = scaledMsRemaining;

  animationFrameId = requestAnimationFrame(update);
}

function startTimer() {
  if (animationFrameId) return;

  let initialScaledDurationMs;

  if (targetRealTime > 0 && remainingScaledMsAtPause > 0) {
    initialScaledDurationMs = remainingScaledMsAtPause;
  } else {
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    if (hours === 0 && minutes === 0 && seconds === 0) {
      formatDisplayTime(0);
      return;
    }
    initialScaledDurationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  if (initialScaledDurationMs <= 0) {
      formatDisplayTime(0);
      return;
  }

  const { scaleFactor: startScaleFactor } = getCurrentScalingInfo();
  const realDurationMs = convertFromScaledMs(initialScaledDurationMs, startScaleFactor);
  targetRealTime = Date.now() + realDurationMs;

  formatDisplayTime(initialScaledDurationMs);
  remainingScaledMsAtPause = initialScaledDurationMs;

  animationFrameId = requestAnimationFrame(update);
}

startBtn.addEventListener('click', startTimer);

stopBtn.addEventListener('click', () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
});

resetBtn.addEventListener('click', () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  targetRealTime = 0;
  remainingScaledMsAtPause = 0;
  hoursInput.value = '';
  minutesInput.value = '';
  secondsInput.value = '';
  formatDisplayTime(0);
});

// 初期表示
formatDisplayTime(0);