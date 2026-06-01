/**
 * 作業メモ取得API
 */
const { Client } = require("pg");

exports.handler = async (event) => {
  console.log("event:", JSON.stringify(event));

  const workSessionId = event.pathParameters?.workSessionId;

  if (!workSessionId) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "workSessionId is required",
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

    const sql = `
      SELECT
        id,
        work_session_id,
        note,
        created_at,
        updated_at
      FROM todo_work_notes
      WHERE work_session_id = $1
      ORDER BY created_at ASC
    `;

    const result = await client.query(sql, [workSessionId]);

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        work_notes: result.rows,
      }),
    };
  } catch (error) {
    console.error("Error getting work notes:", error);

    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "Failed to get work notes",
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
