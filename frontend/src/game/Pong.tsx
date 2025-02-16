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
  const hasListener = useRef(false);  
  const [opponentUsername, setOpponentUsername] = useState<string>("PLAYER 2");

  // Fetch logged-in user
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/users/me", { withCredentials: true })
      .then((response) => setLoggedInUser(response.data.username || "PLAYER 1"))
      .catch(() => setLoggedInUser("PLAYER 1"));
  }, []);

  // Register user with WebSocket when loggedInUser is updated
	useEffect(() => {
		if (loggedInUser && loggedInUser !== "PLAYER 1") {
		console.log("Registering user with WebSocket:", loggedInUser);
		socket.emit("registerUser", loggedInUser);
		}
	}, [loggedInUser]);
  
  // WebSocket connection and event handling
//   useEffect(() => {
//     if (!hasListener.current) {
//       socket.on("gameState", (state: any) => {
//         console.log("Received game state:", state);

//         if (!state?.ball) {
//           console.error("gameState is undefined or missing ball data!");
//           return;
//         }
			
//         // setPaddle1Y(state.paddle1.y);
//         // setPaddle2Y(state.paddle2.y);

// 		console.log("🎯 Current Paddle Y positions -> Paddle 1:", paddle1Y, "Paddle 2:", paddle2Y);
//         console.log("🎯 New Paddle Y positions -> Paddle 1:", state.paddle1.y, "Paddle 2:", state.paddle2.y);

// 		if (paddle1Y !== state.paddle1.y) setPaddle1Y(state.paddle1.y);
//         if (paddle2Y !== state.paddle2.y) setPaddle2Y(state.paddle2.y);

//         setBallX(state.ball.x);
//         setBallY(state.ball.y);
//       });

//       hasListener.current = true;
//     }

//     return () => {
//       socket.off("gameState");
//     };
//   }, [paddle1Y, paddle2Y]); 

useEffect(() => {
	if (!hasListener.current) {
	  socket.on("gameState", (state: any) => {
		console.log("Received game state:", state);
  
		if (!state?.ball) {
		  console.error("gameState is undefined or missing ball data!");
		  return;
		}
  
		// console.log("Current Paddle Y positions -> Paddle 1:", paddle1Y, "Paddle 2:", paddle2Y);
		// console.log("New Paddle Y positions -> Paddle 1:", state.paddle1.y, "Paddle 2:", state.paddle2.y);
  
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

  // Handle player movement and send to WebSocket
//   const handleKeyDown = (event: KeyboardEvent) => {
//     let newY = 0;

//     if (event.key === "w" || event.key === "s") {
//       newY = event.key === "w" ? Math.max(paddle1Y - 20, 0) : Math.min(paddle1Y + 20, 500);
//       setPaddle1Y(newY);
// 	  console.log(`Emitting playerMove: Player 1 moved to Y=${newY}`);
//       socket.emit("playerMove", { player: 1, y: newY });
//     } 
//     else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
//       newY = event.key === "ArrowUp" ? Math.max(paddle2Y - 20, 0) : Math.min(paddle2Y + 20, 500);
//       setPaddle2Y(newY);
// 	  console.log(`Emitting playerMove: Player 2 moved to Y=${newY}`);
//       socket.emit("playerMove", { player: 2, y: newY });
//     }

//     // Start the ball movement on the first paddle move
//     if (!ballStarted) {
//       setBallStarted(true);
//     }
//   };

const handleKeyDown = (event: KeyboardEvent) => {
    let newY = 0;
    const isPlayer1 = loggedInUser === "PLAYER 1"; // Determine which player
    const isPlayer2 = loggedInUser !== "PLAYER 1";

    if (event.key === "w" || event.key === "s") {
        if (!isPlayer1) return; // Prevent Player 2 from moving Player 1's paddle

        newY = event.key === "w" ? Math.max(paddle1Y - 20, 0) : Math.min(paddle1Y + 20, 500);
        setPaddle1Y(newY);
		console.log(`Emitting playerMove for Player 1: Y=${newY}`);
        socket.emit("playerMove", { player: 1, y: newY });
    } 
    else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        if (!isPlayer2) return; // Prevent Player 1 from moving Player 2's paddle

        newY = event.key === "ArrowUp" ? Math.max(paddle2Y - 20, 0) : Math.min(paddle2Y + 20, 500);
        setPaddle2Y(newY);
		console.log(`Emitting playerMove for Player 2: Y=${newY}`);
        socket.emit("playerMove", { player: 2, y: newY });
    }

    if (!ballStarted) {
        setBallStarted(true);
    }
};


  // Ensure WebSocket connects/disconnects properly
  useEffect(() => {
	socket.on("connect", () => {
	  console.log("WebSocket Connected! Socket ID:", socket.id);
	  console.log("WebSocket Connected!", socket.id);
	  socket.emit("registerUser", loggedInUser);
	  socket.emit("requestPlayers"); 
	});
  
	return () => {
	  socket.off("connect");
	};
  }, [loggedInUser]);
  

//   useEffect(() => {
// 	socket.on("playerInfo", (players: { username: string; playerNumber: number }[]) => {
// 	  console.log("Received player info update:", players);
  
// 	  const currentPlayer = players.find(p => p.username === loggedInUser);
// 	  const opponent = players.find(p => p.username !== loggedInUser);
  
// 	  if (opponent) {
// 		setOpponentUsername(opponent.username);
// 		console.log("Updated opponent username:", opponent.username);
// 	  }
// 	});
  
// 	return () => {
// 	  socket.off("playerInfo");
// 	};
//   }, [loggedInUser]);

useEffect(() => {
	socket.on("playerInfo", (players: { username: string; playerNumber: number }[]) => {
	  console.log("Received player info update:", players);
  
	  // Find the current player
	  const currentPlayer = players.find((p) => p.username === loggedInUser);
	  // Find the opponent
	  const opponent = players.find((p) => p.username !== loggedInUser);
  
	  if (currentPlayer) {
		console.log("✅ Current Player:", currentPlayer.username, "Player Number:", currentPlayer.playerNumber);
	  }
  
	  if (opponent) {
		setOpponentUsername(opponent.username);
		console.log("✅ Opponent found:", opponent.username, "Player Number:", opponent.playerNumber);
	  }
  
	  // Set player numbers locally: Always make the logged-in user Player 1
	  if (currentPlayer) {
		if (currentPlayer.playerNumber === 2) {
		  console.log("🔄 Adjusting player numbers: Making logged-in user Player 1 locally");
		  currentPlayer.playerNumber = 1;
		}
	  }
	});
  
	return () => {
	  socket.off("playerInfo");
	};
  }, [loggedInUser]);
  

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paddle1Y, paddle2Y]);

  const paddleColor = darkBackground ? "#555555" : "#ff66b2";
  const ballColor = darkBackground ? "#666666" : "#ff3385";
  const backgroundColor = darkBackground ? "#222222" : "#ffe6f1";	

  return (
		<div 
		  className={`pong-wrapper ${darkBackground ? "dark-mode" : ""}`} 
		  style={{ backgroundColor: backgroundColor }}
		>
	  
	  <Scoreboard 
		score1={score1} 
		score2={score2} 
		darkMode={darkBackground} 
		loggedInUser={loggedInUser} 
		opponentUsername={opponentUsername}
		/>

	  <div ref={gameContainerRef} className={`pong-game-container ${darkBackground ? "dark-mode" : ""}`}>
	  <div className={`pong-center-line ${darkBackground ? "dark-mode" : ""}`}></div>

        {/* <Paddle position="left" top={paddle1Y ?? 0} height={paddleHeight1} color={paddleColor} />
        <Paddle position="right" top={paddle2Y ?? 0} height={paddleHeight2} color={paddleColor} /> */}

			<Paddle 
			key={`left-${paddle1Y}`} // ✅ Forces React to re-render
			position="left" 
			top={paddle1Y ?? 0} 
			height={paddleHeight1} 
			color={paddleColor} 
			/>
			<Paddle 
			key={`right-${paddle2Y}`} // ✅ Forces React to re-render
			position="right" 
			top={paddle2Y ?? 0} 
			height={paddleHeight2} 
			color={paddleColor} 
			/>

        <Ball x={ballX} y={ballY} color={ballColor} />

        {powerUpsEnabled && isPowerUpActive && powerUpType && (
          <PowerUp x={powerUpX ?? 0} y={powerUpY ?? 0} isActive={isPowerUpActive} type={powerUpType} darkMode={darkBackground} />
        )}
      </div>

      {winner && (
        <div className="pong-winner-popup">
          <h2>{winner} WINS! 🎉</h2>
          <button
		className="play-again-button"
		onClick={() => {
			console.log("Play Again clicked!");
			resetGame(); 
			socket.emit("resetGame");
		}}
		>
		PLAY AGAIN
		</button>
        </div>
      )}

      <div className="pong-buttons">
	  <button 
		className={`toggle-button ${darkBackground ? "dark-mode" : ""}`} 
		onClick={() => setPowerUpsEnabled((prev) => !prev)}
		>
		{powerUpsEnabled ? "DISABLE POWER-UPS" : "ENABLE POWER-UPS"}
		</button>

		<button 
		className={`toggle-button ${darkBackground ? "dark-mode" : ""}`} 
		onClick={() => setDarkBackground((prev) => !prev)}
		>
		{darkBackground ? "PASTEL MODE" : "GOTH MODE"}
		</button>
      </div>
    </div>
  );
};

export default Pong;
