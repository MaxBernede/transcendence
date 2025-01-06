CREATE TABLE "friends" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id_1" integer NOT NULL,
	"user_id_2" integer NOT NULL,
	CONSTRAINT "friends_user_id_1_user_id_2_unique" UNIQUE("user_id_1","user_id_2"),
	CONSTRAINT "user_id1 === userid_2" CHECK ("friends"."user_id_1" <> "friends"."user_id_2"),
	CONSTRAINT "user_id_1 < user_id_2" CHECK ("friends"."user_id_1" < "friends"."user_id_2")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text,
	"password" text,
	"avatar_url" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_1_users_id_fk" FOREIGN KEY ("user_id_1") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_2_users_id_fk" FOREIGN KEY ("user_id_2") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;