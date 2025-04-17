import prisma from "../prismaClient";
import { User } from "../types/user";

export class UserService {
    async createUser(data: User) {
        const userData = {
            id: data.uid,
            display_name: data.displayName,
            email: data.email,
            provider: data.authProvider
        }
        const user = await prisma.user.create({
            data: userData
        })
        return user
    }
}