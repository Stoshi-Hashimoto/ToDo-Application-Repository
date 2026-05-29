/**
 * カレンダーの各セルを表示するコンポーネント
 * 日付、当日のハイライト、Todoの概要を表示し、セルをクリックするとTodo作成モーダルが開く
 * 画面全体の状態管理は行わず、必要なデータとコールバック関数を親コンポーネントから受け取る
 */
import type { CalendarCell as CalendarCellType, Todo } from "../types";
import {
  buildTooltip,
  formatDateKeyFromDate,
  formatDueTime,
  formatStatusLabel,
  isSameDate,
} from "../utils";

// カレンダーセルコンポーネントのプロパティの型定義
type Props = {
  styles: { [key: string]: string };
  cell: CalendarCellType;
  todosByDate: Record<string, Todo[]>;
  onOpenCreateModal: (date: Date) => void;
  getStatusClassName: (status: string) => string;
};

// カレンダーセルコンポーネント
export default function CalendarCell({
  styles,
  cell,
  todosByDate,
  onOpenCreateModal,
  getStatusClassName,
}: Props) {
  const dateKey = formatDateKeyFromDate(cell.date);
  const dayTodos = todosByDate[dateKey] || [];
  const isToday = isSameDate(cell.date, new Date());

  return (
    <div
      className={`${styles.dateCell} ${
        cell.isCurrentMonth ? "" : styles.otherMonth
      }`}
      onClick={() => onOpenCreateModal(cell.date)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onOpenCreateModal(cell.date);
        }
      }}
    >
      <div className={styles.dateCellHeader}>
        <span
          className={`${styles.dateNumber} ${
            isToday ? styles.dateNumberToday : ""
          }`}
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
                  className={`${styles.todoStatus} ${getStatusClassName(
                    todo.status,
                  )}`}
                >
                  {formatStatusLabel(todo.status)}
                </div>
              </article>
            ))}

            {dayTodos.length > 1 && (
              <div className={styles.moreTodos}>他{dayTodos.length - 1}件</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
