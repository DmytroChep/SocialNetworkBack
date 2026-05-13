/*
  Warnings:

  - A unique constraint covering the columns `[post_id,tag_id]` on the table `post_app_post_tags` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,post_id]` on the table `post_app_postheart` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,post_id]` on the table `post_app_postview` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `post_app_tag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "user_app_emailverification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "new_email" TEXT,
    "expires_at" DATETIME NOT NULL,
    CONSTRAINT "user_app_emailverification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_app_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_app_user_groups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    CONSTRAINT "user_app_user_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_app_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_app_user_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "auth_group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_app_user_user_permissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    CONSTRAINT "user_app_user_user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_app_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_app_user_user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "auth_permission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auth_group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "auth_group_permissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "group_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    CONSTRAINT "auth_group_permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "auth_group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auth_group_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "auth_permission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auth_permission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "content_type_id" INTEGER NOT NULL,
    "codename" TEXT NOT NULL,
    CONSTRAINT "auth_permission_content_type_id_fkey" FOREIGN KEY ("content_type_id") REFERENCES "django_content_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "django_content_type" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "app_label" TEXT NOT NULL,
    "model" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "django_admin_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "object_id" TEXT,
    "object_repr" TEXT NOT NULL,
    "action_flag" INTEGER NOT NULL,
    "change_message" TEXT NOT NULL,
    "content_type_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "django_admin_log_content_type_id_fkey" FOREIGN KEY ("content_type_id") REFERENCES "django_content_type" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "django_admin_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_app_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "django_migrations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "app" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applied" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "django_session" (
    "session_key" TEXT NOT NULL PRIMARY KEY,
    "session_data" TEXT NOT NULL,
    "expire_date" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "profile_app_profile_friends" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "from_profile_id" INTEGER NOT NULL,
    "to_profile_id" INTEGER NOT NULL,
    CONSTRAINT "profile_app_profile_friends_from_profile_id_fkey" FOREIGN KEY ("from_profile_id") REFERENCES "profile_app_profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "profile_app_profile_friends_to_profile_id_fkey" FOREIGN KEY ("to_profile_id") REFERENCES "profile_app_profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_app_chat_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "chat_app_chat_users_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chat_app_chat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chat_app_chat_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_app_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_app_message_readers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "chat_app_message_readers_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_app_message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chat_app_message_readers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_app_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_profile_app_profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "birth_date" DATETIME,
    "signature" TEXT,
    "avatar" TEXT,
    "pseudonym" TEXT,
    "is_image_signature" BOOLEAN NOT NULL DEFAULT false,
    "is_text_signature" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "profile_app_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_app_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_profile_app_profile" ("avatar", "birth_date", "id", "pseudonym", "signature", "user_id") SELECT "avatar", "birth_date", "id", "pseudonym", "signature", "user_id" FROM "profile_app_profile";
DROP TABLE "profile_app_profile";
ALTER TABLE "new_profile_app_profile" RENAME TO "profile_app_profile";
CREATE UNIQUE INDEX "profile_app_profile_user_id_key" ON "profile_app_profile"("user_id");
CREATE TABLE "new_user_app_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "password" TEXT NOT NULL,
    "last_login" DATETIME,
    "is_superuser" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT NOT NULL,
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "is_staff" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "date_joined" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_user_app_user" ("date_joined", "email", "id", "is_active", "is_staff", "is_superuser", "password", "username") SELECT "date_joined", "email", "id", "is_active", "is_staff", "is_superuser", "password", "username" FROM "user_app_user";
DROP TABLE "user_app_user";
ALTER TABLE "new_user_app_user" RENAME TO "user_app_user";
CREATE UNIQUE INDEX "user_app_user_username_key" ON "user_app_user"("username");
CREATE UNIQUE INDEX "user_app_user_email_key" ON "user_app_user"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "user_app_emailverification_user_id_key" ON "user_app_emailverification"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_app_user_groups_user_id_group_id_key" ON "user_app_user_groups"("user_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_app_user_user_permissions_user_id_permission_id_key" ON "user_app_user_user_permissions"("user_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_group_name_key" ON "auth_group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "auth_group_permissions_group_id_permission_id_key" ON "auth_group_permissions"("group_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_permission_content_type_id_codename_key" ON "auth_permission"("content_type_id", "codename");

-- CreateIndex
CREATE UNIQUE INDEX "django_content_type_app_label_model_key" ON "django_content_type"("app_label", "model");

-- CreateIndex
CREATE UNIQUE INDEX "profile_app_profile_friends_from_profile_id_to_profile_id_key" ON "profile_app_profile_friends"("from_profile_id", "to_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_app_chat_users_chat_id_user_id_key" ON "chat_app_chat_users"("chat_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_app_message_readers_message_id_user_id_key" ON "chat_app_message_readers"("message_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_app_post_tags_post_id_tag_id_key" ON "post_app_post_tags"("post_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_app_postheart_user_id_post_id_key" ON "post_app_postheart"("user_id", "post_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_app_postview_user_id_post_id_key" ON "post_app_postview"("user_id", "post_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_app_tag_name_key" ON "post_app_tag"("name");
