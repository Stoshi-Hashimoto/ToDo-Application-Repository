/**
 * TodoListTabコンポーネントは、選択された日付のTodoリストを表示するタブの内容を担当します。
 * 画面全体の状態管理は行わず、必要なデータとコールバック関数を親コンポーネントから受け取ります。
 * 選択された日付に関連するTodoを表示し、各Todoには編集と削除のアクションが提供されます。
 * Todoがない場合は、適切なメッセージを表示します。
 */
import type { Todo } from "../types";
import {
  formatDateKeyFromDate,
  formatDueTime,
  formatStatusLabel,
} from "../utils";

// Propsの型定義
type Props = {
  styles: { [key: string]: string };
  selectedDate: Date;
  todosByDate: Record<string, Todo[]>;
  onEditTodo: (todo: Todo) => void;
  onDeleteTodo: (todo: Todo) => void;
  getStatusClassName: (status: string) => string;
};

// TodoListTabコンポーネントの定義
export default function TodoListTab({
  styles,
  selectedDate,
  todosByDate,
  onEditTodo,
  onDeleteTodo,
  getStatusClassName,
}: Props) {
  const dateKey = formatDateKeyFromDate(selectedDate);
  const dayTodos = todosByDate[dateKey] || [];

  return (
    <div className={styles.tabContent}>
      <div className={styles.todoListContainer}>
        {dayTodos.length === 0 ? (
          <p className={styles.emptyMessage}>この日付のタスクはありません</p>
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
                      className={`${styles.todoListItemStatus} ${getStatusClassName(
                        todo.status,
                      )}`}
                    >
                      {formatStatusLabel(todo.status)}
                    </div>
                  </div>

                  <div className={styles.todoListItemActions}>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.editButton}`}
                      onClick={() => onEditTodo(todo)}
                    >
                      編集
                    </button>

                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => onDeleteTodo(todo)}
                    >
                      削除
                    </button>
                  </div>
                </div>

                <div className={styles.todoListItemTitle}>{todo.title}</div>

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
    </div>
  );
}
