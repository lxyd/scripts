// ==UserScript==
// @name    Detarget
// @version    1
// @description    Removes "target" attribute from links
// @include    http://*/*
// @match    http://*/*
// @author   Alexey Dubinin
// ==/UserScript==

(function(document, fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.textContent = '(' + fn + ')(window, window.document);';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
})(document, function(window, document) {

    function domReady(fun) {
        if (document.readyState === "interactive" || document.readyState === "complete") {
            fun();
        } else {
            document.addEventListener("DOMContentLoaded", fun, false);
        }
    }

    function onEvent(evt) {
        var el = evt.srcElement || evt.originalTarget;

        if (el.nodeName.toUpperCase() === 'A') {
            el.removeAttribute('target');
        }

        return true;
    }

    domReady(function() {
        document.addEventListener('click', onEvent);
        document.addEventListener('focus', onEvent, true);
        document.addEventListener('focusin', onEvent);
    });

});
