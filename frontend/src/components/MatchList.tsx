import { useEffect, useState } from 'react';
import { UserData } from '@/utils/UserLogic';

interface MatchListProps {
	localUserData: UserData | null;
}

interface Match {
	id: number;
	winner: { id: number; username: string }; 
	looser: { id: number; username: string }; 
	winnerScore: number;
	looserScore: number;
	date: string;
}

export default function MatchList({ localUserData }: MatchListProps) {
	const [matches, setMatches] = useState<Match[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!localUserData?.id) {
			setError("Invalid user data");
			setLoading(false);
			return;
		}

		console.log("Fetching matches for user:", localUserData.id);

		const controller = new AbortController();
		const signal = controller.signal;

		fetch(`http://localhost:3000/matches/${localUserData.id}`, { signal })
			.then(res => {
				if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
				return res.json();
			})
			.then(data => {
				if (!Array.isArray(data)) throw new Error("Invalid API response format");
				setMatches(data);
				setError(null);
			})
			.catch(err => {
				if (err.name !== "AbortError") {
					console.error("Error fetching matches:", err);
					setError("Failed to load matches.");
				}
			})
			.finally(() => setLoading(false));

		return () => controller.abort();
	}, [localUserData]);

	if (loading) return <p>Loading...</p>;
	if (error) return <p className="text-red-500">{error}</p>;

	return (
		<div className="p-4 w-full mx-auto bg-black text-white rounded-lg px-85">
			<h2 className="text-xl font-semibold mb-4 text-center">⁺‧₊˚ ཐི⋆ Match History ⋆ཋྀ ˚₊‧⁺</h2>
			{matches.length === 0 ? (
				<p>No matches found.</p>
			) : (
				<ul>
					{matches.map((match) => {
						const isWin = localUserData?.id && Number(localUserData.id) === match.winner.id;
						const backgroundColor = isWin ? 'bg-green-800' : 'bg-red-800';
						const yourScore = isWin ? match.winnerScore : match.looserScore;
						const opponentScore = isWin ? match.looserScore : match.winnerScore;
						const userName = isWin ? match.winner.username : match.looser.username;
						const opponentName = isWin ? match.looser.username : match.winner.username;
						const resultText = isWin ? 'Win' : 'Loose';

						return (
							<li
								key={match.id}
								className={`flex justify-between items-center p-4 border-b rounded-lg ${backgroundColor} text-white mb-2`}
							>
								<div className="flex flex-1 justify-between">
									<div className="flex items-center"><p className="font-semibold">{resultText}</p></div>
									<div className="flex items-center"><p>|</p></div>
									<div className="flex items-center"><p className="font-semibold">{userName}</p></div>
									<div className="flex items-center"><p>{yourScore}</p></div>
									<div className="flex items-center"><p>-</p></div>
									<div className="flex items-center"><p>{opponentScore}</p></div>
									<div className="flex items-center"><p className="font-semibold">{opponentName}</p></div>
									<div className="flex items-center"><p>|</p></div>
									<div className="flex items-center"><p className="text-sm text-gray-300">{new Date(match.date).toLocaleDateString()}</p></div>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
