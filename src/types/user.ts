/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ユーザーID
 *           example: 'clx123abc456'
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
 *         provider:
 *           type: string
 *           description: 認証プロバイダー (例: google, firebase)
 *           example: 'google.com'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 作成日時
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新日時
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
    id: string;
    email: string;
    displayName: string;
    authProvider?: string;
    bio?: string;
}