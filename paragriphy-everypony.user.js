// ==UserScript==
// @name    Paragriphy Everypony
// @version    5
// @description    Преобразует br'ы в параграфы в топиках табуна и форума everypony.ru, а также в рассказах на stories
// @include    http://tabun.everypony.ru/*
// @include    http://forum.everypony.ru/*
// @include    http://stories.everypony.ru/*
// @match    http://tabun.everypony.ru/*
// @match    http://stories.everypony.ru/*
// @match    http://forum.everypony.ru/*
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
    if (!el || el.nodeType != 1) {
        return false
    }
    if (el.nodeName.toUpperCase() == "BR") {
        return true
    }
    var dsp = getComputedStyle(el).display;

    // hidden blocks are more common than hidden spans, so count hidden elements as blocks too
    return dsp == "block" || dsp == "none";
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

function handleBlock(block, blackList) {
    $('*', block).not('PRE *').not(blackList).each(function() {
        if (isParaSplit(this)) {
            var wrapped = wrap(this, true);
            if (isLastParaSplit(this)) {
                wrapped = wrap(this, false) || wrapped
            }
            if (this.nodeType == 1 && this.nodeName.toUpperCase() == "BR" &&
                (wrapped || !isParaSplit(this.nextSibling))) {
                this.parentNode.removeChild(this)
            }
        }
    });
}

function attachStyleIfNotYet(styleText) {
    if (!styleAttached) {
        $('<STYLE>').text(styleText).appendTo(document.head);
        styleAttached = true
    }
}

function replaceDashes(node, starting, ending) {
    starting = starting || starting == null;
    ending = ending || ending == null;
    if (node.children.length) {
        for (var i = 0; i < node.children.length; i++) {
            replaceDashes(
                    node.children[i],
                    starting && i == 0,
                    ending && i == node.children.length - 1)
        }
    } else {
        node.textContent = node.textContent.replace(/(\s?)-(\s?)/g,
                function(match, l, r, offset, text) {
                    if (!l && offset == 0)
                        return starting ? "— " : match;
                    if (!r && offset == text.length - match.length)
                        return ending ? " —" : match;
                    return l && r ? " — " : match;
                });
    }
}

$(function() {
    switch (window.location.host) {
        case 'tabun.everypony.ru':
            $('.topic .topic-header .topic-info').append(
                $('<A style="color:#AAA; margin-left: 5pt" href="#">Paragriphy&nbsp;&para;</A>').bind('click', function() {
                    attachStyleIfNotYet('.topic-content P { text-indent: 15pt; margin: 5pt 0 0; text-align: justify }');
                    handleBlock($('.text', $(this).closest('.topic')), '.spoiler-title, .spoiler-body');
                    $(this).remove();
                    return false
                })
            );
            break;
        case 'stories.everypony.ru':
            $('.story-panel').append(
                $('<A style="color:#AAA; float: right; font-weight:bold" href="#">Paragriphy&nbsp;&para;</A>').bind('click', function() {
                    attachStyleIfNotYet('.chapter-text P { text-indent: 15pt; margin: 5pt 0 0; text-align: justify }');
                    handleBlock($('.chapter-text'));

                    $('.chapter-text P').each(function() {
                        replaceDashes(this);
                    });

                    $(this).remove();
                    return false
                })
            ).before('&nbsp;&nbsp;');
            break;
        case 'forum.everypony.ru':
            $('.postbody .post-meta .profile-icons').prepend(
                $('<LI>').append(
                    $('<A style="color:#666" href="#">Paragriphy&nbsp;&para;</A>').bind('click', function() {
                        attachStyleIfNotYet('.postbody .content.paragriphyed P { text-indent: 15pt; margin: 5pt 0 0; text-align: justify; font-size: inherit; font-family: inherit }');
                        var block = $('.content', $(this).closest('.postbody'));
                        handleBlock(block, '.bspt, .bspb');
                        block.addClass('paragriphyed');
                        $(this).remove();
                        return false
                    })
                )
            );
            break;
    }
})

});
