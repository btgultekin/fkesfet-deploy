/**
 * GTM/gtag: şablon içeriği sayfa yükü ve LCP sonrasına ertelenir.
 * window.load veya en geç 3 sn (hangisi önce gelirse) — çift enjeksiyon yok.
 */
(function () {
    'use strict';

    var injected = false;

    function injectDeferredAnalytics() {
        if (injected) return;
        var tpl = document.getElementById('fk-deferred-analytics');
        if (!tpl || !tpl.content) return;
        injected = true;

        var head = document.head;
        var nodes = tpl.content.querySelectorAll('script,link');
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var name = node.nodeName.toLowerCase();
            if (name === 'link') {
                head.appendChild(node.cloneNode(true));
                continue;
            }
            if (name !== 'script') continue;

            var s = document.createElement('script');
            for (var j = 0; j < node.attributes.length; j++) {
                var a = node.attributes[j];
                s.setAttribute(a.name, a.value);
            }
            if (!s.hasAttribute('async')) {
                s.async = true;
            }
            if (node.src) {
                s.src = node.getAttribute('src') || '';
            } else {
                s.textContent = node.textContent || '';
            }
            head.appendChild(s);
        }
    }

    var t = window.setTimeout(injectDeferredAnalytics, 3000);
    window.addEventListener('load', function () {
        window.clearTimeout(t);
        injectDeferredAnalytics();
    });
})();
