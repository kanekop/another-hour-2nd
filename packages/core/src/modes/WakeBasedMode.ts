import { BaseMode } from './BaseMode.js';

export class WakeBasedMode extends BaseMode {
    private wakeTime: number;
    private anotherHourDuration: number;
    private maxScaleFactor: number;
    private todayWakeTime: string | null;
    private defaultWakeTime: string;

    constructor(config: any) {
        super(config);
        this.wakeTime = this.convertTimeStrToMinutes(config.parameters?.wakeTime || '07:00');
        this.anotherHourDuration = config.parameters?.anotherHourDuration || 60;
        this.maxScaleFactor = config.parameters?.maxScaleFactor || 3.0;
        this.todayWakeTime = null;
        this.defaultWakeTime = config.parameters?.defaultWakeTime || '07:00';
    }

    private convertTimeStrToMinutes(timeStr: string): number {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    getCurrentPhase(currentTime: Date): { name: 'Night' | 'Designed Day' | 'Another Hour'; progress: number; } {
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

            wakeTimeString: this.todayWakeTime || this.defaultWakeTime,
            anotherHourDuration: this.anotherHourDuration,
            maxScaleFactor: this.maxScaleFactor,

            calculatedScaleFactor: scaleFactor,
            currentPhase: phase,

            ahTime: this.calculateAnotherHourTime(currentTime),
            realTime: currentTime
        };
    }
}
