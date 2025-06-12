// BaseMode.js - Base class for all Time Design Modes
export class BaseMode {
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }

  getDisplayName() {
    throw new Error('getDisplayName() must be implemented by subclass');
  }

  getDescription() {
    throw new Error('getDescription() must be implemented by subclass');
  }

  getDefaultConfig() {
    return {};
  }

  getConfigSchema() {
    return {};
  }

  calculateAngles(date, timezone, config) {
    throw new Error('calculateAngles() must be implemented by subclass');
  }

  // Utility methods for angle calculations
  timeToAngle(hours, minutes, seconds = 0) {
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    return (totalMinutes / (24 * 60)) * 360;
  }

  normalizeAngle(angle) {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
  }

  // Standard time calculations
  getStandardAngles(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return {
      hourAngle: this.normalizeAngle((hours % 12) * 30 + minutes * 0.5 + seconds * (0.5 / 60)),
      minuteAngle: this.normalizeAngle(minutes * 6 + seconds * 0.1),
      secondAngle: this.normalizeAngle(seconds * 6)
    };
  }
}