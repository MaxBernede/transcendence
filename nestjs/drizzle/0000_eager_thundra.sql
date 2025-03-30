-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
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
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar,
	"avatar" varchar,
	"password" varchar,
	"hash_key" varchar,
	"phone_number_2fa" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"loose" integer DEFAULT 0 NOT NULL,
	"ladder_level" integer DEFAULT 0 NOT NULL,
	"activity_status" varchar,
	CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE("username")
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
CREATE TABLE "achievement" (
	"id" serial PRIMARY KEY NOT NULL,
	"achievement_name" varchar NOT NULL,
	"description" varchar NOT NULL,
	"filename" varchar,
	CONSTRAINT "UQ_fb1bf9570b9dd4146acf300edf2" UNIQUE("achievement_name")
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
ALTER TABLE "user_friends_user" ADD CONSTRAINT "FK_04840fd160b733de706a3360134" FOREIGN KEY ("userId_1") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_friends_user" ADD CONSTRAINT "FK_e81f236c989f3fd54836b50a12d" FOREIGN KEY ("userId_2") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_c755e3741cd46fc5ae3ef06592c" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_36b4a912357ad1342b735d4d4c8" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_04840fd160b733de706a336013" ON "user_friends_user" USING btree ("userId_1" int4_ops);--> statement-breakpoint
CREATE INDEX "IDX_e81f236c989f3fd54836b50a12" ON "user_friends_user" USING btree ("userId_2" int4_ops);--> statement-breakpoint
CREATE INDEX "IDX_36b4a912357ad1342b735d4d4c" ON "user_achievements" USING btree ("achievement_id" int4_ops);--> statement-breakpoint
CREATE INDEX "IDX_c755e3741cd46fc5ae3ef06592" ON "user_achievements" USING btree ("user_id" int4_ops);
*/