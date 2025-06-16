/**
 * Represents the result of an operation that might fail
 * @template T The type of the successful result data
 * @template E The type of the error (defaults to Error)
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Creates a successful result with the provided data
 * @template T The type of the successful result data
 * @param data The data to include in the successful result
 * @returns A Result object indicating success with the provided data
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Creates a failed result with the provided error
 * @template E The type of the error
 * @param error The error to include in the failed result
 * @returns A Result object indicating failure with the provided error
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Checks if a result is successful
 * @template T The type of the successful result data
 * @template E The type of the error
 * @param result The result to check
 * @returns True if the result is successful, false otherwise
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Checks if a result is a failure
 * @template T The type of the successful result data
 * @template E The type of the error
 * @param result The result to check
 * @returns True if the result is a failure, false otherwise
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}
