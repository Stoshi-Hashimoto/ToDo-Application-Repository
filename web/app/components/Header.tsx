"use client";
import { useEffect, useState } from "react";
import styles from "./Header.module.css";

type Todo = {
  id: string;
  title: string;
  due_at: string | null;
  created_at: string;
};

type CognitoIdTokenPayload = {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
};

type HeaderProps = {
  Todos?: Todo[];
};

function decodeJwtPayload(token: string): CognitoIdTokenPayload {
  const payload = token.split(".")[1];

  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((char) => {
        return "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );

  return JSON.parse(jsonPayload);
}

export default function Header({ Todos = [] }: HeaderProps) {
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const idToken = localStorage.getItem("id_token");

    if (!idToken) {
      setFullName("");
      return;
    }

    try {
      const decoded = decodeJwtPayload(idToken);

      const displayName =
        `${decoded.family_name ?? ""} ${decoded.given_name ?? ""}`.trim() ||
        decoded.name ||
        decoded.email ||
        "";

      setFullName(displayName);
    } catch (error) {
      console.error("IDトークンの解析に失敗しました", error);
      setFullName("");
    }
  }, []);

  const sortedTodos = [...Todos].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const firstTodo = sortedTodos[0];
  const remainingTodosCount = sortedTodos.length - 1;

  const handleSignOut = () => {
    localStorage.removeItem("id_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;

    const loginUrl =
      `${cognitoDomain}/login?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `scope=openid&` +
      `redirect_uri=${encodeURIComponent(redirectUri ?? "")}`;

    window.location.href = loginUrl;
  };

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

        <button
          type="button"
          className={styles.signOutButton}
          onClick={handleSignOut}
        >
          サインアウト
        </button>
      </div>
    </header>
  );
}
