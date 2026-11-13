"use strict";
// src/preloaded.js is a browser script, not a module, so it's run here to get its global function
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var file = path.join(__dirname, "..", "src", "preloaded.js");
var mergePreloaded = vm.runInThisContext("(function () {\n" + fs.readFileSync(file, "utf8") + "\nreturn mergePreloaded;\n})()", { filename: file });

function song(id, title, text) { return { id: id, title: title, text: text }; }

test("adds new songs at the end, in the bundled order", function () {
	var songs = [song("l:1", "Mine", "la")], preloaded = {};
	mergePreloaded(songs, preloaded, [song("p:a", "A", "a"), song("p:b", "B", "b")]);
	assert.deepEqual(songs.map(function (s) { return s.id; }), ["l:1", "p:a", "p:b"]);
	assert.deepEqual(preloaded, { "p:a": { title: "A", text: "a" }, "p:b": { title: "B", text: "b" } });
});

test("updates a song whose file changed, if it wasn't edited on the device", function () {
	var songs = [song("p:a", "A", "old")], preloaded = { "p:a": { title: "A", text: "old" } };
	mergePreloaded(songs, preloaded, [song("p:a", "A2", "new")]);
	assert.deepEqual(songs, [song("p:a", "A2", "new")]);
	assert.deepEqual(preloaded["p:a"], { title: "A2", text: "new" });
});

test("keeps edits made on the device", function () {
	var songs = [song("p:a", "A", "edited")], preloaded = { "p:a": { title: "A", text: "old" } };
	mergePreloaded(songs, preloaded, [song("p:a", "A", "new")]);
	assert.deepEqual(songs, [song("p:a", "A", "edited")]);
	assert.deepEqual(preloaded["p:a"], { title: "A", text: "new" });
});

test("doesn't bring back a song deleted on the device", function () {
	var songs = [], preloaded = { "p:a": { title: "A", text: "a" } };
	mergePreloaded(songs, preloaded, [song("p:a", "A", "changed")]);
	assert.deepEqual(songs, []);
});

test("leaves a song alone if it's on the device but wasn't recorded as delivered", function () {
	var songs = [song("p:a", "A", "mine")], preloaded = {};
	mergePreloaded(songs, preloaded, [song("p:a", "A", "bundled")]);
	assert.deepEqual(songs, [song("p:a", "A", "mine")]);
	assert.deepEqual(preloaded["p:a"], { title: "A", text: "bundled" });
});
