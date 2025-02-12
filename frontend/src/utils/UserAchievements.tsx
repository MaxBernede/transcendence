import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface Achievement {
	id: number;
	achievementName: string;
	description: string;
	filename: string;
}

const Achievements = ({ userId }: { userId: string | undefined }) => {
	const [achievements, setAchievements] = useState<Achievement[]>([]);

	useEffect(() => {
		const fetchAchievements = async () => {
			try {
				const response = await fetch(`/api/users/${userId}/achievements`);
				const data = await response.json();
				setAchievements(data);
			} catch (error) {
				console.error('Error fetching achievements:', error);
			}
		};

		if (userId) fetchAchievements();
	}, [userId]);

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				Your Achievements
			</Typography>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
				{achievements.length > 0 ? (
					achievements.map((ach) => (
						<Box key={ach.id} sx={{ textAlign: 'center' }}>
							<img src={`/icons/${ach.filename}`} alt={ach.achievementName} width={80} />
							<Typography variant="body1">{ach.achievementName}</Typography>
						</Box>
					))
				) : (
					<Typography>No achievements yet!</Typography>
				)}
			</Box>
		</Box>
	);
};

export default Achievements;
