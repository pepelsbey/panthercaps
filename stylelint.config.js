"use strict";
// CSS features are checked against the browserslist in package.json (iOS 12.5 Safari).
// Ignored: features that iOS 12 supports only partially, where the parts used here do work.
module.exports = {
	plugins: ["stylelint-no-unsupported-browser-features"],
	rules: {
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
