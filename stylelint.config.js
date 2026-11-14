"use strict";
// CSS features are checked against the browserslist in package.json (iOS 12.5 Safari).
// Ignored: features that iOS 12 supports only partially, where the parts used here do work.
module.exports = {
	plugins: ["stylelint-no-unsupported-browser-features"],
	rules: {
		// Classes only, named in BEM (.block, .block__element, .block--modifier), so specificity stays flat
		// and the order of src/styles/index.css decides what wins
		"selector-max-id": 0,
		"selector-max-specificity": "0,2,0",
		"selector-class-pattern": ["^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$", {
			message: function (selector) { return "Expected class " + selector + " to be in BEM: block__element--modifier"; }
		}],
		"declaration-no-important": true,
		"plugin/no-unsupported-browser-features": [true, {
			severity: "error",
			ignore: [
				"css-touch-action", // only auto and manipulation are supported, and manipulation is what's used
				"pointer", // reported for touch-action, not for Pointer Events, which aren't used
				"css-overflow", // only overflow: clip and the two-value syntax are missing
				"css-appearance", // supported with the -webkit- prefix, which is always set
				"css-gradients", // the prefixed and standard linear-gradient() both work
				"css-resize" // there's no resize handle on iOS anyway, resize: none is for desktop
			]
		}]
	}
};
