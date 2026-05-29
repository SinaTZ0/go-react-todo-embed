package todo

import (
	"io/fs"
	"net/http"

	dbgen "sinat/todo-go-backend/db/generated"
	todov1connect "sinat/todo-go-backend/gen/todo/v1/todov1connect"

	"connectrpc.com/connect"
	"connectrpc.com/validate"
)

// =========================================================================
// ROUTE REGISTRATION & MIDDLEWARE CHAINING
// =========================================================================

// RegisterRoutes registers the Connect-go service endpoints and static SPA filesystem onto the HTTP multiplexer.
// It wraps the router with Logger and CORS middlewares before returning it.
func RegisterRoutes(queries *dbgen.Queries, staticFS fs.FS) http.Handler {
	// Initialize a new http.ServeMux.
	mux := http.NewServeMux()

	// -----------------------------------------------------------------
	// ConnectRPC / gRPC API Endpoint
	// -----------------------------------------------------------------
	connectHandler := NewTodoConnectHandler(queries)
	valInterceptor := validate.NewInterceptor()

	connectPath, connectSvcHandler := todov1connect.NewTodoServiceHandler(
		connectHandler,
		connect.WithInterceptors(valInterceptor),
	)
	mux.Handle(connectPath, connectSvcHandler)

	// -----------------------------------------------------------------
	// Embedded Static Frontend SPA Endpoint
	// -----------------------------------------------------------------
	mux.Handle("/", NewSPAHandler(staticFS))

	// -----------------------------------------------------------------
	// Middleware Chaining
	// -----------------------------------------------------------------

	// We apply our middleware in a "wrap-around" fashion:
	// 1. The request first passes through CORS.
	// 2. Next, the request flows into Logger.
	// 3. Finally, the request is dispatched to the Connect handler.
	var handler http.Handler = mux
	handler = Logger(handler)
	handler = CORS(handler)

	return handler
}
