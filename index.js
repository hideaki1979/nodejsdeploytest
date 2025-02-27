require('dotenv').config();
const express = require('express');
const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!!! This is a autodeployshitekure!!! for CI/CD');
});

// ヘルスチェック用エンドポイント
app.get('/health', (req, res) => {
  res.send('API is working fine');
});

// テストデータ追加エンドポイント
app.post('/insert', async (req, res) => {
    const value = req.body.value || "TestTextData";
    try {
        const result = await prisma.test.create({
            data: {
                text: value
            }
        })
        res.status(200).json({ status: 'success', message: 'Insert Success!!!', data: result });
    } catch(error) {
        console.error("Insert Error!!!", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});