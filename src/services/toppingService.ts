import prisma from "../prismaClient";

export class ToppingService {

    async getToppingAll() {
        const toppings = await prisma.topping.findMany()
        return toppings
    }

    async getCallOptionAll() {
        const callOptions = await prisma.callOption.findMany()
        return callOptions
    }
}