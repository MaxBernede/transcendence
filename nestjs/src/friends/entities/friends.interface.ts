export interface FriendData {
	id: number;
	username: string;
	status: 'friends' | 'blocked';
  }
  
export interface RequestData {
	id: number;
	username: string;
	status: string;
	type: string;
  }
  
export interface FriendsResponse {
	friends: FriendData[];
	requests: RequestData[];
	blocked: FriendData[];
  }
  