package todo

import (
	"io"
	"io/fs"
	"net/http"
	"strings"
)

// NewSPAHandler returns an http.Handler that serves the embedded SPA.
// If a requested file does not exist, it falls back to serving index.html.
func NewSPAHandler(staticFS fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Clean leading slash to look up in the embedded FS
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		// Check if the requested file actually exists in the embedded FS
		_, err := fs.Stat(staticFS, path)
		if err != nil {
			// File does not exist, serve index.html as fallback for SPA routing
			indexFile, err := staticFS.Open("index.html")
			if err != nil {
				http.Error(w, "index.html not found", http.StatusInternalServerError)
				return
			}
			defer indexFile.Close()

			stat, err := indexFile.Stat()
			if err != nil {
				http.Error(w, "index.html stat failed", http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			http.ServeContent(w, r, "index.html", stat.ModTime(), indexFile.(io.ReadSeeker))
			return
		}

		// Otherwise serve with standard FileServer
		http.FileServer(http.FS(staticFS)).ServeHTTP(w, r)
	})
}
