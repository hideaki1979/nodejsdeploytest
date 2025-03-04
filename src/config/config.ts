import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

const config = {
    port: process.env.PORT || 3000
}

export default config;