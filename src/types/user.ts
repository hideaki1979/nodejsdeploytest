// ユーザー型定義
export interface User {
    uid: string;
    email: string;
    displayName: string;
    authProvider?: string;
}