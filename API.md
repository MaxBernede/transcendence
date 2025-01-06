/conversations	POST	Create a private or group conversation.
/conversations	GET	List all conversations for the user.
/conversations/:id	GET	Get details about a specific conversation.
/conversations/:id	PUT	Update a conversation (title, type).
/conversations/:id/users	POST	Add users to a group conversation.
/conversations/:id/users	DELETE	Remove users from a group conversation.
/conversations/:id/messages	GET	List messages in a conversation.
/conversations/:id/messages	POST	Send a new message in a conversation.
/messages/:id	PUT	Edit a message.
/messages/:id	DELETE	Delete a message.


/conversations                  - POST: Create a conversation (private or group)
                                - GET: List all conversations
                                
/conversations/:id              - GET: Get details about a specific conversation
                                - PUT: Update a conversation (title, password)

/conversations/:id/users        - POST: Add users to a group conversation
                                - DELETE: Remove users from a group conversation

/conversations/:id/messages     - GET: List messages in a conversation
                                - POST: Send a new message in a conversation
                                
/conversations/:id/messages/:id - PUT: Edit a specific message
                                - DELETE: Delete a specific message