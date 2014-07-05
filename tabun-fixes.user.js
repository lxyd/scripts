// ==UserScript==
// @name    Tabun fixes
// @version    18
// @description    Автообновление комментов, возможность выбрать формат дат, использовать локальное время вместо московского, а также добавление таймлайна комментов и несколько мелких улучшений для табуна. И всё это - с графическим конфигом!
//
// @updateURL https://github.com/lxyd/scripts/raw/master/tabun-fixes.meta.js
// @downloadURL https://github.com/lxyd/scripts/raw/master/tabun-fixes.user.js
//
// @grant none
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

var whatsNew =
    '<strong>Что нового:</strong><br>'+
    '• Можно отображать количество непрочитанных комментов в иконке сайта<br>'+
    '• Lite-спойлеры теперь совместимы с темой <a href="http://userstyles.org/styles/92211/night-tabun">Night Tabun</a><br>'+
    '• Можно использовать кнопку пробел для пробегания по новым комментариям или по постам в ленте (эту функцию нужно включить в настройках)';

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
    boostScrollToComment: true,       // 14   true/false   Ускорить scrollToComment (не выключается в графическом конфиге)
    liteSpoilersAlwaysOpen: false,    // 15   true/false   Светить буквами в лайт-спойлерах
    liteSpoilersOpenOnBlockHover: false, // 16 true/false  Приоткрывать лайт-спойлеры по наведению на коммент/пост
    spaceBarMovesToNext: false,       // 17   true/false   По пробелу переходить на следующий пост/непрочитанный коммент
    countUnreadInFavicon: false,      // 18   true/false   Показывать кол-во непрочитанный комментов в favicon'е
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
          , { // 15. Всегда светить буквы в лайт-спойлерах
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.liteSpoilersAlwaysOpen);
                    $('<LABEL>').append(this.chk, "Всегда светить буквы в лайт-спойлерах").appendTo(container);
                },
                getCfg: function() { return { liteSpoilersAlwaysOpen: this.chk.prop('checked') }; }
            }
          , { // 16. Приоткрывать лайт-спойлеры по наведению на коммент/пост
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.liteSpoilersOpenOnBlockHover);
                    $('<LABEL>').append(this.chk, "Приоткрывать лайт-спойлеры по наведению на коммент/пост").appendTo(container);
                },
                getCfg: function() { return { liteSpoilersOpenOnBlockHover: this.chk.prop('checked') }; }
            }
          , { // 17. По пробелу переходить на следующий пост/непрочитанный коммент
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.spaceBarMovesToNext);
                    $('<LABEL>').append(this.chk, "По пробелу переходить на следующий пост/непрочитанный коммент").appendTo(container);
                },
                getCfg: function() { return { spaceBarMovesToNext: this.chk.prop('checked') }; }
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
                        "dd, d - день, HH, H - часы, mm, m - минуты, ss, s - секунды (09 или 9)</P>",
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
          , { // 18. Показывать количество непрочитанных в иконке favicon
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.countUnreadInFavicon);
                    $('<LABEL>').append(this.chk, "Показывать количество непрочитанных в иконке сайта").appendTo(container);
                },
                getCfg: function() { return { countUnreadInFavicon: this.chk.prop('checked') }; }
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
                width: 900,
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

            var table = $('<TABLE>').css({
                border: "none",
                width: "100%"
            }).appendTo(cfgUi);
            var tr = $('<TR>').appendTo(table);
            var tdCss = {
                padding: '5px',
                verticalAlign: 'top'
            };
            var td1 = $('<TD>').attr('width', "50%").css(tdCss).css('border-right', '1px solid #EEE').appendTo(tr);
            var td2 = $('<TD>').attr('width', "50%").css(tdCss).appendTo(tr);

            // subconfigs
            subConfigs.forEach(function(o, idx) {
                var td = idx < 8 ? td1 : td2;
                o.build($('<DIV>').css('marginBottom', 10).appendTo(td), config);
            });
            td2.append($('<DIV>').css('border-top', '1px solid #EEE').html(whatsNew));

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
        function getNow() {
            return Date.now ? Date.now() : new Date().getTime();
        }

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

            var longPressDone = false;
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
                        longPressDone = true;
                        handleStateChange();
                    }, 1300);
                    $(document).on('mouseup', function mouseUp() {
                        window.clearTimeout(longPressTimer);
                        $(document).off('mouseup', mouseUp);

                        if (longPressDone) {
                            longPressDone = false;
                            setTimeout(function() {
                                elCheck.prop('checked', reloadWhenNotFocused);
                            }, 0)
                            setTimeout(function() {
                                enabled = elCheck.prop('checked');
                                handleStateChange();
                            }, 0)
                        }
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
        var timeMouseDown = 0
          , bodyIsVisibleOnMouseDown;
        
        function getNow() {
            return Date.now ? Date.now() : new Date().getTime();
        }
        
        function setAllSpoilersOpen(elBlock, open) {
            $('.spoiler-body', elBlock).css('display', open ? 'block' : 'none');   
        }

        function processInnerSpoilers(elTitle) {
            var elBody = $(elTitle).next('.spoiler-body')
              , opening = !bodyIsVisibleOnMouseDown; // if body is not yet visible, we are probably opening it
            
            if (opening) {
                setAllSpoilersOpen(elBody, true);
            } else {
                window.setTimeout(function() {
                    setAllSpoilersOpen(elBody, false);
                }, 400);
            }
        }

        $(document).on('mousedown', '.spoiler-title', function(ev) {
            bodyIsVisibleOnMouseDown = $(this).next('.spoiler-body').is(':visible');
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

//
// 14. Ускоренный scrollToComment (тормозит предыдущую анимацию, т.е. несколько быстрых кликов подряд не будут зависать)
//
if (config.boostScrollToComment) {
    ls.comments._old_scrollToComment = ls.comments.scrollToComment;
    ls.comments.scrollToComment = function (idComment) {
        if ($.fn._scrollable && $.fn.stop) {
            $(window)._scrollable().stop();
        }
        ls.comments._old_scrollToComment.apply(this, arguments);
    }
}


//
// 15. Светить буквами в лайт-спойлерах
// 16. Приоткрывать лайт-спойлеры по наведению на коммент/пост
//
if (config.liteSpoilersAlwaysOpen || config.liteSpoilersOpenOnBlockHover) {
    (function() {
        // http://userstyles.org/styles/92211/night-tabun
        var nightTabun = getComputedStyle($('<SPAN>').attr('class', 'spoiler-gray')[0]).backgroundColor == "rgb(63, 53, 61)"
        // normal state
        //var hiddenBgColor          = nightTabun ? '#3F353D' : '';
        //var hiddenTextColor        = nightTabun ? '#3F353D' : '';
        // always visible state
        var transBgColor           = nightTabun ? '#2F252D' : '#EEE';
        var transTextColor         = nightTabun ? '#8F8F8F' : '#999';
        var transATextColor        = nightTabun ? '#7C89CA' : '#66AAFF';
        var transAVisitedTextColor = nightTabun ? '#7C89CA' : '#66AAFF';
        // hover state (fully visible)
        var hoverTextColor         = nightTabun ? '#DFDFDF' : '#666';
        var hoverATextColor        = nightTabun ? '#7C89CA' : '#0099FF';
        var hoverAVisitedTextColor = nightTabun ? '#7C89CA' : '#0099FF';

        var containers = ['.comment', '.comment-preview', '.topic', '.profile-info-about']
            // селекторы для спойлеров в обычном состоянии
          , selectorSpoiler = containers.map(function(s) { return s + ' .spoiler-gray' }).join(', ')
          , selectorA = containers.map(function(s) { return s + ' .spoiler-gray A' }).join(', ')
          , selectorAVisited = containers.map(function(s) { return s + ' .spoiler-gray A:visited' }).join(', ')
            // селекторы для наведённого коммента/поста
          , selectorPostHoverSpoiler = containers.map(function(s) { return s + ':hover .spoiler-gray' }).join(', ')
          , selectorPostHoverA = containers.map(function(s) { return s + ':hover .spoiler-gray A' }).join(', ')
          , selectorPostHoverAVisited = containers.map(function(s) { return s + ':hover .spoiler-gray A:visited' }).join(', ')
            // и более специфичные селекторы для оригинального лайтспойлера в наведённом состоянии (иначе эти стили не пробиваются через наши)
          , selectorHoverSpoiler = containers.map(function(s) { return s + ':hover .spoiler-gray:hover' }).join(', ')
          , selectorHoverA = containers.map(function(s) { return s + ':hover .spoiler-gray:hover A' }).join(', ')
          , selectorHoverAVisited = containers.map(function(s) { return s + ':hover .spoiler-gray:hover A:visited' }).join(', ')

        if (config.liteSpoilersAlwaysOpen) {
            $('<STYLE>').text(
                selectorSpoiler + ' { background-color: ' + transBgColor + ' !important; color: ' + transTextColor + ' !important; } ' +
                selectorA + ' { color: ' + transATextColor + ' !important; } ' +
                selectorAVisited + ' { color: ' + transAVisitedTextColor + ' !important; } ' +
                // и более специфичные селекторы для оригинального лайтспойлера в наведённом состоянии (иначе эти стили не пробиваются через наши)
                selectorHoverSpoiler + ' { background-color: transparent !important; color: ' + hoverTextColor + ' !important; } ' +
                selectorHoverA + ' { background-color: transparent !important; color: ' + hoverATextColor + ' !important; } ' +
                selectorHoverAVisited + ' { background-color: transparent !important; color: ' + hoverAVisitedTextColor + ' !important; } '
            ).appendTo(document.head);
        }
            
        if (config.liteSpoilersOpenOnBlockHover) {
            $('<STYLE>').text(
                selectorPostHoverSpoiler + ' { background-color: ' + transBgColor + ' !important; color: ' + transTextColor + ' !important; } ' +
                selectorPostHoverA + ' { color: ' + transATextColor + ' !important; } ' +
                selectorPostHoverAVisited + ' { color: ' + transAVisitedTextColor + ' !important; } ' +
                // и более специфичные селекторы для оригинального лайтспойлера в наведённом состоянии (иначе эти стили не пробиваются через наши)
                selectorHoverSpoiler + ' { background-color: transparent !important; color: ' + hoverTextColor + ' !important; } ' +
                selectorHoverA + ' { background-color: transparent !important; color: ' + hoverATextColor + ' !important; } ' +
                selectorHoverAVisited + ' { background-color: transparent !important; color: ' + hoverAVisitedTextColor + ' !important; } '
            ).appendTo(document.head);
        }

    })();
}

//
// 17. По пробелу переходить на следующий пост/непрочитанный коммент
//
if (config.spaceBarMovesToNext) {
    (function() {
        function onSpaceBarPressed() {
            if ($('#update-comments').length) { // we are on comments
                if (ls.comments.aCommentNew.length > 0) {
                    ls.comments.goToNextComment();
                    return true;
                } else {
                    return false;
                }
            } else {
                var article = null;
                $('ARTICLE').each(function() {
                    var el = $(this);
                    if (el.offset().top > $(window).scrollTop() + 40 /*небольшой запас на случай микроскроллов, не очень заметных пользователю*/) {
                        article = el;
                        return false;
                    }
                });
                if (article != null) {
                    if ($.fn._scrollable && $.fn.stop) {
                        $(window)._scrollable().stop();
                    }
                    $.scrollTo(article, 300, {offset: -10});
                    return true;
                } else {
                    return false;
                }
            }
        }

        $(document).on('keypress', function(ev) {
            var el = ev.target;
            if (el.tagName == 'INPUT' || el.tagName == 'SELECT' || el.tagName == 'TEXTAREA' || el.isContentEditable) {
                // ignore input fields (as in https://github.com/ccampbell/mousetrap/blob/master/mousetrap.js)
                return;
            }
            if (ev.key == ' ') {
                if (onSpaceBarPressed()) {
                    ev.preventDefault();
                }
            }
        });
    })();
}

//
// 18. Показывать количество непрочитанных комментариев в favicon'е
//
if (config.countUnreadInFavicon) {
    (function() {
        var el = $('HEAD LINK[rel~="icon"]');

        var icos = [
            { cnt: 0, url: el.attr('href') },
            { cnt: 1, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAEX0lEQVRYw72Xy28bVRTGfzMeO37Fjh07cdImUVqRkEQpUIEQElIWbNjykEBiUR6bSvwz7BBCPLqoVAkJFoU1UndAVSihCUmDojROYtfx+5EZezzD4tjYSRzLmVTc1Wjuveeex/d9517Ftm1OjFM/nuFQTv5Q/8fDe9pXnR9uD/iv/yLtQtlsNqCcBCwIToLmO4/3SncGbEeR61lY/RYefgOVfUfl0BxFbjVAL0L2bzANcPtBUR1hQhsgS6dHeR/W74Cpw/xbMLoAngBObGl9IzV1qKZBUSA4Aapbppo6HK7J/NQKaEOguDpbrQZUDsC2ITAOmvfMU/rnrZqCR7dh7Q7o+c5/dwCGwlB9Cn9+BQ+/Pj6v52XPo9tio8/oj4FGFQ7XwazB2DVIXAfbgvw/4BoSR8oH8HQVRuchtiTZSj2A/V9A84sNxw4oLklvaQc2voednyW9NqBoEF0Cuyk0fHwXtn4CVZMM1DIQnTtemnM74I3AxCst4CUhtwmqB4LjkFiEYFzmKhlIrUElDVZdWBGdg4mXwTPcP8ZWL7DPRKzVgP1fYfUW5LchMAXjszD7HESisiafg+3HkN6G6i5EZmH5QymZy9ODop0ztDN5Xt4DywRfVOrtCcPwOMRnITED0Si4g7IlChzNyHemDp4QqC7Bg6KKndJuT8XsykBX5LWMIDu7LmVwecGyIDQC07Otw7UuElnQMCGXgyfbUDgEuw5jy5IJU4ffPoNmHV74CEau9sJAS9v1rChcUwfzCNI7gvboktQ80o68LowAidIdhAiQq0AhK+wxChCZA7cPGjUB9AnmHy9BOSnabhqicFMrwvPyQQvtg6q1S8SnlITfP4fYIlx9E0afB+9oPxZYYDUFxaMLYiS/KTzHFrTng1Jzt9YFLgsaFQFjJSOVjC9LFvW8lDC2BP74KRAeZ4F51OpqKoSmhNNNA9J/wPp3UEtBfF5AeCnRAWGjAnspSO1AZgP8E7D4HkSuwFFO7Axf6kh57wzYgs4ugGBboudWE+olKKfB8siczyM1b9MwtdOiYVoUsGmIBnijfZtSDx3oxsQebN2Fg/uSmUZtICHaLSp8/OUm9/5Kg6KSOTwkFAo5UMJ6WQ7PbbYAFOlIcSkPxUJHin0x8I+BquFmj3deTHLjjdf59Iv7F5BiuymM8Mdh/u1OM8puwNaPkG215OgcLLz7XzNKpB5w03fEatJAUZQLOOAOQGxBQJS4LhGCKFvTkE4XuiyCM/6SZAhk7eSrUE2Ccu8CDgQSsPSBSGrbeLtNG0UIjMG1T+DyayLX3U1s8X2w1oFbTh2wRQfCM6enXF4RF1MXlTMNyVK79apuCE3DcFGc73PnVc/xiOmM4UmJfHoFNn4QnS89wYktB1dZWyL0x4QZ2pA0mXZfaN/KdB3DMLBtG13X0XW9733A2bPsjIdJsVhkZGTk1PJCoUA4HD52vnLicXrOB4oy+FX+jLqogxd+kLoq596sXcTKsxj/AuTUxfFZF8OPAAAAAElFTkSuQmCC"},
            { cnt: 2, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAE4ElEQVRYw72XS2xbVRCGv+tXHD/S2onzakMbKhLSUBAVqMuyK1sQCqqEEGzYsGCJqko8dqgrdqgLSllUioREJAqLdpGidMEjqNBGbfrOo07i1HHs2I7tXF/fYTEujpPYxC7iSJas85iZM/P//9xjiAhbxraJ/3AYWycc/6PzHe07mncuu5yrv8n1VNksFSETBWwI9IKrtZHojc0ZkKZuXkjA1Hm4/g1kF5sqh6upm9tFKKxB4jZYG+D2geFoChOuXWRp+8gswvQoWAUYfAPah8Djpxlbrro3tQqwvgyGAYEecLh1qVSAlVu63nccXC1gOCtH7SJkl0AE/F3g8tb0Uj9v6zG4eQFujUIhWZl3+6FlD6w/hhtfw/Vz1euFpJ65eUFt1Bn1MVBch5VpsHLQ+SJ0HwWxIfkAnC0aSGYJHk9B+yB0DGu2Ytdg8Tdw+dRG0wEYTk1veg7ufA9zVzS9AhguCA+DlJSG9y7C/Z/A4dIM5OIQHqguTcMBeEPQ82oZeFFYvQsODwS6oPswBCK6lo1D7BZkl8E2lRXhAeh5BTzB+ncs9wKpiVi7CIu/w9S3kJwBfx909UP/cxAK657kKszcg+UZWH8EoX448p6WzOnZgaIVH66aPM8sgG1Ba1jr7dkDwS6I9EP3AQiHwR3QI2Egf0D/x03wtIHDqXgwHGon/WhHxdyUgU03z8UV2YlpLYPTC7YNbXvhmf6yc9cmEtlQtGB1FeZnILUCYkLnEc2EVYDJL6Fkwkvvw95DO2GgrO2FhCpcqQBWHpbnFO3hYa156MnNTWUE6C3dAQgBq1lIJZQ9GykIDYC7FYo5BfQW5leXIBNVbbc2VOH6jivPM0tltO9WrZ0qPuko/PkVdByGQ69D+/Pgba/HAhvskqK4fUiNJO8qzxFFezKgNXe7NoHLhmJWwZiNayUjRzSLhaSWsGMYfJFtIKxmgZUvdzUHtPUpp0sbsPwXTH8HuRhEBhWE+7orICxmYSEGsTmI3wFfDxx+G0LPQn5V7QT3VaR85wyIonMTQBBb9dwugZmGzDLYHl1r9WjNn9AwNlem4bIqYGlDNcAbrtuUHHU+17ShTJ2HG+cUH1KEXBTidxXtD+b1Nz+jczndYybn+ejDD9jXHcEwDFpaWjh58iTx+EqDzcjMwNIfqoDB/dB7DDpfgNYIpJOwcA+ityEVh9YOpV3vMWx/L2Fnlh9Ov8bG4nWi0SimaTIyMoJlWQ1IsZSUEb4IDL5ZaUaJO3D/R0iUW3J4AIbe+qcZeWPX+PSdNS2F20mkI8KpU6c4ceIE+XyeYDC4ywDcfugYUhB1HwVfZxn0lta4uA5t+/XmXS+raIHu7T2m+9z6oXLp0iUOHjyI17vl20BEkFqjmBdJzYqszYmUzMp84rbIxXdFxkZEZq+IWIXqcyVTz6RmRYp5GRsbk0AgIJOTk9tc1AnArhmXpGZFfvlC5OpnIgu/ihTWRGxrx62jo6MSDAbk8uXLO67Xz0CtUTJF1uMic1dExj8Wufq5SOphdfi2LWfPnhW/3y/j4+M1TTURwKbMZJdEJj4R+fm0SPJ+lfMzZ86Iz+eTiYmJutZoOgsiIpYpknyozou5SoVSKSmrTtUvFApJOp2u8m9seZw2+EAxdv8pX+Oh6vi312sDD92GndfSgQaCePrxNxW65ht+NTR/AAAAAElFTkSuQmCC"},
            { cnt: 3, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAEzUlEQVRYw72Xv29TVxTHP+/52Yl/JGAnIQlOoCkiIYkgAlFVnVgYqm6tKlVsLZ36HzBVRZWqDhmydSolAxKiUju0lTqRoVJaWqktRBAC+dEEJ9gE/8B2HMc/3ulwTG0H27IN6pEsWffed+675/vj3GeICPvihYFXGMb+AfN/3LxmfrP9zaXJscaLrJeqZjEPqRBgg+8wWO5W3t6orIC0dfJsFBauwu1vIL3VFhxWWye385B9BtH7UNgDpwcMsy1OWE1U6cVIbcHidShkYexd6BkHl5d2clkNT1rIwk4EDAN8g2A6daqYhaf3dH74HFgdYDjKj9p5SD8GEfD2g9VZd5fGddsJw91rcO86ZOPlcacXOg7AzhO48zXcvlI9n43rM3evaY4G0ZgD+R14ugiFDBw6BQNnQGyIr4CjQ18k9RieLEDPGPROarXCf8LWLbA8mqPtFzAcWt7kOix9B+tzWl4BDAsCkyBFleHDH2D5JzAtrUBmGwKj1dC0/AKdfhh8o0S8EMQegOkCXz8MTICvT+fS2xC+B+kI2DlVRWAUBs+Cq6vxGUu9QOoy1s7D1u+wMAvxNfAOQ/8IjBwHf0DXxGOw9hAia7DzCPwjcPJDhczhqiHR8h5WXZ2nNsEugDugeLsOQFc/9I3AwFEIBMDp00cCwO5R/b+dA1c3mA7lg2FqnuSjmo5ZUYGKk2e2ldnRRYXB0Qm2Dd0H4chIaXOrQkQ25AsQi8HGGiSeguTg0EmtRCELf8xAMQdTH8HBY7U4UPL2bFQdrpiFwi5E1pXtgUnF3P/85DlVBOgpnT7wA7E0JKKqnr0E+EfB6YZ8Rgm9T/nVEKRC6u2FPXW44XOq89TjEtubdWuHmk8yBH99Bb0TcOxt6DkBnT2NVGCDXVQW94xrkvgD1TmibI/7FHOnVUEuG/JpJWN6W5HsO6lVzMYVwt5J8PS9QMJqFRR2S13NhO5h1XRxDyJ/w+K3kAlD35iSMDhQJmE+DZthCK/D9hJ4BmHiA/C/DrsxzdMVLFt57QqIsrOCIIitfm4XIZeEVARsl865XYr5cxmG10syjKgDFvfUAzoDDZuS2eC6pg1l4SrcuaL8kDxkQrD9QNm+sqG/jTUdy5TWpEL8fOVzjgb7MQwDwzCYmpri5s25ZoyoIqL34da0OmDPCZVkpRWLUbZiQ5QTJSsOr9wh3/UawXc+pXjwODMzM0xPT7O6uorX623SiqWoivD0wdh75WYUXYLlHyFaasmBURh/v6oZDexGwXKCIRREMAyDoaEhLMtqoRc4vdA7rqcaOAOeQyXSFxTj/A50D6nh9J/WCoGuPfwmd5c3OTt0huxejomJCebm5ujo6GgBgnoXktgSzH+h86c/gaG31K7rXEgi0WdcuHCBYDDI7OwspllBPRFBaoYtdSPxj8ivX4r88pnI5m8i2WcidqH+erFlfn5e/H6/JJPJqhmzhY+YcnQdhlMfw5FzsPS9+nxyo+FFtlgs4nA4WryS1btgmk7w9KoyrA5tMs/7Qilu3LjBysoKIkIoFOLSpUucP38en8+3L51CgLQThZxIfFUkviySz1RNXb58Wfx+vwDidrvl4sWLkkgk9mf4j4RtfJ7VumpLY+hqYGw2D3wzHDFafth6mSyvIv4FRuW+hWgdygwAAAAASUVORK5CYII="},
            { cnt: 4, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAEt0lEQVRYw72XO2xbVRjHf9e+1+/GtfOw0zREpiLBiVpERSWYOrCAVAmBqBhYeEiwwEAXBiYmVkQlkIJ4SUSqhMRSkICBDgwVj0KbqHWblkZO09iuYzuJHcevew/DZ9d24pjYoJ7JPufe75zv+/6PezSlFDvGron/cWg7J2wPcPOO8W39b672Odf9If0/VdOsQn4FsMB3CHR3L6fXWiug+sq8lIGFL+HKF1BY7asdel+ZW1UobUDmOtTKYHhAs/WFCX0fVdo98qsQOwe1Ekw9D4NRcHjpJ5beNdNaCbZSoGngGwWbIUtmCdauyfr4SdCdoNmbr1pVKCRAKfCGQHftuUv3um0l4eocXDsHpVxz3vCC0w9b92D+M7jyeft6KSfvXJ2TGF1GdwxUt2AtBrUijByD8HFQFuT+BrtTDpJPwL0FGJyCoRmpVvJPWP0VdI/E6PsAml3KuxmHG99C/IKUVwGaDsEZUKbQ8OZ5uPU92HSpQDENwcn21vR8AFcARk/UgbcC2UWwOcAXgvA0+IZlrZCG5DUopMCqCCuCkzD6BDgOdM+x7gVqT8RaVVj9DRa+gtwSeMchFIHIIxAIyjO5LCzdhNQSbN2BQASOviItszs6ULS5h74nz/N3waqBOyj9dvjhQAiGIxCegGAQDJ+8EgS2J+R3ugKOAbDZBQ+aTeJs3umomC0VaMm8mBZkZ2LSBrsLLAsGDsJDkfrmeguJLKjWIJuF5SVYXwNVgZGjUolaCX7/EMwKPPYqHDzSCQN1bS9lROHMEtS2IRUXtAdnpOeBRuYVYQRIloYPAkC2AOsZYU95HQKTYLihWhRA72B+ewvyK6LttbIo3PhJ4Xk+UUf7ftXaLuKzuQJ/fQJD03DkGRh8FFyD3VhggWUKigejEiS3KDxHCdpzPum5obeAy4JqQcBYSEsnh49KFUs5aeHQDHiGd4GwnQW17bqr2WBgXDhtliF1GWLfQDEJw1MCwrFwE4TVAtxNQjIO6RvgGYXplyDwMGxnJc6BsaaUd66AEnS2AARliZ5bJlQ2IZ8CyyFrbof0vEHDZLxOw5QooFkWDXAFu5pSBx1oxcRduHUeEn9IZarF/QuR7xCMnqA88SxPPv0cCwsLZDIZ/H5/D0pYycvm2cU6gAJNKd7MwcZ6U4rdQ+AZaUpx5joAsz/eAcDpdPYhxcoURniGYeqFphllbsCt7yBTt+TgJERfbDejy5+ynMjy0exPnP14ltOnT/dxAMMLQ1HJKnxcMgRRNrMsTjdwWAQn9LhUCCB8HDN0gjNnv+bMW28wNjbWpxl5wzDzsmTVCN6w6fIGeEfg2Otw+CmR6xYT+2E1xPKGndfefJvF28v9HECJDvgndi/ZXSIutZKoXK0sVapb70a+yDvvfcDc3BxOr7/7N69SCtXrMCtKbaWVil9Q6ud3lfrlfaXWb99fnp+fV4ByuVzK7XYrwzAUoHw+n7p48WJbqD6+ipUIimdImBG/ICbT8AUgGo2SSCRoXPtisRinTp3i0qVLRCKRji3Q9n83aBES16C4XcNmG0F1nXA4fP//2toadrudUCiEYbSpoabtuJz2eEHR9v8pv0cmtn+7vfZw0e15871YoPEAxz9UfDAa0JW7UgAAAABJRU5ErkJggg=="},
            { cnt: 5, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAEvklEQVRYw72Xy29TVxDGf9e+dmLnBrATOwkooBQ1IUShatWoSyqx6bZV1UosqkT9D1ix7LKbSt11VUoXSEilRSqFLVIj9d1SiEgIr8TGJDbGsWM7zo19faeLMTgOtpUY1JEsWecx58zM931zriEi7LAXBl6hGTsHPP/j4U39ezo/XHY51n6R+VLZrFagkABcsA6CGdjL7Y3tGZCOIrczMHcebn4DxZWOymF2FLlbAXsdMnfA2QJfEAxPR5gwd5GlF62wAgsXwbFh7H3oGwd/D534MttG6tiwkQLDAGsIPD6dqtrwdF7nh0+C2QWGt77VrUBxFUSgZwDM7pantM/bRhJuX4D5i2Bn6+O+HujaDxtP4NbXcPNc47yd1T23L6iPNtYeA5UNeLoATgmiJ2DwLRAXsg/A26UXKazCkznoG4P+Cc1W8h9Y+R3MoPro+AKGV9Obj8HiDxC7rukVwDAhPAFSVRreuwL3r4LH1AyU0hAebSzNni/QHYKhqRrwErB2Fzx+sAZg8DhYEZ0rpiE5D8UUuGVlRXgUht4Gf2/7GGu9QFoi1q3Ayh8w9y1kl6BnGAZGYOR1CIV1TXYNlu5Bagk2HkFoBCantWRefxOK1s8wW/K88BhcBwJhrbd/P/QOQGQEBo9AOAw+S7eEgc0j+j9dBv8+8HgVD4ZH/eQfNVXMbRnYFnkprcjOLGgZvN3gurDvABweqR1ubiORCxUH1tYgvgS5pyBliE5qJhwb/vwSqmV4YwYOHG2GgZq22xlVuKoNziakYor28ITWPPQs8rIyAjRKnwUhYK0IuYyyZysHoVHwBaBSUkDvYH5jCQoJ1XZnSxVu+KTyvLBaQ/tu1dqr4pNPwI2voP84HH0P+o5Bd187FrjgVhXFfePqJHtXeY4o2rOW1txnbgOXC5WigrGY1kpGJjWLdlZL2D8BwcgLIGxkgbNZ62oe2DesnK5uQepfWPgOSkmIjCkIDw3WQVgpwuMkJGOQXoTgEBz/GEKvweaa+uk9VJfy5hkQRec2gCCu6rlbhXIeCilw/ToX8GvNn9EwGavRMKUKWN1SDegOt21KnjbPNW0oc+fh1jnFh1SglID0XUX7g7j+4ks6VqqtKSSY+/ELDK8fwzCe/y5d+n6PSlguwOpfqoB9x5SSz6Q4n4X1XF2KA/0QjNal+MHfWN0miflf2D8y1aEUS1UZEYzA2Af1ZpRZhPs/QabWksOjMP5hYzO687Duo421b8e+Hugfh4Pv6OHBKPQMQuio1riyAb1DKjgDb2rvD0Z1bWSSou0wNPEuwWCQ6elp8vl8kyBFkFZW2RTJLYusx0Sq5fp45o7IlU9ELn8ksnxdxLEb91XLko3dkhs/XxXHLsry8rJMTU3J6dOnxXXdhqVtLuC2vJfklkV+/Vxk9jORx7+J2OsirtN6vbgyOzsr0WhUisViw4xnDx8xdes9CCc+hcMnYfGy6nw+3vYhaxgGIoLrunvAQKsHpscHwX5lhtmlTUYaHV+7do1YLIaIEI/HOXPmDKdOncKyrKYYQDoxpyySfSiSvS9SKTVMnT17VizLEkACgYDMzMxILpfb6eG5FHfwedbsqS3tS9ekxp7dF343GDH2vNl8GS+vwv4DlCgOaQSwh50AAAAASUVORK5CYII="},
            { cnt: 6, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAE60lEQVRYw72X22tcVRTGf+fMmUnmkrYzyUwmKWmNwaRJTIuiiKCUvvnig8GikBeNCAX/h1Ioio++iQ/WWiitCK3S+iYISrFeUNvQxqRt0kzTuXQ6l8z9erYPa5LJJJMhMy0uGBj2Onvtvdb6vm+doyml2GLbFp6iaVsX9P/x8Kbx9c4PV7tca/2Q8UTVrJYhvQqY4BoEw97O7bXNFVAdZV6IwdxZuPEVZIIdtcPoKHOzDIU1iP0LlSJYHaDpHWHC2EWVtls6CPMXoVKAsbegdxxsTjqJZbTMtFKAbAQ0DVwDoFvFVS3A49viHzoKRhdolvpWswyZECgFzn4wunc8pXXdsmG4dR5uX4RCor5udULXXsg+gptfwo0zjf5CQvbcOi8xWlhrDJSz8HgeKjnwHQb/i6BMSNwDS5dcJB2CR3PQOwZ9k1Kt8F8Q/A0Mh8To+AKaRcqbWoGFS7Dyk5RXAZoBnklQVaHhnStw9wfQDalALgqe0cbWtH2BbjcMvFwD3irEF0G3gasf/BPg8oovE4XwbchEwCwJKzyjMPAS2Hpa51ibBWpHxJplCP4Oc19DYhmcQ9A/DMPPgdsjzyTisHwHIsuQfQDuYZh6T1pmsTWhaP0MY0eepx+CWQG7R/pt2ws9/eAdBv9B8HjA6pItHiB/UP5HS2DbA7pF8KDpEif1oKlibqrApsxzUUF2bF7aYOkG04Q9++DAcO1wYxOJTChXIB6HwDIkH4MqgW9KKlEpwB+fQbUER96HfSPNMFDT9kJMFK5agEoeIiuCds+k9Ny9nnlJGAGSpdUFbiCegWRM2FNMgnsUrHYo5wTQW5jf2IL0qmh7pSgKN3RUeJ4O1dC+W7W2iPikVuHvz6FvAkbegN5D0N3bigUmmFVBce+4BEksCs9RgvaES3puNTaBy4RyRsCYiUonvVNSxUJCWtg3CQ7vNhA2sqCSr001HfYMCaerRYj8A/PfQi4M3jEB4X5/HYTlDDwMQ3gFogvgGICJd8D9LOTjEqdnf13Km1dACTo3AQRlip6bVSilIB0B0yY+u016vk7D8EqNhhFRwGpRNKDb03Io6S1e12SgzJ2Fm2cEH6oMuVWILgra7wXkF1iWtVztmfQq6sYZzn38Ic8cGELTNDweD5cuXW5TCUtpCP0pCth7SCi5LsWpBKwl61Js7wOHb0OKv7n6M598H+bKhXM8/9qbhEIhisVimxdQVWGEwwtj0/VhFFuAu1chVhvJnlEYf3tjGBVXrnPquwt88dGrTI2PgKYxODjYwTi2OqFvHAZfkcMdPnD6wT0iPS5noWdABKf/BZn9Dh+PLEM8iBX5cbGMd+x17HY7MzMzJJPJNi/g9MPkDEy8K+XfPKaLa+D0weEP4Mhsgz9V1MgVy0Twc3/pDoFAgGAwyIkTJ9j2HaKUQjU1U+1oyftK/fqpUr+cUurhdaUKa0qZlQ330tKScjgcKhgMbsS6du2a8vl8Kp1ON4TS2/iIqVvPoGR+4CgsXBadTwU23F6vF6/X2xBL07T1ZNtowU4vmLoVHH3CDKNLhsz6XABcLhfT09OcPn2afD5PPB7n5MmTHDt2DJfL1bQFqE6sUlIqsaRU4q5S5VyDK5vNqtnZWWWz2ZSu6+r48eMqHo9vjbAhxR18njV71VatW9ekx/ruG78bjGhtbzaeJMrTsP8AUTW8qHGExU4AAAAASUVORK5CYII="},
            { cnt: 7, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAEvElEQVRYw72XzVNbZRTGf/fmJoQQoEmgQGvKYCUIDFo7Ol10gUu3ZRxd6ehf0I3Tv0OHGZyp34synXEGF9UZF850W5XR1trS8iHFUkgakgAJyU3ux+viBJNAkkJ0elZ33q/znnOe5znv1ZRSHLBDA/+jaQcH9OfovO75euvO1RHHmi8y/lM2HQuy64ALwVNgtB/n9lp1BlRLkZspuPs13PkKchstlcNoKXLXAnMHUg/ALoI3AJreEiaMI2TpsGU3YOE62CaMXILIKPg6aOUso2mktgl7CdA0CA6A7pUpx4St+zIfnQSjDTRPZatrQW4TlIKOPjD8Db00z9teHO5dg/vXwcxUxr0d0NYNe0/hjy/gzpe182ZG9ty7Jmc0seYYsPZgawHsPJx8BfrPg3IhswKeNrlIdhOe3oXICPSMS7biv8HGz2AE5IyWL6B5JL27a/BwDtZuSnoVoBkQHgflCA2XbsDyD6AbkoF8EsKx2tIc+wL+EAy8UQbeOqQXQfdBsA/6xyDYK3O5JMTvQy4BbklYEY7BwOvg62weY7kXqIaIdS3Y+AXufgOZVeiIQt8QDA1DKCxrMmlYXYLEKuw9htAQTHwgJfP46lC04sNoyPPsE3BtaA9LvX3d0NkHvUPQPwjhMHiDsiUMFAblO1kCXxfoHsGDpss5u4/rKmZVBqoizycF2akFKYPHD64LXSfgzFDZuVFFIhcsG9Jp+HsVtrdAleDkhGTCNuHXj8Epwasfwomz9TBQ1nYzJQrnmGAXILEmaA+PS81D+5GXhBEgUXqDEALSOdhOCXuK2xCKgbcdrLwA+gDza0uQXRdtt4uicNFJ4Xl2s4z2o6q1R8Rndx1+/xR6xuDsWxB5GfyRZixwwXUExZFROSSzKDxHCdozQam516gClwtWTsCYS0oleycki2ZGStgzDoHeQyCsZYFdKHc1HbqiwmmnCInbsPAt5OPQOyIgPN1fAaGVgydxiK9B8iEEBmDsXQi9CIW0nNN5uiLl9TOgBJ1VAEG5oueuA6VdyCbA9clcu09qvk/D+FqZhglRQKcoGuAPN21KRpPnmjSU5RuwOS+ZURbk1yFpgccQwO0LUXIR8glQFjuJVU5fepO9ol1zXCAQIB6P09nZeUQlLGXFeXqxDKBQRYp3M7CzXZHi9h4InATdoNvMkPu8KGp44SPs7pe4ePEiw8PDNc6ffQHlCCMCvTAyVWlGqYew/D2kyi05HIPRt2ub0e3PZK9yWFpaYn5+nunp6WP2Am8H9IwKiPrPS4QgyuYUpdN1vSCC0/eaZAhk7akLss7bwdWrnxCLxTh37lydIJVCNTKroNT2I6V21pRySpXx1AOlbryv1HfvKPXoplK2WbvPKcme7UdqJ5VQkUhEzczM1HXR/Elm+KF78PCUxy/iYpuicnZRsrTfenUvdJ0B4Ke5OQqFPFNTU0fthkew/Ufp1p+w8qMI18R70D1Us8xxHCYnJ4lGo8zOzqJp2jGfZI0yo3sh0CPMMNqkyez3hSpbWVnh1q1bXL58ua7zagw0xkEzs0tKZf5SKrOslJU/NH3lyhUVi8WUaZqNTvi3BC38ntV7ajd5yjf4UdWf9fd6jB/dYztvpAMaz9H+AQnrsxJy+7yzAAAAAElFTkSuQmCC"},
            { cnt: 8, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAFGElEQVRYw72XTUxcVRiGn7nMDMww0DIMDFAomTaFAuJPg+mmsTFtGuNKrbEriV2YNDHGuHKtC9duGhaGWhc1TUwkprqxiU1sulCJ2pJCf6G0lJ9Oh2F+ucydez8X3xQYfkZmNJ5kksk593znnPd73/c7xyUibGibOv7D5trYYfyPi28Z36h8cdlhX+mP3P8KTduC1AzgQKAN3L5ydu9aj4BUdHIzBmPn4fpXkJ6tKB3uik7uWGAmIHYL8ivg8YPLqIgT7h2gtLmlZmHiIuRN6H4TGnvAW0slsdwlT5o3IbMALhcEWsHw6JBtwtNxHe84Cu5qcFWtTXUsSM+BCNSGwV2z7SqlccvMw80LMH4RzPhav6cWqndB5gncGIbr54rHzbjOuXlBY5RopTlgZeDpBOSz0Pw8tBwCcSB+H6qqdSOpOXgyBo3dEOpTtOb/gNlfwe3XGBVvwFWl8Can4fZ3MH1F4RXA5YZgH4itMrx7Ce79CIZbEchGIdhVnJqyN1DTAK0vF4g3A4t3wPBCIAwtvRBo0rF0FObHIb0ATk5VEeyC1gHw1pU+Y6EWyLaMdSyY/Q3Gvob4FNR2QDgCkQPQENRv4oswdRcWpiDzCBoi0P+epqzKu4VE19Zwb6vz1GNw8uALar69u6AuDE0RaOmEYBA8AZ0SBJY79X80B956MKqUDy5D4yQfbemY6xBYd/JsVJkdm9A0VNWA40D9btgbKSzuXiciB6w8LC7CwylYegqSg+Z+RSJvwu9fgJ2DF07D7v1bcaDg7WZMHc42Ib8MC9PK9mCf5rzh2clzqgjQU3oC0AAspmEppupZWYKGLvD4wMoqoTcovzgFqRn19vyKOlzHUdV5aq7A9p26dZWaT3IG/hyCUC/sfw0aD0JNYykVOODYyuLGHg0Sv6M6R5Tt8YDm3ONeRy4HrLSSMR3VTDb1K4pmXFMY6gN/0yYSFqsgv1yoagbUd6im7RVY+AsmvoXsPDR1Kwn3tKyR0ErD43mYn4bobfC3Qu8paNgHy4sap27PmpVvjYAoO9cRBHHUzx0bcklILYDj1TGfV3P+TIbz0wUZLqgD2ivqATXBkkXJKHFd04Iydh5unFN+iAXZGYjeUbbff6i/h1Paly18k5rhlwuf8+LBfbhcLgzD4Pjx49y/P1lmMcqlYG5UHbCuHdoOQ/Nz4GuCZBwe34WZW7AUBV9IZdd2mEVCvPHZT7z7Shu5uRskk0kikQgnT57EsqwyrFhsVYS/CbrfWitGsdtw7weIFUpysAt63l4tRk+ufc9K/htOv9qJx23gCQQ4c+YMIyMjmKaJx+PZ4QY8tRDqURK1HAJ/c4H0ec2xlYH6dj15+CU1LaDz0AkO7G3my2sJPj7hwUwmOXv2LMeOHaO2dsPFRUSQ7Zq1LLL0QCQxLWLn1vpjt0QuDYqMvCPy4IpI3iyeZ+dk8vpVaWtplgLzZGBgQOLx+KYljJLXKHcN7OqE+r3FEqqqUXMJ9arL5VeKjCqznOP1U+/zwYcfYZomicQS/f39DA4OYtt2GQhs1+ycSCYqMn1F5OdPRK5+KrI0uTo8Pj4ufr9fYrHYat/o6KgEg0FJJBI7RaAEMoYH/CG1Vne1FplndQEIh8N4vV6Gh4exLItMJsPQ0BDt7e34fL4tESgfBRGRfE4kPikSvydiZYuGLl++LL29vascOHLkiExMTGyMsGrFFTzPtrpql7jKb/NQNf7p9VrGQ7fsxbfzARf/Y/sbv90cSCFpcg8AAAAASUVORK5CYII="},
            { cnt: 9, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAE/UlEQVRYw72XS0yUVxTHf/PNgxkYQWaGp6VktIJAoNHShZvSZTddtDHVkLSxq667ckHSxIX7NjHpqtYuTEyalKTaRmOJTVd9BapU8YEiisAIwwwzw/DN6ztdnMGZkZkpTBtP8iVf7uPce8/5///nXpuI8IJta/gfzfZig/ESFy/r36h9cdlhW/VBjv8UzVwG4guABd5OcHh2s3tbcQSkppObYZg+Dze+hsRiTelw1HRyKwPmOoTvQDYFznqwGTVhwrGDKG23+CLMXISsCb3vgb8PXA3U4stR9aRZEzZCYLOBtwMMp3blTFi9rf1dI+CoA5u9MNXKQGIJRKChDRzuiqtUj9vGMty6ALcvghkptDsboK4JNp7Bza/gxrnSfjOic25dUB9VrDoGMhuwOgPZJLQOQfsREAsiD8BepxuJL8GzafD3QmBAo7U8CYu/gaNefdS8AZtdwxubh7vfwfx1Da8ANgf4BkBySsP7l2D2BzAcGoHkCvh6SlOz6w24m6HjzTzwFmDtHhgu8LZBez94W7QvsQLLtyERAiutrPD1QMcwuPZUP2O+FkhFxFoZWPwdpr+ByBw0dEFbEIIHodmnYyJrMHcfQnOw8QSagzB4UlNmd5WhaGENR0Wex5+ClQWPT/PtaoI9bdAShPZu8PnA6dUpPmCzW/9X0uBqBMOueLAZ6if2pKxiFkWg6OTJFUV2eEbTYHeDZUHjXng1mF/cUUQiCzJZWFuDx3MQXQVJQ+ugRiJrwh+fQy4Nr38Mew+Uw0Be282wKlzOhOwmhOYV7b4BzXnz1snTygjQUzq90AysJSAaVvakotDcA04PZJIK6BeYX5qC+IJqezalCtc1ojyPL+XRvlO1tqv4xBZg6ksI9MOBd8B/CNz+aiywwMopiv196iRyT3mOKNojXs2501EELgsyCQVjYkUz2TKoUTQjmsLAANS3bANhKQuym/mqZkBjl3I6l4LQXzDzLSSXoaVXQbivvQDCTAKeLsPyPKzchfoO6D8Ozfthc0397NlXkPLyERBFZxFAEEv13MpBOgbxEFgu7fO4NOdbNFyez9MwpAqYS6kGuH1Vi5JR5bqmBWX6PNw8p/iQDCQXYOWeov3BY/0ez2lbMj8mvsDDq1/w1nA/NpuNpqYmzpw5Qy5n7VIJ03FY+lMV0H9IKbklxbEIrEcLUuwJQH0rGA5S8VXe/fQibx/u5ur3UyQ9XZw4cYJgMMjo6OguNiA5ZUR9C/S+XyhG4bswexnC+ZLs64G+Y8+L0ZNfLzO3ep6fjvXhcTvx+P2cPn2aU6dOcfz4cex2+w434GyAQJ+CqP2InhBU2XIprXSNr6jgtB3WCAG0DChDfAfVR95mZ2cxTZOGhqLLi4gglSyzKRJ9JLI+L5JLF9rDd0QufSQy/oHIo+siWbNkmpmMS+9r++WTk6OysR6WUCgkIyMj4vF4JBaLlYw1ql6jHG5o6obGV0spZHeruAT6VeWyqRKhqvN4ufTjFWYeLtDoa2V4+A2OHj1KIBAoCX+FargD27qUrv4ND66ocA1+CE3BilPOnj3LtWvXGB8fxzCMHaagrFmF38SSyC+fifw8JhKZLRk1NTUl0WhULMuSiYkJ6ezslMnJyW3eKPp2b9m0SOShLp5JlnSNjY2Jy+USQIaGhmRiYqKch+cpqOF5Vu6qXeUqX+Ghavzb63UXD91dL15JB2y8RPsHyWUW27QhrrcAAAAASUVORK5CYII="},
            { cnt: 10, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAFFElEQVRYw72XS2hcVRjHf/fOneedTDKTZJI0jTH2kTaxDVSLC+ljI4g7tWA1UhU3QjZdCTZQXHUnuAgIgrVdFApKXVi3ulGwVrRpbGPblDybRyeTmcwjc+d1j4tv0ryHmWnxgwvDOfd+53zf/3HOaEopNsWWgWcY2uYB/X9cfNv8eu2LqwrHyr9kPFU3i3lIzgA2+HeB4a1m99r6DqiaKreiMHIJhr+F1GxNcBg1VW7nwVqG6L9QyILTB5peEyeMCrq0NZKzMHoVChZ0vwmNB8FlUksuo2ylBQvSC6Bp4G8D3SlTRQsW78p8xwkw3KA51j6185CaA6XAbAHDs+Mq5fuWnoc7V+DuVbBia+NOE9z1kH4Mt7+B4Ysb562YfHPniuQoE+U5kE/D4igUViB8GFqPgLIh9hAcbtlIcg4ej0BjNzT1Srfm/4LZG2D4JEfNG9Ac0t7EJNy7BpO/SHsVoBkQ6gVVFBk++BHGfgLdkA6sRCC0fyM0VW/AE4S2oyXizcDSfdBd4G+B1h7wN8tcKgLzdyG1AHZOVBHaD20vg6uufI2ls0DtyFg7D7N/wMhliI2D2QEtXdC1D4IheSe2BOMPYGEc0tMQ7IJDHwpkDtc2El1bw9hR58lHYBfAGxK8XfVQ1wLNXdDaCaEQOP3ySQjIdMrvSA5cAdAdwgdNlzyJ6W0dc10H1lW+EhFmR0cFBocHbBsCDfBcV2lxY52IbMgXYGkJpsYhvggqB+FD0omCBTe/hGIO+j6Chj3bcaDk7VZUHK5oQSEDC5PC9lCvYB5crTwnigCp0umHILCUgnhU1JONQ3A/OL2QXxFCb1L+RgiSM+Lthaw4XMcJ0XlyrsT2St3aIeaTmIG/v4KmHtjzOjQeAE9jORXYYBeFxY0HJUnsvugcJWyP+QVzp7GOXDbkU0LGVESQbD4kXbRiAmFTL/iat5BwowoKmdKppkOgQzRdzMLCLRj9DlbmoblbSNjeukbCfAoezcP8JETuga8Net6B4AuQWZI8de1rVr59B5Swcx1BULb4uV2EXAKSC2C7ZM7rEsxXZTg/WZLhgjhgMSse4AmVPZT0Mtc1OVBGLsHti8IPlYeVGYjch6lxpn+9xWsnz+Le/T7uY5+TWJyQd5IzpG58zXtvvIpD1zFNk/Pnz1Ms2lU6YS4Jc3+KAzYeEEmuWnEihjOa5u2j7XxwrJOBoZ+huQfqTLBifPrFdaZmi0THfieuhzl+/Dh79+7lzJkzVWxAFUURvmbofmvtMIreg7HrtDLJJ68oRpYDaA4nHD0L9QFSD3/j+5uXufbZSRoCJg1NzzM4OMjQ0BD9/f04HI4KN+A0oemgkKj1CPjCJdIXBON8GgK7wdEp0jPD4AvwWG8nnVXse/ElyQH09fUxPT2NZVmYplnhBsxW6O0XS/UENx7T2WVZ8PDHEKsDbejJdMZ2oTkMPIfflRyA1+slm81i23alECjxgfrOrVMOj5hLwRKXK+ZELaXwmgEUGpY7TL3hARSZTAa3242u61VcyXaKul1S+eI/cO8HmEpuOFDD4TCmaTI2NkZLSwugMTw8TEdHB263u4or2U6d0Z3ga4LGA1hFB1krg1IKy7KwLAu/38+pU6c4d+4cy8vLTExMcOHCBQYGBjCMTTUrpVafqiMejahS6RueeDyuEomEOn36tNI0TXk8HjU4OKgKhcLmFE+suIa/Z9tdtVV56LbBWK8c+Eo4olX9sfE0WZ5F/AdL30vNwO1PGAAAAABJRU5ErkJggg=="},
            { cnt: 50 /*>10*/, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAFg0lEQVRYw72XW2xUVRSGvzlzbc90ykzptFjapnKTSykKfTIUEyMBTSRGI0QNSjAR4oPGGGMkIT4YfTL4YJQYCzVKgqjwgL5IFBN9EDHSC1CBmtILpcN0OvfO6VzO8mEPtqXt2BmMK5lksvc5a+/1r///9z4WEeGOmDXwH4blzgHtf1x8zvxa6YvLAscKP2S7KzRzGYgPAya47wFbWTG7t0xHQEqq3AhBTwd0HYXESEntsJVUuZkBIwqhPyE7CfZysGglccK2AJRmR3wEeo9D1oBVT0DVanDolJLLVrDSrAHJAFgs4F4Cml1N5QwYu6zm67eAzQkW69SrZgYSN0EE9BqwueZdpTBuyVG4dAwuHwcjPDVu18FZCclb0N0OXUdmzhth9c6lYypHgSjMgUwSxnohOwH+9VD7AIgJ4b/A6lQbid+EWz1QtQoWr1Vojf4BI+fAVq5ylLwBi1XBGxuAKydh4KyCVwCLDXxrQXJKhtdOQ993oNkUAhNB8K2c2ZqiN+DywpLWPPGGYfwqaA5w10DtGnBXq7lEEEYvQyIAZlqpwrcSlmwCR0XhGvNngczLWDMDI79Bz2cQ7ge9HmqaoGkFeH3qmfA49F+DQD8kh8DbBM0vqJZZHXNIdGoN27w6j98AMwtlPtVvRyVU1EB1E9Q2gs8Hdrd6xQekGtX/YBocHtCsig8WTeWJDc3pmNMQmFb5RFAxO9Sr2mB1gWmCZxE0NOUXt00TkQmZLIyPw2A/RMZA0uBvVkhkDTj/AeTS0LIHFi2biwN5bzdCyuFyBmRTEBhQbPetVT333q48rRQBqkq7G7zAeAIiIaWeyQh4V4K9DDITitB3KH9mC+LDytuzk8rh6rconcdv5tm+ULe2KvOJDcOFj2HxGli2DaruA1dVIRWYYOYUi6tWqyThq0rniGJ72K16brdNI5cJmYQiYyKoOlndrFA0wqqFi9dCefUsEs5UQTaVP9U08NQrTecmIdAJvV/BxChUr1IkrKudImEmATdGYXQAglegfAms2QneeyE1rvJU1E1Z+dwIiGLnNIIgpvJzMwfpGMQDYDrUXJlD9fy2DEcH8jIMKAfMTSoPcPkKHkpageuaOlB6OqD7iOKHZGBiGIJXYbCfoV86eeShV3EufQ7n5reJjV1Xz8SHSZz7hGcefRCrpqHrOgcPHiSXM4t0wnQc88Z5Yjd6WdSwTknythXHwthDSZ5sreP5zY28/OGPUL0GKnQwwrzx/rcMjuQI9f1KRPPT1tbG8uXL2b179x2eJILMF8GLEj++U5r85bJ9yyY5dfyopMODIgM/ifzwusiXj4kce1i6P3paKit0iY5cE0kGJN59Uqo9Dvn5va0iwYsiInL48GFpbW2VbDY7Y4nCCNh13PXrufpNC9/fauTTL75m3ytv8tTj23jx/kk2eJLgWQrWRiU93Q/lHm5pdSQnhRXrNioPAVpaWhgaGsIwDHRdXyACmZRI5LpIdEAklxYRkWg0Kgde2yeAvPtss8j1s9J94XeprKyUaDQqIiIXuy+IXl4mkYFulUNEOjs7xev1SiwWWygConygUnl8IpHgxInPaW9vJzg6wjsvbWXP9mblcrm0Uks+ynQPggXD6afS5gKEVCqF0+lE07QirmSAYRjs3buXM2fOsGPHDg4dOkTrxg1YJmMwdhGunILB+IwD1e/3o+s6fX191NTUABa6urqor6/H6XQWQUIRMQxDTp8+LYZh5EfMqcnETUmdeUvOH94jngq3BAIBSaUU5Pv375e2tjaJRCLS398vDQ0N0tHRMSs/035FRyQUlHzpM36RSERisZjs2rVLLBaLuFwuOXDgwCwFiMg/VlzC59lcV+0CV/l5eqz929drER+6RS8+HwmL2MTdx9+yFGSiJPbJ/AAAAABJRU5ErkJggg=="},
            { cnt: 100 /*>50*/, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAFiElEQVRYw72XXWyTVRjHf2/7trRbYbRjX5IOx/fXNiIUEy7GHcF4gV4xYyQsGF0IMeKMMZkJMSESLwzeSWIQNCEZIYI6uVBiNOECECL7AOZgZiv7aum2dm23vWvfvo8XZ7DvwobxXLXnvOd5zvk/////nKOJCDParI7/sGkzO2z/Y/I549sWn1yesS/7R/pzoZlJQ6IHsMDzAujuhaxem4qALGrnxiC0noXmM5DsW1Q59EXt3EqDMQyDf4M5Do4c0GyL4oT+DCjNbok+aGsA04ANr0P+JnDmsphYetadmgaMhEHTwFMCNocayhgwcE+N+3eDvgQ0++RUKw3JfhCB3CLQXfNmyY7bSAjunoN7DWBEJ/sdubAkD0YeQctpaP5m+rgRVXPunlMxsrTsHEiPwEAbmKNQWAHFL4FYEP0H7EvUQhL98KgV8jfAii0KrdBf0HcD9BwVY9EL0OwK3ngQ2i9C8HcFrwCaDr4tIBklwweN0HEZbLpCYDQCvvXTS7PgBbi8UBKYIF4PDN0HmxM8RVC8GTwFaiwZgdA9SIbBSilV+NZDyQ5wLs2+x4mzQOZlrJWGvj+h9VuIdkKuH4rKoGwdeH3qm+gQdD6AcCeMdIO3DMoPqpLZnXNIdDKHPq/OE71gmeD2qXo782BpERSUQfEq8PnA4VFTfMDYKvU7kgLnMrDZFR80m4oT757TMacgMGXnoxHF7ME2VQa7CywLli2H0rKJ5PoUEVmQNmFoCB52QmwAJAWF5QoJ04CbX0ImBZU1sHzNXByY8HZjUDlcxgBzDMJBxXbfFlVz7+Odp5QiQO3S4QEvMJSE2KBSz3gMvOvB4Yb0qCL0DOVPL0GiR3m7Oa4czr9b6TzRP8H2Z3VruzKfeA/c/gpWbIY1eyF/I7jys6nAAiujWJy/SQWJ3lc6RxTbox5Vc4c+hVwWpJOKjMmIqmRBuULRiKoSrtgCOQWzSDhdBebYxKlmg2V+penMOISboO0CjIagYIMi4criSRKmk9AbglAQIu2QUwKb94N3NYwNqThLV05a+dwIiGLnFIIglvJzKwOpOCTCYDnVmNupav5YhqHghAzDygEz48oDXL6sh5Ke5bqmDpSORui/pZCRNIz2QCQNdh2GkrTe76HitU+nTbtwdBt7R8d55+ujnP/1Fi63m7q6Oo4dO4bdbl+AE6YSWL03ife2sbx0q5LkYyuOR2E4BuEQHpeDnoa3yfO4n1jx4S9+5mFfhsGO68RshVRVVbF27VoOHDgww5NEkPla5I4kGvZLWWGOvLJ7h1xqOCOp6EOR4B8iv30ocv5VaTnxsnhcusRafhRJhkRGwpJouSgFy5xy9cQekcgdERE5deqUBAKBWSmyH8eOXDz+Cu5//wlH3jvKd+d/wr8xwJHjZ2hq71EnXe4KkoZJyc795BSUcfDwR3Qk8xgZF9Zt3a48BKisrKS7u3uOu0o2BNJjIrEukeGgSCYlIiLDw8NS/0GtAPLZm+USbW6U27duiGma0tXVJYFAQCorKiTH7ZJYsEXFEJGmpibxer2zUmRZgDXtXyKRkNOnT8uuXbtk3eoX5fi7e6T/hzqR3usixrCIZYqIyNWrV2WC7hIKhZ7EunbtmhQXF8/Koj/tEWMYBocOHeLKlSvs27ePkydPEti+DW08DgN3oP0SOH6B8rcgrwxN03C71WHT0dFBUVERoNHc3Izf719gCUTEMAxpbGwUwzBmI5Psl8ufvyFdDUfEGnogwWBQdu7cKdXV1VJbWytVVVUSi8Wks7NTSktL5ezZs/OWIOsi5m1mSj5+v1Y8uTkCiNvtlpqaGonFYhKPx6W6ulo0TROXyyX19fVimuas/NqMx+kCHyjas1/l56mx7Wmv1wU8dBecfD4nXMAinr/9C4SXtfcCM/4gAAAAAElFTkSuQmCC"},
            { cnt: 100000 /*>100*/, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAF0klEQVRYw72XXWxb5RnHf+f42LEdJ3acj6arHHA/SaMuAi03aHJ3MaS208RgsBV1Kqt61VG43E1UdrFKXLYgTVSgslINiQ+t1YjQLiZ10wC10AlqqiYkDcry0TSu49j1R86xfXweLl6T2E1imoB4pCNZz+vzPO/zf/7/5z2vJiLcYysc36Np9zr0HzD5qvH1jSeX+/Q1/pPxndCslCE3AzgQ+BEYvvXsXqtFQDZUuZWC6+cg/lfIz26oHcaGKnfKYN2F1JdgF8HtB03fECeM+0BppeVmYeRtsC3Y9QS094KnmY3EMhpWaltQSICmQWAz6G61VLFgflitR/aC0QSaa/lVpwz52yACzZvA8K6ZpTFuhTm48RYMvw1WetnvboamIBTuwBdnIf5G/bqVVu/ceEvFaGCNOVAuwPwI2IvQ9WPofgTEgfRX4GpSG8ndhjvXoX0XdPQptOY+g9lPwPCrGBvegOZS8GYnYfQCTP5bwSuAZkC4D6SiZHhzCMY/AN1QCCwmIbyzvjXr3oC3DTYPVIk3AwtjoHsgsAm6d0OgU63lkzA3DPkEOCWlivBO2PwT8LQ0rrF6FsiajHXKMPspXH8T0hPQHIFNUYjugLaw+k96ASZuQmICCtPQFoU9v1ctc3lWkehyDmNNnedugWODL6z67QlCyybojEL3AxAOgzugXgkD5gPqd7IEnlbQXYoPmq7iZKdXnZg1CNRUvphUzE6NqDa4vOA40BqCnmg1uVEjIgfKNiwswNQEZOZBStC1RyFhW3D1NFRK0H8EQttW40B1tlspNeEqFtgmJCYV28N9qudt31ReUooAVaU7AG3AQh4yKaWeYgbadoLbB+VFReh7lF/fgtyMmu12UU24yF6l89ztKtvvd1q71PDJzsDnr0LHbti2D9ofAm97IxU44FQUi9t7VZD0mNI5otieDqieu40acjlQzisy5pOqk517FIpWWrWwow/8nStIWK8C26yeajq0RpSmK0VIXIOR92BxDjp3KRJu6V4mYTkPt+ZgbhKSo+DfDLt/C21bwVxQcVq2LI/y1REQxc4agiCOmudOBUpZyCXA8ag1n0f1/BsZzk1WZZhQE7BSVDPAG258KIkIspZlZ0Q+e1Xkg6My9Zefyc/7QuJxaeIxdLl76UWR4ddFhl+X3H/+JM/EHhRdQ/weXU48uU3s949I7qPT8szTvxJd18Xv98uJEyfEtu26FHUccByHbDZLKBRSjlIObv8PFsZwB3v49WNunv2li+deuQS5jOqxVPjjK/9iKlUkdfEPZBYrxF74G9s7PubKzGWm5n2kUikymQyxWIzt27dz+PDh1RHI5XISjUZl//79cvHiRSnNfi7yj9+J/P1Jka/+KVJIyBdXLkmwpVnuvv+8yDu/kNzZvdIZ9MqH750Wyc+JFBJy5s/PS++WFgkHPPLh0Pmlas+cOSMDAwN1CNSJMhAIMDY2xvHjxzl//jyR/sc4/uZNruUjaqz6u8DfodhfKUG5wJ1KiEKxwo6Bfers93fR/9N9jNzKsZAvsWPXQ0vx+/v7mZ6ebvw9YBgGBw4c4MKFC4x9eYNQdICHn32Zl069VgsblO5Ccxfmg4+j6W68oe6lZV+wa/k8C/cs+30+isXit5+G+Xyed999h7Nn3yCZTHLy5EmOHD1aM2g0NVSawOcKIiJYZoFgMAiAWbSXv01sCFbZb5omTU1NayNgmiaHDh1i69atXL58hVOnTjE6Osrg4CDd3d31B1bfYejZS1f6I5qbNMbjHy+txuNxent7CYfDjI+PL0kvHo8TiUTWlqFlWTI0NCSWZa2qStM05erVT6W1tVUSiYSY8xMi/31Rjj3+iMQeHZBMJiMTExPS09Mj586dk2PHjkksFlvhrzVqnoaWyWSkOknqnsz/r0l26poc/M1TommaeL1eGRwcFNu2JZvNysGDB1f4a/Nr91xO13lB0e7/U36Ni6r+bbfXdVx01518LRWsYxPf3b4GZYZJZDRTcroAAAAASUVORK5CYII="},
        ];

        ls.comments._old_setCountNewComment = ls.comments.setCountNewComment;
        ls.comments.setCountNewComment = function(cnt) {
            ls.comments._old_setCountNewComment.apply(this, arguments);

            icos.some(function(o) {
                if (o.cnt >= cnt) {
                    if (el.attr('href') != o.url) {
                        el.attr('href', o.url).remove().appendTo('HEAD');
                    }
                    return true;
                }
                return false;
            });
        }
    })();
}

});
