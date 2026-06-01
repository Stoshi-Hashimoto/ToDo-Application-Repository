const { Client } = require("pg");

exports.handler = async (event) => {
  console.log("event:", JSON.stringify(event));

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Invalid JSON in request body" }),
    };
  }

  const workSessionId = body.work_session_id;
  const note = body.note;

  if (!workSessionId) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Work session ID is required" }),
    };
  }

  if (!note || !String(note).trim()) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Note cannot be empty" }),
    };
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    const checkSql = `
      SELECT id
      FROM todo_work_sessions
      WHERE id = $1
      LIMIT 1
    `;

    const checkResult = await client.query(checkSql, [workSessionId]);

    if (checkResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({
          message: "対象の作業セッションが存在しません。",
        }),
      };
    }

    const insertSql = `
      INSERT INTO todo_work_notes (
        work_session_id,
        note,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    const result = await client.query(insertSql, [
      workSessionId,
      String(note).trim(),
    ]);

    return {
      statusCode: 201,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "作業メモを追加しました。",
        work_note: result.rows[0],
      }),
    };
  } catch (error) {
    console.error("Error adding work note:", error);

    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "Failed to add work note",
        error: error.message,
      }),
    };
  } finally {
    await client.end();
  }
};

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };
}
