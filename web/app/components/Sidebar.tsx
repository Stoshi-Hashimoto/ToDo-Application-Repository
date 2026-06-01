import styles from "./Sidebar.module.css";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav>
        <ul className={styles.sidebarMenu}>
          <li className={styles.sidebarSection}>
            <p className={styles.sidebarSectionTitle}>メニュー</p>
          </li>

          <li className={styles.sidebarItem}>
            <a href="/todos" className={styles.sidebarLink}>
              📅 作業カレンダー
            </a>
          </li>
          <li className={styles.sidebarItem}>
            <a href="/workspace" className={styles.sidebarLink}>
              📝 タスク作業
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
