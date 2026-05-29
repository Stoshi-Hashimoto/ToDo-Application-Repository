/**
 * 作業メモのモーダルコンポーネント
 * - isOpen: モーダルの表示状態
 * - memoContent: メモの内容
 */

// Reactと必要な型をインポート
type Props = {
  styles: { [key: string]: string };
  isOpen: boolean;
  memoContent: string;
  memoError: string;
  isMemoSubmitting: boolean;
  onChangeMemoContent: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

// メモモーダルコンポーネント
export default function MemoModal({
  styles,
  isOpen,
  memoContent,
  memoError,
  isMemoSubmitting,
  onChangeMemoContent,
  onSave,
  onClose,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>作業メモ</h3>

        <div className={styles.tabContent}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="memo-content">
              作業メモ
            </label>
            <textarea
              id="memo-content"
              className={styles.formTextarea}
              value={memoContent}
              maxLength={2000}
              onChange={(e) => onChangeMemoContent(e.target.value)}
              placeholder="この作業で行った内容を記録してください..."
              rows={8}
            />
            <p>{memoContent.length}/2000 文字</p>
          </div>

          {memoError && <div className={styles.submitError}>{memoError}</div>}
        </div>

        <div className={styles.modalActions}>
          <button
            className={`${styles.toolbarButton} ${styles.secondary}`}
            onClick={onSave}
            disabled={isMemoSubmitting}
          >
            {isMemoSubmitting ? "保存中..." : "保存"}
          </button>
          <button
            className={styles.toolbarButton}
            onClick={onClose}
            disabled={isMemoSubmitting}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
