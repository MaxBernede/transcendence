import React from 'react';

interface FriendCardProps {
	id: number;
	username: string;
	type: string; 
	onRemove: (id: number) => void;
	onAcceptRequest: (id: number) => void;
  }

const FriendCard: React.FC<FriendCardProps> = ({ id, username, type, onRemove, onAcceptRequest }) => {
	return (
		<div className="card">
			<span className="username">{username}</span>
			{/* Remove button */}
			<button onClick={() => onRemove(id)} className="remove-btn">❌</button>

			{/* Conditionally render the green button if the status is 'requested' */}
			{type === 'received' && (
			<button onClick={() => onAcceptRequest(id)} className="accept-btn">✅</button>
			)}
		</div>
	);
};

export default FriendCard;
