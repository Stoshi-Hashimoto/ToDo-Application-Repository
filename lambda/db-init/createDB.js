const { Client } = require("pg");

exports.handler = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres",
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    try {
      await client.query("CREATE DATABASE todo;");
      console.log("DB created");
    } catch (e) {
      console.log("Database may already exist", e.message);
    }

    return {
      statusCode: 200,
      body: "created",
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: "error",
    };
  } finally {
    await client.end().catch(() => {});
  }
};
