import React from "react";

interface ScoreboardProps {
  score1: number;
  score2: number;
  darkMode: boolean; // Prop to indicate dark mode
}

const Scoreboard: React.FC<ScoreboardProps> = ({ score1, score2, darkMode }) => {
  const textColor = darkMode ? "#cccccc" : "#ff3385"; // Light grey in dark mode, pink in light mode
  const player1Emoji = darkMode ? "🖤" : "🎀"; // Change emoji for PLAYER 1
  const player2Emoji = darkMode ? "🦇" : "🌸"; // Change emoji for PLAYER 2

  return (
    <div className="pong-scoreboard">
      <div className="pong-score pong-score-left">
        <div
          className="pong-score-name"
          style={{ color: textColor }}
        >
          {player1Emoji} PLAYER 1 {player1Emoji}
        </div>
        <div
          className="pong-score-number"
          style={{ color: textColor }}
        >
          {score1}
        </div>
      </div>
      <div className="pong-score pong-score-right">
        <div
          className="pong-score-name"
          style={{ color: textColor }}
        >
          {player2Emoji} PLAYER 2 {player2Emoji}
        </div>
        <div
          className="pong-score-number"
          style={{ color: textColor }}
        >
          {score2}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
