const { Client } = require("pg");

exports.handler = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, // ← todo にしておく
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    console.log("Connected to DB");

    // ===== DDL実行 =====
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        cognito_id VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("users table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_at TIMESTAMP,
        status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,

        CONSTRAINT fk_todos_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        CONSTRAINT chk_todos_status
          CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'DONE'))
      );
    `);

    console.log("todos table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS todo_work_sessions (
        id BIGSERIAL PRIMARY KEY,

        todo_id BIGINT NOT NULL,

        started_at TIMESTAMP NOT NULL,
        ended_at TIMESTAMP,

        duration_seconds INTEGER,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_work_sessions_todo
          FOREIGN KEY (todo_id)
          REFERENCES todos(id)
          ON DELETE CASCADE
      );
    `);

    console.log("todo_work_sessions table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS todo_work_notes (
        id BIGSERIAL PRIMARY KEY,

        work_session_id BIGINT NOT NULL,

        note TEXT NOT NULL,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_work_notes_session
          FOREIGN KEY (work_session_id)
          REFERENCES todo_work_sessions(id)
          ON DELETE CASCADE
      );
    `);

    console.log("todo_work_notes table created");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_todos_due_at ON todos(due_at);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_work_sessions_todo_id
      ON todo_work_sessions(todo_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_work_sessions_started_at
      ON todo_work_sessions(started_at);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_work_notes_session_id
      ON todo_work_notes(work_session_id);
    `);

    console.log("indexes created");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "DDL executed successfully",
      }),
    };
  } catch (error) {
    console.error("error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "DDL execution failed",
        error: error.message,
      }),
    };
  } finally {
    await client.end().catch(() => {});
  }
};
