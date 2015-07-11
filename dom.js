//
// Module name:
//
//     dom
//
// Description:
//
//     'dom' is a JavaScript module for creating HTML elements.
//     The module exposes two object constructors, 'createElement' and 'element'.
//     The functions accept the same arguments, an HTML tag name, an attributes
//     object, an array of subelements, and an eventHandlers object.  The
//     difference is that 'element' postpones the creation of an underlying DOM
//     element, whereas 'createElement' creates and returns the DOM element.
//
//     createElement(x) === element(x).render()
//
//     By postponing the creation of the DOM, we can unit test modules
//     that return element objects without requiring a browser or a browser
//     simulator such as JsDom or Zombie.  A bare-bones JavaScript interpreter
//     such as Node.js will suffice.
//

var document = require('global/document');
var observable = require('./observable');

// Add style 's' with value 'style[s]' to the DOM element 'e'.
function addStyle(e, subscriber, style, s) {
    if (style[s] instanceof observable.Observable) {
        e.style[s] = style[s].get();
        var o = style[s].map(function(v) {e.style[s] = v;});
        subscriber.addArg(o);
    } else {
        e.style[s] = style[s];
    }
}

// Add attribute 'k' with value 'v' to the DOM element 'e'.   If the
// attribute's value is 'undefined', it will be ignored.  If the
// attribute's value is an observable, then any time its value is
// 'undefined', the attribute will be removed.
function addAttribute(e, subscriber, k, v) {
    if (v instanceof observable.Observable) {
        var val = v.get();
        if (val !== undefined) {
            e.setAttribute(k, val);
        }
        var o = v.map(function(v) {
            if (v !== undefined) {
                e.setAttribute(k, v);
            } else {
                e.removeAttribute(k);
            }
        });
        subscriber.addArg(o);
    } else {
        if (v !== undefined) {
            e.setAttribute(k, v);
        }
    }
}

function setChildren(subscriber, e, xs) {
    e.innerHTML = '';
    for (var i = 0; i < xs.length; i++) {
        var x = xs[i];
        x = typeof x === 'string' ? document.createTextNode(x) : x;
        if (typeof x.render === 'function') {
            x = x.render();
        }
        e.appendChild(x);
    }
}

// Create a DOM element with tag name 'nm', attributes object 'as', style object 'sty',
// an array of subelements 'xs', and an object of event handlers 'es'.
function createElement(ps) {

    if (typeof ps === 'string') {
        ps = {name: ps};
    }

    // Create DOM node
    var e = document.createElement(ps.name);

    // Create a subscriber to watch any observables.
    var subscriber = observable.subscriber([], function() {return e;});

    // Add attributes
    var as = ps.attributes;
    var k;
    if (as) {
        for (k in as) {
            if (as.hasOwnProperty(k) && k !== 'style' && as[k] !== undefined) {
                addAttribute(e, subscriber, k, as[k]);
            }
        }
    }

    // Add Style
    var style = ps.style;
    if (style) {
        for (var s in style) {
            if (style.hasOwnProperty(s) && style[s] !== undefined) {
                addStyle(e, subscriber, style, s);
            }
        }
    }

    // Add child elements
    var xs = ps.contents;
    if (xs) {
        if (typeof xs === 'string') {
            e.appendChild(document.createTextNode(xs));
        } else {
            if (xs instanceof observable.Observable) {
                var xsObs = xs;
                xs = xsObs.get();
                var o = xsObs.map(function(xs) {
                    setChildren(subscriber, e, xs);
                });
                subscriber.addArg(o);
            }
            setChildren(subscriber, e, xs);
        }
    }

    // Add event handlers
    var es = ps.handlers;
    if (typeof es === 'object') {
        for (k in es) {
            if (es.hasOwnProperty(k)) {
                e.addEventListener(k, es[k]);
            }
        }
    }

    if (subscriber.args.length > 0) {
        setInterval(function() {subscriber.get();}, 30);
    }

    return e;
}

//
// element({name, attributes, style, contents, handlers})
//
function ReactiveElement(as) {

    if (typeof as === 'string') {
        as = {name: as};
    }

    this.name = as.name;

    if (as.attributes !== undefined) {
        this.attributes = as.attributes;
    }

    if (as.style !== undefined) {
        this.style = as.style;
    }

    if (as.contents !== undefined) {
        this.contents = as.contents;
    }

    if (as.handlers !== undefined) {
        this.handlers = as.handlers;
    }
}

ReactiveElement.prototype.render = function() {
    return createElement(this);
};

function element(as) {
    return new ReactiveElement(as);
}

// Render a string or object with a render method, such as a ReactiveElement.
function render(e) {
    if (typeof e === 'string') {
        return document.createTextNode(e);
    }
    return e.render();
}

module.exports = {
    createElement: createElement,
    ReactiveElement: ReactiveElement,
    element: element,
    render: render
};
