import React from 'react';

type StatsProps = {
  wins: number;
  losses: number;
  ladderLevel: number;
  achievements: string[]; // Array of achievement strings
};

export const Stats: React.FC<StatsProps> = ({
  wins,
  losses,
  ladderLevel,
  achievements = [], // Default to an empty array if undefined
}) => {
  return (
    <div className="card">
      <h2>⁺‧₊˚ ཐི⋆ Stats ⋆ཋྀ ˚₊‧⁺</h2>
      <p>Wins 🩸: {wins}</p>
      <p>Losses 💀: {losses}</p>
      <p>Ladder Level 🕸️: {ladderLevel}</p>
      <h3>Achievements 🥀:</h3>
      <ul>
        {achievements.length > 0 ? (
          achievements.map((achievement, index) => (
            <li key={index}>{achievement}</li>
          ))
        ) : (
          <p>No achievements yet.</p>
        )}
      </ul>
    </div>
  );
};
