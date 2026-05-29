package todo

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// =========================================================================
// MIDDLEWARE & WRITER DECORATOR TESTS
// =========================================================================

// TestResponseWriterDecorator verifies that our custom responseWriter
// correctly records status codes (including implicit 200 OKs).
func TestResponseWriterDecorator(t *testing.T) {
	t.Run("Explicit Status Code", func(t *testing.T) {
		w := httptest.NewRecorder()
		rw := newResponseWriter(w)

		rw.WriteHeader(http.StatusAccepted)
		if rw.statusCode != http.StatusAccepted {
			t.Errorf("expected recorded status %d, got %d", http.StatusAccepted, rw.statusCode)
		}
	})

	t.Run("Implicit 200 OK", func(t *testing.T) {
		w := httptest.NewRecorder()
		rw := newResponseWriter(w)

		// Directly writing body data without calling WriteHeader should result in
		// an implicit status code of 200 OK.
		_, _ = rw.Write([]byte("some data"))
		if rw.statusCode != http.StatusOK {
			t.Errorf("expected implicit status %d, got %d", http.StatusOK, rw.statusCode)
		}
	})
}

// TestCORSMiddleware verifies that the CORS middleware sets headers and
// immediately handles preflight OPTIONS requests.
func TestCORSMiddleware(t *testing.T) {
	// Create a dummy final handler to verify request forwarding.
	finalHandlerCalled := false
	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		finalHandlerCalled = true
		w.WriteHeader(http.StatusOK)
	})

	// Wrap handler in CORS middleware
	corsHandler := CORS(dummyHandler)

	t.Run("OPTIONS Preflight Request", func(t *testing.T) {
		finalHandlerCalled = false
		req := httptest.NewRequest("OPTIONS", "/todos", nil)
		w := httptest.NewRecorder()

		corsHandler.ServeHTTP(w, req)

		// Preflight should return 204 No Content and NOT call the final handler
		if w.Code != http.StatusNoContent {
			t.Errorf("expected status %d, got %d", http.StatusNoContent, w.Code)
		}
		if finalHandlerCalled {
			t.Error("final handler should NOT have been called for preflight OPTIONS request")
		}

		// Verify CORS headers
		if w.Header().Get("Access-Control-Allow-Origin") != "*" {
			t.Errorf("unexpected origin header: %s", w.Header().Get("Access-Control-Allow-Origin"))
		}
	})

	t.Run("Standard Request", func(t *testing.T) {
		finalHandlerCalled = false
		req := httptest.NewRequest("GET", "/todos", nil)
		w := httptest.NewRecorder()

		corsHandler.ServeHTTP(w, req)

		// Standard requests should get forwarded to final handler
		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}
		if !finalHandlerCalled {
			t.Error("final handler should have been called")
		}

		// CORS headers must still be set
		if w.Header().Get("Access-Control-Allow-Origin") != "*" {
			t.Errorf("unexpected origin header: %s", w.Header().Get("Access-Control-Allow-Origin"))
		}
	})
}
