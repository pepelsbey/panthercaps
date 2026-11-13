"use strict";
// Talks to the iPad's real Web Inspector via ios_webkit_debug_proxy (port 9300, page 1).
// Usage: node tools/inspector.js eval '<js>'
//        node tools/inspector.js shot <out.png>      screenshot of the page (Page.snapshotRect)
//        node tools/inspector.js console [ms]        print console messages for ms (default 3000)
var fs = require("fs");
var PORT = process.env.IWDP_PORT || 9300;
var PAGE = process.env.IWDP_PAGE || null; // default: newest page the proxy lists
var cmd = process.argv[2], arg = process.argv[3];

var ws, id = 0, pending = {};
var targetId = null, targetWaiters = [];
// iOS 12.2+ wraps page commands in the Target domain
function call(method, params) {
	return new Promise(function (resolve, reject) {
		pending[++id] = { resolve: resolve, reject: reject };
		var inner = JSON.stringify({ id: id, method: method, params: params || {} });
		ws.send(JSON.stringify({ id: 100000 + id, method: "Target.sendMessageToTarget", params: { targetId: targetId, message: inner } }));
	});
}
function connect() {
	ws = new WebSocket("ws://localhost:" + PORT + "/devtools/page/" + PAGE);
	ws.onmessage = function (m) {
		var msg = JSON.parse(m.data);
		if (msg.method === "Target.targetCreated") {
			targetId = msg.params.targetInfo.targetId;
			targetWaiters.forEach(function (f) { f(); });
			return;
		}
		if (msg.method === "Target.dispatchMessageFromTarget") msg = JSON.parse(msg.params.message);
		else if (msg.id) return; // outer ack/error
		if (msg.id && pending[msg.id]) {
			var p = pending[msg.id]; delete pending[msg.id];
			if (msg.error) p.reject(new Error(JSON.stringify(msg.error))); else p.resolve(msg.result);
		} else if (msg.method === "Console.messageAdded" && cmd === "console") {
			var c = msg.params.message;
			console.log(c.level, c.text);
		}
	};
	ws.onerror = function () { console.error("cannot connect: is ios_webkit_debug_proxy running, and is the Safari inspector window closed?"); process.exit(1); };
	ws.onopen = function () {
		new Promise(function (res) { if (targetId) res(); else targetWaiters.push(res); }).then(run).then(function () { process.exit(0); }, function (e) { console.error("ERROR:", e.message); process.exit(1); });
	};
}

if (PAGE) connect();
else fetch("http://localhost:" + PORT + "/json").then(function (r) { return r.json(); }).then(function (pages) {
	if (!pages.length) throw new Error("no pages listed");
	PAGE = pages[pages.length - 1].webSocketDebuggerUrl.split("/").pop();
	connect();
}).catch(function (e) { console.error("cannot reach proxy:", e.message); process.exit(1); });

async function run() {
	if (cmd === "eval") {
		var r = await call("Runtime.evaluate", { expression: arg, returnByValue: true, awaitPromise: true });
		console.log(JSON.stringify(r.result.value !== undefined ? r.result.value : r.result, null, 1));
	} else if (cmd === "shot") {
		var dims = await call("Runtime.evaluate", { expression: "[innerWidth, innerHeight]", returnByValue: true });
		var s = await call("Page.snapshotRect", { x: 0, y: 0, width: dims.result.value[0], height: dims.result.value[1], coordinateSystem: "Viewport" });
		fs.writeFileSync(arg, Buffer.from(s.dataURL.split(",")[1], "base64"));
		console.log("saved", arg);
	} else if (cmd === "console") {
		await call("Console.enable");
		await new Promise(function (res) { setTimeout(res, Number(arg) || 3000); });
	} else {
		throw new Error("unknown command");
	}
}
