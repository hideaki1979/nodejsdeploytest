import prisma from "../prismaClient";
import { StoreImageUploadData } from "../types/image";
import { v4 as uuidv4 } from 'uuid'
import { bucket } from "../config/firebase";

export class ImageService {
    /**
   * 店舗画像とそれに関連するトッピング情報を登録する
   * 画像はBase64形式でエンコードされている必要がある
   * @param data 店舗画像のアップロードデータ
   * @returns 作成された画像エントリ
   */
    async createImage(data: StoreImageUploadData) {
        try {
            // トランザクションで処理することで、データの整合性を担保
            return await prisma.$transaction(async (tx) => {
                // Base64画像データをバッファに変換
                console.log("base64：", data.image_base64)
                const matches = data.image_base64!.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
                console.log("matches：", matches)
                if (!matches || matches.length !== 3) {
                    throw new Error('無効な画像データ形式です');
                }

                const imageBuffer = Buffer.from(matches[2], 'base64')
                const contentType = matches[1]

                // MIMEタイプから拡張子を取得
                const fileExtension = this.getFileExtensionFromMimeType(contentType)

                // ファイルパスの生成（UUID + タイムスタンプで一意性を確保）
                const timestamp = Date.now()
                const fileName = `stores/${data.store_id}/${uuidv4()}_${timestamp}${fileExtension}`

                // FireBase Storageにアップロード
                const file = bucket.file(fileName)

                // ファイル書き込む
                await file.save(imageBuffer, {
                    metadata: {
                        contentType,
                        metadata: {
                            storeId: String(data.store_id)
                        }
                    }
                })

                // ファイルの公開URL取得のためのアクセス設定
                await file.makePublic();

                // 公開URLの取得
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

                // データベースに画像情報を保存
                const image = await tx.image.create({
                    data: {
                        store_id: BigInt(data.store_id),
                        user_id: BigInt(1),  // 暫定対応で1固定
                        menu_type: data.menu_type,
                        menu_name: data.menu_name,
                        image_url: publicUrl
                    }
                })

                // トッピング選択がある場合は関連付けを作成
                const imageStoreToppingCalls = []

                if (data.topping_selections && data.topping_selections.length > 0) {
                    for (const selection of data.topping_selections) {
                        // 画像トッピングコール情報を保存し、トッピングを関連付ける
                        const imageToppingCall = await tx.imageStoreToppingCall.create({
                            data: {
                                image_id: BigInt(image.id),
                                topping_id: BigInt(selection.topping_id),
                                store_topping_call_id: BigInt(selection.store_topping_call_id)
                            }
                        })
                        imageStoreToppingCalls.push(imageToppingCall)

                    }
                }
                return { image, imageStoreToppingCalls }

            })
        } catch (error) {
            console.error('画像アップロードエラー:', error);
            throw error instanceof Error
                ? error
                : new Error('画像のアップロードに失敗しました');
        }
    }

    /**
     * MIMEタイプからファイル拡張子を取得する
     * @param mimeType MIMEタイプ
     * @returns 対応するファイル拡張子
     */
    private getFileExtensionFromMimeType(mineType: string): string {
        switch (mineType) {
            case 'image/jpeg':
                return '.jpg'
            case 'image/png':
                return '.png'
            case 'image/gif':
                return '.gif'
            case 'image/webp':
                return '.webp'
            default:
                return '.jpg'
        }
    }
}