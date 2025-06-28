import { SolarCalculator } from './solar-calculator.js';
import { SunAnimation } from './sun-animation.js';
import { LocationService } from '../shared/location-service.js';

class SolarClockUI {
    constructor() {
        this.calculator = new SolarCalculator();
        this.locationService = new LocationService();
        this.sunAnimation = null;
        this.updateInterval = null;
        this.elements = {};
        this.previousPhase = null;
    }

    async init() {
        this.cacheElements();
        await this.setupLocation();
        this.setupEventListeners();
        this.sunAnimation = new SunAnimation('sun-path-svg');
        this.loadNavigation();
        this.startClock();
    }

    cacheElements() {
        this.elements = {
            ahTime: document.getElementById('ah-time-display'),
            realTime: document.getElementById('real-time-display'),
            phase: document.getElementById('phase-display'),
            sunrise: document.getElementById('sunrise-time'),
            sunset: document.getElementById('sunset-time'),
            location: document.getElementById('location-display'),
            background: document.getElementById('sky-background'),
            locationBtn: document.getElementById('location-btn'),
            settingsBtn: document.getElementById('settings-btn')
        };
    }

    async setupLocation() {
        const location = await this.locationService.getCurrentLocation();
        this.calculator.setLocation(location.latitude, location.longitude);
        this.elements.location.textContent = `Location: ${location.name}`;
    }

    setupEventListeners() {
        this.elements.locationBtn.addEventListener('click', () => {
            this.showLocationDialog();
        });

        this.elements.settingsBtn.addEventListener('click', () => {
            this.showSettingsDialog();
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.stopClock();
        });
    }

    loadNavigation() {
        // Load the common navigation
        const navElement = document.getElementById('main-nav');
        if (navElement) {
            navElement.innerHTML = `
                <div class="nav-container">
                    <h1 class="nav-logo">Another Hour</h1>
                    <ul class="nav-menu">
                        <li><a href="/">Home</a></li>
                        <li><a href="/clock">Clock</a></li>
                        <li><a href="/scheduler">Scheduler</a></li>
                        <li><a href="/solar" class="active">Solar Clock</a></li>
                        <li><a href="/timer">Timer</a></li>
                        <li><a href="/stopwatch">Stopwatch</a></li>
                        <li><a href="/world-clock">World Clock</a></li>
                    </ul>
                </div>
            `;
        }
    }

    startClock() {
        this.update();
        this.updateInterval = setInterval(() => this.update(), 1000);
    }

    stopClock() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    update() {
        const now = new Date();
        const ahTime = this.calculator.getAnotherHourTime(now);
        const solarPhase = this.calculator.getSolarPhase(now);

        // Update time displays
        this.updateTimeDisplay(now, ahTime);
        
        // Update sun position
        this.sunAnimation.updateSunPosition(solarPhase.progress, solarPhase.phase);
        
        // Update background
        this.updateBackground(solarPhase);
        
        // Update solar info
        this.updateSolarInfo();
        
        // Check for phase transitions
        this.checkPhaseTransition(solarPhase);
    }

    updateTimeDisplay(realTime, ahTime) {
        // Another Hour time
        this.elements.ahTime.textContent = this.formatTime(ahTime);
        
        // Real time
        this.elements.realTime.textContent = `Real: ${this.formatTime(realTime)}`;
    }

    updateBackground(solarPhase) {
        const gradients = {
            'night-night': 'linear-gradient(to bottom, #0a0a0a, #1a1a2e, #16213e)',
            'night-dawn': 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)',
            'day-morning': 'linear-gradient(to bottom, #f39c12, #f1c40f, #87ceeb)',
            'day-midday': 'linear-gradient(to bottom, #87ceeb, #98d8e8, #b7e4f7)',
            'day-afternoon': 'linear-gradient(to bottom, #87ceeb, #98d8e8, #f1c40f)',
            'day-evening': 'linear-gradient(to bottom, #fd746c, #ff9068, #2c3e50)',
            'night-dusk': 'linear-gradient(to bottom, #2c3e50, #34495e, #1a1a2e)'
        };

        const key = `${solarPhase.phase}-${solarPhase.subPhase}`;
        const gradient = gradients[key] || gradients['day-midday'];
        
        this.elements.background.style.background = gradient;
        
        // Update phase display with emoji
        const phaseEmoji = solarPhase.phase === 'day' ? '☀️' : '🌙';
        const phaseText = solarPhase.subPhase.charAt(0).toUpperCase() + solarPhase.subPhase.slice(1);
        this.elements.phase.textContent = `${phaseEmoji} ${phaseText}`;
    }

    updateSolarInfo() {
        const times = this.calculator.solarTimes;
        if (times) {
            this.elements.sunrise.textContent = 
                `Sunrise: ${this.formatTime(times.sunrise, true)}`;
            this.elements.sunset.textContent = 
                `Sunset: ${this.formatTime(times.sunset, true)}`;
        }
    }

    checkPhaseTransition(currentPhase) {
        if (this.previousPhase && this.previousPhase.phase !== currentPhase.phase) {
            if (currentPhase.phase === 'day') {
                this.sunAnimation.animateSunrise();
            } else {
                this.sunAnimation.animateSunset();
            }
        }
        this.previousPhase = currentPhase;
    }

    formatTime(date, shortFormat = false) {
        if (shortFormat) {
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        return date.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    showLocationDialog() {
        const cities = Object.keys(this.locationService.cities);
        const currentLocation = this.elements.location.textContent.replace('Location: ', '');
        
        const dialogHtml = `
            <div class="modal-overlay" id="location-modal">
                <div class="modal-content">
                    <h2>Choose Location</h2>
                    <div class="location-list">
                        <button class="location-item" data-action="current">
                            📍 Use Current Location
                        </button>
                        ${cities.map(city => `
                            <button class="location-item" data-city="${city}" 
                                    ${city === currentLocation ? 'class="selected"' : ''}>
                                ${city}
                            </button>
                        `).join('')}
                    </div>
                    <button class="close-btn" onclick="document.getElementById('location-modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
        
        // Add event listeners
        document.querySelectorAll('.location-item').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const city = e.target.dataset.city;
                const action = e.target.dataset.action;
                
                if (action === 'current') {
                    await this.setupLocation();
                } else if (city) {
                    const location = this.locationService.getCityLocation(city);
                    this.calculator.setLocation(location.latitude, location.longitude);
                    this.elements.location.textContent = `Location: ${city}`;
                }
                
                document.getElementById('location-modal').remove();
            });
        });
    }

    showSettingsDialog() {
        const dialogHtml = `
            <div class="modal-overlay" id="settings-modal">
                <div class="modal-content">
                    <h2>Solar Clock Settings</h2>
                    <div class="settings-list">
                        <div class="setting-item">
                            <label>Day Hours Target:</label>
                            <input type="number" id="day-hours" value="12" min="1" max="23">
                        </div>
                        <div class="setting-item">
                            <label>Seasonal Adjustment:</label>
                            <input type="checkbox" id="seasonal-adj">
                        </div>
                        <div class="setting-item">
                            <label>Time Format:</label>
                            <select id="time-format">
                                <option value="24">24-hour</option>
                                <option value="12">12-hour</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button onclick="document.getElementById('settings-modal').remove()">
                            Cancel
                        </button>
                        <button onclick="window.solarClockUI.saveSettings()">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
    }

    async saveSettings() {
        // Get settings values
        const dayHours = document.getElementById('day-hours').value;
        const seasonalAdj = document.getElementById('seasonal-adj').checked;
        
        // Save to server
        try {
            const response = await fetch('/api/solar/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dayHoursTarget: parseInt(dayHours),
                    seasonalAdjustment: seasonalAdj
                })
            });
            
            if (response.ok) {
                // Update calculator with new settings
                // Note: This would require extending the calculator to accept these settings
                console.log('Settings saved');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
        
        document.getElementById('settings-modal').remove();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.solarClockUI = new SolarClockUI();
    window.solarClockUI.init();
});