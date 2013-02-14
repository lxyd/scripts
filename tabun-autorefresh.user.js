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

        var enabledByDefault = true
          , period = 30 * 1000
          , updateComments = function() {
                ls.comments.load(topicId, type, undefined, true);
            }
          , arr = /(?:^|\s)ls\.comments\.load\(([0-9]+),\s*'(topic|talk)'\)/.exec($('#update-comments').attr('onclick')) || []
          , topicId = arr[1]
          , type = arr[2]


        if (topicId != null && type != null) {

            var idInterval = null
              , elCheck = $('<INPUT>', {
                    type: 'checkbox',
                    title: 'Обновлять автоматически'
                }).appendTo(
                    $('<DIV>').css({
                        paddingTop: 2,
                        width: 25,
                        textAlign: 'center'
                    }).insertAfter('#update-comments')
                ).on('change', function() {
                    if (elCheck.is(':checked')) {
                        if (idInterval != null) {
                            clearInterval(idInterval);
                        }
                        idInterval = window.setInterval(updateComments, period);
                    } else {
                        if (idInterval != null) {
                            clearInterval(idInterval);
                        }
                        idInterval = null;
                    }
                });

            if (enabledByDefault) {
                elCheck.attr('checked', 'checked');
                idInterval = window.setInterval(updateComments, period);
            }
        }

    });

});
