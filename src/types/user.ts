/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         uid:
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
 *         authProvider:
 *           type: string
 *           description: 認証プロバイダー (例: google, firebase)
 *           example: 'google.com'
 *         bio:
 *           type: string
 *           description: プロフィール
 *           example: 'プロフィール情報です'
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