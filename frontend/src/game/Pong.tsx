import React, { useState } from "react";
import "./Pong.css";
import Paddle from "./Paddle";
import Ball from "./Ball";
import Scoreboard from "./Scoreboard";
import PowerUp from "./PowerUp"; // Default import for PowerUp component
import { usePongGame } from "./hooks/usePongGame";

const Pong = () => {
  const {
    gameContainerRef,
    paddle1Y,
    paddle2Y,
    paddleHeight1,
    paddleHeight2,
    ballX,
    ballY,
    score1,
    score2,
    powerUpX,
    powerUpY,
    powerUpType,
    isPowerUpActive,
  } = usePongGame();

  const [powerUpsEnabled, setPowerUpsEnabled] = useState(true); // State for power-ups toggle

  const togglePowerUps = () => {
    setPowerUpsEnabled((prev) => !prev); // Toggle power-ups state
  };

  return (
    <div className="pong-wrapper">
      <Scoreboard score1={score1} score2={score2} />
      <div ref={gameContainerRef} className="pong-game-container">
        <div className="pong-center-line"></div>
        <Paddle position="left" top={paddle1Y ?? 0} height={paddleHeight1} />
        <Paddle position="right" top={paddle2Y ?? 0} height={paddleHeight2} />
        <Ball x={ballX} y={ballY} />
        {powerUpsEnabled && isPowerUpActive && powerUpType && (
          <PowerUp
            x={powerUpX ?? 0}
            y={powerUpY ?? 0}
            isActive={isPowerUpActive}
            type={powerUpType}
          />
        )}
      </div>
      <button className="toggle-power-ups-button" onClick={togglePowerUps}>
        {powerUpsEnabled ? "DISABLE POWER-UPS" : "ENABLE POWER-UPS"}
      </button>
    </div>
  );
};

export default Pong;
