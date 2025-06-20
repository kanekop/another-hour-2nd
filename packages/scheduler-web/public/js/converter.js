import { SCALE_AH } from '/js/clock-core.js';

function convertToAH() {
    const hours = parseInt(document.getElementById('real-hours').value) || 0;
    const minutes = parseInt(document.getElementById('real-minutes').value) || 0;
    const seconds = parseInt(document.getElementById('real-seconds').value) || 0;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const ahTotalSeconds = totalSeconds * SCALE_AH;

    const ahHours = Math.floor(ahTotalSeconds / 3600);
    const ahMinutes = Math.floor((ahTotalSeconds % 3600) / 60);
    const ahSeconds = Math.floor(ahTotalSeconds % 60);

    document.getElementById('ah-result').textContent =
        `AH Time: ${String(ahHours).padStart(2, '0')}:${String(ahMinutes).padStart(2, '0')}:${String(ahSeconds).padStart(2, '0')}`;
}

function convertToReal() {
    const hours = parseInt(document.getElementById('ah-hours').value) || 0;
    const minutes = parseInt(document.getElementById('ah-minutes').value) || 0;
    const seconds = parseInt(document.getElementById('ah-seconds').value) || 0;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const realTotalSeconds = totalSeconds / SCALE_AH;

    const realHours = Math.floor(realTotalSeconds / 3600);
    const realMinutes = Math.floor((realTotalSeconds % 3600) / 60);
    const realSeconds = Math.floor(realTotalSeconds % 60);

    document.getElementById('real-result').textContent =
        `Real Time: ${String(realHours).padStart(2, '0')}:${String(realMinutes).padStart(2, '0')}:${String(realSeconds).padStart(2, '0')}`;
}

document.getElementById('convert-to-ah-btn').addEventListener('click', convertToAH);
document.getElementById('convert-to-real-btn').addEventListener('click', convertToReal); 