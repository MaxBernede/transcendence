-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."conversation_type_enum" AS ENUM('DM', 'GROUP');--> statement-breakpoint
CREATE TYPE "public"."user_conversation_role_enum" AS ENUM('MEMBER', 'ADMIN', 'OWNER');--> statement-breakpoint
CREATE TABLE "migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" bigint NOT NULL,
	"name" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievement_entity" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"achievementId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar NOT NULL,
	"opponent" varchar NOT NULL,
	"result" varchar NOT NULL,
	"score" varchar NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"userId" integer
);
--> statement-breakpoint
CREATE TABLE "chat" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"text" text NOT NULL,
	"edited" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"conversationId" uuid,
	"userId" integer
);
--> statement-breakpoint
CREATE TABLE "achievement" (
	"id" serial PRIMARY KEY NOT NULL,
	"achievement_name" varchar NOT NULL,
	"description" varchar NOT NULL,
	"filename" varchar,
	CONSTRAINT "UQ_fb1bf9570b9dd4146acf300edf2" UNIQUE("achievement_name")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"intraId" integer,
	"username" varchar,
	"firstName" varchar DEFAULT '',
	"lastName" varchar DEFAULT '',
	"email" varchar,
	"avatar" varchar,
	"password" varchar,
	"tempJWT" varchar,
	"secret_2fa" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"loose" integer DEFAULT 0 NOT NULL,
	"activity_status" varchar,
	"image" json,
	"newUser" boolean DEFAULT true NOT NULL,
	"socketId" varchar,
	CONSTRAINT "UQ_bb21f7478f422418fbd53620078" UNIQUE("intraId"),
	CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" "conversation_type_enum" DEFAULT 'DM' NOT NULL,
	"name" text DEFAULT 'Untitled Group' NOT NULL,
	"password" text,
	"lastActivity" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friends" (
	"id" serial PRIMARY KEY NOT NULL,
	"mainUserId" integer NOT NULL,
	"secondUserId" integer NOT NULL,
	"status" varchar
);
--> statement-breakpoint
CREATE TABLE "user_conversation" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"userId" integer NOT NULL,
	"conversationId" uuid NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"banEnd" timestamp,
	"muted" boolean DEFAULT false NOT NULL,
	"mutedUntil" timestamp,
	"role" "user_conversation_role_enum" DEFAULT 'MEMBER' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_friends_user" (
	"userId_1" integer NOT NULL,
	"userId_2" integer NOT NULL,
	CONSTRAINT "PK_f2b5631d91f6b7fda632135932f" PRIMARY KEY("userId_1","userId_2")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" integer NOT NULL,
	"achievement_id" integer NOT NULL,
	CONSTRAINT "PK_a103993b75768d942744e4b3b40" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
ALTER TABLE "match_history" ADD CONSTRAINT "FK_fab180b043d043cd669ea0fcf02" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "FK_a19eb5a72b6d73ac18ccc84c64e" FOREIGN KEY ("conversationId") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "FK_52af74c7484586ef4bdfd8e4dbb" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_conversation" ADD CONSTRAINT "FK_610e529db4ea61302bb83bf8d81" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_conversation" ADD CONSTRAINT "FK_a3e5e26b62e895c0478fb104bec" FOREIGN KEY ("conversationId") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_friends_user" ADD CONSTRAINT "FK_04840fd160b733de706a3360134" FOREIGN KEY ("userId_1") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_friends_user" ADD CONSTRAINT "FK_e81f236c989f3fd54836b50a12d" FOREIGN KEY ("userId_2") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_c755e3741cd46fc5ae3ef06592c" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_36b4a912357ad1342b735d4d4c8" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_04840fd160b733de706a336013" ON "user_friends_user" USING btree ("userId_1" int4_ops);--> statement-breakpoint
CREATE INDEX "IDX_e81f236c989f3fd54836b50a12" ON "user_friends_user" USING btree ("userId_2" int4_ops);--> statement-breakpoint
CREATE INDEX "IDX_36b4a912357ad1342b735d4d4c" ON "user_achievements" USING btree ("achievement_id" int4_ops);--> statement-breakpoint
CREATE INDEX "IDX_c755e3741cd46fc5ae3ef06592" ON "user_achievements" USING btree ("user_id" int4_ops);
*/