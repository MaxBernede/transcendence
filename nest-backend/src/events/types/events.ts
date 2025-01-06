

export class Message {
	id: string;
	message: string;
	authorId: string;
	conversationId: string;
	createAt: Date;
	updateAt: Date;
}

export interface ServerToClientEvents {
	newMessage: (payload: Message) => void;
}