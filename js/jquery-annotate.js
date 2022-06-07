/**
 * 创建批注插件
 */
;(function($) {
    $.fn.annotate = function(options) {
        const defaultOptions = {
            originImg: 0, // 目标源图像地址
            ctxWidth: 0, // 画布宽度
            ctxHeight: 0, // 画布高度
            coordinate: [], // 图像操作坐标

        }

        const endOptions = $.extend(defaultOptions, options);
        this.each(function() {
            const _this = $(this);
            
            const ctx = getContext("2d");
            init();

        })
    }

    // 初始化
    function init() {
        createDom();
    }

    // 创建dom
    function createDom() {

    }
})(jQuery);