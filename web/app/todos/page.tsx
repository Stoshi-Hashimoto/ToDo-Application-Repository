"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

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

type TodosResponse = {
  message: string;
  todos: Todo[];
};

type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const JST_TIME_ZONE = "Asia/Tokyo";

export default function TodosPage() {
  const [message, setMessage] = useState("読み込み中...");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorDetail, setErrorDetail] = useState("");

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // モーダル関連
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalTab, setModalTab] = useState<"list" | "create">("create");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  // 入力フォーム関連
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueAt, setFormDueAt] = useState("");
  const [formStatus, setFormStatus] = useState("NOT_STARTED");

  // 登録処理関連
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Todo 一覧取得
  const fetchTodos = async () => {
    const idToken = localStorage.getItem("id_token");
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;

    if (!idToken) {
      setMessage("ログイン情報が見つかりません。");
      setErrorDetail("先にログインしてください。");
      return;
    }

    if (!apiBase) {
      setMessage("環境変数が設定されていません。");
      setErrorDetail("NEXT_PUBLIC_API_BASE を確認してください。");
      return;
    }

    try {
      setErrorDetail("");

      const response = await fetch(`${apiBase}/todos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data: TodosResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      const activeTodos = (data.todos || []).filter((todo) => !todo.deleted_at);

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

  useEffect(() => {
    fetchTodos();
  }, []);

  const calendarCells = useMemo(() => {
    return buildMonthCalendar(currentMonth);
  }, [currentMonth]);

  const todosByDate = useMemo(() => {
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
  }, [todos]);

  const monthLabel = formatMonthLabel(currentMonth);

  const moveMonth = (diff: number) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + diff, 1),
    );
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // 日付セルクリック時にモーダルを開く
  const openCreateModal = (date: Date) => {
    setSelectedDate(date);
    setFormTitle("");
    setFormDescription("");
    setFormDueAt(toDatetimeLocalString(date));
    setFormStatus("NOT_STARTED");
    setSubmitError("");
    setEditingTodoId(null);
    setModalTab("create");
    setIsModalOpen(true);
  };

  const openEditModal = (todo: Todo) => {
    setSelectedDate(todo.due_at ? new Date(todo.due_at) : null);
    setFormTitle(todo.title);
    setFormDescription(todo.description || "");
    setFormDueAt(todo.due_at ? todo.due_at.substring(0, 16) : "");
    setFormStatus(todo.status || "NOT_STARTED");
    setSubmitError("");
    setEditingTodoId(todo.id);
    setModalTab("create");
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeCreateModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setFormTitle("");
    setFormDescription("");
    setFormDueAt("");
    setFormStatus("NOT_STARTED");
    setSubmitError("");
    setModalTab("create");
    setEditingTodoId(null);
  };

  // Todo 登録
  const handleCreateTodo = async () => {
    const idToken = localStorage.getItem("id_token");
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;

    if (!idToken) {
      setSubmitError("ログイン情報が見つかりません。");
      return;
    }

    if (!apiBase) {
      setSubmitError("NEXT_PUBLIC_API_BASE が設定されていません。");
      return;
    }

    if (!formTitle.trim()) {
      setSubmitError("タイトルは必須です。");
      return;
    }

    if (!formDueAt) {
      setSubmitError("期限日時は必須です。");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const endpoint = editingTodoId
        ? `${apiBase}/todos/${editingTodoId}`
        : `${apiBase}/todos`;
      const method = editingTodoId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          due_at: formDueAt,
          status: formStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      setMessage(
        data.message || (editingTodoId ? "Todoを更新しました。" : "Todoを登録しました。"),
      );
      closeCreateModal();
      await fetchTodos();
    } catch (err) {
      console.error("create todo failed:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Todoの登録に失敗しました。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    openEditModal(todo);
  };

  const handleDeleteTodo = async (todo: Todo) => {
    if (!window.confirm("このタスクを削除してもよろしいですか？")) {
      return;
    }

    const idToken = localStorage.getItem("id_token");
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;

    if (!idToken) {
      setMessage("ログイン情報が見つかりません。");
      return;
    }

    if (!apiBase) {
      setMessage("NEXT_PUBLIC_API_BASE が設定されていません。");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/todos/${todo.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      setMessage(data.message || "Todoを削除しました。");
      await fetchTodos();
    } catch (err) {
      console.error("delete todo failed:", err);
      setMessage(
        err instanceof Error ? err.message : "Todoの削除に失敗しました。",
      );
    }
  };

  return (
    <main className={styles.calendarPage}>
      {/* <header className={styles.calendarHeader}>
        <div>
          <h1 className={styles.pageTitle}>Todoカレンダー</h1>
          <p className={styles.pageSubtitle}>
            期限日ごとにタスクを月間表示します
          </p>
        </div>

        <div className={styles.statusArea}>
          <span className={styles.statusMessage}>{message}</span>
        </div>
      </header> */}

      {errorDetail && <pre className={styles.errorBox}>{errorDetail}</pre>}

      <section className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            onClick={goToToday}
            className={styles.toolbarButton + " " + styles.secondary}
          >
            今日
          </button>
          <button
            onClick={() => moveMonth(-1)}
            className={styles.toolbarButton + " " + styles.iconButton}
            aria-label="前の月"
          >
            ‹
          </button>
          <button
            onClick={() => moveMonth(1)}
            className={styles.toolbarButton + " " + styles.iconButton}
            aria-label="次の月"
          >
            ›
          </button>
          <h2 className={styles.monthLabel}>{monthLabel}</h2>
        </div>
      </section>

      <section className={styles.calendarWrapper}>
        <div className={styles.weekHeader}>
          {WEEK_LABELS.map((label) => (
            <div key={label} className={styles.weekCell}>
              {label}
            </div>
          ))}
        </div>

        <div className={styles.calendarGrid}>
          {calendarCells.map((cell) => {
            const dateKey = formatDateKeyFromDate(cell.date);
            const dayTodos = todosByDate[dateKey] || [];
            const isToday = isSameDate(cell.date, new Date());

            return (
              <div
                key={dateKey}
                className={`${styles.dateCell} ${cell.isCurrentMonth ? "" : styles.otherMonth}`}
                onClick={() => openCreateModal(cell.date)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    openCreateModal(cell.date);
                  }
                }}
              >
                <div className={styles.dateCellHeader}>
                  <span
                    className={`${styles.dateNumber} ${isToday ? styles.dateNumberToday : ""}`}
                  >
                    {cell.date.getDate()}
                  </span>
                </div>

                <div className={styles.todoList}>
                  {dayTodos.length === 0 ? null : (
                    <>
                      {dayTodos.slice(0, 1).map((todo) => (
                        <article
                          key={todo.id}
                          className={styles.todoCard}
                          title={buildTooltip(todo)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.todoTime}>
                            {formatDueTime(todo.due_at)}
                          </div>
                          <div className={styles.todoTitle}>{todo.title}</div>
                          <div
                            className={`${styles.todoStatus} ${getStatusClassName(todo.status)}`}
                          >
                            {formatStatusLabel(todo.status)}
                          </div>
                        </article>
                      ))}
                      {dayTodos.length > 1 && (
                        <div className={styles.moreTodos}>
                          他{dayTodos.length - 1}件
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeCreateModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>タスク管理</h3>

            {selectedDate && (
              <p className={styles.modalSubtitle}>
                選択日: {formatMonthDayLabel(selectedDate)}
              </p>
            )}

            {/* タブボタン */}
            <div className={styles.modalTabs}>
              <button
                className={`${styles.tabButton} ${modalTab === "list" ? styles.tabButtonActive : ""}`}
                onClick={() => setModalTab("list")}
              >
                タスク一覧
              </button>
              <button
                className={`${styles.tabButton} ${modalTab === "create" ? styles.tabButtonActive : ""}`}
                onClick={() => setModalTab("create")}
              >
                タスク登録
              </button>
            </div>

            {/* タスク一覧タブ */}
            {modalTab === "list" && selectedDate && (
              <div className={styles.tabContent}>
                {(() => {
                  const dateKey = formatDateKeyFromDate(selectedDate);
                  const dayTodos = todosByDate[dateKey] || [];

                  return (
                    <div className={styles.todoListContainer}>
                      {dayTodos.length === 0 ? (
                        <p className={styles.emptyMessage}>
                          この日付のタスクはありません
                        </p>
                      ) : (
                        <div className={styles.todoListItems}>
                          {dayTodos.map((todo) => (
                            <div key={todo.id} className={styles.todoListItem}>
                              <div className={styles.todoListItemHeader}>
                                <div className={styles.todoListItemMeta}>
                                  <div className={styles.todoListItemTime}>
                                    {formatDueTime(todo.due_at)}
                                  </div>
                                  <div
                                    className={`${styles.todoListItemStatus} ${getStatusClassName(todo.status)}`}
                                  >
                                    {formatStatusLabel(todo.status)}
                                  </div>
                                </div>
                                <div className={styles.todoListItemActions}>
                                  <button
                                    type="button"
                                    className={`${styles.actionButton} ${styles.editButton}`}
                                    onClick={() => handleEditTodo(todo)}
                                  >
                                    編集
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                    onClick={() => handleDeleteTodo(todo)}
                                  >
                                    削除
                                  </button>
                                </div>
                              </div>
                              <div className={styles.todoListItemTitle}>
                                {todo.title}
                              </div>
                              {todo.description && (
                                <div className={styles.todoListItemDescription}>
                                  {todo.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* タスク登録タブ */}
            {modalTab === "create" && (
              <div className={styles.tabContent}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="todo-title">
                    タイトル
                  </label>
                  <input
                    id="todo-title"
                    className={styles.formInput}
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="タイトルを入力"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    className={styles.formLabel}
                    htmlFor="todo-description"
                  >
                    説明
                  </label>
                  <textarea
                    id="todo-description"
                    className={styles.formTextarea}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="説明を入力"
                    rows={4}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="todo-dueAt">
                    期限日時
                  </label>
                  <input
                    id="todo-dueAt"
                    className={styles.formInput}
                    type="datetime-local"
                    value={formDueAt}
                    onChange={(e) => setFormDueAt(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="todo-status">
                    ステータス
                  </label>
                  <select
                    id="todo-status"
                    className={styles.formInput}
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="NOT_STARTED">未着手</option>
                    <option value="IN_PROGRESS">進行中</option>
                    <option value="COMPLETED">完了</option>
                  </select>
                </div>

                {submitError && (
                  <div className={styles.submitError}>{submitError}</div>
                )}
              </div>
            )}

            <div className={styles.modalActions}>
              {modalTab === "create" && (
                <button
                  className={`${styles.toolbarButton} ${styles.secondary}`}
                  onClick={handleCreateTodo}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "登録中..."
                    : editingTodoId
                    ? "更新"
                    : "登録"}
                </button>
              )}
              <button
                className={styles.toolbarButton}
                onClick={closeCreateModal}
                disabled={isSubmitting}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function buildMonthCalendar(baseDate: Date): CalendarCell[] {
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

function toJstDateKey(dateString: string): string {
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

function formatDateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatMonthDayLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDueTime(dueAt: string | null): string {
  if (!dueAt) return "時刻未設定";

  const date = new Date(dueAt);

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

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

function getStatusClassName(status: string): string {
  switch (status) {
    case "NOT_STARTED":
      return styles.statusNotStarted;
    case "IN_PROGRESS":
      return styles.statusInProgress;
    case "COMPLETED":
      return styles.statusCompleted;
    default:
      return styles.statusOther;
  }
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildTooltip(todo: Todo): string {
  return [
    `タイトル: ${todo.title}`,
    `説明: ${todo.description || "なし"}`,
    `期限: ${todo.due_at || "なし"}`,
    `ステータス: ${formatStatusLabel(todo.status)}`,
  ].join("\n");
}

// Date → input[type="datetime-local"] 用
function toDatetimeLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T09:00`;
}
