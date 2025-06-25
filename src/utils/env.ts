import { AppError } from "../middlewares/errorMiddleware"

/**
 * 環境変数を整数に変換し、妥当性を検証する関数
 * @param value 環境変数の値
 * @param key 環境変数のキー（エラーメッセージ用）
 * @returns 変換された整数値
 */
export function parseIntWithValidation(value: string, key: string): number {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed) || parsed <= 0) {
        throw new AppError(`${key}は正の整数で入力してください。現在の値：${value}`, 500)
    }
    return parsed
}