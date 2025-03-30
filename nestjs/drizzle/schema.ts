import { pgTable, serial, bigint, varchar, integer, unique, timestamp, foreignKey, index, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const migrations = pgTable("migrations", {
	id: serial().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timestamp: bigint({ mode: "number" }).notNull(),
	name: varchar().notNull(),
});

export const userAchievementEntity = pgTable("user_achievement_entity", {
	id: serial().primaryKey().notNull(),
	userId: integer().notNull(),
	achievementId: integer().notNull(),
});

export const user = pgTable("user", {
	id: serial().primaryKey().notNull(),
	username: varchar().notNull(),
	email: varchar(),
	avatar: varchar(),
	password: varchar(),
	hashKey: varchar("hash_key"),
	phoneNumber2Fa: integer("phone_number_2fa"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	wins: integer().default(0).notNull(),
	loose: integer().default(0).notNull(),
	ladderLevel: integer("ladder_level").default(0).notNull(),
	activityStatus: varchar("activity_status"),
}, (table) => [
	unique("UQ_78a916df40e02a9deb1c4b75edb").on(table.username),
]);

export const matchHistory = pgTable("match_history", {
	id: serial().primaryKey().notNull(),
	type: varchar().notNull(),
	opponent: varchar().notNull(),
	result: varchar().notNull(),
	score: varchar().notNull(),
	date: timestamp({ mode: 'string' }).defaultNow().notNull(),
	userId: integer(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "FK_fab180b043d043cd669ea0fcf02"
		}).onDelete("cascade"),
]);

export const achievement = pgTable("achievement", {
	id: serial().primaryKey().notNull(),
	achievementName: varchar("achievement_name").notNull(),
	description: varchar().notNull(),
	filename: varchar(),
}, (table) => [
	unique("UQ_fb1bf9570b9dd4146acf300edf2").on(table.achievementName),
]);

export const userFriendsUser = pgTable("user_friends_user", {
	userId1: integer("userId_1").notNull(),
	userId2: integer("userId_2").notNull(),
}, (table) => [
	index("IDX_04840fd160b733de706a336013").using("btree", table.userId1.asc().nullsLast().op("int4_ops")),
	index("IDX_e81f236c989f3fd54836b50a12").using("btree", table.userId2.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId1],
			foreignColumns: [user.id],
			name: "FK_04840fd160b733de706a3360134"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId2],
			foreignColumns: [user.id],
			name: "FK_e81f236c989f3fd54836b50a12d"
		}),
	primaryKey({ columns: [table.userId1, table.userId2], name: "PK_f2b5631d91f6b7fda632135932f"}),
]);

export const userAchievements = pgTable("user_achievements", {
	userId: integer("user_id").notNull(),
	achievementId: integer("achievement_id").notNull(),
}, (table) => [
	index("IDX_36b4a912357ad1342b735d4d4c").using("btree", table.achievementId.asc().nullsLast().op("int4_ops")),
	index("IDX_c755e3741cd46fc5ae3ef06592").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "FK_c755e3741cd46fc5ae3ef06592c"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.achievementId],
			foreignColumns: [achievement.id],
			name: "FK_36b4a912357ad1342b735d4d4c8"
		}),
	primaryKey({ columns: [table.userId, table.achievementId], name: "PK_a103993b75768d942744e4b3b40"}),
]);
