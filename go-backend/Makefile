# Define your DB connection string
DB_URL=postgres://user:password@localhost:5432/go-todo
MIGRATIONS_DIR=db/migrations

# Update this line to match your actual targets
.PHONY: goose-up goose-down goose-create goose-reset goose-status sqlc-gen

# Run migrations up
# Example: make goose-up
goose-up:
	go tool goose -dir $(MIGRATIONS_DIR) postgres "$(DB_URL)" up

# Run migrations down
# Example: make goose-down
goose-down:
	go tool goose -dir $(MIGRATIONS_DIR) postgres "$(DB_URL)" down

# Create a new migration file
# Example: make goose-create name=add_users_table
goose-create:
	go tool goose -dir $(MIGRATIONS_DIR) create $(name) sql

# Reset all migrations
# Example: make goose-reset
goose-reset:
	go tool goose -dir $(MIGRATIONS_DIR) postgres "$(DB_URL)" reset

# Check migration status
# Example: make goose-status
goose-status:
	go tool goose -dir $(MIGRATIONS_DIR) postgres "$(DB_URL)" status

# sqlc code generation
# Example: make sqlc-gen
sqlc-gen:
	go tool sqlc generate
