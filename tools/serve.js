"use strict";
// Dev-only static server for dist/. Rebuilds it whenever the page is loaded, so a reload picks up changes
// to the app files and lyrics. Usage: npm start, or node tools/serve.js [port]
var http = require("http");
var fs = require("fs");
var path = require("path");
var os = require("os");
var build = require("./build");

var ROOT = path.join(__dirname, "..", "dist");
var PORT = Number(process.argv[2]) || 8080;
var TYPES = {
	".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8",
	".png": "image/png", ".webmanifest": "application/manifest+json"
};

build();

http.createServer(function (req, res) {
	var url;
	try { url = decodeURIComponent(req.url.split("?")[0]); } catch { res.writeHead(400); return res.end("Bad URL"); }
	if (url.slice(-1) === "/") url += "index.html";
	if (url === "/index.html") {
		try { build(); } catch (e) { console.error("Build failed:", e.message); }
	}
	var file = path.join(ROOT, url);
	if (file.indexOf(ROOT + path.sep) !== 0) { res.writeHead(403); return res.end(); }
	fs.readFile(file, function (err, data) {
		if (err) { res.writeHead(404); return res.end("Not found"); }
		console.log(new Date().toISOString(), req.socket.remoteAddress, req.method, req.url);
		res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
		res.end(data);
	});
}).listen(PORT, "0.0.0.0", function () {
	console.log("Serving the app at:");
	var ifs = os.networkInterfaces();
	Object.keys(ifs).forEach(function (n) {
		ifs[n].forEach(function (a) { if (a.family === "IPv4" && !a.internal) console.log("  http://" + a.address + ":" + PORT); });
	});
	console.log("  http://localhost:" + PORT);
});
