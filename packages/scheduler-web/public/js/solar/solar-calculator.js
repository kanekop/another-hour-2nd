// Simple solar calculation without external dependencies
export class SolarCalculator {
    constructor() {
        this.location = null;
        this.solarTimes = null;
        this.anotherHourManager = null;
        this.initializeTimeDesign();
    }

    async initializeTimeDesign() {
        // Initialize TimeDesignManager if available
        if (window.timeDesignManager) {
            this.anotherHourManager = window.timeDesignManager;
        }
    }

    setLocation(latitude, longitude) {
        this.location = { latitude, longitude };
        this.updateSolarTimes();
    }

    updateSolarTimes() {
        if (!this.location) return;
        
        const date = new Date();
        // Calculate sun times using our own implementation
        this.solarTimes = this.calculateSunTimes(date, this.location);
    }

    calculateSunTimes(date, location) {
        // Simplified sunrise/sunset calculation
        const julianDay = this.toJulianDay(date);
        const equation = this.equationOfTime(julianDay);
        const declination = this.solarDeclination(julianDay);
        
        // Hour angle for sunrise/sunset
        const lat = location.latitude * Math.PI / 180;
        const hourAngle = Math.acos(-Math.tan(lat) * Math.tan(declination));
        
        // Convert to local time
        const solarNoon = 12 - equation / 60 - location.longitude / 15;
        const sunrise = solarNoon - hourAngle * 12 / Math.PI;
        const sunset = solarNoon + hourAngle * 12 / Math.PI;
        
        return {
            sunrise: this.hoursToDate(sunrise, date),
            sunset: this.hoursToDate(sunset, date),
            solarNoon: this.hoursToDate(solarNoon, date)
        };
    }

    getAnotherHourTime(date) {
        if (!this.anotherHourManager || !this.location) {
            return date;
        }

        try {
            // Configure solar mode
            const config = {
                mode: 'solar',
                parameters: {
                    location: {
                        city: 'Custom',
                        latitude: this.location.latitude,
                        longitude: this.location.longitude
                    },
                    dayHoursTarget: 12,
                    seasonalAdjustment: false
                }
            };

            // Calculate Another Hour time
            const result = this.anotherHourManager.calculate(
                date,
                Intl.DateTimeFormat().resolvedOptions().timeZone,
                config
            );

            return new Date(result.displayTime);
        } catch (error) {
            console.error('Error calculating Another Hour time:', error);
            return date;
        }
    }

    getSolarPhase(date) {
        if (!this.solarTimes) return { phase: 'unknown', progress: 0 };
        
        const now = date.getTime();
        const sunrise = this.solarTimes.sunrise.getTime();
        const sunset = this.solarTimes.sunset.getTime();
        
        if (now < sunrise) {
            // Before sunrise
            const midnight = new Date(date);
            midnight.setHours(0, 0, 0, 0);
            const nightDuration = sunrise - midnight.getTime();
            const elapsed = now - midnight.getTime();
            const progress = elapsed / nightDuration;
            
            return { 
                phase: 'night', 
                subPhase: progress > 0.8 ? 'dawn' : 'night',
                progress: 0 
            };
        } else if (now > sunset) {
            // After sunset
            const midnight = new Date(date);
            midnight.setHours(24, 0, 0, 0);
            const nightDuration = midnight.getTime() - sunset;
            const elapsed = now - sunset;
            const progress = elapsed / nightDuration;
            
            return { 
                phase: 'night', 
                subPhase: progress < 0.2 ? 'dusk' : 'night',
                progress: 1 
            };
        } else {
            // During day
            const dayDuration = sunset - sunrise;
            const elapsed = now - sunrise;
            const progress = elapsed / dayDuration;
            
            let subPhase = 'morning';
            if (progress > 0.75) subPhase = 'evening';
            else if (progress > 0.5) subPhase = 'afternoon';
            else if (progress > 0.25) subPhase = 'midday';
            
            return { phase: 'day', subPhase, progress };
        }
    }

    // Helper methods
    toJulianDay(date) {
        return date.getTime() / 86400000 + 2440587.5;
    }

    equationOfTime(julianDay) {
        const D = julianDay - 2451545.0;
        const g = (357.529 + 0.98560028 * D) * Math.PI / 180;
        const q = (280.459 + 0.98564736 * D) * Math.PI / 180;
        const L = q + 0.03349 * Math.sin(g) + 0.00021 * Math.sin(2 * g);
        
        return 4 * (q - 0.0057183 - Math.atan2(Math.tan(L), Math.cos(0.40931))) * 180 / Math.PI;
    }

    solarDeclination(julianDay) {
        const D = julianDay - 2451545.0;
        const g = (357.529 + 0.98560028 * D) * Math.PI / 180;
        const q = (280.459 + 0.98564736 * D) * Math.PI / 180;
        const L = q + 0.03349 * Math.sin(g) + 0.00021 * Math.sin(2 * g);
        
        return Math.asin(Math.sin(0.40931) * Math.sin(L));
    }

    hoursToDate(hours, referenceDate) {
        const date = new Date(referenceDate);
        const totalMinutes = hours * 60;
        date.setHours(Math.floor(totalMinutes / 60), Math.floor(totalMinutes % 60), 0, 0);
        return date;
    }
}