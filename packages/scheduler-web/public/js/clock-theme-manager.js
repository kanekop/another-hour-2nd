// public/js/clock-theme-manager.js

// Local storage keys
const STORAGE_KEYS = {
  CLOCK_FACE: 'clockFaceTheme',
  COLOR_SCALED24: 'colorThemeScaled24',
  COLOR_AH: 'colorThemeAH'
};

// Available themes
export const CLOCK_FACES = {
  CLASSIC: 'classic',
  MINIMALIST: 'minimalist',
  DIGITAL: 'digital',
  ROMAN: 'roman'
};

export const COLOR_THEMES = {
  DEFAULT: 'default',
  BLUE: 'blue',
  GREEN: 'green'
};

/**
 * Initialize theme manager with default settings
 */
export function initializeThemeManager() {
  // Load saved preferences or use defaults
  const savedFace = localStorage.getItem(STORAGE_KEYS.CLOCK_FACE) || CLOCK_FACES.CLASSIC;
  const savedColorScaled24 = localStorage.getItem(STORAGE_KEYS.COLOR_SCALED24) || COLOR_THEMES.DEFAULT;
  const savedColorAH = localStorage.getItem(STORAGE_KEYS.COLOR_AH) || COLOR_THEMES.DEFAULT;

  return {
    clockFace: savedFace,
    colorScaled24: savedColorScaled24,
    colorAH: savedColorAH
  };
}

/**
 * Apply clock face theme
 * @param {string} theme - One of CLOCK_FACES values
 */
export function applyClockFace(theme) {
  const body = document.body;

  // Remove all clock face classes
  Object.values(CLOCK_FACES).forEach(face => {
    body.classList.remove(`clock-theme-${face}`);
  });

  // Add new clock face class
  body.classList.add(`clock-theme-${theme}`);

  // Save preference
  localStorage.setItem(STORAGE_KEYS.CLOCK_FACE, theme);

  // Special handling for Roman numerals
  if (theme === CLOCK_FACES.ROMAN) {
    updateToRomanNumerals();
  } else if (document.querySelector('.hour-number')) {
    updateToArabicNumerals();
  }
}

/**
 * Apply color theme based on period
 * @param {boolean} isAHPeriod - Whether currently in AH period
 * @param {string} scaled24Theme - Color theme for Designed 24 period
 * @param {string} ahTheme - Color theme for AH period
 */
export function applyColorTheme(isAHPeriod, scaled24Theme, ahTheme) {
  const body = document.body;

  // Remove all color theme classes
  Object.values(COLOR_THEMES).forEach(color => {
    body.classList.remove(`color-theme-${color}`);
  });
  body.classList.remove('scaled24', 'ah-period');

  // Apply appropriate color theme
  const theme = isAHPeriod ? ahTheme : scaled24Theme;
  const period = isAHPeriod ? 'ah-period' : 'scaled24';

  body.classList.add(`color-theme-${theme}`, period, 'clock-theme-applied');
}

/**
 * Save color theme preferences
 * @param {string} scaled24Theme - Color theme for Designed 24 period
 * @param {string} ahTheme - Color theme for AH period
 */
export function saveColorPreferences(scaled24Theme, ahTheme) {
  localStorage.setItem(STORAGE_KEYS.COLOR_SCALED24, scaled24Theme);
  localStorage.setItem(STORAGE_KEYS.COLOR_AH, ahTheme);
}

/**
 * Update hour numbers to Roman numerals
 */
function updateToRomanNumerals() {
  const romanNumerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  const hourNumbers = document.querySelectorAll('.hour-number');

  hourNumbers.forEach((element, index) => {
    if (index < romanNumerals.length) {
      element.textContent = romanNumerals[index];
    }
  });
}

/**
 * Update hour numbers back to Arabic numerals
 */
function updateToArabicNumerals() {
  const hourNumbers = document.querySelectorAll('.hour-number');

  hourNumbers.forEach((element, index) => {
    const hour = index === 0 ? 12 : index;
    element.textContent = hour.toString();
  });
}

/**
 * Create theme selection UI
 * @returns {HTMLElement} Theme settings panel
 */
export function createThemeSettingsUI() {
  const panel = document.createElement('div');
  panel.className = 'theme-settings-panel';
  panel.innerHTML = `
    <div class="theme-settings-content">
      <h3>Clock Appearance</h3>

      <div class="setting-group">
        <label>Clock Face Style</label>
        <select id="clock-face-select" class="theme-select">
          <option value="${CLOCK_FACES.CLASSIC}">Classic</option>
          <option value="${CLOCK_FACES.MINIMALIST}">Minimalist</option>
          <option value="${CLOCK_FACES.DIGITAL}">Digital Only</option>
          <option value="${CLOCK_FACES.ROMAN}">Roman Numerals</option>
        </select>
      </div>

      <div class="setting-group">
        <label>Designed 24 Period Color</label>
        <select id="color-scaled24-select" class="theme-select">
          <option value="${COLOR_THEMES.DEFAULT}">Default (Light Gray)</option>
          <option value="${COLOR_THEMES.BLUE}">Blue</option>
          <option value="${COLOR_THEMES.GREEN}">Green</option>
        </select>
      </div>

      <div class="setting-group">
        <label>Another Hour Period Color</label>
        <select id="color-ah-select" class="theme-select">
          <option value="${COLOR_THEMES.DEFAULT}">Default (Dark)</option>
          <option value="${COLOR_THEMES.BLUE}">Dark Blue</option>
          <option value="${COLOR_THEMES.GREEN}">Dark Green</option>
        </select>
      </div>
    </div>
  `;

  return panel;
}