import express from 'express';
import middlewares from './middlewares/middlewares';
import router from './routes/routes';
import config from './config/config';

const app = express();

// ミドルウェアの使用
app.use(...middlewares);

// ルートの使用
app.use(router);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});