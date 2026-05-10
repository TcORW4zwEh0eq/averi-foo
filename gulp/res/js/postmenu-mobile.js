(function() {
	var mq = window.matchMedia('(max-width: 600px)');

	function patchMenu(menu) {
		if (menu.dataset.mobilePatch) { return; }
		menu.dataset.mobilePatch = '1';

		var wrapper = document.createElement('span');
		wrapper.className = 'postmenu-wrap';

		var icon = document.createElement('span');
		icon.className = 'postmenu-icon';
		icon.setAttribute('aria-hidden', 'true');
		icon.textContent = '▼';

		menu.parentNode.insertBefore(wrapper, menu);
		wrapper.appendChild(icon);
		wrapper.appendChild(menu);
	}

	function unpatchMenu(menu) {
		if (!menu.dataset.mobilePatch) { return; }
		delete menu.dataset.mobilePatch;

		var wrapper = menu.parentNode;
		if (wrapper && wrapper.classList.contains('postmenu-wrap')) {
			wrapper.parentNode.insertBefore(menu, wrapper);
			wrapper.parentNode.removeChild(wrapper);
		}
	}

	function applyAll() {
		var menus = document.getElementsByClassName('postmenu');
		for (var i = menus.length - 1; i >= 0; i--) {
			patchMenu(menus[i]);
		}
	}

	function removeAll() {
		var menus = Array.from(document.querySelectorAll('.postmenu-wrap .postmenu'));
		for (var i = 0; i < menus.length; i++) {
			unpatchMenu(menus[i]);
		}
	}

	function init() {
		if (mq.matches) { applyAll(); }
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	mq.addEventListener('change', function(e) {
		if (e.matches) { applyAll(); } else { removeAll(); }
	});

	window.addEventListener('addPost', function(e) {
		if (!mq.matches) { return; }
		var menu = e.detail.post.querySelector('.postmenu');
		if (menu) { patchMenu(menu); }
	});
})();
