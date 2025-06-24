import { BaseMode } from './BaseMode.js';

export class WakeBasedMode extends BaseMode {
    private wakeTime: number;
    private anotherHourDuration: number;
    private maxScaleFactor: number;
    private todayWakeTime: string | null;
    private defaultWakeTime: string;

    constructor(config: any) {
        super(config);
        // 仕様書に従い、defaultWakeTime と todayWakeTime を適切に処理
        this.defaultWakeTime = config.parameters?.defaultWakeTime || '07:00';
        this.todayWakeTime = config.parameters?.todayWakeTime || null;
        
        // 実際の起床時刻を使用（todayWakeTime が設定されていればそれを優先）
        const effectiveWakeTime = this.todayWakeTime || this.defaultWakeTime;
        this.wakeTime = this.convertTimeStrToMinutes(effectiveWakeTime);
        
        this.anotherHourDuration = config.parameters?.anotherHourDuration || 60;
        this.maxScaleFactor = config.parameters?.maxScaleFactor || 3.0;
    }

    private convertTimeStrToMinutes(timeStr: string): number {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * 現在時刻を深夜0時からの分数に変換
     */
    private getMinutesSinceMidnight(date: Date): number {
        return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
    }

    /**
     * セグメント構築
     */
    private buildSegments() {
        const wakeTimeMinutes = this.wakeTime;
        const ahDuration = this.anotherHourDuration;

        // Total available time from wake-up to midnight.
        const totalActivityMinutes = 1440 - wakeTimeMinutes;

        // The real-time duration available for the "Designed" period.
        const designedRealDuration = totalActivityMinutes - ahDuration;

        if (designedRealDuration <= 0) return [];

        // The scale factor compresses the totalActivityMinutes into the designedRealDuration.
        const scaleFactor = totalActivityMinutes / designedRealDuration;

        const anotherHourStart = 1440 - ahDuration;

        const segments = [
            {
                type: 'another',
                startTime: 0,
                endTime: wakeTimeMinutes,
                duration: wakeTimeMinutes,
                scaleFactor: 1.0,
                label: 'Night'
            },
            {
                type: 'designed',
                startTime: wakeTimeMinutes,
                endTime: anotherHourStart,
                duration: designedRealDuration,
                scaleFactor: scaleFactor,
                label: 'Designed Day'
            },
            {
                type: 'another',
                startTime: anotherHourStart,
                endTime: 1440,
                duration: ahDuration,
                scaleFactor: 1.0,
                label: 'Another Hour'
            }
        ];

        return segments.filter(s => s.duration > 0);
    }

    /**
     * アクティブセグメントを見つける
     */
    private findActiveSegment(currentMinutes: number) {
        const segments = this.buildSegments();
        return segments.find(segment =>
            currentMinutes >= segment.startTime && currentMinutes < segment.endTime
        );
    }

    /**
     * 進行状況を計算
     */
    private calculateProgress(currentMinutes: number, segment: any) {
        if (!segment) return { progress: 0, remaining: 0, duration: 0 };

        const elapsed = currentMinutes - segment.startTime;
        const progress = (elapsed / segment.duration);
        const remaining = segment.duration - elapsed;

        return {
            progress: Math.max(0, Math.min(1, progress)),
            remaining: Math.max(0, remaining),
            duration: segment.duration
        };
    }


    /**
     * 現在のフェーズ（期間）を取得
     * @param {Date} currentTime - 現在時刻
     * @returns {Object} { name: string, progress: number }
     */
    getCurrentPhase(currentTime: Date): { name: 'Night' | 'Designed Day' | 'Another Hour'; progress: number; } {
        const realMinutes = this.getMinutesSinceMidnight(currentTime);
        const activeSegment = this.findActiveSegment(realMinutes);
        
        if (!activeSegment) {
            return { name: 'Night', progress: 0 };
        }

        const { progress } = this.calculateProgress(realMinutes, activeSegment);
        
        return {
            name: activeSegment.label as 'Night' | 'Designed Day' | 'Another Hour',
            progress
        };
    }



    /**
     * WakeBasedMode用の計算ロジック（JavaScript版互換）
     */
    calculate(date: Date, timezone?: string): any {
        const realMinutes = this.getMinutesSinceMidnight(date);
        const segments = this.buildSegments();
        const activeSegment = this.findActiveSegment(realMinutes);
        const wakeTimeMinutes = this.wakeTime;

        if (!activeSegment) {
            return {
                hours: date.getHours(),
                minutes: date.getMinutes(),
                seconds: date.getSeconds(),
                scaleFactor: 1,
                isAnotherHour: true,
                segmentInfo: { type: 'another', label: 'Error' }
            };
        }

        let displayHours: number, displayMinutes: number, displaySeconds: number;
        const { progress, remaining, duration } = this.calculateProgress(realMinutes, activeSegment);

        if (activeSegment.type === 'another') {
            // Another Hour期間の経過時間を計算（0から開始）
            const segmentElapsed = realMinutes - activeSegment.startTime;
            
            // 0時起点の時間として計算
            displayHours = Math.floor(segmentElapsed / 60);
            displayMinutes = Math.floor(segmentElapsed % 60);
            displaySeconds = Math.floor((segmentElapsed * 60) % 60);
        } else { // 'designed'
            // Elapsed real time since wake-up.
            const elapsedRealMinutesInPeriod = realMinutes - wakeTimeMinutes;
            // The scaled elapsed time since wake-up (starts from 0).
            const scaledElapsedMinutes = elapsedRealMinutesInPeriod * activeSegment.scaleFactor;
            const scaledElapsedSeconds = scaledElapsedMinutes * 60 + date.getSeconds() * activeSegment.scaleFactor;

            // The display time is the wake time offset by the scaled elapsed time.
            const wakeTimeSeconds = wakeTimeMinutes * 60;
            const displayTotalSeconds = wakeTimeSeconds + scaledElapsedSeconds;

            displayHours = Math.floor(displayTotalSeconds / 3600) % 24;
            displayMinutes = Math.floor((displayTotalSeconds % 3600) / 60);
            displaySeconds = Math.floor(displayTotalSeconds % 60);
        }

        const totalActivityMinutes = 1440 - wakeTimeMinutes;
        const segmentDuration = activeSegment.label === 'Designed Day' ? totalActivityMinutes : activeSegment.duration;

        // Another Hour用の追加情報を計算
        const segmentElapsed = activeSegment.type === 'another' ? realMinutes - activeSegment.startTime : undefined;
        
        return {
            hours: displayHours,
            minutes: displayMinutes,
            seconds: displaySeconds,
            scaleFactor: activeSegment.scaleFactor,
            isAnotherHour: activeSegment.type === 'another',
            segmentInfo: {
                type: activeSegment.type,
                label: activeSegment.label,
                progress,
                remaining,
                duration: segmentDuration,
                // Another Hour用の追加情報
                elapsed: segmentElapsed,
                total: activeSegment.type === 'another' ? activeSegment.duration : undefined,
                displayFormat: activeSegment.type === 'another' ? 'fraction' : 'normal'
            },
            periodName: activeSegment.label,
        };
    }

    /**
     * タイムライン用のセグメント情報を取得
     */
    getSegments() {
        const segments = this.buildSegments();

        return segments.map(segment => ({
            type: segment.type,
            label: segment.label,
            shortLabel: segment.type === 'designed' ? 'Day' : segment.label === 'Night' ? 'Night' : 'AH',
            startMinutes: segment.startTime,
            durationMinutes: segment.duration,
            scaleFactor: segment.scaleFactor
        }));
    }

    /**
     * UI設定フォーム用のデータを取得
     */
    getConfigUI() {
        return {
            defaultWakeTime: this.defaultWakeTime,
            todayWakeTime: this.todayWakeTime,
            anotherHourDuration: this.anotherHourDuration,
            maxScaleFactor: this.maxScaleFactor,
            summary: {
                wakeTime: this.wakeTime,
                totalActivity: 1440 - this.wakeTime,
                designedDuration: (1440 - this.wakeTime) - this.anotherHourDuration,
                scaleFactor: (1440 - this.wakeTime) / ((1440 - this.wakeTime) - this.anotherHourDuration)
            }
        };
    }

    /**
     * UI設定フォームからデータを収集
     */
    collectConfigFromUI() {
        return {
            defaultWakeTime: this.defaultWakeTime,
            todayWakeTime: this.todayWakeTime,
            anotherHourDuration: this.anotherHourDuration,
            maxScaleFactor: this.maxScaleFactor
        };
    }

    /**
     * 設定の検証
     */
    validateConfig() {
        super.validateConfig();

        if (this.anotherHourDuration < 0 || this.anotherHourDuration > 720) {
            throw new Error('Another Hour duration must be between 0 and 720 minutes');
        }

        if (this.maxScaleFactor < 1.0 || this.maxScaleFactor > 5.0) {
            throw new Error('Max scale factor must be between 1.0 and 5.0');
        }

        const activityMinutes = 1440 - this.wakeTime;
        if (this.anotherHourDuration >= activityMinutes) {
            throw new Error('Another Hour duration must be less than the total activity time');
        }
    }

    getCurrentPhaseOld(currentTime: Date): { name: 'Night' | 'Designed Day' | 'Another Hour'; progress: number; } {
        const realMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const anotherHourStart = 1440 - this.anotherHourDuration;

        if (realMinutes < this.wakeTime) {
            const nightDuration = this.wakeTime;
            const elapsed = realMinutes;
            return { name: 'Night', progress: nightDuration > 0 ? elapsed / nightDuration : 1 };
        } else if (realMinutes >= anotherHourStart) {
            const elapsed = realMinutes - anotherHourStart;
            return { name: 'Another Hour', progress: this.anotherHourDuration > 0 ? elapsed / this.anotherHourDuration : 1 };
        } else {
            const designedDayDuration = anotherHourStart - this.wakeTime;
            const elapsed = realMinutes - this.wakeTime;
            return { name: 'Designed Day', progress: designedDayDuration > 0 ? elapsed / designedDayDuration : 1 };
        }
    }

    calculateScaleFactor(currentTime: Date): number {
        const phase = this.getCurrentPhase(currentTime);
        if (phase.name !== 'Designed Day') {
            return 1.0;
        }

        const totalActivityMinutes = 1440 - this.wakeTime;
        const designedRealDuration = totalActivityMinutes - this.anotherHourDuration;

        if (designedRealDuration <= 0) {
            return 1.0; // Avoid division by zero or negative duration
        }

        const scaleFactor = totalActivityMinutes / designedRealDuration;

        return Math.min(scaleFactor, this.maxScaleFactor);
    }

    calculateAnotherHourTime(realTime: Date): Date {
        const realMinutes = realTime.getHours() * 60 + realTime.getMinutes() + realTime.getSeconds() / 60;
        const phase = this.getCurrentPhase(realTime);
        const scaleFactor = this.calculateScaleFactor(realTime);

        let ahTotalMinutes;
        const anotherHourStart = 1440 - this.anotherHourDuration;

        if (phase.name === 'Night') {
            // Unscaled, time is represented as real time.
            ahTotalMinutes = realMinutes;
        } else if (phase.name === 'Designed Day') {
            const elapsedRealMinutesInDay = realMinutes - this.wakeTime;
            const scaledElapsedMinutes = elapsedRealMinutesInDay * scaleFactor;
            ahTotalMinutes = this.wakeTime + scaledElapsedMinutes;
        } else { // Another Hour
            const designedDayRealDuration = anotherHourStart - this.wakeTime;
            const designedDayAHDuration = designedDayRealDuration * this.calculateScaleFactor(new Date(realTime.getTime() - this.anotherHourDuration * 60 * 1000)); // use a time within the designed day

            const elapsedInAnotherHour = realMinutes - anotherHourStart;
            ahTotalMinutes = this.wakeTime + designedDayAHDuration + elapsedInAnotherHour;
        }

        const ahTime = new Date(realTime);
        const totalHours = Math.floor(ahTotalMinutes / 60);
        ahTime.setHours(totalHours);
        ahTime.setMinutes(Math.floor(ahTotalMinutes % 60));
        ahTime.setSeconds(Math.floor((ahTotalMinutes * 60) % 60));

        // Normalize to a 24-hour clock for final output
        const normalizedHours = ahTime.getHours() % 24;
        ahTime.setHours(normalizedHours);

        return ahTime;
    }

    convertToRealTime(anotherHourTime: Date): Date {
        // Since ahTime can be > 24h, we cannot just use getHours().
        // We need to calculate total minutes from a known point.
        // Let's assume anotherHourTime is a date object where the time part is the AH time.
        const ahTotalMinutes = anotherHourTime.getHours() * 60 + anotherHourTime.getMinutes() + anotherHourTime.getSeconds() / 60;

        const tempDate = new Date(); // a throwaway date to get a scale factor
        const anotherHourStart = 1440 - this.anotherHourDuration;
        const middleOfDesignedDay = this.wakeTime + (anotherHourStart - this.wakeTime) / 2;
        tempDate.setHours(Math.floor(middleOfDesignedDay / 60), middleOfDesignedDay % 60, 0, 0);
        const scaleFactor = this.calculateScaleFactor(tempDate);

        if (scaleFactor === 0) return anotherHourTime; // Avoid division by zero

        const designedDayRealDuration = anotherHourStart - this.wakeTime;
        const designedDayAHDuration = designedDayRealDuration * scaleFactor;
        const ahDesignedDayEnd = this.wakeTime + designedDayAHDuration;

        let realMinutes;

        // This logic needs to correctly invert the calculateAnotherHourTime logic.
        // Let's analyze the forward calculation's `ahTotalMinutes`
        if (ahTotalMinutes < this.wakeTime) { // Night segment
            realMinutes = ahTotalMinutes;
        } else if (ahTotalMinutes < ahDesignedDayEnd) { // Designed Day
            const elapsedAHInDay = ahTotalMinutes - this.wakeTime;
            const elapsedRealInDay = elapsedAHInDay / scaleFactor;
            realMinutes = this.wakeTime + elapsedRealInDay;
        } else { // Another Hour
            const elapsedInAnotherHourSegment_AH = ahTotalMinutes - ahDesignedDayEnd;
            realMinutes = anotherHourStart + elapsedInAnotherHourSegment_AH;
        }

        const realTime = new Date(anotherHourTime);
        realTime.setHours(Math.floor(realMinutes / 60), Math.floor(realMinutes % 60), Math.floor((realMinutes * 60) % 60));
        return realTime;
    }

    getDebugInfo(currentTime: Date): Record<string, any> {
        const phase = this.getCurrentPhase(currentTime);
        const scaleFactor = this.calculateScaleFactor(currentTime);

        return {
            mode: this.config.mode,
            config: this.exportConfig(),
            name: this.config.name,

            // 仕様書に従った詳細な起床時刻情報
            defaultWakeTime: this.defaultWakeTime,
            todayWakeTime: this.todayWakeTime,
            effectiveWakeTime: this.todayWakeTime || this.defaultWakeTime,
            
            anotherHourDuration: this.anotherHourDuration,
            maxScaleFactor: this.maxScaleFactor,

            calculatedScaleFactor: scaleFactor,
            currentPhase: phase,

            ahTime: this.calculateAnotherHourTime(currentTime),
            realTime: currentTime
        };
    }
}
