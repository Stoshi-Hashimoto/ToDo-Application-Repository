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

  const todoId = body.todo_id;

  if (!todoId) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Todo ID is required" }),
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

    const checkSql = `
      SELECT id
      FROM todo_work_sessions
      WHERE todo_id = $1
        AND ended_at IS NULL
      LIMIT 1
    `;

    const checkResult = await client.query(checkSql, [todoId]);

    if (checkResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return {
        statusCode: 409,
        headers: corsHeaders(),
        body: JSON.stringify({ message: "このタスクは既に作業中です。" }),
      };
    }

    const insertSql = `
      INSERT INTO todo_work_sessions (
        todo_id,
        started_at,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    const result = await client.query(insertSql, [todoId]);

    const updateTodoResult = await client.query(
      `
      UPDATE todos
      SET
        status = 'IN_PROGRESS',
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
        body: JSON.stringify({ message: "Todo not found or already deleted" }),
      };
    }

    await client.query("COMMIT");

    return {
      statusCode: 201,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "作業を開始しました。",
        work_session: result.rows[0],
        todo: updateTodoResult.rows[0],
      }),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error starting work session:", error);

    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "Failed to start work session",
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
