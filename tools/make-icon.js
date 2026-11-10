"use strict";
// Generates icon.png (180x180 apple-touch-icon): dark tile, yellow disc, black play triangle. No dependencies.
var zlib = require("zlib");
var fs = require("fs");
var path = require("path");
var N = 180, px = Buffer.alloc(N * (N * 3 + 1));
function inTri(x, y) { // right-pointing triangle
	var x0 = 70, x1 = 128, cy = 90, h = 34;
	if (x < x0 || x > x1) return false;
	return Math.abs(y - cy) <= h * (x1 - x) / (x1 - x0);
}
for (var y = 0; y < N; y++) {
	px[y * (N * 3 + 1)] = 0;
	for (var x = 0; x < N; x++) {
		var d = Math.sqrt((x - 90) * (x - 90) + (y - 90) * (y - 90));
		var c = [21, 21, 21];
		if (d < 62) c = inTri(x, y) ? [0, 0, 0] : [255, 214, 10];
		var o = y * (N * 3 + 1) + 1 + x * 3;
		px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
	}
}
function crc(buf) {
	var c, t = [], n, k, r = 0xffffffff;
	for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
	for (n = 0; n < buf.length; n++) r = t[(r ^ buf[n]) & 255] ^ (r >>> 8);
	return (r ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
	var len = Buffer.alloc(4); len.writeUInt32BE(data.length);
	var td = Buffer.concat([Buffer.from(type), data]);
	var c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
	return Buffer.concat([len, td, c]);
}
var ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.writeFileSync(path.join(__dirname, "..", "icon.png"), Buffer.concat([
	Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(px)), chunk("IEND", Buffer.alloc(0))
]));
