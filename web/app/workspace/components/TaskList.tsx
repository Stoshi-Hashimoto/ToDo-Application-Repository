/**
 * タスク一覧を表示するコンポーネント
 * - タスクのフィルタリング
 * - タスクの選択
 * - タスクの追加
 * などの機能を提供
 */
import type { FilterStatus, Task, TaskStatus } from "../types";
import { getStatusLabel } from "../utils";

// Propsの型定義
type Props = {
  styles: { [key: string]: string };
  monthLabel: string;
  today: string;
  tasks: Task[];
  selectedTaskId: string | null;
  filterStatus: FilterStatus;
  onChangeFilterStatus: (status: FilterStatus) => void;
  onSelectTask: (taskId: string) => void;
  onOpenCreateModal: () => void;
  getStatusClassName: (status: TaskStatus) => string;
};

// タスク一覧コンポーネント
export default function TaskList({
  styles,
  monthLabel,
  today,
  tasks,
  selectedTaskId,
  filterStatus,
  onChangeFilterStatus,
  onSelectTask,
  onOpenCreateModal,
  getStatusClassName,
}: Props) {
  return (
    <section className={styles.taskPanel}>
      <div className={styles.panelHeader}>
        <div>
          <h2>{monthLabel}のタスク</h2>
          <p>{today}</p>
        </div>

        <button
          type="button"
          className={styles.addTaskButton}
          onClick={onOpenCreateModal}
        >
          ＋ タスク追加
        </button>
      </div>

      <div className={styles.taskFilters}>
        <button
          type="button"
          className={filterStatus === "ALL" ? styles.active : ""}
          onClick={() => onChangeFilterStatus("ALL")}
        >
          すべて
        </button>
        <button
          type="button"
          className={filterStatus === "NOT_STARTED" ? styles.active : ""}
          onClick={() => onChangeFilterStatus("NOT_STARTED")}
        >
          未着手
        </button>
        <button
          type="button"
          className={filterStatus === "IN_PROGRESS" ? styles.active : ""}
          onClick={() => onChangeFilterStatus("IN_PROGRESS")}
        >
          作業中
        </button>
        <button
          type="button"
          className={filterStatus === "DONE" ? styles.active : ""}
          onClick={() => onChangeFilterStatus("DONE")}
        >
          完了
        </button>
      </div>

      <div className={styles.taskList}>
        {tasks.map((task) => (
          <button
            type="button"
            key={task.id}
            className={`${styles.taskCard} ${
              selectedTaskId === task.id ? styles.selected : ""
            }`}
            onClick={() => onSelectTask(task.id)}
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
              <span>
                🕒 期限 {task.dueAt}　{task.dueTime}
              </span>
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
  );
}
