import { Router } from "express";
import prisma from "../prismaClient";

const router = Router();

// ルートエンドポイント
router.get('/', (req, res) => {
    res.send("Hello World!!! This is a autodeployshitekure!!! for CI/CD");
})

// ヘルスチェック用エンドポイント
router.get('/health', (req, res) => {
    res.send("API is working fine");
})

// テストデータ追加エンドポイント
router.post('/insert', async (req, res) => {
    const value = req.body.value || "TestTextData";
    try {
        const result = await prisma.test.create({
            data: {
                text: value
            }
        })
        res.status(200).json({ status: 'success', message: 'Insert Success!!!', data: result });
    } catch (error) {
        console.error("Insert Error!!!", error);
        res.status(500).json({ status: 'error', message: (error as Error).message });
    }
})

export default router;