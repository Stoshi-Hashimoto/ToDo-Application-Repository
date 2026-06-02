/**
 * 作業メモ取得API
 */
const { Client } = require("pg");
const { getDbConfig } = require("./ssm");

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
