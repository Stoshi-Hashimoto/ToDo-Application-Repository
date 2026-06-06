/**
 * workspace/api.ts
 * タスク管理アプリのワークスペース機能に関連するAPI呼び出しを提供するモジュール
 * - タスクの取得、作成、更新、削除など、ワークスペース内で必要なAPIエンドポイントへのリクエストを定義
 */
import type {
  TodoApiResponse,
  WorkHistoryApiResponse,
  ActiveWorkSession,
} from "./types";

// API呼び出しに必要な共通のヘッダーを取得する関数
const getAuthHeaders = () => {
  const idToken = localStorage.getItem("id_token");

  if (!idToken) {
    throw new Error("ログイン情報が見つかりません。");
  }

  return {
    Authorization: `Bearer ${idToken}`,
    "Content-Type": "application/json",
  };
};

// APIのベースURLを取得する関数
const getApiBase = () => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  if (!apiBase) {
    throw new Error("NEXT_PUBLIC_API_BASE が設定されていません。");
  }

  return apiBase;
};

// APIレスポンスをJSONとして解析し、エラーハンドリングも行う共通関数
const parseJsonResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// タスクの一覧を取得するAPI呼び出し
export const fetchTodosApi = async (): Promise<TodoApiResponse[]> => {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/todos`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data = await parseJsonResponse(response);

  return data.todos || [];
};

export const fetchActiveWorkSessionApi = async (): Promise<{
  activeSession: ActiveWorkSession | null;
}> => {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/todo-work-sessions/activeCheck`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return parseJsonResponse(response);
};

// タスクを作成するAPI呼び出し
export const createTodoApi = async (params: {
  title: string;
  description: string | null;
  dueAt: string;
  status: string;
}) => {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/todos`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title: params.title,
      description: params.description,
      due_at: params.dueAt,
      status: params.status,
    }),
  });

  return parseJsonResponse(response);
};

// タスクを更新するAPI呼び出し
export const startWorkSessionApi = async (todoId: number) => {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/todo-work-sessions/start`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      todo_id: todoId,
    }),
  });

  return parseJsonResponse(response);
};

// タスクの作業セッションを終了するAPI呼び出し
export const endWorkSessionApi = async (todoId: number) => {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/todo-work-sessions/end`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      todo_id: todoId,
    }),
  });

  return parseJsonResponse(response);
};

// ワークメモを保存するAPI呼び出し
export const saveWorkMemoApi = async (params: {
  workSessionId: number;
  note: string;
}) => {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/todo-work-notes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      work_session_id: params.workSessionId,
      note: params.note,
    }),
  });

  return parseJsonResponse(response);
};

// ワーク履歴を取得するAPI呼び出し
export const fetchWorkHistoriesApi = async (): Promise<
  WorkHistoryApiResponse[]
> => {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/todo-work-sessions`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data = await parseJsonResponse(response);

  return data.work_histories || [];
};
