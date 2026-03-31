"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type TokenResponse = {
  access_token?: string; // The access token issued by the authorization server
  id_token?: string; // The ID token issued by the authorization server
  refresh_token?: string; // The refresh token issued by the authorization server
  token_type?: string; // The type of the token issued (e.g., "Bearer")
  expires_in?: number; // The lifetime in seconds of the access token
  error?: string; // An error code if the token request failed
  error_description?: string; // A human-readable description of the error
};

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedRef = useRef(false);

  const [message, setMessage] = useState("認証処理中です...");
  const [errorDetail, setErrorDetail] = useState("");

  // 認証コードを処理してトークンを取得する関数
  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const exchangeCodeForToken = async () => {
      const code = searchParams.get("code"); // 認証コードをURLのクエリパラメータから取得
      const error = searchParams.get("error"); // エラーコードをURLのクエリパラメータから取得
      const errorDescription = searchParams.get("error_description"); // エラー説明をURLのクエリパラメータから取得

      // エラーが存在する場合のハンドリング
      if (error) {
        setMessage("認証に失敗しました。");
        setErrorDetail(
          errorDescription || error || "不明なエラーが発生しました。",
        );
        return;
      }

      // 認証コードが存在しない場合のエラーハンドリング
      if (!code) {
        setMessage(
          "ログインに失敗しました。認証コードが見つかりませんでした。",
        );
        setErrorDetail(
          "Hosted UIからcallback に正しく戻れているか確認してください。",
        );
        return;
      }

      const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN; // Cognitoのドメイン
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID; // CognitoのクライアントID
      const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI; // CognitoのリダイレクトURI

      // 環境変数の存在を確認
      if (!domain || !clientId || !redirectUri) {
        setMessage("環境変数が正しく設定されていません。");
        setErrorDetail(
          "NEXT_PUBLIC_COGNITO_DOMAIN, NEXT_PUBLIC_COGNITO_CLIENT_ID, NEXT_PUBLIC_COGNITO_REDIRECT_URI を確認してください。",
        );
        return;
      }

      try {
        // トークンエンドポイントに送信するリクエストのボディを作成
        const body = new URLSearchParams({
          grant_type: "authorization_code", // 認証コードグラントを使用
          client_id: clientId, // クライアントID
          code, // 認証コード
          redirect_uri: redirectUri, // リダイレクトURI（Hosted UIで設定したものと一致させる必要があります）
        });

        // トークンエンドポイントにPOSTリクエストを送信して、トークンを取得
        const response = await fetch(`${domain}/oauth2/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        // レスポンスからトークンを取得
        const data: TokenResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error_description ||
              data.error ||
              `HTTP error! status: ${response.status}`,
          );
        }

        // IDトークンチェック
        if (!data.id_token) {
          throw new Error("IDトークンが取得できませんでした。");
        }

        // トークンをローカルストレージに保存
        localStorage.setItem("id_token", data.id_token);

        // オプションで、アクセストークンやリフレッシュトークンも保存
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }

        // リフレッシュトークン(セキュリティ上の理由から慎重に扱う必要あり)
        // if (data.refresh_token) {
        //   localStorage.setItem("refresh_token", data.refresh_token);
        // }

        // トークンの有効期限も保存（オプション）
        if (data.expires_in) {
          const expiresAt = Date.now() + data.expires_in * 1000;
          localStorage.setItem("expires_at", String(expiresAt));
        }

        // ログイン成功後のリダイレクト
        setMessage("ログイン成功。/todos に移動します...");
        router.replace("/todos");
      } catch (err) {
        console.error("token exchange failed:", err);
        setMessage("トークン取得に失敗しました。");
        setErrorDetail(
          err instanceof Error ? err.message : "不明なエラーが発生しました。",
        );
      }
    };
    exchangeCodeForToken();
  }, [router, searchParams]);

  return (
    <main style={{ padding: "24px" }}>
      <h1>Auth Callback</h1>
      <p>{message}</p>
      {errorDetail && (
        <pre style={{ color: "red", whiteSpace: "pre-wrap" }}>
          {errorDetail}
        </pre>
      )}
    </main>
  );
}
