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
    ballX,
    ballY,
    powerUpX,
    powerUpY,
    powerUpType,
    isPowerUpActive,
    score1,
    score2,
    winner,
    resetGame,
    setBallX,
    setBallY,
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

  // Fetch logged-in user
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/users/me", { withCredentials: true })
      .then((response) => {
        if (response.data.username) {
          setLoggedInUser(response.data.username);
        }
      })
      .catch(() => console.error("Failed to fetch user data"));
	  console.log("CHECK");
  }, []);

  // Register user with WebSocket when loggedInUser is updated
  useEffect(() => {
    if (loggedInUser) {
      console.log("Registering user with WebSocket:", loggedInUser);
      socket.emit("registerUser", loggedInUser);
      socket.emit("requestPlayers");
	  socket.emit("gameState");
    }
  }, [loggedInUser]);

  // Handle game state updates
  useEffect(() => {
	console.log("haslistener: ", hasListener.current);
	if (!hasListener.current) {
	  socket.on("gameState", (state: any) => {
		console.log("Received game state:", state);
  
		if (!state?.ball) {
		  console.error("gameState is undefined or missing ball data!");
		  return;
		}
  
		console.log("Current Paddle Y positions -> Paddle 1:", paddle1Y, "Paddle 2:", paddle2Y);
		console.log("New Paddle Y positions -> Paddle 1:", state.paddle1.y, "Paddle 2:", state.paddle2.y);
  
		setPaddle1Y(state.paddle1.y);
		setPaddle2Y(state.paddle2.y);
		setBallX(state.ball.x);
		setBallY(state.ball.y);
	  });
  
	  hasListener.current = true;
	}
  
	return () => {
	  socket.off("gameState");
	};
  }, []);
  

  useEffect(() => {
    socket.onAny((event, ...args) => {
    //   console.log(`Received WebSocket event: ${event}`, args);
    });

    return () => {
      socket.offAny();
    };
  }, []);


  // Track player information
  useEffect(() => {
    socket.on("playerInfo", (players: { username: string; playerNumber: number }[]) => {
    //   console.log("Received player info update:", players);

      const currentPlayer = players.find((p) => p.username === loggedInUser);
      const opponent = players.find((p) => p.username !== loggedInUser);

      if (currentPlayer) {
        setPlayerNumber(currentPlayer.playerNumber);
      }

      if (opponent) {
        setOpponentUsername(opponent.username);
      } else {
        setOpponentUsername("WAITING...");
      }
    });

    return () => {
      socket.off("playerInfo");
    };
  }, [loggedInUser]);

  // Handle paddle movement
  const handleKeyDown = (event: KeyboardEvent) => {
    let newY = 0;
    const isPlayer1 = playerNumber === 1;
    const isPlayer2 = playerNumber === 2;

    if (event.key === "w" || event.key === "s") {
        if (!isPlayer1) return;
        newY = event.key === "w" ? Math.max(paddle1Y - 20, 0) : Math.min(paddle1Y + 20, 500);
        setPaddle1Y(newY);
        socket.emit("playerMove", { player: 1, y: newY });
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        if (!isPlayer2) return;
        newY = event.key === "ArrowUp" ? Math.max(paddle2Y - 20, 0) : Math.min(paddle2Y + 20, 500);
        setPaddle2Y(newY);
        socket.emit("playerMove", { player: 2, y: newY });
    }

    if (!ballStarted) {
        setBallStarted(true);
    }
};

useEffect(() => {
    socket.on("gameState", (state) => {
        // console.log("TEST: Received gameState", state);
    });

    return () => {
        socket.off("gameState");
    };
}, []);


  // Attach event listener for paddle movement
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paddle1Y, paddle2Y]);

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

        <Ball x={ballX} y={ballY} color={ballColor} />

        {powerUpsEnabled && isPowerUpActive && powerUpType && (
          <PowerUp x={powerUpX ?? 0} y={powerUpY ?? 0} isActive={isPowerUpActive} type={powerUpType} darkMode={darkBackground} />
        )}
      </div>

      {winner && (
        <div className="pong-winner-popup">
          <h2>{winner} WINS! 🎉</h2>
          <button className="play-again-button" onClick={() => resetGame()}>PLAY AGAIN</button>
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
