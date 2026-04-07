(function () {
    'use strict';

    var SEO_LIMITS = {
        titleMax: 60,
        descriptionMax: 160,
        descriptionIdealMin: 140,
        slugMax: 90,
        keywordsMax: 10
    };
    var STOP_WORDS = {
        ve: true, veya: true, ile: true, gibi: true, bir: true, bu: true, için: true, olarak: true,
        daha: true, çok: true, en: true, da: true, de: true, ki: true, mi: true, mu: true, mü: true,
        nasıl: true, nedir: true, olan: true, olanlar: true, üzerinden: true, göre: true, ama: true,
        fakat: true, ise: true, hem: true, her: true, tüm: true, siz: true, biz: true, onlar: true,
        the: true, and: true, or: true, with: true, for: true, from: true, this: true, that: true
    };

    function val(el) {
        return el && typeof el.value === 'string' ? el.value.trim() : '';
    }

    function parseSelectorList(value) {
        if (!value) return [];
        return value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    }

    function firstMatch(selectors) {
        for (var i = 0; i < selectors.length; i += 1) {
            var el = document.querySelector(selectors[i]);
            if (el) return el;
        }
        return null;
    }

    function stripHtml(input) {
        if (!input) return '';
        var tmp = document.createElement('div');
        tmp.innerHTML = input;
        return (tmp.textContent || tmp.innerText || '').trim();
    }

    function normalizeText(input) {
        return (input || '')
            .replace(/\s+/g, ' ')
            .replace(/\u00a0/g, ' ')
            .trim();
    }

    function slugify(input) {
        var map = {
            'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
        };
        var prepared = (input || '').replace(/[çÇğĞıİöÖşŞüÜ]/g, function (ch) { return map[ch] || ch; });
        var normalized = prepared.normalize ? prepared.normalize('NFD') : prepared;
        normalized = normalized.replace(/[\u0300-\u036f]/g, '');
        return normalized
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, ' ')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function pickKeywords(source, maxCount) {
        var words = normalizeText(source)
            .toLowerCase()
            .replace(/[^a-z0-9çğıöşü\s]/g, ' ')
            .split(/\s+/)
            .filter(function (x) { return x.length >= 3; });

        var seen = {};
        var output = [];
        for (var i = 0; i < words.length; i += 1) {
            var word = words[i];
            if (STOP_WORDS[word] || seen[word]) continue;
            seen[word] = true;
            output.push(word);
            if (output.length >= maxCount) break;
        }
        return output.join(', ');
    }

    function ensureSentenceEnd(text) {
        if (!text) return '';
        return /[.!?]$/.test(text) ? text : text + '.';
    }

    function clampWordBoundary(text, max) {
        var normalized = normalizeText(text);
        if (normalized.length <= max) return normalized;
        var cut = normalized.slice(0, max + 1);
        var lastSpace = cut.lastIndexOf(' ');
        if (lastSpace > 30) return cut.slice(0, lastSpace).trim();
        return normalized.slice(0, max).trim();
    }

    function buildMetaTitle(title, suffix) {
        var cleanTitle = normalizeText(title);
        if (!cleanTitle) return '';
        var cleanSuffix = normalizeText(suffix);

        // Keep full meaning in admin auto-fill; preview already truncates visually.
        if (!cleanSuffix) return cleanTitle;

        if (cleanTitle.toLowerCase().endsWith(cleanSuffix.toLowerCase())) {
            return cleanTitle;
        }

        if ((cleanTitle + cleanSuffix).length <= SEO_LIMITS.titleMax) {
            return cleanTitle + cleanSuffix;
        }
        return cleanTitle;
    }

    function buildMetaDescription(contentText, titleText) {
        var fromContent = clampWordBoundary(contentText, SEO_LIMITS.descriptionMax);
        if (fromContent && fromContent.length >= SEO_LIMITS.descriptionIdealMin) {
            return ensureSentenceEnd(fromContent);
        }

        // If content is too short, enrich with title context for stronger relevance.
        var titleChunk = clampWordBoundary(titleText, 55);
        var combined = normalizeText((fromContent ? fromContent + ' ' : '') + titleChunk);
        return ensureSentenceEnd(clampWordBoundary(combined, SEO_LIMITS.descriptionMax));
    }

    function buildMetaKeywords(contentText, titleText) {
        var titleKeywords = pickKeywords(titleText, 3);
        var bodyKeywords = pickKeywords(contentText, SEO_LIMITS.keywordsMax);
        var raw = (titleKeywords ? titleKeywords + ', ' : '') + bodyKeywords;
        var parts = raw.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
        var seen = {};
        var unique = [];
        for (var i = 0; i < parts.length; i += 1) {
            var key = parts[i].toLowerCase();
            if (seen[key]) continue;
            seen[key] = true;
            unique.push(parts[i]);
            if (unique.length >= SEO_LIMITS.keywordsMax) break;
        }
        return unique.join(', ');
    }

    function getField(name) {
        return byName(document, name);
    }

    function getEditorText(textarea) {
        if (!textarea || !textarea.id) return '';
        if (!window.tinymce || typeof window.tinymce.get !== 'function') return '';
        var editor = window.tinymce.get(textarea.id);
        if (!editor || typeof editor.getContent !== 'function') return '';
        return normalizeText(editor.getContent({ format: 'text' }));
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

    function setIfAuto(el, state, key, nextValue) {
        if (!el || !state[key]) return;
        var current = val(el);
        if (current === nextValue) return;
        el.value = nextValue;
    }

    function getDescriptionSource(card, fallbackEl) {
        var descSelectors = parseSelectorList(card.getAttribute('data-description-fallback-selector') || '');
        var descEl = firstMatch(descSelectors);
        if (descEl) {
            var editorText = getEditorText(descEl);
            if (editorText) return editorText;
            var raw = descEl.tagName === 'TEXTAREA' ? val(descEl) : normalizeText(descEl.textContent || '');
            return normalizeText(stripHtml(raw));
        }
        return fallbackEl ? normalizeText(stripHtml(val(fallbackEl))) : '';
    }

    function refresh(state) {
        var card = document.getElementById('admin-seo-card');
        if (!card) return;

        var titleEl = card.querySelector('[data-seo-preview-title]');
        var urlEl = card.querySelector('[data-seo-preview-url]');
        var descEl = card.querySelector('[data-seo-preview-desc]');
        if (!titleEl || !urlEl || !descEl) return;

        var metaTitleEl = getField('MetaTitle');
        var metaDescEl = getField('MetaDescription');
        var metaKeywordsEl = getField('MetaKeywords');
        var slugEl = getField('Slug');
        var canonicalEl = getField('CanonicalUrl');

        var metaTitle = val(metaTitleEl);
        var metaDesc = val(metaDescEl);
        var slug = val(slugEl);
        var canonical = val(canonicalEl);

        var fallbackSel = card.getAttribute('data-title-fallback-selector');
        var fallbackTitle = '';
        var fallbackEl = null;
        if (fallbackSel) {
            fallbackEl = document.querySelector(fallbackSel);
            fallbackTitle = val(fallbackEl);
        }

        var plainDescription = getDescriptionSource(card, fallbackEl);
        var defaultTitleSuffix = card.getAttribute('data-default-title-suffix') || '';
        setIfAuto(metaTitleEl, state, 'metaTitle', buildMetaTitle(fallbackTitle, defaultTitleSuffix));
        setIfAuto(slugEl, state, 'slug', truncate(slugify(fallbackTitle), SEO_LIMITS.slugMax));
        setIfAuto(metaDescEl, state, 'metaDesc', buildMetaDescription(plainDescription, fallbackTitle));
        setIfAuto(metaKeywordsEl, state, 'metaKeywords', buildMetaKeywords(plainDescription, fallbackTitle));

        metaTitle = val(metaTitleEl);
        metaDesc = val(metaDescEl);
        slug = val(slugEl);
        canonical = val(canonicalEl);

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

        var state = {
            metaTitle: !val(getField('MetaTitle')),
            metaDesc: !val(getField('MetaDescription')),
            metaKeywords: !val(getField('MetaKeywords')),
            slug: !val(getField('Slug'))
        };

        var lockedNames = ['MetaTitle', 'MetaDescription', 'MetaKeywords', 'Slug'];
        lockedNames.forEach(function (n) {
            var el = getField(n);
            if (!el) return;
            el.addEventListener('input', function () {
                state[n === 'MetaTitle' ? 'metaTitle' : n === 'MetaDescription' ? 'metaDesc' : n === 'MetaKeywords' ? 'metaKeywords' : 'slug'] = false;
                refresh(state);
            });
        });

        var names = ['MetaTitle', 'MetaDescription', 'MetaKeywords', 'Slug', 'CanonicalUrl'];
        names.forEach(function (n) {
            var el = getField(n);
            if (el) {
                el.addEventListener('input', function () { refresh(state); });
                el.addEventListener('change', function () { refresh(state); });
            }
        });

        var fb = card.getAttribute('data-title-fallback-selector');
        if (fb) {
            var fbEl = document.querySelector(fb);
            if (fbEl) {
                fbEl.addEventListener('input', function () { refresh(state); });
                fbEl.addEventListener('change', function () { refresh(state); });
            }
        }

        parseSelectorList(card.getAttribute('data-description-fallback-selector') || '').forEach(function (sel) {
            var descEl = document.querySelector(sel);
            if (!descEl) return;
            descEl.addEventListener('input', function () { refresh(state); });
            descEl.addEventListener('change', function () { refresh(state); });
            if (window.tinymce && typeof window.tinymce.get === 'function' && descEl.id) {
                var editor = window.tinymce.get(descEl.id);
                if (editor && typeof editor.on === 'function') {
                    editor.on('keyup change input setcontent', function () { refresh(state); });
                }
            }
        });

        if (card.getAttribute('data-post-kind-aware') === 'true') {
            var kindSel = document.querySelector('#Kind');
            if (kindSel) {
                kindSel.addEventListener('change', function () { refresh(state); });
            }
        }

        refresh(state);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
})();
