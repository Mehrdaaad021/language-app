/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Workspace` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "slug" TEXT;

-- CreateTable
CREATE TABLE "LandingContent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "heroBadge" TEXT NOT NULL DEFAULT '',
    "heroTitle1" TEXT NOT NULL DEFAULT '',
    "heroTitle2" TEXT NOT NULL DEFAULT '',
    "heroSub" TEXT NOT NULL DEFAULT '',
    "ctaPrimary" TEXT NOT NULL DEFAULT '',
    "ctaSecondary" TEXT NOT NULL DEFAULT '',
    "accentColor" TEXT NOT NULL DEFAULT '#D94F63',
    "aboutText" TEXT NOT NULL DEFAULT '',
    "contactInfo" TEXT NOT NULL DEFAULT '',
    "features" JSONB NOT NULL DEFAULT '[]',
    "testimonials" JSONB NOT NULL DEFAULT '[]',
    "pricing" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandingContent_workspaceId_key" ON "LandingContent"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- AddForeignKey
ALTER TABLE "LandingContent" ADD CONSTRAINT "LandingContent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
