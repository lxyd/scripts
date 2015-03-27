// ==UserScript==
// @name    Detarget
// @version    2
// @description    Changes target="_blank" to target="_top" to prevent opening links in new tabs/windows
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
        var el = evt.srcElement || evt.originalTarget, nodeName;
        
        try {
           nodeName = el.nodeName
        } catch (err) {
            return true
        }

        if (nodeName.toUpperCase() === 'A' && el.getAttribute('target') === '_blank') {
            el.setAttribute('target', '_top')
        }

        return true
    }

    document.addEventListener('click', onEvent);
    document.addEventListener('focus', onEvent, true);
    document.addEventListener('focusin', onEvent);

});
