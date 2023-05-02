from http.server import BaseHTTPRequestHandler
from fasttext import load_model

 
class handler(BaseHTTPRequestHandler):
 
    def do_GET(self):
        classifier = load_model("model/model_commits_v2_quant.bin")
        self.send_response(200)
        self.send_header('Content-type','text/plain')
        self.end_headers()
        self.wfile.write('Hello, world!'.encode('utf-8'))
        return