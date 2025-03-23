import NodeGeocoder from 'node-geocoder';

/**
 * ジオコーディングサービス
 * 住所から緯度・経度を取得する機能を実装
 */
export class GeocodingService {
    private geocoder: NodeGeocoder.Geocoder;
    // サービス初期化
    constructor() {
        // geocoderの設定
        const options: NodeGeocoder.Options = {
            provider: 'google',
            apiKey: process.env.GOOGLE_MAPS_API_KEY,
            formatter: null
        }

        this.geocoder = NodeGeocoder(options);
    }

    /**
   * 住所から緯度・経度を取得する
   * @param address 変換したい住所
   * @returns 緯度・経度の情報、取得できない場合は0
   */
    async geocodeAddress(address: string) {
        try {
            const results = await this.geocoder.geocode(address)

            if (results.length === 0) {
                console.error(`住所${address}で位置情報を取得出来ませんでした。`)
                throw new Error("住所から位置情報を取得出来ませんでした。")
            }

            return {
                latitude: results[0].latitude ?? 0,
                longitude: results[0].longitude ?? 0
            }
        } catch (error) {
            console.error('ジオコーディングに失敗しました。', error)
            throw new Error('住所から位置情報を取得できませんでした')
        }
    }
}