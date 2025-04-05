import http.server
import socketserver
import os

PORT = 5000

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # If path is "/" or empty, serve index.html
        if self.path == "/" or self.path == "":
            self.path = "/index.html"
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

if __name__ == "__main__":
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"Serving at http://0.0.0.0:{PORT}")
        httpd.serve_forever()