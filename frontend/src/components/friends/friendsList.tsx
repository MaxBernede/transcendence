import React from 'react';
import FriendCard from './friendCard';

interface FriendsListProps {
	title: string;
	items: { id: number; username: string }[];
	onRemove: (id: number) => void;
	emoji: string;
}

const FriendsList: React.FC<FriendsListProps> = ({ title, items, onRemove, emoji }) => {
	return (
		<div className="card-column">
			<h2>{emoji} {title}</h2>
			{items.length === 0 ? (
				<p>No {title.toLowerCase()}.</p>
			) : (
				items.map(item => (
					<FriendCard key={item.id} id={item.id} username={item.username} onRemove={onRemove} />
				))
			)}
		</div>
	);
};

export default FriendsList;
