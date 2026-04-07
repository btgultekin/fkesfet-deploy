(function ($) {
    'use strict';

    function csrfToken() {
        var m = document.querySelector('meta[name="csrf-token"]');
        return m ? m.getAttribute('content') || '' : '';
    }

    function appendGalleryUrl(textareaId, url) {
        var ta = document.getElementById(textareaId);
        if (!ta) return;
        var raw = (ta.value || '').trim();
        var arr = [];
        try {
            arr = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(arr)) arr = [];
        } catch (e) {
            arr = [];
        }
        arr.push(url);
        ta.value = JSON.stringify(arr);
        $(ta).trigger('input');
    }

    function setUrlInput(inputId, url) {
        var el = document.getElementById(inputId);
        if (!el) return;
        el.value = url;
        $(el).trigger('input').trigger('change');
    }

    function setUploadStatus(input, message, tone) {
        var box = input && input.closest ? input.closest('[data-upload-box]') : null;
        if (!box) return;
        var status = box.querySelector('[data-upload-status]');
        if (!status) return;

        status.classList.remove('hidden', 'text-slate-500', 'text-red-600', 'text-emerald-700');
        if (!message) {
            status.textContent = '';
            status.classList.add('hidden');
            return;
        }

        status.textContent = message;
        if (tone === 'error') status.classList.add('text-red-600');
        else if (tone === 'success') status.classList.add('text-emerald-700');
        else status.classList.add('text-slate-500');
    }

    function fallbackErrorMessage(status) {
        if (status === 401 || status === 403) return 'Yetkiniz yok. Oturumu yenileyip tekrar deneyin.';
        if (status === 413) return 'Gorsel cok buyuk. En fazla 15 MB dosya yukleyebilirsiniz.';
        if (status >= 500) return 'Sunucu hatasi olustu. Lutfen tekrar deneyin.';
        return 'Gorsel yukleme basarisiz.';
    }

    $(document).on('change', '.admin-webp-file-input', function () {
        var input = this;
        var file = input.files && input.files[0];
        if (!file) return;

        var setId = input.getAttribute('data-webp-set-url-input');
        var galleryId = input.getAttribute('data-webp-append-gallery');
        if (!setId && !galleryId) return;

        var fd = new FormData();
        fd.append('file', file);

        var token = csrfToken();
        input.disabled = true;
        setUploadStatus(input, 'Gorsel yukleniyor...', 'info');

        var uploadUrl = typeof window.adminUrl === 'function'
            ? window.adminUrl('/yonetimfk/MediaAdmin/UploadContentImage')
            : '/yonetimfk/MediaAdmin/UploadContentImage';
        fetch(uploadUrl, {
            method: 'POST',
            body: fd,
            headers: token ? { RequestVerificationToken: token } : {}
        })
            .then(function (r) {
                var ct = r.headers.get('content-type') || '';
                if (ct.indexOf('application/json') === -1) {
                    return { ok: false, body: { error: fallbackErrorMessage(r.status) } };
                }
                return r.json().then(function (body) {
                    return { ok: r.ok, body: body };
                });
            })
            .then(function (res) {
                if (!res.ok || !res.body.success) {
                    var msg = (res.body && res.body.error) || 'Yükleme başarısız.';
                    setUploadStatus(input, msg, 'error');
                    if (window.adminToast && window.adminToast.show) window.adminToast.show('error', msg);
                    else alert(msg);
                    return;
                }
                var url = res.body.url;
                if (setId) setUrlInput(setId, url);
                if (galleryId) appendGalleryUrl(galleryId, url);
                setUploadStatus(input, 'Gorsel yuklendi.', 'success');
                if (window.adminToast && window.adminToast.show) {
                    window.adminToast.show('success', 'Görsel WebP olarak yüklendi.');
                }
            })
            .catch(function () {
                setUploadStatus(input, 'Ag hatasi.', 'error');
                if (window.adminToast && window.adminToast.show) window.adminToast.show('error', 'Ağ hatası.');
                else alert('Ağ hatası.');
            })
            .finally(function () {
                input.disabled = false;
                input.value = '';
            });
    });
})(jQuery);
