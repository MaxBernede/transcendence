import React, { useState, useEffect } from "react";
import "./Pong.css";
import Paddle from "./Paddle";
import Ball from "./Ball";
import Scoreboard from "./Scoreboard";
import PowerUp from "./PowerUp";
import { usePongGame } from "./hooks/usePongGame";
import axios, { AxiosError } from "axios"; 

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
    resetGame,
  } = usePongGame();

  const [powerUpsEnabled, setPowerUpsEnabled] = useState(true);
  const [darkBackground, setDarkBackground] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string>("");

  // Add this useEffect for fetching the logged-in user's name
  const fetchUserName = async () => {
	try {
	  const jwt = localStorage.getItem("jwt");
	  console.log("🛠 Checking stored JWT:", jwt); // Debug log
  
	  if (!jwt) {
		console.error("❌ No JWT found. User is not logged in.");
		return;
	  }
  
	  console.log("📢 Sending request with JWT:", jwt);
  
	  const response = await axios.get("http://localhost:3000/api/users/me", {
		headers: { Authorization: `Bearer ${jwt}` },
	  });
  
	  console.log("✅ Fetched username:", response.data.username);
	  setLoggedInUser(response.data.username || "PLAYER 1");
	} catch (error) {
	  console.error("❌ Error fetching user:", error);
	  setLoggedInUser("PLAYER 1"); // Default if fetch fails
	}
  };

  useEffect(() => {
    fetchUserName();
  }, []);

  

  const togglePowerUps = () => setPowerUpsEnabled((prev) => !prev);
  const toggleDarkBackground = () => setDarkBackground((prev) => !prev);

  const paddleColor = darkBackground ? "#555555" : "#ff66b2";
  const ballColor = darkBackground ? "#666666" : "#ff3385";
  const courtBackground = darkBackground ? "#1a1a1a" : "#ffcce6";
  const courtBorder = darkBackground ? "#333333" : "#ff99cc";
  const centerLineColor = darkBackground ? "#444444" : "#ffb3d9";
  const popupBackground = darkBackground ? "#2c2c2c" : "#ffe6f1";

  const updateStats = async (result: "win" | "loose") => {
	try {
	  console.log(`📢 Sending request to update stats with result: ${result}`);
	  const jwt = localStorage.getItem("jwt");
  
	  if (!jwt) {
		console.error("❌ No JWT found. User is not logged in.");
		return;
	  }
  
	  const response = await axios.patch(
		"http://localhost:3000/api/users/updateStats",
		{ result },
		{
		  headers: {
			Authorization: `Bearer ${jwt}`,
		  },
		}
	  );
  
	  console.log(`✅ Game result (${result}) recorded successfully:`, response.data);
	} catch (error) {
	  const axiosError = error as AxiosError; // Explicitly cast to AxiosError
	  console.error("❌ Failed to update stats:", axiosError.response?.data || axiosError.message);
	}
  };
  
  
  
  // Call updateStats when a game ends
// Ensure updateStats is called only once per game and updates correctly
useEffect(() => {
	if (winner) {
	  console.log(`🏆 Game finished! Winner: "${winner}"`);
	  console.log(`🎮 Logged-in user: "${loggedInUser}"`);
  
	  // Assume "PLAYER 1" is always the logged-in user
	  const isPlayer1 = true; // Change this if your game logic allows switching sides
	  const winnerIsPlayer1 = winner.trim().toLowerCase() === "player 1";
  
	  if (isPlayer1 && winnerIsPlayer1) {
		console.log("✅ Correctly detected WIN! Updating database...");
		updateStats("win");
	  } else if (!isPlayer1 && !winnerIsPlayer1) {
		console.log("✅ Correctly detected WIN! Updating database...");
		updateStats("win");
	  } else {
		console.log("❌ Detected LOSS instead! Updating database...");
		updateStats("loose");
	  }
	}
  }, [winner]);
  
  

  return (
    <div className={`pong-wrapper ${darkBackground ? "dark-mode" : ""}`}>
      <Scoreboard
        score1={score1}
        score2={score2}
        darkMode={darkBackground}
        loggedInUser={loggedInUser} // Pass the logged-in user's name here
      />
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
