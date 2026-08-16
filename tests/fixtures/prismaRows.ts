/**
 * Prisma が返す行を模したデータ。
 *
 * 主キーは実際と同じ BigInt、日時は Date で持つ。
 * レスポンスでの文字列化（#72 B-1）まで含めて本物と同じ経路を通すため、
 * ここで先回りして文字列にはしない。
 */

const TIMESTAMPS = {
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
}

export const toppingRow = {
    id: BigInt(1),
    topping_name: 'ニンニク',
    topping_category: 2,
    ...TIMESTAMPS,
}

export const callOptionRow = {
    id: BigInt(1),
    call_option_name: 'マシ',
    call_category: 2,
    ...TIMESTAMPS,
}

export const storeListRow = {
    id: BigInt(1),
    store_name: 'ラーメン二郎',
    branch_name: '三田本店',
}

/** GET /stores/{id} の select に対応する行（store_topping_calls をネストで持つ） */
export const storeDetailRow = {
    ...storeListRow,
    address: '東京都港区三田2-16-4',
    business_hours: '11:00-20:00',
    regular_holidays: '日曜',
    prior_meal_voucher: true,
    topping_details: 'ニンニク増し可',
    call_details: '着丼前にコール',
    is_all_increased: false,
    is_lot: false,
    lot_detail: null,
    store_topping_calls: [
        {
            id: BigInt(10),
            store_id: BigInt(1),
            topping_id: BigInt(1),
            call_option_id: BigInt(1),
            call_timing: 'pre_call',
            noodle_type_id: BigInt(1),
            topping: { id: BigInt(1), topping_category: 2, topping_name: 'ニンニク' },
            call_option: { id: BigInt(1), call_category: 2, call_option_name: 'マシ' },
            noodle_type: { id: BigInt(1), noodle_type_name: '普通' },
        },
    ],
}

export const mapRow = {
    id: BigInt(1),
    latitude: '35.6812',
    longitude: '139.7671',
    store: {
        id: BigInt(1),
        store_name: 'ラーメン二郎',
        branch_name: '三田本店',
        address: '東京都港区三田2-16-4',
        is_close: false,
    },
}

/** 登録・更新系が select で絞って返す店舗行 */
export const storeWriteRow = {
    id: BigInt(1),
    store_name: 'ラーメン二郎',
    branch_name: '三田本店',
    address: '東京都港区三田2-16-4',
    is_close: false,
}

export const mapWriteRow = {
    id: BigInt(1),
    store_id: BigInt(1),
    latitude: '35.6812',
    longitude: '139.7671',
}

export const storeToppingCallWriteRow = {
    id: BigInt(10),
    store_id: BigInt(1),
    topping_id: BigInt(1),
    call_option_id: BigInt(1),
    call_timing: 'pre_call',
    noodle_type_id: BigInt(1),
}

export const imageRow = {
    id: BigInt(100),
    store_id: BigInt(1),
    user_id: 'test-user-uid',
    menu_type: 1,
    menu_name: '小ラーメン',
    image_url: 'https://storage.googleapis.com/test-bucket/images/sample.jpg',
    ...TIMESTAMPS,
}
