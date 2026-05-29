/**
 * todosアプリケーションのユーティリティ関数をまとめたファイル
 * カレンダーの生成、日付のフォーマット、ステータスの表示など、todosアプリケーション全体で使用される共通のロジックを提供
 */
import type { CalendarCell, Todo } from "./types";

// 曜日ラベル
export const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
export const JST_TIME_ZONE = "Asia/Tokyo";

// カレンダーを生成する関数
export function buildMonthCalendar(baseDate: Date): CalendarCell[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay();
  const calendarStartDate = new Date(year, month, 1 - startDay);

  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i++) {
    const date = new Date(
      calendarStartDate.getFullYear(),
      calendarStartDate.getMonth(),
      calendarStartDate.getDate() + i,
    );

    cells.push({
      date,
      isCurrentMonth: date.getMonth() === month,
    });
  }

  return cells;
}

// 日付文字列をJSTの年月日形式のキーに変換する関数
export function toJstDateKey(dateString: string): string {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date(dateString));
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

// DateオブジェクトをJSTの年月日形式のキーに変換する関数
export function formatDateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 日付を年月形式のラベルに変換する関数
export function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

// 日付を年月日形式のラベルに変換する関数
export function formatMonthDayLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 期限日時をJSTの時間表記に変換する関数
export function formatDueTime(dueAt: string | null): string {
  if (!dueAt) return "時刻未設定";

  const date = new Date(dueAt);

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

// ステータスを日本語のラベルに変換する関数
export function formatStatusLabel(status: string): string {
  switch (status) {
    case "NOT_STARTED":
      return "未着手";
    case "IN_PROGRESS":
      return "進行中";
    case "COMPLETED":
      return "完了";
    default:
      return status;
  }
}

// 2つの日付が同じ年月日かどうかを判定する関数
export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ToDoアイテムからツールチップ用の文字列を生成する関数
export function buildTooltip(todo: Todo): string {
  return [
    `タイトル: ${todo.title}`,
    `説明: ${todo.description || "なし"}`,
    `期限: ${todo.due_at || "なし"}`,
    `ステータス: ${formatStatusLabel(todo.status)}`,
  ].join("\n");
}

// Dateオブジェクトをdatetime-local形式の文字列に変換する関数
export function toDatetimeLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}T09:00`;
}

// ToDoアイテムを期限日ごとにグループ化する関数
export function groupTodosByDate(todos: Todo[]): Record<string, Todo[]> {
  const grouped: Record<string, Todo[]> = {};

  for (const todo of todos) {
    if (!todo.due_at) continue;

    const key = toJstDateKey(todo.due_at);

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(todo);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => {
      const aTime = a.due_at ? new Date(a.due_at).getTime() : 0;
      const bTime = b.due_at ? new Date(b.due_at).getTime() : 0;

      return aTime - bTime;
    });
  }

  return grouped;
}
