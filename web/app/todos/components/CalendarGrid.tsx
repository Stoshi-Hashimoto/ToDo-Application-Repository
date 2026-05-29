/**
 * カレンダーグリッドを表示するコンポーネント
 * 画面全体の状態管理は行わず、必要なデータとコールバック関数を親コンポーネントから受け取る
 * カレンダーのヘッダー（曜日）と各セルを表示し、セルには当日のハイライトやTodoの概要を表示する
 */
import type { CalendarCell as CalendarCellType, Todo } from "../types";
import { WEEK_LABELS } from "../utils";
import CalendarCell from "./CalendarCell";

// カレンダーグリッドのPropsの型定義
type Props = {
  styles: { [key: string]: string };
  calendarCells: CalendarCellType[];
  todosByDate: Record<string, Todo[]>;
  onOpenCreateModal: (date: Date) => void;
  getStatusClassName: (status: string) => string;
};

// カレンダーグリッドコンポーネント
export default function CalendarGrid({
  styles,
  calendarCells,
  todosByDate,
  onOpenCreateModal,
  getStatusClassName,
}: Props) {
  return (
    <section className={styles.calendarWrapper}>
      <div className={styles.weekHeader}>
        {WEEK_LABELS.map((label) => (
          <div key={label} className={styles.weekCell}>
            {label}
          </div>
        ))}
      </div>

      <div className={styles.calendarGrid}>
        {calendarCells.map((cell) => (
          <CalendarCell
            key={`${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`}
            styles={styles}
            cell={cell}
            todosByDate={todosByDate}
            onOpenCreateModal={onOpenCreateModal}
            getStatusClassName={getStatusClassName}
          />
        ))}
      </div>
    </section>
  );
}
