import cors from 'cors';
import express from 'express';

// 使用するミドルウェアを配列で定義
const middlewares = [
    express.json(),
    cors()
];

export default middlewares;