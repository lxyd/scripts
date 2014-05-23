// ==UserScript==
// @name    Tabun fixes
// @version    8
// @description    Автообновление комментов, возможность выбрать формат дат, использовать локальное время вместо московского, а также добавление таймлайна комментов и несколько мелких улучшений для табуна. И всё это - с графическим конфигом!
//
// @updateURL https://github.com/lxyd/scripts/raw/master/tabun-fixes.meta.js
// @downloadURL https://github.com/lxyd/scripts/raw/master/tabun-fixes.user.js
//
// @include  http://tabun.everypony.ru/*
// @match    http://tabun.everypony.ru/*
// @include  http://tabun.everypony.info/*
// @match    http://tabun.everypony.info/*
// @include  http://табун.всепони.рф/*
// @match    http://табун.всепони.рф/*
// @author   eeyup
// ==/UserScript==

(function(document, fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.textContent = '(' + fn + ')(window, window.document, jQuery)';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
})(document, function(window, document, $) {


//
// КОНФИГУРАЦИЯ
//
// Чтобы выключить функцию, замените значение соответствующей строке на false
// И наоборот, чтобы включить, заменить на true (кроме changeDateFormat, тут надо вводить формат даты)
//
var defaultConfig = {
    guiConfig: true,                  // 0    true/false   Графический конфигуратор
    narrowTree: 0,                    // 1    Целое число  Сузить дерево комментов до этого значения. false или 0, чтобы не сужать
    hideHideButton: true,             // 2    true/false   Показывать кнопку "Скрыть" только при наведении
    showFavoriteAsIco: true,          // 3    true/false   Заменить "В избранное" на звёздочку
    changeDateFormat: false,          // 4.a  Строка       Если надо, впишите сюда формат, например, 'dd.MM.yyyy HH:mm', если нет - false
    localTime: false,                 // 4.b  true/false   Показывать локальное время вместо московского
    relativeTime: false,              // 4.c  true/false   Для тех, кто соскучился по времени в духе "только что" и "5 минут назад"
    addHistoryTimeline: true,         // 5    true/false   Добавить скроллер по истории появления комментариев
    scrollCommentsByNumber: false,    // 6    true/false   Скроллить комментарии не сверху вниз, а по порядку добавления
    moveTopicAuthorToBottom: false,   // 7    true/false   В топиках переместить автора вниз
    unstyleVisitedNewCommentsAfterUpdate: true,  // 8    true/false   Убирать зелёную подсветку с комментов после автообновления при отправке коммента (нет аналога в гуёвом конфиге)
    unstyleVisitedNewComments: false,  // 8.b    true/false   Убирать зелёную подсветку с комментов сразу после прочтения
    fixSameTopicCommentLinks: true,   // 9    true/false   При клике на ссылки вида http://tabun.everypony.ru/comments/<id> скроллить на коммент "#<id>", если он находится в этом же топике
    autoLoadInterval: 30,             // 10.a Целое число  Если не false и не 0, добавляет галочку для автоподгрузки добавленных комментов (минимальный интервал - 30)
    autoLoadCheckedByDefault: false,  // 10.b true/false   Стоит ли эта галочка по умолчанию
    altToTitle: true,                 // 11   true/false   Копировать поле alt у картинок в поле title, чтобы при наведении появлялась подсказка
    alterMirrorsLinks: true,          // 12   true/false   Преобразовывать ссылки на другие зеркала табуна
    openInnerSpoilersWithShiftOrLongClick: true, // 13   true/false   Открывать вложенные спойлеры, если при нажатии на него был зажат шифт или клик был длинным (0.5 сек)
}, config = defaultConfig;

//
// 0. Графический конфигуратор
//
if (config.guiConfig) {
    (function() {
        var lsKey = "tabun-fixes-config"
          , subConfigs = []
          , cfgUi;

        function loadConfig() {
            try {
                config = $.extend({}, defaultConfig, JSON.parse(window.localStorage.getItem(lsKey) || "{}"));
            } catch (err) {
                alert("Ошибка загрузки конфига скрипта TabunFixes: настройки будут сброшены на умолчальные");
                window.localStorage.removeItem(lsKey);
                config = $.extend({}, defaultConfig);
            }
        }
        
        loadConfig();

        subConfigs.push(
            { // 9. При клике на ссылки вида http://tabun.everypony.ru/comments/<id> скроллить на коммент "#<id>", если он находится в этом же топике
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.fixSameTopicCommentLinks);
                    $('<LABEL>').append(this.chk, "При клике на ссылку на коммент, скроллить на него, если он находится в этом же топике (такие ссылки будут зеленеть при наведении)").appendTo(container);
                },
                getCfg: function() { return { fixSameTopicCommentLinks: this.chk.prop('checked') }; }
            }
          , { // 12. Преобразование ссылок на другие зеркала
                build: function(container, cfg) {
                    var host = window.location.host
                      , hosts = ['tabun.everypony.ru', 'tabun.everypony.info', 'табун.всепони.рф'].filter(function(h){return h != host});

                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.alterMirrorsLinks);
                    $('<LABEL>').append(this.chk, "Открывать ссылки на другие зеркала (" + hosts.join(', ') + ") на текущем зеркале (" + host + ")").appendTo(container);
                },
                getCfg: function() { return { alterMirrorsLinks: this.chk.prop('checked') }; }
            }
          , { // 10. Автоподгрузка комментов
                build: function(container, cfg) {
                    this.txtInterval = $('<INPUT>', { type: 'text' }).css('width', 30).val(cfg.autoLoadInterval).prop('disabled', !cfg.autoLoadInterval);
                    this.chkByDefault = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.autoLoadCheckedByDefault);
                    this.chkEnable = $('<INPUT>', { type: 'checkbox' }).on('change', function() {
                        this.txtInterval.prop('disabled', !this.chkEnable.prop('checked'));
                        this.chkByDefault.prop('disabled', !this.chkEnable.prop('checked'));
                    }.bind(this)).prop('checked', !!cfg.autoLoadInterval);
                    container.append(
                        $('<LABEL>').append(this.chkEnable, "Добавить галочку для автоподгрузки комментов раз в "),
                        this.txtInterval,
                        " секунд (не меньше 30) ",
                        $('<LABEL>').append(this.chkByDefault, "Включать её по умолчанию")
                    );
                },
                getCfg: function() {
                    return {
                        autoLoadInterval: this.chkEnable.prop('checked') ? parseInt(this.txtInterval.val(), 10) : 0,
                        autoLoadCheckedByDefault: this.chkByDefault.prop('checked')
                    }
                }
            }
          , { // 13. Открывать вложенные спойлеры, если спойлер открывается с Shift'ом или двойным кликом
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.openInnerSpoilersWithShiftOrLongClick);
                    $('<LABEL>').append(this.chk, "Открывать вложенные спойлеры, если спойлер открывается с Shift'ом или длинным кликом (0.5 сек)").appendTo(container);
                },
                getCfg: function() { return { openInnerSpoilersWithShiftOrLongClick: this.chk.prop('checked') }; }
            }
          , { // 4 Переформатирование дат
                build: function(container, cfg) {
                    this.txtFormat = $('<INPUT>', { type: 'text' }).val(cfg.changeDateFormat || "").prop('disabled', !cfg.changeDateFormat);
                    this.chkReformat = $('<INPUT>', { type: 'checkbox' }).on('change', function() {
                        this.txtFormat.prop('disabled', !this.chkReformat.prop('checked'));
                    }.bind(this)).prop('checked', !!cfg.changeDateFormat);
                    this.chkLocal = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.localTime);
                    this.chkRelative = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.relativeTime);
                    container.append(
                        $('<LABEL>').append(this.chkReformat, "Сменить формат дат "),
                        this.txtFormat,
                        "<BR/><P style=\"padding-left: 20px\">Формат дат: строка вроде \"d MMMM yyyy, HH:mm\", где:<BR/>" +
                        "yyyy, yy - год (2013 или 13)<BR/>" +
                        "MMMM, MMM, MM, M - месяц (февраля, фев, 02, 2)<BR/>" +
                        "dd, d - день (09 или 9)<BR/>" +
                        "HH, H - часы, mm, m - минуты, ss, s - секунды</P>",
                        $('<LABEL>').append(this.chkLocal, "Отображать локальное время вместо московского"), "<BR/>",
                        $('<LABEL>').append(this.chkRelative, "Отображать время в виде \"5 минут назад\"")
                    );
                },
                getCfg: function() {
                    return { 
                        changeDateFormat: this.chkReformat.prop('checked') ? this.txtFormat.val() : false,
                        localTime: this.chkLocal.prop('checked'),
                        relativeTime: this.chkRelative.prop('checked')
                    }
                }
            }
          , { // 1. Cужение лесенки
                build: function(container, cfg) {
                    this.txtLen = $('<INPUT>', { type: 'text' }).css('width', 30).val(cfg.narrowTree).prop('disabled', !cfg.narrowTree);
                    this.chkEnable = $('<INPUT>', { type: 'checkbox' }).on('change', function() {
                        this.txtLen.prop('disabled', !this.chkEnable.prop('checked'));
                    }.bind(this)).prop('checked', !!cfg.narrowTree);
                    container.append(
                        $('<LABEL>').append(this.chkEnable, "Уменьшить длину лесенки комментов до "),
                        this.txtLen,
                        " (целое число меньше " + ls.registry.get('comment_max_tree') + ")"
                    );
                },
                getCfg: function() {
                    return { narrowTree: this.chkEnable.prop('checked') ? parseInt(this.txtLen.val(), 10) : 0 }
                }
            }
          , { // 3. Заменить "В избранное" на звёздочку
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.showFavoriteAsIco);
                    $('<LABEL>').append(this.chk, "Заменить \"В избранное\" на звёздочку").appendTo(container);
                },
                getCfg: function() { return { showFavoriteAsIco: this.chk.prop('checked') }; }
            }
          , { // 2. Скрытие кнопки "скрыть"
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.hideHideButton);
                    $('<LABEL>').append(this.chk, "Показывать кнопку \"Скрыть\" только при наведении на коммент").appendTo(container);
                },
                getCfg: function() { return { hideHideButton: this.chk.prop('checked') }; }
            }
          , { // 5. Добавить скроллер по истории появления комментариев
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.addHistoryTimeline);
                    $('<LABEL>').append(this.chk, "Добавить скроллер по истории комментариев").appendTo(container);
                },
                getCfg: function() { return { addHistoryTimeline: this.chk.prop('checked') }; }
            }
          , { // 6. Перебирать комментарии не сверху вниз, а по порядку добавления
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.scrollCommentsByNumber);
                    $('<LABEL>').append(this.chk, "Перебирать комментарии не сверху вниз, а по порядку добавления").appendTo(container);
                },
                getCfg: function() { return { scrollCommentsByNumber: this.chk.prop('checked') }; }
            }
          , { // 7. В топиках переместить автора вниз
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.moveTopicAuthorToBottom);
                    $('<LABEL>').append(this.chk, "В информации о топике переместить автора вниз").appendTo(container);
                },
                getCfg: function() { return { moveTopicAuthorToBottom: this.chk.prop('checked') }; }
            }
          , { // 8. Убирать зелёную подсветку с комментов сразу после прочтения
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.unstyleVisitedNewComments);
                    $('<LABEL>').append(this.chk, "Убирать подсветку с прочитанных новых комментов").appendTo(container);
                },
                getCfg: function() { return { unstyleVisitedNewComments: this.chk.prop('checked') }; }
            }
          , { // 11. Копируем атрибуты ALT в TITLE
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.altToTitle);
                    $('<LABEL>').append(this.chk, "Показывать атрибуты alt картинок в виде всплывающих подсказок").appendTo(container);
                },
                getCfg: function() { return { altToTitle: this.chk.prop('checked') }; }
            }
        );

        $('#widemode').append($('<A>', {
            href: 'javascript:void(0)',
            title: 'Настройки user-script\'а TabunFixes'
        }).css({
            background: 'url("/templates/skin/synio/images/icons-synio.png") -272px -74px',
            width: 16,
            height: 24,
            display: 'inline-block',
            verticalAlign: 'bottom',
            position: 'relative',
            bottom: -3
        }).on('click', function() {
            if (cfgUi) {
                cfgUi.remove();
                cfgUi = null;
                return false;
            }
            
            cfgUi = $('<DIV>').css({
                position: 'fixed',
                right: 6,
                bottom: 30,
                width: 450,
                zIndex: 10000,
                background: 'White',
                border: "1px solid Silver",
                borderRadius: 6,
                padding: 10
            })
            
            $('<DIV>').text("Настройки userscript'а TabunFixes").css({
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 15
            }).appendTo(cfgUi);
            // subconfigs
            subConfigs.forEach(function(o) {
                o.build($('<DIV>').css('marginBottom', 10).appendTo(cfgUi), config);
            });
            // Ok/Cancel
            $('<DIV>').appendTo(cfgUi).append(
                $('<A>', { href: 'javascript:void(0)' }).text("ОК (обновите страницу, чтобы сработало)").on('click', function() {
                    try {
                        var cfg = $.extend.apply(null, subConfigs.map(function(o) { return o.getCfg() }));
                        window.localStorage.setItem(lsKey, JSON.stringify(cfg));
                    } catch(err) {
                        alert("Ошибка сохранения конфига: \"" + err.toString() + "\"");
                        return false;
                    }
                    loadConfig();
                    cfgUi.remove();
                    cfgUi = null;
                    return false;
                })
              , $('<A>', { href: 'javascript:void(0)' }).text("Отмена").on('click', function() {
                    cfgUi.remove();
                    cfgUi = null;
                    return false;
                }).css('float', 'right')
            );
            $('BODY').append(cfgUi);
            return false;
        }));

    })();
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
// 2. Скрытие кнопки "Скрыть"
//
if (config.hideHideButton) {
    (function() {
        $('<STYLE>').text(
            '.comment .comment-info .comment-hide { display:none } ' +
            '.comment:hover .comment-info .comment-hide { display:block } '
        ).appendTo(document.head);
    })();
}

//
// 3. Отображение "В избранное" в виде пиктограммы
//
if (config.showFavoriteAsIco) {
    (function() {

        var clsProcessed = 'tabun-fixes-favorites-processed';

        $('<STYLE>').text(
            '.comment-info .favourite .icon-synio-favourite { width:11px; height:11px; background-position:0px -37px }' +
            '.comment-info .favourite.active .icon-synio-favourite { background-position:0px -65px }' +
            '.topic-info .favourite .icon-synio-favourite { width:11px; height:11px; background-position:0px -37px }' +
            '.topic-info .favourite.active .icon-synio-favourite { background-position:0px -65px }' +
            '.table-talk .favourite .icon-synio-favourite { width:17px; height:17px; width:17px;height:17px; background-position:0px -77px }' +
            '.table-talk .favourite.active .icon-synio-favourite { background-position:-17px -77px }'
        ).appendTo(document.head);

        function process(elements) {
            $(elements)
                .html('<i class="icon-synio-favourite"></i>')
                .attr('title', 'Избранное')
                .addClass(clsProcessed);
        }

        // Комменты/посты/письма, уже открытые на странице
        $(function() {
            process('.comment-info .favourite');
            process('.topic-info .favourite');
            process('.table-talk .favourite');
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
// 4. Форматирование дат
//
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
                        case 'MMMM': return aMonthsLong[parseInt(arr[2], 10)-1];
                        case 'MMM' : return aMonthsShort[parseInt(arr[2], 10)-1];
                        case 'MM'  : return arr[2];
                        case 'M'   : return parseInt(arr[2], 10);
                        case 'dd'  : return arr[3];
                        case 'd'   : return parseInt(arr[3], 10);
                        case 'HH'  : return arr[4];
                        case 'H'   : return parseInt(arr[4], 10);
                        case 'mm'  : return arr[5];
                        case 'm'   : return parseInt(arr[5], 10);
                        case 'ss'  : return arr[6];
                        case 's'   : return parseInt(arr[6], 10);
                    }
                });
            }
        })();

        var defaultDateFormat = 'd MMMM yyyy, HH:mm'
          , clsProcessed = 'tabun-fixes-time-processed';

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
            // TODO: список сообщений в личке (он не содержит атрибута datetime)
            process('#sidebar .block-type-stream TIME');
        });

        // Комменты, подгруженные динамически
        ls.hook.add('ls_comment_inject_after', function() {
            process($('.comment-date TIME', this));
        });

        // Посты, подгруженные с помощью кнопки "получить ещё посты"
        ls.hook.add('ls_userfeed_get_more_after', function() {
            process($('.topic .topic-info-date TIME').not('.'+clsProcessed));
        });

    })();
}

//
// 5. Добавляем таймлайн
//
if ($('#comments').length && config.addHistoryTimeline) {
    (function() {

        var chronology = []
          , visibleCommentsCount

        var idChronology = 'tabun-fixes-chronology'
          , idChronologyPlus = 'tabun-fixes-chronology-plus'
          , idChronologyMinus = 'tabun-fixes-chronology-minus'
          , idChronologyPlay = 'tabun-fixes-chronology-play'
          , idChronologyTimeline = 'tabun-fixes-chronology-timeline'
          , idChronologySlider = 'tabun-fixes-chronology-slider'
          , classChronologyDisabled = 'tabun-fixes-chronology-disabled'
          , containerSelector = '#widemode';

        $('<STYLE>').text(
            containerSelector + ' #' + idChronologyTimeline     + ' { display:inline-block; position:relative; overflow:visible; height:5px; margin:3px 5px; border-radius:2px; background:#CCCCCF } ' +
            containerSelector + ' #' + idChronologySlider       + ' { position:absolute; top:-3px; left:0; height:11px; width:10px; border-radius:2px; background:#889; cursor:pointer } ' +
            containerSelector + ' A#' + idChronologyPlay        + ' { margin:0 10px 0 10px; z-index:10; text-decoration:none }' +
            containerSelector + ' A#' + idChronologyPlus        + ' { margin:0 0 0 5px; z-index:10; text-decoration:none } ' +
            containerSelector + ' A#' + idChronologyMinus       + ' { margin:0 5px 0 0; z-index:10; text-decoration:none } ' +
            containerSelector + ' A.' + classChronologyDisabled + ' { color:#AAA; cursor:default }'
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
        
        var updateButtons = function() {
            var elPlus = $('#' + idChronologyPlus)
              , elMinus = $('#' + idChronologyMinus);
            
            if (chronology.length < 1) {
                elPlus.addClass(classChronologyDisabled);
                elMinus.addClass(classChronologyDisabled);
            } else if (visibleCommentsCount == 0) {
                elPlus.removeClass(classChronologyDisabled);
                elMinus.addClass(classChronologyDisabled);
            } else if (visibleCommentsCount == chronology.length) {
                elPlus.addClass(classChronologyDisabled);
                elMinus.removeClass(classChronologyDisabled);
            } else {
                elPlus.removeClass(classChronologyDisabled);
                elMinus.removeClass(classChronologyDisabled);
            }
        }
        
        var updateUI = function() {
            updateSliderPosition();
            updateButtons();
        }

        var scrollToLatestVisibleComment = function() {
            if (visibleCommentsCount > 0 && visibleCommentsCount <= chronology.length) {
                ls.comments.scrollToComment(chronology[visibleCommentsCount-1]);
            }
        };

        var setVisibleCommentsCount = function(cnt, highlightNewlyAppeared) {
            if (cnt > chronology.length) {
                cnt = chronology.length;
            } else if (cnt < 0) {
                cnt = 0;
            }

            // if cnt > visibleCommentsCount
            for (var i = visibleCommentsCount; i < cnt; i++) {
                $('#comment_id_' + chronology[i]).show();
                if (highlightNewlyAppeared) {
                    $('#comment_id_' + chronology[i]).addClass(ls.comments.options.classes.comment_new);
                }
            }
            // if <
            for (var i = cnt; i < visibleCommentsCount; i++) {
                $('#comment_id_' + chronology[i]).hide();
            }
            
            visibleCommentsCount = cnt;

            if (highlightNewlyAppeared) {
                if (ls.comments.aNewComment) {
                    ls.comments.aCommentNew.length = 0;
                }
                ls.comments.calcNewComments();
            }

            updateUI();
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
                scrollToLatestVisibleComment();
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
            scrollToLatestVisibleComment();
            return false;
        };

        // Комменты, подгруженные динамически
        ls.hook.add('ls_comment_inject_after', function() {
            var showAll = visibleCommentsCount == chronology.length;
            var id = parseInt($('.comment', this).attr('id').replace('comment_id_', ''), 10);
            chronology.push(id);
            if (showAll) {
                visibleCommentsCount = chronology.length;
            } else {
                $('.comment', this).hide();
            }
        });

        $(function() {

            chronology = Array.prototype.map.call($('.comment'), function(c) {
                return parseInt(c.getAttribute('id').replace('comment_id_', ''), 10);
            });

            chronology.sort();
            visibleCommentsCount = chronology.length;

            $('#widemode').prepend('<BR/>').prepend(
                $('<SPAN>').attr('id', idChronology).append(
                    $('<A href="javascript:void(0)">-1</A>').attr('id', idChronologyMinus).click(function() {
                        setVisibleCommentsCount(visibleCommentsCount - 1);
                        scrollToLatestVisibleComment();
                    }).attr('title', 'История комментов: на один в прошлое')
                ).append(
                    $('<DIV>').css('width', $('#widemode').width() - 75).attr('id', idChronologyTimeline).append(
                        $('<DIV>').attr('id', idChronologySlider).on('mousedown', function() {
                            $(document).on('mousemove', onMouseMove).on('mouseup', onMouseUp);
                            return false;
                        })
                    ).on('click', function(ev) {
                        var elTimeline = $(this)
                          , pos = ev.pageX - elTimeline.offset().left;

                        setVisibleCommentsCount(Math.round(chronology.length * pos / elTimeline.width()));
                        scrollToLatestVisibleComment();

                        return false;
                    })
                ).append(
                    $('<A href="javascript:void(0)">+1</A>').attr('id', idChronologyPlus).click(function() {
                        setVisibleCommentsCount(visibleCommentsCount + 1);
                        scrollToLatestVisibleComment();
                    }).attr('title', 'История комментов: на один вперёд')
                ).append(
                    $('<A href="javascript:void(0)">▶</A>').attr('id', idChronologyPlay).click(function() {
                        if (visibleCommentsCount < chronology.length) {
                            // if there are comments to show
                            setVisibleCommentsCount(chronology.length, true);
                        }
                        // if ther is not comments to show (button is "disabled") - behave like digits click anyway

                        // like click on digits under the refresh button
                        ls.comments.goToNextComment();
                    }).attr('title', 'История комментов: к настоящему времени, подсветив все как новые')
                )
            );
            updateUI();

        });
    })();
}

//
// 6. Возвращает поведение скролла по новым комментам
//
if (config.scrollCommentsByNumber) {
    (function() {
        function sortNewComments() {
            ls.comments.aCommentNew.sort(
                function(a, b) { return parseInt(a) - parseInt(b) }
            );
        }

        $(sortNewComments);
        ls.hook.add('ls_comments_load_after', sortNewComments);
    })();
}

//
// 7. Перенос имени автора топика вниз
//
if (config.moveTopicAuthorToBottom) {
    (function() {

        var clsBottomAvatar = 'tabun-fixes-bottom-avatar';

        $('<STYLE>').text(
            '.topic-footer .topic-info li.' + clsBottomAvatar + ' { padding: 6px 11px 6px 0px } ' +
            '.topic-footer .topic-info li { padding: 12px 11px 6px 0px }' +
            '.topic-header .topic-blog { font-size: 14px }'
        ).appendTo(document.head);

        function process(elements) {
            $(elements).each(function() {
                var elTopic = $(this)
                  , elName = $('.topic-header .topic-info A[rel=author]', elTopic)
                  , elBottomInfo = $('.topic-footer .topic-info', elTopic);

                if (elName.length) {
                    elName[0].nextSibling.textContent = "";
                    var elAvatar = elName.prev('A');

                    $('<LI>').append(elName).prependTo(elBottomInfo);
                    $('<LI>').append(elAvatar).prependTo(elBottomInfo).addClass(clsBottomAvatar);
                }
            });
        }

        // Посты, уже открытые на странице
        $(function() {
            process('.topic');
        });

        // Посты, подгруженные с помощью кнопки "получить ещё посты"
        ls.hook.add('ls_userfeed_get_more_after', function() {
            process($('.topic').not('.' + clsProcessed));
        });

    })();
}

//
// 8. Убираем зелень с комментов
//
if (config.unstyleVisitedNewComments) {
    (function() {
        ls.comments.goToNextComment = function (){
            if (this.aCommentNew[0]){
                var elComment = $('#comment_id_'+this.aCommentNew[0]);
                if (elComment.length){
                    this.scrollToComment(this.aCommentNew[0]);
                    elComment.removeClass(ls.comments.options.classes.comment_new);
                }
                this.aCommentNew.shift();
            }
            this.setCountNewComment(this.aCommentNew.length);
        }
    })();
} else if (config.unstyleVisitedNewCommentsAfterUpdate) {
    (function() {
        ls.hook.add('ls_comments_load_after', function() {
            $('.' + ls.comments.options.classes.comment_new).each(function() {
                var elComment = $(this)
                  , id = elComment.attr('id').replace('comment_id_', '');

                if (ls.comments.aCommentNew.indexOf(id) == -1 &&
                    ls.comments.aCommentNew.indexOf(parseInt(id)) == -1) {

                        elComment.removeClass(ls.comments.options.classes.comment_new);
                }
            });
        });
    })();
}

//
// 9. Ссылки на комменты в этом же топике
//
if (config.fixSameTopicCommentLinks) {
    (function() {

        var prefixes = [
                'http://tabun.everypony.ru/comments/',
                'http://tabun.everypony.ru' + window.location.pathname + '#comment',
                'http://tabun.everypony.info/comments/',
                'http://tabun.everypony.info' + window.location.pathname + '#comment',
                'http://табун.всепони.рф/comments/',
                'http://табун.всепони.рф' + window.location.pathname + '#comment',
                '#comment'
            ]
          , selector = prefixes.map(function(p){return'A[href^="'+p+'"]'}).join(', ')
          , clsSameTopicLink = 'tabun-fixes-same-topic-link'
          , elClickedLink = null
          , elBackLink;

        $('<STYLE>').text(
            'A.' + clsSameTopicLink + ', ' +
            'A.' + clsSameTopicLink + ':hover, ' +
            'A.' + clsSameTopicLink + ':visited { color: #0A0 !important } '
        ).appendTo(document.head);
        
        function addBackLink(idComment) {
            elBackLink = $('<LI class="goto"><A href="#" title="Назад">←</A></LI>').on('click', function(ev){
                elBackLink.remove();
                scrollToElement(elClickedLink);
                ev.stopImmediatePropagation();
                return false;
            });

            elBackLink.insertAfter('#comment_id_' + idComment + ' > .comment-info .comment-link');
        }
        
        function highlightComment(idComment) { // from ls.comments.scrollToComment
            if (ls.comments.iCurrentViewComment) {
                $('#comment_id_'+ls.comments.iCurrentViewComment).removeClass(ls.comments.options.classes.comment_current);
            }				
            $('#comment_id_'+idComment).addClass(ls.comments.options.classes.comment_current);
            ls.comments.iCurrentViewComment=idComment;
        }
        
        function scrollToElement(el) {
            if (el == null) {
                return;
            }
            var elComment = $(el).closest('.comment');
            if (elComment.length) {
                var id = parseInt(elComment.attr('id').replace('comment_id_', ''), 10);
                highlightComment(id);
            }
            $.scrollTo(el, 300, {offset: -250});
        }

        function sameTopicCommentId(href) {
            var res = null, commentId;
            prefixes.forEach(function(p) {
                if (href.substr(0, p.length) == p) {
                    commentId = href.substr(p.length);
                    if ($('#comment_id_' + commentId).length) {
                        res = commentId;
                    }
                }
            });
            return res;
        }

        $(document).on('click', selector, function(ev) {

            var scrollableId = sameTopicCommentId(this.getAttribute('href'));
            if (scrollableId) {
                // update .hash part of the url avoiding immediate scrolling
                var elCommentAnchor = $('#comment_id_' + scrollableId + ' A[name="comment' + scrollableId + '"]');
                elCommentAnchor.attr('name', 'mungle-comment' + scrollableId);
                window.location.hash = "comment" + scrollableId;
                elCommentAnchor.attr('name', 'comment' + scrollableId);
                // smooth scroll to the element
                ls.comments.scrollToComment(scrollableId);
                // remember what link was clicked and place back link
                elClickedLink = this;
                addBackLink(scrollableId);

                ev.stopImmediatePropagation();
                return false;
            }

        }).on('mouseenter', selector, function(ev) {
            
            if (sameTopicCommentId(this.getAttribute('href'))) {
                $(this).addClass(clsSameTopicLink);
            }
            
        }).on('mouseleave', selector, function(ev) {

            $(this).removeClass(clsSameTopicLink);
            
        });

    })();
}

//
// 10. Автоподгрузка комментов
//
if (config.autoLoadInterval) {
    $(function() {
        var period = Math.max(30, config.autoLoadInterval) * 1000
          , arr = /(?:^|\s)ls\.comments\.load\(([0-9]+),\s*'(topic|talk)'\)/.exec($('#update-comments').attr('onclick')) || []
          , topicId = arr[1]
          , type = arr[2]

        if (topicId != null && type != null) {

            var eventsToCatchInitialFocus = 'keydown mousedown focus mousemove'
              , focused = false
              , reloadWhenNotFocused = false
              , enabled = config.autoLoadCheckedByDefault
              , needReloadingWhenFocused = false
              , idInterval = null
              , updateComments = function() {
                    ls.comments.load(topicId, type, undefined, true);
                }

            $(window).on('focus', function(){
                focused = true;
                handleStateChange();
            });
            
            $(window).on('blur', function(){
                focused = false;
                handleStateChange();
            });
            
            $(document).on(eventsToCatchInitialFocus, function handler() {
                focused = true;
                $(document).off(eventsToCatchInitialFocus, handler);
                handleStateChange();
            });
            
            var divContainer = $('<DIV>').css({
                    paddingTop: 2,
                    width: 25,
                    textAlign: 'center',
                    borderRadius: 2
                }).insertAfter('#update-comments')
              , elCheck = $('<INPUT>', {
                    type: 'checkbox',
                    title: 'Обновлять автоматически'
                }).on('change', function() {
                    enabled = elCheck.prop('checked');
                    handleStateChange();
                }).on('mousedown', function() {
                    var longPressTimer = window.setTimeout(function() {
                        reloadWhenNotFocused = !reloadWhenNotFocused;
                        handleStateChange();
                    }, 1300);
                    $(document).on('mouseup', function mouseUp() {
                        window.clearTimeout(longPressTimer);
                        $(document).off('mouseup', mouseUp);
                    })
                }).appendTo(divContainer).prop('checked', enabled);

            function handleStateChange() {
                divContainer.css({
                    margin: reloadWhenNotFocused ? -1 : 0,
                    border: reloadWhenNotFocused ? "1px solid #AA0" : "none"
                });
                elCheck.attr('title', 
                    reloadWhenNotFocused ? "Обновляются даже когда вкладка не активна" : 
                    enabled ?"Обновляются автоматически" : "Обновлять автоматически"
                );
                
                if (!idInterval && enabled && (focused || reloadWhenNotFocused)) {
                    if (needReloadingWhenFocused && focused) {
                        updateComments();
                        needReloadingWhenFocused = false;
                    }
                    idInterval = window.setInterval(timerFunc, period);
                }
            }
            
            function timerFunc() {
                if (!enabled || !focused && !reloadWhenNotFocused) {
                    console.log('clearing');
                    needReloadingWhenFocused = enabled;
                    window.clearInterval(idInterval);
                    idInterval = null;
                    return;
                }
                updateComments();
            }

        }
    });
}

//
// 11. В картинках в топиках и комментах ALT -> TITLE
//
if (config.altToTitle) {
    (function() {
        var clsProcessed = 'tabun-fixes-alt-to-title-processed';

        function process(elements) {
            $(elements).each(function() {
                var alt = this.getAttribute('alt')
                  , title = this.getAttribute('title');

                if (alt && !title) {
                    this.setAttribute('title', alt);
                } else if (alt && title && alt != title) {
                    this.setAttribute('title', title + "(alt: " + alt + ")");
                }

            }).addClass(clsProcessed);
        }

        // Комменты/посты, уже открытые на странице
        $(function() {
            process('IMG');
        });

        // Комменты, подгруженные динамически
        ls.hook.add('ls_comment_inject_after', function() {
            process($('IMG', this));
        });

        // Посты, подгруженные с помощью кнопки "получить ещё посты"
        ls.hook.add('ls_userfeed_get_more_after', function() {
            process($('IMG').not('.'+clsProcessed));
        });

    })();
}

//
// 12. Преобразование ссылок на другие зеркала
//
if (config.alterMirrorsLinks) {
    (function() {
        var host = window.location.host
          , hosts = ['tabun.everypony.ru', 'tabun.everypony.info', 'табун.всепони.рф'].filter(function(h){return h != host})
          , selector = hosts.map(function(h){return'A[href^="http://'+h+'"]'}).join(', ')
          , rootLinkRe = /^https?:\/\/[^\/]*\/*$/;

        function isRootLink(href) {
            return rootLinkRe.test(href);
        }

        $(document).on('mousedown', selector, function(ev) {

            var self = $(this)
              , href = self.attr('href')
              , newHref = href;

            if (isRootLink(href)) {
                return; // we don't alter links to the root pages of sites
            }

            hosts.forEach(function(h) {
                newHref = newHref.replace(h, host); // first appearance is enough
            });

            // altering href
            self.attr('href', newHref);

        });
    })();
}

//
// 13. Открывать вложенные спойлеры, если спойлер открывается с Shift'ом или длинным кликом (0.5 сек)
//
if (config.openInnerSpoilersWithShiftOrLongClick) {
    (function() {
        var timeMouseDown = 0;
        
        function getNow() {
            return Date.now ? Date.now() : new Date().getTime();
        }
        
        function setAllSpoilersOpen(elBlock, open) {
            $('.spoiler-body', elBlock).css('display', open ? 'block' : 'none');   
        }

        function processInnerSpoilers(elTitle, invert) {
            var elBody = $(elTitle).next('.spoiler-body')
              , opening = !elBody.is(':visible'); // if body is not yet visible, we are probably opening it
            
            if (invert) {
                opening = !opening;
            }

            if (opening) {
                setAllSpoilersOpen(elBody, true);
            } else {
                window.setTimeout(function() {
                    setAllSpoilersOpen(elBody, false);
                }, 400);
            }
        }

        $(document).on('mousedown', '.spoiler-title', function(ev) {
            timeMouseDown = getNow();
        });

        $(document).on('click', '.spoiler-title', function(ev) {
            if (ev.shiftKey || (timeMouseDown && (getNow() - timeMouseDown > 500))) {
                processInnerSpoilers(this);
            }
            timeMouseDown = 0;
        });
    })();
}

});
