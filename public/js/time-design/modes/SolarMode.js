// SolarMode.js - Time based on solar cycles

class SolarMode extends BaseMode {
  constructor() {
    super(
      'solar',
      'Solar Mode',
      'Time synchronized with sunrise and sunset cycles'
    );
  }

  getDefaultConfig() {
    return {
      location: {
        latitude: 35.6762, // Tokyo
        longitude: 139.6503
      },
      dayNightRatio: {
        day: 16,   // hours
        night: 8   // hours
      }
    };
  }

  validate(config) {
    const errors = [];
    
    if (!config.location || typeof config.location !== 'object') {
      errors.push('Location must be an object');
    } else {
      if (typeof config.location.latitude !== 'number' || config.location.latitude < -90 || config.location.latitude > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
      if (typeof config.location.longitude !== 'number' || config.location.longitude < -180 || config.location.longitude > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }

    if (!config.dayNightRatio || typeof config.dayNightRatio !== 'object') {
      errors.push('Day/night ratio must be an object');
    } else {
      if (typeof config.dayNightRatio.day !== 'number' || config.dayNightRatio.day <= 0) {
        errors.push('Day hours must be a positive number');
      }
      if (typeof config.dayNightRatio.night !== 'number' || config.dayNightRatio.night <= 0) {
        errors.push('Night hours must be a positive number');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  calculate(date, timezone, config) {
    const now = new Date(date);

    // Simplified solar calculation (would use proper solar library in production)
    const dayOfYear = this.getDayOfYear(now);
    const sunriseHour = 6 + Math.sin((dayOfYear - 81) * Math.PI / 182) * 2;
    const sunsetHour = 18 + Math.sin((dayOfYear - 81) * Math.PI / 182) * 2;

    const currentHour = now.getHours() + now.getMinutes() / 60;
    const isDaytime = currentHour >= sunriseHour && currentHour <= sunsetHour;

    let scaleFactor = 1;
    let periodName = isDaytime ? 'Solar Day' : 'Solar Night';

    // Scale day/night periods to configured ratios
    if (isDaytime) {
      const dayLength = sunsetHour - sunriseHour;
      scaleFactor = config.dayNightRatio.day / dayLength;
    } else {
      const nightLength = 24 - (sunsetHour - sunriseHour);
      scaleFactor = config.dayNightRatio.night / nightLength;
    }

    // Calculate scaled time
    const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const scaledSeconds = totalSeconds * scaleFactor;

    const hours = Math.floor(scaledSeconds / 3600) % 24;
    const minutes = Math.floor((scaledSeconds % 3600) / 60);
    const seconds = scaledSeconds % 60;

    return {
      hours,
      minutes,
      seconds,
      periodName,
      scaleFactor,
      segmentInfo: {
        type: 'designed',
        label: periodName,
        progress: isDaytime 
          ? ((currentHour - sunriseHour) / (sunsetHour - sunriseHour)) * 100
          : ((currentHour < sunriseHour ? currentHour + 24 : currentHour) - sunsetHour) / (24 - (sunsetHour - sunriseHour)) * 100,
        remaining: isDaytime 
          ? (sunsetHour - currentHour) * 60
          : ((sunriseHour < currentHour ? sunriseHour + 24 : sunriseHour) - currentHour) * 60
      },
      solarInfo: {
        sunrise: sunriseHour,
        sunset: sunsetHour,
        isDaytime: isDaytime,
        location: `${config.location.latitude.toFixed(2)}, ${config.location.longitude.toFixed(2)}`
      }
    };
  }

  getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SolarMode };
} else {
  window.SolarMode = SolarMode;
}