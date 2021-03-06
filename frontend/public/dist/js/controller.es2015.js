/**
 * Observable pattern implementation.
 * Supports topics as String or an Array.
 */
class Observable {
  constructor() {
    this._observers = [];
  }

  subscribe(topic, observer) {
    this._op('_sub', topic, observer);
  }

  unsubscribe(topic, observer) {
    this._op('_unsub', topic, observer);
  }

  unsubscribeAll(topic) {
    if (!this._observers[topic]) {
      return;
    }
    delete this._observers[topic];
  }

  publish(topic, message) {
    this._op('_pub', topic, message);
  }

  /**
   * Internal methods
   */
  _op(op, topic, value) {
    if (Array.isArray(topic)) {
      topic.forEach((t) => {
        this[op](t, value);
      });
    }
    else {
      this[op](topic, value);
    }
  }

  _sub(topic, observer) {
    this._observers[topic] || (this._observers[topic] = []);
    if(observer && this._observers[topic].indexOf(observer) === -1) {
      this._observers[topic].push(observer);
    }
  }

  _unsub(topic, observer) {
    if (!this._observers[topic]) {
      return;
    }
    var index = this._observers[topic].indexOf(observer);
    if (~index) {
      this._observers[topic].splice(index, 1);
    }
  }

  _pub(topic, message) {
    if (!this._observers[topic]) {
      return;
    }
    for (var i = this._observers[topic].length - 1; i >= 0; i--) {
      this._observers[topic][i](message)
    }
  }
}

class EmailClient extends Observable {
  constructor(proxy) {
    super();
    this._proxy = proxy;
  }

  goto(params) {
    this._postMessage('goto', params);
  }

  close() {
    this._postMessage('close');
  }

  _postMessage(topic, value) {
    this._proxy.postMessage({
      method: 'notifyClient',
      params: {
        topic: topic,
        value: value
      }
    });
  }

}

class SiftStorage extends Observable {
  constructor() {
    super();
    this._storage = null;
  }

  init(storage) {
    this._storage = storage;
  }

  get(d) { return this._storage.get(d) }
  getIndexKeys(d) { return this._storage.getIndexKeys(d) }
  getIndex(d) { return this._storage.getIndex(d) }
  getWithIndex(d) { return this._storage.getWithIndex(d) }
  getAllKeys(d) { return this._storage.getAllKeys(d) }
  getAll(d) { return this._storage.getAll(d) }
  getUser(d) { return this._storage.getUser(d) }
  putUser(d) { return this._storage.putUser(d) }
  delUser(d) { return this._storage.delUser(d) }
}

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var loglevel = createCommonjsModule(function (module) {
/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/
(function (root, definition) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(definition);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        root.log = definition();
    }
}(commonjsGlobal, function () {
    "use strict";
    var noop = function() {};
    var undefinedType = "undefined";

    function realMethod(methodName) {
        if (typeof console === undefinedType) {
            return false; // We can't build a real method without a console to log to
        } else if (console[methodName] !== undefined) {
            return bindMethod(console, methodName);
        } else if (console.log !== undefined) {
            return bindMethod(console, 'log');
        } else {
            return noop;
        }
    }

    function bindMethod(obj, methodName) {
        var method = obj[methodName];
        if (typeof method.bind === 'function') {
            return method.bind(obj);
        } else {
            try {
                return Function.prototype.bind.call(method, obj);
            } catch (e) {
                // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                return function() {
                    return Function.prototype.apply.apply(method, [obj, arguments]);
                };
            }
        }
    }

    // these private functions always need `this` to be set properly

    function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
        return function () {
            if (typeof console !== undefinedType) {
                replaceLoggingMethods.call(this, level, loggerName);
                this[methodName].apply(this, arguments);
            }
        };
    }

    function replaceLoggingMethods(level, loggerName) {
        /*jshint validthis:true */
        for (var i = 0; i < logMethods.length; i++) {
            var methodName = logMethods[i];
            this[methodName] = (i < level) ?
                noop :
                this.methodFactory(methodName, level, loggerName);
        }
    }

    function defaultMethodFactory(methodName, level, loggerName) {
        /*jshint validthis:true */
        return realMethod(methodName) ||
               enableLoggingWhenConsoleArrives.apply(this, arguments);
    }

    var logMethods = [
        "trace",
        "debug",
        "info",
        "warn",
        "error"
    ];

    function Logger(name, defaultLevel, factory) {
      var self = this;
      var currentLevel;
      var storageKey = "loglevel";
      if (name) {
        storageKey += ":" + name;
      }

      function persistLevelIfPossible(levelNum) {
          var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

          // Use localStorage if available
          try {
              window.localStorage[storageKey] = levelName;
              return;
          } catch (ignore) {}

          // Use session cookie as fallback
          try {
              window.document.cookie =
                encodeURIComponent(storageKey) + "=" + levelName + ";";
          } catch (ignore) {}
      }

      function getPersistedLevel() {
          var storedLevel;

          try {
              storedLevel = window.localStorage[storageKey];
          } catch (ignore) {}

          if (typeof storedLevel === undefinedType) {
              try {
                  var cookie = window.document.cookie;
                  var location = cookie.indexOf(
                      encodeURIComponent(storageKey) + "=");
                  if (location) {
                      storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
                  }
              } catch (ignore) {}
          }

          // If the stored level is not valid, treat it as if nothing was stored.
          if (self.levels[storedLevel] === undefined) {
              storedLevel = undefined;
          }

          return storedLevel;
      }

      /*
       *
       * Public API
       *
       */

      self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
          "ERROR": 4, "SILENT": 5};

      self.methodFactory = factory || defaultMethodFactory;

      self.getLevel = function () {
          return currentLevel;
      };

      self.setLevel = function (level, persist) {
          if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
              level = self.levels[level.toUpperCase()];
          }
          if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
              currentLevel = level;
              if (persist !== false) {  // defaults to true
                  persistLevelIfPossible(level);
              }
              replaceLoggingMethods.call(self, level, name);
              if (typeof console === undefinedType && level < self.levels.SILENT) {
                  return "No console available for logging";
              }
          } else {
              throw "log.setLevel() called with invalid level: " + level;
          }
      };

      self.setDefaultLevel = function (level) {
          if (!getPersistedLevel()) {
              self.setLevel(level, false);
          }
      };

      self.enableAll = function(persist) {
          self.setLevel(self.levels.TRACE, persist);
      };

      self.disableAll = function(persist) {
          self.setLevel(self.levels.SILENT, persist);
      };

      // Initialize with the right level
      var initialLevel = getPersistedLevel();
      if (initialLevel == null) {
          initialLevel = defaultLevel == null ? "WARN" : defaultLevel;
      }
      self.setLevel(initialLevel, false);
    }

    /*
     *
     * Package-level API
     *
     */

    var defaultLogger = new Logger();

    var _loggersByName = {};
    defaultLogger.getLogger = function getLogger(name) {
        if (typeof name !== "string" || name === "") {
          throw new TypeError("You must supply a name when creating a logger.");
        }

        var logger = _loggersByName[name];
        if (!logger) {
          logger = _loggersByName[name] = new Logger(
            name, defaultLogger.getLevel(), defaultLogger.methodFactory);
        }
        return logger;
    };

    // Grab the current global log variable in case of overwrite
    var _log = (typeof window !== undefinedType) ? window.log : undefined;
    defaultLogger.noConflict = function() {
        if (typeof window !== undefinedType &&
               window.log === defaultLogger) {
            window.log = _log;
        }

        return defaultLogger;
    };

    return defaultLogger;
}));
});

var loglevel$1 = (loglevel && typeof loglevel === 'object' && 'default' in loglevel ? loglevel['default'] : loglevel);

var index$2 = createCommonjsModule(function (module) {
'use strict';
var toString = Object.prototype.toString;

module.exports = function (x) {
	var prototype;
	return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};
});

var require$$0$2 = (index$2 && typeof index$2 === 'object' && 'default' in index$2 ? index$2['default'] : index$2);

var index$1 = createCommonjsModule(function (module, exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = range;

var _isPlainObj = require$$0$2;

var _isPlainObj2 = _interopRequireDefault(_isPlainObj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Parse `opts` to valid IDBKeyRange.
 * https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange
 *
 * @param {Object} opts
 * @return {IDBKeyRange}
 */

function range(opts) {
  var IDBKeyRange = commonjsGlobal.IDBKeyRange || commonjsGlobal.webkitIDBKeyRange;
  if (opts instanceof IDBKeyRange) return opts;
  if (typeof opts === 'undefined' || opts === null) return null;
  if (!(0, _isPlainObj2.default)(opts)) return IDBKeyRange.only(opts);
  var keys = Object.keys(opts).sort();

  if (keys.length === 1) {
    var key = keys[0];
    var val = opts[key];

    switch (key) {
      case 'eq':
        return IDBKeyRange.only(val);
      case 'gt':
        return IDBKeyRange.lowerBound(val, true);
      case 'lt':
        return IDBKeyRange.upperBound(val, true);
      case 'gte':
        return IDBKeyRange.lowerBound(val);
      case 'lte':
        return IDBKeyRange.upperBound(val);
      default:
        throw new TypeError('"' + key + '" is not valid key');
    }
  } else {
    var x = opts[keys[0]];
    var y = opts[keys[1]];
    var pattern = keys.join('-');

    switch (pattern) {
      case 'gt-lt':
        return IDBKeyRange.bound(x, y, true, true);
      case 'gt-lte':
        return IDBKeyRange.bound(x, y, true, false);
      case 'gte-lt':
        return IDBKeyRange.bound(x, y, false, true);
      case 'gte-lte':
        return IDBKeyRange.bound(x, y, false, false);
      default:
        throw new TypeError('"' + pattern + '" are conflicted keys');
    }
  }
}
module.exports = exports['default'];
});

var require$$0$1 = (index$1 && typeof index$1 === 'object' && 'default' in index$1 ? index$1['default'] : index$1);

var idbIndex = createCommonjsModule(function (module) {
var parseRange = require$$0$1;

/**
 * Expose `Index`.
 */

module.exports = Index;

/**
 * Initialize new `Index`.
 *
 * @param {Store} store
 * @param {String} name
 * @param {String|Array} field
 * @param {Object} opts { unique: false, multi: false }
 */

function Index(store, name, field, opts) {
  this.store = store;
  this.name = name;
  this.field = field;
  this.opts = opts;
  this.multi = opts.multi || opts.multiEntry || false;
  this.unique = opts.unique || false;
}

/**
 * Get `key`.
 *
 * @param {Object|IDBKeyRange} key
 * @param {Function} cb
 */

Index.prototype.get = function(key, cb) {
  var result = [];
  var isUnique = this.unique;
  var opts = { range: key, iterator: iterator };

  this.cursor(opts, function(err) {
    if (err) return cb(err);
    isUnique ? cb(null, result[0]) : cb(null, result);
  });

  function iterator(cursor) {
    result.push(cursor.value);
    cursor.continue();
  }
};

/**
 * Count records by `key`.
 *
 * @param {String|IDBKeyRange} key
 * @param {Function} cb
 */

Index.prototype.count = function(key, cb) {
  var name = this.store.name;
  var indexName = this.name;

  this.store.db.transaction('readonly', [name], function(err, tr) {
    if (err) return cb(err);
    var index = tr.objectStore(name).index(indexName);
    var req = index.count(parseRange(key));
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Create cursor.
 * Proxy to `this.store` for convinience.
 *
 * @param {Object} opts
 * @param {Function} cb
 */

Index.prototype.cursor = function(opts, cb) {
  opts.index = this.name;
  this.store.cursor(opts, cb);
};
});

var require$$0 = (idbIndex && typeof idbIndex === 'object' && 'default' in idbIndex ? idbIndex['default'] : idbIndex);

var index$3 = createCommonjsModule(function (module) {
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};
});

var require$$2 = (index$3 && typeof index$3 === 'object' && 'default' in index$3 ? index$3['default'] : index$3);

var idbStore = createCommonjsModule(function (module) {
var type = require$$2;
var parseRange = require$$0$1;

/**
 * Expose `Store`.
 */

module.exports = Store;

/**
 * Initialize new `Store`.
 *
 * @param {String} name
 * @param {Object} opts
 */

function Store(name, opts) {
  this.db = null;
  this.name = name;
  this.indexes = {};
  this.opts = opts;
  this.key = opts.key || opts.keyPath || undefined;
  this.increment = opts.increment || opts.autoIncretement || undefined;
}

/**
 * Get index by `name`.
 *
 * @param {String} name
 * @return {Index}
 */

Store.prototype.index = function(name) {
  return this.indexes[name];
};

/**
 * Put (create or replace) `key` to `val`.
 *
 * @param {String|Object} [key] is optional when store.key exists.
 * @param {Any} val
 * @param {Function} cb
 */

Store.prototype.put = function(key, val, cb) {
  var name = this.name;
  var keyPath = this.key;
  if (keyPath) {
    if (type(key) == 'object') {
      cb = val;
      val = key;
      key = null;
    } else {
      val[keyPath] = key;
    }
  }

  this.db.transaction('readwrite', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = keyPath ? objectStore.put(val) : objectStore.put(val, key);
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb(null, req.result) };
  });
};

/**
 * Get `key`.
 *
 * @param {String} key
 * @param {Function} cb
 */

Store.prototype.get = function(key, cb) {
  var name = this.name;
  this.db.transaction('readonly', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.get(key);
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Del `key`.
 *
 * @param {String} key
 * @param {Function} cb
 */

Store.prototype.del = function(key, cb) {
  var name = this.name;
  this.db.transaction('readwrite', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.delete(key);
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb() };
  });
};

/**
 * Count.
 *
 * @param {Function} cb
 */

Store.prototype.count = function(cb) {
  var name = this.name;
  this.db.transaction('readonly', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.count();
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Clear.
 *
 * @param {Function} cb
 */

Store.prototype.clear = function(cb) {
  var name = this.name;
  this.db.transaction('readwrite', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.clear();
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb() };
  });
};

/**
 * Perform batch operation.
 *
 * @param {Object} vals
 * @param {Function} cb
 */

Store.prototype.batch = function(vals, cb) {
  var name = this.name;
  var keyPath = this.key;
  var keys = Object.keys(vals);

  this.db.transaction('readwrite', [name], function(err, tr) {
    if (err) return cb(err);
    var store = tr.objectStore(name);
    var current = 0;
    tr.onerror = tr.onabort = cb;
    tr.oncomplete = function oncomplete() { cb() };
    next();

    function next() {
      if (current >= keys.length) return;
      var currentKey = keys[current];
      var currentVal = vals[currentKey];
      var req;

      if (currentVal === null) {
        req = store.delete(currentKey);
      } else if (keyPath) {
        if (!currentVal[keyPath]) currentVal[keyPath] = currentKey;
        req = store.put(currentVal);
      } else {
        req = store.put(currentVal, currentKey);
      }

      req.onerror = cb;
      req.onsuccess = next;
      current += 1;
    }
  });
};

/**
 * Get all.
 *
 * @param {Function} cb
 */

Store.prototype.all = function(cb) {
  var result = [];

  this.cursor({ iterator: iterator }, function(err) {
    err ? cb(err) : cb(null, result);
  });

  function iterator(cursor) {
    result.push(cursor.value);
    cursor.continue();
  }
};

/**
 * Create read cursor for specific `range`,
 * and pass IDBCursor to `iterator` function.
 * https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor
 *
 * @param {Object} opts:
 *   {IDBRange|Object} range - passes to .openCursor()
 *   {Function} iterator - function to call with IDBCursor
 *   {String} [index] - name of index to start cursor by index
 * @param {Function} cb - calls on end or error
 */

Store.prototype.cursor = function(opts, cb) {
  var name = this.name;
  this.db.transaction('readonly', [name], function(err, tr) {
    if (err) return cb(err);
    var store = opts.index
      ? tr.objectStore(name).index(opts.index)
      : tr.objectStore(name);
    var req = store.openCursor(parseRange(opts.range));

    req.onerror = cb;
    req.onsuccess = function onsuccess(e) {
      var cursor = e.target.result;
      cursor ? opts.iterator(cursor) : cb();
    };
  });
};
});

var require$$1 = (idbStore && typeof idbStore === 'object' && 'default' in idbStore ? idbStore['default'] : idbStore);

var schema$1 = createCommonjsModule(function (module) {
var type = require$$2;
var Store = require$$1;
var Index = require$$0;

/**
 * Expose `Schema`.
 */

module.exports = Schema;

/**
 * Initialize new `Schema`.
 */

function Schema() {
  if (!(this instanceof Schema)) return new Schema();
  this._stores = {};
  this._current = {};
  this._versions = {};
}

/**
 * Set new version.
 *
 * @param {Number} version
 * @return {Schema}
 */

Schema.prototype.version = function(version) {
  if (type(version) != 'number' || version < 1 || version < this.getVersion())
    throw new TypeError('not valid version');

  this._current = { version: version, store: null };
  this._versions[version] = {
    stores: [],      // db.createObjectStore
    dropStores: [],  // db.deleteObjectStore
    indexes: [],     // store.createIndex
    dropIndexes: [], // store.deleteIndex
    version: version // version
  };

  return this;
};

/**
 * Add store.
 *
 * @param {String} name
 * @param {Object} [opts] { key: false }
 * @return {Schema}
 */

Schema.prototype.addStore = function(name, opts) {
  if (type(name) != 'string') throw new TypeError('`name` is required');
  if (this._stores[name]) throw new TypeError('store is already defined');
  var store = new Store(name, opts || {});
  this._stores[name] = store;
  this._versions[this.getVersion()].stores.push(store);
  this._current.store = store;
  return this;
};

/**
 * Drop store.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.dropStore = function(name) {
  if (type(name) != 'string') throw new TypeError('`name` is required');
  var store = this._stores[name];
  if (!store) throw new TypeError('store is not defined');
  delete this._stores[name];
  this._versions[this.getVersion()].dropStores.push(store);
  return this;
};

/**
 * Add index.
 *
 * @param {String} name
 * @param {String|Array} field
 * @param {Object} [opts] { unique: false, multi: false }
 * @return {Schema}
 */

Schema.prototype.addIndex = function(name, field, opts) {
  if (type(name) != 'string') throw new TypeError('`name` is required');
  if (type(field) != 'string' && type(field) != 'array') throw new TypeError('`field` is required');
  var store = this._current.store;
  if (store.indexes[name]) throw new TypeError('index is already defined');
  var index = new Index(store, name, field, opts || {});
  store.indexes[name] = index;
  this._versions[this.getVersion()].indexes.push(index);
  return this;
};

/**
 * Drop index.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.dropIndex = function(name) {
  if (type(name) != 'string') throw new TypeError('`name` is required');
  var index = this._current.store.indexes[name];
  if (!index) throw new TypeError('index is not defined');
  delete this._current.store.indexes[name];
  this._versions[this.getVersion()].dropIndexes.push(index);
  return this;
};

/**
 * Change current store.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.getStore = function(name) {
  if (type(name) != 'string') throw new TypeError('`name` is required');
  if (!this._stores[name]) throw new TypeError('store is not defined');
  this._current.store = this._stores[name];
  return this;
};

/**
 * Get version.
 *
 * @return {Number}
 */

Schema.prototype.getVersion = function() {
  return this._current.version;
};

/**
 * Generate onupgradeneeded callback.
 *
 * @return {Function}
 */

Schema.prototype.callback = function() {
  var versions = Object.keys(this._versions)
    .map(function(v) { return this._versions[v] }, this)
    .sort(function(a, b) { return a.version - b.version });

  return function onupgradeneeded(e) {
    var db = e.target.result;
    var tr = e.target.transaction;

    versions.forEach(function(versionSchema) {
      if (e.oldVersion >= versionSchema.version) return;

      versionSchema.stores.forEach(function(s) {
        var options = {};

        // Only pass the options that are explicitly specified to createObjectStore() otherwise IE/Edge
        // can throw an InvalidAccessError - see https://msdn.microsoft.com/en-us/library/hh772493(v=vs.85).aspx
        if (typeof s.key !== 'undefined') options.keyPath = s.key;
        if (typeof s.increment !== 'undefined') options.autoIncrement = s.increment;

        db.createObjectStore(s.name, options);
      });

      versionSchema.dropStores.forEach(function(s) {
        db.deleteObjectStore(s.name);
      });

      versionSchema.indexes.forEach(function(i) {
        var store = tr.objectStore(i.store.name);
        store.createIndex(i.name, i.field, {
          unique: i.unique,
          multiEntry: i.multi
        });
      });

      versionSchema.dropIndexes.forEach(function(i) {
        var store = tr.objectStore(i.store.name);
        store.deleteIndex(i.name);
      });
    });
  };
};
});

var require$$2$1 = (schema$1 && typeof schema$1 === 'object' && 'default' in schema$1 ? schema$1['default'] : schema$1);

var index = createCommonjsModule(function (module, exports) {
var type = require$$2;
var Schema = require$$2$1;
var Store = require$$1;
var Index = require$$0;

/**
 * Expose `Treo`.
 */

exports = module.exports = Treo;

/**
 * Initialize new `Treo` instance.
 *
 * @param {String} name
 * @param {Schema} schema
 */

function Treo(name, schema) {
  if (!(this instanceof Treo)) return new Treo(name, schema);
  if (type(name) != 'string') throw new TypeError('`name` required');
  if (!(schema instanceof Schema)) throw new TypeError('not valid schema');

  this.name = name;
  this.status = 'close';
  this.origin = null;
  this.stores = schema._stores;
  this.version = schema.getVersion();
  this.onupgradeneeded = schema.callback();

  // assign db property to each store
  Object.keys(this.stores).forEach(function(storeName) {
    this.stores[storeName].db = this;
  }, this);
}

/**
 * Expose core classes.
 */

exports.schema = Schema;
exports.cmp = cmp;
exports.Treo = Treo;
exports.Schema = Schema;
exports.Store = Store;
exports.Index = Index;

/**
 * Use plugin `fn`.
 *
 * @param {Function} fn
 * @return {Treo}
 */

Treo.prototype.use = function(fn) {
  fn(this, exports);
  return this;
};

/**
 * Drop.
 *
 * @param {Function} cb
 */

Treo.prototype.drop = function(cb) {
  var name = this.name;
  this.close(function(err) {
    if (err) return cb(err);
    var req = indexedDB().deleteDatabase(name);
    req.onerror = cb;
    req.onsuccess = function onsuccess() { cb() };
  });
};

/**
 * Close.
 *
 * @param {Function} cb
 */

Treo.prototype.close = function(cb) {
  if (this.status == 'close') return cb();
  this.getInstance(function(err, db) {
    if (err) return cb(err);
    db.origin = null;
    db.status = 'close';
    db.close();
    cb();
  });
};

/**
 * Get store by `name`.
 *
 * @param {String} name
 * @return {Store}
 */

Treo.prototype.store = function(name) {
  return this.stores[name];
};

/**
 * Get db instance. It starts opening transaction only once,
 * another requests will be scheduled to queue.
 *
 * @param {Function} cb
 */

Treo.prototype.getInstance = function(cb) {
  if (this.status == 'open') return cb(null, this.origin);
  if (this.status == 'opening') return this.queue.push(cb);

  this.status = 'opening';
  this.queue = [cb]; // queue callbacks

  var that = this;
  var req = indexedDB().open(this.name, this.version);
  req.onupgradeneeded = this.onupgradeneeded;

  req.onerror = req.onblocked = function onerror(e) {
    that.status = 'error';
    that.queue.forEach(function(cb) { cb(e) });
    delete that.queue;
  };

  req.onsuccess = function onsuccess(e) {
    that.origin = e.target.result;
    that.status = 'open';
    that.origin.onversionchange = function onversionchange() {
      that.close(function() {});
    };
    that.queue.forEach(function(cb) { cb(null, that.origin) });
    delete that.queue;
  };
};

/**
 * Create new transaction for selected `stores`.
 *
 * @param {String} type (readwrite|readonly)
 * @param {Array} stores - follow indexeddb semantic
 * @param {Function} cb
 */

Treo.prototype.transaction = function(type, stores, cb) {
  this.getInstance(function(err, db) {
    err ? cb(err) : cb(null, db.transaction(stores, type));
  });
};

/**
 * Compare 2 values using IndexedDB comparision algotihm.
 *
 * @param {Mixed} value1
 * @param {Mixed} value2
 * @return {Number} -1|0|1
 */

function cmp() {
  return indexedDB().cmp.apply(indexedDB(), arguments);
}

/**
 * Dynamic link to `global.indexedDB` for polyfills support.
 *
 * @return {IDBDatabase}
 */

function indexedDB() {
  return commonjsGlobal._indexedDB
    || commonjsGlobal.indexedDB
    || commonjsGlobal.msIndexedDB
    || commonjsGlobal.mozIndexedDB
    || commonjsGlobal.webkitIndexedDB;
}
});

var treo = (index && typeof index === 'object' && 'default' in index ? index['default'] : index);

var logger = loglevel$1.getLogger('RSStorage:operations');
logger.setLevel('warn');

// Email msg buckets
const EMAIL_BUCKETS = ['_email.id', '_email.tid'];
// Message Db schema
const MSG_DB_VERSIONED_SCHEMA = [
  // version 1
  [
    { name: '_id.list', indexes: ['sift.guid'] },
    { name: '_tid.list', indexes: ['sift.guid'] }
  ],
  // version 2
  [
    { name: '_email.id', indexes: ['sift.guid'] },
    { name: '_email.tid', indexes: ['sift.guid'] },
    { name: '_id.list', drop: true },
    { name: '_tid.list', drop: true }
  ]
];
// Sync DB schema
const SYNC_DB_SCHEMA = [
  { name: 'events', indexes: ['value.sift.guid'] },
  { name: 'admin' }];
// Client DB schema
const CLIENT_DB_SCHEMA = [
  { name: 'tour'},
  { name: 'spm' },
  { name: 'auth' }];

/*****************************************************************
 * Operations (alphabetically ordered)
 *****************************************************************/
// Create Db
function opCreateDb(dbInfo) {
  logger.trace('[opCreateDb]: ', dbInfo);
  let dbs = {};
  switch (dbInfo.type) {
    case 'MSG':
      dbs.msg = treo('rs_msg_db-' + dbInfo.accountGuid, _getVersionedTreoSchema(MSG_DB_VERSIONED_SCHEMA));
      break;
    case 'SIFT':
      if (!dbInfo.siftGuid) {
        throw new Error('[opCreateDb]: dbInfo.siftGuid undefined');
      }
      logger.trace('[opCreateDb]: creating SIFT db');
      var schema = _getTreoSchema(dbInfo.schema, true);
      // Add user and redsift stores to sift db.
      schema = schema.addStore('_user.default').addStore('_redsift');
      dbs.db = treo(dbInfo.siftGuid + '-' + dbInfo.accountGuid, schema);
      dbs.msg = treo('rs_msg_db-' + dbInfo.accountGuid, _getVersionedTreoSchema(MSG_DB_VERSIONED_SCHEMA));
      break;
    case 'SYNC':
      logger.trace('[opCreateDb]: creating SYNC db');
      dbs.db = treo('rs_sync_log-' + dbInfo.accountGuid, _getTreoSchema(SYNC_DB_SCHEMA));
      break;
    case 'CLIENT':
      dbs.db = treo('rs_client_db-' + dbInfo.clientName, _getTreoSchema(CLIENT_DB_SCHEMA));
      break;
    default:
      throw new Error('[opCreateDb]: unsupported db type: ' + dbInfo.type);
  }
  return dbs;
}

// Del
function opDel(dbs, params, siftGuid) {
  logger.trace('[opDel]: ', params, siftGuid);
  if (!params.bucket) {
    return Promise.reject('[opDel]: params.bucket undefined');
  }
  if (!params.keys || params.keys.length === 0) {
    logger.trace('[opDel]: params.keys undefined');
    return Promise.resolve();
  }
  if (EMAIL_BUCKETS.indexOf(params.bucket) !== -1) {
    var keys = params.keys.map((k) => {
      return siftGuid + '/' + k;
    });
    return _batchDelete(dbs.msg, { bucket: params.bucket, keys: keys });
  }
  return _batchDelete(dbs.db, params);
}

// Get
function opGet(dbs, params, siftGuid) {
  logger.trace('[opGet]: ', params);
  if (!params.bucket) {
    return Promise.reject('[opGet]: params.bucket undefined');
  }
  if (!params.keys || params.keys.length === 0) {
    return Promise.reject('[opGet]: param.keys undefined');
  }
  if (EMAIL_BUCKETS.indexOf(params.bucket) !== -1) {
    var keys = params.keys.map((k) => {
      return siftGuid + '/' + k;
    });
    return _findIn(dbs.msg, { bucket: params.bucket, keys: keys }).then((result) => {
      return result.map((r) => {
        return { key: r.key.split('/')[1], value: r.value };
      });
    });
  }
  return _findIn(dbs.db, params);
}

// Get All
function opGetAll(dbs, params, siftGuid) {
  logger.trace('[opGetAll]: ', params, siftGuid);
  if (!params.bucket) {
    return Promise.reject('[opGetAll]: params.bucket undefined');
  }
  if (EMAIL_BUCKETS.indexOf(params.bucket) !== -1) {
    return _getAll(dbs.msg, { bucket: params.bucket, index: 'sift.guid', range: siftGuid }, true)
      .then(result =>
        result.map(r => ({ key: r.key.split('/')[1], value: r.value }))
      );
  }
  return _getAll(dbs.db, params, true);
}

// Get All Keys
function opGetAllKeys(dbs, params, siftGuid) {
  logger.trace('[opGetAllKeys]: ', params, siftGuid);
  if (!params.bucket) {
    return Promise.reject('[opGetAllKeys]: params.bucket undefined');
  }
  if (EMAIL_BUCKETS.indexOf(params.bucket) !== -1) {
    return _getAll(dbs.msg, { bucket: params.bucket, index: 'sift.guid', range: siftGuid }, false)
      .then(result => result.map(r => r.key.split('/')[1]));
  }
  return _getAll(dbs.db, params, false);
}

// Get Index
function opGetIndex(dbs, params, siftGuid) {
  logger.trace('[opGetIndex]: ', params, siftGuid);
  if (!params.bucket) {
    return Promise.reject('[opGetIndex]:params.bucket undefined');
  }
  if (EMAIL_BUCKETS.indexOf(params.bucket) !== -1) {
    return _getAll(dbs.msg, { bucket: params.bucket, index: 'sift.guid', range: siftGuid }, true).then((result) => {
      return result.map((r) => {
        return { key: r.key.split('/')[1], value: r.value };
      });
    });
  }
  if (!params.index) {
    return Promise.reject('[opGetIndex]:params.index undefined');
  }
  return _getAll(dbs.db, params, true);
}

// Get Index Keys
function opGetIndexKeys(dbs, params, siftGuid) {
  logger.trace('[opGetIndexKeys]: ', params, siftGuid);
  if (!params.bucket) {
    return Promise.reject('[opGetIndexKeys]: params.bucket undefined');
  }
  if (EMAIL_BUCKETS.indexOf(params.bucket) !== -1) {
    return _getAll(dbs.msg, { bucket: params.bucket, index: 'sift.guid', range: siftGuid }, false).then((result) => {
      return result.map((r) => {
        return { key: r.key.split('/')[1], value: r.value };
      });
    });
  }
  if (!params.index) {
    return Promise.reject('[opGetIndexKeys]: params.index undefined');
  }
  return _getAll(dbs.db, params, false);
}

// Get With Index
function opGetWithIndex(dbs, params, siftGuid) {
  logger.trace('[opGetWithIndex]: ', params, siftGuid);
  if (!params.bucket) {
    return Promise.reject('[opGetWithIndex]:params.bucket undefined');
  }
  if (!params.keys) {
    return Promise.reject('[opGetWithIndex]:params.keys undefined');
  }
  if (EMAIL_BUCKETS.indexOf(params.bucket) !== -1) {
    var keys = params.keys.map((k) => {
      return siftGuid + '/' + k;
    });
    return _getWithIndexRange(dbs.msg, { bucket: params.bucket, keys: keys, index: 'sift.guid', range: siftGuid }).then((result) => {
      return result.map((r) => {
        return { key: r.key.split('/')[1], value: r.value };
      });
    });
  }
  if (!params.index) {
    return Promise.reject('[opGetWithIndex]:params.index undefined');
  }
  if (!params.range) {
    return Promise.reject('[opGetWithIndex]:params.range undefined');
  }
  return _getWithIndexRange(dbs.db, params);
}

// Put
function opPut(dbs, params, raw, siftGuid) {
  logger.trace('[opPut]: ', params, raw, siftGuid);
  var db = dbs.db;
  if (!params.bucket) {
    return Promise.reject('[opPut]: params.bucket undefined');
  }
  if (!params.kvs || params.kvs.length === 0) {
    logger.warn('[opPut]: params.kvs undefined');
    return Promise.resolve();
  }
  var kvs = params.kvs;
  if (!raw) {
    // Wrap value into a {value: object}
    kvs = kvs.map((kv) => {
      return { key: kv.key, value: { value: kv.value } };
    });
  }
  if (EMAIL_BUCKETS.indexOf(params.bucket) !== -1) {
    db = dbs.msg;
    var kvs = kvs.map((kv) => {
      return { key: siftGuid + '/' + kv.key, value: kv.value };
    });
  }
  return _batchPut(db, { bucket: params.bucket, kvs: kvs }, raw);
}

/*****************************************************************
 * Internal functions
 *****************************************************************/

// define db schema
function _getTreoSchema(stores, sift) {
  logger.trace('[_getTreoSchema]: ', stores, sift);
  var schema = treo.schema().version(1);
  stores.forEach((os) => {
    if (!(sift && (EMAIL_BUCKETS.indexOf(os.name) !== -1))) {
      if (os.keypath) {
        schema = schema.addStore(os.name, { key: os.keypath });
      }
      else {
        schema = schema.addStore(os.name);
      }
      if (os.indexes) {
        os.indexes.forEach((idx) => {
          schema = schema.addIndex(idx, idx, { unique: false });
        });
      }
    }
  });
  return schema;
}

// versioned db schema
function _getVersionedTreoSchema(versions, sift) {
  logger.trace('[_getVersionedTreoSchema]: ', versions, sift);
  var schema = treo.schema();
  versions.forEach((stores, i) => {
    schema = schema.version(i + 1);
    stores.forEach((os) => {
      if (!(sift && (EMAIL_BUCKETS.indexOf(os.name) !== -1))) {
        if (os.drop) {
          logger.trace('[_getVersionedTreoSchema]: dropping store: ', os.name);
          schema = schema.dropStore(os.name);
        }
        else if (os.keypath) {
          schema = schema.addStore(os.name, { key: os.keypath });
        }
        else {
          schema = schema.addStore(os.name);
        }
        if (os.indexes) {
          os.indexes.forEach((idx) => {
            if (os.drop) {
              logger.trace('[_getVersionedTreoSchema]: dropping store/index: ' + os.name + '/' + idx);
              schema = schema.dropIndex(idx);
            }
            else {
              schema = schema.addIndex(idx, idx, { unique: false });
            }
          });
        }
      }
    });
  });
  return schema;
}

// Batch deletion supports numeric keys
function _batchDelete(db, params) {
  logger.trace('[_batchDelete]: ', params);
  return new Promise((resolve, reject) => {
    db.transaction('readwrite', [params.bucket], (err, tr) => {
      if (err) { return reject(err); }
      var store = tr.objectStore(params.bucket);
      var current = 0;
      var next = () => {
        if (current >= params.keys.length) { return; }
        var currentKey = params.keys[current];
        var req;
        req = store.delete(currentKey);
        req.onerror = reject;
        req.onsuccess = next;
        current += 1;
      };
      tr.onerror = tr.onabort = reject;
      tr.oncomplete = () => { resolve(); };
      next();
    });
  });
}

function _batchPut(db, params) {
  logger.trace('[_batchPut]: ', params);
  return new Promise((resolve, reject) => {
    var count = params.kvs.length;
    db.transaction('readwrite', [params.bucket], (err, tr) => {
      if (err) { return reject(err); }
      var store = tr.objectStore(params.bucket);
      var current = 0;
      var next = () => {
        if (current >= count) { return; }
        logger.trace('[_batchPut: put: ', params.kvs[current]);
        var req;
        req = store.put(params.kvs[current].value, params.kvs[current].key);
        req.onerror = reject;
        req.onsuccess = next;
        current += 1;
      };
      tr.onerror = tr.onabort = reject;
      tr.oncomplete = () => { resolve(); };
      next();
    });
  });
}

function _getWithIndexRange(db, params) {
  logger.trace('[_getWithIndexRange]: ', params);
  return new Promise((resolve, reject) => {
    var store = db.store(params.bucket);
    var result = [];
    var found = 0;
    var iterator = (cursor) => {
      var ki = params.keys.indexOf(cursor.primaryKey);
      if (ki !== -1) {
        logger.trace('[found key: ', cursor.primaryKey);
        result[ki].value = cursor.value.value;
        found++;
      }
      if (found === params.keys.length) {
        return done();
      }
      cursor.continue();
    };
    var done = (err) => {
      logger.trace('[_getWithIndexRange: result: ', result);
      err ? reject(err) : resolve(result);
    };
    params.keys.forEach((k) => {
      result.push({ key: k, value: undefined });
    });
    store.cursor({ index: params.index, range: params.range, iterator: iterator }, done);
  });
}

function _findIn(db, params) {
  logger.trace('[_findIn]: ', params);
  return new Promise((resolve, reject) => {
    var store = db.store(params.bucket);
    var result = [];
    var current = 0;
    var iterator = (cursor) => {
      logger.trace('[_findIn]: iterator: ', cursor);
      if (cursor.key > sKeys[current]) {
        logger.trace('[_findIn]: cursor ahead: ', cursor.key, sKeys[current]);
        while (cursor.key > sKeys[current] && current < sKeys.length) {
          current += 1;
          logger.trace('[_findIn]: moving to next key: ', cursor.key, sKeys[current]);
        }
        if (current > sKeys.length) {
          logger.trace('[_findIn]: exhausted keys. done.');
          return done();
        }
      }
      if (cursor.key === sKeys[current]) {
        logger.trace('[_findIn]: found key: ', cursor.key, cursor.value);
        result[params.keys.indexOf(sKeys[current])] = { key: cursor.key, value: cursor.value.value };
        current += 1;
        (current < sKeys.length) ? cursor.continue(sKeys[current]) : done();
      }
      else {
        logger.trace('[_findIn]: continuing to next key: ', sKeys[current]);
        cursor.continue(sKeys[current]); // go to next key
      }
    };
    var done = (err) => {
      logger.trace('[findIn]: result: ', result);
      err ? reject(err) : resolve(result);
    };
    var sKeys = params.keys.slice();
    sKeys = sKeys.sort(treo.cmp);
    logger.trace('[findIn: sorted keys: ', sKeys);
    params.keys.forEach((k) => {
      result.push({ key: k, value: undefined });
    });
    store.cursor({ iterator: iterator }, done);
  });
}

function _getAll(db, params, loadValue) {
  logger.trace('[_getAll]: ', params, loadValue);
  return new Promise((resolve, reject) => {
    var result = [];
    var keys = [];
    var store = db.store(params.bucket);
    var iterator = (cursor) => {
      var kv = { key: cursor.primaryKey };
      logger.trace('[_getAll]: cursor', cursor);
      if (loadValue) {
        kv.value = cursor.value.value;
      }
      if (params.index) {
        kv.index = cursor.key;
      }
      result.push(kv);
      keys.push(cursor.primaryKey);
      cursor.continue();
    };
    var opts = { iterator: iterator };
    if (params.index) {
      opts.index = params.index;
    }
    if (params.range) {
      opts.range = params.range;
    }
    store.cursor(opts, (err) => {
      if (err) {
        reject(err);
      }
      else {
        if (!params.index && !params.range && !loadValue) {
          logger.trace('[_getAll]: resolving: ', keys);
          resolve(keys);
        }
        else {
          logger.trace('[_getAll]: resolving: ', result);
          resolve(result);
        }
      }
    });
  });
}

/**
 * Redsift SDK. Sift Storage module.
 * Based on APIs from https://github.com/CrowdProcess/riak-pb
 *
 * Copyright (c) 2016 Redsift Limited. All rights reserved.
 */
let _siftGuid = new WeakMap();
let _dbs = new WeakMap();

class Storage {
  constructor(dbInfo, ll) {
    this._logger = loglevel$1.getLogger('RSStorage');
    this._logger.setLevel(ll || 'warn');
    if (!dbInfo.accountGuid) {
      throw new Error('[Storage]: dbInfo.accountGuid undefined');
    }
    _siftGuid.set(this, dbInfo.siftGuid);
    _dbs.set(this, opCreateDb(dbInfo));
  }

  /*****************************************************************
   * External Operations
   *****************************************************************/
  get(params) {
    this._logger.trace('[Storage::get]: ', params);
    return opGet(_dbs.get(this), params, _siftGuid.get(this));
  }

  getAll(params) {
    this._logger.trace('[Storage::getAll]: ', params);
    return opGetAll(_dbs.get(this), params, _siftGuid.get(this));
  }

  getAllKeys(params) {
    this._logger.trace('[Storage::getAllKeys]: ', params);
    return opGetAllKeys(_dbs.get(this), params, _siftGuid.get(this))
  }

  getIndex(params) {
    this._logger.trace('[Storage::getIndex]: ', params);
    return opGetIndex(_dbs.get(this), params, _siftGuid.get(this));
  }

  getIndexKeys(params) {
    this._logger.trace('[Storage::getIndexKeys]: ', params);
    return opGetIndexKeys(_dbs.get(this), params, _siftGuid.get(this));
  }

  getWithIndex(params) {
    this._logger.trace('[Storage::getWithIndex]: ', params);
    return opGetWithIndex(_dbs.get(this), params, _siftGuid.get(this));
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // Sift-only operations
  ///////////////////////////////////////////////////////////////////////////////////////////////
  delUser(params) {
    params.bucket = '_user.default';
    this._logger.trace('[Storage::delUser]: ', params);
    return opDel(_dbs.get(this), params, _siftGuid.get(this));
  }

  getUser(params) {
    params.bucket = '_user.default';
    this._logger.trace('[Storage::getUser]: ', params);
    return opGet(_dbs.get(this), params, _siftGuid.get(this));
  }

  putUser(params) {
    params.bucket = '_user.default';
    this._logger.trace('[Storage::putUser]: ', params);
    if (!params.kvs || params.kvs.length === 0) {
      return Promise.reject('[Storage::putUser]: params.kvs undefined');
    }
    return opPut(_dbs.get(this), params, false, _siftGuid.get(this));
  }

}

class SiftController {
  constructor() {
    this._proxy = self;
    this.view = new Observable();
    this.emailclient = new EmailClient(self);
    this._registerMessageListeners();
  }

  publish(topic, value) {
    this._proxy.postMessage({
      method: 'notifyView',
      params: {
        topic: topic,
        value: value
      }
    });
  }

  _registerMessageListeners() {
    if (!this._proxy) return;
    this._proxy.onmessage = (e) => {
      // console.log('[SiftController::onmessage]: ', e.data);
      let method = e.data.method;
      if (this['_' + method]) {
        this['_' + method](e.data.params);
      }
      else {
        // console.log('[SiftController:onmessage]: method not implemented: ', method);
      }
    };
  }

  _init(params) {
    // console.log('[SiftController::_init]: ', params);
    this.storage = new SiftStorage();
    this.storage.init(
      new Storage({
        type: 'SIFT',
        siftGuid: params.siftGuid,
        accountGuid: params.accountGuid,
        schema: params.dbSchema
      })
    );
    // Initialise sift details
    this._guid = params.siftGuid;
    this._account = params.accountGuid;
    // Init is done, post a message to the iframe_controller
    this._proxy.postMessage({
      method: 'initCallback',
      result: params
    });
  }

  _terminate() {
    if (!this._proxy) return;
    // console.log('[SiftController::_terminate]');
    this._proxy.close();
  }

  _postCallback(params, _result) {
    this._proxy.postMessage({
      method: 'loadViewCallback',
      params: {
        user: { guid: this._account },
        sift: { guid: this._guid },
        type: params.type,
        sizeClass: params.sizeClass,
        result: _result
      }
    });
  }

  _loadView(params) {
    // console.log('[SiftController::_loadView]: ', params);
    if (!this.loadView) {
      console.error('[SiftController::_loadView]: Sift controller must implement the loadView method');
      return;
    }
    // Invoke loadView method
    let result = this.loadView({
      sizeClass: params.sizeClass,
      type: params.type,
      params: params.data
    });
    // console.log('[SiftController::_loadView] loadView result: ', result);
    if (result.data && 'function' === typeof result.data.then) {
      if (result.html) {
        this._postCallback(params, { html: result.html });
      }
      result.data.then((data) => {
        this._postCallback(params, { html: result.html, data: data });
      }).catch((error) => {
        console.error('[SiftController::loadView]: promise rejected: ', error);
      });
    }
    else {
      this._postCallback(params, result);
    }
  }

  _storageUpdated(params) {
    // console.log('[SiftController::_storageUpdated]: ', params);
    // Notify the * listeners
    this.storage.publish('*', params);
    params.forEach((b) => {
      // Notify the bucket listeners.
      // TODO: send the list of keys instead of "[b]"
      this.storage.publish(b, [b]);
    });
  }

  _notifyController(params) {
    // console.log('[SiftController::_notifyController]: ', params);
    this.view.publish(params.topic, params.value);
  }

  _emailComposer(params) {
    // console.log('[SiftController::_emailComposer]: ', params);
    this.emailclient.publish(params.topic, params.value);
  }
}

function registerSiftController(siftController) {
  console.log('[Redsift::registerSiftController]: registered');
}

/**
 * Sift Measure. Frontend controller entry point.
 */
const MY_WRITING_WPS = 45/60; // words per second while writing thoughtfully
const MY_READING_WPS = 250/60;  // words per second while reading
const MY_PROOF_WPS = MY_READING_WPS/2; // words per second while proofreading

class MyController extends SiftController {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();
    this._suHandler = this.onStorageUpdate.bind(this);
    this._tuHandler = this.onTimingStorageUpdate.bind(this);
  }

  // TODO: Link to the docs
  loadView(state) {
    console.log('sift-measure: loadView', state);
    // Register for storage update events on the "count" bucket so we can update the UI
    this.storage.subscribe(['count'], this._suHandler);
    this.storage.subscribe(['timings'], this._tuHandler);

    this.getTimings();

    switch (state.type) {
      case 'email-thread':
        let w = 0;
        try {
          w = state.params.detail.words;
        }catch(e){ }
        return { html: 'email-thread.html', data: { words: w } };
      case 'summary':
        return { html: 'summary.html', data: Promise.all([this.getCounts(), this.getTimings()]) };
      default:
        console.error('sift-measure: unknown Sift type: ', state.type);
    }
  }

  // Event: storage update
  onStorageUpdate(value) {
    console.log('sift-measure: onStorageUpdate: ', value);
    return this.getCounts().then((counts) => {
      // Publish 'counts' event to view
      this.publish('counts', counts);
    });
  }
  
  onTimingStorageUpdate(value) {
    console.log('sift-measure: onTimingStorageUpdate: ', value);
    return this.getTimings().then((counts) => {
      // Publish 'counts' event to view
      this.publish('timings', counts);
    });
  }

  getTimings() {
    return this.storage.getAllKeys({ 
      bucket: 'timings' 
    }).then((values) => {
      console.log(values);
      if (values.length === 0) return values;
      return this.storage.get({ 
        bucket: 'timings',
        keys: values 
      });
    }).then((values) => {
      let parsed = values.map(d => ({ key: new Date(d.key), value: JSON.parse(d.value) }));

      let min = null;
      let max = null;
      if (values.length > 0) {
        min = parsed[0].key;
        max = parsed[values.length - 1].key;
      }
      return { min: min, max: max, values: parsed };
    });
  }

  getCounts() {
    return this.storage.get({
      bucket: 'count',
      keys: ['MYMESSAGES', 'MYWORDS', 'OTHERMESSAGES', 'OTHERWORDS', 'PEOPLE', 'SENDERS', 'DOMAINS']
    }).then((values) => {
      let myWords = values[1].value || 0;
      let otherWords = values[3].value || 0;

      let writeTime = myWords / MY_WRITING_WPS + myWords / MY_PROOF_WPS;
      let readTime = otherWords / MY_READING_WPS;

      return {
        my: { messages: values[0].value || 0, words: myWords, writing: writeTime, reading: readTime },
        other: { messages: values[2].value || 0, words: otherWords },
        people: values[4].value || 0,
        senders: values[5].value || 0,
        domains: values[6].value || 0                
      };
    });
  }
}

// Do not remove. The Sift is responsible for registering its views and controllers
registerSiftController(new MyController());

export default MyController;