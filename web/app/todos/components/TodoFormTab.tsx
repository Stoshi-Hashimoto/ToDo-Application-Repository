/**
 * TodoFormTabコンポーネントは、Todoの作成・編集フォームを表示するタブコンポーネント
 * 画面全体の状態管理は行わず、必要なデータとコールバック関数を親コンポーネントから受け取る
 * タイトル、説明、期限日時、ステータスの入力フィールドを提供し、ユーザーがTodoの内容を入力できるようにする
 * フォームの入力値は親コンポーネントで管理され、変更があるたびにコールバック関数を通じて親コンポーネントに通知される
 * フォームの送信エラーがある場合は、適切なエラーメッセージを表示する
 */

// Propsの型定義
type Props = {
  styles: { [key: string]: string };
  formTitle: string;
  formDescription: string;
  formDueAt: string;
  formStatus: string;
  submitError: string;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeDueAt: (value: string) => void;
  onChangeStatus: (value: string) => void;
};

// TodoFormTabコンポーネントの定義
export default function TodoFormTab({
  styles,
  formTitle,
  formDescription,
  formDueAt,
  formStatus,
  submitError,
  onChangeTitle,
  onChangeDescription,
  onChangeDueAt,
  onChangeStatus,
}: Props) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="todo-title">
          タイトル
        </label>
        <input
          id="todo-title"
          className={styles.formInput}
          type="text"
          value={formTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="タイトルを入力"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="todo-description">
          説明
        </label>
        <textarea
          id="todo-description"
          className={styles.formTextarea}
          value={formDescription}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="説明を入力"
          rows={4}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="todo-dueAt">
          期限日時
        </label>
        <input
          id="todo-dueAt"
          className={styles.formInput}
          type="datetime-local"
          value={formDueAt}
          onChange={(e) => onChangeDueAt(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="todo-status">
          ステータス
        </label>
        <select
          id="todo-status"
          className={styles.formInput}
          value={formStatus}
          onChange={(e) => onChangeStatus(e.target.value)}
        >
          <option value="NOT_STARTED">未着手</option>
          <option value="IN_PROGRESS">進行中</option>
          <option value="COMPLETED">完了</option>
        </select>
      </div>

      {submitError && <div className={styles.submitError}>{submitError}</div>}
    </div>
  );
}
