import React from "react";

interface ScoreboardProps {
  score1: number;
  score2: number;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ score1, score2 }) => {
  return (
    <div className="pong-scoreboard">
      <div className="pong-score pong-score-left">
        <div className="pong-score-name">🎀 PLAYER 1 🎀</div>
        <div className="pong-score-number">{score1}</div>
      </div>
      <div className="pong-score pong-score-right">
        <div className="pong-score-name">🌸 PLAYER 2 🌸</div>
        <div className="pong-score-number">{score2}</div>
      </div>
    </div>
  );
};

export default Scoreboard;
