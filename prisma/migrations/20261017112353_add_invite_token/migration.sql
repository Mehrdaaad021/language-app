/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "invitedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Student_inviteToken_key" ON "Student"("inviteToken");
