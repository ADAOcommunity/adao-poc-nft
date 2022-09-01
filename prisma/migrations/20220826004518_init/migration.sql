-- CreateTable
CREATE TABLE "CollectionIndexes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submitedTx" TEXT,
    "collectionId" INTEGER NOT NULL,
    "reservedIndex" INTEGER NOT NULL,
    "reservedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionIndexes_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collectionName" TEXT NOT NULL,
    "collectionLimit" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionIndexes_id_key" ON "CollectionIndexes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_id_key" ON "Collection"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_collectionName_key" ON "Collection"("collectionName");
