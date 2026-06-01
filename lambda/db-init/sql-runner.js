const { Client } = require("pg");

exports.handler = async (event) => {
  const sql = event.sql;

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const result = await client.query(sql);

  await client.end();

  return {
    statusCode: 200,
    body: JSON.stringify(result.rows),
  };
};
