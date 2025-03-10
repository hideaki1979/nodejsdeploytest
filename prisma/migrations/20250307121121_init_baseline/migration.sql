-- CreateEnum
CREATE TYPE "CallTiming" AS ENUM ('pre_call', 'post_call');

-- CreateTable
CREATE TABLE "stores" (
    "id" BIGSERIAL NOT NULL,
    "store_name" VARCHAR(255) NOT NULL,
    "branch_name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "business_hours" VARCHAR(255) NOT NULL,
    "regular_holidays" VARCHAR(255) NOT NULL,
    "prior_meal_voucher" BOOLEAN NOT NULL DEFAULT false,
    "topping_details" TEXT NOT NULL,
    "call_details" TEXT NOT NULL,
    "is_all_increased" BOOLEAN NOT NULL DEFAULT false,
    "is_lot" BOOLEAN NOT NULL DEFAULT false,
    "lot_detail" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maps" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "menu_type" INTEGER NOT NULL,
    "menu_name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_store_topping_calls" (
    "id" BIGSERIAL NOT NULL,
    "image_id" BIGINT NOT NULL,
    "topping_id" BIGINT NOT NULL,
    "store_topping_call_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "image_store_topping_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toppings" (
    "id" BIGSERIAL NOT NULL,
    "topping_name" VARCHAR(255) NOT NULL,
    "topping_category" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "toppings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_options" (
    "id" BIGSERIAL NOT NULL,
    "call_category" INTEGER NOT NULL,
    "call_option_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "call_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "noodle_types" (
    "id" BIGSERIAL NOT NULL,
    "noodle_type_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "noodle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_topping_calls" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "topping_id" BIGINT NOT NULL,
    "call_option_id" BIGINT NOT NULL,
    "call_timing" "CallTiming" NOT NULL,
    "noodle_type_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "store_topping_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6),

    CONSTRAINT "primaryitem" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "maps" ADD CONSTRAINT "maps_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_store_topping_calls" ADD CONSTRAINT "image_store_topping_calls_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_store_topping_calls" ADD CONSTRAINT "image_store_topping_calls_store_topping_call_id_fkey" FOREIGN KEY ("store_topping_call_id") REFERENCES "store_topping_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_store_topping_calls" ADD CONSTRAINT "image_store_topping_calls_topping_id_fkey" FOREIGN KEY ("topping_id") REFERENCES "toppings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_topping_calls" ADD CONSTRAINT "store_topping_calls_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_topping_calls" ADD CONSTRAINT "store_topping_calls_topping_id_fkey" FOREIGN KEY ("topping_id") REFERENCES "toppings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_topping_calls" ADD CONSTRAINT "store_topping_calls_call_option_id_fkey" FOREIGN KEY ("call_option_id") REFERENCES "call_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_topping_calls" ADD CONSTRAINT "store_topping_calls_noodle_type_id_fkey" FOREIGN KEY ("noodle_type_id") REFERENCES "noodle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
