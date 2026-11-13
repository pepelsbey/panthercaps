"use strict";
// The app runs on iOS 12.5 Safari (iPad Mini 2): ES5 syntax only, and browser APIs are checked against
// the browserslist in package.json. The Node tools only run on the development machine.
var js = require("@eslint/js");
var globals = require("globals");
var compat = require("eslint-plugin-compat");

module.exports = [
	{ ignores: ["node_modules/", "dist/"] },
	js.configs.recommended,
	{
		files: ["src/**/*.js"],
		plugins: { compat: compat },
		languageOptions: {
			ecmaVersion: 5,
			sourceType: "script",
			// Promise isn't an ES5 global, but iOS 12 has it and service workers depend on it
			globals: Object.assign({}, globals.browser, globals.serviceworker, { Promise: "readonly", PRELOADED_SONGS: "readonly" })
		},
		rules: {
			"compat/compat": "error",
			// ES5 has no optional catch binding, so catch (e) is required even when e is unused
			"no-unused-vars": ["error", { caughtErrors: "none" }]
		}
	},
	{
		files: ["tools/**/*.js", "test/**/*.js", "*.config.js"],
		languageOptions: { sourceType: "commonjs", globals: globals.node }
	}
];
