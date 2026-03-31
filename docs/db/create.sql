CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    cognito_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS idx_todos_user_id
    ON todos(user_id);

CREATE INDEX IF NOT EXISTS idx_todos_due_at
    ON todos(due_at);

CREATE INDEX IF NOT EXISTS idx_todos_status
    ON todos(status);