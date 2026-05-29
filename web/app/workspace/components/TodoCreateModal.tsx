/**
 * タスク作成のモーダルコンポーネント
 * - isOpen: モーダルの表示状態
 * - title: タスクのタイトル
 */

type Props = {
  styles: { [key: string]: string };
  isOpen: boolean;
  title: string;
  description: string;
  dueAt: string;
  status: string;
  submitError: string;
  isSubmitting: boolean;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeDueAt: (value: string) => void;
  onChangeStatus: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

// タスク作成のモーダルコンポーネント
export default function TodoCreateModal({
  styles,
  isOpen,
  title,
  description,
  dueAt,
  status,
  submitError,
  isSubmitting,
  onChangeTitle,
  onChangeDescription,
  onChangeDueAt,
  onChangeStatus,
  onSubmit,
  onClose,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>タスク登録</h3>

        <div className={styles.tabContent}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="workspace-title">
              タイトル
            </label>
            <input
              id="workspace-title"
              className={styles.formInput}
              type="text"
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="タイトルを入力"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="workspace-description">
              説明
            </label>
            <textarea
              id="workspace-description"
              className={styles.formTextarea}
              value={description}
              onChange={(e) => onChangeDescription(e.target.value)}
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
              value={dueAt}
              onChange={(e) => onChangeDueAt(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="workspace-status">
              ステータス
            </label>
            <select
              id="workspace-status"
              className={styles.formInput}
              value={status}
              onChange={(e) => onChangeStatus(e.target.value)}
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

        <div className={styles.modalActions}>
          <button
            className={`${styles.toolbarButton} ${styles.secondary}`}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "登録中..." : "登録"}
          </button>
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
