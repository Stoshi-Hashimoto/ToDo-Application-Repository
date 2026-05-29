/**
 * カレンダーツールバーコンポーネント
 * カレンダーの月表示とナビゲーションボタンを提供
 * 画面上部に配置され、ユーザーが月を切り替えたり、今日の日付に移動したりできるようにする
 */
type Props = {
  styles: { [key: string]: string };
  monthLabel: string;
  onGoToToday: () => void;
  onMoveMonth: (diff: number) => void;
  message: string;
};

// カレンダーツールバーコンポーネント
export default function CalendarToolbar({
  styles,
  monthLabel,
  onGoToToday,
  onMoveMonth,
  message,
}: Props) {
  return (
    <section className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <button
          onClick={onGoToToday}
          className={styles.toolbarButton + " " + styles.secondary}
        >
          今日
        </button>

        <button
          onClick={() => onMoveMonth(-1)}
          className={styles.toolbarButton + " " + styles.iconButton}
          aria-label="前の月"
        >
          ‹
        </button>

        <button
          onClick={() => onMoveMonth(1)}
          className={styles.toolbarButton + " " + styles.iconButton}
          aria-label="次の月"
        >
          ›
        </button>

        <h2 className={styles.monthLabel}>{monthLabel}</h2>
      </div>

      <div className={styles.statusArea}>
        <span className={styles.statusMessage}>{message}</span>
      </div>
    </section>
  );
}
