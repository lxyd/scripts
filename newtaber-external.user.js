// ==UserScript==
// @name    Newtaber External
// @version    1
// @description    All your links are belong to "_blank". Adds target="_blank" to the EXTERNAL links without target or with target="_top"
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

    function hrefIsExternalPage(h) {
        if (h == null || startsWith(h, 'javascript:') || startsWith(h, '#')) {
            return false;
        }
        var t = /^\w+\:\/\/(.*)$/.exec(h);
        return t && t[1] && !startsWith(t[1], window.location.host);
    }

    function onEvent(evt) {
        var el = evt.srcElement || evt.originalTarget;

        if (el.nodeName.toUpperCase() === 'A' && hrefIsExternalPage(el.getAttribute('href')) &&
            (el.getAttribute('target') === null || el.getAttribute('target') === '_top')) {

            el.setAttribute('target', '_blank');
        }

        return true;
    }

    document.addEventListener('click', onEvent);
    document.addEventListener('focus', onEvent, true);
    document.addEventListener('focusin', onEvent);

});
