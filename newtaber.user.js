// ==UserScript==
// @name    Newtaber
// @version    1
// @description    All your links are belong to "_blank". Adds target="_blank" to links without target or with target="_top"
// @include    http://*/*
// @include    https://*/*
// @match    http://*/*
// @match    https://*/*
// @author   
// ==/UserScript==

(function(document, fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.textContent = '(' + fn + ')(window, window.document);';
    document.head.appendChild(script); // run the script
    document.head.removeChild(script); // clean up
})(document, function(window, document) {

    function startsWith(s, prefix) {
        return s.substr(0, prefix.length) === prefix;
    }

    function hrefIsPage(h) {
        return h != null && !startsWith(h, 'javascript:') && !startsWith(h, '#');
    }

    function onEvent(evt) {
        var el = evt.srcElement || evt.originalTarget;

        if (el.nodeName.toUpperCase() === 'A' && hrefIsPage(el.getAttribute('href')) &&
            (el.getAttribute('target') === null || el.getAttribute('target') === '_top')) {

            el.setAttribute('target', '_blank');
        }

        return true;
    }

    document.addEventListener('click', onEvent);
    document.addEventListener('focus', onEvent, true);
    document.addEventListener('focusin', onEvent);

});
