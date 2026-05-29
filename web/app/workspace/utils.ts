/**
 * workspace/utils.ts
 * タスク管理アプリのワークスペース機能に関連するユーティリティ関数を提供するモジュール
 * - 日付のフォーマットやタスクの状態表示など、ワークスペース内で共通して使用される関数を定義
 * - これらの関数は、タスクの表示や操作を簡素化し、コードの再利用性を高めるために使用される
 * - 例: 今日の日付をフォーマットする関数、タスクの状態を日本語で表示する関数など
 * **
 */
import type { TaskStatus, TodoApiResponse, Task } from "./types";

// 今日の日付を「YYYY年MM月DD日（曜日）」の形式で返す関数
export const getTodayText = () => {
  const now = new Date();
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const weekDay = weekDays[now.getDay()];

  return `${year}年${month}月${day}日（${weekDay}）`;
};

// 秒数を「HH:MM:SS」の形式で返す関数
export const formatTime = (seconds: number) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
};

// タスクの状態を日本語で返す関数
export const getStatusLabel = (status: TaskStatus) => {
  if (status === "NOT_STARTED") return "未着手";
  if (status === "IN_PROGRESS") return "作業中";
  return "完了";
};

// タスクの期限が今日かどうかを判定する関数
export const isTodayTodo = (dueAt: string | null) => {
  if (!dueAt) return false;

  const dueDate = new Date(dueAt);
  const now = new Date();

  return (
    dueDate.getFullYear() === now.getFullYear() &&
    dueDate.getMonth() === now.getMonth() &&
    dueDate.getDate() === now.getDate()
  );
};

// APIから取得したタスクデータを、フロントエンドで使用するTask型に変換する関数
export const mapTodoToTask = (todo: TodoApiResponse): Task => {
  return {
    id: String(todo.id),
    title: todo.title,
    status: todo.status,
    dueAt: todo.due_at
      ? new Date(todo.due_at).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "----/--/--",
    dueTime: todo.due_at
      ? new Date(todo.due_at).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "--:--",
    description: todo.description || "",
  };
};
