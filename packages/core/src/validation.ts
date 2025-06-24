import {
    TimeDesignMode,
    ModeParameters,
    ClassicModeParams,
    CoreTimeModeParams,
    WakeBasedModeParams,
    SolarModeParams
} from './types/time-modes.js';
import {
    ValidationResult,
    ValidationError,
    ValidationWarning
} from './types/validation.js';
import { TIME_CONSTANTS } from './types/constants.js';
import { InvalidTimeConfigError } from './types/errors.js';

/**
 * 汎用的な時間設定のバリデーション (テスト用)
 */
export function validateTimeConfig(config: any): ValidationResult<any> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (config.designed24Duration !== undefined) {
        const result = validateClassicTimeConfig(config.designed24Duration);
        if (result.errors) {
            errors.push(...result.errors);
        }
        if (result.warnings) {
            warnings.push(...result.warnings);
        }
    }

    return {
        isValid: errors.length === 0,
        value: config,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Classic Mode パラメータのバリデーション
 */
export function validateClassicTimeConfig(designed24Duration: number): ValidationResult<{ designed24Duration: number }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // designed24Duration のバリデーション
    if (designed24Duration <= 0) {
        errors.push({
            field: 'designed24Duration',
            message: 'Designed 24 duration must be greater than 0',
            code: 'INVALID_DURATION_NEGATIVE'
        });
    } else if (designed24Duration > TIME_CONSTANTS.MAX_DESIGNED_24_DURATION) {
        errors.push({
            field: 'designed24Duration',
            message: `Designed 24 duration cannot exceed ${TIME_CONSTANTS.MAX_DESIGNED_24_DURATION} hours`,
            code: 'INVALID_DURATION_TOO_LONG'
        });
    } else if (designed24Duration < TIME_CONSTANTS.MIN_DESIGNED_24_DURATION) {
        warnings.push({
            field: 'designed24Duration',
            message: `Very short Designed 24 duration (${designed24Duration} hours)`,
            suggestion: 'Consider using a longer duration for better time scaling'
        });
    }

    return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? { designed24Duration } : undefined,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * モードパラメータのバリデーション (テスト用)
 */
export function validateModeParameters(
    mode: TimeDesignMode,
    params: ModeParameters
): ValidationResult<ModeParameters> {
    switch (mode) {
        case TimeDesignMode.Classic:
            return validateClassicMode(params as ClassicModeParams);
        case TimeDesignMode.CoreTime:
            return validateCoreTimeMode(params as CoreTimeModeParams);
        case TimeDesignMode.WakeBased:
            return validateWakeBasedMode(params as WakeBasedModeParams);
        case TimeDesignMode.Solar:
            return validateSolarMode(params as SolarModeParams);
        default:
            return {
                isValid: false,
                errors: [{
                    field: 'mode',
                    message: `Unknown mode: ${mode}`,
                    code: 'UNKNOWN_MODE'
                }]
            };
    }
}

// 各モードのバリデーション関数
function validateClassicMode(params: ClassicModeParams): ValidationResult<ModeParameters> {
    const errors: ValidationError[] = [];
    
    if (typeof params.designed24Duration !== 'number' || isNaN(params.designed24Duration)) {
        errors.push({
            field: 'designed24Duration',
            message: 'Duration must be a number.',
            code: 'INVALID_TYPE'
        });
    } else if (params.designed24Duration < 1 || params.designed24Duration > 1440) {
        errors.push({
            field: 'designed24Duration',
            message: 'Duration must be between 1 and 1440 minutes.',
            code: 'INVALID_RANGE'
        });
    }
    
    return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? params : undefined,
        errors: errors.length > 0 ? errors : undefined
    };
}

function validateCoreTimeMode(params: CoreTimeModeParams): ValidationResult<ModeParameters> {
    const errors: ValidationError[] = [];
    
    // 時刻フォーマットの検証
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(params.coreTimeStart)) {
        errors.push({
            field: 'coreTimeStart',
            message: 'Core time start must be in HH:MM format.',
            code: 'INVALID_TIME_FORMAT'
        });
    }
    if (!timeRegex.test(params.coreTimeEnd)) {
        errors.push({
            field: 'coreTimeEnd',
            message: 'Core time end must be in HH:MM format.',
            code: 'INVALID_TIME_FORMAT'
        });
    }
    
    // 時刻の論理検証
    if (timeRegex.test(params.coreTimeStart) && timeRegex.test(params.coreTimeEnd)) {
        const [startH, startM] = params.coreTimeStart.split(':').map(Number);
        const [endH, endM] = params.coreTimeEnd.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        
        if (startMinutes >= endMinutes) {
            errors.push({
                field: 'coreTimeEnd',
                message: 'Core time end must be after core time start.',
                code: 'INVALID_TIME_ORDER'
            });
        }
    }
    
    // minCoreHours の検証
    if (typeof params.minCoreHours !== 'number' || params.minCoreHours < 1 || params.minCoreHours > 23) {
        errors.push({
            field: 'minCoreHours',
            message: 'Minimum core hours must be between 1 and 23.',
            code: 'INVALID_RANGE'
        });
    }
    
    return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? params : undefined,
        errors: errors.length > 0 ? errors : undefined
    };
}

function validateWakeBasedMode(params: WakeBasedModeParams): ValidationResult<ModeParameters> {
    const errors: ValidationError[] = [];
    
    // 時刻フォーマットの検証
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(params.defaultWakeTime)) {
        errors.push({
            field: 'defaultWakeTime',
            message: 'Default wake time must be in HH:MM format.',
            code: 'INVALID_TIME_FORMAT'
        });
    }
    
    if (params.todayWakeTime && !timeRegex.test(params.todayWakeTime)) {
        errors.push({
            field: 'todayWakeTime',
            message: 'Today wake time must be in HH:MM format.',
            code: 'INVALID_TIME_FORMAT'
        });
    }
    
    // anotherHourDuration の検証
    if (typeof params.anotherHourDuration !== 'number' || 
        params.anotherHourDuration < 0 || params.anotherHourDuration > 720) {
        errors.push({
            field: 'anotherHourDuration',
            message: 'Another Hour duration must be between 0 and 720 minutes.',
            code: 'INVALID_RANGE'
        });
    }
    
    // maxScaleFactor の検証
    if (typeof params.maxScaleFactor !== 'number' || 
        params.maxScaleFactor < 1.0 || params.maxScaleFactor > 5.0) {
        errors.push({
            field: 'maxScaleFactor',
            message: 'Maximum scale factor must be between 1.0 and 5.0.',
            code: 'INVALID_RANGE'
        });
    }
    
    return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? params : undefined,
        errors: errors.length > 0 ? errors : undefined
    };
}

function validateSolarMode(params: SolarModeParams): ValidationResult<ModeParameters> {
    const errors: ValidationError[] = [];
    
    // dayHoursTarget の検証
    if (typeof params.dayHoursTarget !== 'number' || 
        params.dayHoursTarget < 1 || params.dayHoursTarget > 23) {
        errors.push({
            field: 'dayHoursTarget',
            message: 'Day hours target must be between 1 and 23.',
            code: 'INVALID_RANGE'
        });
    }
    
    // location の検証（オプショナル）
    if (params.location) {
        if (typeof params.location.latitude !== 'number' || 
            params.location.latitude < -90 || params.location.latitude > 90) {
            errors.push({
                field: 'location.latitude',
                message: 'Latitude must be between -90 and 90 degrees.',
                code: 'INVALID_RANGE'
            });
        }
        
        if (typeof params.location.longitude !== 'number' || 
            params.location.longitude < -180 || params.location.longitude > 180) {
            errors.push({
                field: 'location.longitude',
                message: 'Longitude must be between -180 and 180 degrees.',
                code: 'INVALID_RANGE'
            });
        }
    }
    
    return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? params : undefined,
        errors: errors.length > 0 ? errors : undefined
    };
} 