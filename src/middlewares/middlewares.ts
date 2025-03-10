import cors from 'cors';
import express from 'express';

/**
 * アプリケーション全体で使用するミドルウェアを配列で定義
 * @property {Function} express.json() - JSONリクエストボディをパースするミドルウェア
 * @property {Function} cors() - CORSを有効にし、異なるオリジンからのリクエストを許可するミドルウェア
 */
const middlewares = [
    express.json(),
    cors()
];

export default middlewares;