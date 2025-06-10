/*
  Warnings:

  - You are about to drop the column `config` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `metrics` on the `Job` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "description" TEXT,
    "variables" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modelId" TEXT,
    "presetId" TEXT,
    "promptId" TEXT,
    "dataPath" TEXT,
    "outputPath" TEXT,
    "error" TEXT,
    "progress" REAL NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "Preset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("completedAt", "createdAt", "error", "id", "modelId", "status", "type") SELECT "completedAt", "createdAt", "error", "id", "modelId", "status", "type" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE TABLE "new_Model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Model" ("createdAt", "id", "name", "size", "status", "updatedAt") SELECT "createdAt", "id", "name", "size", "status", "updatedAt" FROM "Model";
DROP TABLE "Model";
ALTER TABLE "new_Model" RENAME TO "Model";
CREATE UNIQUE INDEX "Model_name_key" ON "Model"("name");
CREATE TABLE "new_Preset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Preset" ("config", "createdAt", "description", "id", "name", "updatedAt") SELECT "config", "createdAt", "description", "id", "name", "updatedAt" FROM "Preset";
DROP TABLE "Preset";
ALTER TABLE "new_Preset" RENAME TO "Preset";
CREATE UNIQUE INDEX "Preset_name_key" ON "Preset"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_name_key" ON "Prompt"("name");
