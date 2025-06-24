import { AnotherHour } from '@another-hour/core';

class WatchApp {
    private anotherHour: AnotherHour;
    private updateInterval: number | null = null;
    private displayMode: 'analog' | 'digital' = 'digital';

    constructor() {
        this.anotherHour = new AnotherHour();
        this.init();
    }

    private init(): void {
        // DOM要素の取得
        const timeDisplay = document.getElementById('time-display');
        const dateDisplay = document.getElementById('date-display');
        const modeToggle = document.getElementById('mode-toggle');
        const fullscreenBtn = document.getElementById('fullscreen-btn');

        if (!timeDisplay || !dateDisplay) {
            console.error('Required DOM elements not found');
            return;
        }

        // イベントリスナーの設定
        modeToggle?.addEventListener('click', () => this.toggleDisplayMode());
        fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

        // スワイプジェスチャーの設定
        this.setupSwipeGestures();

        // 時間の更新を開始
        this.startTimeUpdate();

        // 画面の向きの変更を検知
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
    }

    private startTimeUpdate(): void {
        const updateTime = () => {
            const now = new Date();
            const anotherHourTime = this.anotherHour.getCurrentAnotherHour();

            // 時間の表示を更新
            const timeDisplay = document.getElementById('time-display');
            const dateDisplay = document.getElementById('date-display');
            const anotherHourDisplay = document.getElementById('another-hour-display');

            if (timeDisplay) {
                if (this.displayMode === 'digital') {
                    timeDisplay.textContent = now.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                } else {
                    this.updateAnalogClock(now);
                }
            }

            if (dateDisplay) {
                dateDisplay.textContent = now.toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                });
            }

            if (anotherHourDisplay) {
                anotherHourDisplay.textContent = `Another Hour: ${anotherHourTime.hour}:${String(anotherHourTime.minute).padStart(2, '0')}`;
            }
        };

        // 初回更新
        updateTime();

        // 1秒ごとに更新
        this.updateInterval = window.setInterval(updateTime, 1000);
    }

    private updateAnalogClock(date: Date): void {
        const hourHand = document.getElementById('hour-hand');
        const minuteHand = document.getElementById('minute-hand');
        const secondHand = document.getElementById('second-hand');

        if (!hourHand || !minuteHand || !secondHand) return;

        const hours = date.getHours() % 12;
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        const hourDegrees = (hours * 30) + (minutes * 0.5);
        const minuteDegrees = minutes * 6;
        const secondDegrees = seconds * 6;

        hourHand.style.transform = `rotate(${hourDegrees}deg)`;
        minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
        secondHand.style.transform = `rotate(${secondDegrees}deg)`;
    }

    private toggleDisplayMode(): void {
        this.displayMode = this.displayMode === 'digital' ? 'analog' : 'digital';

        const digitalDisplay = document.getElementById('digital-display');
        const analogDisplay = document.getElementById('analog-display');

        if (digitalDisplay && analogDisplay) {
            if (this.displayMode === 'digital') {
                digitalDisplay.style.display = 'block';
                analogDisplay.style.display = 'none';
            } else {
                digitalDisplay.style.display = 'none';
                analogDisplay.style.display = 'block';
            }
        }
    }

    private toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    private setupSwipeGestures(): void {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // 横スワイプで表示モード切替
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                this.toggleDisplayMode();
            }
        });
    }

    private handleOrientationChange(): void {
        // 画面の向きに応じてレイアウトを調整
        const orientation = window.orientation;
        document.body.classList.toggle('landscape', orientation === 90 || orientation === -90);
    }

    public destroy(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new WatchApp();
}); 