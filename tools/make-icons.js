"use strict";
// Makes every icon size from src/icons/logo.svg. Run by hand after changing that file, then commit the
// results: node tools/make-icons.js. Needs librsvg and zopflipng (brew install librsvg zopfli).
//   32        favicon, for browsers without SVG favicons
//   152, 167  Home Screen on iPad (the iPad Mini 2 uses 152) and iPad Pro
//   180       Home Screen on iPhone
//   192, 512  web app manifest
var execFileSync = require("child_process").execFileSync;
var fs = require("fs");
var path = require("path");

var DIR = path.join(__dirname, "..", "src", "icons");
var SOURCE = path.join(DIR, "logo.svg");
var SIZES = [32, 152, 167, 180, 192, 512];

SIZES.forEach(function (size) {
	var out = path.join(DIR, size + ".png");
	// Rendered from the vector at each size, so small icons stay sharp
	execFileSync("rsvg-convert", ["--width", String(size), "--height", String(size), "--output", out, SOURCE]);
	// Lossless: the same pixels, smaller file
	execFileSync("zopflipng", ["-y", out, out], { stdio: "ignore" });
	console.log(size + ".png", Math.round(fs.statSync(out).size / 1024) + " KB");
});
