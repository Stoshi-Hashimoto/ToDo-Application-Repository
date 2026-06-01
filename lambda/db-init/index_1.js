const { Client } = require("pg");

exports.handler = async (event) => {
  let client;

  try {
    client = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    const tableListResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tableNames = tableListResult.rows.map((row) => row.table_name);

    const tables = {};

    for (const tableName of tableNames) {
      const result = await client.query(`
        SELECT *
        FROM ${tableName}
        LIMIT 50;
      `);

      tables[tableName] = {
        count: result.rows.length,
        rows: result.rows,
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "database tables fetched",
        tableNames,
        tables,
      }),
    };
  } catch (error) {
    console.error("error:", error);

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
      await client.end().catch(() => {});
    }
  }
};
