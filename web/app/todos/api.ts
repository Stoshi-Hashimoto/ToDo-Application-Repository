/**
 * このファイルは、ToDoアプリケーションのフロントエンドにおいて、APIとの通信を担当する関数を定義しています。
 * これらの関数は、ToDoアイテムの取得、作成、更新、削除などの操作を行うために使用されます。
 * APIとの通信には、Fetch APIを使用しており、認証情報の管理やエラーハンドリングも含まれています。
 */
import type { Todo, TodosResponse } from "./types";

/// 認証ヘッダーを取得する関数
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

// APIレスポンスをJSONとして解析し、エラーハンドリングを行う関数
const parseJsonResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// ToDoアイテムの一覧を取得するAPI関数
export const fetchTodosApi = async (): Promise<Todo[]> => {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/todos`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data: TodosResponse = await parseJsonResponse(response);

  return (data.todos || []).filter((todo) => !todo.deleted_at);
};

// ToDoアイテムを作成するAPI関数
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

// ToDoアイテムを更新するAPI関数
export const updateTodoApi = async (
  todoId: string,
  params: {
    title: string;
    description: string | null;
    dueAt: string;
    status: string;
  },
) => {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/todos/${todoId}`, {
    method: "PUT",
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

// ToDoアイテムを削除するAPI関数
export const deleteTodoApi = async (todoId: string) => {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/todos/${todoId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return parseJsonResponse(response);
};
