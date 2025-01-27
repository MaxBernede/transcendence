import React, { useState } from "react";
import "./Pong.css";
import Paddle from "./Paddle";
import Ball from "./Ball";
import Scoreboard from "./Scoreboard";
import PowerUp from "./PowerUp";
import { usePongGame } from "./hooks/usePongGame";
import axios from "axios";

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
    winner,
    resetGame, // Reset game when winner is determined
  } = usePongGame();

  const [powerUpsEnabled, setPowerUpsEnabled] = useState(true);
  const [darkBackground, setDarkBackground] = useState(false);

  const togglePowerUps = () => setPowerUpsEnabled((prev) => !prev);
  const toggleDarkBackground = () => setDarkBackground((prev) => !prev);

  const paddleColor = darkBackground ? "#555555" : "#ff66b2";
  const ballColor = darkBackground ? "#666666" : "#ff3385";
  const courtBackground = darkBackground ? "#1a1a1a" : "#ffcce6";
  const courtBorder = darkBackground ? "#333333" : "#ff99cc";
  const centerLineColor = darkBackground ? "#444444" : "#ffb3d9";
  const popupBackground = darkBackground ? "#2c2c2c" : "#ffe6f1"; // Popup background

  // Function to update wins and losses in the database
  const updateStats = async (result: "win" | "loose") => {
    try {
      await axios.patch(
        "http://localhost:3000/users/updateStats", // Backend endpoint
        { result }, // Pass the result: 'win' or 'loose'
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`, // Include JWT token from localStorage
          },
        }
      );
      console.log(`${result} recorded in the database.`);
    } catch (error) {
      console.error("Failed to update stats:", error);
    }
  };

  // Trigger database updates when a winner is determined
  if (winner) {
    if (winner === "Player 1") {
      updateStats("win"); // Update win for Player 1
      updateStats("loose"); // Update loss for Player 2
    } else if (winner === "Player 2") {
      updateStats("loose"); // Update loss for Player 1
      updateStats("win"); // Update win for Player 2
    }
  }

  return (
    <div className={`pong-wrapper ${darkBackground ? "dark-mode" : ""}`}>
      <Scoreboard score1={score1} score2={score2} darkMode={darkBackground} />
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
        <Paddle
          position="left"
          top={paddle1Y ?? 0}
          height={paddleHeight1}
          color={paddleColor}
        />
        <Paddle
          position="right"
          top={paddle2Y ?? 0}
          height={paddleHeight2}
          color={paddleColor}
        />
        <Ball x={ballX} y={ballY} color={ballColor} />
        {powerUpsEnabled && isPowerUpActive && powerUpType && (
          <PowerUp
            x={powerUpX ?? 0}
            y={powerUpY ?? 0}
            isActive={isPowerUpActive}
            type={powerUpType}
            darkMode={darkBackground}
          />
        )}
      </div>

      {/* Popup when someone wins */}
      {winner && (
        <div
          className="pong-winner-popup"
          style={{
            backgroundColor: popupBackground,
            color: darkBackground ? "white" : "black",
          }}
        >
          <h2>{winner} WINS! 🎉</h2>
          <button
            className="play-again-button"
            onClick={resetGame}
            style={{
              backgroundColor: darkBackground ? "#555555" : "#ff69b4",
              color: "white",
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Control buttons */}
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
