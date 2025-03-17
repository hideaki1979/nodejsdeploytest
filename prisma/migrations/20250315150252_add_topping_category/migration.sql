/*
  Warnings:

  - Added the required column `topping_category` to the `toppings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "toppings" ADD COLUMN     "topping_category" INTEGER NOT NULL;
