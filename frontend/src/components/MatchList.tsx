import { useEffect, useState, useContext } from 'react';
import { UserContext } from '../App';  // Import UserContext if it's in a context

interface Match {
	id: number;
	winner: { id: number };
	looser: { id: number };
	winnerScore: number;
	looserScore: number;
	date: string;
}

export default function MatchList({ userId }: { userId: string }) {
	const [matches, setMatches] = useState<Match[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { userData } = useContext(UserContext);  // Assuming you're using UserContext to store user data

	useEffect(() => {
		console.log("Debugging - userId:", userId);
		console.log("Debugging - userData:", userData);

		let currentUserId = userId === "me" && userData?.id ? userData.id : userId;
		// Only fetch matches if userData is available and valid userId is provided
		if (!currentUserId || isNaN(Number(currentUserId))) {
			setError("Invalid user ID or user data not available");
			setLoading(false);
			return;
		}

		const controller = new AbortController();
		const signal = controller.signal;

		fetch(`http://localhost:3000/matches/${currentUserId}`, { signal })
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
	}, [userId, userData]);  // Re-run the effect when either userId or userData changes

	if (loading) return <p>Loading...</p>;
	if (error) return <p className="text-red-500">{error}</p>;

	return (
		<div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-md">
			<h2 className="text-xl font-semibold mb-4">Match History</h2>
			{matches.length === 0 ? (
				<p>No matches found.</p>
			) : (
				<ul>
					{matches.map((match) => {
						// Determine background color based on win/loss
						const isWin = match.winner.id === Number(userId);
						const backgroundColor = isWin ? 'bg-green-100' : 'bg-red-100';

						return (
							<li
								key={match.id}
								className={`p-4 border-b rounded-lg ${backgroundColor} shadow-md mb-2`}
							>
								<p className="font-semibold">Match {match.id}</p>
								<p>
									{isWin ? 'You won!' : 'You lost!'} ({match.winnerScore} - {match.looserScore})
								</p>
								<p>
									Your Score: <strong>{isWin ? match.winnerScore : match.looserScore}</strong>
								</p>
								<p>
									Opponent Score: <strong>{isWin ? match.looserScore : match.winnerScore}</strong>
								</p>
								<p className="text-gray-500 text-sm">
									Played on {new Date(match.date).toLocaleDateString()}
								</p>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
