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

        fetch('/yonetimfk/MediaAdmin/UploadContentImage', {
            method: 'POST',
            body: fd,
            headers: token ? { RequestVerificationToken: token } : {}
        })
            .then(function (r) {
                var ct = r.headers.get('content-type') || '';
                if (ct.indexOf('application/json') === -1) {
                    return { ok: false, body: { error: 'Sunucu JSON döndürmedi.' } };
                }
                return r.json().then(function (body) {
                    return { ok: r.ok, body: body };
                });
            })
            .then(function (res) {
                if (!res.ok || !res.body.success) {
                    var msg = (res.body && res.body.error) || 'Yükleme başarısız.';
                    if (window.adminToast && window.adminToast.show) window.adminToast.show('error', msg);
                    else alert(msg);
                    return;
                }
                var url = res.body.url;
                if (setId) setUrlInput(setId, url);
                if (galleryId) appendGalleryUrl(galleryId, url);
                if (window.adminToast && window.adminToast.show) {
                    window.adminToast.show('success', 'Görsel WebP olarak yüklendi.');
                }
            })
            .catch(function () {
                if (window.adminToast && window.adminToast.show) window.adminToast.show('error', 'Ağ hatası.');
                else alert('Ağ hatası.');
            })
            .finally(function () {
                input.disabled = false;
                input.value = '';
            });
    });
})(jQuery);
