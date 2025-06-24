import { ClockSettingsData } from './types';

export class ClockSettings {
    private settings: ClockSettingsData;

    constructor() {
        this.settings = {
            duration: parseInt(localStorage.getItem('ah_duration') || '16'),
            startHour: parseInt(localStorage.getItem('ah_start_hour') || '6'),
        };
    }

    public save(data: Partial<ClockSettingsData>): void {
        this.settings = { ...this.settings, ...data };
        localStorage.setItem('ah_duration', this.settings.duration.toString());
        localStorage.setItem('ah_start_hour', this.settings.startHour.toString());
    }

    public getSettings(): ClockSettingsData {
        return this.settings;
    }

    public getD24StartTime(): Date {
        const now = new Date();
        const start = new Date(now);
        start.setHours(this.settings.startHour, 0, 0, 0);

        if (now < start) {
            start.setDate(start.getDate() - 1);
        }

        return start;
    }
} 