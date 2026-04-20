package middleware

import (
	"bufio"
	"log"
	"net"
	"net/http"
	"time"
)

type wrappedWriter struct {
	http.ResponseWriter
	status int
}

func (w *wrappedWriter) WriteHeader(status int) {
	w.ResponseWriter.WriteHeader(status)
	w.status = status
}

func (w *wrappedWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hijacker, ok := w.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, http.ErrNotSupported
	}
	return hijacker.Hijack()
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		wrapped := &wrappedWriter{
			ResponseWriter: w,
			status:         http.StatusOK,
		}

		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)

		userID := r.Header.Get("X-User-ID")
		if userID == "" {
			userID = "anonymous"
		}

		log.Printf(
			"%d %s %s %s user=%s",
			wrapped.status,
			r.Method,
			r.URL.Path,
			duration,
			userID,
		)
	})
}
