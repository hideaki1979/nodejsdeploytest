import { StoreImageDownloadData, StoreImageEditData, StoreImageUpdateData, StoreImageUploadData } from "../types/image";
import { randomUUID } from 'node:crypto'
import { bucket } from "../config/firebase";
import { Image, Prisma, PrismaClient } from "../generated/prisma/client";
import { inject, injectable } from "tsyringe";
import { AppError } from "../middlewares/errorMiddleware";
import { pinoLogger, PRISMA_CLIENT } from "../di.token";
import { Logger } from "pino";

@injectable()
export class ImageService {

    /**
     * Firebase Storageへの保存を許可する画像MIMEタイプと、対応する拡張子
     *
     * Storageに設定したContent-Typeは公開URL（storage.googleapis.com）で
     * そのまま配信されるため、text/html等を保存させてはならない。
     * 拡張子の判定と許可判定を同じ表から導くことで、両者の乖離を防ぐ
     */
    private static readonly ALLOWED_IMAGE_MIME_TYPES: Readonly<Record<string, string>> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp'
    }

    constructor(
        @inject(PRISMA_CLIENT) private prisma: PrismaClient,
        @inject(pinoLogger) private logger: Logger
    ) { }

    /**
   * 店舗画像とそれに関連するトッピング情報を登録する
   * 画像はBase64形式でエンコードされている必要がある
   *
   * 保存先の店舗は更新・削除と同じくパスパラメータのstoreIdを唯一の正とする。
   * ボディからも受け取ると、URLが示す店舗と実際の書き込み先が食い違いうる
   * @param storeId 店舗ID（パスパラメータ）
   * @param data 店舗画像のアップロードデータ
   * @param userId 投稿者のFirebase UID（検証済みトークン由来）
   * @returns 作成された画像エントリ
   */
    async createImage(storeId: string | number, data: StoreImageUploadData, userId: string) {
        // StorageへのアップロードはネットワークI/OのためDBトランザクションの外で行う。
        // トランザクション内で実行すると、アップロードの所要時間だけDB接続とロックを占有し、
        // PRISMA_TRANSACTION_TIMEOUT超過でロールバックする可能性がある
        const uploadedUrl = await this.uploadImageToStorage(data.image_base64, storeId)

        try {
            // トランザクションで処理することで、データの整合性を担保
            return await this.prisma.$transaction(async (tx) => {
                // データベースに画像情報を保存
                const image = await tx.image.create({
                    data: {
                        store_id: BigInt(storeId),
                        user_id: userId,
                        menu_type: data.menu_type,
                        menu_name: data.menu_name,
                        image_url: uploadedUrl
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
            // 補償処理：DB登録に失敗した場合、アップロード済みファイルが孤立するため削除する
            await this.safeDeleteImageFromStorage(uploadedUrl, '画像登録失敗の補償処理')
            throw error
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
        // 店舗IDをBigIntに変換
        const storeBigInt = BigInt(storeId)

        // 画像情報を取得
        const images = await this.prisma.image.findMany({
            where: {
                store_id: storeBigInt
            }
        })

        const storeImageToppingOptions: StoreImageDownloadData[] = []

        //  各画像のトッピングオプション情報を取得する。
        for (const image of images) {
            // 画像に関連するトッピングコール情報を取得する。
            const toppingCalls = await this.prisma.imageStoreToppingCall.findMany({
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
            //
            // BigInt は Number() ではなく String() で返す。
            // setupBigIntSerialization により BigInt は全体で文字列としてシリアライズされる方針であり、
            // ここだけ数値化すると個別取得（getImageByImageId）と型が食い違う。
            // 加えて Number() は 2^53 を超えると精度が落ちるため、主キーの変換には使わない。
            // menu_type は BigInt ではなく Int のため数値のままでよい
            const formattedToppingCalls = toppingCalls.map(call => ({
                topping_id: String(call.topping_id),
                topping_name: call.store_topping_call.topping.topping_name,
                call_option_id: String(call.store_topping_call.call_option_id),
                call_option_name: call.store_topping_call.call_option.call_option_name
            }))


            //  StoreImageDownloadData型で格納する。
            storeImageToppingOptions.push({
                id: String(image.id),
                store_id: String(image.store_id),
                user_id: image.user_id,
                menu_type: image.menu_type,
                menu_name: image.menu_name,
                image_url: image.image_url,
                topping_calls: formattedToppingCalls.length > 0 ? formattedToppingCalls : undefined

            })
        }
        return storeImageToppingOptions
    }

    async getImageByImageId(storeId: string | number, imageId: string | number): Promise<StoreImageEditData> {
        // パラメータをBigIntに変換
        const storeBigInt = BigInt(storeId)
        const imageBigInt = BigInt(imageId)

        // 画像情報を取得
        const image = await this.prisma.image.findFirst({
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
            this.logger.error({ storeId, imageId }, '画像未存在エラー発生')
            throw new AppError('指定された画像情報が存在しません', 404)
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
    }

    /**
     * 店舗画像を更新する
     *
     * StorageとDBは同一のトランザクションで保護できないため、
     * 「認可 → アップロード → DB更新 → 旧ファイル削除」の順に段階を分け、
     * DB更新が失敗した場合はアップロード済みファイルを削除する補償処理で整合性を保つ。
     * 旧ファイルの削除は必ずコミット後に行う。コミット前に削除すると、
     * DB更新が失敗した際にレコードは旧URLを指したままファイルだけが失われる
     * @param storeId 店舗ID（パスパラメータ）
     * @param imageId 画像ID（パスパラメータ）
     * @param data 更新内容
     * @param userId 操作者のFirebase UID（検証済みトークン由来）
     * @param isAdmin 操作者が管理者ロールを持つ場合true
     * @returns 更新された画像情報
     */
    async updateStoreImageService(
        storeId: string | number,
        imageId: string | number,
        data: StoreImageUpdateData,
        userId: string,
        isAdmin: boolean = false
    ) {
        // パラメータをBigIntに変換
        const storeBigInt = BigInt(storeId)
        const imageBigInt = BigInt(imageId)

        // 【第1段階】認可と存在確認のみを短いトランザクションで実施する。
        // アップロードより先に行うことで、権限の無い利用者にStorageへ書き込ませない
        await this.prisma.$transaction(async (tx) => {
            // 画像所有者チェック（投稿者本人、または管理者のみ更新可）
            await this.validateImageOwnership(tx, storeBigInt, imageBigInt, userId, isAdmin)
            await this.validateImageExists(tx, storeBigInt, imageBigInt)
        })

        // 【第2段階】新しい画像をトランザクション外でアップロードする。
        // 保存先はボディのstore_idではなく、認可判定に使ったパスパラメータのstoreIdを使用する
        const uploadedUrl = data.image_base64
            ? await this.uploadImageToStorage(data.image_base64, storeId)
            : null

        // 【第3段階】DBを更新する
        let txResult
        try {
            txResult = await this.prisma.$transaction(async (tx) => {
                // 第1段階からの経過中に所有者や存在状態が変化している可能性があるため再検証する
                await this.validateImageOwnership(tx, storeBigInt, imageBigInt, userId, isAdmin)

                // 置き換え直前の状態をトランザクション内で読み直す。
                // 第1段階で取得した値を使うと、並行更新があった場合に古いURLで上書きしてしまう
                const before = await this.validateImageExists(tx, storeBigInt, imageBigInt)

                // imagesテーブルの更新
                const updatedImage = await tx.image.update({
                    where: {
                        id: imageBigInt
                    },
                    data: {
                        menu_type: data.menu_type,
                        menu_name: data.menu_name,
                        image_url: uploadedUrl ?? before.image_url
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
                    imageUpdated: uploadedUrl !== null,
                    // コミット後に削除する対象。実際に置き換えたURLだけを消す
                    replacedUrl: before.image_url
                }
            })
        } catch (error) {
            // 補償処理：DB更新に失敗した場合、アップロード済みファイルが孤立するため削除する
            if (uploadedUrl) {
                await this.safeDeleteImageFromStorage(uploadedUrl, '画像更新失敗の補償処理')
            }
            throw error
        }

        // 【第4段階】コミット後に旧ファイルを削除する。
        // ここでの失敗は孤立ファイルが残るだけでDBとの不整合は起きない
        const { replacedUrl, ...result } = txResult
        if (uploadedUrl && replacedUrl !== uploadedUrl) {
            await this.safeDeleteImageFromStorage(replacedUrl, '更新による旧画像削除')
        }

        return result
    }

    /**
     * 画像情報を削除する
     * 画像ファイル、データベースレコード、関連トッピングコール情報を削除する
     * @param storeId 店舗ID
     * @param imageId 画像ID
     * @returns 削除された画像情報
     */

    async deleteStoreImageService(
        storeId: string | number,
        imageId: string | number,
        userId: string,
        isAdmin: boolean = false
    ) {
        // パラメータをBigIntに変換
        const storeBigInt = BigInt(storeId)
        const imageBigInt = BigInt(imageId)

        // 認可・関連レコード削除・画像レコード削除を1つのトランザクションで完結させる。
        // 分割すると、DB削除が失敗したときにファイルだけが失われてリンク切れになる
        const deleteImage = await this.prisma.$transaction(async (tx) => {
            // 画像所有者チェック（投稿者本人、または管理者のみ削除可）
            // 存在確認も兼ねており、対象が無ければ404を送出する
            await this.validateImageOwnership(tx, storeBigInt, imageBigInt, userId, isAdmin)

            // 関連するimage_store_topping_callsを削除（共通処理）
            await this.deleteImageToppingCalls(tx, imageBigInt)

            // 削除結果から image_url を受け取り、コミット後のStorage削除に使う
            return await tx.image.delete({
                where: {
                    id: imageBigInt
                }
            })
        })

        // コミット後にFirebase Storageの実ファイルを削除する。
        // ここでの失敗は孤立ファイルが残るだけでDBとの不整合は起きない
        await this.safeDeleteImageFromStorage(deleteImage.image_url, '画像削除')

        return {
            image: deleteImage,
            deleted: true
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
            this.logger.error({ storeId, imageId }, '画像未存在エラー発生')
            throw new AppError('指定された画像情報が存在しません', 404)
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
     * Base64画像をFirebase Storageへアップロードし、公開URLを返す（共通処理）
     * ネットワークI/Oを含むため、DBトランザクションの外から呼び出すこと
     * @param imageBase64 data URL形式のBase64画像データ
     * @param storeId 保存先の店舗ID
     * @returns アップロードしたファイルの公開URL
     * @throws AppError 画像データが未設定、または形式が不正な場合は400
     */
    private async uploadImageToStorage(imageBase64: string | null | undefined, storeId: string | number): Promise<string> {
        // 未設定チェック。呼び出し側でnon-nullアサーションを使うと、
        // 万一バリデーションを通過した場合にTypeErrorとなり500を返してしまう
        if (!imageBase64) {
            this.logger.error({ storeId }, '画像データ未設定エラー発生')
            throw new AppError('画像データは必須です', 400)
        }

        // Base64画像データをバッファに変換
        const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
        if (!matches || matches.length !== 3) {
            this.logger.error({ storeId }, '不正画像データエラー発生')
            throw new AppError('無効な画像データ形式です', 400)
        }

        const imageBuffer = Buffer.from(matches[2], 'base64')
        const contentType = matches[1]

        // MIMEタイプを許可リストで検証し、対応する拡張子を得る。
        // 正規表現は image/svg+xml や text/html も通してしまうため、ここで弾く
        const fileExtension = ImageService.ALLOWED_IMAGE_MIME_TYPES[contentType]
        if (!fileExtension) {
            this.logger.error({ storeId, contentType }, '非対応画像形式エラー発生')
            throw new AppError('対応していない画像形式です。JPEG、PNG、GIF、WEBPのみ利用できます', 400)
        }

        // ファイルパスの生成（UUID + タイムスタンプで一意性を確保）
        const timestamp = Date.now()
        const fileName = `stores/${storeId}/${randomUUID()}_${timestamp}${fileExtension}`

        // FireBase Storageにアップロード
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

        // 公開URLの取得
        return `https://storage.googleapis.com/${bucket.name}/${fileName}`
    }

    /**
     * Firebase Storageの画像を削除し、失敗しても例外を送出しない（共通処理）
     * 削除失敗は孤立ファイルが残るだけでDBとの整合性は壊れないため、警告ログに留める
     * @param imageUrl 削除対象の画像URL
     * @param context 呼び出し文脈（ログ調査用）
     */
    private async safeDeleteImageFromStorage(imageUrl: string, context: string): Promise<void> {
        try {
            await this.deleteImageFromStorage(imageUrl)
        } catch (deleteError) {
            this.logger.warn({ deleteError, imageUrl, context }, 'Firebase Storage 画像削除失敗')
        }
    }

    /**
     * Firebase StorageからURLを基に画像ファイルを削除する
     * @param imageUrl 削除対象の画像URL
     */
    private async deleteImageFromStorage(imageUrl: string): Promise<void> {
        // URLからファイルパスを抽出
        const urlPattern = new RegExp(`https://storage\\.googleapis\\.com/${bucket.name}/(.+)`)
        const match = imageUrl.match(urlPattern)

        if (!match || !match[1]) {
            this.logger.error({ imageUrl }, '画像URL不正エラー発生')
            throw new Error('無効な画像URLです')
        }

        const filePath = decodeURIComponent(match[1])
        const file = bucket.file(filePath)

        // ファイルが存在するかチェック
        const [exists] = await file.exists()

        if (exists) {
            await file.delete()
        } else {
            this.logger.warn({ filePath }, 'Firebase Storage 画像未存在失敗')
        }
    }

    /**
     * 画像の操作権限を検証する（共通処理）
     * 投稿者本人、または管理者ロール保持者のみ操作を許可する
     * @param tx Prismaトランザクション
     * @param storeId 店舗ID（BigInt）
     * @param imageId 画像ID（BigInt）
     * @param userId 操作者のFirebase UID（検証済みトークン由来）
     * @param isAdmin 操作者が管理者ロールを持つ場合true
     * @throws AppError 画像が存在しない場合は404、権限が無い場合は403
     */
    private async validateImageOwnership(
        tx: Prisma.TransactionClient,
        storeId: bigint,
        imageId: bigint,
        userId: string,
        isAdmin: boolean = false
    ): Promise<void> {
        const image = await tx.image.findFirst({
            where: { id: imageId, store_id: storeId },
            select: { user_id: true }
        })

        if (!image) {
            this.logger.error({ storeId, imageId }, '指定画像未存在エラー発生')
            throw new AppError('指定された画像情報が存在しません', 404)
        }

        // 管理者はモデレーション目的で他ユーザーの画像も操作できる
        if (isAdmin) return

        if (image.user_id !== userId) {
            this.logger.warn({ storeId, imageId, userId }, '画像操作権限エラー発生')
            throw new AppError('この画像を操作する権限がありません', 403)
        }
    }
}