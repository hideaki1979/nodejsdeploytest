-- CreateIndex
CREATE INDEX "image_store_topping_calls_image_id_idx" ON "image_store_topping_calls"("image_id");

-- CreateIndex
CREATE INDEX "image_store_topping_calls_store_topping_call_id_idx" ON "image_store_topping_calls"("store_topping_call_id");

-- CreateIndex
CREATE INDEX "image_store_topping_calls_topping_id_idx" ON "image_store_topping_calls"("topping_id");

-- CreateIndex
CREATE INDEX "images_store_id_idx" ON "images"("store_id");

-- CreateIndex
CREATE INDEX "images_user_id_idx" ON "images"("user_id");

-- CreateIndex
CREATE INDEX "store_topping_calls_store_id_idx" ON "store_topping_calls"("store_id");

-- CreateIndex
CREATE INDEX "store_topping_calls_topping_id_idx" ON "store_topping_calls"("topping_id");

-- CreateIndex
CREATE INDEX "store_topping_calls_call_option_id_idx" ON "store_topping_calls"("call_option_id");

-- CreateIndex
CREATE INDEX "store_topping_calls_noodle_type_id_idx" ON "store_topping_calls"("noodle_type_id");
