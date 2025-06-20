/**
 * バリデーション結果
 */
export interface ValidationResult<T> {
    isValid: boolean;
    value?: T;
    errors?: ValidationError[];
    warnings?: ValidationWarning[];
}

/**
 * バリデーションエラー
 */
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

/**
 * バリデーション警告
 */
export interface ValidationWarning {
    field: string;
    message: string;
    suggestion?: string;
}

/**
 * バリデータ関数の型
 */
export type Validator<T> = (value: T) => ValidationResult<T>;

/**
 * フィールドバリデータ
 */
export interface FieldValidator<T> {
    field: keyof T;
    validate: (value: unknown) => boolean;
    errorMessage: string;
    errorCode: string;
} 