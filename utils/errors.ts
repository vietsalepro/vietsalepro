export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    options?: { statusCode?: number; originalError?: unknown }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.originalError = options?.originalError;
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error ?? 'Đã xảy ra lỗi không xác định');
};
