import prisma from "../prismaClient";
import { StoreImageDownloadData, StoreImageUploadData } from "../types/image";
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
            // console.log("data：", JSON.stringify(data, null, 2))
            // トランザクションで処理することで、データの整合性を担保
            return await prisma.$transaction(async (tx) => {
                // Base64画像データをバッファに変換
                // console.log("base64：", data.image_base64)
                const matches = data.image_base64!.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
                // console.log("matches：", matches)
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
                        user_id: "1",  // 暫定対応で1固定
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
     * 店舗IDに紐づく画像情報を取得する。
     * 画像情報には、店舗ID、ユーザーID、メニュー種類、メニュー名、画像URL、トッピングコール情報が含まれます。
     * トッピングコール情報が存在する場合は、トッピングID、トッピング名、コールオプションID、コールオプション名を含む配列が返されます。
     * @param storeId 店舗ID
     * @returns 画像情報とトッピングコール情報の配列
     */
    async getImageByStoreId(storeId: string | number): Promise<StoreImageDownloadData[]> {
        try {
            // 店舗IDをBigIntに変換
            const storeBigInt = BigInt(storeId)

            // 画像情報を取得
            const images = await prisma.image.findMany({
                where: {
                    store_id: storeBigInt
                }
            })

            const storeImageToppingOptions: StoreImageDownloadData[] = []

            //  各画像のトッピングオプション情報を取得する。
            for (const image of images) {
                // 画像に関連するトッピングコール情報を取得する。
                const toppingCalls = await prisma.imageStoreToppingCall.findMany({
                    where: {
                        image_id: image.id
                    },
                    include: {
                        store_topping_call: {
                            include: {
                                topping: true,
                                call_option: true
                            }
                        }
                    }
                })

                // 画像別トッピングコール情報を整形
                const formattedToppingCalls = toppingCalls.map(call => ({
                    topping_id: Number(call.topping_id),
                    topping_name: call.store_topping_call.topping.topping_name,
                    call_option_id: Number(call.store_topping_call.call_option_id),
                    call_option_name: call.store_topping_call.call_option.call_option_name
                }))

                // console.log("画像別トッピングコールTBL情報：", JSON.stringify(toppingCalls, null, 2))
                // console.log("データ整形後の画像トッピングコール情報：", formattedToppingCalls)

                //  StoreImageDownloadData型で格納する。
                storeImageToppingOptions.push({
                    id: Number(image.id),
                    store_id: Number(image.store_id),
                    user_id: Number(image.user_id),
                    menu_type: image.menu_type,
                    menu_name: image.menu_name,
                    image_url: image.image_url,
                    topping_calls: formattedToppingCalls.length > 0 ? formattedToppingCalls : undefined

                })
            }
            // console.log("画像情報：", storeImageToppingOptions)
            return storeImageToppingOptions

        } catch (error) {
            console.error('画像情報取得エラー:', error);
            throw error instanceof Error
                ? error
                : new Error('店舗の画像情報取得に失敗しました')
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