import React from 'react';

type Match = {
  description: string; // Provided directly by the backend
  date: string;        // Provided directly by the backend
};

type MatchHistoryProps = {
  matchHistory: Match[];
};

export const MatchHistory: React.FC<MatchHistoryProps> = ({ matchHistory }) => {
	console.log('MatchHistory prop:', matchHistory); // Log the matchHistory prop
	return (
	  <div className="card">
		<h2>⁺‧₊˚ ཐི⋆ Match History ⋆ཋྀ ˚₊‧⁺</h2>
		<ul>
		  {matchHistory.length > 0 ? (
			matchHistory.map((match, index) => (
			  <li key={index}>
				<strong>{match.description}</strong><br />
				<span style={{ fontSize: '0.85rem', color: '#a9a9a9' }}>
				  {match.date}
				</span>
			  </li>
			))
		  ) : (
			<p>No match history available.</p>
		  )}
		</ul>
	  </div>
	);
  };
  
  