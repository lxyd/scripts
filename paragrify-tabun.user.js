// ==UserScript==
// @name    Paragrify Tabun
// @version    3
// @description    Преобразует br'ы в топиках табуна в параграфы
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
})(document, function(window, document) {


var styleAttached = false;

function isParaSplit(el) {
    return el && el.nodeType == 1 &&
        (el.nodeName.toUpperCase() == "BR" ||
        getComputedStyle(el).display == "block")
}

function isLastParaSplit(el) {
    var res = isParaSplit(el);
    while (res && (el = el.nextSibling)) {
        res = res && !isParaSplit(el)
    }
    return res
}

function wrap(el, back) {
    var next = back ? function(e) { return e.previousSibling } : function(e) { return e.nextSibling }
      , first = next(el)
      , last = null
      , tmp = first
      , empty = true;

    while (tmp && !isParaSplit(tmp)) {
        empty = empty && tmp.nodeType == 3 && !tmp.textContent.trim();
        last = tmp;
        tmp = next(tmp)
    }

    if (!empty) {
        var p = document.createElement('P')
          , from = back ? last : first
          , to = back ? first : last
          , children = [];

        if (back) {
            el.parentNode.insertBefore(p, el)
        } else if (el.nextSibling) {
            el.parentNode.insertBefore(p, el.nextSibling)
        } else {
            el.parentNode.appendChild(p)
        }

        for (var e = from; e != to; e = e.nextSibling) {
            children.push(e)
        }
        children.push(to);
        for (var i = 0; i < children.length; i++) {
            p.appendChild(children[i])
        }

        return true
    }

    return false
}

$(function() {
    $('#content .topic .info-top').append(
        $('<A style="color:#AAA" href="#">Paragrify&nbsp;&para;</A>').bind('click', function() {

            if (!styleAttached) {
                $('<STYLE>').text('#content .topic .content P { text-indent: 15pt; margin: 10pt 0 0; text-align: justify }').appendTo(document.head);
                styleAttached = true
            }

            $('.content *', $(this).closest('.topic')).not('PRE *').each(function() {
                if (isParaSplit(this)) {
                    var wrapped = wrap(this, true);
                    if (isLastParaSplit(this)) {
                        wrapped = wrap(this, false) || wrapped
                    }
                    if (wrapped && this.nodeType == 1 && this.nodeName.toUpperCase() == "BR") {
                        this.parentNode.removeChild(this)
                    }
                }
            });

            $(this).remove();

            return false
        })
    )
})

});

