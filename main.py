from http.server import SimpleHTTPRequestHandler, HTTPServer
import os
import webbrowser

WEB_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 8000

os.chdir(WEB_DIR)

handler = SimpleHTTPRequestHandler

print(f"Serving mollythedog.pages.dev replica from {WEB_DIR}")
print(f"Open http://localhost:{PORT}/index.html in your browser")
webbrowser.open(f"http://localhost:{PORT}/index.html")

with HTTPServer(("", PORT), handler) as httpd:
    httpd.serve_forever()