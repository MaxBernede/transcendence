import React from 'react';

const WinLossStatus: React.FC<{ wins: number; losses: number }> = ({ wins, losses }) => {
	return (
		<div className="flex items-center space-x-4">
			{/* Victoires */}
			<div className="flex items-center space-x-2 text-base">
				🏆
				<span className="font-medium text-green-500">{wins} W</span>
			</div>

			{/* Défaites */}
			<div className="flex items-center space-x-2 text-base">
				☠️
				<span className="font-medium text-red-500">{losses} L</span>
			</div>
		</div>
	);
};

export default WinLossStatus;
