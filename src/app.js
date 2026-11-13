/* Panthercaps: written in ES5 for iOS 12 Safari (no ?., ??, modules, etc.) */
(function () {
	"use strict";

	var KEY_SONGS = "pc.songs";
	var KEY_SETTINGS = "pc.settings";
	var KEY_PRELOADED = "pc.preloaded";
	var DEFAULTS = { size: 56, speed: 30 };
	// Speed is in pixels per second at the default size, and scales with the text size, so resizing keeps
	// the pace in lines. 5 is already ~15 s per line; 100 is ~0.8 s.
	var SIZE_MIN = 24, SIZE_MAX = 120, SIZE_STEP = 4;
	var SPEED_MIN = 5, SPEED_MAX = 100, SPEED_STEP = 5;

	function $(id) { return document.getElementById(id); }

	function load(key, fallback) {
		try {
			var v = window.localStorage.getItem(key);
			return v ? JSON.parse(v) : fallback;
		} catch (e) { return fallback; }
	}
	function save(key, value) {
		try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { setStatus("Could not save (storage full or private mode)"); }
	}

	var songs = load(KEY_SONGS, []);
	var settings = load(KEY_SETTINGS, {});

	// Songs bundled from lyrics/*.md, see preloaded.js. KEY_PRELOADED remembers what was last delivered.
	var preloaded = load(KEY_PRELOADED, {});
	window.mergePreloaded(songs, preloaded, window.PRELOADED_SONGS || []);
	save(KEY_SONGS, songs);
	save(KEY_PRELOADED, preloaded);
	var current = -1; // index in songs
	var editingId = null;
	var editOriginal = null; // the fields as opened, to tell if Cancel would lose changes
	var editFrom = "list";   // where Cancel/Save return to
	var editScroll = 0;      // prompter scroll position to restore after editing
	var reordering = false;

	var views = { list: $("list-view"), edit: $("edit-view"), export: $("export-view"), prompter: $("prompter-view") };
	var shown = "list";
	function show(name) {
		for (var k in views) if (Object.prototype.hasOwnProperty.call(views, k)) views[k].classList.toggle("hidden", k !== name);
		shown = name;
		// The editor lets iOS scroll the page to keep the caret above the keyboard; undo that on the way out
		window.scrollTo(0, 0);
	}

	var statusTimer = 0;
	function setStatus(msg) {
		$("status").textContent = msg || "";
		clearTimeout(statusTimer);
		if (msg) statusTimer = setTimeout(function () { $("status").textContent = ""; }, 4000);
	}

	/* ---------- song list ---------- */

	/* Drag to reorder (touch for iOS 12, mouse for desktop testing). Neighbours are moved around the
	   dragged row, so its DOM node stays attached and keeps receiving touch events. */
	var drag = null;

	var PENCIL_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';

	function midOf(el) { var r = el.getBoundingClientRect(); return r.top + r.height / 2; }

	function placeDrag() {
		var ul = $("song-list"), li = drag.li, ur = ul.getBoundingClientRect();
		li.style.transform = "none";
		var h = li.getBoundingClientRect().height;
		var top = Math.max(ur.top - h / 2, Math.min(ur.bottom - h / 2, drag.y - drag.grab));
		var center = top + h / 2, moved, prev, next;
		do {
			moved = false;
			prev = li.previousElementSibling;
			next = li.nextElementSibling;
			if (prev && center < midOf(prev)) { ul.insertBefore(prev, li.nextSibling); moved = true; }
			else if (next && center > midOf(next)) { ul.insertBefore(next, li); moved = true; }
		} while (moved);
		li.style.transform = "translateY(" + (top - li.getBoundingClientRect().top) + "px)";
	}

	function dragTick() {
		var ur = $("song-list").getBoundingClientRect(), zone = 80, v = 0;
		if (drag.y < ur.top + zone) v = -Math.ceil(12 * (ur.top + zone - drag.y) / zone);
		else if (drag.y > ur.bottom - zone) v = Math.ceil(12 * (drag.y - (ur.bottom - zone)) / zone);
		if (v) $("song-list").scrollTop += v;
		placeDrag();
	}

	function beginDrag(li, y) {
		if (drag) return;
		drag = { li: li, y: y, grab: y - li.getBoundingClientRect().top, timer: setInterval(dragTick, 16) };
		li.classList.add("dragging");
		placeDrag();
	}

	function endDrag() {
		if (!drag) return;
		clearInterval(drag.timer);
		var byId = {};
		songs.forEach(function (x) { byId[x.id] = x; });
		songs = Array.prototype.map.call($("song-list").children, function (el) { return byId[el.getAttribute("data-id")]; });
		drag = null;
		save(KEY_SONGS, songs);
		renderList();
	}

	function onMouseMove(e) { if (drag) { drag.y = e.clientY; placeDrag(); } }
	function onMouseUp() {
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
		endDrag();
	}

	function makeGrip(li) {
		var g = document.createElement("div");
		g.className = "grip";
		g.addEventListener("touchstart", function (e) { e.preventDefault(); beginDrag(li, e.touches[0].clientY); }, false);
		g.addEventListener("touchmove", function (e) { e.preventDefault(); if (drag) { drag.y = e.touches[0].clientY; placeDrag(); } }, false);
		g.addEventListener("touchend", endDrag, false);
		g.addEventListener("touchcancel", endDrag, false);
		g.addEventListener("mousedown", function (e) {
			e.preventDefault();
			beginDrag(li, e.clientY);
			document.addEventListener("mousemove", onMouseMove, false);
			document.addEventListener("mouseup", onMouseUp, false);
		}, false);
		return g;
	}

	function renderList() {
		var ul = $("song-list");
		var top = ul.scrollTop;
		ul.innerHTML = "";
		if (songs.length < 2) reordering = false;
		$("btn-reorder").classList.toggle("hidden", songs.length < 2);
		$("btn-reorder").textContent = reordering ? "Done" : "Reorder";
		$("btn-reorder").classList.toggle("primary", reordering);
		$("btn-new").classList.toggle("hidden", reordering);
		$("btn-export").classList.toggle("hidden", reordering || !songs.length);
		if (!songs.length) {
			var li = document.createElement("li");
			li.className = "empty";
			li.textContent = "No songs yet. Tap + New to add one.";
			ul.appendChild(li);
			return;
		}
		var pad = String(songs.length).replace(/\d/g, "0"); // "00" for 10–99 songs
		songs.forEach(function (song, i) {
			var li = document.createElement("li");
			li.setAttribute("data-id", song.id);
			var t = document.createElement("div");
			t.className = "title";
			var n = document.createElement("span");
			n.className = "num";
			// Zero-padded to the longest number, so titles stay aligned past 9 songs
			n.textContent = (pad + (i + 1)).slice(-pad.length) + ".";
			t.appendChild(n);
			t.appendChild(document.createTextNode(song.title));
			li.appendChild(t);
			if (reordering) {
				li.appendChild(makeGrip(li));
			} else {
				t.addEventListener("click", function () { openSong(i); });
				var e = document.createElement("button");
				e.className = "btn edit";
				e.setAttribute("aria-label", "Edit " + song.title);
				e.innerHTML = PENCIL_ICON;
				e.addEventListener("click", function () { openEditor(song.id); });
				li.appendChild(e);
			}
			ul.appendChild(li);
		});
		ul.scrollTop = top;
	}

	/* ---------- editor ---------- */

	function openEditor(id, from) {
		editFrom = from || "list";
		editingId = id;
		var song = null;
		songs.forEach(function (s) { if (s.id === id) song = s; });
		$("edit-title").value = song ? song.title : "";
		$("edit-text").value = song ? song.text : "";
		editOriginal = { title: $("edit-title").value, text: $("edit-text").value };
		$("btn-edit-delete").classList.toggle("hidden", !song);
		show("edit");
	}

	function cancelEdit() {
		var changed = $("edit-title").value !== editOriginal.title || $("edit-text").value !== editOriginal.text;
		if (changed && !window.confirm("Discard your changes?")) return;
		if (editFrom === "prompter") returnToPrompter(false); else show("list");
	}

	function saveEdit() {
		var title = $("edit-title").value.replace(/^\s+|\s+$/g, "") || "Untitled";
		var text = $("edit-text").value.replace(/\r\n?/g, "\n");
		var found = false;
		songs.forEach(function (s) {
			if (s.id === editingId) {
				s.title = title; s.text = text; found = true;
			}
		});
		if (!found) songs.push({ id: "l:" + Date.now(), title: title, text: text });
		save(KEY_SONGS, songs);
		renderList();
		if (editFrom === "prompter" && found) returnToPrompter(true); else show("list");
	}

	// Back to the playback screen after editing, at the same place in the lyrics
	function returnToPrompter(reload) {
		if (reload) openSong(current); else show("prompter");
		scroller.scrollTop = editScroll;
		pos = editScroll;
		editFrom = "list";
	}

	function deleteEdit() {
		if (!window.confirm("Delete this song?")) return;
		songs = songs.filter(function (s) { return s.id !== editingId; });
		save(KEY_SONGS, songs);
		delete settings[editingId];
		save(KEY_SETTINGS, settings);
		editFrom = "list";
		renderList();
		show("list");
	}

	/* ---------- export ---------- */

	/* Songs live only on the device, so this is the backup: the whole setlist in the lyrics/*.md format, each
	   song starting with its "# Title" line. Copy it out and split it into files to keep it in the repo. */
	function openExport() {
		$("export-text").value = songs.map(function (s) {
			return "# " + s.title + "\n\n" + s.text.replace(/\s+$/, "") + "\n";
		}).join("\n\n");
		$("btn-export-copy").textContent = "Copy";
		show("export");
		$("export-text").scrollTop = 0;
	}

	// iOS 12 has no Clipboard API. Selecting a read-only textarea and running the copy command works there
	// without bringing up the keyboard; if it fails, the text stays selected for Copy in the iOS menu.
	function copyExport() {
		var ta = $("export-text"), ok = false;
		ta.select();
		ta.setSelectionRange(0, ta.value.length);
		try { ok = document.execCommand("copy"); } catch (e) { /* stays selected */ }
		$("btn-export-copy").textContent = ok ? "Copied" : "Selected";
	}

	/* ---------- offline status ---------- */

	// Only shown once everything is cached; otherwise there is nothing the user can act on
	function initOffline() {
		if (!("serviceWorker" in navigator)) return;
		navigator.serviceWorker.register("sw.js").then(function () {
			return navigator.serviceWorker.ready;
		}).then(function () {
			var b = $("offline-badge");
			b.textContent = "✓ Offline";
			b.className = "badge ok";
		}, function () {});
		// Ask the browser not to evict our data (not supported on older iOS)
		if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
	}

	// Installed Home Screen apps on iOS keep their own storage, separate from Safari tabs. Shown once.
	var KEY_HINT = "pc.hintDismissed";
	if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !navigator.standalone && !load(KEY_HINT, false)) {
		$("hint").classList.remove("hidden");
	}
	$("hint").addEventListener("click", function () {
		$("hint").classList.add("hidden");
		save(KEY_HINT, true);
	});

	/* ---------- prompter ---------- */

	var scroller = $("scroller");
	var lyrics = $("lyrics");
	var playing = false;
	var pos = 0;
	var lastT = 0;
	var rafId = 0;
	var cfg = { size: DEFAULTS.size, speed: DEFAULTS.speed };
	// Chords and cues are Markdown blockquotes ("> Em – D – Am"), the same as in lyrics/*.md. [Chorus], (Chorus)
	// and bare section names are still highlighted for songs written before that.
	var SECTION_RE = /^\s*(>.*|\[.*\]|\(.*\)|(intro|verse|pre-?chorus|chorus|bridge|solo|interlude|outro|refrain|hook)\b[^a-z]*\d*\s*:?)\s*$/i;

	function renderLyrics(song) {
		lyrics.innerHTML = "";
		var title = document.createElement("div");
		title.className = "line song-title";
		title.textContent = song.title;
		lyrics.appendChild(title);
		song.text.split("\n").forEach(function (line) {
			var d = document.createElement("div");
			if (/^\s*$/.test(line)) {
				d.className = "gap";
			} else {
				d.className = "line" + (SECTION_RE.test(line) ? " section" : "");
				d.textContent = line.replace(/^\s*>\s*/, "").replace(/^\[(.*)\]$/, "$1");
			}
			lyrics.appendChild(d);
		});
	}

	function applyCfg() {
		lyrics.style.fontSize = cfg.size + "px";
		$("size-val").textContent = cfg.size;
		$("speed-val").textContent = cfg.speed;
		// Dim the buttons that can't go any further
		$("btn-smaller").disabled = cfg.size <= SIZE_MIN;
		$("btn-bigger").disabled = cfg.size >= SIZE_MAX;
		$("btn-slower").disabled = cfg.speed <= SPEED_MIN;
		$("btn-faster").disabled = cfg.speed >= SPEED_MAX;
	}

	// Saved only when changed, so songs left at the defaults follow any later change to DEFAULTS
	function changeCfg(name, delta, min, max) {
		cfg[name] = clamp(cfg[name] + delta, min, max);
		applyCfg();
		settings[songs[current].id] = { size: cfg.size, speed: cfg.speed };
		save(KEY_SETTINGS, settings);
	}

	function openSong(i) {
		if (i < 0 || i >= songs.length) return;
		stop();
		current = i;
		var saved = settings[songs[i].id] || {};
		// Clamp so values saved under older, wider limits stay valid
		cfg.size = clamp(saved.size || DEFAULTS.size, SIZE_MIN, SIZE_MAX);
		cfg.speed = clamp(saved.speed != null ? saved.speed : DEFAULTS.speed, SPEED_MIN, SPEED_MAX);
		renderLyrics(songs[i]);
		show("prompter");
		applyCfg();
		// Greyed out when there is no previous or next song
		$("btn-prev").disabled = i === 0;
		$("btn-next").disabled = i === songs.length - 1;
		scroller.scrollTop = 0;
		pos = 0;
	}

	function tick(t) {
		if (!playing) return;
		var dt = Math.min(t - lastT, 100); // clamp after stalls
		lastT = t;
		// If scrollTop differs from our float position the user moved it; follow them
		if (Math.abs(scroller.scrollTop - pos) > 2) pos = scroller.scrollTop;
		pos += cfg.speed * (cfg.size / DEFAULTS.size) * dt / 1000;
		scroller.scrollTop = pos;
		var max = scroller.scrollHeight - scroller.clientHeight;
		if (pos >= max) { pos = max; stop(); return; }
		rafId = window.requestAnimationFrame(tick);
	}

	function play() {
		if (playing) return;
		playing = true;
		pos = scroller.scrollTop;
		lastT = performance.now ? performance.now() : Date.now();
		$("btn-play").classList.add("playing");
		$("prompter-view").classList.add("playing");
		$("btn-play").setAttribute("aria-label", "Pause");
		rafId = window.requestAnimationFrame(tick);
	}

	function stop() {
		playing = false;
		window.cancelAnimationFrame(rafId);
		$("btn-play").classList.remove("playing");
		$("prompter-view").classList.remove("playing");
		$("btn-play").setAttribute("aria-label", "Play");
	}

	function toggle() { if (playing) stop(); else play(); }

	function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

	// Touching the lyrics pauses; a plain tap toggles play/pause
	var pausedByTouch = false;
	scroller.addEventListener("touchstart", function () {
		pausedByTouch = playing;
		if (playing) stop();
	}, false);
	scroller.addEventListener("click", function () {
		if (pausedByTouch) { pausedByTouch = false; return; }
		toggle();
	}, false);

	/* ---------- wiring ---------- */

	$("btn-reorder").addEventListener("click", function () { reordering = !reordering; renderList(); });
	$("btn-new").addEventListener("click", function () { openEditor(null); });
	$("btn-export").addEventListener("click", openExport);
	$("btn-export-done").addEventListener("click", function () { show("list"); });
	$("btn-export-copy").addEventListener("click", copyExport);
	$("btn-edit-cancel").addEventListener("click", cancelEdit);
	$("btn-edit-song").addEventListener("click", function () {
		stop();
		editScroll = scroller.scrollTop;
		openEditor(songs[current].id, "prompter");
	});
	$("btn-edit-save").addEventListener("click", saveEdit);
	$("btn-edit-delete").addEventListener("click", deleteEdit);

	$("btn-back").addEventListener("click", function () { stop(); show("list"); });
	$("btn-play").addEventListener("click", toggle);
	$("btn-prev").addEventListener("click", function () { openSong(current - 1); });
	$("btn-next").addEventListener("click", function () { openSong(current + 1); });
	$("btn-top").addEventListener("click", function () { scroller.scrollTop = 0; pos = 0; });
	$("btn-slower").addEventListener("click", function () { changeCfg("speed", -SPEED_STEP, SPEED_MIN, SPEED_MAX); });
	$("btn-faster").addEventListener("click", function () { changeCfg("speed", SPEED_STEP, SPEED_MIN, SPEED_MAX); });
	$("btn-smaller").addEventListener("click", function () { changeCfg("size", -SIZE_STEP, SIZE_MIN, SIZE_MAX); });
	$("btn-bigger").addEventListener("click", function () { changeCfg("size", SIZE_STEP, SIZE_MIN, SIZE_MAX); });

	// Block pinch/rubber-band page zoom and bounce outside scrollable areas
	document.addEventListener("gesturestart", function (e) { e.preventDefault(); }, false);
	document.addEventListener("touchmove", function (e) {
		var el = e.target;
		while (el && el !== document.body) {
			if (el === scroller || el.id === "song-list" || el.id === "edit-text" || el.id === "export-text") return;
			el = el.parentNode;
		}
		e.preventDefault();
	}, { passive: false });

	/* iOS Safari treats two quick taps as "zoom to this block". With zooming disabled it scrolls the whole
	   page instead and bounces it for several seconds, swallowing every touch (seen on iOS 12.5 after
	   double-tapping the speed/size number). Cancel the second tap so the gesture never starts, then send it
	   on as a normal click so double-pressing a button still counts twice. */
	var tapStart = null, lastTapEnd = 0;
	function clickTarget(t) {
		while (t && t.nodeType === 1) {
			if (t.tagName === "BUTTON") return t;
			if (t.id === "scroller" || t.id === "song-list") break;
			t = t.parentNode;
		}
		return null;
	}
	document.addEventListener("touchstart", function (e) {
		var p = e.touches[0];
		tapStart = e.touches.length === 1 ? { x: p.clientX, y: p.clientY, t: Date.now() } : null;
	}, false);
	document.addEventListener("touchend", function (e) {
		var tag = e.target && e.target.tagName;
		if (!tapStart || tag === "INPUT" || tag === "TEXTAREA") return; // leave the editor fields alone
		var p = e.changedTouches[0], now = Date.now();
		var isTap = Math.abs(p.clientX - tapStart.x) < 12 && Math.abs(p.clientY - tapStart.y) < 12 && now - tapStart.t < 500;
		tapStart = null;
		if (!isTap) return;
		if (now - lastTapEnd < 350) {
			e.preventDefault(); // stops Safari's double-tap gesture (and the click it would have sent)
			lastTapEnd = 0;
			var btn = clickTarget(e.target);
			if (btn && btn.disabled) return;
			var ev = document.createEvent("MouseEvents");
			ev.initEvent("click", true, true);
			(btn || e.target).dispatchEvent(ev);
		} else {
			lastTapEnd = now;
		}
	}, { passive: false });

	/* The page must never move: if iOS scrolls it anyway, put it straight back. Except in the editor, where
	   the on-screen keyboard covers the bottom of the textarea and iOS scrolls the page to keep the caret
	   visible; show() resets it when leaving. */
	window.addEventListener("scroll", function () {
		if (shown === "edit") return;
		if (window.pageYOffset !== 0 || window.pageXOffset !== 0) window.scrollTo(0, 0);
	}, false);

	renderList();
	show("list");
	initOffline();
})();
