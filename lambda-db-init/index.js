const { Client } = require("pg");

exports.handler = async (event) => {
  let client;

  try {
    console.log("event:", JSON.stringify(event));

    const body = event.body ? JSON.parse(event.body) : {};
    const title = body.title;
    const description = body.description ?? null;
    const dueAt = body.due_at ?? null;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "title is required",
        }),
      };
    }

    client = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    console.log("before connect");
    await client.connect();
    console.log("after connect");

    const result = await client.query(
      `
      INSERT INTO todos (
        user_id,
        title,
        description,
        due_at,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [
        1, // 仮でテストユーザーID固定
        title.trim(),
        description,
        dueAt,
        "NOT_STARTED",
      ],
    );

    console.log("after insert");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "todo created",
        todo: result.rows[0],
      }),
    };
  } catch (error) {
    console.error("error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
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
