/*
  Warnings:

  - You are about to drop the column `url` on the `AlbumImage` table. All the data in the column will be lost.
  - Added the required column `image` to the `AlbumImage` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AlbumImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image" TEXT NOT NULL,
    "albumId" INTEGER NOT NULL,
    CONSTRAINT "AlbumImage_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AlbumImage" ("albumId", "id") SELECT "albumId", "id" FROM "AlbumImage";
DROP TABLE "AlbumImage";
ALTER TABLE "new_AlbumImage" RENAME TO "AlbumImage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
