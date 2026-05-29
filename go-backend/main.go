package main

import (
	"context"
	"database/sql"
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	dbgen "sinat/todo-go-backend/db/generated"
	todo "sinat/todo-go-backend/todo-pack"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

//go:embed all:dist
var staticFS embed.FS

//go:embed db/migrations/*.sql
var embedMigrations embed.FS

// =========================================================================
// APPLICATION ENTRYPOINT
// =========================================================================

func main() {
	// Initialize a root context. This context will be used to initialize the
	// database connection pool.
	ctx := context.Background()

	// 1. Get Database URL
	// We read the database connection string from environment variables.
	// This is a standard Twelve-Factor App practice. If not set, we fall back to a local default database.
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://user:password@localhost:5432/go-todo"
	}

	// Log that we are attempting to connect
	log.Printf("Connecting to database at %s...", dbURL)

	// 2. Initialize pgxpool.Pool
	// A connection pool manages multiple database connections concurrently.
	// This is required for HTTP servers because each request runs in its own goroutine,
	// and sharing a single raw database connection is not thread-safe.
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v\n", err)
	}
	// Ensure the pool is closed when the main function terminates.
	defer pool.Close()

	// 3. Ping the database
	// Establishing the pool structure does not guarantee that the database is reachable.
	// We ping the database on startup to confirm credentials and connection status.
	// We set a 5-second timeout so the program fails quickly if the DB is down.
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		log.Fatalf("Failed to ping database: %v\n", err)
	}
	log.Println("Successfully connected to the database!")

	// 3.5. Run Database Migrations
	runMigrations(dbURL)

	// 4. Initialize sqlc Queries
	// Instantiate the generated sqlc package with our thread-safe pgxpool.
	queries := dbgen.New(pool)

	// 5. Initialize Handlers and Routes
	// Build the HTTP route mapping for the Connect-go service and static files.
	subFS, err := fs.Sub(staticFS, "dist")
	if err != nil {
		log.Fatalf("Failed to create sub-filesystem: %v\n", err)
	}
	todoRouter := todo.RegisterRoutes(queries, subFS)

	// 6. Set up the HTTP Server
	// We configure a custom http.Server struct. Setting read/write timeouts is highly
	// recommended for production to prevent resource leaks from slow clients.
	// We also configure it to serve both HTTP/1.1 and unencrypted HTTP/2 (h2c).
	p := new(http.Protocols)
	p.SetHTTP1(true)
	p.SetUnencryptedHTTP2(true)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Fallback to 8080 for local development
	}

	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      todoRouter,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		Protocols:    p,
	}

	// ToRead: advance shutting down handeling which involve OS too

	// 7. Implement Graceful Shutdown
	// Instead of letting the app crash instantly on CTRL+C (SIGINT) or Kubernetes stop (SIGTERM),
	// we handle the shutdown gracefully. This allows the server to complete in-flight requests,
	// clean up connections, and close sockets without dropping active user requests.
	shutdownError := make(chan error)

	// Start the HTTP server in a separate background goroutine.
	go func() {
		log.Printf("Starting Todo API server on port %s", port)
		// ListenAndServe returns http.ErrServerClosed when the server shuts down gracefully.
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			shutdownError <- err
		}
	}()

	// Create a channel to listen for OS signals.
	quit := make(chan os.Signal, 1)
	// Notify the 'quit' channel when the process receives SIGINT (Ctrl+C) or SIGTERM.
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	// Block main execution until a quit signal or an active startup error occurs.
	select {
	case err := <-shutdownError:
		log.Fatalf("Server startup failed: %v", err)
	case sig := <-quit:
		log.Printf("Received signal: %v. Initiating graceful shutdown...\n", sig)
	}

	// Give active HTTP requests a 10-second grace period to finish before closing.
	shutdownCtx, shutdownCancel := context.WithTimeout(ctx, 10*time.Second)
	defer shutdownCancel()

	// Shutdown the HTTP listener. It stops accepting new requests immediately
	// and waits for current requests to finish processing.
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server shutdown error: %v. Forcing close...\n", err)
		if err := server.Close(); err != nil {
			log.Fatalf("Server force-close failed: %v\n", err)
		}
	}

	log.Println("Server exited cleanly.")
}

// runMigrations handles migrating the Postgres database using embedded SQL files via goose.
func runMigrations(dbURL string) {
	log.Println("Running embedded database migrations...")

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("goose: failed to open database connection: %v\n", err)
	}
	defer db.Close()

	goose.SetBaseFS(embedMigrations)

	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatalf("goose: failed to set dialect: %v\n", err)
	}

	if err := goose.Up(db, "db/migrations"); err != nil {
		log.Fatalf("goose: failed to run migrations: %v\n", err)
	}
	log.Println("Database migrations applied successfully!")
}
