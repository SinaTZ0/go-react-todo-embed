package todo

import (
	"log"
	"net/http"
	"time"
)

// =========================================================================
// RESPONSE WRITER DECORATOR
// =========================================================================

// responseWriter is a custom decorator/wrapper around the standard
// http.ResponseWriter.
// By default, Go's http.ResponseWriter does not allow us to read the HTTP
// status code after it has been written (e.g., using WriteHeader). To log the
// status code in our Logger middleware, we intercept calls to WriteHeader and
// record the code.
type responseWriter struct {
	http.ResponseWriter
	statusCode  int
	wroteHeader bool
}

// newResponseWriter is a helper function to initialize our custom wrapper.
// We default statusCode to 200 OK because if a handler does not explicitly call
// WriteHeader, Go's net/http package implicitly sends a 200 OK.
func newResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{
		ResponseWriter: w,
		statusCode:     http.StatusOK,
	}
}

// WriteHeader overrides the standard http.ResponseWriter.WriteHeader method.
// It intercepts the status code, stores it for logging purposes, and then delegates
// the call to the underlying ResponseWriter.
func (rw *responseWriter) WriteHeader(code int) {
	if rw.wroteHeader {
		return
	}
	rw.statusCode = code
	rw.wroteHeader = true
	rw.ResponseWriter.WriteHeader(code)
}

// Write overrides the standard http.ResponseWriter.Write method.
// If WriteHeader wasn't called before writing data, Go implicitly writes a 200 OK.
// We intercept this and record the status code before writing to the socket.
func (rw *responseWriter) Write(buf []byte) (int, error) {
	if !rw.wroteHeader {
		rw.WriteHeader(http.StatusOK)
	}
	return rw.ResponseWriter.Write(buf)
}

// =========================================================================
// MIDDLEWARE IMPLEMENTATIONS
// =========================================================================

// Logger is a middleware function that logs the details of every incoming HTTP request.
// It records the HTTP method, path, remote client address, returned status code,
// and the total time taken to process the request.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Record the time before executing the request
		start := time.Now()

		// Wrap the standard response writer with our custom decorator
		rw := newResponseWriter(w)

		// Call the next handler in the chain, passing our wrapped writer
		next.ServeHTTP(rw, r)

		// Calculate the elapsed time
		duration := time.Since(start)

		// Log the request details using the standard log package.
		// Format: Method | Status Code | Path | Client IP | Duration
		log.Printf(
			"[%s] %d %s %s - %v",
			r.Method,
			rw.statusCode,
			r.URL.Path,
			r.RemoteAddr,
			duration,
		)
	})
}

// CORS is a middleware function that enables Cross-Origin Resource Sharing (CORS).
// This is critical when connecting a frontend application (like a React app running
// on http://localhost:5173) to a backend running on a different port (like :8080).
// Without these headers, modern browsers will block the requests due to Same-Origin Policy.
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set headers to allow requests from any origin.
		// In a production environment, you should replace "*" with your actual frontend domain
		// (e.g., "http://localhost:5173") for better security.
		w.Header().Set("Access-Control-Allow-Origin", "*")

		// Define which HTTP methods are permitted for cross-origin requests.
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		// Specify which headers can be sent during the actual request (e.g., JSON content type, auth tokens).
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Connect-Protocol-Version")

		// Handle preflight requests.
		// Browsers send an HTTP OPTIONS request before executing modifying requests (POST, PUT, DELETE)
		// to verify that the server allows the action. If it is an OPTIONS request, we respond
		// immediately with a 204 No Content status and terminate the request cycle.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// If it's a normal request, pass it to the next handler in the chain.
		next.ServeHTTP(w, r)
	})
}
