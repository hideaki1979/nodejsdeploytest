import { inject, injectable } from "tsyringe";
import { User } from "../types/user";
import { PrismaClient } from "@prisma/client";

@injectable()
export class UserService {

    constructor(
        @inject('PrismaClient') private prisma: PrismaClient
    ) { }

    async createUser(data: User) {
        try {
            const userData = {
                id: data.uid,
                display_name: data.displayName,
                email: data.email,
                provider: data.authProvider
            }
            const user = await this.prisma.user.create({
                data: userData
            })
            return user
        } catch (error) {
            console.error('ユーザー作成エラー:', error)

            // Prismaエラーハンドリング
            if (error instanceof Error && 'code' in error) {
                if (error.code === 'P2002') {
                    throw new Error('このメールアドレスまたはUIDは既に登録されています')
                }
            }

            throw new Error('ユーザー情報の作成に失敗しました')
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
            console.error('ユーザー取得エラー:', error)
            throw new Error('ユーザー情報の取得に失敗しました')
        }
    }
}