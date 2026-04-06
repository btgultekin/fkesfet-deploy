(function () {
    'use strict';

    var root = document.getElementById('admin-media-manager');
    if (!root) return;

    var listUrl = root.getAttribute('data-list-url') || '';
    var deleteUrl = root.getAttribute('data-delete-url') || '';
    var currentPath = '';
    var viewMode = 'grid';
    var selected = {};
    var debounceTimer;
    var lastData = null;

    var el = {
        breadcrumbs: document.getElementById('media-mm-breadcrumbs'),
        stats: document.getElementById('media-mm-stats'),
        search: document.getElementById('media-mm-search'),
        type: document.getElementById('media-mm-type'),
        usage: document.getElementById('media-mm-usage'),
        folders: document.getElementById('media-mm-folders'),
        loading: document.getElementById('media-mm-loading'),
        empty: document.getElementById('media-mm-empty'),
        grid: document.getElementById('media-mm-grid'),
        list: document.getElementById('media-mm-list'),
        btnGrid: document.getElementById('media-mm-view-grid'),
        btnList: document.getElementById('media-mm-view-list'),
        btnSelectUnused: document.getElementById('media-mm-select-unused'),
        btnClearSel: document.getElementById('media-mm-clear-selection'),
        btnBulkDel: document.getElementById('media-mm-bulk-delete'),
        selCount: document.getElementById('media-mm-selection-count')
    };

    function csrfToken() {
        var m = document.querySelector('meta[name="csrf-token"]');
        return m ? m.getAttribute('content') || '' : '';
    }

    function showToast(type, message) {
        if (window.adminToast && typeof window.adminToast.show === 'function') {
            window.adminToast.show(type, message);
            return;
        }
        if (type === 'error') window.alert(message);
    }

    function fmtBytes(n) {
        if (n < 1024) return n + ' B';
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
        if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
        return (n / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    function fmtDate(iso) {
        try {
            var d = new Date(iso);
            return d.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
        } catch (e) {
            return iso;
        }
    }

    function absoluteUrl(publicUrl) {
        if (!publicUrl) return '';
        if (/^https?:\/\//i.test(publicUrl)) return publicUrl;
        return window.location.origin + publicUrl;
    }

    function updateSelectionUi() {
        var keys = Object.keys(selected).filter(function (k) {
            return selected[k];
        });
        if (el.selCount) el.selCount.textContent = keys.length ? keys.length + ' seçili' : '';
    }

    function setViewMode(mode) {
        viewMode = mode === 'list' ? 'list' : 'grid';
        if (el.grid) el.grid.classList.toggle('hidden', viewMode !== 'grid');
        if (el.list) el.list.classList.toggle('hidden', viewMode !== 'list');
        if (el.btnGrid) {
            el.btnGrid.classList.toggle('bg-slate-900', viewMode === 'grid');
            el.btnGrid.classList.toggle('text-white', viewMode === 'grid');
            el.btnGrid.classList.toggle('text-slate-600', viewMode !== 'grid');
            el.btnGrid.classList.toggle('bg-transparent', viewMode !== 'grid');
        }
        if (el.btnList) {
            el.btnList.classList.toggle('bg-slate-900', viewMode === 'list');
            el.btnList.classList.toggle('text-white', viewMode === 'list');
            el.btnList.classList.toggle('text-slate-600', viewMode !== 'list');
            el.btnList.classList.toggle('bg-transparent', viewMode !== 'list');
        }
    }

    function buildQuery() {
        var p = new URLSearchParams();
        var q = el.search && el.search.value ? el.search.value.trim() : '';
        if (q) p.set('q', q);
        else if (currentPath) p.set('path', currentPath);
        if (el.type && el.type.value) p.set('type', el.type.value);
        if (el.usage && el.usage.value) p.set('usage', el.usage.value);
        return p.toString();
    }

    function renderBreadcrumbs(data) {
        if (!el.breadcrumbs) return;
        el.breadcrumbs.innerHTML = '';
        var items = data.breadcrumbs || [];
        items.forEach(function (bc, i) {
            if (i > 0) {
                var sep = document.createElement('span');
                sep.className = 'text-slate-300';
                sep.textContent = '/';
                el.breadcrumbs.appendChild(sep);
            }
            var a = document.createElement('button');
            a.type = 'button';
            a.className =
                'truncate rounded-lg px-1.5 py-0.5 text-left font-medium transition hover:bg-slate-100 hover:text-primary ' +
                (i === items.length - 1 ? 'text-slate-900' : 'text-slate-600');
            a.textContent = bc.name;
            a.setAttribute('data-path', bc.relativePath || '');
            a.addEventListener('click', function () {
                if (data.isSearchMode) {
                    if (el.search) el.search.value = '';
                }
                currentPath = bc.relativePath || '';
                load();
            });
            el.breadcrumbs.appendChild(a);
        });
    }

    function renderFolders(data) {
        if (!el.folders) return;
        var folders = data.folders || [];
        if (!folders.length || data.isSearchMode) {
            el.folders.innerHTML = '';
            el.folders.classList.add('hidden');
            return;
        }
        el.folders.classList.remove('hidden');
        var wrap = document.createElement('div');
        wrap.className = 'flex flex-wrap gap-2';
        folders.forEach(function (f) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className =
                'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-primary/40 hover:bg-white hover:text-primary';
            b.innerHTML =
                '<svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>' +
                '<span>' +
                escapeHtml(f.name) +
                '</span>';
            b.addEventListener('click', function () {
                currentPath = f.relativePath || '';
                if (el.search) el.search.value = '';
                load();
            });
            wrap.appendChild(b);
        });
        el.folders.innerHTML = '';
        el.folders.appendChild(wrap);
    }

    function escapeHtml(s) {
        if (!s) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function refTooltip(refs) {
        if (!refs || !refs.length) return '';
        return refs
            .map(function (r) {
                return r.source + ': ' + r.label;
            })
            .join('\n');
    }

    function bindVideoHover(container) {
        var videos = container.querySelectorAll('video[data-mm-hover-play]');
        videos.forEach(function (v) {
            v.addEventListener('mouseenter', function () {
                v.play().catch(function () {});
            });
            v.addEventListener('mouseleave', function () {
                v.pause();
                v.currentTime = 0;
            });
        });
    }

    function cardHtml(file) {
        var inUse = !!file.inUse;
        var badgeClass = inUse
            ? 'bg-emerald-100 text-emerald-800 ring-emerald-600/20'
            : 'bg-red-100 text-red-800 ring-red-600/20';
        var badgeText = inUse ? 'Kullanımda' : 'Kullanılmıyor';
        var chk = selected[file.relativePath] ? 'checked' : '';
        var preview = '';
        if (file.isVideo) {
            preview =
                '<div class="relative aspect-video w-full overflow-hidden bg-slate-900">' +
                '<video data-mm-hover-play class="h-full w-full object-cover" muted playsinline loop preload="metadata" src="' +
                escapeHtml(file.publicUrl) +
                '"></video>' +
                '<span class="pointer-events-none absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">VIDEO</span>' +
                '</div>';
        } else {
            preview =
                '<div class="relative aspect-video w-full overflow-hidden bg-slate-100">' +
                '<img src="' +
                escapeHtml(file.publicUrl) +
                '" alt="" class="h-full w-full object-cover" loading="lazy" />' +
                '</div>';
        }
        var refsTitle = escapeHtml(refTooltip(file.references));
        return (
            '<article class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 transition hover:border-slate-300 hover:shadow-md">' +
            '<div class="absolute left-2 top-2 z-10 sm:left-3 sm:top-3">' +
            '<label class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/90 shadow ring-1 ring-slate-200 backdrop-blur">' +
            '<input type="checkbox" class="media-mm-chk h-4 w-4 rounded border-slate-300 text-primary" data-path="' +
            escapeHtml(file.relativePath) +
            '" ' +
            chk +
            ' />' +
            '</label></div>' +
            '<div class="relative">' +
            preview +
            '</div>' +
            '<div class="flex flex-1 flex-col gap-2 p-3">' +
            '<div class="flex items-start justify-between gap-2">' +
            '<p class="min-w-0 flex-1 truncate text-xs font-semibold text-slate-900" title="' +
            escapeHtml(file.name) +
            '">' +
            escapeHtml(file.name) +
            '</p>' +
            '<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ' +
            badgeClass +
            '" title="' +
            refsTitle +
            '">' +
            badgeText +
            '</span>' +
            '</div>' +
            '<p class="text-[11px] text-slate-500">' +
            escapeHtml(file.extension.toUpperCase()) +
            ' · ' +
            fmtBytes(file.sizeBytes) +
            '</p>' +
            '<p class="text-[11px] text-slate-400">' +
            escapeHtml(fmtDate(file.modifiedUtc)) +
            '</p>' +
            '<div class="mt-auto flex flex-wrap gap-1.5 pt-1">' +
            '<button type="button" class="media-mm-copy inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50" data-url="' +
            escapeHtml(absoluteUrl(file.publicUrl)) +
            '">Link kopyala</button>' +
            '<button type="button" class="media-mm-del inline-flex flex-1 items-center justify-center rounded-lg bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100" data-path="' +
            escapeHtml(file.relativePath) +
            '" data-inuse="' +
            (inUse ? '1' : '0') +
            '">Sil</button>' +
            '</div></div></article>'
        );
    }

    function listRowHtml(file) {
        var inUse = !!file.inUse;
        var badgeClass = inUse ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
        var badgeText = inUse ? 'Kullanımda' : 'Kullanılmıyor';
        var chk = selected[file.relativePath] ? 'checked' : '';
        var thumb = '';
        if (file.isVideo) {
            thumb =
                '<video data-mm-hover-play class="h-12 w-20 rounded-lg object-cover bg-slate-900" muted playsinline loop preload="metadata" src="' +
                escapeHtml(file.publicUrl) +
                '"></video>';
        } else {
            thumb =
                '<img src="' +
                escapeHtml(file.publicUrl) +
                '" alt="" class="h-12 w-20 rounded-lg object-cover bg-slate-100" loading="lazy" />';
        }
        return (
            '<tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">' +
            '<td class="px-3 py-2 align-middle"><input type="checkbox" class="media-mm-chk h-4 w-4 rounded border-slate-300 text-primary" data-path="' +
            escapeHtml(file.relativePath) +
            '" ' +
            chk +
            ' /></td>' +
            '<td class="px-2 py-2 align-middle">' +
            thumb +
            '</td>' +
            '<td class="max-w-[14rem] truncate px-3 py-2 text-sm font-medium text-slate-900" title="' +
            escapeHtml(file.name) +
            '">' +
            escapeHtml(file.name) +
            '</td>' +
            '<td class="whitespace-nowrap px-3 py-2 text-xs text-slate-500">' +
            escapeHtml(file.extension.toUpperCase()) +
            '</td>' +
            '<td class="whitespace-nowrap px-3 py-2 text-xs text-slate-500">' +
            fmtBytes(file.sizeBytes) +
            '</td>' +
            '<td class="whitespace-nowrap px-3 py-2 text-xs text-slate-500">' +
            escapeHtml(fmtDate(file.modifiedUtc)) +
            '</td>' +
            '<td class="px-3 py-2"><span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ' +
            badgeClass +
            '">' +
            badgeText +
            '</span></td>' +
            '<td class="whitespace-nowrap px-3 py-2 text-right">' +
            '<button type="button" class="media-mm-copy mr-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" data-url="' +
            escapeHtml(absoluteUrl(file.publicUrl)) +
            '">Kopyala</button>' +
            '<button type="button" class="media-mm-del rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100" data-path="' +
            escapeHtml(file.relativePath) +
            '" data-inuse="' +
            (inUse ? '1' : '0') +
            '">Sil</button>' +
            '</td></tr>'
        );
    }

    function wireGridList(container) {
        container.querySelectorAll('.media-mm-chk').forEach(function (c) {
            c.addEventListener('change', function () {
                var p = c.getAttribute('data-path');
                if (!p) return;
                selected[p] = c.checked;
                if (!c.checked) delete selected[p];
                updateSelectionUi();
            });
        });
        container.querySelectorAll('.media-mm-copy').forEach(function (b) {
            b.addEventListener('click', function () {
                var u = b.getAttribute('data-url') || '';
                if (!u) return;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(u).then(
                        function () {
                            showToast('success', 'Bağlantı panoya kopyalandı.');
                        },
                        function () {
                            showToast('error', 'Kopyalanamadı.');
                        }
                    );
                } else {
                    showToast('error', 'Tarayıcı pano API desteklemiyor.');
                }
            });
        });
        container.querySelectorAll('.media-mm-del').forEach(function (b) {
            b.addEventListener('click', function () {
                var p = b.getAttribute('data-path');
                if (!p) return;
                deletePaths([p], false);
            });
        });
        bindVideoHover(container);
    }

    function renderFiles(data) {
        var files = data.files || [];
        if (el.grid) {
            el.grid.innerHTML = '';
            el.grid.classList.toggle('hidden', viewMode !== 'grid');
        }
        if (el.list) {
            el.list.innerHTML = '';
            el.list.classList.toggle('hidden', viewMode !== 'list');
        }

        if (!files.length) {
            if (el.empty) el.empty.classList.remove('hidden');
            return;
        }
        if (el.empty) el.empty.classList.add('hidden');

        if (el.grid && viewMode === 'grid') {
            files.forEach(function (f) {
                var wrap = document.createElement('div');
                wrap.className = 'relative';
                wrap.innerHTML = cardHtml(f);
                el.grid.appendChild(wrap);
            });
            wireGridList(el.grid);
        }
        if (el.list && viewMode === 'list') {
            var table = document.createElement('table');
            table.className = 'w-full min-w-[640px] text-left text-sm';
            table.innerHTML =
                '<thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">' +
                '<tr><th class="w-10 px-3 py-2"></th><th class="w-24 px-2 py-2"></th><th class="px-3 py-2">Dosya</th><th class="px-3 py-2">Tür</th><th class="px-3 py-2">Boyut</th><th class="px-3 py-2">Yükleme / güncelleme</th><th class="px-3 py-2">Durum</th><th class="px-3 py-2 text-right">İşlem</th></tr></thead><tbody></tbody>';
            var tb = table.querySelector('tbody');
            files.forEach(function (f) {
                var temp = document.createElement('tbody');
                temp.innerHTML = listRowHtml(f);
                var row = temp.firstElementChild;
                if (row) tb.appendChild(row);
            });
            el.list.appendChild(table);
            wireGridList(el.list);
        }
    }

    function load() {
        if (el.loading) el.loading.classList.remove('hidden');
        if (el.empty) el.empty.classList.add('hidden');
        if (el.grid) el.grid.innerHTML = '';
        if (el.list) el.list.innerHTML = '';

        var url = listUrl + (listUrl.indexOf('?') >= 0 ? '&' : '?') + buildQuery();
        fetch(url, { credentials: 'same-origin' })
            .then(function (r) {
                if (!r.ok) throw new Error('Liste alınamadı');
                return r.json();
            })
            .then(function (data) {
                lastData = data;
                if (el.loading) el.loading.classList.add('hidden');
                if (el.stats) {
                    el.stats.textContent =
                        'Toplam medya: ' +
                        (data.totalFileCount != null ? data.totalFileCount : '—') +
                        ' · Kullanılmayan: ' +
                        (data.unusedFileCount != null ? data.unusedFileCount : '—');
                }
                renderBreadcrumbs(data);
                renderFolders(data);
                renderFiles(data);
                setViewMode(viewMode);
            })
            .catch(function () {
                if (el.loading) el.loading.classList.add('hidden');
                showToast('error', 'Medya listesi yüklenemedi.');
            });
    }

    function deletePaths(paths, forceInUse) {
        var token = csrfToken();
        var fd = new FormData();
        fd.append('pathsJson', JSON.stringify(paths));
        fd.append('forceInUse', forceInUse ? 'true' : 'false');

        fetch(deleteUrl, {
            method: 'POST',
            body: fd,
            headers: token ? { RequestVerificationToken: token } : {}
        })
            .then(function (r) {
                return r.json();
            })
            .then(function (res) {
                if (res.conflicts && res.conflicts.length && !forceInUse) {
                    var lines = res.conflicts.map(function (c) {
                        var rs = (c.references || [])
                            .map(function (x) {
                                return x.source + ': ' + x.label;
                            })
                            .join('; ');
                        return c.relativePath + ' → ' + rs;
                    });
                    var msg =
                        'Bu dosya(lar) içerikte kullanılıyor. Silmek istediğinize emin misiniz?\n\n' +
                        lines.join('\n');
                    if (window.confirm(msg)) {
                        deletePaths(paths, true);
                    }
                    return;
                }
                if (!res.ok) {
                    showToast('error', res.error || 'Silinemedi.');
                    return;
                }
                paths.forEach(function (p) {
                    delete selected[p];
                });
                updateSelectionUi();
                var n = res.deletedPaths ? res.deletedPaths.length : 0;
                showToast('success', n + ' dosya silindi.');
                load();
            })
            .catch(function () {
                showToast('error', 'Silme isteği başarısız.');
            });
    }

    if (el.search) {
        el.search.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                if (el.search.value.trim()) currentPath = '';
                load();
            }, 320);
        });
    }
    if (el.type) el.type.addEventListener('change', load);
    if (el.usage) el.usage.addEventListener('change', load);

    if (el.btnGrid)
        el.btnGrid.addEventListener('click', function () {
            viewMode = 'grid';
            setViewMode('grid');
            if (lastData) renderFiles(lastData);
        });
    if (el.btnList)
        el.btnList.addEventListener('click', function () {
            viewMode = 'list';
            setViewMode('list');
            if (lastData) renderFiles(lastData);
        });

    if (el.btnSelectUnused) {
        el.btnSelectUnused.addEventListener('click', function () {
            fetch(listUrl + (listUrl.indexOf('?') >= 0 ? '&' : '?') + buildQuery(), { credentials: 'same-origin' })
                .then(function (r) {
                    return r.json();
                })
                .then(function (data) {
                    var files = data.files || [];
                    files.forEach(function (f) {
                        if (!f.inUse) selected[f.relativePath] = true;
                    });
                    load();
                })
                .catch(function () {
                    showToast('error', 'Seçim güncellenemedi.');
                });
        });
    }

    if (el.btnClearSel) {
        el.btnClearSel.addEventListener('click', function () {
            selected = {};
            updateSelectionUi();
            load();
        });
    }

    if (el.btnBulkDel) {
        el.btnBulkDel.addEventListener('click', function () {
            var keys = Object.keys(selected).filter(function (k) {
                return selected[k];
            });
            if (!keys.length) {
                showToast('error', 'Önce dosya seçin.');
                return;
            }
            if (!window.confirm(keys.length + ' dosyayı silmek istediğinize emin misiniz?')) return;
            deletePaths(keys, false);
        });
    }

    root.removeAttribute('hidden');
    setViewMode('grid');
    load();
})();
