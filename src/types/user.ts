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
 *       required:
 *         - email
 *         - displayName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: メールアドレス
 *           example: 'user@example.com'
 *         displayName:
 *           type: string
 *           description: 表示名
 *           example: 'Taro Yamada'
 *         photoURL:
 *           type: string
 *           format: uri
 *           description: プロフィール写真のURL
 *           example: 'https://example.com/profile.jpg'
 */
export interface User {
    uid: string;
    email: string;
    displayName: string;
    authProvider?: string;
    bio?: string;
}