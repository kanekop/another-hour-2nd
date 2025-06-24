import { BaseMode } from './BaseMode';

/**
 * 起床時間と睡眠時間を基準に一日を設計する
 */
export class WakeBasedMode extends BaseMode {
    static modeId = 'wake-based';
    static modeName = 'Wake-based';
    static description = 'Scales your active hours based on when you wake up and how long you are active.';

    static defaultParameters = {
        wakeTime: '07:00',
        activityDurationHours: 16,
    };

    private wakeTime: number; // in minutes from midnight
    private activityDuration: number; // in minutes

    constructor(config: any) {
        super(config);
        const params = { ...WakeBasedMode.defaultParameters, ...config.parameters };
        this.wakeTime = this.parseTime(params.wakeTime);
        this.activityDuration = params.activityDurationHours * 60;
        this.validateParameters();
    }

    private validateParameters() {
        if (this.activityDuration < 60 || this.activityDuration > 1440) {
            throw new Error('Activity Duration must be between 1 and 24 hours.');
        }
    }

    private parseTime(timeStr: string): number {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    getCurrentPhase(currentTime: Date): { name: 'Activity Period' | 'Another Hour'; progress: number; } {
        const realMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const activityEnd = (this.wakeTime + this.activityDuration) % 1440;

        const inActivityPeriod = this.wakeTime < activityEnd
            ? (realMinutes >= this.wakeTime && realMinutes < activityEnd)
            : (realMinutes >= this.wakeTime || realMinutes < activityEnd);

        if (inActivityPeriod) {
            const elapsed = (realMinutes - this.wakeTime + 1440) % 1440;
            return { name: 'Activity Period', progress: elapsed / this.activityDuration };
        } else {
            const anotherHourStart = activityEnd;
            const anotherHourDuration = 1440 - this.activityDuration;
            const elapsed = (realMinutes - anotherHourStart + 1440) % 1440;
            return { name: 'Another Hour', progress: elapsed / anotherHourDuration };
        }
    }

    calculateScaleFactor(currentTime: Date): number {
        const phase = this.getCurrentPhase(currentTime);
        if (phase.name === 'Activity Period') {
            const targetDuration = 24 * 60 - (1440 - this.activityDuration); // Should be 24h - another hour
            return targetDuration / this.activityDuration;
        }
        return 1.0;
    }

    calculateAnotherHourTime(realTime: Date): Date {
        const phase = this.getCurrentPhase(realTime);
        const scaleFactor = this.calculateScaleFactor(realTime);

        let ahTotalMinutes;

        if (phase.name === 'Activity Period') {
            const elapsedInActivity = (realTime.getHours() * 60 + realTime.getMinutes() - this.wakeTime + 1440) % 1440;
            const scaledElapsed = elapsedInActivity * scaleFactor;
            ahTotalMinutes = (this.wakeTime + scaledElapsed) % 1440;
        } else { // Another Hour
            const activityAHDuration = this.activityDuration * scaleFactor;
            const anotherHourStartReal = (this.wakeTime + this.activityDuration) % 1440;
            const elapsedInAnotherHour = (realTime.getHours() * 60 + realTime.getMinutes() - anotherHourStartReal + 1440) % 1440;

            ahTotalMinutes = (this.wakeTime + activityAHDuration + elapsedInAnotherHour) % 1440;
        }

        const ahTime = new Date(0);
        ahTime.setUTCMinutes(ahTotalMinutes);
        return ahTime;
    }

    convertToRealTime(anotherHourTime: Date): Date {
        // Not essential for the UI, providing a simple passthrough
        return anotherHourTime;
    }

    getDebugInfo(currentTime: Date): object {
        return {
            ...super.getDebugInfo(currentTime),
            wakeTime: this.formatTime(this.wakeTime),
            activityDurationHours: this.activityDuration / 60,
            phase: this.getCurrentPhase(currentTime),
            scaleFactor: this.calculateScaleFactor(currentTime),
        };
    }

    getTimelineSegments() {
        const startPercent = (this.wakeTime / 1440) * 100;
        const endPercent = ((this.wakeTime + this.activityDuration) % 1440) / 1440 * 100;

        if (startPercent < endPercent) {
            return [
                { name: 'Another Hour', start: 0, end: startPercent, color: '#95A5A6', label: 'Another Hour' },
                { name: 'Activity Period', start: startPercent, end: endPercent, color: '#3498DB', gradient: 'linear-gradient(to right, #2980B9, #3498DB)', label: 'Activity' },
                { name: 'Another Hour', start: endPercent, end: 100, color: '#95A5A6', label: 'Another Hour' },
            ];
        } else {
            return [
                { name: 'Activity Period', start: 0, end: endPercent, color: '#3498DB', gradient: 'linear-gradient(to right, #2980B9, #3498DB)', label: 'Activity' },
                { name: 'Another Hour', start: endPercent, end: startPercent, color: '#95A5A6', label: 'Another Hour' },
                { name: 'Activity Period', start: startPercent, end: 100, color: '#3498DB', gradient: 'linear-gradient(to right, #2980B9, #3498DB)', label: 'Activity' },
            ];
        }
    }

    static getConfigSchema() {
        return {
            wakeTime: {
                type: 'time',
                label: 'Wake Time',
                default: this.defaultParameters.wakeTime,
            },
            activityDurationHours: {
                type: 'slider',
                label: 'Activity Duration',
                min: 1,
                max: 23,
                step: 0.5,
                default: this.defaultParameters.activityDurationHours,
                unit: 'h'
            }
        };
    }

    exportConfig() {
        return {
            ...super.exportConfig(),
            parameters: {
                wakeTime: this.formatTime(this.wakeTime),
                activityDurationHours: this.activityDuration / 60
            }
        };
    }

    private formatTime(minutes: number): string {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    }
}
