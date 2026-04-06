(function () {
    'use strict';
    var el = document.getElementById('admin-chart-data');
    if (!el || typeof Chart === 'undefined') return;
    var data;
    try {
        data = JSON.parse(el.textContent);
    } catch (e) {
        return;
    }
    var primary = '#0096c7';
    var primarySoft = 'rgba(0, 150, 199, 0.25)';
    var slate = '#64748b';

    var flowCtx = document.getElementById('chart-flow');
    if (flowCtx && data.flow) {
        new Chart(flowCtx, {
            type: 'line',
            data: {
                labels: data.flow.labels,
                datasets: [
                    {
                        label: 'Sayfa görüntüleme',
                        data: data.flow.pageViews,
                        borderColor: primary,
                        backgroundColor: primarySoft,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Tahmini tekil ziyaretçi',
                        data: data.flow.uniques,
                        borderColor: slate,
                        backgroundColor: 'rgba(100, 116, 139, 0.12)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.2)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    var donutCtx = document.getElementById('chart-donut');
    if (donutCtx && data.donut && data.donut.labels.length) {
        new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: data.donut.labels,
                datasets: [
                    {
                        data: data.donut.series,
                        backgroundColor: [
                            '#0096c7',
                            '#06b6d4',
                            '#8b5cf6',
                            '#f59e0b',
                            '#10b981',
                            '#ec4899',
                            '#6366f1',
                            '#94a3b8'
                        ],
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
    }

    var barCtx = document.getElementById('chart-bar');
    if (barCtx && data.bar && data.bar.labels.length) {
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: data.bar.labels,
                datasets: [
                    {
                        label: 'Görüntülenme',
                        data: data.bar.values,
                        backgroundColor: primarySoft,
                        borderColor: primary,
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    var pieCtx = document.getElementById('chart-pie');
    if (pieCtx && data.pie) {
        new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Mobil', 'Masaüstü'],
                datasets: [
                    {
                        data: [data.pie.mobile, data.pie.desktop],
                        backgroundColor: ['#0ea5e9', '#475569'],
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
})();
