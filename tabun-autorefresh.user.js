// ==UserScript==
// @name    Tabun autorefresh
// @version    1
// @description    Автоматически обновляет комменты в открытых топиках
// @include    http://tabun.everypony.ru/*
// @match    http://tabun.everypony.ru/*
// @author   eeyup
// ==/UserScript==

(function(document, fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.textContent = '(' + fn + ')(window, window.document)';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
})(document, function(window, document, undefined) {

    $(function() {

        var arr = /(?:^|\s)ls\.comments\.load\(([0-9]+),\s*'(topic|talk)'\)/.exec($('#update-comments').attr('onclick'));


        if (arr != null) {
            var topicId = arr[1]
              , type = arr[2];

            if (topicId != null && type != null) {
                setInterval(function(){

                    ls.comments.load(topicId, type, undefined, true);

                }, 30 * 1000);
            }
        }

    });

});
