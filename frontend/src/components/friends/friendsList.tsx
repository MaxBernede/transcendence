import React from 'react';
import FriendCard from './friendCard';

interface FriendsListProps {
	title: string;
	items: { id: number; username: string; status: string; type:string }[]; // Include status
	onRemove: (id: number) => void;
	onAcceptRequest: (id: number) => void; // Function to accept friend requests
	emoji: string;
}

const FriendsList: React.FC<FriendsListProps> = ({ title, items, onRemove, onAcceptRequest, emoji }) => {
	return (
		<div className="card-column">
			<h2>{emoji} {title}</h2>
			{items.length === 0 ? (
				<p>No {title.toLowerCase()}.</p>
			) : (
				items.map(item => (
					<FriendCard
					key={item.id}
					id={item.id}
					username={item.username}
					type={item.type}  // Pass status to FriendCard
					onRemove={onRemove}
					onAcceptRequest={onAcceptRequest}  // Pass onAcceptRequest function
				/>
				))
			)}
		</div>
	);
};

export default FriendsList;
