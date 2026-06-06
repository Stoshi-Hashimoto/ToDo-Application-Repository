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

    const activeCheckSql = `
      SELECT
        ws.id AS work_session_id,
        ws.todo_id,
        ws.started_at,
        t.title
      FROM todo_work_sessions ws
      JOIN todos t
        ON t.id = ws.todo_id
      WHERE
        ws.ended_at IS NULL
        AND t.status = 'IN_PROGRESS'
      ORDER BY ws.started_at DESC
      LIMIT 1;
    `;

    const result = await client.query(activeCheckSql);

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        activeSession: result.rows[0] ?? null,
      }),
    };
  } catch (error) {
    console.error("Error fetching active work session:", error);

    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "Failed to fetch active work session",
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
