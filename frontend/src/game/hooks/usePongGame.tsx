import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

export const usePongGame = (socket: Socket) => {
  const [paddle1Y, setPaddle1Y] = useState(250);
  const [paddle2Y, setPaddle2Y] = useState(250);
  const [paddleHeight1, setPaddleHeight1] = useState(100); // ✅ Ensure this exists
  const [paddleHeight2, setPaddleHeight2] = useState(100); // ✅ Ensure this exists
  const [ballPosition, setBallPosition] = useState({ x: 390, y: 294 });
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [powerUpX, setPowerUpX] = useState<number | null>(null); // ✅ Ensure this exists
  const [powerUpY, setPowerUpY] = useState<number | null>(null); // ✅ Ensure this exists
  const [powerUpType, setPowerUpType] = useState<"shrinkOpponent" | "speedBoost" | "enlargePaddle" | null>(null);
  const [isPowerUpActive, setIsPowerUpActive] = useState(false);
  const [ballStarted, setBallStarted] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("gameState", (state) => {
      if (!state?.paddle1 || !state?.paddle2 || !state?.ball) return;

      setPaddle1Y(state.paddle1.y);
      setPaddle2Y(state.paddle2.y);
      setBallPosition({ x: state.ball.x, y: state.ball.y });
      setScore1(state.score.player1);
      setScore2(state.score.player2);
      setWinner(state.winner || null);

      // ✅ Update power-ups
      setPowerUpX(state.powerUp?.x || null);
      setPowerUpY(state.powerUp?.y || null);
      setPowerUpType(state.powerUp?.type || null);
      setIsPowerUpActive(state.powerUp?.isActive || false);
    });

    return () => {
      socket.off("gameState");
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
  };
};
