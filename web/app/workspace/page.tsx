"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

type Task = {
  id: string;
  title: string;
  dueTime: string;
  status: TaskStatus;
};

type WorkHistory = {
  id: number;
  taskName: string;
  workTime: string;
  startTime: string;
  endTime: string;
  memo: string;
};

const initialTasks: Task[] = [];

const initialHistories: WorkHistory[] = [
  {
    id: 1,
    taskName: "API Gateway確認",
    workTime: "01:15:30",
    startTime: "09:00",
    endTime: "10:15",
    memo: "APIの動作確認とドキュメント確認を実施",
  },
  {
    id: 2,
    taskName: "フロント画面実装",
    workTime: "02:05:45",
    startTime: "13:00",
    endTime: "15:05",
    memo: "Todo一覧画面の実装とスタイル調整",
  },
];

export default function WorkSpacePage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [memo, setMemo] = useState("");
  const [histories] = useState<WorkHistory[]>(initialHistories);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // モーダル関連
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"ALL" | TaskStatus>("ALL");

  // 入力フォーム関連
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueAt, setFormDueAt] = useState("");
  const [formStatus, setFormStatus] = useState("NOT_STARTED");

  // 登録処理関連
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedTask = useMemo(() => {
    return tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  }, [tasks, selectedTaskId]);

  const filteredTasks = useMemo(() => {
    if (filterStatus === "ALL") {
      return tasks;
    }

    return tasks.filter((task) => task.status === filterStatus);
  }, [tasks, filterStatus]);

  useEffect(() => {
    if (filteredTasks.length === 0) {
      setSelectedTaskId(null);
      return;
    }

    if (
      selectedTaskId === null ||
      !filteredTasks.some((task) => task.id === selectedTaskId)
    ) {
      setSelectedTaskId(filteredTasks[0].id);
    }
  }, [filteredTasks, selectedTaskId]);

  const isTodayTodo = (dueAt: string | null) => {
    if (!dueAt) {
      return false;
    }

    const dueDate = new Date(dueAt);
    const now = new Date();
    return (
      dueDate.getFullYear() === now.getFullYear() &&
      dueDate.getMonth() === now.getMonth() &&
      dueDate.getDate() === now.getDate()
    );
  };

  const fetchTodos = async () => {
    const idToken = localStorage.getItem("id_token");
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;

    if (!idToken) {
      setMessage("ログイン情報が見つかりません。");
      setLoading(false);
      return;
    }

    if (!apiBase) {
      setMessage("NEXT_PUBLIC_API_BASE が設定されていません。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("タスクを取得しています...");

      const response = await fetch(`${apiBase}/todos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      const activeTodos = (data.todos || []).filter(
        (todo: any) => !todo.deleted_at && isTodayTodo(todo.due_at),
      );

      const mappedTasks: Task[] = activeTodos.map((todo: any) => ({
        id: String(todo.id),
        title: todo.title,
        status: todo.status as TaskStatus,
        dueTime: todo.due_at
          ? new Date(todo.due_at).toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "--:--",
      }));

      setTasks(mappedTasks);
      setSelectedTaskId(mappedTasks[0]?.id ?? null);
      setMessage(
        mappedTasks.length
          ? "本日のタスクを取得しました。"
          : "本日のタスクはありません。",
      );
    } catch (err) {
      console.error("fetch todos failed:", err);
      setMessage(
        err instanceof Error ? err.message : "タスクの取得に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // モーダルを開く（タスク追加ボタンクリック時）
  const openCreateModal = () => {
    setFormTitle("");
    setFormDescription("");
    setFormDueAt("");
    setFormStatus("NOT_STARTED");
    setSubmitError("");
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeCreateModal = () => {
    setIsModalOpen(false);
    setFormTitle("");
    setFormDescription("");
    setFormDueAt("");
    setFormStatus("NOT_STARTED");
    setSubmitError("");
  };

  useEffect(() => {
    if (!isWorking) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isWorking]);

  const now = new Date();
  // 曜日一覧
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
  // 各値取得
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const weekDay = weekDays[now.getDay()];

  // 最終フォーマット
  const today = `${year}年${month}月${day}日（${weekDay}）`;

  const formatTime = (seconds: number) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");

    return `${h}:${m}:${s}`;
  };

  const getStatusLabel = (status: TaskStatus) => {
    if (status === "NOT_STARTED") return "未着手";
    if (status === "IN_PROGRESS") return "作業中";
    return "完了";
  };

  const getStatusClassName = (status: TaskStatus) => {
    if (status === "NOT_STARTED") return styles.notStarted;
    if (status === "IN_PROGRESS") return styles.inProgress;
    return styles.done;
  };

  const handleSelectTask = (taskId: string) => {
    if (isWorking) return;

    setSelectedTaskId(taskId);
    setElapsedSeconds(0);
    setMemo("");
  };

  const handleStart = () => {
    if (!selectedTask) return;
    setIsWorking(true);

    setTasks((prev) =>
      prev.map((task) =>
        task.id === selectedTask.id ? { ...task, status: "IN_PROGRESS" } : task,
      ),
    );
  };

  const handlePause = () => {
    setIsWorking(false);
  };

  const handleEnd = () => {
    if (!selectedTask) return;
    setIsWorking(false);

    setTasks((prev) =>
      prev.map((task) =>
        task.id === selectedTask.id ? { ...task, status: "DONE" } : task,
      ),
    );
  };

  const handleReset = () => {
    setIsWorking(false);
    setElapsedSeconds(0);
  };

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

      const endpoint = `${apiBase}/todos`;
      const method = "POST";

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

      setMessage(data.message || "Todoを登録しました。");
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

  return (
    <main className={styles.workspaceMain}>
      <div className={styles.workspaceLayout}>
        <section className={styles.taskPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>本日のタスク</h2>
              <p>{today}</p>
            </div>

            <button
              type="button"
              className={styles.addTaskButton}
              onClick={openCreateModal}
            >
              ＋ タスク追加
            </button>
          </div>

          <div className={styles.taskFilters}>
            <button
              type="button"
              className={filterStatus === "ALL" ? styles.active : ""}
              onClick={() => setFilterStatus("ALL")}
            >
              すべて
            </button>
            <button
              type="button"
              className={filterStatus === "NOT_STARTED" ? styles.active : ""}
              onClick={() => setFilterStatus("NOT_STARTED")}
            >
              未着手
            </button>
            <button
              type="button"
              className={filterStatus === "IN_PROGRESS" ? styles.active : ""}
              onClick={() => setFilterStatus("IN_PROGRESS")}
            >
              作業中
            </button>
            <button
              type="button"
              className={filterStatus === "DONE" ? styles.active : ""}
              onClick={() => setFilterStatus("DONE")}
            >
              完了
            </button>
          </div>

          <div className={styles.taskList}>
            {filteredTasks.map((task) => (
              <button
                type="button"
                key={task.id}
                className={`${styles.taskCard} ${
                  selectedTaskId === task.id ? styles.selected : ""
                }`}
                onClick={() => handleSelectTask(task.id)}
              >
                <div className={styles.taskCardTop}>
                  <span className={styles.taskRadio} />
                  <strong>{task.title}</strong>

                  <span
                    className={`${styles.statusBadge} ${getStatusClassName(
                      task.status,
                    )}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                <div className={styles.taskMeta}>
                  <span>🕒 期限 {task.dueTime}</span>
                </div>
              </button>
            ))}
          </div>

          <p className={styles.taskHelp}>
            タスクをクリックして
            <br />
            作業するタスクを選択してください
          </p>
        </section>

        <section className={styles.workPanel}>
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
                    ●{" "}
                    {selectedTask
                      ? getStatusLabel(selectedTask.status)
                      : "なし"}
                  </strong>
                </div>

                {!isWorking ? (
                  <button
                    type="button"
                    className={`${styles.mainActionButton} ${styles.startButton}`}
                    onClick={handleStart}
                  >
                    ▶ 作業開始
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.mainActionButton} ${styles.pauseButton}`}
                    onClick={handlePause}
                  >
                    Ⅱ 一時停止
                  </button>
                )}

                <button
                  type="button"
                  className={`${styles.mainActionButton} ${styles.endButton}`}
                  onClick={handleEnd}
                >
                  ■ 作業終了
                </button>

                <button
                  type="button"
                  className={styles.resetButton}
                  onClick={handleReset}
                >
                  ↻ リセット
                </button>
              </div>
            </div>
          </div>

          <div className={styles.memoPanel}>
            <div className={styles.memoHeader}>
              <label htmlFor="workMemo">作業メモ</label>
              <span>{memo.length}/2000 文字</span>
            </div>

            <textarea
              id="workMemo"
              value={memo}
              maxLength={2000}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="この作業で行った内容を記録してください..."
            />

            <p>メモは自動で保存されます</p>
          </div>

          <div className={styles.historyPanel}>
            <div className={styles.historyHeader}>
              <h2>本日の作業履歴</h2>
              <button type="button">すべて見る →</button>
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
                {histories.map((history) => (
                  <tr key={history.id}>
                    <td>{history.taskName}</td>
                    <td>{history.workTime}</td>
                    <td>{history.startTime}</td>
                    <td>{history.endTime}</td>
                    <td>{history.memo}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className={styles.totalTime}>合計作業時間：03:21:15</p>
          </div>
        </section>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeCreateModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>タスク登録</h3>

            {/* タスク登録フォーム */}
            <div className={styles.tabContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="workspace-title">
                  タイトル
                </label>
                <input
                  id="workspace-title"
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
                  htmlFor="workspace-description"
                >
                  説明
                </label>
                <textarea
                  id="workspace-description"
                  className={styles.formTextarea}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="説明を入力"
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="workspace-dueAt">
                  期限日時
                </label>
                <input
                  id="workspace-dueAt"
                  className={styles.formInput}
                  type="datetime-local"
                  value={formDueAt}
                  onChange={(e) => setFormDueAt(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="workspace-status">
                  ステータス
                </label>
                <select
                  id="workspace-status"
                  className={styles.formInput}
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  <option value="NOT_STARTED">未着手</option>
                  <option value="IN_PROGRESS">進行中</option>
                  <option value="DONE">完了</option>
                </select>
              </div>

              {submitError && (
                <div className={styles.submitError}>{submitError}</div>
              )}
            </div>

            {/* モーダルアクション */}
            <div className={styles.modalActions}>
              <button
                className={`${styles.toolbarButton} ${styles.secondary}`}
                onClick={handleCreateTodo}
                disabled={isSubmitting}
              >
                {isSubmitting ? "登録中..." : "登録"}
              </button>
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
