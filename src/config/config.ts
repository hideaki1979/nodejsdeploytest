import dotenv from 'dotenv';

/**
 * 環境変数の読み込み
 * .envファイルから環境変数を取得してprocess.envに設定
 */
dotenv.config();

/**
 * アプリケーション設定オブジェクト
 * アプリケーション全体で使用する設定値を集約
 * @property {number|string} port - サーバーのポート番号（環境変数から取得、デフォルトは3000）
 */
const config = {
    port: process.env.PORT || 3000
}

export default config;