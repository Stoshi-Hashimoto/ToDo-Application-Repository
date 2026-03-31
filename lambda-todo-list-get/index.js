const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false,
  },
});

exports.handler = async (event) => {
  console.log("event:", JSON.stringify(event));
  console.log("env check:", {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD_EXISTS: !!process.env.DB_PASSWORD,
  });

  let client;

  try {
    client = await pool.connect();
    console.log("db connected");

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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "todos fetched",
        todos: result.rows,
      }),
    };
  } catch (error) {
    console.error("lambda error:", error);
    console.error("lambda error message:", error.message);
    console.error("lambda error stack:", error.stack);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
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
