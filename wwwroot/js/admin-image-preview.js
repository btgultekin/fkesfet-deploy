(function ($) {
    'use strict';
    function refresh($input) {
        var target = $input.data('admin-image-target');
        if (!target) return;
        var $img = $(target);
        var u = ($input.val() || '').trim();
        if (!u) {
            $img.addClass('hidden').attr('src', '');
            return;
        }
        $img.removeClass('hidden').attr('src', u);
    }
    $(function () {
        $(document).on('input change', '[data-admin-image-url]', function () {
            refresh($(this));
        });
        $('[data-admin-image-url]').each(function () {
            refresh($(this));
        });
        $(document).on('error', '[data-admin-image-preview]', function () {
            $(this).addClass('hidden');
        });
    });
})(jQuery);
