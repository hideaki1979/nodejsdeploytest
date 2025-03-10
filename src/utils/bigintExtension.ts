/**
 * BigInt型のJSONシリアライズをサポートするための拡張
 * BigInt値がJSON.stringifyで処理される際に自動的に文字列化される
 */
export function setupBigIntSerialization(): void {
    BigInt.prototype.toJSON = function () {
        return this.toString();
    }
}

declare global {
    interface BigInt {
        toJSON(): string
    }
}