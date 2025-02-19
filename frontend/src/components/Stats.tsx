import React from 'react';

type StatsProps = {
  wins: number;
  losses: number;
};

export const Stats: React.FC<StatsProps> = ({
  wins,
  losses,
}) => {
  return (
    <div className="card">
      <h2>⁺‧₊˚ ཐི⋆ Stats ⋆ཋྀ ˚₊‧⁺</h2>
      <p>Wins 🩸: {wins}</p>
      <p>Losses 💀: {losses}</p>
    </div>
  );
};
