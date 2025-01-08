import React from 'react';


// type Match = {
//   description: string; // Provided directly by the backend
//   date: string;        // Provided directly by the backend
// };

type MatchHistoryProps = {
	matchHistory: { type: string; opponent: string; result: string; score: string; date: string }[];
  };
  
  export const MatchHistory: React.FC<MatchHistoryProps> = ({ matchHistory }) => {
	return (
	  <div className="card">
		<h2>⁺‧₊˚ ཐི⋆ Match History ⋆ཋྀ ˚₊‧⁺</h2>
		{matchHistory.length > 0 ? (
		  <ul>
			{matchHistory.map((match, index) => (
			  <li key={index}>
				<p>
				  <strong>{match.type}</strong> vs <strong>{match.opponent}</strong> -{' '}
				  <span>{match.result}</span> (<em>{match.score}</em>) on{' '}
				  <strong>{new Date(match.date).toLocaleDateString('en-GB')}</strong>
				</p>
			  </li>
			))}
		  </ul>
		) : (
		  <p>No matches played yet.</p>
		)}
	  </div>
	);
  };  
  