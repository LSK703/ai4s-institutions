"""Serve the site on all network interfaces so phones/other PCs can open it."""
from __future__ import annotations

import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = 5173
ROOT = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def lan_ips() -> list[str]:
    ips: list[str] = []
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip.startswith("127.") or ip in ips:
                continue
            ips.append(ip)
    except OSError:
        pass
    if not ips:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            sock.connect(("8.8.8.8", 80))
            ips.append(sock.getsockname()[0])
        except OSError:
            pass
        finally:
            sock.close()
    return ips


if __name__ == "__main__":
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("AI4S site is running.")
    print(f"  This computer:  http://127.0.0.1:{PORT}/")
    for ip in lan_ips():
        print(f"  Same Wi-Fi:     http://{ip}:{PORT}/")
    print("Keep this window open. Others on the same Wi-Fi can use the Same Wi-Fi address.")
    print("If a phone cannot open it, allow Python through Windows Firewall for private networks.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
