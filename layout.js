//
// A JavaScript library for 2D layout
//

var dom = require('./dom');
var object = require('./object');
var observable = require('./observable');

// gap(n)
//
//     Create empty space of 'n' pixels wide and 'n' pixels tall.
function gap(n) {
    return dom.element({
        name: 'div',
        style: {width: n + 'px', height: n + 'px'}
    });
}

function setPosition(e1, pos) {
    var e2 = object.clone(e1);
    e2.style = e2.style ? object.mixin(e2.style, pos) : pos;
    return e2;
}

// Concatenate elements
function cat(as, xs, pos) {
    function setPositions(xs) {
        var ys = [];
        for (var i = 0; i < xs.length; i += 1) {
            ys[i] = setPosition(xs[i], pos);
        }
        return ys;
    }
    var zs;
    if (xs instanceof observable.Observable) {
        zs = xs.map(setPositions);
    } else {
        zs = setPositions(xs);
    }
    return dom.element({name: 'div', contents: zs});
}

// Concatenate elements horizontally
var hPos = {cssFloat: 'left', clear: 'none'};
function hcat(as, xs) {
    if (as && (as instanceof Array || as instanceof observable.Observable)) {
        xs = as;
        as = {};
    }
    return cat(as, xs, hPos);
}

// Concatenate elements vertically
var vPos = {cssFloat: 'left', clear: 'both'};
var vPosRight = {cssFloat: 'right', clear: 'both'};
function vcat(as, xs) {
    if (as && (as instanceof Array || as instanceof observable.Observable)) {
        xs = as;
        as = {};
    }
    var pos = as.align === 'right' ? vPosRight : vPos;
    return cat(as, xs, pos);
}

module.exports = {
    hcat: hcat,
    vcat: vcat,
    gap: gap
};
