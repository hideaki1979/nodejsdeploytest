TRUNCATE TABLE toppings, call_options, noodle_types RESTART IDENTITY CASCADE;

-- トッピング（toppings）テーブルへのINSERT
INSERT INTO toppings (topping_category, topping_name, created_at, updated_at)
VALUES
  (2, 'ニンニク', current_timestamp, current_timestamp),
  (2, '野菜',   current_timestamp, current_timestamp),
  (2, 'アブラ', current_timestamp, current_timestamp),
  (2, 'カラメ', current_timestamp, current_timestamp),
  (1, '麺の硬さ',     current_timestamp, current_timestamp),
  (3, '麺量',     current_timestamp, current_timestamp);

-- コール内容（call_options）テーブルへのINSERT
INSERT INTO call_options (call_category, call_option_name, created_at, updated_at)
VALUES
  -- 【コール分類：麺の硬さ】（call_category = 1）
  (1, '柔らかめ', current_timestamp, current_timestamp),
  (1, '硬め',     current_timestamp, current_timestamp),
  (1, 'カタカタ', current_timestamp, current_timestamp),
  -- 【コール分類：トッピング】（call_category = 2）
  (2, '抜き',       current_timestamp, current_timestamp),
  (2, '少なめ',     current_timestamp, current_timestamp),
  (2, 'ちょいマシ', current_timestamp, current_timestamp),
  (2, 'マシ',       current_timestamp, current_timestamp),
  (2, 'マシマシ',   current_timestamp, current_timestamp),
  -- 【コール分類：麺量】（call_category = 3）
  (3, '半分', current_timestamp, current_timestamp),
  (3, '少なめ',     current_timestamp, current_timestamp);

-- 麺種別（noodle_types）テーブルへのINSERT
INSERT INTO noodle_types (noodle_type_name, created_at, updated_at)
VALUES
  ('ラーメン', current_timestamp, current_timestamp),
  ('つけ麺',   current_timestamp, current_timestamp),
  ('汁なし',   current_timestamp, current_timestamp);

SELECT * FROM toppings;
SELECT * FROM call_options;
SELECT * FROM noodle_types;