-- CreateTable
CREATE TABLE "DocumentBranch" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "sourceSnapshotId" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "yjsState" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentBranch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentBranch_documentId_idx" ON "DocumentBranch"("documentId");

-- CreateIndex
CREATE INDEX "DocumentBranch_createdById_idx" ON "DocumentBranch"("createdById");

-- CreateIndex
CREATE INDEX "DocumentBranch_sourceSnapshotId_idx" ON "DocumentBranch"("sourceSnapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentBranch_documentId_name_key" ON "DocumentBranch"("documentId", "name");

-- AddForeignKey
ALTER TABLE "DocumentBranch" ADD CONSTRAINT "DocumentBranch_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentBranch" ADD CONSTRAINT "DocumentBranch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
