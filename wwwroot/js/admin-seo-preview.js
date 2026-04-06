(function () {
    'use strict';

    function val(el) {
        return el && typeof el.value === 'string' ? el.value.trim() : '';
    }

    function byName(root, name) {
        return root.querySelector('[name="' + name + '"]');
    }

    function segmentForPost(kindSelect, defaultSeg) {
        if (!kindSelect) return defaultSeg;
        var v = kindSelect.value;
        if (v === '1' || v === 'News') return 'haberler';
        return 'blog';
    }

    function truncate(s, max) {
        if (!s) return '';
        if (s.length <= max) return s;
        return s.slice(0, max - 1) + '…';
    }

    function refresh() {
        var card = document.getElementById('admin-seo-card');
        if (!card) return;

        var titleEl = card.querySelector('[data-seo-preview-title]');
        var urlEl = card.querySelector('[data-seo-preview-url]');
        var descEl = card.querySelector('[data-seo-preview-desc]');
        if (!titleEl || !urlEl || !descEl) return;

        var metaTitle = val(byName(document, 'MetaTitle'));
        var metaDesc = val(byName(document, 'MetaDescription'));
        var slug = val(byName(document, 'Slug'));
        var canonical = val(byName(document, 'CanonicalUrl'));

        var fallbackSel = card.getAttribute('data-title-fallback-selector');
        var fallbackTitle = '';
        if (fallbackSel) {
            var fb = document.querySelector(fallbackSel);
            fallbackTitle = val(fb);
        }

        var displayTitle = metaTitle || fallbackTitle;
        if (!displayTitle) {
            displayTitle = 'Meta başlık veya sayfa başlığı yok — Google kendi başlığını seçebilir';
            titleEl.classList.add('italic', 'text-slate-400');
        } else {
            titleEl.classList.remove('italic', 'text-slate-400');
        }
        titleEl.textContent = truncate(displayTitle, 70);

        var origin = window.location.origin;
        var pathSeg = card.getAttribute('data-path-segment') || 'blog';
        if (card.getAttribute('data-post-kind-aware') === 'true') {
            var kindSel = document.querySelector('#Kind');
            pathSeg = segmentForPost(kindSel, pathSeg);
        }

        var urlLine;
        if (canonical) {
            try {
                var u = new URL(canonical);
                urlLine = u.hostname + u.pathname;
            } catch (e) {
                urlLine = canonical.replace(/^https?:\/\//i, '');
            }
        } else {
            var path = '/' + pathSeg + (slug ? '/' + slug : '/örnek-slug');
            urlLine = (origin + path).replace(/^https?:\/\//i, '');
        }
        urlEl.textContent = urlLine;

        var displayDesc = metaDesc;
        if (!displayDesc) {
            displayDesc = 'Meta açıklama boş — Google sayfadan alıntı gösterebilir.';
            descEl.classList.add('italic', 'text-slate-400');
        } else {
            descEl.classList.remove('italic', 'text-slate-400');
        }
        descEl.textContent = truncate(displayDesc, 180);
    }

    function bind() {
        var card = document.getElementById('admin-seo-card');
        if (!card) return;

        var names = ['MetaTitle', 'MetaDescription', 'Slug', 'CanonicalUrl'];
        names.forEach(function (n) {
            var el = byName(document, n);
            if (el) {
                el.addEventListener('input', refresh);
                el.addEventListener('change', refresh);
            }
        });

        var fb = card.getAttribute('data-title-fallback-selector');
        if (fb) {
            var fbEl = document.querySelector(fb);
            if (fbEl) {
                fbEl.addEventListener('input', refresh);
                fbEl.addEventListener('change', refresh);
            }
        }

        if (card.getAttribute('data-post-kind-aware') === 'true') {
            var kindSel = document.querySelector('#Kind');
            if (kindSel) {
                kindSel.addEventListener('change', refresh);
            }
        }

        refresh();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
})();
