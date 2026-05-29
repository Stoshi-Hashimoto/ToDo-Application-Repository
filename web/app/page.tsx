"use client";

import { useEffect } from "react";

/**
 * ホームページコンポーネント
 * * 全体の状態管理と部品の配置だけを担当します。
 * 起動時にCognitoのホストされたUI（ログイン画面）へリダイレクト処理を行います。
 */

export default function HomePage() {
  useEffect(() => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;

    if (!domain || !clientId || !redirectUri) {
      alert("環境変数が設定されていません。");
      return;
    }

    const loginUrl =
      `${domain}/login` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&scope=openid` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = loginUrl;
  }, []);

  return (
    <main style={{ padding: "24px" }}>
      <p>ログイン画面へ移動しています...</p>
    </main>
  );
}
