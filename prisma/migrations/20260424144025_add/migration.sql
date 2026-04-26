-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "authorName" TEXT,
    "userName" TEXT,
    "status" TEXT,
    "birthDate" DATETIME,
    "sign" TEXT,
    "currentAvatarId" INTEGER DEFAULT 1,
    CONSTRAINT "User_currentAvatarId_fkey" FOREIGN KEY ("currentAvatarId") REFERENCES "UserAvatar" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("authorName", "birthDate", "currentAvatarId", "email", "id", "password", "sign", "status", "userName") SELECT "authorName", "birthDate", "currentAvatarId", "email", "id", "password", "sign", "status", "userName" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
