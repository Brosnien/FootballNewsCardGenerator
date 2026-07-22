#!/usr/bin/env python3
"""Serve the app locally so you can try changes before pushing to Pages.

    python3 tools/serve.py        -> http://127.0.0.1:8765/generator-ios.html

Opening generator-ios.html straight off the disk does not work: the app fetches
teams.json, which file:// URLs block. Deliberately avoids os.getcwd() so it also
runs from a sandboxed shell.
"""
import functools
import http.server
import os
import socketserver

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8765

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as srv:
    print("serving %s\n  http://127.0.0.1:%d/generator-ios.html" % (ROOT, PORT),
          flush=True)
    srv.serve_forever()
