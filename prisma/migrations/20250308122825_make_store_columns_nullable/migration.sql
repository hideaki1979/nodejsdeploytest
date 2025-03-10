-- AlterTable
ALTER TABLE "stores" ALTER COLUMN "branch_name" DROP NOT NULL,
ALTER COLUMN "topping_details" DROP NOT NULL,
ALTER COLUMN "call_details" DROP NOT NULL,
ALTER COLUMN "lot_detail" DROP NOT NULL;
