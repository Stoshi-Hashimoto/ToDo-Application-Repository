"use client";

export default function HomePage() {
  const handleLogin = () => {
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
  };

  return (
    <main style={{ padding: "24px" }}>
      <h1>ToDo アプリ</h1>
      <p>Cognito ログインを行ってください。</p>
      <button onClick={handleLogin}>ログイン</button>
    </main>
  );
}
