"use client";

import { useEffect, useMemo, useState } from "react";

// TODO: API からのレスポンスオブジェクト
type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// TODO: API レスポンス全体の型
type TodosResponse = {
  message: string;
  todos: Todo[];
};

// カレンダーセルの情報
type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

// 曜日ラベルと JST タイムゾーン定数
const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const JST_TIME_ZONE = "Asia/Tokyo";

// カレンダーページのコンポーネント
export default function TodosPage() {
  const [message, setMessage] = useState("読み込み中...");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorDetail, setErrorDetail] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // コンポーネントマウント時に API から Todo を取得
  useEffect(() => {
    // API から Todo を取得する関数
    const fetchTodos = async () => {
      // ローカルストレージから ID トークンを取得し、API ベース URL を環境変数から取得
      const idToken = localStorage.getItem("id_token");
      const apiBase = process.env.NEXT_PUBLIC_API_BASE;

      // ID トークンがない場合はエラーメッセージを表示して終了
      if (!idToken) {
        setMessage("ログイン情報が見つかりません。");
        setErrorDetail("先にログインしてください。");
        return;
      }

      // API ベース URL がない場合はエラーメッセージを表示して終了
      if (!apiBase) {
        setMessage("環境変数が設定されていません。");
        setErrorDetail("NEXT_PUBLIC_API_BASE を確認してください。");
        return;
      }

      try {
        // API にリクエストを送信して Todo を取得
        const response = await fetch(`${apiBase}/todos`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        // レスポンスを JSON としてパース
        const data: TodosResponse = await response.json();

        // レスポンスが OK でない場合はエラーをスロー
        if (!response.ok) {
          throw new Error(
            data.message || `HTTP error! status: ${response.status}`,
          );
        }

        // 削除されていない Todo のみをフィルタリングして状態に保存
        const activeTodos = (data.todos || []).filter(
          (todo) => !todo.deleted_at,
        );

        // フィルタリングされた Todo を状態に保存し、成功メッセージを表示
        setTodos(activeTodos);
        setMessage(data.message || "todos fetched");
      } catch (err) {
        console.error("fetch todos failed:", err);
        setMessage("Todoの取得に失敗しました。");
        setErrorDetail(
          err instanceof Error ? err.message : "不明なエラーが発生しました。",
        );
      }
    };

    // Todo を取得する関数を呼び出す
    fetchTodos();
  }, []);

  // currentMonth が変更されたときにカレンダーセルを再計算
  const calendarCells = useMemo(() => {
    return buildMonthCalendar(currentMonth);
  }, [currentMonth]);

  // todos が変更されたときに日付ごとに Todo をグループ化
  const todosByDate = useMemo(() => {
    const grouped: Record<string, Todo[]> = {};

    // 各 Todo をループして、due_at を JST の YYYY-MM-DD に変換してグループ化
    for (const todo of todos) {
      if (!todo.due_at) continue;

      const key = toJstDateKey(todo.due_at);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(todo);
    }

    // グループ化された各日付の Todo を due_at の昇順でソート
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => {
        const aTime = a.due_at ? new Date(a.due_at).getTime() : 0;
        const bTime = b.due_at ? new Date(b.due_at).getTime() : 0;
        return aTime - bTime;
      });
    }

    // グループ化された Todo を返す
    return grouped;
  }, [todos]);

  // currentMonth を JST の YYYY-MM 形式のラベルに変換
  const monthLabel = formatMonthLabel(currentMonth);

  // 月移動関数（diff は月の増減、例: -1 で前月、1 で次月）
  const moveMonth = (diff: number) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + diff, 1),
    );
  };

  // 今日の月に移動する関数
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // レンダリング
  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <h1 className="page-title">Todoカレンダー</h1>
          <p className="page-subtitle">期限日ごとにタスクを月間表示します</p>
        </div>

        <div className="status-area">
          <span className="status-message">{message}</span>
        </div>
      </header>

      {errorDetail && <pre className="error-box">{errorDetail}</pre>}

      <section className="toolbar">
        <div className="toolbar-left">
          <button onClick={goToToday} className="toolbar-button secondary">
            今日
          </button>
          <button
            onClick={() => moveMonth(-1)}
            className="toolbar-button icon-button"
            aria-label="前の月"
          >
            ‹
          </button>
          <button
            onClick={() => moveMonth(1)}
            className="toolbar-button icon-button"
            aria-label="次の月"
          >
            ›
          </button>
          <h2 className="month-label">{monthLabel}</h2>
        </div>
      </section>

      <section className="calendar-wrapper">
        <div className="week-header">
          {WEEK_LABELS.map((label) => (
            <div key={label} className="week-cell">
              {label}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarCells.map((cell) => {
            const dateKey = formatDateKeyFromDate(cell.date);
            const dayTodos = todosByDate[dateKey] || [];
            const isToday = isSameDate(cell.date, new Date());

            return (
              <div
                key={dateKey}
                className={`date-cell ${cell.isCurrentMonth ? "" : "other-month"}`}
              >
                <div className="date-cell-header">
                  <span className={`date-number ${isToday ? "today" : ""}`}>
                    {cell.date.getDate()}
                  </span>
                </div>

                <div className="todo-list">
                  {dayTodos.length === 0
                    ? null
                    : dayTodos.map((todo) => (
                        <article
                          key={todo.id}
                          className="todo-card"
                          title={buildTooltip(todo)}
                        >
                          <div className="todo-time">
                            {formatDueTime(todo.due_at)}
                          </div>
                          <div className="todo-title">{todo.title}</div>
                          <div
                            className={`todo-status ${getStatusClassName(todo.status)}`}
                          >
                            {formatStatusLabel(todo.status)}
                          </div>
                        </article>
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style jsx>{`
        .calendar-page {
          min-height: 100vh;
          background: #0f1115;
          color: #f5f7fa;
          padding: 24px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .page-title {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }

        .page-subtitle {
          margin: 8px 0 0;
          color: #9aa4b2;
          font-size: 14px;
        }

        .status-area {
          display: flex;
          align-items: center;
        }

        .status-message {
          font-size: 13px;
          color: #b9c2cf;
          background: #171b22;
          border: 1px solid #293241;
          border-radius: 999px;
          padding: 8px 12px;
        }

        .error-box {
          margin: 0 0 16px;
          padding: 12px;
          background: #2a1115;
          color: #ffb4b4;
          border: 1px solid #7a2833;
          border-radius: 8px;
          white-space: pre-wrap;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .toolbar-button {
          border: 1px solid #2b3542;
          background: #171b22;
          color: #f5f7fa;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          cursor: pointer;
        }

        .toolbar-button:hover {
          background: #1d2330;
        }

        .toolbar-button.secondary {
          font-weight: 600;
        }

        .icon-button {
          width: 40px;
          padding: 10px 0;
          font-size: 18px;
          line-height: 1;
        }

        .month-label {
          margin: 0 0 0 8px;
          font-size: 24px;
          font-weight: 700;
        }

        .calendar-wrapper {
          border: 1px solid #293241;
          border-radius: 20px;
          overflow: hidden;
          background: #11151b;
        }

        .week-header {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          background: #151a21;
          border-bottom: 1px solid #293241;
        }

        .week-cell {
          padding: 12px;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: #aab4c3;
          border-right: 1px solid #293241;
        }

        .week-cell:last-child {
          border-right: none;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
        }

        .date-cell {
          min-height: 140px;
          border-right: 1px solid #293241;
          border-bottom: 1px solid #293241;
          padding: 8px;
          display: flex;
          flex-direction: column;
          background: #0f1319;
        }

        .date-cell:nth-child(7n) {
          border-right: none;
        }

        .date-cell-header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          min-height: 28px;
          margin-bottom: 8px;
        }

        .date-number {
          display: inline-flex;
          width: 28px;
          height: 28px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          color: #d7deea;
        }

        .date-number.today {
          background: #8ab4f8;
          color: #0f1115;
        }

        .other-month {
          background: #0b0e13;
        }

        .other-month .date-number {
          color: #667285;
        }

        .todo-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: hidden;
        }

        .todo-card {
          background: #1a2330;
          border-left: 4px solid #4c8bf5;
          border-radius: 8px;
          padding: 8px;
          overflow: hidden;
        }

        .todo-time {
          font-size: 12px;
          color: #9fc1ff;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .todo-title {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.4;
          color: #f5f7fa;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .todo-status {
          margin-top: 6px;
          display: inline-block;
          width: fit-content;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
        }

        .status-not-started {
          background: #27364a;
          color: #9fc1ff;
        }

        .status-in-progress {
          background: #4a391d;
          color: #ffd37a;
        }

        .status-completed {
          background: #1f4230;
          color: #8fe3ae;
        }

        .status-other {
          background: #343946;
          color: #d0d7e2;
        }

        @media (max-width: 1100px) {
          .date-cell {
            min-height: 120px;
          }
        }

        @media (max-width: 900px) {
          .calendar-page {
            padding: 16px;
          }

          .month-label {
            font-size: 20px;
          }

          .date-cell {
            min-height: 110px;
            padding: 6px;
          }

          .todo-title {
            font-size: 12px;
          }
        }

        @media (max-width: 720px) {
          .calendar-wrapper {
            overflow-x: auto;
          }

          .week-header,
          .calendar-grid {
            min-width: 900px;
          }
        }
      `}</style>
    </main>
  );
}

/**
 * 対象月の月間カレンダー（6週分 = 42マス）を作成
 */
function buildMonthCalendar(baseDate: Date): CalendarCell[] {
  // 対象月の年と月を取得
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  // 対象月の1日を作成し、その曜日を取得
  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay();

  // カレンダーの開始日を計算（対象月の1日からその曜日分だけ前に遡る）
  const calendarStartDate = new Date(year, month, 1 - startDay);

  // 42マス分の日付を生成し、対象月かどうかのフラグを設定して配列に追加
  const cells: CalendarCell[] = [];

  // 6週分 = 42マスをループして日付を生成
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

/**
 * due_at を JST の YYYY-MM-DD に変換
 */
function toJstDateKey(dateString: string): string {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // フォーマットされた日付のパーツを取得して、年、月、日を抽出
  const parts = formatter.formatToParts(new Date(dateString));
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

/**
 * Date からローカル日付ベースの YYYY-MM-DD を作成
 * カレンダーセル側はブラウザ日付で十分
 */
function formatDateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 月ラベルをフォーマット
 * @param date
 * @returns
 */
function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

/**
 * 期限時刻をフォーマット
 * @param dueAt
 * @returns
 */
function formatDueTime(dueAt: string | null): string {
  if (!dueAt) return "時刻未設定";

  const date = new Date(dueAt);

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * ステータスラベルをフォーマット
 * @param status
 * @returns
 */
function formatStatusLabel(status: string): string {
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

/**
 * ステータスに応じた CSS クラス名を取得
 * @param status
 * @returns
 */
function getStatusClassName(status: string): string {
  switch (status) {
    case "NOT_STARTED":
      return "status-not-started";
    case "IN_PROGRESS":
      return "status-in-progress";
    case "COMPLETED":
      return "status-completed";
    default:
      return "status-other";
  }
}

/**
 * 2つの日付が同じ日付かどうかを判定
 * @param a
 * @param b
 * @returns
 */
function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * TODO のツールチップテキストを生成
 * @param todo
 * @returns
 */
function buildTooltip(todo: Todo): string {
  return [
    `タイトル: ${todo.title}`,
    `説明: ${todo.description || "なし"}`,
    `期限: ${todo.due_at || "なし"}`,
    `ステータス: ${formatStatusLabel(todo.status)}`,
  ].join("\n");
}
