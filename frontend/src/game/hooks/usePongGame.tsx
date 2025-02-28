import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

export const usePongGame = (socket: Socket, playerNumber: number) => {
  const [paddle1Y, setPaddle1Y] = useState(250);
  const [paddle2Y, setPaddle2Y] = useState(250);
  const [paddleHeight1, setPaddleHeight1] = useState(100); 
  const [paddleHeight2, setPaddleHeight2] = useState(100); 
  const [ballPosition, setBallPosition] = useState({ x: 390, y: 294 });
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [powerUpX, setPowerUpX] = useState<number | null>(null);
  const [powerUpY, setPowerUpY] = useState<number | null>(null);
  const [powerUpType, setPowerUpType] = useState<"shrinkOpponent" | "speedBoost" | "enlargePaddle" | null>(null);
  const [isPowerUpActive, setIsPowerUpActive] = useState(false);
  const [ballStarted, setBallStarted] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Handles Power-Up SPAWNING and CLEARING
  useEffect(() => {
      socket.on("powerUpSpawned", (data) => {
          console.log("Power-up received from server:", data);
          setPowerUpX(data.x);
          setPowerUpY(data.y);
          setPowerUpType(data.type);
          setIsPowerUpActive(true);
      });

      socket.on("powerUpCleared", () => {
          console.log(" Power-up cleared!");
          setPowerUpX(null);
          setPowerUpY(null);
          setPowerUpType(null);
          setIsPowerUpActive(false);
      });

      return () => {
          socket.off("powerUpSpawned");
          socket.off("powerUpCleared");
      };
  }, [socket]);

  // Handles Power-Up MOVEMENT updates
  useEffect(() => {
      socket.on("updatePowerUp", (data) => {
          console.log("Received Power-Up update:", data);
          setPowerUpX(data.x);
          setPowerUpY(data.y);
      });

      return () => {
          socket.off("updatePowerUp");
      };
  }, [socket]);

  useEffect(() => {
    socket.on("gameState", (state) => {
        if (!state?.paddle1 || !state?.paddle2 || !state?.ball || !state?.score) return;

        setPaddle1Y(state.paddle1.y);
        setPaddle2Y(state.paddle2.y);
        setBallPosition({ x: state.ball.x, y: state.ball.y });

        // ✅ Always update scores
        setScore1(state.score.player1);
        setScore2(state.score.player2);

        // ✅ If scores are both 0, assume full reset
        if (state.score.player1 === 0 && state.score.player2 === 0) {
            console.log("🆕 Game reset detected! Resetting local state.");
            setWinner(null);
            setScore1(0);
            setScore2(0);
            return; // ⬅️ Important: Prevents winner pop-up from showing after reset
        }

        // ✅ Show winner only if no winner has been declared yet
        if (!winner && (state.score.player1 >= 3 || state.score.player2 >= 3)) {
            const winningPlayer = state.score.player1 >= 3 ? "Player 1" : "Player 2";
            console.log(`🎉 ${winningPlayer} WINS!`);
            setWinner(winningPlayer);

            // Show winner popup for 3 seconds, then fully reset
            setTimeout(() => {
                setWinner(null);
                socket.emit("resetGame"); // 🔥 Ensure reset request is sent
            }, 3000);
        }
    });

    return () => {
        socket.off("gameState");
    };
}, [socket, winner]);

// ✅ Listen for explicit game reset event
useEffect(() => {
    socket.on("gameReset", () => {
        console.log("♻️ Received game reset event! Clearing state.");
        setWinner(null);
        setScore1(0);
        setScore2(0);
    });

    return () => {
        socket.off("gameReset");
    };
}, [socket]);



  // Listen for Paddle Size Change Power-ups
  useEffect(() => {
      socket.on("shrinkPaddle", (data) => {
          console.log(`Shrinking Player ${data.player}'s paddle`);
          if (data.player === 1) setPaddleHeight1((h) => Math.max(h * 0.5, 40));
          if (data.player === 2) setPaddleHeight2((h) => Math.max(h * 0.5, 40));

          setTimeout(() => {
              console.log(`Restoring Player ${data.player}'s paddle size after 7 seconds`);
              if (data.player === 1) setPaddleHeight1(100);
              if (data.player === 2) setPaddleHeight2(100);
          }, 7000); // Restore paddle size after 7 seconds
      });

      socket.on("enlargePaddle", (data) => {
          console.log(`Enlarging Player ${data.player}'s paddle`);
          if (data.player === 1) setPaddleHeight1((h) => Math.min(h * 1.5, 150));
          if (data.player === 2) setPaddleHeight2((h) => Math.min(h * 1.5, 150));

          setTimeout(() => {
              console.log(`Restoring Player ${data.player}'s paddle size after 7 seconds`);
              if (data.player === 1) setPaddleHeight1(100);
              if (data.player === 2) setPaddleHeight2(100);
          }, 7000); // Restore paddle size after 7 seconds
      });

      return () => {
          socket.off("shrinkPaddle");
          socket.off("enlargePaddle");
      };
  }, [socket]);

  return {
      gameContainerRef,
      paddle1Y,
      paddle2Y,
      paddleHeight1,
      paddleHeight2,
      ballPosition,
      score1,
      score2,
      winner,
      powerUpX, 
      powerUpY, 
      powerUpType,
      isPowerUpActive,
      ballStarted,
      setBallStarted,
      setPaddle1Y,
      setPaddle2Y,
      setPaddleHeight1, 
      setPaddleHeight2
  };
};
