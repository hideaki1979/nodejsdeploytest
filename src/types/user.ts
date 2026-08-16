/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: |
 *         ユーザー情報のレスポンス。
 *         userService は Prisma の行をそのまま返すため、フィールド名は
 *         リクエスト（UserInput）のキャメルケースではなく DB カラム名（スネークケース）になる。
 *       properties:
 *         id:
 *           type: string
 *           description: ユーザーID（Firebase Authentication の UID。リクエストの uid ではなく id で返る）
 *           example: 'yA1bC2dE3fG4hI5jK6lM7nO8pQ9r'
 *         display_name:
 *           type: string
 *           nullable: true
 *           description: 表示名（リクエストの displayName に対応）
 *           example: 'Taro Yamada'
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *           description: メールアドレス
 *           example: 'user@example.com'
 *         bio:
 *           type: string
 *           nullable: true
 *           description: プロフィール
 *           example: 'プロフィール情報です'
 *         provider:
 *           type: string
 *           nullable: true
 *           description: 認証プロバイダー（リクエストの authProvider に対応）
 *           example: 'google'
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 作成日時
 *           example: '2025-01-01T00:00:00.000Z'
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 更新日時
 *           example: '2025-01-01T00:00:00.000Z'
 *
 *     UserInput:
 *       type: object
 *       description: |
 *         ユーザー登録のリクエストボディ。
 *         全項目が任意で、未指定の項目は null として登録される。
 *         uid は他ユーザーのUIDでのレコード作成を防ぐためリクエストボディからは受け取らず、
 *         検証済みトークンのUIDをサーバー側で設定する。
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: メールアドレス（正規化して保存される）
 *           example: 'user@example.com'
 *         displayName:
 *           type: string
 *           maxLength: 50
 *           description: 表示名（前後の空白除去とHTMLエスケープを行って保存される）
 *           example: 'Taro Yamada'
 *         authProvider:
 *           type: string
 *           enum: [google, facebook, twitter, github, email]
 *           description: 認証プロバイダー（列挙値以外を指定すると 400 になる）
 *           example: 'google'
 *         bio:
 *           type: string
 *           maxLength: 500
 *           description: |
 *             プロフィール（前後の空白除去とHTMLエスケープを行って保存される）。
 *             ユーザー情報の更新APIが無いため、設定できるのは新規登録時のみ。
 *           example: 'プロフィール情報です'
 */
export interface User {
    uid: string;
    email: string;
    displayName: string;
    authProvider?: string;
    bio?: string;
}