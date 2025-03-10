/*
  Warnings:

  - A unique constraint covering the columns `[store_id]` on the table `maps` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "maps_store_id_key" ON "maps"("store_id");
