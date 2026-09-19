/*
  Warnings:

  - You are about to drop the column `pdfPages` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `pdfUrl` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `questionPdfUrl` on the `pyqs` table. All the data in the column will be lost.
  - You are about to drop the column `solutionPdfUrl` on the `pyqs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('PDF', 'IMAGE');

-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "chapters" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "notes" DROP COLUMN "pdfPages",
DROP COLUMN "pdfUrl",
ADD COLUMN     "pdfFileId" TEXT,
ADD COLUMN     "thumbnailFileId" TEXT;

-- AlterTable
ALTER TABLE "pyqs" DROP COLUMN "questionPdfUrl",
DROP COLUMN "solutionPdfUrl",
ADD COLUMN     "chapterId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "questionFileId" TEXT,
ADD COLUMN     "solutionFileId" TEXT;

-- AlterTable
ALTER TABLE "streams" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "code" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "file_assets" (
    "id" TEXT NOT NULL,
    "kind" "FileKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_images" (
    "id" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "noteId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_storageKey_key" ON "file_assets"("storageKey");

-- CreateIndex
CREATE INDEX "file_assets_kind_idx" ON "file_assets"("kind");

-- CreateIndex
CREATE INDEX "file_assets_uploadedById_idx" ON "file_assets"("uploadedById");

-- CreateIndex
CREATE INDEX "note_images_noteId_displayOrder_idx" ON "note_images"("noteId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "note_images_noteId_fileId_key" ON "note_images"("noteId", "fileId");

-- CreateIndex
CREATE INDEX "chapters_subjectId_displayOrder_idx" ON "chapters"("subjectId", "displayOrder");

-- CreateIndex
CREATE INDEX "notes_pdfFileId_idx" ON "notes"("pdfFileId");

-- CreateIndex
CREATE INDEX "notes_thumbnailFileId_idx" ON "notes"("thumbnailFileId");

-- CreateIndex
CREATE INDEX "pyqs_chapterId_idx" ON "pyqs"("chapterId");

-- CreateIndex
CREATE INDEX "subjects_code_idx" ON "subjects"("code");

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_images" ADD CONSTRAINT "note_images_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_images" ADD CONSTRAINT "note_images_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_pdfFileId_fkey" FOREIGN KEY ("pdfFileId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_thumbnailFileId_fkey" FOREIGN KEY ("thumbnailFileId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pyqs" ADD CONSTRAINT "pyqs_questionFileId_fkey" FOREIGN KEY ("questionFileId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pyqs" ADD CONSTRAINT "pyqs_solutionFileId_fkey" FOREIGN KEY ("solutionFileId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pyqs" ADD CONSTRAINT "pyqs_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written constraints (Prisma schema language cannot express these).
-- ---------------------------------------------------------------------------

-- Subject codes are optional but must be unique when present. A plain @@unique
-- would not enforce this, because Postgres treats NULLs as distinct.
CREATE UNIQUE INDEX "subjects_code_key_not_null"
  ON "subjects" ("code")
  WHERE "code" IS NOT NULL;

-- A file's declared kind must match its MIME type, so a PNG can never be filed
-- as a PDF and then served with the wrong content type.
ALTER TABLE "file_assets"
  ADD CONSTRAINT "file_assets_kind_matches_mime"
  CHECK (
    ("kind" = 'PDF'   AND "mimeType" = 'application/pdf') OR
    ("kind" = 'IMAGE' AND "mimeType" LIKE 'image/%')
  );

-- Zero-byte uploads are always a bug.
ALTER TABLE "file_assets"
  ADD CONSTRAINT "file_assets_size_positive"
  CHECK ("sizeBytes" > 0);
