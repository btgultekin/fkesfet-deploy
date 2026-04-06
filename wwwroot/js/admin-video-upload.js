(function () {
    'use strict';

    function csrfToken() {
        var m = document.querySelector('meta[name="csrf-token"]');
        return m ? m.getAttribute('content') || '' : '';
    }

    function setUrlInput(inputId, url) {
        var el = document.getElementById(inputId);
        if (!el) return;
        el.value = url;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    document.addEventListener('change', function (e) {
        var input = e.target;
        if (!input || !input.classList || !input.classList.contains('admin-mp4-file-input')) return;

        var setId = input.getAttribute('data-video-set-url-input');
        if (!setId) return;

        var file = input.files && input.files[0];
        if (!file) return;

        var fd = new FormData();
        fd.append('file', file);

        var token = csrfToken();
        input.disabled = true;

        var uploadUrl = typeof window.adminUrl === 'function'
            ? window.adminUrl('/yonetimfk/MediaAdmin/UploadContentVideo')
            : '/yonetimfk/MediaAdmin/UploadContentVideo';
        fetch(uploadUrl, {
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
                setUrlInput(setId, res.body.url);
                if (window.adminToast && window.adminToast.show) {
                    window.adminToast.show('success', 'Video yüklendi.');
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
})();
