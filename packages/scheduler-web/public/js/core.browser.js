var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// dist/time-calculation.js
var require_time_calculation = __commonJS({
  "dist/time-calculation.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCustomAhAngles = getCustomAhAngles;
    exports.convertToAHTime = convertToAHTime;
    exports.getTimeScalingFactor = getTimeScalingFactor;
    exports.isInDesigned24 = isInDesigned24;
    exports.getTimeScalingInfo = getTimeScalingInfo;
    exports.convertToExtendedAHTime = convertToExtendedAHTime;
    function getCustomAhAngles(currentTime, designed24Duration, d24StartTime) {
      if (designed24Duration <= 0) {
        throw new Error("designed24Duration must be greater than 0");
      }
      const elapsed = currentTime.getTime() - d24StartTime.getTime();
      const elapsedHours = elapsed / (1e3 * 60 * 60);
      let hourAngle, minuteAngle;
      if (elapsedHours < designed24Duration) {
        const scaleFactor = 24 / designed24Duration;
        const scaledHours = elapsedHours * scaleFactor;
        hourAngle = scaledHours * 30 % 360;
        minuteAngle = scaledHours * 60 % 60 * 6;
      } else {
        const ahElapsed = elapsedHours - designed24Duration;
        const ahDuration = 24 - designed24Duration;
        hourAngle = ahElapsed % ahDuration * 30 % 360;
        minuteAngle = ahElapsed % ahDuration * 60 % 60 * 6;
      }
      return { hourAngle, minuteAngle };
    }
    function convertToAHTime(realTime, designed24Duration, d24StartTime) {
      if (designed24Duration <= 0) {
        throw new Error("designed24Duration must be greater than 0");
      }
      const elapsed = realTime.getTime() - d24StartTime.getTime();
      const elapsedHours = elapsed / (1e3 * 60 * 60);
      let ahHours, ahMinutes;
      if (elapsedHours < designed24Duration) {
        const scaleFactor = 24 / designed24Duration;
        const scaledHours = elapsedHours * scaleFactor;
        ahHours = Math.floor(scaledHours) % 24;
        ahMinutes = Math.floor(scaledHours % 1 * 60);
      } else {
        const ahElapsed = elapsedHours - designed24Duration;
        ahHours = Math.floor(ahElapsed) % 24;
        ahMinutes = Math.floor(ahElapsed % 1 * 60);
      }
      return { hours: ahHours, minutes: ahMinutes };
    }
    function getTimeScalingFactor(designed24Duration) {
      if (designed24Duration === 0)
        return 1;
      if (designed24Duration < 0) {
        throw new Error("designed24Duration cannot be negative");
      }
      return 24 / designed24Duration;
    }
    function isInDesigned24(currentTime, designed24Duration, d24StartTime) {
      if (designed24Duration <= 0) {
        throw new Error("designed24Duration must be greater than 0");
      }
      const elapsed = currentTime.getTime() - d24StartTime.getTime();
      const elapsedHours = elapsed / (1e3 * 60 * 60);
      return elapsedHours < designed24Duration;
    }
    function getTimeScalingInfo(currentTime, designed24Duration, d24StartTime) {
      const inDesigned24 = isInDesigned24(currentTime, designed24Duration, d24StartTime);
      const scaleFactor = inDesigned24 ? getTimeScalingFactor(designed24Duration) : 1;
      return {
        scaleFactor,
        isInDesigned24: inDesigned24,
        currentPhase: inDesigned24 ? "designed24" : "another-hour"
      };
    }
    function convertToExtendedAHTime(realTime, designed24Duration, d24StartTime) {
      const ahTime = convertToAHTime(realTime, designed24Duration, d24StartTime);
      const scaling = getTimeScalingInfo(realTime, designed24Duration, d24StartTime);
      const formatted = `${ahTime.hours.toString().padStart(2, "0")}:${ahTime.minutes.toString().padStart(2, "0")}`;
      return {
        ...ahTime,
        scaling,
        realTime,
        formatted
      };
    }
  }
});

// dist/types/time-modes.js
var require_time_modes = __commonJS({
  "dist/types/time-modes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_VALUES = exports.TimeDesignMode = void 0;
    var TimeDesignMode;
    (function(TimeDesignMode2) {
      TimeDesignMode2["Classic"] = "classic";
      TimeDesignMode2["CoreTime"] = "core-time";
      TimeDesignMode2["WakeBased"] = "wake-based";
      TimeDesignMode2["Solar"] = "solar";
    })(TimeDesignMode || (exports.TimeDesignMode = TimeDesignMode = {}));
    exports.DEFAULT_VALUES = {
      user: {
        userId: "default-user",
        dayStartTime: "00:00",
        defaultTimezone: "Asia/Tokyo",
        preferredMode: TimeDesignMode.Classic
      },
      classic: {
        designed24Duration: 1380
        // 23時間
      },
      coreTime: {
        coreTimeStart: "09:00",
        coreTimeEnd: "17:00",
        minCoreHours: 6,
        anotherHourAllocation: null
      },
      wakeBased: {
        defaultWakeTime: "07:00",
        anotherHourDuration: 60,
        // 1時間
        maxScaleFactor: 2
      },
      solar: {
        dayHoursTarget: 12,
        seasonalAdjustment: false
      }
    };
  }
});

// dist/types/constants.js
var require_constants = __commonJS({
  "dist/types/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CLOCK_CONSTANTS = exports.TIME_CONSTANTS = void 0;
    exports.TIME_CONSTANTS = {
      HOURS_IN_DAY: 24,
      MINUTES_IN_HOUR: 60,
      SECONDS_IN_MINUTE: 60,
      MILLISECONDS_IN_SECOND: 1e3,
      MILLISECONDS_IN_MINUTE: 6e4,
      MILLISECONDS_IN_HOUR: 36e5,
      DEGREES_IN_CIRCLE: 360,
      // Another Hour 特有の定数
      DEFAULT_DESIGNED_24_DURATION: 8,
      // デフォルトは8時間
      MIN_DESIGNED_24_DURATION: 0.1,
      // 最小6分
      MAX_DESIGNED_24_DURATION: 24
      // 最大24時間
    };
    exports.CLOCK_CONSTANTS = {
      HOUR_HAND_DEGREES_PER_HOUR: 30,
      // 360° / 12時間
      MINUTE_HAND_DEGREES_PER_MINUTE: 6,
      // 360° / 60分
      HOUR_HAND_DEGREES_PER_MINUTE: 0.5
      // 30° / 60分
    };
  }
});

// dist/validation.js
var require_validation = __commonJS({
  "dist/validation.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateClassicTimeConfig = validateClassicTimeConfig;
    exports.validateModeParameters = validateModeParameters;
    var time_modes_js_1 = require_time_modes();
    var constants_js_1 = require_constants();
    function validateClassicTimeConfig(designed24Duration) {
      const errors = [];
      const warnings = [];
      if (designed24Duration <= 0) {
        errors.push({
          field: "designed24Duration",
          message: "Designed 24 duration must be greater than 0",
          code: "INVALID_DURATION_NEGATIVE"
        });
      } else if (designed24Duration > constants_js_1.TIME_CONSTANTS.MAX_DESIGNED_24_DURATION) {
        errors.push({
          field: "designed24Duration",
          message: `Designed 24 duration cannot exceed ${constants_js_1.TIME_CONSTANTS.MAX_DESIGNED_24_DURATION} hours`,
          code: "INVALID_DURATION_TOO_LONG"
        });
      } else if (designed24Duration < constants_js_1.TIME_CONSTANTS.MIN_DESIGNED_24_DURATION) {
        warnings.push({
          field: "designed24Duration",
          message: `Very short Designed 24 duration (${designed24Duration} hours)`,
          suggestion: "Consider using a longer duration for better time scaling"
        });
      }
      return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? { designed24Duration } : void 0,
        errors: errors.length > 0 ? errors : void 0,
        warnings: warnings.length > 0 ? warnings : void 0
      };
    }
    function validateModeParameters(mode, params) {
      switch (mode) {
        case time_modes_js_1.TimeDesignMode.Classic:
          return validateClassicMode(params);
        case time_modes_js_1.TimeDesignMode.CoreTime:
          return validateCoreTimeMode(params);
        case time_modes_js_1.TimeDesignMode.WakeBased:
          return validateWakeBasedMode(params);
        case time_modes_js_1.TimeDesignMode.Solar:
          return validateSolarMode(params);
        default:
          return {
            isValid: false,
            errors: [{
              field: "mode",
              message: `Unknown mode: ${mode}`,
              code: "UNKNOWN_MODE"
            }]
          };
      }
    }
    function validateClassicMode(params) {
      const errors = [];
      if (typeof params.designed24Duration !== "number" || isNaN(params.designed24Duration)) {
        errors.push({
          field: "designed24Duration",
          message: "Duration must be a number.",
          code: "INVALID_TYPE"
        });
      } else if (params.designed24Duration < 1 || params.designed24Duration > 1440) {
        errors.push({
          field: "designed24Duration",
          message: "Duration must be between 1 and 1440 minutes.",
          code: "INVALID_RANGE"
        });
      }
      return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? params : void 0,
        errors: errors.length > 0 ? errors : void 0
      };
    }
    function validateCoreTimeMode(params) {
      const errors = [];
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(params.coreTimeStart)) {
        errors.push({
          field: "coreTimeStart",
          message: "Core time start must be in HH:MM format.",
          code: "INVALID_TIME_FORMAT"
        });
      }
      if (!timeRegex.test(params.coreTimeEnd)) {
        errors.push({
          field: "coreTimeEnd",
          message: "Core time end must be in HH:MM format.",
          code: "INVALID_TIME_FORMAT"
        });
      }
      if (timeRegex.test(params.coreTimeStart) && timeRegex.test(params.coreTimeEnd)) {
        const [startH, startM] = params.coreTimeStart.split(":").map(Number);
        const [endH, endM] = params.coreTimeEnd.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        if (startMinutes >= endMinutes) {
          errors.push({
            field: "coreTimeEnd",
            message: "Core time end must be after core time start.",
            code: "INVALID_TIME_ORDER"
          });
        }
      }
      if (typeof params.minCoreHours !== "number" || params.minCoreHours < 1 || params.minCoreHours > 23) {
        errors.push({
          field: "minCoreHours",
          message: "Minimum core hours must be between 1 and 23.",
          code: "INVALID_RANGE"
        });
      }
      return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? params : void 0,
        errors: errors.length > 0 ? errors : void 0
      };
    }
    function validateWakeBasedMode(params) {
      const errors = [];
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(params.defaultWakeTime)) {
        errors.push({
          field: "defaultWakeTime",
          message: "Default wake time must be in HH:MM format.",
          code: "INVALID_TIME_FORMAT"
        });
      }
      if (params.todayWakeTime && !timeRegex.test(params.todayWakeTime)) {
        errors.push({
          field: "todayWakeTime",
          message: "Today wake time must be in HH:MM format.",
          code: "INVALID_TIME_FORMAT"
        });
      }
      if (typeof params.anotherHourDuration !== "number" || params.anotherHourDuration < 0 || params.anotherHourDuration > 720) {
        errors.push({
          field: "anotherHourDuration",
          message: "Another Hour duration must be between 0 and 720 minutes.",
          code: "INVALID_RANGE"
        });
      }
      if (typeof params.maxScaleFactor !== "number" || params.maxScaleFactor < 1 || params.maxScaleFactor > 5) {
        errors.push({
          field: "maxScaleFactor",
          message: "Maximum scale factor must be between 1.0 and 5.0.",
          code: "INVALID_RANGE"
        });
      }
      return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? params : void 0,
        errors: errors.length > 0 ? errors : void 0
      };
    }
    function validateSolarMode(params) {
      const errors = [];
      if (typeof params.dayHoursTarget !== "number" || params.dayHoursTarget < 1 || params.dayHoursTarget > 23) {
        errors.push({
          field: "dayHoursTarget",
          message: "Day hours target must be between 1 and 23.",
          code: "INVALID_RANGE"
        });
      }
      if (params.location) {
        if (typeof params.location.latitude !== "number" || params.location.latitude < -90 || params.location.latitude > 90) {
          errors.push({
            field: "location.latitude",
            message: "Latitude must be between -90 and 90 degrees.",
            code: "INVALID_RANGE"
          });
        }
        if (typeof params.location.longitude !== "number" || params.location.longitude < -180 || params.location.longitude > 180) {
          errors.push({
            field: "location.longitude",
            message: "Longitude must be between -180 and 180 degrees.",
            code: "INVALID_RANGE"
          });
        }
      }
      return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? params : void 0,
        errors: errors.length > 0 ? errors : void 0
      };
    }
  }
});

// dist/types/errors.js
var require_errors = __commonJS({
  "dist/types/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InvalidModeError = exports.TimeCalculationError = exports.InvalidTimeConfigError = exports.AnotherHourError = void 0;
    var AnotherHourError = class _AnotherHourError extends Error {
      constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "AnotherHourError";
        Object.setPrototypeOf(this, _AnotherHourError.prototype);
      }
    };
    exports.AnotherHourError = AnotherHourError;
    var InvalidTimeConfigError = class extends AnotherHourError {
      constructor(message) {
        super(message, "INVALID_TIME_CONFIG");
      }
    };
    exports.InvalidTimeConfigError = InvalidTimeConfigError;
    var TimeCalculationError = class extends AnotherHourError {
      constructor(message) {
        super(message, "TIME_CALCULATION_ERROR");
      }
    };
    exports.TimeCalculationError = TimeCalculationError;
    var InvalidModeError = class extends AnotherHourError {
      constructor(mode) {
        super(`Invalid time design mode: ${mode}`, "INVALID_MODE");
      }
    };
    exports.InvalidModeError = InvalidModeError;
  }
});

// dist/types/time-sharing.js
var require_time_sharing = __commonJS({
  "dist/types/time-sharing.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParticipantRole = void 0;
    var ParticipantRole;
    (function(ParticipantRole2) {
      ParticipantRole2["Owner"] = "owner";
      ParticipantRole2["Editor"] = "editor";
      ParticipantRole2["Viewer"] = "viewer";
    })(ParticipantRole || (exports.ParticipantRole = ParticipantRole = {}));
  }
});

// dist/types/validation.js
var require_validation2 = __commonJS({
  "dist/types/validation.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// dist/types/utilities.js
var require_utilities = __commonJS({
  "dist/types/utilities.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// dist/types/index.js
var require_types = __commonJS({
  "dist/types/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_errors(), exports);
    __exportStar(require_constants(), exports);
    __exportStar(require_time_modes(), exports);
    __exportStar(require_time_sharing(), exports);
    __exportStar(require_validation2(), exports);
    __exportStar(require_utilities(), exports);
  }
});

// dist/modes/BaseMode.js
var require_BaseMode = __commonJS({
  "dist/modes/BaseMode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseMode = void 0;
    var BaseMode = class _BaseMode {
      constructor(config) {
        if (this.constructor === _BaseMode) {
          throw new Error("BaseMode is an abstract class and cannot be instantiated directly");
        }
        this.config = config;
        this.validateConfig();
      }
      /**
       * 設定の妥当性検証（サブクラスでオーバーライド）
       */
      validateConfig() {
        if (!this.config || !this.config.parameters) {
          throw new Error("Invalid configuration: parameters are required");
        }
      }
      /**
       * 現在時刻に対するスケールファクターを計算
       * @param {Date} currentTime - 現在時刻
       * @returns {number} スケールファクター（1.0 = 通常速度）
       */
      calculateScaleFactor(currentTime) {
        throw new Error("calculateScaleFactor must be implemented by subclass");
      }
      /**
       * 現在のフェーズ（期間）を取得
       * @param {Date} currentTime - 現在時刻
       * @returns {Object} { name: string, progress: number }
       */
      getCurrentPhase(currentTime) {
        throw new Error("getCurrentPhase must be implemented by subclass");
      }
      /**
       * Another Hour 時間を計算
       * @param {Date} realTime - 実時間
       * @returns {Date} Another Hour 時間
       */
      calculateAnotherHourTime(realTime) {
        throw new Error("calculateAnotherHourTime must be implemented by subclass");
      }
      /**
       * 実時間から Another Hour 時間への変換
       * @param {Date} realTime - 実時間
       * @returns {Date} Another Hour 時間
       */
      convertToAnotherHour(realTime) {
        return this.calculateAnotherHourTime(realTime);
      }
      /**
       * Another Hour 時間から実時間への変換
       * @param {Date} anotherHourTime - Another Hour 時間
       * @returns {Date} 実時間
       */
      convertToRealTime(anotherHourTime) {
        throw new Error("convertToRealTime must be implemented by subclass");
      }
      /**
       * 時計の角度を計算（アナログ時計用）
       * @param {Date} currentTime - 現在時刻
       * @returns {Object} { hours: number, minutes: number, seconds: number }
       */
      getClockAngles(currentTime) {
        const ahTime = this.calculateAnotherHourTime(currentTime);
        const hours = ahTime.getHours();
        const minutes = ahTime.getMinutes();
        const seconds = ahTime.getSeconds();
        const milliseconds = ahTime.getMilliseconds();
        const hourAngle = (hours % 12 + minutes / 60 + seconds / 3600) * 30;
        const minuteAngle = (minutes + seconds / 60 + milliseconds / 6e4) * 6;
        const secondAngle = (seconds + milliseconds / 1e3) * 6;
        return {
          hours: hourAngle,
          minutes: minuteAngle,
          seconds: secondAngle
        };
      }
      /**
       * モードの説明を取得
       * @returns {string}
       */
      getDescription() {
        return this.config.description || "No description available";
      }
      /**
       * 設定をエクスポート
       * @returns {Object}
       */
      exportConfig() {
        return {
          mode: this.config.mode,
          parameters: { ...this.config.parameters },
          name: this.config.name,
          description: this.config.description
        };
      }
      /**
       * タイムライン用のセグメント情報を取得
       * @returns {Array} セグメント配列
       */
      getSegments() {
        throw new Error("getSegments must be implemented by subclass");
      }
      /**
       * UI設定フォーム用のデータを取得
       * @returns {Object} UI設定データ
       */
      getConfigUI() {
        throw new Error("getConfigUI must be implemented by subclass");
      }
      /**
       * UI設定フォームからデータを収集
       * @returns {Object} 設定データ
       */
      collectConfigFromUI() {
        throw new Error("collectConfigFromUI must be implemented by subclass");
      }
      /**
       * デバッグ情報を取得
       * @param {Date} currentTime
       * @returns {Object}
       */
      getDebugInfo(currentTime) {
        return {
          mode: this.config.mode,
          scaleFactor: this.calculateScaleFactor(currentTime),
          phase: this.getCurrentPhase(currentTime),
          ahTime: this.calculateAnotherHourTime(currentTime),
          config: this.exportConfig()
        };
      }
    };
    exports.BaseMode = BaseMode;
  }
});

// dist/TimeDesignManager.js
var require_TimeDesignManager = __commonJS({
  "dist/TimeDesignManager.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimeDesignManager = void 0;
    var BaseMode_js_1 = require_BaseMode();
    var time_modes_js_1 = require_time_modes();
    var TimeDesignManager = class _TimeDesignManager {
      constructor() {
        this.modes = /* @__PURE__ */ new Map();
        this.currentMode = null;
        this.listeners = /* @__PURE__ */ new Map();
        if (_TimeDesignManager.instance) {
          return _TimeDesignManager.instance;
        }
        this.modes = /* @__PURE__ */ new Map();
        this.currentMode = null;
        this.listeners = /* @__PURE__ */ new Map();
        this.userSettings = this.loadUserSettings();
        _TimeDesignManager.instance = this;
      }
      /**
       * シングルトンインスタンスを取得
       * @returns {TimeDesignManager}
       */
      static getInstance() {
        if (!_TimeDesignManager.instance) {
          _TimeDesignManager.instance = new _TimeDesignManager();
        }
        return _TimeDesignManager.instance;
      }
      /**
       * モードを登録
       * @param {string} modeName - モード名
       * @param {typeof BaseMode} ModeClass - モードクラス
       */
      registerMode(modeName, ModeClass) {
        if (!(ModeClass.prototype instanceof BaseMode_js_1.BaseMode)) {
          throw new Error("Mode class must extend BaseMode");
        }
        this.modes.set(modeName, ModeClass);
        console.log(`Registered mode: ${modeName}`);
      }
      /**
       * 利用可能なモードのリストを取得
       * @returns {string[]}
       */
      getAvailableModes() {
        return Array.from(this.modes.keys());
      }
      /**
       * 現在のモードを設定
       * @param {string} modeName - モード名
       * @param {Object} config - モード設定
       */
      setMode(modeName, config = { mode: modeName, parameters: {} }) {
        const ModeClass = this.modes.get(modeName);
        if (!ModeClass) {
          throw new Error(`Mode '${modeName}' is not registered`);
        }
        if (this.currentMode) {
          this.notifyListeners("mode-will-change", {
            oldMode: this.currentMode.config.mode,
            newMode: modeName
          });
        }
        const modeConfig = {
          ...config,
          mode: modeName,
          userSettings: this.userSettings
        };
        this.currentMode = new ModeClass(modeConfig);
        this.userSettings.preferredMode = modeName;
        this.saveUserSettings();
        this.saveConfiguration();
        this.notifyListeners("mode-changed", {
          mode: modeName,
          config: this.currentMode.exportConfig()
        });
        console.log(`Mode changed to: ${modeName}`);
      }
      /**
       * 現在のモードを取得
       * @returns {BaseMode|null}
       */
      getCurrentMode() {
        return this.currentMode;
      }
      /**
       * 現在時刻のAnother Hour時間を計算
       * @param {Date} realTime - 実時間
       * @returns {Date}
       */
      calculateAnotherHourTime(realTime = /* @__PURE__ */ new Date()) {
        if (!this.currentMode) {
          throw new Error("No mode is currently set");
        }
        return this.currentMode.calculateAnotherHourTime(realTime);
      }
      /**
       * 現在のスケールファクターを取得
       * @param {Date} currentTime
       * @returns {number}
       */
      getScaleFactor(currentTime = /* @__PURE__ */ new Date()) {
        if (!this.currentMode) {
          return 1;
        }
        return this.currentMode.calculateScaleFactor(currentTime);
      }
      /**
       * 現在のフェーズを取得
       * @param {Date} currentTime
       * @returns {Object}
       */
      getCurrentPhase(currentTime = /* @__PURE__ */ new Date()) {
        if (!this.currentMode) {
          return { name: "No Mode", progress: 0 };
        }
        return this.currentMode.getCurrentPhase(currentTime);
      }
      /**
       * 時計の角度を取得
       * @param {Date} currentTime
       * @returns {Object}
       */
      getClockAngles(currentTime = /* @__PURE__ */ new Date()) {
        if (!this.currentMode) {
          const hours = currentTime.getHours();
          const minutes = currentTime.getMinutes();
          const seconds = currentTime.getSeconds();
          return {
            hours: (hours % 12 + minutes / 60) * 30,
            minutes: (minutes + seconds / 60) * 6,
            seconds: seconds * 6
          };
        }
        return this.currentMode.getClockAngles(currentTime);
      }
      /**
       * イベントリスナーを追加
       * @param {string} event - イベント名
       * @param {Function} callback - コールバック関数
       */
      addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, /* @__PURE__ */ new Set());
        }
        this.listeners.get(event)?.add(callback);
      }
      /**
       * イベントリスナーを削除
       * @param {string} event
       * @param {Function} callback
       */
      removeEventListener(event, callback) {
        if (this.listeners.has(event)) {
          this.listeners.get(event)?.delete(callback);
        }
      }
      /**
       * リスナーに通知
       * @param {string} event
       * @param {Object} data
       */
      notifyListeners(event, data) {
        if (this.listeners.has(event)) {
          this.listeners.get(event)?.forEach((callback) => {
            try {
              callback(data);
            } catch (error) {
              console.error(`Error in event listener for '${event}':`, error);
            }
          });
        }
      }
      /**
       * ユーザー設定を保存
       */
      saveUserSettings() {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("another-hour-user-settings", JSON.stringify(this.userSettings));
        }
      }
      /**
       * ユーザー設定を読み込み
       * @returns {UserSettings}
       */
      loadUserSettings() {
        if (typeof localStorage !== "undefined") {
          const saved = localStorage.getItem("another-hour-user-settings");
          if (saved) {
            try {
              return { ...time_modes_js_1.DEFAULT_VALUES.user, ...JSON.parse(saved) };
            } catch (error) {
              console.error("Failed to load user settings:", error);
            }
          }
        }
        return { ...time_modes_js_1.DEFAULT_VALUES.user };
      }
      /**
       * ユーザー設定を更新
       * @param {Partial<UserSettings>} updates
       */
      updateUserSettings(updates) {
        this.userSettings = { ...this.userSettings, ...updates };
        this.saveUserSettings();
        if (this.currentMode) {
          const currentConfig = this.currentMode.exportConfig();
          this.setMode(currentConfig.mode, currentConfig);
        }
      }
      /**
       * 設定を保存
       */
      saveConfiguration() {
        if (!this.currentMode)
          return;
        const config = this.currentMode.exportConfig();
        const modeKey = `another-hour-mode-${config.mode}`;
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(modeKey, JSON.stringify(config));
          localStorage.setItem("another-hour-last-mode", config.mode);
        }
      }
      /**
       * 設定を読み込み
       * @param {string} modeName
       * @returns {Object|null}
       */
      loadConfiguration(modeName) {
        if (typeof localStorage !== "undefined") {
          const modeKey = `another-hour-mode-${modeName}`;
          const saved = localStorage.getItem(modeKey);
          if (saved) {
            try {
              return JSON.parse(saved);
            } catch (error) {
              console.error(`Failed to load configuration for ${modeName}:`, error);
            }
          }
        }
        return null;
      }
      /**
       * 初期化
       */
      async initialize() {
        const lastMode = (typeof localStorage !== "undefined" ? localStorage.getItem("another-hour-last-mode") : null) || this.userSettings.preferredMode;
        const savedConfig = this.loadConfiguration(lastMode);
        if (savedConfig && this.modes.has(savedConfig.mode)) {
          try {
            this.setMode(savedConfig.mode, savedConfig);
          } catch (error) {
            console.error("Failed to restore saved mode:", error);
            this.setDefaultMode();
          }
        } else {
          this.setDefaultMode();
        }
      }
      /**
       * デフォルトモードを設定
       */
      setDefaultMode() {
        const preferredMode = this.userSettings.preferredMode;
        if (this.modes.has(preferredMode)) {
          const defaults = this.getDefaultParameters(preferredMode);
          this.setMode(preferredMode, { mode: preferredMode, parameters: defaults });
        } else if (this.modes.has(time_modes_js_1.TimeDesignMode.Classic)) {
          this.setMode(time_modes_js_1.TimeDesignMode.Classic, {
            mode: time_modes_js_1.TimeDesignMode.Classic,
            parameters: time_modes_js_1.DEFAULT_VALUES.classic
          });
        }
      }
      /**
       * モードのデフォルトパラメータを取得
       * @param {string} modeName
       * @returns {Object}
       */
      getDefaultParameters(modeName) {
        switch (modeName) {
          case time_modes_js_1.TimeDesignMode.Classic:
            return time_modes_js_1.DEFAULT_VALUES.classic;
          case time_modes_js_1.TimeDesignMode.CoreTime:
            return time_modes_js_1.DEFAULT_VALUES.coreTime;
          case time_modes_js_1.TimeDesignMode.WakeBased:
            return time_modes_js_1.DEFAULT_VALUES.wakeBased;
          case time_modes_js_1.TimeDesignMode.Solar:
            return time_modes_js_1.DEFAULT_VALUES.solar;
          default:
            return time_modes_js_1.DEFAULT_VALUES.classic;
        }
      }
      /**
       * デバッグ情報を取得
       * @returns {Object}
       */
      getDebugInfo() {
        return {
          userSettings: this.userSettings,
          availableModes: this.getAvailableModes(),
          currentMode: this.currentMode ? this.currentMode.config.mode : "none",
          currentModeDebug: this.currentMode ? this.currentMode.getDebugInfo(/* @__PURE__ */ new Date()) : null,
          listeners: Array.from(this.listeners.entries()).map(([event, callbacks]) => ({
            event,
            count: callbacks.size
          }))
        };
      }
    };
    exports.TimeDesignManager = TimeDesignManager;
    exports.default = TimeDesignManager;
  }
});

// dist/modes/ClassicMode.js
var require_ClassicMode = __commonJS({
  "dist/modes/ClassicMode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClassicMode = void 0;
    var BaseMode_js_1 = require_BaseMode();
    var time_modes_js_1 = require_time_modes();
    var ClassicMode = class extends BaseMode_js_1.BaseMode {
      constructor(config) {
        super(config);
        this.designed24Duration = config.parameters?.designed24Duration || time_modes_js_1.DEFAULT_VALUES.classic.designed24Duration;
        this.dayStartTime = this.parseDayStartTime(config.userSettings?.dayStartTime || time_modes_js_1.DEFAULT_VALUES.user.dayStartTime);
      }
      /**
       * 設定の検証
       */
      validateConfig() {
        super.validateConfig();
        if (this.designed24Duration < 0 || this.designed24Duration > 1440) {
          throw new Error("Designed 24 duration must be between 0 and 24 hours");
        }
      }
      /**
       * タイムライン用のセグメント情報を取得
       */
      getSegments() {
        const designedDuration = this.designed24Duration;
        const anotherHourStart = designedDuration;
        const scaleFactor = designedDuration > 0 ? 1440 / designedDuration : 1;
        return [
          {
            type: "designed",
            label: "Designed 24",
            shortLabel: "D24",
            startMinutes: 0,
            durationMinutes: anotherHourStart,
            scaleFactor
          },
          {
            type: "another",
            label: "Another Hour",
            shortLabel: "AH",
            startMinutes: anotherHourStart,
            durationMinutes: 1440 - anotherHourStart,
            scaleFactor: 1
          }
        ];
      }
      /**
       * UI設定フォーム用のデータを取得
       */
      getConfigUI() {
        return {
          designed24Duration: this.designed24Duration,
          summary: {
            designed24: {
              hours: Math.floor(this.designed24Duration / 60),
              minutes: this.designed24Duration % 60,
              total: this.designed24Duration
            },
            anotherHour: {
              hours: Math.floor((1440 - this.designed24Duration) / 60),
              minutes: (1440 - this.designed24Duration) % 60,
              total: 1440 - this.designed24Duration
            },
            scaleFactor: this.designed24Duration > 0 ? (1440 / this.designed24Duration).toFixed(2) : "1.00"
          }
        };
      }
      /**
       * UI設定フォームからデータを収集
       */
      collectConfigFromUI() {
        return {
          designed24Duration: this.designed24Duration
        };
      }
      /**
       * 一日の開始時刻をパース
       * @param {string} timeStr - HH:mm形式
       * @returns {number} 0時からの分数
       */
      parseDayStartTime(timeStr) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      }
      /**
       * 現在時刻を深夜0時からの分数に変換
       */
      getMinutesSinceMidnight(date) {
        return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
      }
      /**
       * スケールファクターを計算
       * @param {Date} currentTime
       * @returns {number}
       */
      calculateScaleFactor(currentTime) {
        const minutes = this.getMinutesSinceMidnight(currentTime);
        if (minutes < this.designed24Duration) {
          return this.designed24Duration > 0 ? 1440 / this.designed24Duration : 1;
        } else {
          return 1;
        }
      }
      /**
       * 現在のフェーズ（期間）を取得
       * @param {Date} currentTime - 現在時刻
       * @returns {Object} { name: string, progress: number }
       */
      getCurrentPhase(currentTime) {
        const minutes = this.getMinutesSinceMidnight(currentTime);
        const anotherDuration = 1440 - this.designed24Duration;
        if (minutes < this.designed24Duration) {
          return {
            name: "Designed 24",
            progress: minutes / this.designed24Duration
          };
        } else {
          const ahMinutes = minutes - this.designed24Duration;
          return {
            name: "Another Hour",
            progress: ahMinutes / anotherDuration
          };
        }
      }
      /**
       * Another Hour 時間を計算
       * @param {Date} realTime - 実時間
       * @returns {Date} Another Hour 時間
       */
      calculateAnotherHourTime(realTime) {
        const minutes = this.getMinutesSinceMidnight(realTime);
        const scaleFactor = this.calculateScaleFactor(realTime);
        let ahTotalMinutes;
        if (minutes < this.designed24Duration) {
          const scaled = minutes * scaleFactor;
          ahTotalMinutes = scaled;
        } else {
          const ahMinutes2 = minutes - this.designed24Duration;
          ahTotalMinutes = 1440 + ahMinutes2;
        }
        const ahHours = Math.floor(ahTotalMinutes / 60) % 24;
        const ahMinutes = Math.floor(ahTotalMinutes % 60);
        const ahSeconds = Math.floor(ahTotalMinutes * 60 % 60);
        const ahTime = new Date(realTime);
        ahTime.setHours(ahHours, ahMinutes, ahSeconds, 0);
        return ahTime;
      }
      /**
       * Another Hour 時間から実時間への変換
       * @param {Date} anotherHourTime - Another Hour 時間
       * @returns {Date} 実時間
       */
      convertToRealTime(anotherHourTime) {
        const ahMinutes = this.getMinutesSinceMidnight(anotherHourTime);
        let realMinutes;
        if (ahMinutes <= 1440) {
          const scaleFactor = this.designed24Duration > 0 ? this.designed24Duration / 1440 : 1;
          realMinutes = ahMinutes * scaleFactor;
        } else {
          realMinutes = this.designed24Duration + (ahMinutes - 1440);
        }
        const realHours = Math.floor(realMinutes / 60) % 24;
        const realMins = Math.floor(realMinutes % 60);
        const realSecs = Math.floor(realMinutes * 60 % 60);
        const realTime = new Date(anotherHourTime);
        realTime.setHours(realHours, realMins, realSecs, 0);
        return realTime;
      }
      /**
       * ClassicMode用の計算ロジック（JavaScript版互換）
       */
      calculate(date, timezone) {
        const minutes = this.getMinutesSinceMidnight(date);
        const designedDuration = this.designed24Duration;
        const anotherDuration = 1440 - designedDuration;
        const scaleFactor = designedDuration > 0 ? 1440 / designedDuration : 1;
        let hours, minutesOut, seconds, periodName, isAnotherHour, progress, remaining;
        if (minutes < designedDuration) {
          const scaled = minutes * scaleFactor;
          hours = Math.floor(scaled / 60) % 24;
          minutesOut = Math.floor(scaled % 60);
          seconds = Math.floor(scaled * 60 % 60);
          periodName = "Designed 24";
          isAnotherHour = false;
          progress = minutes / designedDuration;
          remaining = designedDuration - minutes;
        } else {
          const ahMinutes = minutes - designedDuration;
          hours = Math.floor(ahMinutes / 60);
          minutesOut = Math.floor(ahMinutes % 60);
          seconds = Math.floor(ahMinutes * 60 % 60);
          periodName = "Another Hour";
          isAnotherHour = true;
          progress = ahMinutes / anotherDuration;
          remaining = anotherDuration - ahMinutes;
        }
        return {
          hours,
          minutes: minutesOut,
          seconds,
          scaleFactor: minutes < designedDuration ? scaleFactor : 1,
          isAnotherHour,
          segmentInfo: {
            type: isAnotherHour ? "another" : "designed",
            label: periodName,
            progress,
            remaining,
            duration: minutes < designedDuration ? designedDuration : anotherDuration
          },
          periodName
        };
      }
    };
    exports.ClassicMode = ClassicMode;
  }
});

// dist/modes/CoreTimeMode.js
var require_CoreTimeMode = __commonJS({
  "dist/modes/CoreTimeMode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CoreTimeMode = void 0;
    var BaseMode_js_1 = require_BaseMode();
    var time_modes_js_1 = require_time_modes();
    var CoreTimeMode = class extends BaseMode_js_1.BaseMode {
      constructor(config) {
        super(config);
        const params = config.parameters;
        const userSettings = config.userSettings;
        this.coreTimeStartStr = params?.coreTimeStart || time_modes_js_1.DEFAULT_VALUES.coreTime.coreTimeStart;
        this.coreTimeEndStr = params?.coreTimeEnd || time_modes_js_1.DEFAULT_VALUES.coreTime.coreTimeEnd;
        this.minCoreHours = params?.minCoreHours || time_modes_js_1.DEFAULT_VALUES.coreTime.minCoreHours;
        this.anotherHourAllocation = params?.anotherHourAllocation ?? time_modes_js_1.DEFAULT_VALUES.coreTime.anotherHourAllocation;
        this.dayStartTime = this.parseTime(userSettings?.dayStartTime || time_modes_js_1.DEFAULT_VALUES.user.dayStartTime);
        this.coreTimeStart = this.parseTime(this.coreTimeStartStr);
        this.coreTimeEnd = this.parseTime(this.coreTimeEndStr);
      }
      /**
       * 設定の検証
       */
      validateConfig() {
        super.validateConfig();
        const coreDuration = (this.coreTimeEnd - this.coreTimeStart + 1440) % 1440;
        if (coreDuration < this.minCoreHours * 60) {
          throw new Error(`Core Time must be at least ${this.minCoreHours} hours`);
        }
        if (this.anotherHourAllocation !== null && this.anotherHourAllocation !== void 0) {
          if (this.anotherHourAllocation < 0 || this.anotherHourAllocation > 720) {
            throw new Error("AnotherHourAllocation must be between 0 and 12 hours");
          }
        } else {
          const totalAH = 1440 - coreDuration;
          if (totalAH > 720) {
            throw new Error("Total Another Hour cannot exceed 12 hours");
          }
        }
      }
      /**
       * HH:mm形式の時刻文字列を0時からの分数に変換
       * @param {string} timeStr
       * @returns {number}
       */
      parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      }
      /**
       * 現在時刻を深夜0時からの分数に変換
       */
      getMinutesSinceMidnight(date) {
        return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
      }
      /**
       * スケールファクターを計算
       * @param {Date} currentTime
       * @returns {number}
       */
      calculateScaleFactor(currentTime) {
        const minutes = this.getMinutesSinceMidnight(currentTime);
        const start = this.coreTimeStart;
        const end = this.coreTimeEnd;
        const coreDuration = (end - start + 1440) % 1440;
        const morningAHRealDuration = (start - 0 + 1440) % 1440;
        const eveningAHRealDuration = (0 - end + 1440) % 1440;
        const totalRealAADuration = morningAHRealDuration + eveningAHRealDuration;
        const targetCoreDuration = 1440 - totalRealAADuration;
        const scaleFactorCore = coreDuration === 0 ? 1 : targetCoreDuration / coreDuration;
        const inCore = start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
        if (inCore) {
          return scaleFactorCore;
        } else {
          return 1;
        }
      }
      /**
       * 現在のフェーズ（期間）を取得
       * @param {Date} currentTime - 現在時刻
       * @returns {Object} { name: string, progress: number }
       */
      getCurrentPhase(currentTime) {
        const minutes = this.getMinutesSinceMidnight(currentTime);
        const start = this.coreTimeStart;
        const end = this.coreTimeEnd;
        const coreDuration = (end - start + 1440) % 1440;
        const morningAHRealDuration = (start - 0 + 1440) % 1440;
        const eveningAHRealDuration = (0 - end + 1440) % 1440;
        const inCore = start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
        if (inCore) {
          const elapsed = (minutes - start + 1440) % 1440;
          const progress = coreDuration > 0 ? elapsed / coreDuration : 0;
          return {
            name: "Core Time",
            progress
          };
        } else {
          const inMorning = minutes < start && start <= end || start > end && minutes >= end && minutes < start;
          if (inMorning) {
            const elapsed = (minutes - 0 + 1440) % 1440;
            const progress = morningAHRealDuration > 0 ? elapsed / morningAHRealDuration : 0;
            return {
              name: "Morning AH",
              progress
            };
          } else {
            const elapsed = (minutes - end + 1440) % 1440;
            const progress = eveningAHRealDuration > 0 ? elapsed / eveningAHRealDuration : 0;
            return {
              name: "Evening AH",
              progress
            };
          }
        }
      }
      /**
       * Another Hour 時間を計算
       * @param {Date} realTime - 実時間
       * @returns {Date} Another Hour 時間
       */
      calculateAnotherHourTime(realTime) {
        const result = this.calculate(realTime);
        const ahTime = new Date(realTime);
        ahTime.setHours(result.hours, result.minutes, result.seconds, 0);
        return ahTime;
      }
      /**
       * Another Hour 時間から実時間への変換
       * @param {Date} anotherHourTime - Another Hour 時間
       * @returns {Date} 実時間
       */
      convertToRealTime(anotherHourTime) {
        return anotherHourTime;
      }
      /**
       * CoreTimeMode用の計算ロジック（JavaScript版互換）
       */
      calculate(date, timezone) {
        const minutes = this.getMinutesSinceMidnight(date);
        const start = this.coreTimeStart;
        const end = this.coreTimeEnd;
        const coreDuration = (end - start + 1440) % 1440;
        const morningAHRealDuration = (start - 0 + 1440) % 1440;
        const eveningAHRealDuration = (0 - end + 1440) % 1440;
        const totalRealAADuration = morningAHRealDuration + eveningAHRealDuration;
        const targetCoreDuration = 1440 - totalRealAADuration;
        const scaleFactorCore = coreDuration === 0 ? 1 : targetCoreDuration / coreDuration;
        let periodName, isAnotherHour, progress, remaining, scaleFactor, ahMinutes;
        const inCore = start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
        if (inCore) {
          periodName = "Core Time";
          isAnotherHour = false;
          const elapsed = (minutes - start + 1440) % 1440;
          progress = coreDuration > 0 ? elapsed / coreDuration : 0;
          remaining = coreDuration - elapsed;
          scaleFactor = scaleFactorCore;
          ahMinutes = morningAHRealDuration + elapsed * scaleFactorCore;
        } else {
          const inMorning = minutes < start && start <= end || start > end && minutes >= end && minutes < start;
          if (inMorning) {
            periodName = "Morning AH";
            isAnotherHour = true;
            const elapsed = (minutes - 0 + 1440) % 1440;
            progress = morningAHRealDuration > 0 ? elapsed / morningAHRealDuration : 0;
            remaining = morningAHRealDuration - elapsed;
            scaleFactor = 1;
            ahMinutes = elapsed;
          } else {
            periodName = "Evening AH";
            isAnotherHour = true;
            const elapsed = (minutes - end + 1440) % 1440;
            progress = eveningAHRealDuration > 0 ? elapsed / eveningAHRealDuration : 0;
            remaining = eveningAHRealDuration - elapsed;
            scaleFactor = 1;
            ahMinutes = morningAHRealDuration + coreDuration * scaleFactorCore + elapsed;
          }
        }
        const hours = Math.floor(ahMinutes / 60) % 24;
        const minutesOut = Math.floor(ahMinutes % 60);
        const seconds = Math.floor(ahMinutes * 60 % 60);
        const duration = isAnotherHour ? periodName === "Morning AH" ? morningAHRealDuration : eveningAHRealDuration : coreDuration;
        return {
          hours,
          minutes: minutesOut,
          seconds,
          scaleFactor,
          isAnotherHour,
          segmentInfo: {
            type: isAnotherHour ? "another" : "designed",
            label: periodName,
            progress,
            remaining,
            duration
          },
          periodName
        };
      }
      /**
       * タイムライン用のセグメント情報を取得
       */
      getSegments() {
        const coreStart = this.coreTimeStart;
        const coreEnd = this.coreTimeEnd;
        const coreDuration = coreEnd - coreStart;
        if (coreDuration <= 0)
          return [];
        const coreScaleFactor = 24 * 60 / coreDuration;
        const segments = [
          {
            type: "another",
            label: "Morning AH",
            shortLabel: "AM",
            startMinutes: 0,
            durationMinutes: coreStart,
            scaleFactor: 1
          },
          {
            type: "designed",
            label: "Core Time",
            shortLabel: "Core",
            startMinutes: coreStart,
            durationMinutes: coreDuration,
            scaleFactor: coreScaleFactor
          },
          {
            type: "another",
            label: "Evening AH",
            shortLabel: "PM",
            startMinutes: coreEnd,
            durationMinutes: 1440 - coreEnd,
            scaleFactor: 1
          }
        ];
        return segments.filter((s) => s.durationMinutes > 0);
      }
      /**
       * UI設定フォーム用のデータを取得
       */
      getConfigUI() {
        return {
          coreTimeStart: this.coreTimeStartStr,
          coreTimeEnd: this.coreTimeEndStr,
          minCoreHours: this.minCoreHours,
          anotherHourAllocation: this.anotherHourAllocation,
          summary: {
            coreDuration: this.coreTimeEnd - this.coreTimeStart,
            morningAH: this.coreTimeStart,
            eveningAH: 1440 - this.coreTimeEnd
          }
        };
      }
      /**
       * UI設定フォームからデータを収集
       */
      collectConfigFromUI() {
        return {
          coreTimeStart: this.coreTimeStartStr,
          coreTimeEnd: this.coreTimeEndStr,
          minCoreHours: this.minCoreHours,
          anotherHourAllocation: this.anotherHourAllocation
        };
      }
    };
    exports.CoreTimeMode = CoreTimeMode;
  }
});

// ../../node_modules/suncalc/suncalc.js
var require_suncalc = __commonJS({
  "../../node_modules/suncalc/suncalc.js"(exports, module) {
    (function() {
      "use strict";
      var PI = Math.PI, sin = Math.sin, cos = Math.cos, tan = Math.tan, asin = Math.asin, atan = Math.atan2, acos = Math.acos, rad = PI / 180;
      var dayMs = 1e3 * 60 * 60 * 24, J1970 = 2440588, J2000 = 2451545;
      function toJulian(date) {
        return date.valueOf() / dayMs - 0.5 + J1970;
      }
      function fromJulian(j) {
        return new Date((j + 0.5 - J1970) * dayMs);
      }
      function toDays(date) {
        return toJulian(date) - J2000;
      }
      var e = rad * 23.4397;
      function rightAscension(l, b) {
        return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
      }
      function declination(l, b) {
        return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
      }
      function azimuth(H, phi, dec) {
        return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
      }
      function altitude(H, phi, dec) {
        return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
      }
      function siderealTime(d, lw) {
        return rad * (280.16 + 360.9856235 * d) - lw;
      }
      function astroRefraction(h) {
        if (h < 0)
          h = 0;
        return 2967e-7 / Math.tan(h + 312536e-8 / (h + 0.08901179));
      }
      function solarMeanAnomaly(d) {
        return rad * (357.5291 + 0.98560028 * d);
      }
      function eclipticLongitude(M) {
        var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 3e-4 * sin(3 * M)), P = rad * 102.9372;
        return M + C + P + PI;
      }
      function sunCoords(d) {
        var M = solarMeanAnomaly(d), L = eclipticLongitude(M);
        return {
          dec: declination(L, 0),
          ra: rightAscension(L, 0)
        };
      }
      var SunCalc = {};
      SunCalc.getPosition = function(date, lat, lng) {
        var lw = rad * -lng, phi = rad * lat, d = toDays(date), c = sunCoords(d), H = siderealTime(d, lw) - c.ra;
        return {
          azimuth: azimuth(H, phi, c.dec),
          altitude: altitude(H, phi, c.dec)
        };
      };
      var times = SunCalc.times = [
        [-0.833, "sunrise", "sunset"],
        [-0.3, "sunriseEnd", "sunsetStart"],
        [-6, "dawn", "dusk"],
        [-12, "nauticalDawn", "nauticalDusk"],
        [-18, "nightEnd", "night"],
        [6, "goldenHourEnd", "goldenHour"]
      ];
      SunCalc.addTime = function(angle, riseName, setName) {
        times.push([angle, riseName, setName]);
      };
      var J0 = 9e-4;
      function julianCycle(d, lw) {
        return Math.round(d - J0 - lw / (2 * PI));
      }
      function approxTransit(Ht, lw, n) {
        return J0 + (Ht + lw) / (2 * PI) + n;
      }
      function solarTransitJ(ds, M, L) {
        return J2000 + ds + 53e-4 * sin(M) - 69e-4 * sin(2 * L);
      }
      function hourAngle(h, phi, d) {
        return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
      }
      function observerAngle(height) {
        return -2.076 * Math.sqrt(height) / 60;
      }
      function getSetJ(h, lw, phi, dec, n, M, L) {
        var w = hourAngle(h, phi, dec), a = approxTransit(w, lw, n);
        return solarTransitJ(a, M, L);
      }
      SunCalc.getTimes = function(date, lat, lng, height) {
        height = height || 0;
        var lw = rad * -lng, phi = rad * lat, dh = observerAngle(height), d = toDays(date), n = julianCycle(d, lw), ds = approxTransit(0, lw, n), M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L, 0), Jnoon = solarTransitJ(ds, M, L), i, len, time, h0, Jset, Jrise;
        var result = {
          solarNoon: fromJulian(Jnoon),
          nadir: fromJulian(Jnoon - 0.5)
        };
        for (i = 0, len = times.length; i < len; i += 1) {
          time = times[i];
          h0 = (time[0] + dh) * rad;
          Jset = getSetJ(h0, lw, phi, dec, n, M, L);
          Jrise = Jnoon - (Jset - Jnoon);
          result[time[1]] = fromJulian(Jrise);
          result[time[2]] = fromJulian(Jset);
        }
        return result;
      };
      function moonCoords(d) {
        var L = rad * (218.316 + 13.176396 * d), M = rad * (134.963 + 13.064993 * d), F = rad * (93.272 + 13.22935 * d), l = L + rad * 6.289 * sin(M), b = rad * 5.128 * sin(F), dt = 385001 - 20905 * cos(M);
        return {
          ra: rightAscension(l, b),
          dec: declination(l, b),
          dist: dt
        };
      }
      SunCalc.getMoonPosition = function(date, lat, lng) {
        var lw = rad * -lng, phi = rad * lat, d = toDays(date), c = moonCoords(d), H = siderealTime(d, lw) - c.ra, h = altitude(H, phi, c.dec), pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));
        h = h + astroRefraction(h);
        return {
          azimuth: azimuth(H, phi, c.dec),
          altitude: h,
          distance: c.dist,
          parallacticAngle: pa
        };
      };
      SunCalc.getMoonIllumination = function(date) {
        var d = toDays(date || /* @__PURE__ */ new Date()), s = sunCoords(d), m = moonCoords(d), sdist = 149598e3, phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)), inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)), angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
        return {
          fraction: (1 + cos(inc)) / 2,
          phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
          angle
        };
      };
      function hoursLater(date, h) {
        return new Date(date.valueOf() + h * dayMs / 24);
      }
      SunCalc.getMoonTimes = function(date, lat, lng, inUTC) {
        var t = new Date(date);
        if (inUTC) t.setUTCHours(0, 0, 0, 0);
        else t.setHours(0, 0, 0, 0);
        var hc = 0.133 * rad, h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc, h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;
        for (var i = 1; i <= 24; i += 2) {
          h1 = SunCalc.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
          h2 = SunCalc.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;
          a = (h0 + h2) / 2 - h1;
          b = (h2 - h0) / 2;
          xe = -b / (2 * a);
          ye = (a * xe + b) * xe + h1;
          d = b * b - 4 * a * h1;
          roots = 0;
          if (d >= 0) {
            dx = Math.sqrt(d) / (Math.abs(a) * 2);
            x1 = xe - dx;
            x2 = xe + dx;
            if (Math.abs(x1) <= 1) roots++;
            if (Math.abs(x2) <= 1) roots++;
            if (x1 < -1) x1 = x2;
          }
          if (roots === 1) {
            if (h0 < 0) rise = i + x1;
            else set = i + x1;
          } else if (roots === 2) {
            rise = i + (ye < 0 ? x2 : x1);
            set = i + (ye < 0 ? x1 : x2);
          }
          if (rise && set) break;
          h0 = h2;
        }
        var result = {};
        if (rise) result.rise = hoursLater(t, rise);
        if (set) result.set = hoursLater(t, set);
        if (!rise && !set) result[ye > 0 ? "alwaysUp" : "alwaysDown"] = true;
        return result;
      };
      if (typeof exports === "object" && typeof module !== "undefined") module.exports = SunCalc;
      else if (typeof define === "function" && define.amd) define(SunCalc);
      else window.SunCalc = SunCalc;
    })();
  }
});

// dist/modes/SolarMode.js
var require_SolarMode = __commonJS({
  "dist/modes/SolarMode.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    }();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SolarMode = void 0;
    var BaseMode_js_1 = require_BaseMode();
    var time_modes_js_1 = require_time_modes();
    var SunCalc = __importStar(require_suncalc());
    var SolarMode = class extends BaseMode_js_1.BaseMode {
      constructor(config) {
        super(config);
        const params = config.parameters;
        this.location = params?.location || { city: "Tokyo", latitude: 35.6762, longitude: 139.6503 };
        this.dayHoursTarget = params?.dayHoursTarget || time_modes_js_1.DEFAULT_VALUES.solar.dayHoursTarget;
        this.seasonalAdjustment = params?.seasonalAdjustment ?? time_modes_js_1.DEFAULT_VALUES.solar.seasonalAdjustment;
        this.updateSolarTimes();
      }
      /**
       * 3日分の太陽時間情報を更新
       */
      updateSolarTimes() {
        const today = /* @__PURE__ */ new Date();
        const yesterday = /* @__PURE__ */ new Date();
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = /* @__PURE__ */ new Date();
        tomorrow.setDate(today.getDate() + 1);
        this.todaySolarTimes = SunCalc.getTimes(today, this.location.latitude, this.location.longitude);
        this.yesterdaySolarTimes = SunCalc.getTimes(yesterday, this.location.latitude, this.location.longitude);
        this.tomorrowSolarTimes = SunCalc.getTimes(tomorrow, this.location.latitude, this.location.longitude);
      }
      /**
       * スケールファクターを計算
       * @param {Date} currentTime
       * @returns {number}
       */
      calculateScaleFactor(currentTime) {
        const result = this.calculate(currentTime);
        return result.scaleFactor;
      }
      /**
       * 現在のフェーズ（期間）を取得
       * @param {Date} currentTime - 現在時刻
       * @returns {Object} { name: string, progress: number }
       */
      getCurrentPhase(currentTime) {
        const result = this.calculate(currentTime);
        const nowTs = currentTime.getTime();
        const sunriseTs = this.todaySolarTimes.sunrise.getTime();
        const sunsetTs = this.todaySolarTimes.sunset.getTime();
        let progress = 0;
        if (nowTs >= sunriseTs && nowTs < sunsetTs) {
          progress = (nowTs - sunriseTs) / (sunsetTs - sunriseTs);
        } else {
          if (nowTs < sunriseTs) {
            const nightStartTs = this.yesterdaySolarTimes.sunset.getTime();
            progress = (nowTs - nightStartTs) / (sunriseTs - nightStartTs);
          } else {
            const nightEndTs = this.tomorrowSolarTimes.sunrise.getTime();
            progress = (nowTs - sunsetTs) / (nightEndTs - sunsetTs);
          }
        }
        return {
          name: result.periodName,
          progress: Math.max(0, Math.min(1, progress))
        };
      }
      /**
       * SolarMode用の計算ロジック（JavaScript版互換）
       */
      calculate(date, timezone) {
        this.updateSolarTimes();
        const { dayHoursTarget: designedDayHours } = { dayHoursTarget: this.dayHoursTarget };
        const nowTs = date.getTime();
        const sunriseTs = this.todaySolarTimes.sunrise.getTime();
        const sunsetTs = this.todaySolarTimes.sunset.getTime();
        const solarNoonTs = this.todaySolarTimes.solarNoon.getTime();
        const designedDayMinutes = designedDayHours * 60;
        const designedNightMinutes = (24 - designedDayHours) * 60;
        const ahDayStartMinutes = 12 * 60 - designedDayMinutes / 2;
        const ahNoonMinutes = 12 * 60;
        const ahDayEndMinutes = 12 * 60 + designedDayMinutes / 2;
        let ahTotalMinutes, scaleFactor, periodName;
        if (nowTs >= sunriseTs && nowTs < sunsetTs) {
          periodName = nowTs <= solarNoonTs ? "Day (Morning)" : "Day (Afternoon)";
          const actualDaylightMs = sunsetTs - sunriseTs;
          scaleFactor = actualDaylightMs > 0 ? designedDayMinutes * 60 * 1e3 / actualDaylightMs : 1;
          if (nowTs <= solarNoonTs) {
            const realMorningMs = solarNoonTs - sunriseTs;
            const progress = realMorningMs > 0 ? (nowTs - sunriseTs) / realMorningMs : 0;
            ahTotalMinutes = ahDayStartMinutes + progress * (designedDayMinutes / 2);
          } else {
            const realAfternoonMs = sunsetTs - solarNoonTs;
            const progress = realAfternoonMs > 0 ? (nowTs - solarNoonTs) / realAfternoonMs : 0;
            ahTotalMinutes = ahNoonMinutes + progress * (designedDayMinutes / 2);
          }
        } else {
          let nightStartTs, nightEndTs;
          if (nowTs < sunriseTs) {
            periodName = "Night (Pre-dawn)";
            nightStartTs = this.yesterdaySolarTimes.sunset.getTime();
            nightEndTs = sunriseTs;
          } else {
            periodName = "Night (Evening)";
            nightStartTs = sunsetTs;
            nightEndTs = this.tomorrowSolarTimes.sunrise.getTime();
          }
          const actualNightMs = nightEndTs - nightStartTs;
          scaleFactor = actualNightMs > 0 ? designedNightMinutes * 60 * 1e3 / actualNightMs : 1;
          const elapsedRealNightMs = nowTs - nightStartTs;
          const progress = actualNightMs > 0 ? elapsedRealNightMs / actualNightMs : 0;
          ahTotalMinutes = ahDayEndMinutes + progress * designedNightMinutes;
        }
        ahTotalMinutes = (ahTotalMinutes % 1440 + 1440) % 1440;
        const hours = Math.floor(ahTotalMinutes / 60);
        const minutes = Math.floor(ahTotalMinutes % 60);
        const seconds = Math.floor(ahTotalMinutes * 60 % 60);
        return {
          hours,
          minutes,
          seconds,
          scaleFactor,
          isAnotherHour: false,
          segmentInfo: { label: periodName },
          periodName
        };
      }
      /**
       * タイムライン用のセグメント情報を取得
       */
      getSegments() {
        const sunriseMinutes = this.todaySolarTimes.sunrise.getHours() * 60 + this.todaySolarTimes.sunrise.getMinutes();
        const sunsetMinutes = this.todaySolarTimes.sunset.getHours() * 60 + this.todaySolarTimes.sunset.getMinutes();
        const segments = [];
        if (sunriseMinutes > 0) {
          segments.push({
            type: "night",
            label: "Night",
            shortLabel: "Night",
            startMinutes: 0,
            durationMinutes: sunriseMinutes,
            style: {
              background: "linear-gradient(to right, #1A237E, #283593)"
            }
          });
        }
        segments.push({
          type: "day",
          label: "Day",
          shortLabel: "Day",
          startMinutes: sunriseMinutes,
          durationMinutes: sunsetMinutes - sunriseMinutes,
          style: {
            background: "linear-gradient(to right, #FFB300, #FFD600, #FFB300)"
          }
        });
        if (sunsetMinutes < 24 * 60) {
          segments.push({
            type: "night",
            label: "Night",
            shortLabel: "Night",
            startMinutes: sunsetMinutes,
            durationMinutes: 24 * 60 - sunsetMinutes,
            style: {
              background: "linear-gradient(to right, #283593, #1A237E)"
            }
          });
        }
        return segments;
      }
      /**
       * UI設定フォーム用のデータを取得
       */
      getConfigUI() {
        const sunTimes = {
          sunrise: this.todaySolarTimes.sunrise,
          solarNoon: this.todaySolarTimes.solarNoon,
          sunset: this.todaySolarTimes.sunset,
          daylightMinutes: (this.todaySolarTimes.sunset.getTime() - this.todaySolarTimes.sunrise.getTime()) / (1e3 * 60)
        };
        return {
          location: this.location,
          dayHoursTarget: this.dayHoursTarget,
          seasonalAdjustment: this.seasonalAdjustment,
          solarInfo: sunTimes
        };
      }
      /**
       * UI設定フォームからデータを収集
       */
      collectConfigFromUI() {
        return {
          location: this.location,
          dayHoursTarget: this.dayHoursTarget,
          seasonalAdjustment: this.seasonalAdjustment
        };
      }
      /**
       * 設定の検証
       */
      validateConfig() {
        super.validateConfig();
        if (!this.location) {
          throw new Error("Location is required for Solar Mode");
        }
        if (this.location.latitude < -90 || this.location.latitude > 90) {
          throw new Error("Latitude must be between -90 and 90 degrees");
        }
        if (this.location.longitude < -180 || this.location.longitude > 180) {
          throw new Error("Longitude must be between -180 and 180 degrees");
        }
        if (this.dayHoursTarget < 1 || this.dayHoursTarget > 23) {
          throw new Error("Day hours target must be between 1 and 23");
        }
      }
      calculateAnotherHourTime(realTime) {
        const phase = this.getCurrentPhase(realTime);
        const { progress } = phase;
        const AH_SUNRISE = 6 * 60;
        const AH_SOLAR_NOON = 12 * 60;
        const AH_SUNSET = 18 * 60;
        const AH_MIDNIGHT = 24 * 60;
        let ahTotalMinutes;
        switch (phase.name) {
          case "Day (AM)":
            ahTotalMinutes = AH_SUNRISE + progress * (AH_SOLAR_NOON - AH_SUNRISE);
            break;
          case "Day (PM)":
            ahTotalMinutes = AH_SOLAR_NOON + progress * (AH_SUNSET - AH_SOLAR_NOON);
            break;
          case "Night (Part 1)":
            ahTotalMinutes = AH_SUNSET + progress * (AH_MIDNIGHT - AH_SUNSET);
            break;
          case "Night (Part 2)":
            ahTotalMinutes = 0 + progress * (AH_SUNRISE - 0);
            break;
          default:
            ahTotalMinutes = 12 * 60;
            break;
        }
        const ahTime = new Date(realTime);
        ahTime.setUTCHours(Math.floor(ahTotalMinutes / 60) % 24, Math.floor(ahTotalMinutes % 60), Math.floor(ahTotalMinutes * 60 % 60));
        return ahTime;
      }
      convertToRealTime(anotherHourTime) {
        const ahTotalMinutes = anotherHourTime.getUTCHours() * 60 + anotherHourTime.getUTCMinutes() + anotherHourTime.getUTCSeconds() / 60;
        const AH_SUNRISE = 6 * 60;
        const AH_SOLAR_NOON = 12 * 60;
        const AH_SUNSET = 18 * 60;
        const { sunrise, sunset, solarNoon } = this.todaySolarTimes;
        const previousSunset = this.yesterdaySolarTimes.sunset;
        const nextSunrise = this.tomorrowSolarTimes.sunrise;
        let realTimeMs;
        let progress;
        if (ahTotalMinutes < AH_SUNRISE) {
          progress = ahTotalMinutes / AH_SUNRISE;
          realTimeMs = previousSunset.getTime() + progress * (sunrise.getTime() - previousSunset.getTime());
        } else if (ahTotalMinutes < AH_SOLAR_NOON) {
          progress = (ahTotalMinutes - AH_SUNRISE) / (AH_SOLAR_NOON - AH_SUNRISE);
          realTimeMs = sunrise.getTime() + progress * (solarNoon.getTime() - sunrise.getTime());
        } else if (ahTotalMinutes < AH_SUNSET) {
          progress = (ahTotalMinutes - AH_SOLAR_NOON) / (AH_SUNSET - AH_SOLAR_NOON);
          realTimeMs = solarNoon.getTime() + progress * (sunset.getTime() - solarNoon.getTime());
        } else {
          progress = (ahTotalMinutes - AH_SUNSET) / (24 * 60 - AH_SUNSET);
          realTimeMs = sunset.getTime() + progress * (nextSunrise.getTime() - sunset.getTime());
        }
        return new Date(realTimeMs);
      }
      getDebugInfo(currentTime) {
        return {
          mode: this.config.mode,
          config: this.exportConfig(),
          location: this.location,
          dayHoursTarget: this.dayHoursTarget,
          solarTimes: {
            sunrise: this.todaySolarTimes.sunrise.toLocaleString(),
            sunset: this.todaySolarTimes.sunset.toLocaleString(),
            solarNoon: this.todaySolarTimes.solarNoon.toLocaleString()
          },
          scaleFactor: this.calculateScaleFactor(currentTime),
          currentPhase: this.getCurrentPhase(currentTime)
        };
      }
    };
    exports.SolarMode = SolarMode;
  }
});

// dist/modes/WakeBasedMode.js
var require_WakeBasedMode = __commonJS({
  "dist/modes/WakeBasedMode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WakeBasedMode = void 0;
    var BaseMode_js_1 = require_BaseMode();
    var WakeBasedMode = class extends BaseMode_js_1.BaseMode {
      constructor(config) {
        super(config);
        this.defaultWakeTime = config.parameters?.defaultWakeTime || "07:00";
        this.todayWakeTime = config.parameters?.todayWakeTime || null;
        const effectiveWakeTime = this.todayWakeTime || this.defaultWakeTime;
        this.wakeTime = this.convertTimeStrToMinutes(effectiveWakeTime);
        this.anotherHourDuration = config.parameters?.anotherHourDuration || 60;
        this.maxScaleFactor = config.parameters?.maxScaleFactor || 3;
      }
      convertTimeStrToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      }
      /**
       * 現在時刻を深夜0時からの分数に変換
       */
      getMinutesSinceMidnight(date) {
        return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
      }
      /**
       * セグメント構築
       */
      buildSegments() {
        const wakeTimeMinutes = this.wakeTime;
        const ahDuration = this.anotherHourDuration;
        const totalActivityMinutes = 1440 - wakeTimeMinutes;
        const designedRealDuration = totalActivityMinutes - ahDuration;
        if (designedRealDuration <= 0)
          return [];
        const scaleFactor = totalActivityMinutes / designedRealDuration;
        const anotherHourStart = 1440 - ahDuration;
        const segments = [
          {
            type: "another",
            startTime: 0,
            endTime: wakeTimeMinutes,
            duration: wakeTimeMinutes,
            scaleFactor: 1,
            label: "Night"
          },
          {
            type: "designed",
            startTime: wakeTimeMinutes,
            endTime: anotherHourStart,
            duration: designedRealDuration,
            scaleFactor,
            label: "Designed Day"
          },
          {
            type: "another",
            startTime: anotherHourStart,
            endTime: 1440,
            duration: ahDuration,
            scaleFactor: 1,
            label: "Another Hour"
          }
        ];
        return segments.filter((s) => s.duration > 0);
      }
      /**
       * アクティブセグメントを見つける
       */
      findActiveSegment(currentMinutes) {
        const segments = this.buildSegments();
        return segments.find((segment) => currentMinutes >= segment.startTime && currentMinutes < segment.endTime);
      }
      /**
       * 進行状況を計算
       */
      calculateProgress(currentMinutes, segment) {
        if (!segment)
          return { progress: 0, remaining: 0, duration: 0 };
        const elapsed = currentMinutes - segment.startTime;
        const progress = elapsed / segment.duration;
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
      getCurrentPhase(currentTime) {
        const realMinutes = this.getMinutesSinceMidnight(currentTime);
        const activeSegment = this.findActiveSegment(realMinutes);
        if (!activeSegment) {
          return { name: "Night", progress: 0 };
        }
        const { progress } = this.calculateProgress(realMinutes, activeSegment);
        return {
          name: activeSegment.label,
          progress
        };
      }
      /**
       * WakeBasedMode用の計算ロジック（JavaScript版互換）
       */
      calculate(date, timezone) {
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
            segmentInfo: { type: "another", label: "Error" }
          };
        }
        let displayHours, displayMinutes, displaySeconds;
        const { progress, remaining, duration } = this.calculateProgress(realMinutes, activeSegment);
        if (activeSegment.type === "another") {
          const segmentElapsed2 = realMinutes - activeSegment.startTime;
          displayHours = Math.floor(segmentElapsed2 / 60);
          displayMinutes = Math.floor(segmentElapsed2 % 60);
          displaySeconds = Math.floor(segmentElapsed2 * 60 % 60);
        } else {
          const elapsedRealMinutesInPeriod = realMinutes - wakeTimeMinutes;
          const scaledElapsedMinutes = elapsedRealMinutesInPeriod * activeSegment.scaleFactor;
          const scaledElapsedSeconds = scaledElapsedMinutes * 60 + date.getSeconds() * activeSegment.scaleFactor;
          const wakeTimeSeconds = wakeTimeMinutes * 60;
          const displayTotalSeconds = wakeTimeSeconds + scaledElapsedSeconds;
          displayHours = Math.floor(displayTotalSeconds / 3600) % 24;
          displayMinutes = Math.floor(displayTotalSeconds % 3600 / 60);
          displaySeconds = Math.floor(displayTotalSeconds % 60);
        }
        const totalActivityMinutes = 1440 - wakeTimeMinutes;
        const segmentDuration = activeSegment.label === "Designed Day" ? totalActivityMinutes : activeSegment.duration;
        const segmentElapsed = activeSegment.type === "another" ? realMinutes - activeSegment.startTime : void 0;
        return {
          hours: displayHours,
          minutes: displayMinutes,
          seconds: displaySeconds,
          scaleFactor: activeSegment.scaleFactor,
          isAnotherHour: activeSegment.type === "another",
          segmentInfo: {
            type: activeSegment.type,
            label: activeSegment.label,
            progress,
            remaining,
            duration: segmentDuration,
            // Another Hour用の追加情報
            elapsed: segmentElapsed,
            total: activeSegment.type === "another" ? activeSegment.duration : void 0,
            displayFormat: activeSegment.type === "another" ? "fraction" : "normal"
          },
          periodName: activeSegment.label
        };
      }
      /**
       * タイムライン用のセグメント情報を取得
       */
      getSegments() {
        const segments = this.buildSegments();
        return segments.map((segment) => ({
          type: segment.type,
          label: segment.label,
          shortLabel: segment.type === "designed" ? "Day" : segment.label === "Night" ? "Night" : "AH",
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
            designedDuration: 1440 - this.wakeTime - this.anotherHourDuration,
            scaleFactor: (1440 - this.wakeTime) / (1440 - this.wakeTime - this.anotherHourDuration)
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
          throw new Error("Another Hour duration must be between 0 and 720 minutes");
        }
        if (this.maxScaleFactor < 1 || this.maxScaleFactor > 5) {
          throw new Error("Max scale factor must be between 1.0 and 5.0");
        }
        const activityMinutes = 1440 - this.wakeTime;
        if (this.anotherHourDuration >= activityMinutes) {
          throw new Error("Another Hour duration must be less than the total activity time");
        }
      }
      getCurrentPhaseOld(currentTime) {
        const realMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const anotherHourStart = 1440 - this.anotherHourDuration;
        if (realMinutes < this.wakeTime) {
          const nightDuration = this.wakeTime;
          const elapsed = realMinutes;
          return { name: "Night", progress: nightDuration > 0 ? elapsed / nightDuration : 1 };
        } else if (realMinutes >= anotherHourStart) {
          const elapsed = realMinutes - anotherHourStart;
          return { name: "Another Hour", progress: this.anotherHourDuration > 0 ? elapsed / this.anotherHourDuration : 1 };
        } else {
          const designedDayDuration = anotherHourStart - this.wakeTime;
          const elapsed = realMinutes - this.wakeTime;
          return { name: "Designed Day", progress: designedDayDuration > 0 ? elapsed / designedDayDuration : 1 };
        }
      }
      calculateScaleFactor(currentTime) {
        const phase = this.getCurrentPhase(currentTime);
        if (phase.name !== "Designed Day") {
          return 1;
        }
        const totalActivityMinutes = 1440 - this.wakeTime;
        const designedRealDuration = totalActivityMinutes - this.anotherHourDuration;
        if (designedRealDuration <= 0) {
          return 1;
        }
        const scaleFactor = totalActivityMinutes / designedRealDuration;
        return Math.min(scaleFactor, this.maxScaleFactor);
      }
      calculateAnotherHourTime(realTime) {
        const realMinutes = realTime.getHours() * 60 + realTime.getMinutes() + realTime.getSeconds() / 60;
        const phase = this.getCurrentPhase(realTime);
        const scaleFactor = this.calculateScaleFactor(realTime);
        let ahTotalMinutes;
        const anotherHourStart = 1440 - this.anotherHourDuration;
        if (phase.name === "Night") {
          ahTotalMinutes = realMinutes;
        } else if (phase.name === "Designed Day") {
          const elapsedRealMinutesInDay = realMinutes - this.wakeTime;
          const scaledElapsedMinutes = elapsedRealMinutesInDay * scaleFactor;
          ahTotalMinutes = this.wakeTime + scaledElapsedMinutes;
        } else {
          const designedDayRealDuration = anotherHourStart - this.wakeTime;
          const designedDayAHDuration = designedDayRealDuration * this.calculateScaleFactor(new Date(realTime.getTime() - this.anotherHourDuration * 60 * 1e3));
          const elapsedInAnotherHour = realMinutes - anotherHourStart;
          ahTotalMinutes = this.wakeTime + designedDayAHDuration + elapsedInAnotherHour;
        }
        const ahTime = new Date(realTime);
        const totalHours = Math.floor(ahTotalMinutes / 60);
        ahTime.setHours(totalHours);
        ahTime.setMinutes(Math.floor(ahTotalMinutes % 60));
        ahTime.setSeconds(Math.floor(ahTotalMinutes * 60 % 60));
        const normalizedHours = ahTime.getHours() % 24;
        ahTime.setHours(normalizedHours);
        return ahTime;
      }
      convertToRealTime(anotherHourTime) {
        const ahTotalMinutes = anotherHourTime.getHours() * 60 + anotherHourTime.getMinutes() + anotherHourTime.getSeconds() / 60;
        const tempDate = /* @__PURE__ */ new Date();
        const anotherHourStart = 1440 - this.anotherHourDuration;
        const middleOfDesignedDay = this.wakeTime + (anotherHourStart - this.wakeTime) / 2;
        tempDate.setHours(Math.floor(middleOfDesignedDay / 60), middleOfDesignedDay % 60, 0, 0);
        const scaleFactor = this.calculateScaleFactor(tempDate);
        if (scaleFactor === 0)
          return anotherHourTime;
        const designedDayRealDuration = anotherHourStart - this.wakeTime;
        const designedDayAHDuration = designedDayRealDuration * scaleFactor;
        const ahDesignedDayEnd = this.wakeTime + designedDayAHDuration;
        let realMinutes;
        if (ahTotalMinutes < this.wakeTime) {
          realMinutes = ahTotalMinutes;
        } else if (ahTotalMinutes < ahDesignedDayEnd) {
          const elapsedAHInDay = ahTotalMinutes - this.wakeTime;
          const elapsedRealInDay = elapsedAHInDay / scaleFactor;
          realMinutes = this.wakeTime + elapsedRealInDay;
        } else {
          const elapsedInAnotherHourSegment_AH = ahTotalMinutes - ahDesignedDayEnd;
          realMinutes = anotherHourStart + elapsedInAnotherHourSegment_AH;
        }
        const realTime = new Date(anotherHourTime);
        realTime.setHours(Math.floor(realMinutes / 60), Math.floor(realMinutes % 60), Math.floor(realMinutes * 60 % 60));
        return realTime;
      }
      getDebugInfo(currentTime) {
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
    };
    exports.WakeBasedMode = WakeBasedMode;
  }
});

// dist/index.js
var require_index = __commonJS({
  "dist/index.js"(exports) {
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timeDesignManager = exports.WakeBasedMode = exports.SolarMode = exports.CoreTimeMode = exports.ClassicMode = exports.BaseMode = exports.TimeDesignManager = void 0;
    __exportStar(require_time_calculation(), exports);
    __exportStar(require_validation(), exports);
    __exportStar(require_types(), exports);
    var TimeDesignManager_1 = require_TimeDesignManager();
    Object.defineProperty(exports, "TimeDesignManager", { enumerable: true, get: function() {
      return TimeDesignManager_1.TimeDesignManager;
    } });
    var BaseMode_1 = require_BaseMode();
    Object.defineProperty(exports, "BaseMode", { enumerable: true, get: function() {
      return BaseMode_1.BaseMode;
    } });
    var ClassicMode_1 = require_ClassicMode();
    Object.defineProperty(exports, "ClassicMode", { enumerable: true, get: function() {
      return ClassicMode_1.ClassicMode;
    } });
    var CoreTimeMode_1 = require_CoreTimeMode();
    Object.defineProperty(exports, "CoreTimeMode", { enumerable: true, get: function() {
      return CoreTimeMode_1.CoreTimeMode;
    } });
    var SolarMode_1 = require_SolarMode();
    Object.defineProperty(exports, "SolarMode", { enumerable: true, get: function() {
      return SolarMode_1.SolarMode;
    } });
    var WakeBasedMode_1 = require_WakeBasedMode();
    Object.defineProperty(exports, "WakeBasedMode", { enumerable: true, get: function() {
      return WakeBasedMode_1.WakeBasedMode;
    } });
    __exportStar(require_time_modes(), exports);
    exports.timeDesignManager = {
      initialize: () => console.log("TimeDesignManager initialized successfully")
      // Add other methods as needed
    };
  }
});
export default require_index();
