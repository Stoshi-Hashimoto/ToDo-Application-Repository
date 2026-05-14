import styles from "./Header.module.css";

type Todo = {
  id: string;
  title: string;
  due_at: string | null;
  created_at: string;
};

type HeaderProps = {
  first_name?: string;
  last_name?: string;
  Todos?: Todo[];
};

export default function Header({
  first_name = "",
  last_name = "",
  Todos = [],
}: HeaderProps) {
  const fullName = `${first_name} ${last_name}`.trim();

  const sortedTodos = [...Todos].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const firstTodo = sortedTodos[0];
  const remainingTodosCount = sortedTodos.length - 1;

  return (
    <header className={styles.siteHeader}>
      <div className={styles.brand}>My Todo App</div>

      <div className={styles.headerInfo}>
        {firstTodo && (
          <div className={styles.todayTask}>
            本日のタスク：{firstTodo.title}{" "}
            {remainingTodosCount > 0 && ` 他${remainingTodosCount}件`}
          </div>
        )}

        {fullName && <div className={styles.userName}>{fullName}</div>}

        <button className={styles.signOutButton}>サインアウト</button>
      </div>
    </header>
  );
}
