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
      body: JSON.stringify({
        message: "Invalid JSON in request body",
      }),
    };
  }

  const todoId = body.todo_id;

  if (!todoId) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "Todo ID is required",
      }),
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

    await client.query("BEGIN");

    const updateSql = `
      UPDATE todo_work_sessions
      SET
        ended_at = CURRENT_TIMESTAMP,
        duration_seconds = EXTRACT(
          EPOCH FROM (
            CURRENT_TIMESTAMP - started_at
          )
        )::INTEGER,
        updated_at = CURRENT_TIMESTAMP
      WHERE todo_id = $1
        AND ended_at IS NULL
      RETURNING *
    `;

    const result = await client.query(updateSql, [todoId]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({
          message: "作業中のタスクが見つかりません。",
        }),
      };
    }

    const updateTodoResult = await client.query(
      `
      UPDATE todos
      SET
        status = 'DONE',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING *
      `,
      [todoId],
    );

    if (updateTodoResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({
          message: "Todo not found or already deleted",
        }),
      };
    }

    await client.query("COMMIT");

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "作業を終了しました。",
        work_session: result.rows[0],
      }),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error ending work session:", error);

    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "Failed to end work session",
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
  };
}
