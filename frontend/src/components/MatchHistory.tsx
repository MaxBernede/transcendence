import React from 'react';

type Match = {
  id: number;
  type: string;
  opponent: string;
  result: string;
  score: string;
  date: string;
};

type MatchHistoryProps = {
  matchHistory: Match[];
};

export const MatchHistory: React.FC<MatchHistoryProps> = ({ matchHistory }) => {
  return (
    <div className="card">
      <h2>⁺‧₊˚ ཐི⋆ Match History ⋆ཋྀ ˚₊‧⁺</h2>
      <ul>
        {matchHistory.length > 0 ? (
          matchHistory.map((match) => (
            <li key={match.id}>
              <strong>{match.type} vs {match.opponent}</strong> - {match.result} ({match.score})<br />
              <span style={{ fontSize: '0.85rem', color: '#a9a9a9' }}>
                {new Date(match.date).toLocaleDateString()}
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
