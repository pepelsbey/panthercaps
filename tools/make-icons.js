"use strict";
// Makes every icon size from src/icons/512.png. Run by hand after replacing that file, then commit the
// results: node tools/make-icons.js. Needs ImageMagick and zopflipng (brew install imagemagick zopfli).
//   32        favicon
//   152, 167  Home Screen on iPad (the iPad Mini 2 uses 152) and iPad Pro
//   180       Home Screen on iPhone
//   192, 512  web app manifest
var execFileSync = require("child_process").execFileSync;
var fs = require("fs");
var path = require("path");

var DIR = path.join(__dirname, "..", "src", "icons");
var SOURCE = path.join(DIR, "512.png");
var SIZES = [32, 152, 167, 180, 192];

function optimize(file) {
	// Lossless: the same pixels, smaller file
	execFileSync("zopflipng", ["-y", "--lossy_transparent", file, file], { stdio: "ignore" });
}

optimize(SOURCE);
SIZES.forEach(function (size) {
	var out = path.join(DIR, size + ".png");
	execFileSync("magick", [SOURCE, "-filter", "Lanczos", "-resize", size + "x" + size, "-strip", out]);
	optimize(out);
});
SIZES.concat(512).forEach(function (size) {
	var file = size + ".png";
	console.log(file, Math.round(fs.statSync(path.join(DIR, file)).size / 1024) + " KB");
});
