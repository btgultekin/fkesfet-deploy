(function () {
    'use strict';

    function initMobileMenu() {
        var btn = document.getElementById('mobile-menu-btn');
        var panel = document.getElementById('mobile-menu');
        if (!btn || !panel) return;

        btn.addEventListener('click', function () {
            panel.classList.toggle('hidden');
            var expanded = !panel.classList.contains('hidden');
            btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        });

        panel.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                panel.classList.add('hidden');
                btn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function getGoogTransCookie() {
        var m = document.cookie.match(/(?:^|;)\s*googtrans=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : '';
    }

    function setCookie(name, value, days) {
        var exp = '';
        if (days) {
            var d = new Date();
            d.setTime(d.getTime() + days * 864e5);
            exp = '; expires=' + d.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + exp + '; path=/';
    }

    function deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }

    function initLangSwitch() {
        var trBtn = document.getElementById('lang-tr');
        var enBtn = document.getElementById('lang-en');
        if (!trBtn || !enBtn) return;

        function activeStyle(activeTr) {
            if (activeTr) {
                trBtn.classList.add('bg-primary', 'text-white');
                trBtn.classList.remove('text-slate-400');
                enBtn.classList.remove('bg-primary', 'text-white');
                enBtn.classList.add('text-slate-400');
            } else {
                enBtn.classList.add('bg-primary', 'text-white');
                enBtn.classList.remove('text-slate-400');
                trBtn.classList.remove('bg-primary', 'text-white');
                trBtn.classList.add('text-slate-400');
            }
        }

        var g = getGoogTransCookie();
        var isEn = g.indexOf('/en') !== -1 || g.endsWith('en');
        activeStyle(!isEn);

        trBtn.addEventListener('click', function () {
            deleteCookie('googtrans');
            window.location.reload();
        });

        enBtn.addEventListener('click', function () {
            setCookie('googtrans', '/tr/en', 365);
            window.location.reload();
        });
    }

    var revealObserver;

    function createRevealObserver() {
        var obs = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var el = entry.target;
                    el.classList.add('opacity-100', 'translate-y-0');
                    el.classList.remove('opacity-0', 'translate-y-8', 'translate-y-6');
                    obs.unobserve(el);
                });
            },
            { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
        );
        return obs;
    }

    function observeRevealElements(root) {
        if (!revealObserver) revealObserver = createRevealObserver();
        var scope = root || document;
        scope.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
            revealObserver.observe(el);
        });
    }

    function finishHomeSection(sectionEl) {
        var sk = sectionEl.querySelector('[data-skeleton]');
        var ct = sectionEl.querySelector('[data-content]');
        if (!sk || !ct) return;

        sk.classList.add('pointer-events-none', 'opacity-0');
        window.setTimeout(function () {
            sk.classList.add('hidden');
        }, 320);

        ct.classList.remove('invisible', 'opacity-0', 'pointer-events-none');
        ct.classList.add('opacity-100');

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                if (!revealObserver) revealObserver = createRevealObserver();
                ct.querySelectorAll('.card-reveal').forEach(function (el) {
                    revealObserver.observe(el);
                });
            });
        });
    }

    function initHomeSkeletonSections() {
        document.querySelectorAll('[data-home-section]').forEach(function (sectionEl) {
            var ct = sectionEl.querySelector('[data-content]');
            if (!ct) return;

            var imgs = ct.querySelectorAll('img');
            var total = imgs.length;
            if (total === 0) {
                finishHomeSection(sectionEl);
                return;
            }

            var loaded = 0;
            function check() {
                loaded++;
                if (loaded >= total) finishHomeSection(sectionEl);
            }

            imgs.forEach(function (img) {
                if (img.complete) check();
                else {
                    img.addEventListener('load', check, { once: true });
                    img.addEventListener('error', check, { once: true });
                }
            });

            window.setTimeout(function () {
                if (skVisible(sectionEl)) finishHomeSection(sectionEl);
            }, 2800);
        });
    }

    function skVisible(sectionEl) {
        var sk = sectionEl.querySelector('[data-skeleton]');
        return sk && !sk.classList.contains('hidden');
    }

    function heroPauseVideos(slideEl) {
        if (!slideEl) return;
        slideEl.querySelectorAll('video').forEach(function (v) {
            v.pause();
            try {
                v.currentTime = 0;
            } catch (e) {
                /* ignore */
            }
        });
    }

    function heroPlayVideos(slideEl) {
        if (!slideEl) return;
        slideEl.querySelectorAll('video').forEach(function (v) {
            var p = v.play();
            if (p && typeof p.catch === 'function') p.catch(function () {});
        });
    }

    function initHeroSlider() {
        var root = document.querySelector('[data-hero-slider]');
        if (!root) return;
        var slides = root.querySelectorAll('[data-hero-slide]');
        if (slides.length === 0) return;

        var i = 0;
        var intervalMs = 7000;

        function activate(next) {
            heroPauseVideos(slides[i]);
            slides[i].classList.remove('is-active');
            i = next;
            slides[i].classList.add('is-active');
            heroPlayVideos(slides[i]);
        }

        heroPlayVideos(slides[0]);

        if (slides.length < 2) return;

        window.setInterval(function () {
            activate((i + 1) % slides.length);
        }, intervalMs);
    }

    function initHomePromoDialog() {
        var dialog = document.getElementById('home-promo-dialog');
        var closeBtn = document.getElementById('home-promo-close');
        if (!dialog || typeof dialog.showModal !== 'function') return;

        var delayRaw = dialog.getAttribute('data-promo-delay') || '0';
        var delaySec = parseInt(delayRaw, 10);
        if (isNaN(delaySec) || delaySec < 0) delaySec = 0;
        var delayMs = delaySec * 1000;

        function showPromo() {
            if (typeof dialog.showModal === 'function') dialog.showModal();
        }

        window.setTimeout(showPromo, delayMs);

        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                dialog.close();
            });
        }

        dialog.addEventListener('click', function (e) {
            if (e.target === dialog) dialog.close();
        });
    }

    function initSearchPageForm() {
        var root = document.querySelector('[data-search-page]');
        if (!root) return;
        var input = root.querySelector('[data-search-q]');
        var btn = root.querySelector('[data-search-submit]');
        if (!input || !btn) return;

        function sync() {
            var ok = (input.value || '').trim().length > 0;
            btn.disabled = !ok;
        }

        input.addEventListener('input', sync);
        input.addEventListener('change', sync);
        sync();
    }

    function initImageLightbox() {
        var dialog = document.getElementById('site-image-lightbox');
        var imgEl = document.getElementById('site-image-lightbox-img');
        var closeBtn = document.getElementById('site-image-lightbox-close');
        if (!dialog || !imgEl) return;

        document.querySelectorAll('[data-lightbox-src]').forEach(function (trigger) {
            trigger.addEventListener('click', function (e) {
                if (trigger.tagName === 'A') e.preventDefault();
                var url = trigger.getAttribute('data-lightbox-src');
                var alt = trigger.getAttribute('data-lightbox-alt') || '';
                if (!url) return;
                imgEl.setAttribute('src', url);
                imgEl.setAttribute('alt', alt);
                if (typeof dialog.showModal === 'function') dialog.showModal();
            });
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                dialog.close();
            });
        }
        dialog.addEventListener('click', function (e) {
            if (e.target === dialog) dialog.close();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && dialog.open) dialog.close();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMobileMenu();
        initLangSwitch();
        initHeroSlider();
        initHomePromoDialog();
        initImageLightbox();
        initSearchPageForm();
        revealObserver = createRevealObserver();

        observeRevealElements(document.body);

        if (document.querySelector('[data-home-section]')) {
            initHomeSkeletonSections();
        }
    });
})();
