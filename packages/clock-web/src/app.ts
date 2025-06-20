import * as AnotherHour from '@another-hour/core';
import { ClockSettings } from './clock-settings';
import { ClockUIElements } from './types';

// 時計のUI更新クラス
class ClockUpdater {
    private settings: ClockSettings;
    private elements: ClockUIElements;
    private animationFrameId: number | null = null;

    constructor(settings: ClockSettings) {
        this.settings = settings;

        // DOM要素の取得と型アサーション
        this.elements = {
            hourHand: document.getElementById('hour-hand') as SVGLineElement,
            minuteHand: document.getElementById('minute-hand') as SVGLineElement,
            secondHand: document.getElementById('second-hand') as SVGLineElement,
            ahTime: document.getElementById('ah-time') as HTMLElement,
            realTime: document.getElementById('real-time') as HTMLElement,
            phaseName: document.getElementById('phase-name') as HTMLElement,
            body: document.body as HTMLBodyElement,
        };
    }

    public start(): void {
        if (this.animationFrameId === null) {
            this.update();
        }
    }

    public stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private update(): void {
        const now = new Date();
        const config = this.settings.getSettings();
        const d24StartTime = this.settings.getD24StartTime();

        const angles = AnotherHour.getCustomAhAngles(now, config.duration, d24StartTime);
        const ahTime = AnotherHour.convertToAHTime(now, config.duration, d24StartTime);
        const inD24 = AnotherHour.isInDesigned24(now, config.duration, d24StartTime);

        this.updateAnalogClock(angles, now);
        this.updateDigitalDisplay(ahTime, now);
        this.updatePhase(inD24);

        this.animationFrameId = requestAnimationFrame(() => this.update());
    }

    private updateAnalogClock(angles: AnotherHour.ClockAngles, realTime: Date): void {
        const { hourHand, minuteHand, secondHand } = this.elements;

        hourHand.style.transform = `rotate(${angles.hourAngle}deg)`;
        minuteHand.style.transform = `rotate(${angles.minuteAngle}deg)`;

        const secondAngle = (realTime.getSeconds() * 6) + (realTime.getMilliseconds() * 0.006);
        secondHand.style.transform = `rotate(${secondAngle}deg)`;
    }

    private updateDigitalDisplay(ahTime: AnotherHour.AHTime, realTime: Date): void {
        const { ahTime: ahTimeEl, realTime: realTimeEl } = this.elements;

        const ahHours = String(ahTime.hours).padStart(2, '0');
        const ahMinutes = String(ahTime.minutes).padStart(2, '0');
        const ahSeconds = String(realTime.getSeconds()).padStart(2, '0');
        ahTimeEl.textContent = `${ahHours}:${ahMinutes}:${ahSeconds}`;

        const realHours = String(realTime.getHours()).padStart(2, '0');
        const realMinutes = String(realTime.getMinutes()).padStart(2, '0');
        const realSeconds = String(realTime.getSeconds()).padStart(2, '0');
        realTimeEl.textContent = `Real: ${realHours}:${realMinutes}:${realSeconds}`;
    }

    private updatePhase(inD24: boolean): void {
        const { phaseName, body } = this.elements;

        if (inD24) {
            phaseName.textContent = 'Designed 24';
            body.classList.remove('another-hour-phase');
        } else {
            phaseName.textContent = 'Another Hour';
            body.classList.add('another-hour-phase');
        }
    }
}

// 設定モーダルの管理
class SettingsModal {
    private settings: ClockSettings;
    private modal: HTMLElement;

    constructor(settings: ClockSettings) {
        this.settings = settings;
        this.modal = document.getElementById('settings-modal') as HTMLElement;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
        const saveBtn = document.getElementById('save-settings') as HTMLButtonElement;
        const cancelBtn = document.getElementById('cancel-settings') as HTMLButtonElement;

        settingsBtn.addEventListener('click', () => this.open());
        saveBtn.addEventListener('click', () => this.save());
        cancelBtn.addEventListener('click', () => this.close());

        this.modal.addEventListener('click', (e: MouseEvent) => {
            if (e.target === this.modal) this.close();
        });
    }

    private open(): void {
        const config = this.settings.getSettings();
        const durationInput = document.getElementById('duration-input') as HTMLInputElement;
        const startHourInput = document.getElementById('start-hour-input') as HTMLInputElement;

        durationInput.value = config.duration.toString();
        startHourInput.value = config.startHour.toString();

        this.modal.classList.remove('hidden');
    }

    private close(): void {
        this.modal.classList.add('hidden');
    }

    private save(): void {
        const durationInput = document.getElementById('duration-input') as HTMLInputElement;
        const startHourInput = document.getElementById('start-hour-input') as HTMLInputElement;

        const duration = parseInt(durationInput.value);
        const startHour = parseInt(startHourInput.value);

        if (duration >= 1 && duration <= 23 && startHour >= 0 && startHour <= 23) {
            this.settings.save({ duration, startHour });
            this.close();
        }
    }
}

// アプリケーションの初期化
function initializeApp(): void {
    drawClockTicks();

    const settings = new ClockSettings();
    const clockUpdater = new ClockUpdater(settings);
    new SettingsModal(settings);

    clockUpdater.start();
}

function drawClockTicks(): void {
    const ticksGroup = document.getElementById('clock-ticks') as SVGGElement;
    if (!ticksGroup) return;

    for (let i = 0; i < 12; i++) {
        const angle = (i * 30) - 90;
        const length = 10;
        const x1 = 100 + 85 * Math.cos(angle * Math.PI / 180);
        const y1 = 100 + 85 * Math.sin(angle * Math.PI / 180);
        const x2 = 100 + (95 - length) * Math.cos(angle * Math.PI / 180);
        const y2 = 100 + (95 - length) * Math.sin(angle * Math.PI / 180);

        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', x1.toString());
        tick.setAttribute('y1', y1.toString());
        tick.setAttribute('x2', x2.toString());
        tick.setAttribute('y2', y2.toString());
        tick.setAttribute('class', 'clock-tick');
        ticksGroup.appendChild(tick);
    }
}

// DOMContentLoaded後に初期化
document.addEventListener('DOMContentLoaded', initializeApp); 