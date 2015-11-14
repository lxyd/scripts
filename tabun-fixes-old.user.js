// ==UserScript==
// @name    Tabun fixes
// @version    25
// @description    Автообновление комментов, возможность выбрать формат дат, а также добавление таймлайна комментов и несколько мелких улучшений для табуна. И всё это - с графическим конфигом!
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
    '• Авто-спойлер для картинок большого размера в комментариях (эту функцию нужно включить в настройках)'

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
    relativeTime: false,              // 4.c  true/false   Для тех, кто соскучился по времени в духе "только что" и "5 минут назад"
    addHistoryTimeline: true,         // 5    true/false   Добавить скроллер по истории появления комментариев
    scrollCommentsByNumber: false,    // 6    true/false   Скроллить комментарии не сверху вниз, а по порядку добавления
    moveTopicAuthorToBottom: false,   // 7    true/false   В топиках переместить автора вниз
    unstyleVisitedNewCommentsAfterUpdate: true,  // 8    true/false   Убирать зелёную подсветку с комментов после автообновления при отправке коммента (нет аналога в гуёвом конфиге)
    unstyleVisitedNewComments: false,  // 8.b    true/false   Убирать зелёную подсветку с комментов сразу после прочтения
    fixSameTopicCommentLinks: true,   // 9    true/false   При клике на ссылки вида http://tabun.everypony.ru/comments/<id> скроллить на коммент "#<id>", если он находится в этом же топике        
    autoLoadInterval: 30,             // 10.a Целое число  Если не false и не 0, добавляет галочку для автоподгрузки добавленных комментов (минимальный интервал - 30)
    autoLoadCheckedByDefault: false,  // 10.b true/false   Стоит ли эта галочка по умолчанию
    autoLoadBlockClicks: 700,         // 10.c Целое число  Блокировать экран при автозагрузке (в миллисекундах)
    altToTitle: true,                 // 11   true/false   Копировать поле alt у картинок в поле title, чтобы при наведении появлялась подсказка
    alterMirrorsLinks: true,          // 12   true/false   Преобразовывать ссылки на другие зеркала табуна
    openInnerSpoilersWithShiftOrLongClick: true, // 13   true/false   Открывать вложенные спойлеры, если при нажатии на него был зажат шифт или клик был длинным (0.5 сек)
    boostScrollToComment: true,       // 14   true/false   Ускорить scrollToComment (не выключается в графическом конфиге)
    liteSpoilersAlwaysOpen: false,    // 15   true/false   Светить буквами в лайт-спойлерах
    liteSpoilersOpenOnBlockHover: false, // 16 true/false  Приоткрывать лайт-спойлеры по наведению на коммент/пост
    spaceBarMovesToNext: false,       // 17   true/false   По пробелу переходить на следующий пост/непрочитанный коммент
    countUnreadInFavicon: true,       // 18   true/false   Показывать кол-во непрочитанный комментов в favicon'е
    autospoilerImages: false,         // 19   true/false   Скрывать картинки большого размера
    autospoilerImagesWidth: 1000,     // 19.a Целое число  Ширина, начиная с которой картинка должна быть заспойлерена
    autospoilerImagesHeight: 450,     // 19.b Целое число  Высота, начиная с которой картинка должна быть заспойлерена
    autospoilerImagesGif: false,      // 19.c true/false   Автоскрывать ВСЕ gif'ки (опция отключена до лучших времён)
}, config = defaultConfig;

// Show "what's new" alert
(function() {
    var lsKey = "tabun-fixes-whatsnew"
      , prevWhatsNew = window.localStorage.getItem(lsKey) || "";

    window.localStorage.setItem(lsKey, whatsNew);
    if (prevWhatsNew != whatsNew) {
        alert("Юзерскрипт tabun-fixes обновился!\n" + $("<P>").html(whatsNew.replace(/\<br\/?\>/g, "\n")).text());
    }
})();

//
// 0. Графический конфигуратор
//
if (config.guiConfig) {
    (function() {
        var lsKey = "tabun-fixes-config"
          , divId = "tabun-fixes-gui-config"
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
                    this.txtBlockClicks = $('<INPUT>', { type: 'text' }).css('width', 30).val(cfg.autoLoadBlockClicks).prop('disabled', !cfg.autoLoadInterval);
                    this.chkByDefault = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.autoLoadCheckedByDefault);
                    this.chkEnable = $('<INPUT>', { type: 'checkbox' }).on('change', function() {
                        this.txtInterval.prop('disabled', !this.chkEnable.prop('checked'));
                        this.chkByDefault.prop('disabled', !this.chkEnable.prop('checked'));
                        this.txtBlockClicks.prop('disabled', !this.chkEnable.prop('checked'));
                    }.bind(this)).prop('checked', !!cfg.autoLoadInterval);
                    container.append(
                        $('<LABEL>').append(this.chkEnable, "Добавить галочку для автоподгрузки комментов раз в "),
                        this.txtInterval,
                        " секунд (не меньше 30) ",
                        $('<LABEL>').append(this.chkByDefault, "Включать её по умолчанию."),
                        "<BR/>При автообновлении блокировать клики на ", this.txtBlockClicks, " миллисекунд"
                    );
                },
                getCfg: function() {
                    return {
                        autoLoadInterval: this.chkEnable.prop('checked') ? parseInt(this.txtInterval.val(), 10) : 0,
                        autoLoadCheckedByDefault: this.chkByDefault.prop('checked'),
                        autoLoadBlockClicks: parseInt(this.txtBlockClicks.val(), 10)
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
                    this.chkRelative = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.relativeTime);
                    container.append(
                        $('<LABEL>').append(this.chkReformat, "Сменить формат дат "),
                        this.txtFormat,
                        "<BR/><P style=\"padding-left: 20px\">Формат дат: строка вроде \"d MMMM yyyy, HH:mm\", где:<BR/>" +
                        "yyyy, yy - год (2013 или 13)<BR/>" +
                        "MMMM, MMM, MM, M - месяц (февраля, фев, 02, 2)<BR/>" +
                        "dd, d - день, HH, H - часы, mm, m - минуты, ss, s - секунды (09 или 9)</P>",
                        $('<LABEL>').append(this.chkRelative, "Отображать время в виде \"5 минут назад\"")
                    );
                },
                getCfg: function() {
                    return { 
                        changeDateFormat: this.chkReformat.prop('checked') ? this.txtFormat.val() : false,
                        relativeTime: this.chkRelative.prop('checked')
                    }
                }
            }
          , { // 18. Показывать количество непрочитанных в иконке favicon
                build: function(container, cfg) {
                    this.chk = $('<INPUT>', { type: 'checkbox' }).prop('checked', cfg.countUnreadInFavicon);
                    $('<LABEL>').append(this.chk, "Показывать количество непрочитанных комментов в иконке сайта").appendTo(container);
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
                        " (число меньше " + ls.registry.get('comment_max_tree') + ")"
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
          , { // 19. Автоспойлерить большие картинки
                build: function(container, cfg) {
                    this.txtWidth = $('<INPUT>', { type: 'text' }).css('width', 30).val(cfg.autospoilerImagesWidth || "").prop('disabled', !cfg.autospoilerImages);
                    this.txtHeight = $('<INPUT>', { type: 'text' }).css('width', 30).val(cfg.autospoilerImagesHeight || "").prop('disabled', !cfg.autospoilerImages);
                    this.chkGif = $('<INPUT>', { type: 'checkbox' }).prop('checked', !!cfg.autospoilerImagesGif).prop('disabled', !cfg.autospoilerImages);
                    this.chkEnable = $('<INPUT>', { type: 'checkbox' }).on('change', function() {
                        this.txtWidth.prop('disabled', !this.chkEnable.prop('checked'));
                        this.txtHeight.prop('disabled', !this.chkEnable.prop('checked'));
                        this.chkGif.prop('disabled', !this.chkEnable.prop('checked'));
                    }.bind(this)).prop('checked', !!cfg.autospoilerImages);
                    container.append(
                        $('<LABEL>').append(this.chkEnable, "Скрывать в комментах картинки "),
                        "больше ", this.txtWidth, "px шириной или больше ", this.txtHeight, "px высотой "
                        //, $('<LABEL>').append(this.chkGif, "и любые GIF'ы") // TODO: discover reliable way to determine gifs and uncomment
                    );
                },
                getCfg: function() {
                    return { 
                        autospoilerImages: this.chkEnable.prop('checked'),
                        autospoilerImagesGif: this.chkGif.prop('checked'),
                        autospoilerImagesWidth: parseInt(this.txtWidth.val(), 10),
                        autospoilerImagesHeight: parseInt(this.txtHeight.val(), 10),
                    }
                }
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
            
            cfgUi = $('<DIV>').attr('id', divId).css({
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
            process($('.comment-info .favourite', this));
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
if (config.changeDateFormat || config.relativeTime) {
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
                var timestamp = this.getAttribute('datetime')
                  , dt = timestamp;

                if (config.changeDateFormat) {
                    dt = reformatDateTime(dt, config.changeDateFormat || defaultDateFormat, false);
                }
                if (config.relativeTime) {
                    this.innerHTML = this.getAttribute('title');
                    this.setAttribute('title', dt);
                } else {
                    this.innerHTML = dt;
                    this.setAttribute('title', timestamp);
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
                if (ls.comments.aCommentNew) {
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
                            // unhighlight all the comments
                            $('.' + ls.comments.options.classes.comment_new).removeClass(ls.comments.options.classes.comment_new);
                            // and highlight newly shown
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
          , refreshIsAuto = false
          , lockElement

        function lockScreen() {
            if (lockElement == null) {
                lockElement = $('<DIV>').css({
                    zIndex: 1000000,
                    position: 'fixed',
                    top: '0px', left: '0px',
                    width: '100%', height: '100%',
                })
            }
            lockElement.prependTo(document.body)
        }

        function unlockScreen() {
            lockElement.remove()
        }

        if (topicId != null && type != null) {

            ls.hook.add('ls_comments_load_after', function(_, _, _, _, obj) {
                if (!refreshIsAuto) {
                    if (idInterval) {
                        // adjust timer to the new starting point
                        window.clearInterval(idInterval);
                        idInterval = window.setInterval(timerFunc, period)
                    }
                }
                if (refreshIsAuto && config.autoLoadBlockClicks && obj.aComments.length > 0) {
                    // block screen only if some of the comments are above the lower bound of the screen
                    var winBottom = $(window).scrollTop() + $(window).height();
                    if (obj.aComments.some(function(e) { return $('#comment_id_'+e.id).offset().top < winBottom })) {
                        lockScreen();
                        setTimeout(unlockScreen, config.autoLoadBlockClicks)
                    }
                }
                refreshIsAuto = false
            })

            var eventsToCatchInitialFocus = 'keydown mousedown focus mousemove'
              , focused = false
              , reloadWhenNotFocused = false
              , enabled = config.autoLoadCheckedByDefault
              , needReloadingWhenFocused = false
              , idInterval = null
              , updateComments = function() {
                    refreshIsAuto = true;
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
            if (ev.which == 32 /*SPACE*/) {
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
        var el = $('HEAD LINK[rel~="icon"]')
          , curCnt = 0
          , dimen = 64
          , canvas = $('<CANVAS>').attr('width', dimen).attr('height', dimen)[0]
          , favicon = new Image()
          , ctx = canvas.getContext('2d')
          , fontSizeNormal = -1
          , fontSize100 = -1
          , fontSizeMoreThan100 = -1

        function setFont(size) {
            ctx.font = size + 'pt Sans';
        }

        for (var s = 32; s > 0; s--) {
            ctx.font = setFont(s);
            if (fontSizeNormal == -1 && ctx.measureText("'00").width < dimen - 4) {
                fontSizeNormal = s;
            }
            if (fontSize100 == -1 && ctx.measureText("100").width < dimen - 4) {
                fontSize100 = s;
            }
            if (ctx.measureText(">100").width < dimen - 4) {
                fontSizeMoreThan100 = s;
                break;
            }
        }

        
        function drawCnt(cntString, fontSize) {
            ctx.font = setFont(fontSize);
            var m = ctx.measureText(cntString);
            ctx.fillText(cntString, dimen - 2 - m.width, dimen - 2);
        }

        function updateFavicon() {
            ctx.clearRect(0, 0, dimen, dimen);
            if (favicon.width > 0 && favicon.height > 0) {
                // draw favicon
                ctx.scale(dimen/favicon.width, dimen/favicon.height);
                ctx.drawImage(favicon, 0, 0);
                ctx.scale(favicon.width/dimen, favicon.height/dimen);
            }

            ctx.shadowColor = "white";
            ctx.shadowBlur = 3;

            if (curCnt == 0) {
                // do nothing
            } else if (curCnt < 100) {
                drawCnt(curCnt, fontSizeNormal);
            } else if (curCnt == 100) {
                drawCnt(curCnt, fontSize100);
            } else {
                drawCnt(">100", fontSizeMoreThan100);
            }
            
            el.attr('href', canvas.toDataURL()).remove().appendTo('HEAD');
        }

        favicon.onload = updateFavicon;
        favicon.src = el.attr('href');


        ls.comments._old_setCountNewComment = ls.comments.setCountNewComment;
        ls.comments.setCountNewComment = function(cnt) {
            ls.comments._old_setCountNewComment.apply(this, arguments);

            curCnt = cnt;
            updateFavicon();
        }
    })();
}

//
// 19. Autospoiler big images
//
if (config.autospoilerImages) {
    (function() {
        var reGif = /\.gif$/i
        function process(elements) {
            elements.find('IMG').not('.spoiler IMG').each(function(_, e) {
                // HACK: XXX: 40 px is arbitrary non-loaded image width
                // TODO: implement more reliable way to determine not loaded image
                if (e.width > 40 && e.height > 40) {
                    processImage(e)
                } else {
                    // either wait for full load
                    // or just let the img element find out the image's size
                    waitForImage(e);
                }
            })
        }

        function waitForImage(e) {
            var timeout = setTimeout(function() {
                    processImage(e)
                }, 1000)
              , loadListener = function() {
                    clearTimeout(timeout);
                    processImage(e)
                };

            e.addEventListener('load', loadListener);
        }

        function processImage(e) {
            if (config.autospoilerImagesGif && reGif.test(e.src)) {
                spoiler(e, 'gif')
            } else if (e.width > config.autospoilerImagesWidth) {
                spoiler(e, 'ширина ' + e.width + 'px')
            } else if (e.height > config.autospoilerImagesHeight) {
                spoiler(e, 'высота ' + e.height + 'px')
            }
        }

        function spoiler(img, reason) {
            var spoilerBody;
            $(img).after(
                $('<SPAN>')
                    .attr('class', 'spoiler')
                    .append(
                        $('<SPAN>')
                            .attr('class', 'spoiler-title')
                            .attr('onclick', 'return true;')
                            .text('[КАРТИНКА (' + reason + ')]'),
                        spoilerBody = $('<SPAN>')
                            .attr('class', 'spoiler-body')
                            .attr('style', 'display: none;')
                    )
            );
            spoilerBody.append(img)
        }

        $(function() {
            process($('.comment-content .text'))
        })

        ls.hook.add('ls_comment_inject_after', function() {
            process($('.comment-content .text', this))
        })
        
        // XXX: for compatibility with andreymal's watch-edited-comments
        ls.hook.add('ls_comments_load_after', function() {
            process($('.comment-edited .text'))
        })
    })();
}

});
