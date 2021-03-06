//
// Observable JS
//

// Publishers and Subscribers share the Observable
// interface, which includes a get() and subscribe()
// function.
export function Observable() {
    this.subscribers = [];
}

Observable.prototype.subscribe = function(f) {
    this.subscribers.push(f);
    return this;
};

Observable.prototype.invalidateSubscribers = function() {
    for (const f of this.subscribers) {
        f(this);
    }
};

export function Publisher(v) {
    this.value = v;
}

// Observable values
Publisher.prototype = new Observable();
Publisher.prototype.constructor = Publisher;

Publisher.prototype.set = function(v) {
    this.value = v;
    this.invalidateSubscribers();
    return this;
};

Publisher.prototype.get = function() {
    return this.value;
};

// Observable computations.  subscriber() takes a list of observables
// and a callback function and returns an observable.  Any time
// a value is requested AND an input has changed, the given callback
// is executed, and its return value is returned.
export function Subscriber(args, f) {
    this.valid = false;
    this.f = f;
    this.oArgs = null;
    this.args = [];

    const me = this;  // Avoid 'this' ambiguity.

    // Handle an observable list of subscribers.
    if (args instanceof Observable) {
        this.oArgs = args;
        args = this.oArgs.get();
        this.oArgs.subscribe(() => {
            // TODO: unsubscribe previous values.
            me.args = [];
            const xs = me.oArgs.get();
            for (const x of xs) {
                me.addArg(x);
            }
            me.invalidate();
        });
    }

    for (const arg of args) {
        me.addArg(arg);
    }
}

Subscriber.prototype = new Observable();
Subscriber.prototype.constructor = Subscriber;

Subscriber.prototype.addArg = function(o) {
    this.args.push(o);
    const me = this;
    if (o instanceof Observable) {
        o.subscribe(() => {
            me.invalidate();
        });
    }
};

Subscriber.prototype.invalidate = function() {
    if (this.valid) {
        this.valid = false;
        this.invalidateSubscribers();
    }
};

Subscriber.prototype.get = function() {
    if (this.valid) {
        return this.value;
    } else {
        const vals = this.args.map((o) => o instanceof Observable ? o.get() : o);
        const oldValue = this.value;
        this.value = this.f.apply(null, vals);
        this.valid = true;

        if (this.value !== oldValue && this.subscribers) {
            const me = this;
            this.subscribers.forEach((f) => {
                f(me);
            });
        }

        return this.value;
    }
};

export function subscriber(args, f) {
    return new Subscriber(args, f);
}

// o.map(f) is a shorthand for observable.subscriber([o], f)
Observable.prototype.map = function(f) {
    return subscriber([this], f);
};

// Handy function to lift a raw function into the observable realm
export function lift(f) {
    return (...args) => subscriber(args, f);
}

// Handy function to capture the current state of an object containing observables
export function snapshot(o) {
    if (typeof o === 'object') {
        if (o instanceof Observable) {
            return snapshot(o.get());
        } else {
            if (o instanceof Array) {
                return o.map(snapshot);
            } else {
                const o2 = {};
                for (const k of Object.keys(o)) {
                    o2[k] = snapshot(o[k]);
                }
                return o2;
            }
        }
    } else {
        return o;
    }
}

export function publisher(v) {
    return new Publisher(v);
}
