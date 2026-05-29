/**
 * このファイルは、ToDoアプリケーションのフロントエンドにおいて、ToDoアイテムのデータ構造やAPIレスポンスの型定義を行うためのものです。
 */
export type TodoStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

// ToDoアイテムの型定義
export type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  status: TodoStatus | string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// APIレスポンスの型定義
export type TodosResponse = {
  message: string;
  todos: Todo[];
};

// カレンダーセルの型定義
export type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

export type ModalTab = "list" | "create";
