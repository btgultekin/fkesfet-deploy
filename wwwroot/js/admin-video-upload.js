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

    function fallbackErrorMessage(status) {
        if (status === 401 || status === 403) return 'Yetkiniz yok. Oturumu yenileyip tekrar deneyin.';
        if (status === 413) return 'Video çok büyük. En fazla 80 MB MP4 yükleyebilirsiniz.';
        if (status >= 500) return 'Sunucu hatası oluştu. Lütfen tekrar deneyin.';
        return 'Video yükleme başarısız.';
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
        setUploadStatus(input, 'Video yukleniyor...', 'info');

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
                setUrlInput(setId, res.body.url);
                setUploadStatus(input, 'Video yuklendi.', 'success');
                if (window.adminToast && window.adminToast.show) {
                    window.adminToast.show('success', 'Video yüklendi.');
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
})();
