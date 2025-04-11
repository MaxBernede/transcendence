import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./Pong.css";
import Paddle from "./Paddle";
import Ball from "./Ball";
import Scoreboard from "./Scoreboard";
import PowerUp from "./PowerUp";
import { usePongGame } from "./hooks/usePongGame";
import axios from "axios";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useParams } from "react-router-dom";
import { parse } from "path";
import { UserPayload, useUserContext } from "../context";

// this file connects to a Websocket server to sync real time movement
// and manages the game state (ball, paddle, scores) + handles player input

const socket = io("http://localhost:3000/pong", { withCredentials: true });

interface Player {
  username: string;
  playerNumber: number;
  userId: string;
}

interface PongProps {
  urlRoomId?: string;
}

const Pong: React.FC<PongProps> = ({ urlRoomId }) => {
  const [playerNumber, setPlayerNumber] = useState<number>(1);
  const [winner, setWinner] = useState<string | null>(null);
  const [score1, setScore1] = useState<number>(0);
  const [score2, setScore2] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [powerUpCooldown, setPowerUpCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const cooldownInterval = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  // fetches logged-in user info and updates local state
  const fetchUserData = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/users/me", {
        withCredentials: true,
      });

      if (response.data.username) {
        setLoggedInUser(response.data.username);
        setUserId(response.data.id.toString());
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

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
    // roomId,
    // setRoomId,
  } = usePongGame(socket, playerNumber, roomId, setRoomId);

  const [powerUpsEnabled, setPowerUpsEnabled] = useState(true);
  const [darkBackground, setDarkBackground] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string>("");
  const [opponentUsername, setOpponentUsername] =
    useState<string>("WAITING...");
  const hasListener = useRef(false);
  const [ballPosition, setBallPosition] = useState({ x: 386, y: 294 });
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownDuration, setCooldownDuration] = useState(3000);
  // const { roomId: urlRoomId } = useParams();
  // console.log("useParams roomId:", urlRoomId);
  const navigate = useNavigate();
  const handleCreatePrivateRoom = () => {
    const newRoomId = `room-${uuidv4()}`;
    navigate(`/pong/${newRoomId}`);
  };

  const me: UserPayload = useUserContext();

  useEffect(() => {
    const storedRoomId = localStorage.getItem("roomId");
    if (storedRoomId) {
      console.log("Restored roomId from localStorage:", storedRoomId);
      setRoomId(storedRoomId);
    }
  }, []);

  // Reset game state when the page refreshes
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("Clearing game state on refresh.");
      localStorage.removeItem("gameState");
      setWinner(null);
      setScore1(0);
      setScore2(0);
      // socket.emit("resetGame");
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
          setUserId(response.data.id.toString());
        }
      })
      .catch(() => console.error("Failed to fetch user data"));
  }, []);

  useEffect(() => {
    if (urlRoomId) {
      setRoomId(urlRoomId);
      localStorage.setItem("roomId", urlRoomId);
    }
  }, [urlRoomId]);

  useEffect(() => {
    const handleRegistered = () => {
      console.log("got registered from server");
      setIsRegistered(true);
      socket.emit("requestPlayers");
      socket.emit("playerReady");
    };

    socket.on("registered", handleRegistered);

    socket.emit("joinPrivateRoom", {
      roomId: urlRoomId,
      userId: me.id,
    });

    return () => {
      socket.off("registered", handleRegistered);
    };
  }, []);

  // once loggedinuser is set it registers player to server and lists connected players
  // useEffect(() => {
  //   if (loggedInUser && userId) {
  //     console.log("registering with:", {
  //       userId,
  //       username: loggedInUser,
  //       urlRoomId,
  //     });

  //     socket.emit("registerUser", {
  //       userId,
  //       username: loggedInUser,
  //       roomId: urlRoomId || null, // public matchmaking if null
  //     });

  //     socket.emit("requestPlayers");

  //     if (opponentUsername === "WAITING...") {
  //       setScore1(0);
  //       setScore2(0);
  //       setWinner(null);
  //     }
  //   }
  // }, [loggedInUser, userId, urlRoomId]);

  useEffect(() => {
    if (loggedInUser && userId) {
      console.log("ending registerUser", {
        userId,
        username: loggedInUser,
        roomId: urlRoomId || null,
      });

      socket.emit("registerUser", {
        userId,
        username: loggedInUser,
        roomId: urlRoomId || null,
      });
    }
  }, [loggedInUser, userId, urlRoomId]);

  // Runs once on component mount
  useEffect(() => {
    socket.on("updatePaddle", ({ player, y }) => {
      if (player === 1) setPaddle1Y(y);
      else if (player === 2) setPaddle2Y(y);
    });

    return () => {
      socket.off("updatePaddle");
    };
  }, []);

  // when page is load this checks if playernumber is stored in local storage
  // and sets it if so
  useEffect(() => {
    const storedPlayerNumber = localStorage.getItem("playerNumber");
    if (storedPlayerNumber) {
      setPlayerNumber(Number(storedPlayerNumber));
    }
  }, []);

  // listens for gamestate updates from server and updates opponents paddle and ball position
  const justResetRef = useRef(false);

  useEffect(() => {
    if (hasListener.current) return;
    hasListener.current = true;

    const handleGameState = (state: any) => {
      if (!state?.paddle1 || !state?.paddle2 || !state?.ball) return;

      setPaddle1Y(state.paddle1.y);
      setPaddle2Y(state.paddle2.y);
      setBallPosition({ x: state.ball.x, y: state.ball.y });

      if (!ballStarted && state.ball.vx !== 0 && state.ball.vy !== 0) {
        setBallStarted(true);
      }

      // ignore game state if we just reset
      if (justResetRef.current) {
        console.log("ignoring old gameState after reset.");
        justResetRef.current = false;
        return;
      }

      setScore1(state.score.player1);
      setScore2(state.score.player2);
    };

    const handleGameReset = () => {
      console.log("game reset triggered");
      setScore1(0);
      setScore2(0);
      setBallStarted(false);
      ballStartedRef.current = false;
      setBallPosition({ x: 386, y: 294 });
      setPaddle1Y(250);
      setPaddle2Y(250);
      justResetRef.current = true;

      // Optionally: socket.emit("requestGameState"); ← only if backend resets too
    };

    socket.on("gameState", handleGameState);
    socket.on("gameReset", handleGameReset);

    return () => {
      socket.off("gameState", handleGameState);
      socket.off("gameReset", handleGameReset);
      hasListener.current = false;
    };
  }, [ballStarted]);

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
      console.log("👥 Live players in room:", players);

      currentPlayersRef.current = players;

      if (!loggedInUser) return;

      let storedPlayerNumber =
        Number(sessionStorage.getItem("playerNumber")) || 1;

      const currentPlayer = players.find((p) => p.username === loggedInUser);
      const opponent = players.find((p) => p.username !== loggedInUser);

      if (currentPlayer) {
        console.log(
          `Restoring stored player number: ${currentPlayer.playerNumber}`
        );
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
        console.log(
          `Opponent Found: ${opponent.username}, Player Number: ${opponent.playerNumber}`
        );
        setOpponentUsername(opponent.username);

        if (players.length === 2) {
          setIsReconnecting(false);
        }
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

  useEffect(() => {
    console.log("roomId from hook:", roomId);
  }, [roomId]);

  useEffect(() => {
    socket.on("registered", () => {
      setIsRegistered(true);
      socket.emit("requestPlayers");
      socket.emit("playerReady");
    });

    // socket.on("joinPrivateRoom", () => {
    // 	setIsRegistered(true);
    // 	socket.emit("requestPlayers");
    // 	socket.emit("playerReady");
    //   });

    return () => {
      socket.off("registered");
      //   socket.off("joinPrivateRoom");
    };
  }, []);

  const [playerInfo, setPlayerInfo] = useState<Player[]>([]);
  const [reconnectPopupShown, setReconnectPopupShown] = useState(false);

  useEffect(() => {
    if (playerInfo.length === 0 && !reconnectPopupShown) {
      const timeout = setTimeout(() => {
        if (playerInfo.length === 0) {
          setReconnectPopupShown(true);
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [playerInfo, reconnectPopupShown]);

  const ballStartedRef = useRef(false);

  // when user presses W / S / up / down it moves paddles and sends it to server
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      console.log("Key pressed:", {
        isRegistered,
        roomId,
        winner,
        isReconnecting,
      });

      if (!isRegistered || !roomId || winner || isReconnecting) return;

      const opponentFound = opponentUsername !== "WAITING...";
      let newY = 0;

      if (playerNumber === 1) {
        if (event.key === "w" || event.key === "ArrowUp") {
          newY = Math.max(paddle1Y - 20, 0);
          setPaddle1Y(newY);
          socket.emit("playerMove", { player: 1, y: newY, roomId });
        } else if (event.key === "s" || event.key === "ArrowDown") {
          newY = Math.min(paddle1Y + 20, 500);
          setPaddle1Y(newY);
          socket.emit("playerMove", { player: 1, y: newY, roomId });
        }
      } else if (playerNumber === 2) {
        if (event.key === "w" || event.key === "ArrowUp") {
          newY = Math.max(paddle2Y - 20, 0);
          setPaddle2Y(newY);
          socket.emit("playerMove", { player: 2, y: newY, roomId });
        } else if (event.key === "s" || event.key === "ArrowDown") {
          newY = Math.min(paddle2Y + 20, 500);
          setPaddle2Y(newY);
          socket.emit("playerMove", { player: 2, y: newY, roomId });
        }
      }

      if (!ballStartedRef.current && opponentFound && !winner) {
        setBallStarted(true);
        ballStartedRef.current = true;
        socket.emit("startBall");
      }
    },
    [
      isRegistered,
      roomId,
      winner,
      isReconnecting,
      opponentUsername,
      playerNumber,
      paddle1Y,
      paddle2Y,
    ]
  );

  socket.on("gameOver", (data) => {
    console.log(`${data.winner} Wins!`);
    setWinner(data.winner);

    // Optionally update score UI if needed
    if (data.finalScore) {
      setScore1(data.finalScore.player1);
      setScore2(data.finalScore.player2);
    }

    // Optionally re-fetch user data (to update wins/losses in UI)
    fetchUserData();
  });

  useEffect(() => {
    socket.on("gameReset", () => {
      console.log("Game has been fully reset! Ensuring fresh state...");

      // Reset everything on the frontend
      setWinner(null);
      setScore1(0);
      setScore2(0);
      setBallPosition({ x: 386, y: 294 });
      setPaddle1Y(250);
      setPaddle2Y(250);
      setPaddleHeight1(100);
      setPaddleHeight2(100);
      setBallStarted(false);
      ballStartedRef.current = false;

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
      setBallPosition({ x: 386, y: 294 });
      setPaddle1Y(250);
      setPaddle2Y(250);
      setPaddleHeight1(100);
      setPaddleHeight2(100);
      setBallStarted(false);
      ballStartedRef.current = false;

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

    localStorage.removeItem("roomId");
    setWinner(null); // Hide popup for THIS player
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
      setBallPosition({ x: 386, y: 294 });
      setPaddle1Y(250);
      setPaddle2Y(250);
      setPaddleHeight1(100);
      setPaddleHeight2(100);
      setBallStarted(false);
      ballStartedRef.current = false;

      // Request fresh player data AFTER the game resets
      setTimeout(() => {
        console.log("Requesting fresh player info from server...");
        socket.emit("requestPlayers");

        //start the ball after reset
        console.log("Triggering ball movement...");
        socket.emit("startBall");
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
        console.log("Opponent is waiting...");
        setOpponentUsername("WAITING...");
      }
    });

    return () => {
      socket.off("playerWaiting");
    };
  }, [playerNumber]);

  useEffect(() => {
    socket.on("powerUpsToggled", (data) => {
      console.log("Power-ups toggled:", data.enabled);
      setPowerUpsEnabled(data.enabled);
    });

    return () => {
      socket.off("powerUpsToggled");
    };
  }, []);

  useEffect(() => {
    const handleOpponentLeft = () => {
      console.log("[SOCKET] Received opponentLeft!");
      alert("Opponent left the game. please refresh to start new game!");
      window.location.reload(); // or navigate("/lobby") if using react-router
    };

    socket.on("opponentLeft", handleOpponentLeft);

    return () => {
      socket.off("opponentLeft", handleOpponentLeft);
    };
  }, []);

  const handleDisablePowerUps = () => {
    if (cooldownActive) return;

    const newState = !powerUpsEnabled;

    // Emit toggle + request cooldown start for both players
    socket.emit("togglePowerUps", { enabled: newState });

    // NOTE: cooldown will be triggered by socket event, not locally here anymore
  };

  useEffect(() => {
    const handleRoomUpdate = ({ roomId }: { roomId: string }) => {
      console.log("hook received roomId:", roomId);
      setRoomId(roomId);
      localStorage.setItem("roomId", roomId);

      // Reset score when joining new room
      setScore1(0);
      setScore2(0);
      setWinner(null);
      setBallPosition({ x: 386, y: 294 });
      setPaddle1Y(250);
      setPaddle2Y(250);
      setPaddleHeight1(100);
      setPaddleHeight2(100);
      setBallStarted(false);
      ballStartedRef.current = false;
    };

    socket.on("gameRoomUpdate", handleRoomUpdate);

    return () => {
      socket.off("gameRoomUpdate", handleRoomUpdate);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const handleLeave = () => {
      socket.emit("leaveGame");
      localStorage.removeItem("roomId");
    };

    window.addEventListener("beforeunload", handleLeave);

    return () => {
      // socket.emit("leaveGame");
      // localStorage.removeItem("roomId");
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, []);

  const currentPlayersRef = useRef<Player[]>([]);

  useEffect(() => {
    let disconnectTimeout: NodeJS.Timeout | null = null;

    const getCurrentPlayers = () => currentPlayersRef.current;

    const handleOpponentDisconnected = () => {
      // console.warn("⚠️ Opponent disconnected! Waiting before showing popup...");
      setIsReconnecting(true);

      // Start timeout: only show disconnected state if no new player appears
      disconnectTimeout = setTimeout(() => {
        const currentPlayers = getCurrentPlayers(); // You must implement this to return latest player list

        if (currentPlayers.length < 2) {
          console.log("Still no opponent, triggering reconnect state.");
          localStorage.removeItem("gameState");
          localStorage.removeItem("roomId");

          setOpponentUsername("WAITING...");
          setWinner(null);
          setScore1(0);
          setScore2(0);
          setBallPosition({ x: 386, y: 294 });
          setPaddle1Y(250);
          setPaddle2Y(250);
          setPaddleHeight1(100);
          setPaddleHeight2(100);
          setBallStarted(false);
          ballStartedRef.current = false;
          setIsReconnecting(true);
        } else {
          console.log("Opponent already reconnected. Skipping reset.");
        }
      }, 2000); // 2s grace window
    };

    const handleResumeGame = () => {
      console.log("Game resumed after reconnect");
      if (disconnectTimeout) clearTimeout(disconnectTimeout);
      setIsReconnecting(false);
    };

    socket.on("opponentDisconnected", handleOpponentDisconnected);
    socket.on("resumeGame", handleResumeGame);

    return () => {
      socket.off("opponentDisconnected", handleOpponentDisconnected);
      socket.off("resumeGame", handleResumeGame);
      if (disconnectTimeout) clearTimeout(disconnectTimeout);
    };
  }, [userId]);

  useEffect(() => {
    return () => {
      console.log("Cleaning up all socket and key event listeners...");

      socket.off("gameState");
      socket.off("playerInfo");
      socket.off("powerUp");
      socket.off("gameReset");
      socket.off("waitingForOpponent");
      socket.off("registered");
      socket.off("gameRoomUpdate");
      socket.off("gameOver");
      socket.off("bothPlayersReady");
      socket.off("playersReady");
      socket.off("playerWaiting");
      socket.off("opponentDisconnected");
      socket.off("resumeGame");

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      console.log("[CLEANUP] Component unmounted. Leaving game.");
      socket.emit("leaveGame");
      localStorage.removeItem("roomId");
    };
  }, []);

  const [showReconnectPopup, setShowReconnectPopup] = useState(false);

  useEffect(() => {
    if (isReconnecting) {
      setShowReconnectPopup(true);
    }
  }, [isReconnecting]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isReconnecting) setShowReconnectPopup(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [showReconnectPopup]);

  useEffect(() => {
    socket.on("powerUpsCooldown", ({ duration }) => {
      setPowerUpCooldown(true);
      setCooldownTime(duration / 1000); // convert ms → seconds

      cooldownInterval.current = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownInterval.current!);
            setPowerUpCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    return () => {
      socket.off("powerUpsCooldown");
    };
  }, []);

  useEffect(() => {
    socket.on("accessDenied", () => {
      console.log("Access denied to room, redirecting to home...");
      navigate("/");
    });

    return () => {
      socket.off("accessDenied");
    };
  }, [navigate]);

  return (
    <div
      className={`pong-wrapper ${darkBackground ? "dark-mode" : ""}`}
      style={{ backgroundColor: darkBackground ? "#222222" : "#ffe6f1" }}
    >
      {showReconnectPopup && (
        <div className="pong-reconnect-popup">
          <h3>Opponent disconnected!</h3>
          <p>Waiting for them to reconnect...</p>
        </div>
      )}

      {isReconnecting && (
        <div className="pong-reconnect-popup">
          <h3>Opponent disconnected!</h3>
          <p>Waiting for them to reconnect...</p>
        </div>
      )}
      <Scoreboard
        score1={score1}
        score2={score2}
        darkMode={darkBackground}
        loggedInUser={playerNumber === 1 ? loggedInUser : opponentUsername}
        opponentUsername={playerNumber === 1 ? opponentUsername : loggedInUser}
      />

      <div
        ref={gameContainerRef}
        className={`pong-game-container ${darkBackground ? "dark-mode" : ""}`}
      >
        <div
          className={`pong-center-line ${darkBackground ? "dark-mode" : ""}`}
        ></div>

        <Paddle
          key={`left-${paddle1Y}`}
          position="left"
          top={paddle1Y ?? 0}
          height={paddleHeight1}
          color={darkBackground ? "#555555" : "#ff66b2"}
        />
        <Paddle
          key={`right-${paddle2Y}`}
          position="right"
          top={paddle2Y ?? 0}
          height={paddleHeight2}
          color={darkBackground ? "#555555" : "#ff66b2"}
        />

        <Ball
          x={ballPosition.x}
          y={ballPosition.y}
          color={darkBackground ? "#666666" : "#ff3385"}
        />

        {powerUpsEnabled && isPowerUpActive && powerUpType && (
          <PowerUp
            x={powerUpX ?? 0}
            y={powerUpY ?? 0}
            isActive={isPowerUpActive}
            type={powerUpType}
            darkMode={darkBackground}
          />
        )}

        {winner && (
          <div className="pong-winner-popup">
            <h2>{winner} WINS! 🎉, refresh to play a new game! </h2>
          </div>
        )}
      </div>

      <div className="pong-buttons">
        <div className="cooldown-container">
          <button
            className={`toggle-button cooldown-button ${
              darkBackground ? "disabled" : ""
            }`}
            onClick={handleDisablePowerUps}
            disabled={powerUpCooldown}
          >
            <span style={{ position: "relative", zIndex: 1 }}>
              {powerUpsEnabled ? "DISABLE POWER-UPS" : "ENABLE POWER-UPS"}
            </span>
            {powerUpCooldown && (
              <div
                className="cooldown-fill"
                style={{ width: `${(cooldownTime / 3) * 100}%` }}
              />
            )}
          </button>
        </div>

        <button
          className={`toggle-button ${darkBackground ? "disabled" : ""}`}
          onClick={() => setDarkBackground((prev) => !prev)}
          style={{ minWidth: "120px" }}
        >
          {darkBackground ? "PASTEL MODE" : "GOTH MODE"}
        </button>
      </div>
    </div>
  );
};

export default Pong;
