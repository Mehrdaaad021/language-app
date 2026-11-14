/*
  Warnings:

  - The values [ADMIN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `LoginAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SiteConfig` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `workspaceId` on table `Note` required. This step will fail if there are existing NULL values in that column.
  - Made the column `workspaceId` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `workspaceId` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `workspaceId` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PlatformAccess" AS ENUM ('USER', 'ADMIN');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('TEACHER', 'STUDENT');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'TEACHER';
COMMIT;

-- DropIndex
DROP INDEX "Note_workspaceId_studentId_date_idx";

-- DropIndex
DROP INDEX "Payment_workspaceId_status_date_idx";

-- DropIndex
DROP INDEX "Payment_workspaceId_studentId_date_idx";

-- DropIndex
DROP INDEX "Session_workspaceId_status_date_idx";

-- DropIndex
DROP INDEX "Session_workspaceId_studentId_date_idx";

-- DropIndex
DROP INDEX "Student_workspaceId_name_idx";

-- AlterTable
ALTER TABLE "Note" ALTER COLUMN "workspaceId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "workspaceId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
ALTER COLUMN "workspaceId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "workspaceId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "platformRole" "PlatformAccess" NOT NULL DEFAULT 'USER',
ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ALTER COLUMN "role" SET DEFAULT 'TEACHER';

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "LoginAttempt";

-- DropTable
DROP TABLE "SiteConfig";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "SessionStatus";

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reply" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repliedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "Note_workspaceId_idx" ON "Note"("workspaceId");

-- CreateIndex
CREATE INDEX "Note_studentId_idx" ON "Note"("studentId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Payment_workspaceId_idx" ON "Payment"("workspaceId");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Session_workspaceId_idx" ON "Session"("workspaceId");

-- CreateIndex
CREATE INDEX "Session_studentId_idx" ON "Session"("studentId");

-- CreateIndex
CREATE INDEX "Student_workspaceId_idx" ON "Student"("workspaceId");

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
