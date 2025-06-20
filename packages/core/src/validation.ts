import {
    AHTimeConfig,
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
 * Another Hour 時間設定のバリデーション
 */
export function validateTimeConfig(config: AHTimeConfig): ValidationResult<AHTimeConfig> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // designed24Duration のバリデーション
    if (config.designed24Duration <= 0) {
        errors.push({
            field: 'designed24Duration',
            message: 'Designed 24 duration must be greater than 0',
            code: 'INVALID_DURATION_NEGATIVE'
        });
    } else if (config.designed24Duration > TIME_CONSTANTS.MAX_DESIGNED_24_DURATION) {
        errors.push({
            field: 'designed24Duration',
            message: `Designed 24 duration cannot exceed ${TIME_CONSTANTS.MAX_DESIGNED_24_DURATION} hours`,
            code: 'INVALID_DURATION_TOO_LONG'
        });
    } else if (config.designed24Duration < TIME_CONSTANTS.MIN_DESIGNED_24_DURATION) {
        warnings.push({
            field: 'designed24Duration',
            message: `Very short Designed 24 duration (${config.designed24Duration} hours)`,
            suggestion: 'Consider using a longer duration for better time scaling'
        });
    }

    // d24StartTime のバリデーション
    if (!(config.d24StartTime instanceof Date) || isNaN(config.d24StartTime.getTime())) {
        errors.push({
            field: 'd24StartTime',
            message: 'Invalid start time',
            code: 'INVALID_START_TIME'
        });
    }

    return {
        isValid: errors.length === 0,
        value: errors.length === 0 ? config : undefined,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * モードパラメータのバリデーション
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

// 各モードのバリデーション関数（実装例）
function validateClassicMode(params: ClassicModeParams): ValidationResult<ModeParameters> {
    // Classic mode specific validation
    return { isValid: true, value: params };
}

function validateCoreTimeMode(params: CoreTimeModeParams): ValidationResult<ModeParameters> {
    // Core time mode specific validation
    return { isValid: true, value: params };
}

function validateWakeBasedMode(params: WakeBasedModeParams): ValidationResult<ModeParameters> {
    // Wake-based mode specific validation
    return { isValid: true, value: params };
}

function validateSolarMode(params: SolarModeParams): ValidationResult<ModeParameters> {
    // Solar mode specific validation
    return { isValid: true, value: params };
} 