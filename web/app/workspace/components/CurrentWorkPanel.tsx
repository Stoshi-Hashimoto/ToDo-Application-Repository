/**
 * CurrentWorkPanel.tsx
 * - 現在の作業内容、経過時間、ステータスを表示
 * - 作業の開始・一時停止・終了・メモ記入の操作を提供
 * - タスクが選択されていない場合は、操作を無効化してユーザーに知らせる
 * - タイマーはリアルタイムで更新され、ユーザーが作業時間を把握できるようにする
 */

import type { Task } from "../types";
import { formatTime, getStatusLabel } from "../utils";

// コンポーネントのプロパティの型定義
type Props = {
  styles: { [key: string]: string };
  selectedTask: Task | null;
  isWorking: boolean;
  elapsedSeconds: number;
  onStart: () => void;
  onPause: () => void;
  onEnd: () => void;
  onOpenMemoModal: () => void;
};

// 現在の作業パネルコンポーネント
export default function CurrentWorkPanel({
  styles,
  selectedTask,
  isWorking,
  elapsedSeconds,
  onStart,
  onPause,
  onEnd,
  onOpenMemoModal,
}: Props) {
  return (
    <div className={styles.currentTaskArea}>
      <div className={styles.currentTaskInfo}>
        <p className={styles.sectionLabel}>現在の作業</p>
        <h1>{selectedTask?.title ?? "タスクがありません"}</h1>

        <div className={styles.currentTaskMeta}>
          <span>期限 {selectedTask?.dueTime ?? "--:--"}</span>
        </div>
      </div>

      <div className={styles.timerAndActions}>
        <div className={styles.stopwatchArea}>
          <div className={styles.stopwatchTopButton} />
          <div className={styles.stopwatchSideButton} />

          <div className={styles.stopwatchCircle}>
            <div className={styles.elapsedLabel}>🕒 経過時間</div>

            <div className={styles.timeDisplay}>
              {formatTime(elapsedSeconds)}
            </div>

            <div className={styles.timeLabels}>
              <span>時</span>
              <span>分</span>
              <span>秒</span>
            </div>
          </div>
        </div>

        <div className={styles.actionArea}>
          <div className={styles.statusBox}>
            <span>ステータス</span>
            <strong>
              ● {selectedTask ? getStatusLabel(selectedTask.status) : "なし"}
            </strong>
          </div>

          {!isWorking ? (
            <button
              type="button"
              className={`${styles.mainActionButton} ${styles.startButton}`}
              onClick={onStart}
              disabled={!selectedTask}
            >
              ▶ 作業開始
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.mainActionButton} ${styles.pauseButton}`}
              onClick={onPause}
            >
              Ⅱ 一時停止
            </button>
          )}

          <button
            type="button"
            className={`${styles.mainActionButton} ${styles.endButton}`}
            onClick={onEnd}
            disabled={!selectedTask || !isWorking}
          >
            ■ 作業終了
          </button>

          <button
            type="button"
            className={`${styles.mainActionButton} ${styles.resetButton}`}
            onClick={onOpenMemoModal}
            disabled={!selectedTask}
          >
            📝 作業メモ
          </button>
        </div>
      </div>
    </div>
  );
}
