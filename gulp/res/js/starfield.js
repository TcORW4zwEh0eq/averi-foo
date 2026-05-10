/* gradient-matched post backgrounds and JS-throttled twinkling for starfield themes */
(function() {
	var TOP = [0, 31, 63];   // #001f3f
	var BOT = [12, 10, 25];  // #0c0a19

	function isStarfieldTheme() {
		return getComputedStyle(document.documentElement).getPropertyValue('--starfield-posts').trim() === '1';
	}


	// --- post background colors ---

	function applyGradientBg(els, prop) {
		var docH = document.documentElement.scrollHeight;
		var colors = els.map(function(el) {
			var midY = el.getBoundingClientRect().top + window.scrollY + el.offsetHeight / 2;
			var t = Math.max(0, Math.min(1, midY / docH));
			return TOP.map(function(c, i) { return Math.round(c + (BOT[i] - c) * t); });
		});
		els.forEach(function(el, i) {
			el.style.setProperty(prop, 'rgb(' + colors[i].join(',') + ')');
		});
	}

	function applyPostBgs() {
		var posts = Array.from(document.querySelectorAll('.post-container:not(.op)'));
		if (!isStarfieldTheme()) {
			posts.forEach(function(el) { el.style.removeProperty('--post-bg'); });
			return;
		}
		applyGradientBg(posts, '--post-bg');
	}

	// flow elements: document position is stable, run once at init
	function applyFlowBgs() {
		var els = Array.from(document.querySelectorAll('table, .pages, .bottom-reply, .collapse, #livetext, #threadstats'));
		if (!isStarfieldTheme()) {
			els.forEach(function(el) { el.style.removeProperty('--gradient-bg'); });
			return;
		}
		applyGradientBg(els, '--gradient-bg');
	}

	// fixed elements: viewport position is stable but effective doc-y changes on scroll
	function applyFixedBgs() {
		var els = Array.from(document.querySelectorAll('.stickynav, #threadwatcher'));
		if (!isStarfieldTheme()) {
			els.forEach(function(el) { el.style.removeProperty('--gradient-bg'); });
			return;
		}
		applyGradientBg(els, '--gradient-bg');
	}

	// --- twinkling (JS-throttled, 10fps) ---
	// Matches original CSS keyframe values:
	//   twinkle-a: 1.0 → 0.15 → 1.0, period 3.7s
	//   twinkle-b: 0.25 → 1.0 → 0.25, period 5.3s, phase-shifted by 2.1s

	var twinkleRaf = null;
	var lastTwinkle = 0;

	function twinkleLoop(timestamp) {
		if (timestamp - lastTwinkle >= 200) {
			lastTwinkle = timestamp;
			var t = timestamp / 1000;
			var opA = 0.575 + 0.425 * Math.cos(2 * Math.PI * t / 3.7);
			var opB = 0.625 - 0.375 * Math.cos(2 * Math.PI * (t + 2.1) / 5.3);
			var opC = 0.5   + 0.5   * Math.cos(2 * Math.PI * (t + 3.5) / 4.5);
			document.body.style.setProperty('--twinkle-a', Math.max(0, Math.min(1, opA)));
			document.body.style.setProperty('--twinkle-b', Math.max(0, Math.min(1, opB)));
			document.documentElement.style.setProperty('--twinkle-c', Math.max(0, Math.min(1, opC)));
		}
		twinkleRaf = requestAnimationFrame(twinkleLoop);
	}

	function stopTwinkle() {
		if (twinkleRaf !== null) {
			cancelAnimationFrame(twinkleRaf);
			twinkleRaf = null;
		}
		document.body.style.removeProperty('--twinkle-a');
		document.body.style.removeProperty('--twinkle-b');
		document.documentElement.style.removeProperty('--twinkle-c');
	}

	// --- init / theme change ---

	function init() {
		applyPostBgs();
		applyFlowBgs();
		applyFixedBgs();
		if (isStarfieldTheme()) {
			if (twinkleRaf === null) {
				twinkleRaf = requestAnimationFrame(twinkleLoop);
			}
		} else {
			stopTwinkle();
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// fixed elements update per scroll frame — negligible cost for 2 elements
	var fixedRafPending = false;
	function scheduleFixedBgs() {
		if (fixedRafPending) return;
		fixedRafPending = true;
		requestAnimationFrame(function() {
			fixedRafPending = false;
			applyFixedBgs();
		});
	}
	window.addEventListener('scroll', scheduleFixedBgs, { passive: true });
	window.addEventListener('resize', scheduleFixedBgs, { passive: true });

	// also update during threadwatcher drag (scroll doesn't fire while dragging)
	var fixedDragActive = false;
	var lastFixedDrag = 0;
	document.addEventListener('pointerdown', function(e) {
		if (e.target.closest('#threadwatcher-dragHandle')) fixedDragActive = true;
	}, { passive: true });
	function clearFixedDrag() { fixedDragActive = false; }
	document.addEventListener('pointerup', clearFixedDrag, { passive: true });
	document.addEventListener('pointercancel', clearFixedDrag, { passive: true });
	window.addEventListener('pointermove', function(e) {
		if (!fixedDragActive || e.buttons === 0) return;
		var now = performance.now();
		if (now - lastFixedDrag < 100) return;
		lastFixedDrag = now;
		scheduleFixedBgs();
	}, { passive: true });

	// re-run when theme stylesheet swaps (debounced so CSS has time to apply)
	var debounce;
	new MutationObserver(function() {
		clearTimeout(debounce);
		debounce = setTimeout(init, 80);
	}).observe(document.head, { childList: true, attributes: true, attributeFilter: ['rel', 'href'] });
})();
