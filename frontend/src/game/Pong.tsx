import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./Pong.css";
import Paddle from "./Paddle";
import Ball from "./Ball";
import Scoreboard from "./Scoreboard";
import PowerUp from "./PowerUp";
import { usePongGame } from "./hooks/usePongGame";
import axios from "axios";

// this file connects to a Websocket server to sync real time movement
// and manages the game state (ball, paddle, scores) + handles player input

const socket = io("http://localhost:3000/pong", {withCredentials: true});

interface Player {
	username: string;
	playerNumber: number;
}

const Pong = () => {
	const [playerNumber, setPlayerNumber] = useState<number>(1);
	const [winner, setWinner] = useState<string | null>(null);
	const [score1, setScore1] = useState<number>(0);
	const [score2, setScore2] = useState<number>(0);
	
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
		// score1,
		// score2,
		// winner,
		setPaddle1Y,
		setPaddle2Y,
		ballStarted,
		setBallStarted,
		setPaddleHeight1,
		setPaddleHeight2,
	} = usePongGame(socket, playerNumber);

	const [powerUpsEnabled, setPowerUpsEnabled] = useState(true);
	const [darkBackground, setDarkBackground] = useState(false);
	const [loggedInUser, setLoggedInUser] = useState<string>("");
	const [opponentUsername, setOpponentUsername] = useState<string>("WAITING...");
	const hasListener = useRef(false);
	const [ballPosition, setBallPosition] = useState({ x: 390, y: 294 });
	

	  // Reset game state when the page refreshes
	  useEffect(() => {
		const handleBeforeUnload = () => {
		  console.log("Clearing game state on refresh.");
		  localStorage.removeItem("gameState");
		  setWinner(null);
		  setScore1(0);
		  setScore2(0);
		  socket.emit("resetGame"); 
		};
	
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
		  window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	  }, []);

  // fetch current user's name from users/me and store it in loggedinuser
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


// once loggedinuser is set it registers player to server and lists connected players
useEffect(() => {
    if (loggedInUser) {
        socket.emit("registerUser", loggedInUser);
        socket.emit("requestPlayers");
    }
}, [loggedInUser]);


// when page is load this checks if playernumber is stored in local storage
// and sets it if so
  useEffect(() => {
    const storedPlayerNumber = localStorage.getItem("playerNumber");
    if (storedPlayerNumber) {
      setPlayerNumber(Number(storedPlayerNumber));
    }
  }, []);


  // listens for gamestate updates from server and updates opponents paddle and ball position
  useEffect(() => {
    if (hasListener.current) return; // Prevent duplicate listeners
    hasListener.current = true;

    const handleGameState = (state: any) => {
        if (!state?.paddle1 || !state?.paddle2 || !state?.ball) return;

        setPaddle1Y(state.paddle1.y);
        setPaddle2Y(state.paddle2.y);
        setBallPosition({ x: state.ball.x, y: state.ball.y });

        if (!ballStarted && state.ball.vx !== 0 && state.ball.vy !== 0) {
            setBallStarted(true);
        }

        if (score1 !== state.score.player1 || score2 !== state.score.player2) {
            console.log(`Updating Scores: P1=${state.score.player1} P2=${state.score.player2}`);
            setScore1(state.score.player1);
            setScore2(state.score.player2);
        }
    };

    socket.on("gameState", handleGameState);
    socket.on("gameReset", () => {
        console.log("Game reset detected! Resetting everything...");
        setScore1(0);
        setScore2(0);
        setBallStarted(false);
        setBallPosition({ x: 390, y: 294 });
        setPaddle1Y(250);
        setPaddle2Y(250);
    });

    return () => {
        socket.off("gameState", handleGameState);
        socket.off("gameReset");
        hasListener.current = false; // Allow re-registering on component re-mount
    };
}, []);



// checks session storage for playernumber and restores it if exists
// prevents player from being reassigned when refreshed
// stores data until tab is closed
  useEffect(() => {
	const storedPlayerNumber = sessionStorage.getItem("playerNumber");
	if (storedPlayerNumber) {
	  setPlayerNumber(Number(storedPlayerNumber));
	}
  }, []);
  

  // listens to playerinfo updates from Websocket server
  useEffect(() => {
    const handlePlayerInfo = (players: Player[]) => {
        console.log("Received updated player info:", players);

        if (!loggedInUser) return;

        let storedPlayerNumber = Number(sessionStorage.getItem("playerNumber")) || 1;

        const currentPlayer = players.find((p) => p.username === loggedInUser);
        const opponent = players.find((p) => p.username !== loggedInUser);

        if (currentPlayer) {
            console.log(`Restoring stored player number: ${currentPlayer.playerNumber}`);
            storedPlayerNumber = currentPlayer.playerNumber;
        } else if (players.length === 1) {
            storedPlayerNumber = players[0].playerNumber === 1 ? 2 : 1;
            console.log(`Assigning opposite player number: ${storedPlayerNumber}`);
        }

        if (playerNumber !== storedPlayerNumber) {
            setPlayerNumber(storedPlayerNumber);
            sessionStorage.setItem("playerNumber", String(storedPlayerNumber));
        }

        if (opponent) {
            console.log(`Opponent Found: ${opponent.username}, Player Number: ${opponent.playerNumber}`);
            setOpponentUsername(opponent.username);
        } else {
            console.warn("Opponent not found, setting to WAITING...");
            setOpponentUsername("WAITING...");
        }
    };

    socket.on("playerInfo", handlePlayerInfo);

    return () => {
        socket.off("playerInfo", handlePlayerInfo);
    };
}, [loggedInUser, playerNumber]);


// when user presses W / S / up / down it moves paddles and sends it to server
  const handleKeyDown = (event: KeyboardEvent) => {
	if (winner)
			return;
		
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

	if (!ballStarted) {
		console.log("First paddle move detected, starting ball movement...");
		setBallStarted(true);
		socket.emit("startBall");
	  }
  };

  // when user presses W / S / Up / Down it moves paddle and sends it to server
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paddle1Y, paddle2Y]);

  useEffect(() => {
    socket.on("gameOver", (data) => {
        console.log(`${data.winner} Wins!`);
        setWinner(data.winner);
    });

    socket.on("gameReset", () => {
        console.log("Game reset");
        setWinner(null); // Hide popup when game restarts
    });

    return () => {
        socket.off("gameOver");
        socket.off("gameReset");
    };
}, [socket]);





useEffect(() => {
    socket.on("gameReset", () => {
        console.log("Game has been fully reset! Ensuring fresh state...");

        // Reset everything on the frontend
        setWinner(null);
        setScore1(0);
        setScore2(0);
        setBallPosition({ x: 390, y: 294 });
        setPaddle1Y(250);
        setPaddle2Y(250);
        setPaddleHeight1(100);
        setPaddleHeight2(100);
		setBallStarted(false);

        // Add delay to avoid syncing issues
        setTimeout(() => {
            console.log(" Requesting fresh game state from server...");
            socket.emit("requestGameState");
        }, 100);
    });

    return () => {
        socket.off("gameReset");
    };
}, []);

useEffect(() => {
    socket.on("waitingForOpponent", (data) => {
        console.log(`${data.waitingFor} is waiting for their opponent...`);

        if (!winner) {
            setOpponentUsername("WAITING...");
        }
    });

    socket.on("gameReset", () => {
        console.log("Both players clicked 'Play Again'! Restarting game...");

        // Fully reset game state

		setWinner(null);
        setScore1(0);
        setScore2(0);
        setBallPosition({ x: 390, y: 294 });
        setPaddle1Y(250);
        setPaddle2Y(250);
        setPaddleHeight1(100);
        setPaddleHeight2(100);
        setBallStarted(false);

        // Restore correct opponent name
        setTimeout(() => {
            console.log(" Requesting fresh player info from server...");
            socket.emit("requestPlayers");
        }, 500);
    });

    return () => {
        socket.off("waitingForOpponent");
        socket.off("gameReset");
    };
}, [winner]);

const [playersReady, setPlayersReady] = useState<number>(0); // Track how many players clicked "Play Again"
const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false); // Track if THIS player is ready

const handleResetGame = () => {
    console.log("Player clicked 'Play Again'... Waiting for opponent.");
    
    setWinner(null);  // Hide popup for THIS player
    setOpponentUsername("WAITING..."); // Show "WAITING..." until both players click
    setIsPlayerReady(true); // Mark THIS player as ready

    // Notify the server that THIS player is ready
    socket.emit("playerReady");
};

// Handle "bothPlayersReady" event correctly
useEffect(() => {
    socket.on("bothPlayersReady", () => {
        console.log("Both players are ready! Restarting game...");

        setPlayersReady(2); // Ensure both players are marked as ready
        setScore1(0);
        setScore2(0);
        setBallPosition({ x: 390, y: 294 });
        setPaddle1Y(250);
        setPaddle2Y(250);
        setPaddleHeight1(100);
        setPaddleHeight2(100);
        setBallStarted(false);

        // Request fresh player data AFTER the game resets
        setTimeout(() => {
            console.log("Requesting fresh player info from server...");
            socket.emit("requestPlayers");
        }, 500);
    });

    return () => {
        socket.off("bothPlayersReady");
    };
}, []);



useEffect(() => {
    socket.on("playersReady", (readyPlayers) => {
        console.log(` Server says ${readyPlayers} players are ready!`);
        setPlayersReady(readyPlayers);

        // If both players are ready, restore opponent's username
        if (readyPlayers === 2) {
            console.log("Both players are ready! Assigning opponent...");
            socket.emit("requestPlayers"); // Request fresh player info from the server
        }
    });

    return () => {
        socket.off("playersReady");
    };
}, []);



useEffect(() => {
    socket.on("playerWaiting", (playerNum) => {
        if (playerNum !== playerNumber) {
            console.log("⏳ Opponent is waiting...");
            setOpponentUsername("WAITING...");
        }
    });

    return () => {
        socket.off("playerWaiting");
    };
}, [playerNumber]);


return (
    <div className={`pong-wrapper ${darkBackground ? "dark-mode" : ""}`} style={{ backgroundColor: darkBackground ? "#222222" : "#ffe6f1" }}>
		<Scoreboard
		score1={score1}  // Player 1's score always on the left
		score2={score2}  // Player 2's score always on the right
		darkMode={darkBackground}
		loggedInUser={playerNumber === 1 ? loggedInUser : opponentUsername} 
		opponentUsername={playerNumber === 1 ? opponentUsername : loggedInUser} 
		/>
      <div ref={gameContainerRef} className={`pong-game-container ${darkBackground ? "dark-mode" : ""}`}>
        <div className={`pong-center-line ${darkBackground ? "dark-mode" : ""}`}></div>

        <Paddle key={`left-${paddle1Y}`} position="left" top={paddle1Y ?? 0} height={paddleHeight1} color={darkBackground ? "#555555" : "#ff66b2"} />
        <Paddle key={`right-${paddle2Y}`} position="right" top={paddle2Y ?? 0} height={paddleHeight2} color={darkBackground ? "#555555" : "#ff66b2"} />

        <Ball x={ballPosition.x} y={ballPosition.y} color={darkBackground ? "#666666" : "#ff3385"} />

        {powerUpsEnabled && isPowerUpActive && powerUpType && (
          <PowerUp x={powerUpX ?? 0} y={powerUpY ?? 0} isActive={isPowerUpActive} type={powerUpType} darkMode={darkBackground} />
        )}

        {/* ADD WINNER POPUP HERE */}
		{winner && (
    <div className="pong-winner-popup">
        <h2>{winner} WINS! 🎉</h2>
        <button className="play-again-button" onClick={handleResetGame}>
            PLAY AGAIN
        </button>
    </div>
)}


      </div>

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
}

export default Pong;