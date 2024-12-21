/*
  Warnings:

  - You are about to drop the column `intra_id` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_intra_id_key";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "intra_id";
