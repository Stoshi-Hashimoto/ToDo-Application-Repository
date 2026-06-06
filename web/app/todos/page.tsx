/**
 * todosアプリケーションのメインページコンポーネント
 * カレンダー表示、Todoの取得・作成・編集・削除のロジックを実装
 * 画面全体の状態管理を行い、必要なデータとコールバック関数を子コンポーネントに渡す
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

import type { ModalTab, Todo } from "./types";
import {
  buildMonthCalendar,
  formatMonthLabel,
  groupTodosByDate,
  toDatetimeLocalString,
} from "./utils";
import {
  createTodoApi,
  deleteTodoApi,
  fetchTodosApi,
  updateTodoApi,
} from "./api";

import CalendarToolbar from "./components/CalendarToolbar";
import CalendarGrid from "./components/CalendarGrid";
import TodoModal from "./components/TodoModal";

export default function TodosPage() {
  const [message, setMessage] = useState("読み込み中...");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorDetail, setErrorDetail] = useState("");

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalTab, setModalTab] = useState<ModalTab>("create");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueAt, setFormDueAt] = useState("");
  const [formStatus, setFormStatus] = useState("NOT_STARTED");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchTodos = async () => {
    try {
      setErrorDetail("");

      const activeTodos = await fetchTodosApi();

      setTodos(activeTodos);
      setMessage("Todoを取得しました。");
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
    return groupTodosByDate(todos);
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

  const handleSaveTodo = async () => {
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

      const params = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        dueAt: formDueAt,
        status: formStatus,
      };

      const data = editingTodoId
        ? await updateTodoApi(editingTodoId, params)
        : await createTodoApi(params);

      setMessage(
        data.message ||
          (editingTodoId ? "Todoを更新しました。" : "Todoを登録しました。"),
      );

      closeCreateModal();
      await fetchTodos();
    } catch (err) {
      console.error("save todo failed:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Todoの保存に失敗しました。",
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

    try {
      const data = await deleteTodoApi(todo.id);

      setMessage(data.message || "Todoを削除しました。");
      await fetchTodos();
    } catch (err) {
      console.error("delete todo failed:", err);
      setMessage(
        err instanceof Error ? err.message : "Todoの削除に失敗しました。",
      );
    }
  };

  const getStatusClassName = (status: string) => {
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
  };

  return (
    <main className={styles.calendarPage}>
      {errorDetail && <pre className={styles.errorBox}>{errorDetail}</pre>}

      <CalendarToolbar
        styles={styles}
        monthLabel={monthLabel}
        onGoToToday={goToToday}
        onMoveMonth={moveMonth}
        message={message}
      />

      <CalendarGrid
        styles={styles}
        calendarCells={calendarCells}
        todosByDate={todosByDate}
        onOpenCreateModal={openCreateModal}
        getStatusClassName={getStatusClassName}
      />

      <TodoModal
        styles={styles}
        isOpen={isModalOpen}
        selectedDate={selectedDate}
        modalTab={modalTab}
        editingTodoId={editingTodoId}
        todosByDate={todosByDate}
        formTitle={formTitle}
        formDescription={formDescription}
        formDueAt={formDueAt}
        formStatus={formStatus}
        submitError={submitError}
        isSubmitting={isSubmitting}
        onChangeModalTab={setModalTab}
        onChangeTitle={setFormTitle}
        onChangeDescription={setFormDescription}
        onChangeDueAt={setFormDueAt}
        onChangeStatus={setFormStatus}
        onSubmit={handleSaveTodo}
        onClose={closeCreateModal}
        onEditTodo={handleEditTodo}
        onDeleteTodo={handleDeleteTodo}
        getStatusClassName={getStatusClassName}
      />
    </main>
  );
}
