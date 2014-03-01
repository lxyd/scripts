// ==UserScript==
// @name SpeedRead
// @version 1
// @description On an ALT+R begins speed-reading the pointed block
//
// @include http://*
// @include https://*
// @match http://*
// @match https://*
//
// @author lxyd
// ==/UserScript==

(function(document, fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.textContent = '(' + fn + ')(window, window.document)';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
})(document, function(window, document) {


var pointNode = (function() {
    var style = "background: #FF0;";
    var appendedStyle = "; " + style;

    function addStyle(e) {
        var s = e.getAttribute('style');
        if (s == null) {
             e.setAttribute('style', style);
        } else {
             e.setAttribute('style', s + appendedStyle);
        }
    }
    function removeStyle(e) {
        var s = e.getAttribute('style');
        if (s == style) {
            e.removeAttribute('style');
        } else if (s && s.length > appendedStyle.length && s.substring(s.length - appendedStyle.length) == appendedStyle) {
            e.setAttribute('style', s.substring(0, s.length - appendedStyle.length));
        }
    }

    return function(doc, callback) {
        var e = null;

        function unreg() {
            doc.removeEventListener('mouseover', onMouseOver, true);
            doc.removeEventListener('mouseout', onMouseOut, true);
            doc.removeEventListener('mousemove', onMouseMove, true);
            doc.removeEventListener('click', onClick, true);
            doc.removeEventListener('keydown', onKeyDown, true);
        }

        function onMouseOver(ev) {
            e = ev.originalTarget;
            addStyle(e);
        }

        function onMouseMove(ev) {
            if (e == null) {
                e = ev.originalTarget;
                addStyle(e);
            }
        }

        function onMouseOut(ev) {
            if (e != null) {
                removeStyle(e);
            }
            e = null;
        }

        function onClick(ev) {
            unreg();
            if (e != null) {
                removeStyle(e);
            }
            callback(e);
            e = null;
        }

        function onKeyDown(ev) {
            if (ev.keyCode == 27) {
                unreg();
                if (e != null) {
                    removeStyle(e);
                }
                e = null;
            }
        }

        doc.addEventListener('mouseover', onMouseOver, true);
        doc.addEventListener('mouseout', onMouseOut, true);
        doc.addEventListener('mousemove', onMouseMove, true);
        doc.addEventListener('click', onClick, true);
        doc.addEventListener('keydown', onKeyDown, true);
    }
})();

function arr(o) { return Array.prototype.slice.apply(o) }

function split(text) {

    var punctuation = "-–—()[]{},.;:!?¿`'\"\\|/«»…„“”‚‘’$%#@"
      , eNonWordChars = "\\s" + punctuation.replace(/([\-\\\]])/g, "\\$1")
      , reNonWordLeft = new RegExp("^[" + eNonWordChars + "]*")
      , reNonWordRight = new RegExp("[" + eNonWordChars + "]*$")
      , rePartition = new RegExp("^([" + eNonWordChars + "]*)(.*?)([" + eNonWordChars + "]*)$");

    function trimNonWord(s) {
        return s.replace(reNonWordLeft, "").replace(reNonWordRight, "");
    }

    var re = /[-–—\s]+/g
      , reMergeableHeavyLeft = /^[-–]$/
      , reMergeableHeavyRight = /^\s*$/
      , pos = 0
      , res = []
      , ar;
    while ((ar = re.exec(text)) && ar.length) {
        if (ar[0].indexOf('\n') < 0) {
            res.push(text.substring(pos, ar.index + ar[0].length));
        } else {
            res.push(text.substring(pos, ar.index));
            res.push(ar[0]);
        }
        pos = ar.index + ar[0].length;
    }
    res.push(text.substring(pos));

    res = res.map(function(w) {
        var ar = rePartition.exec(w);
        return {
            whole: w,
            prefix: ar[1],
            word: ar[2],
            suffix: ar[3],
        }
    }).reduce(function(out, r, idx) {
        if (idx == 0) {
            out.push(r);
            return out;
        }

        var canMerge = true
          , l = out[out.length - 1];

        if (l.whole.indexOf('\n') >= 0 || r.whole.indexOf('\n') >= 0) {
            canMerge = false;
        }
        if (l.word.length > 2 && r.word.length > 2 || l.word.length + r.word.length > 12) {
            canMerge = false;
        }
        if (!reMergeableHeavyLeft.test(l.suffix + r.prefix) && l.word.length > 2) {
            canMerge = false;
        }
        if (!reMergeableHeavyRight.test(l.suffix + r.prefix) && r.word.length > 2) {
            canMerge = false;
        }

        if (canMerge) {
            l.word = l.word + l.suffix + r.prefix + r.word;
            l.suffix = r.suffix;
            l.whole = l.whole + r.whole;
            return out;
        }



        out.push(r);

        return out;

    }, []);
    res.forEach(function(w) {
        w.lenCoeff = lengthCoefficient(w.word.length);
        w.punctCoeff = punctuationCoefficient(w.suffix);
    });
    console.log(res);
    return res;
}

function bestChar(l) {
    // http://habrahabr.ru/post/213721/#comment_7348441
    return l == 1 ? 0 : l <= 5 ? 1 : l <= 9 ? 2 : l <= 13 ? 3 : 4;
}

function prepareWordHtml(parts, prefix, word, suffix) {
    var idx = bestChar(word.length);

    parts.prefix.textContent = prefix;
    parts.wordBegin.textContent = word.substring(0, idx);
    parts.anchor.textContent = word.charAt(idx);
    parts.wordEnd.textContent = word.substring(idx + 1);
    parts.suffix.textContent = suffix;
}

function positionWord(parts, mark) {
    parts.word.style.left = 
        (mark.offsetLeft + mark.offsetWidth / 2 - 
         parts.anchor.offsetLeft - parts.anchor.offsetWidth / 2) + "px";
}

function createElement(tagOrNode, style, parent) {
    var res;
    if (tagOrNode instanceof HTMLElement) {
        res = tagOrNode.cloneNode(true);
    } else {
        res = document.createElement(tagOrNode);
    }
    if (style instanceof HTMLElement) {
        parent = style;
        style = null;
    }
    Object.keys(style||{}).forEach(function(k) {
        res.style[k] = typeof style[k] == 'number' ? style[k] + 'px' : style[k];
    });
    if (parent) {
        parent.appendChild(res);
    }
    return res;
}

var stereoDistance = 210
  , stereoGap = 20
  , framePadding = 10
  , interval = 120

var screener = createElement('div', {
        position:    'fixed',
        top:         0,
        left:        0,
        width:       '100%',
        height:      '100%',
        background:  'rgba(100,100,100,0.9)',
        display:     'none',
        zIndex:      '2000000000',
    })
  , frame = createElement('div', {
        fontSize:    '12pt',
        whiteSpace:  'nowrap',
        position:    'fixed',
        width:       stereoDistance * 2,
        top:         "50%",
        marginTop:   -20,
        left:        '50%',
        marginLeft:  -stereoDistance,
        padding:     10,
        background:  '#FFF',
        border:      '1px solid #555',
        display:     'none',
        zIndex:      '2000000001',
    })
  , left = createElement('div', {
        position:    'relative',
        height:      '16pt',
        display:     'inline-block',
        marginRight: stereoGap / 2,
        width:       stereoDistance - stereoGap / 2,
        padding:     '10px 0',
        border:      '2px solid #000',
        borderLeft:  'none',
        borderRight: 'none',
    }, frame)
  , topMark = createElement('div', {
        position:    'absolute',
        left:        '33%',
        top:         0,
        height:      8,
        width:       2,
        background:  '#000',
    }, left)
  , bottomMark = createElement(topMark, {
        top:         null,
        bottom:      0,
    }, left)
  , right = createElement(left, {
        marginRight: null,
        marginLeft:  stereoGap / 2,
    }, frame)
  , leftWord = createElement('div', {
        display:     'inline-block',
        position:    'absolute',
    }, left)
  , rightWord = createElement(leftWord, right)

  , leftParts = {
        word:      leftWord,
        prefix:    createElement('span', { color: '#888' }, leftWord),
        wordBegin: createElement('span', { color: '#000' }, leftWord),
        anchor:    createElement('a',    { color: '#F00', textDecoration: 'none' }, leftWord),
        wordEnd:   createElement('span', { color: '#000' }, leftWord),
        suffix:    createElement('span', { color: '#888' }, leftWord),
    }
  , rightParts = {
        word:      rightWord,
        prefix:    createElement(leftParts.prefix,    rightWord),
        wordBegin: createElement(leftParts.wordBegin, rightWord),
        anchor:    createElement(leftParts.anchor,    rightWord),
        wordEnd:   createElement(leftParts.wordEnd,   rightWord),
        suffix:    createElement(leftParts.suffix,    rightWord),
    }
  ;

document.addEventListener('keydown', function(ev) {
    // Alt+R
    if ((ev.altKey || ev.metaKey) && ev.keyCode == 82 /*r*/) {
        pointNode(document, function(n) {
            if (n != null) {
                beginRead(n.textContent);
            }
        });
    }
});

screener.addEventListener('click', function(ev) {
    endRead();
});

var keyListener = function(e) {
    switch (e.keyCode) {
        case 83 /*s*/: startStop(); break;
        case 74 /*j*/: slower(); break;
        case 75 /*k*/: faster(); break;
    }
}

var interval = 120
  , delta = 20
  , timeoutId = null
  , curIdx = -1
  , usePunctuation = true
  , words

function beginRead(text) {
    words = split((text||"").trim());
    curIdx = -1;

    screener.style.display = 'block';
    frame.style.display = 'block';
    document.addEventListener('keydown', keyListener);
    document.body.appendChild(screener);
    document.body.appendChild(frame);

    tick(WAIT_ON_NEXT);
}

function endRead() {
    if (timeoutId) {
        window.clearTimeout(timeoutId);
    }
    screener.style.display = 'none';
    frame.style.display = 'none';
    document.removeEventListener('keydown', keyListener);
    document.body.removeChild(screener);
    document.body.removeChild(frame);
}

function lengthCoefficient(l) {
    // almost random
    return l <= 3 ? 1 : l <= 5 ? 1.1 : l <= 9 ? 1.2 : l <= 13 ? 1.3 : 1.5;
}

function punctuationCoefficient(p) {
    function charCoeff(c) {
        // almost random again
        switch(c) {
            case ',': return 0.2;
            case ';': return 0.5;
            case ':': return 0.5;
            case '–': return 0.5;
            case '—': return 0.5;
            case '.': return 0.8;
            case '!': return 0.8;
            case '?': return 0.8;
            case '\n': return 2;
            case '-': return 0;
            default: return 0;
        }
    }
    
    return arr(p).reduce(function(coeff, chr) {
        var chrCoeff = charCoeff(chr);
        return chrCoeff > coeff ? chrCoeff : coeff;
    }, 0);
}

var WAIT_ON_NEXT = 1
  , WAIT_ON_CUR = 2;

function startStop() {
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
        screener.style.display = 'none';
    } else {
        tick(WAIT_ON_CUR);
        screener.style.display = 'block';
    }
}

function slower() {
    interval += delta;
}

function faster() {
    if (interval > 2*delta) {
        interval -= delta;
    }
}

function tick(wait) {
    timeoutId = null;

    if (curIdx == -1 || wait != WAIT_ON_CUR) {
        curIdx++;
    }
    if (curIdx >= words.length) {
        endRead();
        return;
    }
    var w = words[curIdx];

    prepareWordHtml(leftParts, w.prefix, w.word, w.suffix);
    prepareWordHtml(rightParts, w.prefix, w.word, w.suffix);
    positionWord(leftParts, topMark)
    positionWord(rightParts, topMark)

    console.log(w.whole + "    " + calcPause(interval, w.lenCoeff, w.punctCoeff));

    var pause = wait ? 2500 : calcPause(interval, w.lenCoeff, w.punctCoeff);
    timeoutId = setTimeout(tick, pause);
}

function calcPause(baseInterval, lenCoeff, punctCoeff) {
    return baseInterval * lenCoeff + (usePunctuation ? baseInterval * punctCoeff : 0);
}

});
