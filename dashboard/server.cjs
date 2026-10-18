// Minimalny serwer lokalny. Bez zależności. Obsługuje wyłącznie folder aplikacji.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const port = Number(process.env.PORT) || 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
};
http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (pathname.includes("\0")) throw new Error("Nieprawidłowy adres");
    } catch {
      res.writeHead(400).end("Nieprawidłowy adres");
      return;
    }
    const file = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end("Brak dostępu");
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405).end();
      return;
    }
    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404).end("Nie znaleziono pliku");
        return;
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      if (req.method === "HEAD") res.end();
      else fs.createReadStream(file).pipe(res);
    });
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`VEYRO: http://127.0.0.1:${port}\nZatrzymaj serwer: Ctrl+C`),
  )
  .on("error", (e) => {
    console.error(
      e.code === "EADDRINUSE"
        ? `Port ${port} jest zajęty. Użyj PORT z inną wartością lub zatrzymaj poprzedni serwer.`
        : e.message,
    );
    process.exitCode = 1;
  });
