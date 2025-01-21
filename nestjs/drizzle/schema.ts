import { pgTable, serial, bigint, varchar, integer, unique, timestamp, json, foreignKey, uuid, text, boolean, index, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const conversationTypeEnum = pgEnum("conversation_type_enum", ['DM', 'GROUP'])


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
	intraId: integer(),
	username: varchar(),
	firstName: varchar().default(''),
	lastName: varchar().default(''),
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
	image: json(),
}, (table) => [
	unique("UQ_bb21f7478f422418fbd53620078").on(table.intraId),
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

export const chat = pgTable("chat", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	text: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	conversationId: uuid(),
	userId: integer(),
	edited: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversation.id],
			name: "FK_a19eb5a72b6d73ac18ccc84c64e"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "FK_52af74c7484586ef4bdfd8e4dbb"
		}),
]);

export const conversation = pgTable("conversation", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	type: conversationTypeEnum().default('DM').notNull(),
	name: text(),
});

export const userConversation = pgTable("user_conversation", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: integer().notNull(),
	conversationId: uuid().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "FK_610e529db4ea61302bb83bf8d81"
		}),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversation.id],
			name: "FK_a3e5e26b62e895c0478fb104bec"
		}),
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

export const conversationParticipantsUser = pgTable("conversation_participants_user", {
	conversationId: uuid().notNull(),
	userId: integer().notNull(),
}, (table) => [
	index("IDX_4928ef292e3fb48783034b82f7").using("btree", table.conversationId.asc().nullsLast().op("uuid_ops")),
	index("IDX_5d93fb1843f96fbdefea37dae8").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversation.id],
			name: "FK_4928ef292e3fb48783034b82f7a"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "FK_5d93fb1843f96fbdefea37dae86"
		}).onUpdate("cascade").onDelete("cascade"),
	primaryKey({ columns: [table.conversationId, table.userId], name: "PK_25e9241137cdb0f2336d267cc99"}),
]);
