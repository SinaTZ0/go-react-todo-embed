-- name: CreateTodo :one
INSERT INTO todos (title, description)
VALUES ($1, $2)
RETURNING *;

-- name: GetTodo :one
SELECT * FROM todos
WHERE id = $1 LIMIT 1;

-- name: ListTodos :many
SELECT * FROM todos
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateTodo :one
UPDATE todos
SET title = $2,
    description = $3,
    completed = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteTodo :exec
DELETE FROM todos
WHERE id = $1;
