const { Pool } = require("pg");
const { getDbConfig } = require("./ssm");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

let pool;

async function getPool() {
  if (pool) {
    return pool;
  }

  console.log("BEFORE getDbConfig");
  const dbConfig = await getDbConfig();
  console.log("AFTER getDbConfig");

  pool = new Pool({
    ...dbConfig,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
}

exports.handler = async (event) => {
  console.log("event:", JSON.stringify(event));

  let client;

  try {
    const dbPool = await getPool();

    console.log("BEFORE DB CONNECT");
    client = await dbPool.connect();
    console.log("AFTER DB CONNECT");

    const userId = 1;

    const sql = `
      SELECT
          id,
          user_id,
          title,
          description,
          due_at,
          status,
          created_at,
          updated_at,
          deleted_at
      FROM todos
      WHERE user_id = $1
        AND deleted_at IS NULL
      ORDER BY
          due_at ASC NULLS LAST,
          id ASC;
    `;

    const result = await client.query(sql, [userId]);
    console.log("query success. rows:", result.rows.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "todos fetched",
        todos: result.rows,
      }),
    };
  } catch (error) {
    console.error("lambda error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "internal server error",
        error: error.message,
      }),
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};
