const { Client } = require("pg");
const { getDbConfig } = require("./ssm");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

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
        headers,
        body: JSON.stringify({
          message: "title is required",
        }),
      };
    }

    console.log("BEFORE getDbConfig");
    const dbConfig = await getDbConfig();
    console.log("AFTER getDbConfig");

    client = new Client(dbConfig);

    console.log("BEFORE DB CONNECT");
    await client.connect();
    console.log("AFTER DB CONNECT");

    const result = await client.query(
      `
      INSERT INTO todos (
        user_id,
        title,
        description,
        due_at,
        status,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        ($4::timestamp AT TIME ZONE 'Asia/Tokyo'),
        $5,
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo',
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo'
      )
      RETURNING *;
      `,
      [1, title.trim(), description, dueAt, "NOT_STARTED"],
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "todo created",
        todo: result.rows[0],
      }),
    };
  } catch (error) {
    console.error("error:", error);

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
      await client.end().catch(() => {});
    }
  }
};
