import { inject, injectable } from "tsyringe";
import { User } from "../types/user";
import { PrismaClient } from "../generated/prisma/client";
import { pinoLogger, PRISMA_CLIENT } from "../di.token";
import { Logger } from "pino";

@injectable()
export class UserService {

    constructor(
        @inject(PRISMA_CLIENT) private prisma: PrismaClient,
        @inject(pinoLogger) private logger: Logger
    ) { }

    async createUser(data: User) {
        try {
            const userData = {
                id: data.uid,
                display_name: data.displayName,
                email: data.email,
                provider: data.authProvider,
                // bio はバリデーションを通過し User モデルにもカラムがあるため保存する。
                // 登録対象から漏れていた間は、リクエストが 201 で成功するのに
                // 値だけ黙って捨てられていた
                bio: data.bio
            }
            const user = await this.prisma.user.create({
                data: userData
            })
            return user
        } catch (error) {
            this.logger.error({
                error,
                userId: data.uid,
                stack: error instanceof Error ? error.stack : undefined
            }, 'ユーザー情報の作成に失敗しました')
            // Prismaエラーハンドリング
            if (error instanceof Error && 'code' in error) {
                if (error.code === 'P2002') {
                    throw new Error('このメールアドレスまたはUIDは既に登録されています', { cause: error })
                }
            }

            throw new Error('ユーザー情報の作成に失敗しました', { cause: error })
        }
    }

    async getIdToken(uid: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: uid
                }
            })
            return user
        } catch (error) {
            this.logger.error({ error, method: 'getIdToken' }, 'ユーザー情報の取得に失敗しました')
            throw new Error('ユーザー情報の取得に失敗しました', { cause: error })
        }
    }
}