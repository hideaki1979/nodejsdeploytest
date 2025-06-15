import prisma from "../prismaClient";
import { StoreImageDownloadData, StoreImageEditData, StoreImageUploadData } from "../types/image";
import { v4 as uuidv4 } from 'uuid'
import { bucket } from "../config/firebase";
import { Image, Prisma } from "@prisma/client";

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
                        user_id: data.user_id,
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


                //  StoreImageDownloadData型で格納する。
                storeImageToppingOptions.push({
                    id: Number(image.id),
                    store_id: Number(image.store_id),
                    user_id: image.user_id,
                    menu_type: image.menu_type,
                    menu_name: image.menu_name,
                    image_url: image.image_url,
                    topping_calls: formattedToppingCalls.length > 0 ? formattedToppingCalls : undefined

                })
            }
            return storeImageToppingOptions

        } catch (error) {
            console.error('画像情報取得エラー:', error);
            throw error instanceof Error
                ? error
                : new Error('店舗の画像情報取得に失敗しました')
        }
    }

    async getImageByImageId(storeId: string | number, imageId: string | number): Promise<StoreImageEditData> {
        try {
            // パラメータをBigIntに変換
            const storeBigInt = BigInt(storeId)
            const imageBigInt = BigInt(imageId)

            // 画像情報を取得
            const image = await prisma.image.findFirst({
                where: {
                    id: imageBigInt,
                    store_id: storeBigInt
                },
                include: {
                    image_topping_calls: {
                        include: {
                            store_topping_call: {
                                include: {
                                    topping: true,
                                    call_option: true
                                }
                            }
                        }
                    }
                }
            })

            if (!image) {
                throw new Error('指定された画像情報が存在しません')
            }

            // トッピング選択情報を整形
            const toppingSelections = image.image_topping_calls.map(call => ({
                topping_id: String(call.topping_id),
                call_option_id: String(call.store_topping_call.call_option_id),
                store_topping_call_id: String(call.store_topping_call_id)
            }))
            // StoreImageEditData型で返却
            const editData: StoreImageEditData = {
                id: String(image.id),
                store_id: String(image.store_id),
                user_id: image.user_id,
                menu_type: image.menu_type,
                menu_name: image.menu_name,
                image_url: image.image_url,
                topping_selections: toppingSelections
            }
            return editData
        } catch (error) {
            console.error('画像情報取得エラー:', error)
            throw error instanceof Error
                ? error
                : new Error('画像情報の取得に失敗しました')
        }
    }

    async updateStoreImageService(storeId: string | number, imageId: string | number, data: StoreImageUploadData) {
        try {
            return await prisma.$transaction(async (tx) => {
                // パラメータをBigIntに変換
                const storeBigInt = BigInt(storeId)
                const imageBigInt = BigInt(imageId)

                // 現在の画像情報を取得（旧画像URL取得のため）
                const currentImage = await this.validateImageExists(tx, storeBigInt, imageBigInt)

                let newImageUrl = currentImage.image_url    // デフォルトは現在のURL

                // image_base64が提供された場合のFirebase Storage処理
                if (data.image_base64) {
                    // Base64画像データをバッファに変換
                    const matches = data.image_base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
                    if (!matches || matches.length !== 3) {
                        throw new Error('無効な画像データ形式です')
                    }

                    const imageBuffer = Buffer.from(matches[2], 'base64')
                    const contentType = matches[1]

                    // MIMEタイプから拡張子を取得
                    const fileExtension = this.getFileExtensionFromMimeType(contentType)

                    // 新しいファイルパスの生成（UUID + タイムスタンプで一意性を確保）
                    const timestamp = Date.now()
                    const fileName = `stores/${data.store_id}/${uuidv4()}_${timestamp}${fileExtension}`

                    // FireBase Storageに新しい画像をアップロード
                    const file = bucket.file(fileName)

                    // ファイルを書き込む
                    await file.save(imageBuffer, {
                        metadata: {
                            contentType,
                            metadata: {
                                storeId: String(storeId)
                            }
                        }
                    })
                    // ファイルの公開URL取得のためのアクセス設定
                    await file.makePublic()

                    // 新しい公開URLの取得
                    newImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`

                    // 旧画像をFirebase Storageから削除（共通処理）
                    try {
                        await this.deleteImageFromStorage(currentImage.image_url)
                    } catch (deleteError) {
                        // 旧画像の削除に失敗してもメイン処理は継続する
                        console.warn('旧画像の削除に失敗しました:', deleteError)
                    }
                }

                // imagesテーブルの更新
                const updatedImage = await tx.image.update({
                    where: {
                        id: imageBigInt
                    },
                    data: {
                        menu_type: data.menu_type,
                        menu_name: data.menu_name,
                        image_url: newImageUrl
                    }
                })

                // 既存のimage_store_topping_callsを削除
                await this.deleteImageToppingCalls(tx, imageBigInt)

                // 新しいトッピング選択を挿入
                const imageStoreToppingCalls = []
                if (data.topping_selections && data.topping_selections.length > 0) {
                    for (const selection of data.topping_selections) {
                        const imageToppingCall = await tx.imageStoreToppingCall.create({
                            data: {
                                image_id: imageBigInt,
                                topping_id: BigInt(selection.topping_id),
                                store_topping_call_id: BigInt(selection.store_topping_call_id)
                            }
                        })
                        imageStoreToppingCalls.push(imageToppingCall)
                    }
                }

                return {
                    image: updatedImage,
                    imageStoreToppingCalls,
                    imageUpdated: data.image_base64 ? true : false
                }
            })

        } catch (error) {
            console.error('画像更新エラー:', error);
            throw error instanceof Error
                ? error
                : new Error('画像の更新に失敗しました');
        }
    }

    /**
     * 画像情報を削除する
     * 画像ファイル、データベースレコード、関連トッピングコール情報を削除する
     * @param storeId 店舗ID
     * @param imageId 画像ID
     * @returns 削除された画像情報
     */

    async deleteStoreImageService(storeId: string | number, imageId: string | number) {
        try {
            return await prisma.$transaction(async (tx) => {
                // パラメータをBigIntに変換
                const storeBigInt = BigInt(storeId)
                const imageBigInt = BigInt(imageId)

                // 画像存在確認（共通処理）
                const currentImage = await this.validateImageExists(tx, storeBigInt, imageBigInt)

                // Firebase Storageから画像ファイルを削除（共通処理）
                try {
                    await this.deleteImageFromStorage(currentImage.image_url)
                } catch (deleteError) {
                    // Firebase Storageの削除に失敗してもメイン処理は継続する
                    console.warn('Firebase Storage画像削除に失敗しました:', deleteError)
                }

                // 関連するimage_store_topping_callsを削除（共通処理）
                await this.deleteImageToppingCalls(tx, imageBigInt)

                // imagesテーブルから画像情報を削除
                const deleteImage = await tx.image.delete({
                    where: {
                        id: imageBigInt
                    }
                })

                return {
                    image: deleteImage,
                    deleted: true
                }
            })
        } catch (error) {
            console.error('画像削除エラー:', error);
            throw error instanceof Error
                ? error
                : new Error('画像の削除に失敗しました');
        }
    }

    // =============================================================================
    // 共通処理メソッド
    // =============================================================================

    /**
     * 画像の存在確認を行う（共通処理）
     * @param tx Prismaトランザクション
     * @param storeId 店舗ID（BigInt）
     * @param imageId 画像ID（BigInt）
     * @returns 画像情報
     * @throws Error 画像が存在しない場合
     */

    private async validateImageExists(tx: Prisma.TransactionClient, storeId: bigint, imageId: bigint): Promise<Image> {
        const image = await tx.image.findFirst({
            where: {
                id: imageId,
                store_id: storeId
            }
        })

        if (!image) {
            throw new Error('指定された画像情報が存在しません')
        }

        return image
    }

    /**
    * 画像に関連するトッピングコール情報を削除する（共通処理）
    * @param tx Prismaトランザクション
    * @param imageId 画像ID（BigInt）
    */

    private async deleteImageToppingCalls(tx: Prisma.TransactionClient, imageId: bigint): Promise<void> {
        await tx.imageStoreToppingCall.deleteMany({
            where: {
                image_id: imageId
            }
        })
    }

    /**
     * Firebase StorageからURLを基に画像ファイルを削除する
     * @param imageUrl 削除対象の画像URL
     */
    private async deleteImageFromStorage(imageUrl: string): Promise<void> {
        try {
            // URLからファイルパスを抽出
            const urlPattern = new RegExp(`https://storage\\.googleapis\\.com/${bucket.name}/(.+)`)
            const match = imageUrl.match(urlPattern)

            if (!match || !match[1]) {
                throw new Error('無効な画像URLです')
            }

            const filePath = decodeURIComponent(match[1])
            const file = bucket.file(filePath)

            // ファイルが存在するかチェック
            const [exists] = await file.exists()

            if (exists) {
                await file.delete()
            } else {
                console.warn(`削除対象のファイルが存在しません: ${filePath}`)
            }
        } catch (error) {
            console.error(`Firebase Storage画像削除エラー：`, error)
            throw error
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