(function () {
    'use strict';

    var modal;
    var titleEl;
    var textEl;
    var formToSubmit;

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
        }

        function confirmDelete() {
            if (!formToSubmit) return;
            var f = formToSubmit;
            formToSubmit = null;
            close();
            HTMLFormElement.prototype.submit.call(f);
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
            if (window.confirm('Silmek istediğinize emin misiniz?')) {
                HTMLFormElement.prototype.submit.call(form);
            }
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

    document.addEventListener('submit', function (e) {
        var t = e.target;
        if (!(t instanceof HTMLFormElement)) return;
        if (!t.hasAttribute('data-admin-confirm-delete')) return;
        e.preventDefault();
        openForForm(t);
    });
})();
