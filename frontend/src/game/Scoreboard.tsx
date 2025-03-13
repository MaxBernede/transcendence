import React from "react";

interface ScoreboardProps {
  score1: number;
  score2: number;
  darkMode: boolean;
  loggedInUser: string;
  opponentUsername: string;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ score1, score2, darkMode, loggedInUser, opponentUsername }) => {
//   console.log("Received loggedInUser:", loggedInUser); // Debug log

  const textColor = darkMode ? "#cccccc" : "#ff3385";
  const player1Emoji = darkMode ? "🖤" : "🎀";
  const player2Emoji = darkMode ? "🦇" : "🌸";

  return (
    <div className="pong-scoreboard">
      <div className="pong-score pong-score-left">
        <div className="pong-score-name" style={{ color: textColor }}>
          {player1Emoji} {loggedInUser ? loggedInUser : "PLAYER 1"} {player1Emoji}
        </div>
        <div className="pong-score-number" style={{ color: textColor }}>
          {score1}
        </div>
      </div>
      <div className="pong-score pong-score-right">
        <div className="pong-score-name" style={{ color: textColor }}>
          {player2Emoji} {opponentUsername ? opponentUsername : "PLAYER 2"} {player2Emoji}
        </div>
        <div className="pong-score-number" style={{ color: textColor }}>
          {score2}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
