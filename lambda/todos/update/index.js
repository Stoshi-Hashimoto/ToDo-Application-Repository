const { Client } = require("pg");
const { getDbConfig } = require("./ssm");

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

exports.handler = async (event) => {
  console.log("event:", JSON.stringify(event));

  const id = event.pathParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Invalid request" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Invalid JSON in request body" }),
    };
  }

  const { title, description, due_at, status } = body;

  if (!title) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Title is required" }),
    };
  }

  const dbConfig = await getDbConfig();
  const client = new Client(dbConfig);

  try {
    await client.connect();

    const result = await client.query(
      `
      UPDATE todos 
      SET
        title = $1,
        description = $2,
        due_at = ($3::timestamp AT TIME ZONE 'Asia/Tokyo'),
        status = $4,
        updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo'
      WHERE id = $5
        AND deleted_at IS NULL
      RETURNING *
      `,
      [title, description || null, due_at || null, status || "NOT_STARTED", id],
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Todo not found or already deleted" }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "todo updated",
        todo: result.rows[0],
      }),
    };
  } catch (error) {
    console.error("Error updating todo:", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "failed to update todo",
        error: error.message,
      }),
    };
  } finally {
    await client.end();
  }
};
