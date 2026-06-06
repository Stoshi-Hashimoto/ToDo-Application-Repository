/**
 * 作業時間を管理するカスタムフック
 * - isWorking: 作業中かどうかの状態
 * - elapsedSeconds: 経過時間（秒）
 */
import { useEffect, useRef, useState } from "react";

// 作業時間を管理するカスタムフック
export const useWorkTimer = () => {
  const [isWorking, setIsWorking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isWorking) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isWorking]);

  const startTimer = (initialSeconds = 0) => {
    setElapsedSeconds(initialSeconds);
    setIsWorking(true);
  };

  const pauseTimer = () => {
    setIsWorking(false);
  };

  const stopTimer = () => {
    setIsWorking(false);
  };

  const resetTimer = () => {
    setIsWorking(false);
    setElapsedSeconds(0);
  };

  return {
    isWorking,
    elapsedSeconds,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
  };
};
