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

const Pong = () => {
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
    // resetGame,
    setPaddle1Y,
    setPaddle2Y,
    ballStarted,
    setBallStarted,
  } = usePongGame(socket);

  const [powerUpsEnabled, setPowerUpsEnabled] = useState(true);
  const [darkBackground, setDarkBackground] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string>("PLAYER 1");
  const [playerNumber, setPlayerNumber] = useState<number>(1);
  const [opponentUsername, setOpponentUsername] = useState<string>("WAITING...");
  const hasListener = useRef(false);

  // Store ball position from WebSocket updates
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

  // Register user with WebSocket when loggedInUser is updated
  useEffect(() => {
    if (loggedInUser) {
      socket.emit("registerUser", loggedInUser);
      socket.emit("requestPlayers");
      socket.emit("gameState");
    }
  }, [loggedInUser]);

  // Handle game state updates
  useEffect(() => {
	socket.on("gameState", (state: any) => {
	  if (!state?.paddle1 || !state?.paddle2 || !state?.ball) {
		console.error("Invalid game state received!");
		return;
	  }
  
	  // ✅ Only update opponent's paddle, allow local control of own paddle
	  if (playerNumber === 1) {
		setPaddle2Y(state.paddle2.y);
	  } else if (playerNumber === 2) {
		setPaddle1Y(state.paddle1.y);
	  }

	  setBallPosition({ x: state.ball.x, y: state.ball.y }); 
	});
  
	return () => {
	  socket.off("gameState");
	};
  }, [playerNumber]);
  
  
  

  // Track player information
  useEffect(() => {
    socket.on("playerInfo", (players: { username: string; playerNumber: number }[]) => {
      const currentPlayer = players.find((p) => p.username === loggedInUser);
      const opponent = players.find((p) => p.username !== loggedInUser);

      if (currentPlayer) setPlayerNumber(currentPlayer.playerNumber);
      setOpponentUsername(opponent ? opponent.username : "WAITING...");
    });

    return () => {
      socket.off("playerInfo");
    };
  }, [loggedInUser]);

  // Handle paddle movement
//   const handleKeyDown = (event: KeyboardEvent) => {
//     let newY = 0;
//     const isPlayer1 = playerNumber === 1;
//     const isPlayer2 = playerNumber === 2;

//     if (event.key === "w" || event.key === "s") {
//       if (!isPlayer1) return;
//       newY = event.key === "w" ? Math.max(paddle1Y - 20, 0) : Math.min(paddle1Y + 20, 500);
//       setPaddle1Y(newY);
//       socket.emit("playerMove", { player: 1, y: newY });
//     } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
//       if (!isPlayer2) return;
//       newY = event.key === "ArrowUp" ? Math.max(paddle2Y - 20, 0) : Math.min(paddle2Y + 20, 500);
//       setPaddle2Y(newY);
//       socket.emit("playerMove", { player: 2, y: newY });
//     }

//     if (!ballStarted) {
//       setBallStarted(true);
//     }
//   };

const handleKeyDown = (event: KeyboardEvent) => {
	let newY = 0;
  
	if (playerNumber === 1) {
	  if (event.key === "w") {
		newY = Math.max(paddle1Y - 20, 0);
		setPaddle1Y(newY);
		socket.emit("playerMove", { player: 1, y: newY });
	  } else if (event.key === "s") {
		newY = Math.min(paddle1Y + 20, 500);
		setPaddle1Y(newY);
		socket.emit("playerMove", { player: 1, y: newY });
	  }
	} else if (playerNumber === 2) {
	  if (event.key === "ArrowUp") {
		newY = Math.max(paddle2Y - 20, 0);
		setPaddle2Y(newY);
		socket.emit("playerMove", { player: 2, y: newY });
	  } else if (event.key === "ArrowDown") {
		newY = Math.min(paddle2Y + 20, 500);
		setPaddle2Y(newY);
		socket.emit("playerMove", { player: 2, y: newY });
	  }
	}
  };
  
  
  // Attach event listener
  useEffect(() => {
	window.addEventListener("keydown", handleKeyDown);
	return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paddle1Y, paddle2Y]);
  
  
  // Add event listener
  useEffect(() => {
	window.addEventListener("keydown", handleKeyDown);
	return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paddle1Y, paddle2Y]);
  
  const handleResetGame = () => {
	socket.emit("resetGame"); // Emit reset event to the backend
  };
  

  const paddleColor = darkBackground ? "#555555" : "#ff66b2";
  const ballColor = darkBackground ? "#666666" : "#ff3385";
  const backgroundColor = darkBackground ? "#222222" : "#ffe6f1";

  return (
    <div className={`pong-wrapper ${darkBackground ? "dark-mode" : ""}`} style={{ backgroundColor }}>
      <Scoreboard
        score1={playerNumber === 1 ? score1 : score2}
        score2={playerNumber === 1 ? score2 : score1}
        darkMode={darkBackground}
        loggedInUser={loggedInUser}
        opponentUsername={opponentUsername}
      />

      <div ref={gameContainerRef} className={`pong-game-container ${darkBackground ? "dark-mode" : ""}`}>
        <div className={`pong-center-line ${darkBackground ? "dark-mode" : ""}`}></div>

        <Paddle key={`left-${paddle1Y}`} position="left" top={paddle1Y ?? 0} height={paddleHeight1} color={paddleColor} />
        <Paddle key={`right-${paddle2Y}`} position="right" top={paddle2Y ?? 0} height={paddleHeight2} color={paddleColor} />

        <Ball x={ballPosition.x} y={ballPosition.y} color={ballColor} />

        {powerUpsEnabled && isPowerUpActive && powerUpType && (
       <PowerUp 
		x={powerUpX ?? 0} 
		y={powerUpY ?? 0} 
		isActive={isPowerUpActive} 
		type={powerUpType as "shrinkOpponent" | "speedBoost" | "enlargePaddle" | null} 
		darkMode={darkBackground} 
		/>
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
