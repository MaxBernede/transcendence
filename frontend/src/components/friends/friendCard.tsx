import React from 'react';

interface FriendCardProps {
	id: number;
	username: string;
	onRemove: (id: number) => void;
}

const FriendCard: React.FC<FriendCardProps> = ({ id, username, onRemove }) => {
	return (
		<div className="card">
			<span className="username">{username}</span>
			<button onClick={() => onRemove(id)} className="remove-btn">❌</button>
		</div>
	);
};

export default FriendCard;
