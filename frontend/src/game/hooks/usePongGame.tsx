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

  useEffect(() => {
    socket.on("gameState", (state) => {
        if (!state?.paddle1 || !state?.paddle2 || !state?.ball) return;

        setPaddle1Y(state.paddle1.y);
        setPaddle2Y(state.paddle2.y);
        setBallPosition({ x: state.ball.x, y: state.ball.y });
        setScore1(state.score.player1);
        setScore2(state.score.player2);
        setWinner(state.winner || null);
    });

    // socket.on("playerMoveUpdate", (data) => {
    //     if (playerNumber === 1) {
    //         // If we're Player 1, our paddle is "paddle1", opponent's is "paddle2"
    //         setPaddle1Y(data.paddle1Y);
    //         setPaddle2Y(data.paddle2Y);
    //     } else if (playerNumber === 2) {
    //         // If we're Player 2, our paddle is "paddle1" (for them), opponent's is "paddle2"
    //         setPaddle1Y(data.paddle2Y); // Reverse the paddles
    //         setPaddle2Y(data.paddle1Y);
    //     }
    // });

    return () => {
        socket.off("gameState");
        socket.off("playerMoveUpdate");
    };
}, [socket, playerNumber]);

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