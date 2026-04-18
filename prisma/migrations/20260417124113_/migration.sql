-- CreateTable
CREATE TABLE "GmailCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GmailCode_id_key" ON "GmailCode"("id");

-- CreateIndex
CREATE UNIQUE INDEX "GmailCode_code_key" ON "GmailCode"("code");
