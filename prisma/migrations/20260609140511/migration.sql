-- CreateTable
CREATE TABLE "profile_app_album" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "theme" VARCHAR(50),
    "year" INTEGER,
    "is_shown" BOOLEAN NOT NULL,
    "is_default" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "profile_id" BIGINT NOT NULL,

    CONSTRAINT "profile_app_album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_app_albumimage" (
    "id" BIGSERIAL NOT NULL,
    "image" VARCHAR(100) NOT NULL,
    "is_shown" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "album_id" BIGINT NOT NULL,

    CONSTRAINT "profile_app_albumimage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_app_chat" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(30),
    "is_group" BOOLEAN NOT NULL,
    "avatar" VARCHAR(100),
    "admin_id" BIGINT,

    CONSTRAINT "chat_app_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_app_chat_users" (
    "id" BIGSERIAL NOT NULL,
    "chat_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "chat_app_chat_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_app_messageimage" (
    "id" BIGSERIAL NOT NULL,
    "image" VARCHAR(100) NOT NULL,
    "message_id" BIGINT NOT NULL,

    CONSTRAINT "chat_app_messageimage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_app_message" (
    "id" BIGSERIAL NOT NULL,
    "text" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "chat_id" BIGINT NOT NULL,
    "sender_id" BIGINT,

    CONSTRAINT "chat_app_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_app_post" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "topic" VARCHAR(255),
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "author_id" BIGINT NOT NULL,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "post_app_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_app_post_tags" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "tag_id" BIGINT NOT NULL,

    CONSTRAINT "post_app_post_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_app_postlink" (
    "id" BIGSERIAL NOT NULL,
    "url" VARCHAR(200) NOT NULL,
    "post_id" BIGINT NOT NULL,

    CONSTRAINT "post_app_postlink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_app_tag" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "post_app_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_app_postimage" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "compressed_image" VARCHAR(100) NOT NULL,
    "original_image" VARCHAR(100) NOT NULL,

    CONSTRAINT "post_app_postimage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_app_postlike" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "post_app_postlike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_app_postheart" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "post_app_postheart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_app_postview" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "post_app_postview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_app_user" (
    "id" BIGSERIAL NOT NULL,
    "password" VARCHAR(128) NOT NULL,
    "last_login" TIMESTAMPTZ(6),
    "is_superuser" BOOLEAN NOT NULL,
    "first_name" VARCHAR(150) NOT NULL,
    "last_name" VARCHAR(150) NOT NULL,
    "is_staff" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "date_joined" TIMESTAMPTZ(6) NOT NULL,
    "username" VARCHAR(150),
    "email" VARCHAR(254) NOT NULL,

    CONSTRAINT "user_app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_app_profile" (
    "id" BIGSERIAL NOT NULL,
    "birth_date" DATE,
    "signature" VARCHAR(100),
    "avatar" VARCHAR(100),
    "pseudonym" VARCHAR(50),
    "is_text_signature" BOOLEAN NOT NULL,
    "is_image_signature" BOOLEAN NOT NULL,
    "user_id" BIGINT,

    CONSTRAINT "profile_app_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_group" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,

    CONSTRAINT "auth_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_group_permissions" (
    "id" BIGSERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "auth_group_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_permission" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "content_type_id" INTEGER NOT NULL,
    "codename" VARCHAR(100) NOT NULL,

    CONSTRAINT "auth_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_app_message_readers" (
    "id" BIGSERIAL NOT NULL,
    "message_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "chat_app_message_readers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_admin_log" (
    "id" SERIAL NOT NULL,
    "action_time" TIMESTAMPTZ(6) NOT NULL,
    "object_id" TEXT,
    "object_repr" VARCHAR(200) NOT NULL,
    "action_flag" SMALLINT NOT NULL,
    "change_message" TEXT NOT NULL,
    "content_type_id" INTEGER,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "django_admin_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_content_type" (
    "id" SERIAL NOT NULL,
    "app_label" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,

    CONSTRAINT "django_content_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_migrations" (
    "id" BIGSERIAL NOT NULL,
    "app" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "applied" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "django_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "django_session" (
    "session_key" VARCHAR(40) NOT NULL,
    "session_data" TEXT NOT NULL,
    "expire_date" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "django_session_pkey" PRIMARY KEY ("session_key")
);

-- CreateTable
CREATE TABLE "user_app_friendship" (
    "id" BIGSERIAL NOT NULL,
    "status" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "from_user_id" BIGINT NOT NULL,
    "to_user_id" BIGINT NOT NULL,

    CONSTRAINT "user_app_friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_app_user_groups" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "user_app_user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_app_user_user_permissions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "user_app_user_user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_app_album_profile_id_7414a460" ON "profile_app_album"("profile_id");

-- CreateIndex
CREATE INDEX "profile_app_albumimage_album_id_9736c867" ON "profile_app_albumimage"("album_id");

-- CreateIndex
CREATE INDEX "chat_app_chat_admin_id_f1deddb9" ON "chat_app_chat"("admin_id");

-- CreateIndex
CREATE INDEX "chat_app_chat_users_chat_id_5bba5169" ON "chat_app_chat_users"("chat_id");

-- CreateIndex
CREATE INDEX "chat_app_chat_users_user_id_7aff58dc" ON "chat_app_chat_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_app_chat_users_chat_id_user_id_b05bfe90_uniq" ON "chat_app_chat_users"("chat_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_app_messageimage_message_id_7967b5cb" ON "chat_app_messageimage"("message_id");

-- CreateIndex
CREATE INDEX "chat_app_message_chat_id_a7824698" ON "chat_app_message"("chat_id");

-- CreateIndex
CREATE INDEX "chat_app_message_sender_id_03c5fae9" ON "chat_app_message"("sender_id");

-- CreateIndex
CREATE INDEX "post_app_post_author_id_4cf2f14d" ON "post_app_post"("author_id");

-- CreateIndex
CREATE INDEX "post_app_post_tags_post_id_b72298ea" ON "post_app_post_tags"("post_id");

-- CreateIndex
CREATE INDEX "post_app_post_tags_tag_id_df0ee56c" ON "post_app_post_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_app_post_tags_post_id_tag_id_f9d7c733_uniq" ON "post_app_post_tags"("post_id", "tag_id");

-- CreateIndex
CREATE INDEX "post_app_postlink_post_id_38de8dee" ON "post_app_postlink"("post_id");

-- CreateIndex
CREATE INDEX "post_app_postimage_post_id_f96e8718" ON "post_app_postimage"("post_id");

-- CreateIndex
CREATE INDEX "post_app_postlike_post_id_fe24b1be" ON "post_app_postlike"("post_id");

-- CreateIndex
CREATE INDEX "post_app_postlike_user_id_12715559" ON "post_app_postlike"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_post_like" ON "post_app_postlike"("user_id", "post_id");

-- CreateIndex
CREATE INDEX "post_app_postheart_post_id_556aaef5" ON "post_app_postheart"("post_id");

-- CreateIndex
CREATE INDEX "post_app_postheart_user_id_e3112196" ON "post_app_postheart"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_post_hearts" ON "post_app_postheart"("user_id", "post_id");

-- CreateIndex
CREATE INDEX "post_app_postview_post_id_bfaa8cff" ON "post_app_postview"("post_id");

-- CreateIndex
CREATE INDEX "post_app_postview_user_id_3e80c157" ON "post_app_postview"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_post_view" ON "post_app_postview"("user_id", "post_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_app_user_username_e45e0961_uniq" ON "user_app_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_app_user_email_key" ON "user_app_user"("email");

-- CreateIndex
CREATE INDEX "user_app_user_email_e59b5739_like" ON "user_app_user"("email");

-- CreateIndex
CREATE INDEX "user_app_user_username_e45e0961_like" ON "user_app_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "profile_app_profile_user_id_key" ON "profile_app_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_group_name_key" ON "auth_group"("name");

-- CreateIndex
CREATE INDEX "auth_group_name_a6ea08ec_like" ON "auth_group"("name");

-- CreateIndex
CREATE INDEX "auth_group_permissions_group_id_b120cbf9" ON "auth_group_permissions"("group_id");

-- CreateIndex
CREATE INDEX "auth_group_permissions_permission_id_84c5c92e" ON "auth_group_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_group_permissions_group_id_permission_id_0cd325b0_uniq" ON "auth_group_permissions"("group_id", "permission_id");

-- CreateIndex
CREATE INDEX "auth_permission_content_type_id_2f476e4b" ON "auth_permission"("content_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_permission_content_type_id_codename_01ab375a_uniq" ON "auth_permission"("content_type_id", "codename");

-- CreateIndex
CREATE INDEX "chat_app_message_readers_message_id_adafa038" ON "chat_app_message_readers"("message_id");

-- CreateIndex
CREATE INDEX "chat_app_message_readers_user_id_11fb5647" ON "chat_app_message_readers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_app_message_readers_message_id_user_id_dfa7b323_uniq" ON "chat_app_message_readers"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "django_admin_log_content_type_id_c4bce8eb" ON "django_admin_log"("content_type_id");

-- CreateIndex
CREATE INDEX "django_admin_log_user_id_c564eba6" ON "django_admin_log"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "django_content_type_app_label_model_76bd3d3b_uniq" ON "django_content_type"("app_label", "model");

-- CreateIndex
CREATE INDEX "django_session_expire_date_a5c62663" ON "django_session"("expire_date");

-- CreateIndex
CREATE INDEX "django_session_session_key_c0390e0f_like" ON "django_session"("session_key");

-- CreateIndex
CREATE INDEX "user_app_friendship_from_user_id_e1d46b12" ON "user_app_friendship"("from_user_id");

-- CreateIndex
CREATE INDEX "user_app_friendship_to_user_id_f5d68c80" ON "user_app_friendship"("to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_app_friendship_from_user_id_to_user_id_1917f941_uniq" ON "user_app_friendship"("from_user_id", "to_user_id");

-- CreateIndex
CREATE INDEX "user_app_user_groups_group_id_77b237a8" ON "user_app_user_groups"("group_id");

-- CreateIndex
CREATE INDEX "user_app_user_groups_user_id_9ac3bba9" ON "user_app_user_groups"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_app_user_groups_user_id_group_id_13ac6bde_uniq" ON "user_app_user_groups"("user_id", "group_id");

-- CreateIndex
CREATE INDEX "user_app_user_user_permissions_permission_id_66c16b85" ON "user_app_user_user_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "user_app_user_user_permissions_user_id_6099c7a4" ON "user_app_user_user_permissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_app_user_user_permi_user_id_permission_id_46c11fb3_uniq" ON "user_app_user_user_permissions"("user_id", "permission_id");

-- AddForeignKey
ALTER TABLE "profile_app_album" ADD CONSTRAINT "profile_app_album_profile_id_7414a460_fk_profile_app_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile_app_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profile_app_albumimage" ADD CONSTRAINT "profile_app_albumima_album_id_9736c867_fk_profile_a" FOREIGN KEY ("album_id") REFERENCES "profile_app_album"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_app_chat" ADD CONSTRAINT "chat_app_chat_admin_id_f1deddb9_fk_user_app_user_id" FOREIGN KEY ("admin_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_app_chat_users" ADD CONSTRAINT "chat_app_chat_users_chat_id_5bba5169_fk_chat_app_chat_id" FOREIGN KEY ("chat_id") REFERENCES "chat_app_chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_app_chat_users" ADD CONSTRAINT "chat_app_chat_users_user_id_7aff58dc_fk_user_app_user_id" FOREIGN KEY ("user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_app_messageimage" ADD CONSTRAINT "chat_app_messageimag_message_id_7967b5cb_fk_chat_app_" FOREIGN KEY ("message_id") REFERENCES "chat_app_message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_app_message" ADD CONSTRAINT "chat_app_message_chat_id_a7824698_fk_chat_app_chat_id" FOREIGN KEY ("chat_id") REFERENCES "chat_app_chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_app_message" ADD CONSTRAINT "chat_app_message_sender_id_03c5fae9_fk_user_app_user_id" FOREIGN KEY ("sender_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_post" ADD CONSTRAINT "post_app_post_author_id_4cf2f14d_fk_user_app_user_id" FOREIGN KEY ("author_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_post_tags" ADD CONSTRAINT "post_app_post_tags_post_id_b72298ea_fk_post_app_post_id" FOREIGN KEY ("post_id") REFERENCES "post_app_post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_post_tags" ADD CONSTRAINT "post_app_post_tags_tag_id_df0ee56c_fk_post_app_tag_id" FOREIGN KEY ("tag_id") REFERENCES "post_app_tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_postlink" ADD CONSTRAINT "post_app_postlink_post_id_38de8dee_fk_post_app_post_id" FOREIGN KEY ("post_id") REFERENCES "post_app_post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_postimage" ADD CONSTRAINT "post_app_postimage_post_id_f96e8718_fk_post_app_post_id" FOREIGN KEY ("post_id") REFERENCES "post_app_post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_postlike" ADD CONSTRAINT "post_app_postlike_post_id_fe24b1be_fk_post_app_post_id" FOREIGN KEY ("post_id") REFERENCES "post_app_post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_postlike" ADD CONSTRAINT "post_app_postlike_user_id_12715559_fk_user_app_user_id" FOREIGN KEY ("user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_postheart" ADD CONSTRAINT "post_app_postheart_post_id_556aaef5_fk_post_app_post_id" FOREIGN KEY ("post_id") REFERENCES "post_app_post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_postheart" ADD CONSTRAINT "post_app_postheart_user_id_e3112196_fk_user_app_user_id" FOREIGN KEY ("user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_postview" ADD CONSTRAINT "post_app_postview_post_id_bfaa8cff_fk_post_app_post_id" FOREIGN KEY ("post_id") REFERENCES "post_app_post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_app_postview" ADD CONSTRAINT "post_app_postview_user_id_3e80c157_fk_user_app_user_id" FOREIGN KEY ("user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profile_app_profile" ADD CONSTRAINT "profile_app_profile_user_id_296a7b55_fk_user_app_user_id" FOREIGN KEY ("user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth_group_permissions" ADD CONSTRAINT "auth_group_permissio_permission_id_84c5c92e_fk_auth_perm" FOREIGN KEY ("permission_id") REFERENCES "auth_permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth_group_permissions" ADD CONSTRAINT "auth_group_permissions_group_id_b120cbf9_fk_auth_group_id" FOREIGN KEY ("group_id") REFERENCES "auth_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth_permission" ADD CONSTRAINT "auth_permission_content_type_id_2f476e4b_fk_django_co" FOREIGN KEY ("content_type_id") REFERENCES "django_content_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_app_message_readers" ADD CONSTRAINT "chat_app_message_rea_message_id_adafa038_fk_chat_app_" FOREIGN KEY ("message_id") REFERENCES "chat_app_message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_app_message_readers" ADD CONSTRAINT "chat_app_message_readers_user_id_11fb5647_fk_user_app_user_id" FOREIGN KEY ("user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "django_admin_log" ADD CONSTRAINT "django_admin_log_content_type_id_c4bce8eb_fk_django_co" FOREIGN KEY ("content_type_id") REFERENCES "django_content_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "django_admin_log" ADD CONSTRAINT "django_admin_log_user_id_c564eba6_fk_user_app_user_id" FOREIGN KEY ("user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_app_friendship" ADD CONSTRAINT "user_app_friendship_from_user_id_e1d46b12_fk_user_app_user_id" FOREIGN KEY ("from_user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_app_friendship" ADD CONSTRAINT "user_app_friendship_to_user_id_f5d68c80_fk_user_app_user_id" FOREIGN KEY ("to_user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_app_user_groups" ADD CONSTRAINT "user_app_user_groups_group_id_77b237a8_fk_auth_group_id" FOREIGN KEY ("group_id") REFERENCES "auth_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_app_user_groups" ADD CONSTRAINT "user_app_user_groups_user_id_9ac3bba9_fk_user_app_user_id" FOREIGN KEY ("user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_app_user_user_permissions" ADD CONSTRAINT "user_app_user_user_p_permission_id_66c16b85_fk_auth_perm" FOREIGN KEY ("permission_id") REFERENCES "auth_permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_app_user_user_permissions" ADD CONSTRAINT "user_app_user_user_p_user_id_6099c7a4_fk_user_app_" FOREIGN KEY ("user_id") REFERENCES "user_app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
