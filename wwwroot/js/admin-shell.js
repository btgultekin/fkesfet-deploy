(function () {
    'use strict';
    var toggle = document.getElementById('admin-sidebar-toggle');
    var sidebar = document.getElementById('admin-sidebar');
    var overlay = document.getElementById('admin-sidebar-overlay');
    if (!toggle || !sidebar || !overlay) return;

    function setOpen(open) {
        sidebar.classList.toggle('-translate-x-full', !open);
        overlay.classList.toggle('opacity-0', !open);
        overlay.classList.toggle('pointer-events-none', !open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') === 'true';
        setOpen(!open);
    });
    overlay.addEventListener('click', function () {
        setOpen(false);
    });
})();
