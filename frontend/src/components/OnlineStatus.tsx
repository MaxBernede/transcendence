import React from 'react';

const OnlineStatus: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
	return (
		<div className="flex items-center space-x-2 text-base">
			<span
				className={`w-4 h-4 rounded-full ${
					isOnline ? 'bg-green-500' : 'bg-red-500'
				}`}
			></span>
			<span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
		</div>
	);
};

export default OnlineStatus;
