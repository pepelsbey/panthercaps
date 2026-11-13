"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var parseSong = require("../tools/build").parseSong;

test("takes the title from the # line and the id from the file name", function () {
	assert.deepEqual(parseSong("treble.md", "# Treble\n\n> Em – D – Am\nCity lights\n"),
		{ id: "p:treble", title: "Treble", text: "> Em – D – Am\nCity lights" });
});

test("falls back to the file name without a # line", function () {
	assert.deepEqual(parseSong("Good times ahead.md", "First line\nSecond line"),
		{ id: "p:Good times ahead", title: "Good times ahead", text: "First line\nSecond line" });
});

test("doesn't take ## headings as the title", function () {
	assert.equal(parseSong("x.md", "## Verse\nLine").title, "x");
});

test("drops a BOM and converts CRLF line endings", function () {
	assert.deepEqual(parseSong("x.md", "\uFEFF# X\r\n\r\nOne\r\nTwo\r\n"), { id: "p:x", title: "X", text: "One\nTwo" });
});

test("trims blank lines around the lyrics but keeps the first line's indentation", function () {
	assert.equal(parseSong("x.md", "\n\n# X\n\n\n  Indented\n\n\n").text, "  Indented");
});

test("keeps blank lines inside the lyrics", function () {
	assert.equal(parseSong("x.md", "# X\nOne\n\nTwo").text, "One\n\nTwo");
});
