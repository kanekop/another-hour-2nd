
export class SolarVisualization {
    constructor() {
        this.solarMode = null;
        this.updateInterval = null;
    }

    /**
     * Create the enhanced Solar Mode configuration UI
     */
    createSolarConfigUI(config, solarMode) {
        this.solarMode = solarMode;
        
        // Get current solar times
        const sunTimes = solarMode.getSunTimes(config.location.key, new Date());
        
        return `
            <div class="config-group">
                <label for="solar-city">Location</label>
                <select id="solar-city">
                    ${Object.entries(solarMode.cities).map(([key, city]) => 
                        `<option value="${key}" ${config.location.key === key ? 'selected' : ''}>${city.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <!-- Solar Visualization -->
            <div class="solar-visualization">
                <div class="solar-orbit-compact">
                    <div class="orbit-ring"></div>
                    <div class="horizon-line"></div>
                    <div class="sun-indicator" id="sun-indicator"></div>
                    <div class="time-marker sunrise" id="sunrise-marker">6:00</div>
                    <div class="time-marker noon">12:00</div>
                    <div class="time-marker sunset" id="sunset-marker">18:00</div>
                </div>
                
                <div class="solar-info-grid">
                    <div class="solar-info-item">
                        <div class="solar-info-label">Sunrise</div>
                        <div class="solar-info-value" id="sunrise-time">${this.formatTime(sunTimes?.sunrise)}</div>
                    </div>
                    <div class="solar-info-item">
                        <div class="solar-info-label">Solar Noon</div>
                        <div class="solar-info-value" id="solar-noon-time">${this.formatTime(sunTimes?.solarNoon)}</div>
                    </div>
                    <div class="solar-info-item">
                        <div class="solar-info-label">Sunset</div>
                        <div class="solar-info-value" id="sunset-time">${this.formatTime(sunTimes?.sunset)}</div>
                    </div>
                    <div class="solar-info-item">
                        <div class="solar-info-label">Daylight</div>
                        <div class="solar-info-value" id="daylight-duration">${this.formatDuration(sunTimes?.daylightHours)}</div>
                    </div>
                </div>
            </div>
            
            <!-- Enhanced Day Hours Control -->
            <div class="day-hours-visual">
                <label for="solar-day-hours-slider">Day Hours Design</label>
                <div class="day-night-bar">
                    <div class="day-portion" id="day-portion" style="flex: ${config.designedDayHours};">Day: ${config.designedDayHours}h</div>
                    <div class="night-portion" id="night-portion" style="flex: ${24 - config.designedDayHours};">Night: ${24 - config.designedDayHours}h</div>
                </div>
                <input type="range" id="solar-day-hours-slider" min="1" max="23" step="0.5" value="${config.designedDayHours}">
                <div class="scale-indicators">
                    <div class="scale-item">
                        <div class="scale-dot day"></div>
                        <span id="day-scale">Day: 1.00x</span>
                    </div>
                    <div class="scale-item">
                        <div class="scale-dot night"></div>
                        <span id="night-scale">Night: 1.00x</span>
                    </div>
                </div>
            </div>
            
            <div class="config-group">
                <label>
                    <input type="checkbox" id="solar-auto-adjust" ${config.autoAdjust ? 'checked' : ''}>
                    Auto-adjust to actual daylight
                </label>
            </div>
        `;
    }

    /**
     * Initialize event listeners for the solar visualization
     */
    initializeEventListeners() {
        const slider = document.getElementById('solar-day-hours-slider');
        const dayPortion = document.getElementById('day-portion');
        const nightPortion = document.getElementById('night-portion');
        const dayScale = document.getElementById('day-scale');
        const nightScale = document.getElementById('night-scale');

        if (slider) {
            slider.addEventListener('input', (e) => {
                const dayHours = parseFloat(e.target.value);
                const nightHours = 24 - dayHours;
                
                dayPortion.style.flex = dayHours;
                dayPortion.textContent = `Day: ${dayHours}h`;
                
                nightPortion.style.flex = nightHours;
                nightPortion.textContent = `Night: ${nightHours}h`;
                
                // Update scale factors
                this.updateScaleFactors(dayHours);
            });
        }

        // Start real-time sun position updates
        this.startSunPositionUpdates();
    }

    /**
     * Update scale factors display
     */
    updateScaleFactors(designedDayHours) {
        if (!this.solarMode) return;

        // Get current configuration
        const config = { designedDayHours };
        const cityKey = document.getElementById('solar-city')?.value || 'tokyo';
        const sunTimes = this.solarMode.getSunTimes(cityKey, new Date());
        
        if (sunTimes) {
            const actualDayHours = sunTimes.daylightHours;
            const dayScale = designedDayHours / actualDayHours;
            const nightScale = (24 - designedDayHours) / (24 - actualDayHours);
            
            const dayScaleEl = document.getElementById('day-scale');
            const nightScaleEl = document.getElementById('night-scale');
            
            if (dayScaleEl) {
                dayScaleEl.textContent = `Day: ${dayScale.toFixed(2)}x ${dayScale < 1 ? '(slower)' : '(faster)'}`;
            }
            
            if (nightScaleEl) {
                nightScaleEl.textContent = `Night: ${nightScale.toFixed(2)}x ${nightScale < 1 ? '(slower)' : '(faster)'}`;
            }
        }
    }

    /**
     * Start real-time sun position updates
     */
    startSunPositionUpdates() {
        this.updateSunPosition();
        this.updateInterval = setInterval(() => {
            this.updateSunPosition();
        }, 60000); // Update every minute
    }

    /**
     * Stop real-time updates
     */
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update sun position in the visualization
     */
    updateSunPosition() {
        const sunIndicator = document.getElementById('sun-indicator');
        if (!sunIndicator || !this.solarMode) return;

        const cityKey = document.getElementById('solar-city')?.value || 'tokyo';
        const sunTimes = this.solarMode.getSunTimes(cityKey, new Date());
        
        if (!sunTimes) return;

        const now = new Date();
        const sunrise = sunTimes.sunrise;
        const sunset = sunTimes.sunset;
        const solarNoon = sunTimes.solarNoon;

        // Update time markers
        document.getElementById('sunrise-marker').textContent = this.formatTime(sunrise, true);
        document.getElementById('sunset-marker').textContent = this.formatTime(sunset, true);

        // Calculate sun position
        if (now >= sunrise && now <= sunset) {
            // Sun is up - calculate position along arc
            let progress;
            if (now <= solarNoon) {
                // Morning: sunrise to noon
                progress = (now - sunrise) / (solarNoon - sunrise) * 0.5;
            } else {
                // Afternoon: noon to sunset
                progress = 0.5 + (now - solarNoon) / (sunset - solarNoon) * 0.5;
            }
            
            // Convert progress to angle (sunrise=left, noon=top, sunset=right)
            const angle = -90 + (progress * 180); // -90° to +90°
            const radius = 80; // Distance from center
            const centerX = 100; // Center of orbit
            const centerY = 100;
            
            const x = centerX + radius * Math.cos(angle * Math.PI / 180);
            const y = centerY - radius * Math.sin(angle * Math.PI / 180);
            
            sunIndicator.style.left = (x - 12) + 'px';
            sunIndicator.style.top = (y - 12) + 'px';
            sunIndicator.style.display = 'block';
            sunIndicator.style.opacity = '1';
        } else {
            // Sun is down - hide or show dimmed
            sunIndicator.style.opacity = '0.3';
        }
    }

    /**
     * Update solar information when location changes
     */
    updateSolarInfo(cityKey) {
        if (!this.solarMode) return;

        const sunTimes = this.solarMode.getSunTimes(cityKey, new Date());
        if (!sunTimes) return;

        // Update solar info display
        document.getElementById('sunrise-time').textContent = this.formatTime(sunTimes.sunrise);
        document.getElementById('solar-noon-time').textContent = this.formatTime(sunTimes.solarNoon);
        document.getElementById('sunset-time').textContent = this.formatTime(sunTimes.sunset);
        document.getElementById('daylight-duration').textContent = this.formatDuration(sunTimes.daylightHours);

        // Update sun position
        this.updateSunPosition();

        // Update scale factors
        const slider = document.getElementById('solar-day-hours-slider');
        if (slider) {
            this.updateScaleFactors(parseFloat(slider.value));
        }
    }

    /**
     * Format time for display
     */
    formatTime(date, shortFormat = false) {
        if (!date) return '--:--';
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        if (shortFormat) {
            return `${hours}:${minutes}`;
        }
        
        return `${hours}:${minutes}`;
    }

    /**
     * Format duration for display
     */
    formatDuration(hours) {
        if (!hours) return '--h --m';
        
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        
        return `${h}h ${m}m`;
    }
}
