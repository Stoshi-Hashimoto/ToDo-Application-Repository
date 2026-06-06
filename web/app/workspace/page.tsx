/**
 * 作業スペースページコンポーネント
 * * タスクの表示、作業の開始/終了、作業メモの保存など、作業スペースに関わる全ての機能を提供します。
 * * 画面全体の状態管理とAPI呼び出しを担当し、各UIコンポーネントに必要なデータとコールバックを渡します。
 * * ユーザーがタスクを選択し、作業を開始/終了することで、タスクの状態が更新され、作業履歴が記録されます。
 * * タスクのフィルタリングや新規タスクの作成もこのコンポーネントで処理されます。
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

import type { FilterStatus, Task, TaskStatus, WorkHistory } from "./types";
import { getTodayText, isTodayTodo, mapTodoToTask } from "./utils";
import {
  createTodoApi,
  endWorkSessionApi,
  fetchActiveWorkSessionApi,
  fetchTodosApi,
  fetchWorkHistoriesApi,
  saveWorkMemoApi,
  startWorkSessionApi,
} from "./api";

import { useWorkTimer } from "./hooks/useWorkTimer";
import TaskList from "./components/TaskList";
import CurrentWorkPanel from "./components/CurrentWorkPanel";
import WorkHistoryList from "./components/WorkHistoryList";
import TodoCreateModal from "./components/TodoCreateModal";
import MemoModal from "./components/MemoModal";

const initialTasks: Task[] = [];

export default function WorkSpacePage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [histories, setHistories] = useState<WorkHistory[]>([]);
  const [message, setMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueAt, setFormDueAt] = useState("");
  const [formStatus, setFormStatus] = useState<TaskStatus>("NOT_STARTED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [memoContent, setMemoContent] = useState("");
  const [memoError, setMemoError] = useState("");
  const [isMemoSubmitting, setIsMemoSubmitting] = useState(false);

  const [currentWorkSessionId, setCurrentWorkSessionId] = useState<
    number | null
  >(null);

  const {
    isWorking,
    elapsedSeconds,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
  } = useWorkTimer();

  const today = getTodayText();
  const now = new Date();
  const monthLabel = `${now.getMonth() + 1}月`;
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "期限なし";

    const date = new Date(dateString);

    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 選択されているタスクを取得するためのuseMemoフック
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;

    return tasks.find((task) => task.id === selectedTaskId) ?? null;
  }, [tasks, selectedTaskId]);

  // タスクのフィルタリングを行うためのuseMemoフック
  const filteredTasks = useMemo(() => {
    if (filterStatus === "ALL") {
      return tasks;
    }

    return tasks.filter((task) => task.status === filterStatus);
  }, [tasks, filterStatus]);

  // タスクのフィルタリングやタスクの追加/削除に応じて、選択されているタスクIDを更新するためのuseEffectフック
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

    document.body.classList.add("workspace-body-lock");

    return () => {
      document.body.classList.remove("workspace-body-lock");
    };
  }, [filteredTasks, selectedTaskId]);

  // APIから当月のタスクを取得する関数
  const isCurrentMonthTodo = (dueAt?: string | null) => {
    if (!dueAt) return false;

    const dueDate = new Date(dueAt);
    const now = new Date();

    return (
      dueDate.getFullYear() === now.getFullYear() &&
      dueDate.getMonth() === now.getMonth()
    );
  };

  // APIからタスクを取得する関数
  const fetchTodos = async (): Promise<Task[]> => {
    try {
      setMessage("タスクを取得しています...");

      const todos = await fetchTodosApi();

      const activeTodos = todos.filter(
        (todo) => !todo.deleted_at && isCurrentMonthTodo(todo.due_at),
      );

      const mappedTasks = activeTodos.map(mapTodoToTask);

      setTasks(mappedTasks);
      setSelectedTaskId(mappedTasks[0]?.id ?? null);

      setMessage(
        mappedTasks.length
          ? "当月のタスクを取得しました。"
          : "当月のタスクはありません。",
      );

      return mappedTasks;
    } catch (err) {
      console.error("fetch todos failed:", err);
      setMessage(
        err instanceof Error ? err.message : "タスクの取得に失敗しました。",
      );
      return [];
    }
  };

  const fetchActiveWorkSession = async (currentTasks: Task[]) => {
    try {
      const data = await fetchActiveWorkSessionApi();

      if (!data.activeSession) {
        stopTimer();
        setCurrentWorkSessionId(null);
        return;
      }

      const activeSession = data.activeSession;
      const activeTaskId = String(activeSession.todo_id);

      const existsInTasks = currentTasks.some(
        (task) => task.id === activeTaskId,
      );

      if (!existsInTasks) {
        stopTimer();
        setCurrentWorkSessionId(null);
        setSelectedTaskId(currentTasks[0]?.id ?? null);
        return;
      }

      setSelectedTaskId(activeTaskId);
      setCurrentWorkSessionId(activeSession.work_session_id);

      const startedAt = new Date(
        activeSession.started_at.replace("Z", ""),
      ).getTime();

      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

      console.log("elapsed:", elapsed);
      startTimer(elapsed);

      setMessage("作業中のタスクを復元しました。");
      console.log(activeSession.started_at);
      console.log(new Date(activeSession.started_at));
      console.log(Date.now());
    } catch (err) {
      console.error("fetch active work session failed:", err);
      setMessage(
        err instanceof Error
          ? err.message
          : "作業中セッションの取得に失敗しました。",
      );
    }
  };

  // コンポーネントの初回レンダリング時にタスクと作業履歴を取得するためのuseEffectフック
  useEffect(() => {
    const initialize = async () => {
      const currentTasks = await fetchTodos();
      await fetchWorkHistories();
      await fetchActiveWorkSession(currentTasks);
    };

    initialize();
  }, []);

  // タスクの状態に応じたクラス名を返す関数
  const getStatusClassName = (status: TaskStatus) => {
    if (status === "NOT_STARTED") return styles.notStarted;
    if (status === "IN_PROGRESS") return styles.inProgress;
    return styles.done;
  };

  // タスクを選択するための関数
  const handleSelectTask = (taskId: string) => {
    if (isWorking) return;

    setSelectedTaskId(taskId);
    resetTimer();
  };

  // 新規タスク作成モーダルを開くための関数
  const openCreateModal = () => {
    setFormTitle("");
    setFormDescription("");
    setFormDueAt("");
    setFormStatus("NOT_STARTED");
    setSubmitError("");
    setIsModalOpen(true);
  };

  // 新規タスク作成モーダルを閉じるための関数
  const closeCreateModal = () => {
    setIsModalOpen(false);
    setFormTitle("");
    setFormDescription("");
    setFormDueAt("");
    setFormStatus("NOT_STARTED");
    setSubmitError("");
  };

  // 新規タスクを作成するための関数
  const handleCreateTodo = async () => {
    if (!formTitle.trim()) {
      setSubmitError("タイトルは必須です。");
      return;
    }

    if (!formDueAt) {
      setSubmitError("期限日時は必須です。");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(formDueAt)) {
      setSubmitError("期限日時は年4桁で入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const data = await createTodoApi({
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        dueAt: formDueAt,
        status: formStatus,
      });

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

  // 作業メモモーダルを開くための関数
  const openMemoModal = () => {
    if (!selectedTask) {
      setMessage("作業メモを開くタスクを選択してください。");
      return;
    }

    setMemoContent(selectedTask.description ?? "");
    setMemoError("");
    setIsMemoModalOpen(true);
  };

  // 作業メモモーダルを閉じるための関数
  const closeMemoModal = () => {
    setIsMemoModalOpen(false);
    setMemoError("");
  };

  // 作業メモを保存するための関数
  const handleSaveMemo = async () => {
    if (!selectedTask) {
      setMemoError("保存するタスクが選択されていません。");
      return;
    }

    if (!currentWorkSessionId) {
      setMemoError("作業開始後にメモを保存してください。");
      return;
    }

    try {
      setIsMemoSubmitting(true);
      setMemoError("");

      const data = await saveWorkMemoApi({
        workSessionId: currentWorkSessionId,
        note: memoContent.trim(),
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? { ...task, description: memoContent.trim() || "" }
            : task,
        ),
      );

      setMessage(data.message || "作業メモを保存しました。");
      closeMemoModal();
    } catch (err) {
      console.error("save memo failed:", err);
      setMemoError(
        err instanceof Error ? err.message : "作業メモの保存に失敗しました。",
      );
    } finally {
      setIsMemoSubmitting(false);
    }
  };

  // 作業を開始するための関数
  const handleStart = async () => {
    if (!selectedTask) {
      setMessage("作業開始するタスクを選択してください。");
      return;
    }

    try {
      setMessage("作業を開始しています...");

      const data = await startWorkSessionApi(Number(selectedTask.id));

      startTimer();
      setCurrentWorkSessionId(Number(data.work_session.id));

      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? { ...task, status: "IN_PROGRESS" }
            : task,
        ),
      );

      setMessage(data.message || "作業を開始しました。");
    } catch (err) {
      console.error("start work session failed:", err);
      setMessage(
        err instanceof Error ? err.message : "作業開始に失敗しました。",
      );
    }
  };

  // 作業を一時停止するための関数
  const handlePause = () => {
    pauseTimer();
  };

  // 作業を終了するための関数
  const handleEnd = async () => {
    if (!selectedTask) {
      setMessage("作業終了するタスクを選択してください。");
      return;
    }

    try {
      setMessage("作業を終了しています...");

      const data = await endWorkSessionApi(Number(selectedTask.id));

      stopTimer();
      setCurrentWorkSessionId(null);

      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id ? { ...task, status: "DONE" } : task,
        ),
      );

      setMessage(data.message || "作業を終了しました。");
      await fetchWorkHistories();
    } catch (err) {
      console.error("end work session failed:", err);
      setMessage(
        err instanceof Error ? err.message : "作業終了に失敗しました。",
      );
    }
  };

  // APIから作業履歴を取得する関数
  const fetchWorkHistories = async () => {
    try {
      const workHistories = await fetchWorkHistoriesApi();
      setHistories(workHistories);
    } catch (err) {
      console.error("fetch work histories failed:", err);
      setMessage(
        err instanceof Error ? err.message : "作業履歴の取得に失敗しました。",
      );
    }
  };

  return (
    <div className={styles.workspacePage}>
      <main className={styles.workspaceMain}>
        <div className={styles.workspaceLayout}>
          <TaskList
            styles={styles}
            monthLabel={monthLabel}
            today={today}
            tasks={filteredTasks}
            selectedTaskId={selectedTaskId}
            filterStatus={filterStatus}
            onChangeFilterStatus={setFilterStatus}
            onSelectTask={handleSelectTask}
            onOpenCreateModal={openCreateModal}
            getStatusClassName={getStatusClassName}
          />

          <section className={styles.workPanel}>
            <CurrentWorkPanel
              styles={styles}
              selectedTask={selectedTask}
              isWorking={isWorking}
              elapsedSeconds={elapsedSeconds}
              onStart={handleStart}
              onPause={handlePause}
              onEnd={handleEnd}
              onOpenMemoModal={openMemoModal}
            />

            <WorkHistoryList styles={styles} histories={histories} />
          </section>
        </div>

        {message && <p>{message}</p>}

        <TodoCreateModal
          styles={styles}
          isOpen={isModalOpen}
          title={formTitle}
          description={formDescription}
          dueAt={formDueAt}
          status={formStatus}
          submitError={submitError}
          isSubmitting={isSubmitting}
          onChangeTitle={setFormTitle}
          onChangeDescription={setFormDescription}
          onChangeDueAt={setFormDueAt}
          onChangeStatus={(value) => setFormStatus(value as TaskStatus)}
          onSubmit={handleCreateTodo}
          onClose={closeCreateModal}
        />

        <MemoModal
          styles={styles}
          isOpen={isMemoModalOpen}
          memoContent={memoContent}
          memoError={memoError}
          isMemoSubmitting={isMemoSubmitting}
          onChangeMemoContent={setMemoContent}
          onSave={handleSaveMemo}
          onClose={closeMemoModal}
        />
      </main>
    </div>
  );
}
