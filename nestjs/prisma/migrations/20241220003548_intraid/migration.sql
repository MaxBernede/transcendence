-- CreateTable
CREATE TABLE "achievement" (
    "id" SERIAL NOT NULL,
    "achievement_name" VARCHAR NOT NULL,
    "description" VARCHAR NOT NULL,
    "filename" VARCHAR,

    CONSTRAINT "PK_441339f40e8ce717525a381671e" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_history" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR NOT NULL,
    "opponent" VARCHAR NOT NULL,
    "result" VARCHAR NOT NULL,
    "score" VARCHAR NOT NULL,
    "date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "PK_efc236c939f8248229d873f4893" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "intra_id" VARCHAR,
    "username" VARCHAR NOT NULL,
    "email" VARCHAR,
    "avatar" VARCHAR,
    "password" VARCHAR,
    "hash_key" VARCHAR,
    "phone_number_2fa" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "loose" INTEGER NOT NULL DEFAULT 0,
    "ladder_level" INTEGER NOT NULL DEFAULT 0,
    "activity_status" VARCHAR,

    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievement_entity" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "achievementId" INTEGER NOT NULL,

    CONSTRAINT "PK_65d9719ee887e1bb20ebb9a6001" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "user_id" INTEGER NOT NULL,
    "achievement_id" INTEGER NOT NULL,

    CONSTRAINT "PK_a103993b75768d942744e4b3b40" PRIMARY KEY ("user_id","achievement_id")
);

-- CreateTable
CREATE TABLE "user_friends_user" (
    "userId_1" INTEGER NOT NULL,
    "userId_2" INTEGER NOT NULL,

    CONSTRAINT "PK_f2b5631d91f6b7fda632135932f" PRIMARY KEY ("userId_1","userId_2")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_fb1bf9570b9dd4146acf300edf2" ON "achievement"("achievement_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_intra_id_key" ON "user"("intra_id");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_78a916df40e02a9deb1c4b75edb" ON "user"("username");

-- CreateIndex
CREATE INDEX "IDX_36b4a912357ad1342b735d4d4c" ON "user_achievements"("achievement_id");

-- CreateIndex
CREATE INDEX "IDX_c755e3741cd46fc5ae3ef06592" ON "user_achievements"("user_id");

-- CreateIndex
CREATE INDEX "IDX_04840fd160b733de706a336013" ON "user_friends_user"("userId_1");

-- CreateIndex
CREATE INDEX "IDX_e81f236c989f3fd54836b50a12" ON "user_friends_user"("userId_2");

-- AddForeignKey
ALTER TABLE "match_history" ADD CONSTRAINT "FK_fab180b043d043cd669ea0fcf02" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_36b4a912357ad1342b735d4d4c8" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_c755e3741cd46fc5ae3ef06592c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_friends_user" ADD CONSTRAINT "FK_04840fd160b733de706a3360134" FOREIGN KEY ("userId_1") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_friends_user" ADD CONSTRAINT "FK_e81f236c989f3fd54836b50a12d" FOREIGN KEY ("userId_2") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
