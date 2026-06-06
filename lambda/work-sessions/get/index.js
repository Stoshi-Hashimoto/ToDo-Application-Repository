const { Client } = require("pg");
const { getDbConfig } = require("./ssm");

exports.handler = async (event) => {
  console.log("event:", JSON.stringify(event));

  console.log("BEFORE getDbConfig");
  const dbConfig = await getDbConfig();
  console.log("AFTER getDbConfig");

  const client = new Client(dbConfig);

  try {
    console.log("BEFORE DB CONNECT");
    await client.connect();
    console.log("AFTER DB CONNECT");

    const sql = `
      SELECT
        ws.id,
        t.title AS task_name,
        ws.started_at,
        ws.ended_at,
        ws.duration_seconds,
        COALESCE(wn.note, '') AS memo
      FROM todo_work_sessions ws
      INNER JOIN todos t
        ON ws.todo_id = t.id
      LEFT JOIN todo_work_notes wn
        ON wn.work_session_id = ws.id
      WHERE
        date_trunc('month', ws.started_at) =
        date_trunc('month', CURRENT_TIMESTAMP)
      ORDER BY ws.started_at DESC
    `;

    const result = await client.query(sql);

    console.log("result.rows:", result.rows);

    const workHistories = result.rows.map((row) => {
      const startedAt = new Date(row.started_at);
      const endedAt = row.ended_at ? new Date(row.ended_at) : null;

      const workTime =
        endedAt !== null
          ? formatDuration(Math.floor((endedAt - startedAt) / 1000))
          : "作業中";

      return {
        id: row.id,
        taskName: row.task_name,
        workTime,
        startTime: formatTime(startedAt),
        endTime: endedAt ? formatTime(endedAt) : "-",
        memo: row.memo,
      };
    });

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        work_histories: workHistories,
      }),
    };
  } catch (error) {
    console.error("error:", error);

    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "作業履歴の取得に失敗しました。",
        error: error.message,
      }),
    };
  } finally {
    await client.end();
  }
};

function formatTime(date) {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  });
}

function formatDuration(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
}

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
  };
}
