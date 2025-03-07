-- 店舗情報テーブル
-- 店舗に関する基本情報を管理するメインテーブル
CREATE TABLE stores (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    store_name VARCHAR(255),           -- 店舗名
    branch_name VARCHAR(255),          -- 支店名
    address VARCHAR(255),              -- 住所
    business_hours VARCHAR(255),       -- 営業時間
    regular_holidays VARCHAR(255),     -- 定休日
    prior_meal_voucher BOOLEAN,        -- 事前食券購入の有無
    topping_details TEXT,              -- トッピングの詳細情報
    call_details TEXT,                 -- コール詳細情報
    is_all_increased BOOLEAN,          -- 全体増量の有無
    is_lot BOOLEAN,                    -- 抽選制の有無
    lot_detail TEXT,                   -- 抽選に関する詳細情報
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 地図情報テーブル
-- 店舗の位置情報（緯度・経度）を管理するテーブル
CREATE TABLE maps (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    store_id BIGINT REFERENCES stores(id), -- 店舗への参照キー
    latitude NUMERIC(10,8),                -- 緯度（小数点以下8桁まで）
    longitude NUMERIC(11,8),               -- 経度（小数点以下8桁まで）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 画像情報テーブル
-- メニューや店舗に関連する画像を管理するテーブル
CREATE TABLE images (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    store_id BIGINT REFERENCES stores(id), -- 店舗への参照キー
    menu_type INTEGER,                     -- メニューの種類を表す数値
    menu_name TEXT,                        -- メニュー名
    image_url TEXT,                        -- 画像のURL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 画像・店舗・トッピングコールの関連テーブル
-- 画像とトッピングコールの関連を管理する中間テーブル
CREATE TABLE image_store_topping_calls (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    image_id BIGINT REFERENCES images(id),                       -- 画像への参照キー
    topping_id BIGINT REFERENCES toppings(id),                   -- トッピングへの参照キー
    store_topping_call_id BIGINT REFERENCES store_topping_calls(id), -- 店舗トッピングコールへの参照キー
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- トッピング情報テーブル
-- 利用可能なトッピングの情報を管理するテーブル
CREATE TABLE toppings (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    topping_name VARCHAR(255),         -- トッピング名
    topping_category INTEGER,          -- トッピングのカテゴリ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- コールオプション情報テーブル
-- 注文時のコールオプションを管理するテーブル
CREATE TABLE call_options (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    call_category INTEGER,             -- コールのカテゴリ
    call_option_name VARCHAR(255),     -- コールオプション名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 麺の種類テーブル
-- 提供される麺の種類を管理するテーブル
CREATE TABLE noodle_types (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    noodle_type_name VARCHAR(255),     -- 麺の種類名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- コールタイミングを表すENUM型の作成
-- トッピングコールのタイミングを事前と事後で区別する
CREATE TYPE CallTiming AS ENUM ('pre_call', 'post_call');

-- 店舗トッピングコール情報テーブル
-- 店舗ごとのトッピングコールの設定を管理するテーブル
CREATE TABLE store_topping_calls (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    store_id BIGINT REFERENCES stores(id),          -- 店舗への参照キー
    topping_id BIGINT REFERENCES toppings(id),      -- トッピングへの参照キー
    call_option_id BIGINT REFERENCES call_options(id), -- コールオプションへの参照キー
    call_timing "CallTiming" NOT NULL,              -- コールタイミング（事前/事後）
    noodle_type_id BIGINT REFERENCES noodle_types(id), -- 麺の種類への参照キー
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 更新日時を自動更新するための共通関数
-- レコード更新時に自動的にupdated_atカラムを現在時刻で更新
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 各テーブルに更新日時自動更新トリガーを作成
-- レコード更新時にupdate_timestamp関数を実行するトリガー
CREATE TRIGGER update_stores_timestamp
BEFORE UPDATE ON stores
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_maps_timestamp
BEFORE UPDATE ON maps
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_images_timestamp
BEFORE UPDATE ON images
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_image_store_topping_calls_timestamp
BEFORE UPDATE ON image_store_topping_calls
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_toppings_timestamp
BEFORE UPDATE ON toppings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_call_options_timestamp
BEFORE UPDATE ON call_options
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_noodle_types_timestamp
BEFORE UPDATE ON noodle_types
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_store_topping_calls_timestamp
BEFORE UPDATE ON store_topping_calls
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
