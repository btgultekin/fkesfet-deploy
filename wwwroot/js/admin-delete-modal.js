(function () {
    'use strict';

    var modal;
    var titleEl;
    var textEl;
    var formToSubmit;
    var confirmResolver;

    function ensureModal() {
        if (modal) return;
        modal = document.getElementById('admin-delete-modal');
        if (!modal) return;
        titleEl = modal.querySelector('[data-admin-delete-modal-title]');
        textEl = modal.querySelector('[data-admin-delete-modal-text]');
        var overlay = modal.querySelector('[data-admin-delete-modal-overlay]');
        var cancel = modal.querySelector('[data-admin-delete-cancel]');
        var confirm = modal.querySelector('[data-admin-delete-confirm]');

        function close() {
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
            formToSubmit = null;
            if (confirmResolver) {
                var resolver = confirmResolver;
                confirmResolver = null;
                resolver(false);
            }
        }

        function confirmDelete() {
            var f = formToSubmit;
            var resolver = confirmResolver;
            formToSubmit = null;
            confirmResolver = null;
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
            if (f) {
                HTMLFormElement.prototype.submit.call(f);
                return;
            }
            if (resolver) resolver(true);
        }

        if (overlay) overlay.addEventListener('click', close);
        if (cancel) cancel.addEventListener('click', close);
        if (confirm) confirm.addEventListener('click', confirmDelete);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) close();
        });
    }

    function openForForm(form) {
        ensureModal();
        if (!modal || !titleEl || !textEl) {
            // Layout modalı beklenir; bulunamazsa da native confirm kullanmadan devam eder.
            HTMLFormElement.prototype.submit.call(form);
            return;
        }
        formToSubmit = form;
        titleEl.textContent = form.getAttribute('data-confirm-title') || 'Silmek istediğinize emin misiniz?';
        textEl.textContent = form.getAttribute('data-confirm-text') || 'Bu işlem geri alınamaz.';
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        var confirmBtn = modal.querySelector('[data-admin-delete-confirm]');
        if (confirmBtn) confirmBtn.focus();
    }

    function openForConfirm(options) {
        ensureModal();
        if (!modal || !titleEl || !textEl) return Promise.resolve(true);
        options = options || {};
        titleEl.textContent = options.title || 'İşlemi onaylıyor musunuz?';
        textEl.textContent = options.text || 'Bu işlem geri alınamaz.';
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        var confirmBtn = modal.querySelector('[data-admin-delete-confirm]');
        if (confirmBtn) confirmBtn.focus();
        return new Promise(function (resolve) {
            confirmResolver = resolve;
        });
    }

    document.addEventListener('submit', function (e) {
        var t = e.target;
        if (!(t instanceof HTMLFormElement)) return;
        if (!t.hasAttribute('data-admin-confirm-delete')) return;
        e.preventDefault();
        openForForm(t);
    });

    window.adminConfirm = openForConfirm;
})();
