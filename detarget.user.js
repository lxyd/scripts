// ==UserScript==
// @name    Detarget
// @version    1
// @description    Removes "target" attribute from links
// @include    http://*/*
// @include    https://*/*
// @match    http://*/*
// @match    https://*/*
// @author   Alexey Dubinin
// ==/UserScript==

(function(document, fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.textContent = '(' + fn + ')(window, window.document);';
    document.head.appendChild(script); // run the script
    document.head.removeChild(script); // clean up
})(document, function(window, document) {

    function onEvent(evt) {
        var el = evt.srcElement || evt.originalTarget;

        if (el.nodeName.toUpperCase() === 'A') {
            el.removeAttribute('target');
        }

        return true;
    }

    document.addEventListener('click', onEvent);
    document.addEventListener('focus', onEvent, true);
    document.addEventListener('focusin', onEvent);

});
