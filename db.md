Here’s the final database schema you need for your application, incorporating users, friendships, conversations, messages, blocking, and notifications:

1. Users Table
Stores user information.

Column Name	Type	Description
user_id	INT (PK, Auto)	Unique identifier for users.
username	VARCHAR	User's display name.
email	VARCHAR	User's email.
password_hash	VARCHAR	Hashed password.
created_at	TIMESTAMP	Account creation time.
2. Friends Table
Tracks friendships and their statuses.

Column Name	Type	Description
friendship_id	INT (PK, Auto)	Unique friendship identifier.
user_id	INT (FK)	Reference to one user.
friend_id	INT (FK)	Reference to the other user.
status	ENUM	pending, accepted, rejected, blocked
created_at	TIMESTAMP	Time the friendship request was created.
updated_at	TIMESTAMP	Time the status was last updated.
3. Conversations Table
Represents all conversations (DMs and group chats).

Column Name	Type	Description
conversation_id	INT (PK, Auto)	Unique conversation identifier.
is_group	BOOLEAN	TRUE for groups, FALSE for DMs.
name	VARCHAR	Group name (null for DMs).
created_by	INT (FK)	User who created the conversation.
created_at	TIMESTAMP	Conversation creation time.
4. ConversationMembers Table
Tracks participants in conversations.

Column Name	Type	Description
membership_id	INT (PK, Auto)	Unique membership ID.
conversation_id	INT (FK)	Reference to the conversation.
user_id	INT (FK)	Member user ID.
role	ENUM	admin, member.
joined_at	TIMESTAMP	When the user joined.
5. Messages Table
Stores all messages (DMs and group chats).

Column Name	Type	Description
message_id	INT (PK, Auto)	Unique message ID.
conversation_id	INT (FK)	Reference to the conversation.
sender_id	INT (FK)	User who sent the message.
message	TEXT	Message content.
created_at	TIMESTAMP	Time the message was sent.
6. Notifications Table
Tracks notifications sent to users.

Column Name	Type	Description
notification_id	INT (PK, Auto)	Unique notification ID.
user_id	INT (FK)	User receiving the notification.
type	ENUM	friend_request, new_message.
message	TEXT	Notification details.
is_read	BOOLEAN	Whether the notification was read.
created_at	TIMESTAMP	Notification creation time.
Relationships and Summary
Users:

Connected to Friends (friendship management).
Connected to ConversationMembers (participation in conversations).
Connected to Notifications (receiving notifications).
Friends:

Handles friend requests, accepted friendships, and blocking.
Conversations:

Unified model for DMs and group chats.
ConversationMembers:

Tracks participants in conversations, with roles for groups.
Messages:

Stores all messages within conversations.
Notifications:

Tracks actions like friend requests and new messages.
This schema balances simplicity and flexibility while ensuring scalability. Let me know if you need SQL scripts for creating these tables or any additional refinements!