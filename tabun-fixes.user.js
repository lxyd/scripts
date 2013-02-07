// ==UserScript==
// @name    Tabun fixes
// @version    3
// @description    Возможность выбрать формат дат, замена кнопки "в избранное" на звёздочку, добавление таймлайна комментов и костыльное исправление бага с дублирующимися комментами при обновлении.
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


//
// КОНФИГУРАЦИЯ
//
// Чтобы выключить функцию, замените значение соответствующей строке на false
// И наоборот, чтобы включить, заменить на true (кроме changeDateFormat, тут надо вводить формат даты)
//
var config = {
    narrowTree: 0,                         /* Целое число  Сузить дерево комментов до этого значения. false или 0, чтобы не сужать*/
    hideHideButton: true,                  /* true/false   Показывать кнопку "Скрыть" только при наведении */
    showFavoriteAsIco: true,               /* true/false   Заменить "В избранное" на звёздочку */
    changeDateFormat: false,               /* Строка       Если надо, впишите сюда формат, например, 'dd.MM.yyyy HH:mm', если нет - false */
    localTime: false,                      /* true/false   Показывать локальное время вместо московского */
    relativeTime: false,                   /* true/false   Для тех, кто соскучился по времени в духе "только что" и "5 минут назад" */
    fixCommentDuplication: true,           /* true/false   Включить костыль для редкого бага с дублированием динамически подгруженных комментов */
    addHistoryTimeline: true,              /* true/false   Добавить скроллер по истории появления комментариев */
}

//
// 1. Сужение дерева комментариев стилевым хаком
//
if (config.narrowTree) {
    (function() {
        var style = '.comment-wrapper';
        for (var i = 1; i < config.narrowTree; i++) {
            style += ' .comment-wrapper';
        }
        $('<STYLE>').text(
            style + ' { padding-left: 0 !important } '
        ).appendTo(document.head);
    })();
}

//
// 2. скрытие кнопки "Скрыть"
//
if (config.hideHideButton) {
    (function() {
        $('<STYLE>').text(
            '.comment .comment-info .comment-hide { display:none }                ' +
            '.comment:hover .comment-info .comment-hide { display:block }         ' +
            '.comment.{{clsCommentHidden}} .{{clsBtnCommentHide}} { display:none }'
        ).appendTo(document.head);
    })();
}

//
// 3. отображение "В избранное" в виде пиктограммы
//
if (config.showFavoriteAsIco) {
    (function() {

        var clsProcessed = 'tabun-fixes-processed';

        $('<STYLE>').text(
            '.comment-info .favourite .icon-synio-favourite { width:11px; height:11px; background-position:0px -37px }' +
            '.comment-info .favourite.active .icon-synio-favourite { background-position:0px -65px }' +
            '.topic-info .favourite .icon-synio-favourite { width:11px; height:11px; background-position:0px -37px }' +
            '.topic-info .favourite.active .icon-synio-favourite { background-position:0px -65px }'
        ).appendTo(document.head);

        function process(elements) {
            $(elements)
                .html('<i class="icon-synio-favourite"></i>')
                .attr('title', 'Избранное')
                .addClass(clsProcessed);
        }

        // Комменты/посты, уже открытые на странице
        $(function() {
            process('.comment-info .favourite');
            process('.topic-info .favourite');
        });

        // Комменты, подгруженные динамически
        ls.hook.add('ls_comment_inject_after', function() {
            process('.comment-info .favourite', this);
        });

        // Посты, подгруженные с помощью кнопки "получить ещё посты"
        ls.hook.add('ls_userfeed_get_more_after', function() {
            process($('.topic-info .favourite').not('.' + clsProcessed));
        });

    })();
}

//
// 4. форматирование дат
//

// Если мы в том же часовом поясе, что и Москва, то нам можно не заморачиваться с поясами
if (new Date().getTimezoneOffset() == -240) {
    config.localTime = false;
}

if (config.changeDateFormat || config.localTime || config.relativeTime) {
    (function() {
        /**
         * Переформатирует дату/время, представленную в виде строки isoDateTime, например 2013-02-06T23:01:33+04:00
         * в требуемый формат. Допустимые элементы формата:
         * - yyyy, yy - год (четыре или две цифры)
         * - M, MM, MMM, MMMM - месяц (одна/две цифры или сокращённое/полное название)
         * - d, dd - день
         * - H, HH - час
         * - m, mm - минуты
         * - s, ss - секунды
         *
         * @param strDate - дата в формате isoDateTime
         * @param strFormat - строка формата
         * @param bToLocal - конвертировать ли дату в локальную из той зоны, в которой она представлена
         *
         * @return переформатированные дату/время
         */
        var reformatDateTime = (function() {
            var aMonthsLong = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
              , aMonthsShort = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек']

            function padIntWithZero(x) { return x < 10 ? '0'+x : ''+x }
            
            return function(strDate, strFormat, bToLocalDate) {
                var arr;
                if (!bToLocalDate) {
                    arr = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(strDate);
                } else {
                    var d = new Date(strDate);
                    arr = [
                        null,
                        '' + d.getFullYear(),
                        padIntWithZero(d.getMonth() + 1),
                        padIntWithZero(d.getDate()),
                        padIntWithZero(d.getHours()),
                        padIntWithZero(d.getMinutes()),
                        padIntWithZero(d.getSeconds()),
                        padIntWithZero(d.getMilliseconds()),
                    ];
                }
                return strFormat.replace(/yyyy|yy|MMMM|MMM|MM|M|dd|d|HH|H|mm|m|ss|s/g, function(pattern) {
                    switch(pattern) {
                        case 'yyyy': return arr[1];
                        case 'yy'  : return arr[1].substring(2);
                        case 'MMMM': return aMonthsLong[parseInt(arr[2])-1];
                        case 'MMM' : return aMonthsShort[parseInt(arr[2])-1];
                        case 'MM'  : return arr[2];
                        case 'M'   : return parseInt(arr[2]);
                        case 'dd'  : return arr[3];
                        case 'd'   : return parseInt(arr[3]);
                        case 'HH'  : return arr[4];
                        case 'H'   : return parseInt(arr[4]);
                        case 'mm'  : return arr[5];
                        case 'm'   : return parseInt(arr[5]);
                        case 'ss'  : return arr[6];
                        case 's'   : return parseInt(arr[6]);
                    }
                });
            }
        })();

        var defaultDateFormat = 'd MMMM yyyy, HH:mm'
          , clsProcessed = 'tabun-fixes-processed';

        function process(elements) {
            $(elements).each(function() {
                var dt = this.getAttribute('datetime')

                if (config.changeDateFormat || config.localTime) {
                    dt = reformatDateTime(dt, config.changeDateFormat || defaultDateFormat, config.localTime);
                }
                if (config.relativeTime) {
                    this.innerHTML = this.getAttribute('title');
                    this.setAttribute('title', dt);
                } else {
                    this.innerHTML = dt;
                }
            }).addClass(clsProcessed);
        }

        // Комменты/посты, уже открытые на странице
        $(function() {
            process('.comment .comment-date TIME');
            process('.topic .topic-info-date TIME');
        });

        // Комменты, подгруженные динамически
        ls.hook.add('ls_comment_inject_after', function() {
            process('.comment-date TIME', this);
        });

        // Посты, подгруженные с помощью кнопки "получить ещё посты"
        ls.hook.add('ls_userfeed_get_more_after', function() {
            process($('.topic .topic-info-date TIME').not('.'+clsProcessed));
        });

    })();
}

//
// 5. Фикс дублирования комментов
//
if (config.fixCommentDuplication) {
    (function() {

        var commentsIds = {}
          , removed = []

        // Комменты, подгруженные динамически
        ls.hook.add('ls_comment_inject_after', function() {
            var id = this.attr('id').replace('comment_wrapper_id_', '')

            if (commentsIds[id]) {
                this.remove();
                removed.push(id);
            }

            commentsIds[id] = true;

        }, 0 /*highest priority*/);

        // Уберём удалённые дубликаты из количества новых
        ls.hook.add('ls_comments_load_after', function() {
            ls.comments.aCommentNew = ls.comments.aCommentNew.filter(function(id) {
                return removed.indexOf(parseInt(id)) == -1;
            });
            ls.comments.setCountNewComment(ls.comments.aCommentNew.length);
            removed = [];
        });

        $(function() {
            $('.comment').each(function() {
                commentsIds[this.getAttribute('id').replace('comment_id_', '')] = true;
            });
        });

    })();
}

//
// 6. Добавляем таймлайн
//
if ($('#comments').length && config.addHistoryTimeline) {
    (function() {

        var chronology = []
          , visibleCommentsCount

        var idChronology = 'tabun-fixes-chronology'
          , idChronologyPlus = 'tabun-fixes-chronology-plus'
          , idChronologyMinus = 'tabun-fixes-chronology-minus'
          , idChronologyTimeline = 'tabun-fixes-chronology-timeline'
          , idChronologySlider = 'tabun-fixes-chronology-slider';

        $('<STYLE>').text(
            '#' + idChronologyTimeline + ' { display:inline-block; position:relative; overflow:visible; height:5px; width:100px; margin:3px 10px; border-radius:2px; background:#CCCCCF } ' +
            '#' + idChronologySlider + ' { position:absolute; top:-3px; left:0; height:11px; width:10px; border-radius:2px; background:#889; cursor:pointer } ' +
            '#' + idChronologyPlus + ' { margin-right:5px } ' +
            '#' + idChronologyMinus + ' { margin-left:5px } '
        ).appendTo(document.head);

        var startScrollTimeout = null;

        var updateSliderPosition = function() {
            var pos
              , elTimeline = $('#' + idChronologyTimeline)
              , elSlider = $('#' + idChronologySlider)

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
            var elTimeline = $('#' + idChronologyTimeline)
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

        // Комменты, подгруженные динамически
        ls.hook.add('ls_comment_inject_after', function() {
            var showAll = visibleCommentsCount == chronology.length;
            var id = parseInt($('.comment', this).attr('id').replace('comment_id_', ''));
            chronology.push(id);
            if (showAll) {
                visibleCommentsCount = chronology.length;
            }
        });

        $(function() {

            chronology = Array.prototype.map.call($('.comment'), function(c) {
                return parseInt(c.getAttribute('id').replace('comment_id_', ''));
            });

            chronology.sort();
            visibleCommentsCount = chronology.length;

            $('#widemode').prepend('<BR/>').prepend(
                $('<SPAN>').attr('id', idChronology).append(
                    $('<A href="javascript:void(0)">-1</A>').attr('id', idChronologyPlus).click(function() {
                        setVisibleCommentsCount(visibleCommentsCount - 1);
                        scrollToLastVisibleComment();
                    })
                ).append(
                    $('<DIV>').attr('id', idChronologyTimeline).append(
                        $('<DIV>').attr('id', idChronologySlider).on('mousedown', function() {
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
                    $('<A href="javascript:void(0)">+1</A>').attr('id', idChronologyMinus).click(function() {
                        setVisibleCommentsCount(visibleCommentsCount + 1);
                        scrollToLastVisibleComment();
                    })
                )
            );
            updateSliderPosition();

        });
    })();
}

});
