/**
 * このファイルは、作業スペースページで使用される全ての型定義を含んでいます。
 */
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

// タスクの型定義
export type Task = {
  id: string;
  title: string;
  dueTime: string;
  dueAt: string | null;
  status: TaskStatus;
  description: string | null;
};

// 作業履歴の型定義
export type WorkHistory = {
  id: number;
  taskName: string;
  workTime: string;
  startTime: string;
  endTime: string;
  durationSeconds: number | null;
  memo: string;
};

// APIレスポンスの型定義
export type WorkHistoryApiResponse = {
  id: number;
  task_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  memo: string;
};

// タスクAPIレスポンスの型定義
export type TodoApiResponse = {
  id: number;
  title: string;
  description: string | null;
  due_at: string | null;
  status: TaskStatus;
  deleted_at?: string | null;
};

// 作業中のタスクを取得する型定義
export type ActiveWorkSession = {
  work_session_id: number;
  todo_id: number;
  started_at: string;
  title: string;
};

export type FilterStatus = "ALL" | TaskStatus;
