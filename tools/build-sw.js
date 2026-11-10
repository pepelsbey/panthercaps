"use strict";
// Stamps sw.js with a hash of the app files. Run after every change, before publishing: node tools/build-sw.js
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var dir = path.join(__dirname, "..");
var h = crypto.createHash("sha1");
["index.html", "style.css", "app.js", "icon.png", "manifest.webmanifest"].forEach(function (f) { h.update(fs.readFileSync(path.join(dir, f))); });
var v = h.digest("hex").slice(0, 10);
var sw = fs.readFileSync(path.join(dir, "sw.js"), "utf8").replace(/var VERSION = "[^"]*";/, 'var VERSION = "' + v + '";');
fs.writeFileSync(path.join(dir, "sw.js"), sw);
console.log("sw.js version", v);
