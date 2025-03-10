TRUNCATE TABLE toppings, call_options, noodle_types RESTART IDENTITY CASCADE;

-- トッピング（toppings）テーブルへのINSERT
INSERT INTO toppings (topping_name, created_at, updated_at)
VALUES
  ('ニンニク', current_timestamp, current_timestamp),
  ('野菜',   current_timestamp, current_timestamp),
  ('アブラ', current_timestamp, current_timestamp),
  ('カラメ', current_timestamp, current_timestamp),
  ('麺',     current_timestamp, current_timestamp);

-- コール内容（call_options）テーブルへのINSERT
INSERT INTO call_options (call_category, call_option_name, created_at, updated_at)
VALUES
  -- 【コール分類：麺】（call_category = 1）
  (1, '柔らかめ', current_timestamp, current_timestamp),
  (1, '硬め',     current_timestamp, current_timestamp),
  (1, 'カタカタ', current_timestamp, current_timestamp),
  -- 【コール分類：トッピング】（call_category = 2）
  (2, '無し',       current_timestamp, current_timestamp),
  (2, '少なめ',     current_timestamp, current_timestamp),
  (2, '普通',       current_timestamp, current_timestamp),
  (2, 'ちょいマシ', current_timestamp, current_timestamp),
  (2, 'マシ',       current_timestamp, current_timestamp),
  (2, 'マシマシ',   current_timestamp, current_timestamp);

-- 麺種別（noodle_types）テーブルへのINSERT
INSERT INTO noodle_types (noodle_type_name, created_at, updated_at)
VALUES
  ('ラーメン', current_timestamp, current_timestamp),
  ('つけ麺',   current_timestamp, current_timestamp),
  ('汁なし',   current_timestamp, current_timestamp);

SELECT * FROM toppings;
SELECT * FROM call_options;
SELECT * FROM noodle_types;