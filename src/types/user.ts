import type { UserInput } from "../schemas/user.schema";

/**
 * ユーザー登録時にサービス層が受け取るデータ。
 *
 * リクエストボディの形は src/schemas/user.schema.ts の zod スキーマが正
 * （理由は src/types/store.ts の冒頭を参照）。
 * uid だけはリクエストからは受け取らず、検証済みトークンからコントローラが補う。
 */
export type User = UserInput & { uid: string };
