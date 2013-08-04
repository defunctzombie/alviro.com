if (!window.addEventListener) {
    window.addEventListener = function(type, fn, capture) {
        return window.attachEvent(type, fn);
    };
}
