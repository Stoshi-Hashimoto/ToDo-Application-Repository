/**
 * 作業履歴リストのコンポーネント
 * - histories: 作業履歴の配列
 * - styles: CSSモジュールのスタイルオブジェクト
 */
import { useMemo, useState } from "react";
import type { WorkHistory } from "../types";

// 作業時間を秒に変換するための関数と、秒を"HH:MM:SS"形式に変換する関数を定義
type Props = {
  styles: { [key: string]: string };
  histories: WorkHistory[];
};

// "HH:MM"形式の時間を秒に変換する関数
const parseTimeToSeconds = (time: string) => {
  const [hour, minute] = time.split(":").map((value) => Number(value));
  return (
    (Number.isFinite(hour) ? hour : 0) * 3600 +
    (Number.isFinite(minute) ? minute : 0) * 60
  );
};

// 秒を"HH:MM:SS"形式に変換する関数
const formatSecondsToTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
};

// 作業履歴リストコンポーネント
export default function WorkHistoryList({ styles, histories }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const totalWorkTime = useMemo(() => {
    const totalSeconds = histories.reduce((acc, history) => {
      const startSeconds = parseTimeToSeconds(history.startTime);
      const endSeconds = parseTimeToSeconds(history.endTime);
      return acc + Math.max(endSeconds - startSeconds, 0);
    }, 0);

    return formatSecondsToTime(totalSeconds);
  }, [histories]);

  const recentHistories = histories.slice(0, 2);

  return (
    <>
      <div className={styles.historyPanel}>
        <div className={styles.historyHeader}>
          <h2>今月の作業履歴</h2>
          <button type="button" onClick={() => setIsModalOpen(true)}>
            すべて見る →
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>タスク名</th>
              <th>作業時間</th>
              <th>開始時間</th>
              <th>終了時間</th>
              <th>メモ</th>
            </tr>
          </thead>
          <tbody>
            {recentHistories.map((history, index) => (
              <tr key={`${history.id}-${index}`}>
                <td>{history.taskName}</td>
                <td>{history.workTime}</td>
                <td>{history.startTime}</td>
                <td>{history.endTime}</td>
                <td>{history.memo}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className={styles.totalTime}>合計作業時間：{totalWorkTime}</p>
      </div>

      {isModalOpen && (
        <div
          className={styles.historyModalOverlay}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className={styles.historyModalContent}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.historyModalHeader}>
              <h2>今月の作業履歴</h2>

              <button
                type="button"
                className={styles.historyModalCloseButton}
                onClick={() => setIsModalOpen(false)}
              >
                閉じる
              </button>
            </div>

            <div className={styles.historyModalBody}>
              <table className={styles.historyModalTable}>
                <thead>
                  <tr>
                    <th>タスク名</th>
                    <th>作業時間</th>
                    <th>開始時間</th>
                    <th>終了時間</th>
                    <th>メモ</th>
                  </tr>
                </thead>
                <tbody>
                  {histories.map((history, index) => (
                    <tr key={`history-modal-${history.id}-${index}`}>
                      <td>{history.taskName}</td>
                      <td>{history.workTime}</td>
                      <td>{history.startTime}</td>
                      <td>{history.endTime}</td>
                      <td>{history.memo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
