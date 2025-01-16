import { useState } from "react";

type UseShrinkPaddleReturn = {
  shrinkPaddle: (player: number) => void;
  isPaddleShrunk1: boolean;
  isPaddleShrunk2: boolean;
};

export const useShrinkPaddle = (
  paddleHeightBase: number,
  setPaddleHeight1: (height: number) => void,
  setPaddleHeight2: (height: number) => void
): UseShrinkPaddleReturn => {
  const [isPaddleShrunk1, setIsPaddleShrunk1] = useState(false);
  const [isPaddleShrunk2, setIsPaddleShrunk2] = useState(false);

  const shrinkPaddle = (player: number) => {
    const shrinkFactor = 0.5; // Shrink to 50% of original height
    const shrinkDuration = 5000; // Duration of shrink effect in milliseconds

    if (player === 1 && !isPaddleShrunk1) {
      console.log("Shrinking Player 1's paddle."); // Debug log
      setIsPaddleShrunk1(true);
      setPaddleHeight1(paddleHeightBase * shrinkFactor);

      setTimeout(() => {
        console.log("Reverting Player 1's paddle size."); // Debug log
        setIsPaddleShrunk1(false);
        setPaddleHeight1(paddleHeightBase);
      }, shrinkDuration);
    } else if (player === 2 && !isPaddleShrunk2) {
      console.log("Shrinking Player 2's paddle."); // Debug log
      setIsPaddleShrunk2(true);
      setPaddleHeight2(paddleHeightBase * shrinkFactor);

      setTimeout(() => {
        console.log("Reverting Player 2's paddle size."); // Debug log
        setIsPaddleShrunk2(false);
        setPaddleHeight2(paddleHeightBase);
      }, shrinkDuration);
    } else {
      console.log(
        `Player ${player}'s paddle is already shrunk or invalid player ID.`
      ); // Debug log for invalid or duplicate shrink calls
    }
  };

  return { shrinkPaddle, isPaddleShrunk1, isPaddleShrunk2 };
};
