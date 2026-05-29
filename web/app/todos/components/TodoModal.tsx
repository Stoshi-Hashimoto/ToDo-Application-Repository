/**
 * TodoModalコンポーネントは、タスクの一覧表示とタスクの作成・編集フォームを切り替えるモーダルコンポーネント
 * 画面全体の状態管理は行わず、必要なデータとコールバック関数を親コンポーネントから受け取る
 * モーダル内でタスクの一覧表示とタスクの作成・編集フォームを切り替えるタブを提供し、ユーザーがタスクを管理できるようにする
 * タスクの一覧表示では、選択された日付のタスクを表示し、タスクの編集や削除ができるようにする
 * タスクの作成・編集フォームでは、タイトル、説明、期限日時、ステータスの入力フィールドを提供し、ユーザーがタスクの内容を入力できるようにする
 * フォームの入力値は親コンポーネントで管理され、変更があるたびにコールバック関数を通じて親コンポーネントに
 */
import type { ModalTab, Todo } from "../types";
import { formatMonthDayLabel } from "../utils";
import TodoFormTab from "./TodoFormTab";
import TodoListTab from "./TodoListTab";

// Propsの型定義
type Props = {
  styles: { [key: string]: string };
  isOpen: boolean;
  selectedDate: Date | null;
  modalTab: ModalTab;
  editingTodoId: string | null;
  todosByDate: Record<string, Todo[]>;
  formTitle: string;
  formDescription: string;
  formDueAt: string;
  formStatus: string;
  submitError: string;
  isSubmitting: boolean;
  onChangeModalTab: (tab: ModalTab) => void;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeDueAt: (value: string) => void;
  onChangeStatus: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onEditTodo: (todo: Todo) => void;
  onDeleteTodo: (todo: Todo) => void;
  getStatusClassName: (status: string) => string;
};

// TodoModalコンポーネントの定義
export default function TodoModal({
  styles,
  isOpen,
  selectedDate,
  modalTab,
  editingTodoId,
  todosByDate,
  formTitle,
  formDescription,
  formDueAt,
  formStatus,
  submitError,
  isSubmitting,
  onChangeModalTab,
  onChangeTitle,
  onChangeDescription,
  onChangeDueAt,
  onChangeStatus,
  onSubmit,
  onClose,
  onEditTodo,
  onDeleteTodo,
  getStatusClassName,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>タスク管理</h3>

        {selectedDate && (
          <p className={styles.modalSubtitle}>
            選択日: {formatMonthDayLabel(selectedDate)}
          </p>
        )}

        <div className={styles.modalTabs}>
          <button
            className={`${styles.tabButton} ${
              modalTab === "list" ? styles.tabButtonActive : ""
            }`}
            onClick={() => onChangeModalTab("list")}
          >
            タスク一覧
          </button>

          <button
            className={`${styles.tabButton} ${
              modalTab === "create" ? styles.tabButtonActive : ""
            }`}
            onClick={() => onChangeModalTab("create")}
          >
            タスク登録
          </button>
        </div>

        {modalTab === "list" && selectedDate && (
          <TodoListTab
            styles={styles}
            selectedDate={selectedDate}
            todosByDate={todosByDate}
            onEditTodo={onEditTodo}
            onDeleteTodo={onDeleteTodo}
            getStatusClassName={getStatusClassName}
          />
        )}

        {modalTab === "create" && (
          <TodoFormTab
            styles={styles}
            formTitle={formTitle}
            formDescription={formDescription}
            formDueAt={formDueAt}
            formStatus={formStatus}
            submitError={submitError}
            onChangeTitle={onChangeTitle}
            onChangeDescription={onChangeDescription}
            onChangeDueAt={onChangeDueAt}
            onChangeStatus={onChangeStatus}
          />
        )}

        <div className={styles.modalActions}>
          {modalTab === "create" && (
            <button
              className={`${styles.toolbarButton} ${styles.secondary}`}
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "登録中..." : editingTodoId ? "更新" : "登録"}
            </button>
          )}

          <button
            className={styles.toolbarButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
