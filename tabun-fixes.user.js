// ==UserScript==
// @name    Tabun fixes
// @version    1
// @description    Исправляет некоторые "недостатки" табуна. Вернее, делает некоторые вещи более удобными лично мне :3 Время всегда ставится точное (никаких "пять минут назад" или "только что"), заминусованные до -5 комменты скрываются, а не делаются серыми, любые комменты можно скрыть вручную по одному, чтобы заткнуть музыку или не разрывать себе экран, например. Также добавил таймлайн комментов внизу (около широкого режима)
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

function simpleTemplate(template/*, objects*/) {
    var objects = Array.prototype.slice.call(arguments, 1);
    return template.replace(/{{(.*?)}}/g, function(_, name) {
        var res;
        if (!objects.some(function(o) { res=o[name]; return name in o } )) {
            throw new Error("Value not found");
        }
        return res;
    });
}

var consts = {
    clsCommentHidden: 'tabun-fixes-hidden',
    clsCommentProcessed: 'tabun-fixes-processed',
    clsBtnCommentHide: 'tabun-fixes-btnhide',

    idChronology: 'tabun-fixes-chronology',
    idChronologyPlus: 'tabun-fixes-chronology-plus',
    idChronologyMinus: 'tabun-fixes-chronology-minus',
    idChronologyTimeline: 'tabun-fixes-chronology-timeline',
    idChronologySlider: 'tabun-fixes-chronology-slider',
}

var btnCommentShow = '<A href="javascript:void(0)" onclick="return tabunFixes.unhideComment({{id}})">Раскрыть комментарий</A>'
  , btnCommentHide = '<LI class="{{clsBtnCommentHide}}"><A href="javascript:void(0)" onclick="return tabunFixes.hideComment({{id}})">Скрыть</A></LI>'
  , removedComments = {}
  , chronology = []
  , visibleCommentsCount = chronology.length

window.tabunFixes = {
    hideComment: function(id) {
        if (removedComments[id] == null) {
            var elComment = $('#comment_id_' + id)
              , elText = $('.comment-content .text', elComment);

            removedComments[id] = elText.html();
            elComment.addClass(consts.clsCommentHidden);
            elText.html(simpleTemplate(btnCommentShow, consts, {id: id}));
        }
    },
    unhideComment: function(id) {
        if (removedComments[id] != null) {
            var elComment = $('#comment_id_' + id);
            $('.comment-content .text', elComment).html(removedComments[id]);
            delete removedComments[id];
            elComment.removeClass(consts.clsCommentHidden);
        }
    }
}

function fixTime(elements) {
    $(elements).each(function() {
        var self = $(this)
          , title = self.attr('title');

        if (title) {
            self.text(title);
        }
    })
}

function prepareComments(elements) {
    var ids = []
      , showAll = visibleCommentsCount == chronology.length;

    $(elements).not('.' + consts.clsCommentProcessed).each(function() {
        var elComment = $(this)
          , id = parseInt(elComment.attr('id').replace(/^comment_id_/, ''));

        ids.push(id);

        elComment.addClass(consts.clsCommentProcessed);

        $('.comment-info', elComment).append(
            simpleTemplate(btnCommentHide, consts, { id: id })
        );

        if (elComment.hasClass('comment-bad')) {
            tabunFixes.hideComment(id);
        }

        if (!showAll) {
            // Если уже и сейчас не все комменты показаны, то новодобавленные точно надо скрыть
            elComment.hide();
        }
    });

    ids.sort();
    Array.prototype.push.apply(chronology, ids);
    if (showAll) {
        visibleCommentsCount = chronology.length;
    }
}

$(function() {

    // Стили
    $('<STYLE>').text(simpleTemplate(

        '.comment.comment-bad .comment-content { opacity:1 }                  ' +
        '.{{clsBtnCommentHide}} { display:none }                              ' +
        '.{{clsBtnCommentHide}} A { color:#DDD }                              ' +
        '.comment:hover .{{clsBtnCommentHide}} { display:block }              ' +
        '.comment.{{clsCommentHidden}} .{{clsBtnCommentHide}} { display:none }' +

        '#{{idChronologyTimeline}} { display:inline-block; position:relative; overflow:visible; height:5px; width:100px; margin:3px 10px; border-radius:2px; background:#CCCCCF } ' +
        '#{{idChronologySlider}} { position:absolute; top:-3px; left:0; height:11px; width:10px; border-radius:2px; background:#889; cursor:pointer } ' +
        '#{{idChronologyPlus}} { margin-right:5px } ' +
        '#{{idChronologyMinus}} { margin-left:5px } ' +

        ''

        , consts)
    ).appendTo(document.head);

    // Комменты/посты, уже открытые на странице
    fixTime('.comment .comment-date TIME');
    fixTime('.topic .topic-info-date TIME');
    prepareComments('.comment');

    // Комменты, подгруженные динамически
    ls.hook.add('ls_comments_load_after', function() {
        fixTime('.comment-new .comment-date TIME');
        prepareComments('.comment-new');

        // В том числе, свои:
        fixTime('.comment-self .comment-date TIME');
        prepareComments('.comment-self');
    });

    // Посты, подгруженные с помощью кнопки "получить ещё посты"
    ls.hook.add('ls_userfeed_get_more_after', function() {
        fixTime('.topic .topic-info-date TIME');
    });

    // Меняем захардкоженное время прокрутки комментов с 1000 до 300 (приходится переписывать функцию целиком)
    ls.comments.scrollToComment = function (idComment){
        $.scrollTo('#comment_id_'+idComment,300,{offset:-250});
        if(this.iCurrentViewComment){
            $('#comment_id_'+this.iCurrentViewComment).removeClass(this.options.classes.comment_current);
        }
        $('#comment_id_'+idComment).addClass(this.options.classes.comment_current);
        this.iCurrentViewComment=idComment;
    }

    // Добавляем кнопки управления таймлайном
    if ($('#comments').length) {
        var startScrollTimeout = null;

        var updateSliderPosition = function() {
            var pos
              , elTimeline = $('#' + consts.idChronologyTimeline)
              , elSlider = $('#' + consts.idChronologySlider)

            if (chronology.length < 1) {
                pos = 1;
            } else {
                pos = visibleCommentsCount / chronology.length;
            }

            elSlider.css( 'left', Math.round( pos * (elTimeline.width() - elSlider.width()) ) );
        };

        var scrollToLastVisibleComment = function() {
            if (visibleCommentsCount > 0 && visibleCommentsCount <= chronology.length) {
                ls.comments.scrollToComment(chronology[visibleCommentsCount-1]);
            }
        };

        var setVisibleCommentsCount = function(cnt) {
            if (cnt > chronology.length) {
                cnt = chronology.length;
            } else if (cnt < 0) {
                cnt = 0;
            }

            // if cnt > visibleCommentsCount
            for (var i = visibleCommentsCount; i < cnt; i++) {
                $('#comment_id_' + chronology[i]).show();
            }
            // if <
            for (var i = cnt; i < visibleCommentsCount; i++) {
                $('#comment_id_' + chronology[i]).hide();
            }

            visibleCommentsCount = cnt;

            updateSliderPosition();
        };

        function onMouseMove(ev) {
            var elTimeline = $('#' + consts.idChronologyTimeline)
              , pos = ev.pageX - elTimeline.offset().left;

            if (pos < 0) {
                pos = 0;
            } else if (pos > elTimeline.width()) {
                pos = elTimeline.width();
            }

            setVisibleCommentsCount(Math.round(chronology.length * pos / elTimeline.width()));

            if (startScrollTimeout) {
                clearTimeout(startScrollTimeout);
            }
            startScrollTimeout = setTimeout(function() {
                scrollToLastVisibleComment();
                startScrollTimeout = null;
            }, 500);

            return false;
        };

        function onMouseUp(ev) {
            $(document).off('mousemove', onMouseMove).off('mouseup', onMouseUp);
            if (startScrollTimeout) {
                clearTimeout(startScrollTimeout);
                startScrollTimeout = null;
            }
            scrollToLastVisibleComment();
            return false;
        };

        $('#widemode').prepend('<BR/>').prepend(
            $('<SPAN>').attr('id', consts.idChronology).append(
                $('<A href="javascript:void(0)">-1</A>').attr('id', consts.idChronologyPlus).click(function() {
                    setVisibleCommentsCount(visibleCommentsCount - 1);
                    scrollToLastVisibleComment();
                })
            ).append(
                $('<DIV>').attr('id', consts.idChronologyTimeline).append(
                    $('<DIV>').attr('id', consts.idChronologySlider).on('mousedown', function() {
                        $(document).on('mousemove', onMouseMove).on('mouseup', onMouseUp);
                        return false;
                    })
                ).on('click', function(ev) {
                    var elTimeline = $(this)
                      , pos = ev.pageX - elTimeline.offset().left;

                    setVisibleCommentsCount(Math.round(chronology.length * pos / elTimeline.width()));
                    scrollToLastVisibleComment();

                    return false;
                })
            ).append(
                $('<A href="javascript:void(0)">+1</A>').attr('id', consts.idChronologyMinus).click(function() {
                    setVisibleCommentsCount(visibleCommentsCount + 1);
                    scrollToLastVisibleComment();
                })
            )
        );
        updateSliderPosition();
    }

})

});
