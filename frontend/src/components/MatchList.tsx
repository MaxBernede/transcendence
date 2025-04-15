import { useEffect, useState, useContext } from 'react';
import { UserContext } from '../App';  // Import UserContext if it's in a context
// import { useLocation } from "react-router-dom";
interface Match {
    id: number;
    winner: { id: number; username: string }; 
    looser: { id: number; username: string }; 
    winnerScore: number;
    looserScore: number;
    date: string;
}

export default function MatchList({ userId }: { userId: string }) {
	const [matches, setMatches] = useState<Match[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { userData } = useContext(UserContext);  // Assuming you're using UserContext to store user data
	// const location = useLocation();
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
	}, [userId, userData]);   // Re-run the effect when either userId or userData changes

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
        // Détermine si c'est une victoire ou une défaite
        const isWin = match.winner.id === Number(userData?.id);
		const backgroundColor = isWin ? 'bg-green-800' : 'bg-red-800';
		const yourScore = isWin ? match.winnerScore : match.looserScore;
		const opponentScore = isWin ? match.looserScore : match.winnerScore;
		const userName = isWin ? match.winner.username : match.looser.username; // Ton pseudo
		const opponentName = isWin ? match.looser.username : match.winner.username; // Pseudo de l'adversaire
		const resultText = isWin ? 'Win' : 'Loose';

        return (
			<li
			key={match.id}
			className={`flex justify-between items-center p-4 border-b rounded-lg ${backgroundColor} text-white mb-2`}
		>
			<div className="flex flex-1 justify-between">
				{/* Result Win/Loss */}
				<div className="flex items-center">
					<p className="font-semibold">{resultText}</p>
				</div>
				<div className="flex items-center"><p>|</p></div>
		
				{/* My pseudo */}
				<div className="flex items-center">
					<p className="font-semibold">{userName}</p>
				</div>
				{/* My score */}
				<div className="flex items-center">
					<p>{yourScore}</p>
				</div>
				<div className="flex items-center">
					<p>-</p>
				</div>
				{/* Opponent score */}
				<div className="flex items-center">
					<p>{opponentScore}</p>
				</div>
				{/* Opponent name */}
				<div className="flex items-center">
					<p className="font-semibold">{opponentName}</p>
				</div>
				<div className="flex items-center"><p>|</p></div>

				{/* Date */}
				<div className="flex items-center">
					<p className="text-sm text-gray-300">{new Date(match.date).toLocaleDateString()}</p>
				</div>
			</div>
		</li>
		
        );
      })}
    </ul>
  )}
</div>
	  );
}
