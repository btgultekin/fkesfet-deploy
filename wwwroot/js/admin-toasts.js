(function () {
    'use strict';

    function showToast(type, message) {
        var c = document.getElementById('admin-toast-container');
        if (!c || !message) return;
        var el = document.createElement('div');
        el.setAttribute('role', type === 'error' ? 'alert' : 'status');
        el.className =
            'admin-toast pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg transition duration-300 ease-out ' +
            (type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900');
        var icon =
            type === 'success'
                ? '<svg class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>'
                : '<svg class="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
        el.innerHTML = icon + '<span class="min-w-0 flex-1 leading-snug"></span>';
        el.querySelector('span').textContent = message;
        c.appendChild(el);
        requestAnimationFrame(function () {
            el.classList.add('admin-toast--in');
        });
        var ms = type === 'error' ? 7000 : 5000;
        setTimeout(function () {
            el.classList.remove('admin-toast--in');
            el.classList.add('opacity-0', 'translate-x-4');
            setTimeout(function () {
                el.remove();
            }, 280);
        }, ms);
    }

    function initFromDom() {
        var boot = document.getElementById('admin-initial-toasts');
        if (!boot) return;
        try {
            var d = JSON.parse(boot.textContent);
            if (d.success) showToast('success', d.success);
            if (d.error) showToast('error', d.error);
            if (d.modelErrors && d.modelErrors.length) {
                d.modelErrors.forEach(function (m) {
                    if (m) showToast('error', m);
                });
            }
        } catch (e) {
            /* ignore */
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFromDom);
    else initFromDom();

    window.adminToast = { show: showToast };
})();
