import React, { useState } from "react";
import "./Pong.css";
import Paddle from "./Paddle";
import Ball from "./Ball";
import Scoreboard from "./Scoreboard";
import PowerUp from "./PowerUp";
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
  const [darkBackground, setDarkBackground] = useState(false); // State for dark mode toggle

  const togglePowerUps = () => setPowerUpsEnabled((prev) => !prev); // Toggle power-ups state
  const toggleDarkBackground = () => setDarkBackground((prev) => !prev); // Toggle dark mode state

  const paddleColor = darkBackground ? "#555555" : "#ff66b2";
  const ballColor = darkBackground ? "#666666" : "#ff3385";
  const courtBackground = darkBackground ? "#1a1a1a" : "#ffcce6";
  const courtBorder = darkBackground ? "#333333" : "#ff99cc";
  const centerLineColor = darkBackground ? "#444444" : "#ffb3d9";

  return (
    <div
      className={`pong-wrapper ${darkBackground ? "dark-mode" : ""}`} // Add dark-mode class
    >
      <Scoreboard score1={score1} score2={score2} darkMode={darkBackground} /> {/* Pass darkMode */}
      <div
        ref={gameContainerRef}
        className="pong-game-container"
        style={{
          backgroundColor: courtBackground,
          borderColor: courtBorder,
        }}
      >
        <div
          className="pong-center-line"
          style={{ backgroundColor: centerLineColor }}
        ></div>
        <Paddle position="left" top={paddle1Y ?? 0} height={paddleHeight1} color={paddleColor} />
        <Paddle position="right" top={paddle2Y ?? 0} height={paddleHeight2} color={paddleColor} />
        <Ball x={ballX} y={ballY} color={ballColor} />
		{powerUpsEnabled && isPowerUpActive && powerUpType && (
		<PowerUp
			x={powerUpX ?? 0}
			y={powerUpY ?? 0}
			isActive={isPowerUpActive}
			type={powerUpType}
			darkMode={darkBackground} // Pass dark mode state
		/>
		)}
      </div>
      <div className="pong-buttons">
        <button
          className={`toggle-button ${darkBackground ? "dark-mode" : ""}`}
          onClick={togglePowerUps}
        >
          {powerUpsEnabled ? "DISABLE POWER-UPS" : "ENABLE POWER-UPS"}
        </button>
        <button
          className={`toggle-button ${darkBackground ? "dark-mode" : ""}`}
          onClick={toggleDarkBackground}
        >
          {darkBackground ? "PASTEL MODE" : "GOTH MODE"}
        </button>
      </div>
    </div>
  );
};

export default Pong;
