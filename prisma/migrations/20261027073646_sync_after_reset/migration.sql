-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- DropIndex
DROP INDEX "Note_studentId_date_idx";

-- DropIndex
DROP INDEX "Payment_studentId_date_idx";

-- DropIndex
DROP INDEX "Session_studentId_date_idx";

-- DropIndex
DROP INDEX "Student_name_idx";

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "backupCodes" TEXT,
ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_ownerId_key" ON "Workspace"("ownerId");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "Note_workspaceId_studentId_date_idx" ON "Note"("workspaceId", "studentId", "date");

-- CreateIndex
CREATE INDEX "Payment_workspaceId_studentId_date_idx" ON "Payment"("workspaceId", "studentId", "date");

-- CreateIndex
CREATE INDEX "Payment_workspaceId_status_date_idx" ON "Payment"("workspaceId", "status", "date");

-- CreateIndex
CREATE INDEX "Session_workspaceId_studentId_date_idx" ON "Session"("workspaceId", "studentId", "date");

-- CreateIndex
CREATE INDEX "Session_workspaceId_status_date_idx" ON "Session"("workspaceId", "status", "date");

-- CreateIndex
CREATE INDEX "Student_workspaceId_name_idx" ON "Student"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
