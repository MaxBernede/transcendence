import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./Pong.css";
import Paddle from "./Paddle";
import Ball from "./Ball";
import Scoreboard from "./Scoreboard";
import PowerUp from "./PowerUp";
import { usePongGame } from "./hooks/usePongGame";
import axios from "axios";

const socket = io("http://localhost:3000/pong");

// Define the Player interface
interface Player {
  username: string;
  playerNumber: number;
}

const Pong = () => {
  const [playerNumber, setPlayerNumber] = useState<number>(1);

  const {
    gameContainerRef,
    paddle1Y,
    paddle2Y,
    paddleHeight1,
    paddleHeight2,
    powerUpX,
    powerUpY,
    powerUpType,
    isPowerUpActive,
    score1,
    score2,
    winner,
    setPaddle1Y,
    setPaddle2Y,
    ballStarted,
    setBallStarted,
  } = usePongGame(socket, playerNumber);

  const [powerUpsEnabled, setPowerUpsEnabled] = useState(true);
  const [darkBackground, setDarkBackground] = useState(false);
//   const [loggedInUser, setLoggedInUser] = useState<string>("PLAYER 1");
const [loggedInUser, setLoggedInUser] = useState<string>("");
  const [opponentUsername, setOpponentUsername] = useState<string>("WAITING...");
  const hasListener = useRef(false);
  const [ballPosition, setBallPosition] = useState({ x: 390, y: 294 });
  

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/users/me", { withCredentials: true })
      .then((response) => {
        if (response.data.username) {
          setLoggedInUser(response.data.username);
        }
      })
      .catch(() => console.error("Failed to fetch user data"));
  }, []);

useEffect(() => {
    if (loggedInUser) {
        socket.emit("registerUser", loggedInUser);
        socket.emit("requestPlayers");
    }
}, [loggedInUser]);

  useEffect(() => {
    const storedPlayerNumber = localStorage.getItem("playerNumber");
    if (storedPlayerNumber) {
      setPlayerNumber(Number(storedPlayerNumber));
    }
  }, []);

  useEffect(() => {
    const handleGameState = (state: any) => {
      if (!state?.paddle1 || !state?.paddle2 || !state?.ball) return;

      if (playerNumber === 1) {
        setPaddle2Y(state.paddle2.y);
      } else if (playerNumber === 2) {
        setPaddle1Y(state.paddle1.y);
      }

      setBallPosition({ x: state.ball.x, y: state.ball.y });
    };

    socket.on("gameState", handleGameState);
    return () => {
      socket.off("gameState", handleGameState);
    };
  }, [playerNumber]);

  useEffect(() => {
	// Retrieve playerNumber from sessionStorage if available
	const storedPlayerNumber = sessionStorage.getItem("playerNumber");
	if (storedPlayerNumber) {
	  setPlayerNumber(Number(storedPlayerNumber));
	}
  }, []);
  
  useEffect(() => {
	const handlePlayerInfo = (players: Player[]) => {
	  console.log("📡 Received player info:", players);
  
	  if (!loggedInUser) return; // Prevent running if loggedInUser isn't set yet
  
	  let storedPlayerNumber = Number(sessionStorage.getItem("playerNumber")) || 1;
  
	  const currentPlayer = players.find((p) => p.username === loggedInUser);
	  const opponent = players.find((p) => p.username !== loggedInUser);
  
	  if (currentPlayer) {
		console.log(`✅ Restoring stored player number: ${currentPlayer.playerNumber}`);
		storedPlayerNumber = currentPlayer.playerNumber; // Preserve correct number
	  } else if (players.length === 1) {
		// Keep player 1 as player 1, avoid automatic swaps
		if (players[0].playerNumber === 1) {
		  storedPlayerNumber = 2;
		} else {
		  storedPlayerNumber = 1;
		}
		console.log(`🔄 Assigning opposite player number: ${storedPlayerNumber}`);
	  }
  
	  // Prevent unnecessary re-renders
	  if (playerNumber !== storedPlayerNumber) {
		setPlayerNumber(storedPlayerNumber);
		sessionStorage.setItem("playerNumber", String(storedPlayerNumber));
	  }
  
	  if (opponent) {
		console.log(`🎯 Opponent Found: ${opponent.username}, Player Number: ${opponent.playerNumber}`);
		setOpponentUsername(opponent.username);
	  } else {
		console.warn("⚠️ Opponent not found, setting to WAITING...");
		setOpponentUsername("WAITING...");
	  }
	};
  
	socket.on("playerInfo", handlePlayerInfo);
	return () => {
	  socket.off("playerInfo", handlePlayerInfo);
	};
  }, [loggedInUser, playerNumber]); // Ensure playerNumber updates correctly
  
  

  const handleKeyDown = (event: KeyboardEvent) => {
    let newY = 0;

    console.log("playerNumber: ", playerNumber);
    if (playerNumber === 1) {
      if (event.key === "w" || event.key === "ArrowUp") {
        newY = Math.max(paddle1Y - 20, 0);
        setPaddle1Y(newY);
        socket.emit("playerMove", { player: 1, y: newY });
      } else if (event.key === "s" || event.key === "ArrowDown") {
        newY = Math.min(paddle1Y + 20, 500);
        setPaddle1Y(newY);
        socket.emit("playerMove", { player: 1, y: newY });
      }
    } else if (playerNumber === 2) {
      if (event.key === "w" || event.key === "ArrowUp") {
        newY = Math.max(paddle2Y - 20, 0);
        setPaddle2Y(newY);
        socket.emit("playerMove", { player: 2, y: newY });
      } else if (event.key === "s" || event.key === "ArrowDown") {
        newY = Math.min(paddle2Y + 20, 500);
        setPaddle2Y(newY);
        socket.emit("playerMove", { player: 2, y: newY });
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paddle1Y, paddle2Y]);

  const handleResetGame = () => {
    socket.emit("resetGame");
  };

  return (
    <div className={`pong-wrapper ${darkBackground ? "dark-mode" : ""}`} style={{ backgroundColor: darkBackground ? "#222222" : "#ffe6f1" }}>
		<Scoreboard
		score1={score1}  // Player 1's score always on the left
		score2={score2}  // Player 2's score always on the right
		darkMode={darkBackground}
		loggedInUser={playerNumber === 1 ? loggedInUser : opponentUsername} // Player 1 username
		opponentUsername={playerNumber === 1 ? opponentUsername : loggedInUser} // Player 2 username
		/>
      <div ref={gameContainerRef} className={`pong-game-container ${darkBackground ? "dark-mode" : ""}`}>
        <div className={`pong-center-line ${darkBackground ? "dark-mode" : ""}`}></div>

        <Paddle key={`left-${paddle1Y}`} position="left" top={paddle1Y ?? 0} height={paddleHeight1} color={darkBackground ? "#555555" : "#ff66b2"} />
        <Paddle key={`right-${paddle2Y}`} position="right" top={paddle2Y ?? 0} height={paddleHeight2} color={darkBackground ? "#555555" : "#ff66b2"} />

        <Ball x={ballPosition.x} y={ballPosition.y} color={darkBackground ? "#666666" : "#ff3385"} />

        {powerUpsEnabled && isPowerUpActive && powerUpType && (
          <PowerUp x={powerUpX ?? 0} y={powerUpY ?? 0} isActive={isPowerUpActive} type={powerUpType} darkMode={darkBackground} />
        )}
      </div>

      {winner && (
        <div className="pong-winner-popup">
          <h2>{winner} WINS! 🎉</h2>
          <button className="play-again-button" onClick={handleResetGame}>
            PLAY AGAIN
          </button>
        </div>
      )}

      <div className="pong-buttons">
        <button className="toggle-button" onClick={() => setPowerUpsEnabled((prev) => !prev)}>
          {powerUpsEnabled ? "DISABLE POWER-UPS" : "ENABLE POWER-UPS"}
        </button>
        <button className="toggle-button" onClick={() => setDarkBackground((prev) => !prev)}>
          {darkBackground ? "PASTEL MODE" : "GOTH MODE"}
        </button>
      </div>
    </div>
  );
};

export default Pong;
