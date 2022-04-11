/*!
 * pixi.js - v6.3.0
 * Compiled Wed, 23 Mar 2022 18:58:56 UTC
 *
 * pixi.js is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
var PIXI = (function (exports) {
    'use strict';
  
    /**
     * @this {Promise}
     */
    function finallyConstructor(callback) {
      var constructor = this.constructor;
      return this.then(
        function(value) {
          // @ts-ignore
          return constructor.resolve(callback()).then(function() {
            return value;
          });
        },
        function(reason) {
          // @ts-ignore
          return constructor.resolve(callback()).then(function() {
            // @ts-ignore
            return constructor.reject(reason);
          });
        }
      );
    }
  
    function allSettled(arr) {
      var P = this;
      return new P(function(resolve, reject) {
        if (!(arr && typeof arr.length !== 'undefined')) {
          return reject(
            new TypeError(
              typeof arr +
                ' ' +
                arr +
                ' is not iterable(cannot read property Symbol(Symbol.iterator))'
            )
          );
        }
        var args = Array.prototype.slice.call(arr);
        if (args.length === 0) { return resolve([]); }
        var remaining = args.length;
  
        function res(i, val) {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(
                val,
                function(val) {
                  res(i, val);
                },
                function(e) {
                  args[i] = { status: 'rejected', reason: e };
                  if (--remaining === 0) {
                    resolve(args);
                  }
                }
              );
              return;
            }
          }
          args[i] = { status: 'fulfilled', value: val };
          if (--remaining === 0) {
            resolve(args);
          }
        }
  
        for (var i = 0; i < args.length; i++) {
          res(i, args[i]);
        }
      });
    }
  
    // Store setTimeout reference so promise-polyfill will be unaffected by
    // other code modifying setTimeout (like sinon.useFakeTimers())
    var setTimeoutFunc = setTimeout;
  
    function isArray(x) {
      return Boolean(x && typeof x.length !== 'undefined');
    }
  
    function noop() {}
  
    // Polyfill for Function.prototype.bind
    function bind(fn, thisArg) {
      return function() {
        fn.apply(thisArg, arguments);
      };
    }
  
    /**
     * @constructor
     * @param {Function} fn
     */
    function Promise$1(fn) {
      if (!(this instanceof Promise$1))
        { throw new TypeError('Promises must be constructed via new'); }
      if (typeof fn !== 'function') { throw new TypeError('not a function'); }
      /** @type {!number} */
      this._state = 0;
      /** @type {!boolean} */
      this._handled = false;
      /** @type {Promise|undefined} */
      this._value = undefined;
      /** @type {!Array<!Function>} */
      this._deferreds = [];
  
      doResolve(fn, this);
    }
  
    function handle(self, deferred) {
      while (self._state === 3) {
        self = self._value;
      }
      if (self._state === 0) {
        self._deferreds.push(deferred);
        return;
      }
      self._handled = true;
      Promise$1._immediateFn(function() {
        var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
          (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
          return;
        }
        var ret;
        try {
          ret = cb(self._value);
        } catch (e) {
          reject(deferred.promise, e);
          return;
        }
        resolve(deferred.promise, ret);
      });
    }
  
    function resolve(self, newValue) {
      try {
        // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
        if (newValue === self)
          { throw new TypeError('A promise cannot be resolved with itself.'); }
        if (
          newValue &&
          (typeof newValue === 'object' || typeof newValue === 'function')
        ) {
          var then = newValue.then;
          if (newValue instanceof Promise$1) {
            self._state = 3;
            self._value = newValue;
            finale(self);
            return;
          } else if (typeof then === 'function') {
            doResolve(bind(then, newValue), self);
            return;
          }
        }
        self._state = 1;
        self._value = newValue;
        finale(self);
      } catch (e) {
        reject(self, e);
      }
    }
  
    function reject(self, newValue) {
      self._state = 2;
      self._value = newValue;
      finale(self);
    }
  
    function finale(self) {
      if (self._state === 2 && self._deferreds.length === 0) {
        Promise$1._immediateFn(function() {
          if (!self._handled) {
            Promise$1._unhandledRejectionFn(self._value);
          }
        });
      }
  
      for (var i = 0, len = self._deferreds.length; i < len; i++) {
        handle(self, self._deferreds[i]);
      }
      self._deferreds = null;
    }
  
    /**
     * @constructor
     */
    function Handler(onFulfilled, onRejected, promise) {
      this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
      this.onRejected = typeof onRejected === 'function' ? onRejected : null;
      this.promise = promise;
    }
  
    /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
    function doResolve(fn, self) {
      var done = false;
      try {
        fn(
          function(value) {
            if (done) { return; }
            done = true;
            resolve(self, value);
          },
          function(reason) {
            if (done) { return; }
            done = true;
            reject(self, reason);
          }
        );
      } catch (ex) {
        if (done) { return; }
        done = true;
        reject(self, ex);
      }
    }
  
    Promise$1.prototype['catch'] = function(onRejected) {
      return this.then(null, onRejected);
    };
  
    Promise$1.prototype.then = function(onFulfilled, onRejected) {
      // @ts-ignore
      var prom = new this.constructor(noop);
  
      handle(this, new Handler(onFulfilled, onRejected, prom));
      return prom;
    };
  
    Promise$1.prototype['finally'] = finallyConstructor;
  
    Promise$1.all = function(arr) {
      return new Promise$1(function(resolve, reject) {
        if (!isArray(arr)) {
          return reject(new TypeError('Promise.all accepts an array'));
        }
  
        var args = Array.prototype.slice.call(arr);
        if (args.length === 0) { return resolve([]); }
        var remaining = args.length;
  
        function res(i, val) {
          try {
            if (val && (typeof val === 'object' || typeof val === 'function')) {
              var then = val.then;
              if (typeof then === 'function') {
                then.call(
                  val,
                  function(val) {
                    res(i, val);
                  },
                  reject
                );
                return;
              }
            }
            args[i] = val;
            if (--remaining === 0) {
              resolve(args);
            }
          } catch (ex) {
            reject(ex);
          }
        }
  
        for (var i = 0; i < args.length; i++) {
          res(i, args[i]);
        }
      });
    };
  
    Promise$1.allSettled = allSettled;
  
    Promise$1.resolve = function(value) {
      if (value && typeof value === 'object' && value.constructor === Promise$1) {
        return value;
      }
  
      return new Promise$1(function(resolve) {
        resolve(value);
      });
    };
  
    Promise$1.reject = function(value) {
      return new Promise$1(function(resolve, reject) {
        reject(value);
      });
    };
  
    Promise$1.race = function(arr) {
      return new Promise$1(function(resolve, reject) {
        if (!isArray(arr)) {
          return reject(new TypeError('Promise.race accepts an array'));
        }
  
        for (var i = 0, len = arr.length; i < len; i++) {
          Promise$1.resolve(arr[i]).then(resolve, reject);
        }
      });
    };
  
    // Use polyfill for setImmediate for performance gains
    Promise$1._immediateFn =
      // @ts-ignore
      (typeof setImmediate === 'function' &&
        function(fn) {
          // @ts-ignore
          setImmediate(fn);
        }) ||
      function(fn) {
        setTimeoutFunc(fn, 0);
      };
  
    Promise$1._unhandledRejectionFn = function _unhandledRejectionFn(err) {
      if (typeof console !== 'undefined' && console) {
        console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
      }
    };
  
    /*
    object-assign
    (c) Sindre Sorhus
    @license MIT
    */
  
    'use strict';
    /* eslint-disable no-unused-vars */
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;
  
    function toObject(val) {
        if (val === null || val === undefined) {
            throw new TypeError('Object.assign cannot be called with null or undefined');
        }
  
        return Object(val);
    }
  
    function shouldUseNative() {
        try {
            if (!Object.assign) {
                return false;
            }
  
            // Detect buggy property enumeration order in older V8 versions.
  
            // https://bugs.chromium.org/p/v8/issues/detail?id=4118
            var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
            test1[5] = 'de';
            if (Object.getOwnPropertyNames(test1)[0] === '5') {
                return false;
            }
  
            // https://bugs.chromium.org/p/v8/issues/detail?id=3056
            var test2 = {};
            for (var i = 0; i < 10; i++) {
                test2['_' + String.fromCharCode(i)] = i;
            }
            var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
                return test2[n];
            });
            if (order2.join('') !== '0123456789') {
                return false;
            }
  
            // https://bugs.chromium.org/p/v8/issues/detail?id=3056
            var test3 = {};
            'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
                test3[letter] = letter;
            });
            if (Object.keys(Object.assign({}, test3)).join('') !==
                    'abcdefghijklmnopqrst') {
                return false;
            }
  
            return true;
        } catch (err) {
            // We don't expect any of the above to throw, but better to be safe.
            return false;
        }
    }
  
    var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
        var arguments$1 = arguments;
  
        var from;
        var to = toObject(target);
        var symbols;
  
        for (var s = 1; s < arguments.length; s++) {
            from = Object(arguments$1[s]);
  
            for (var key in from) {
                if (hasOwnProperty.call(from, key)) {
                    to[key] = from[key];
                }
            }
  
            if (getOwnPropertySymbols) {
                symbols = getOwnPropertySymbols(from);
                for (var i = 0; i < symbols.length; i++) {
                    if (propIsEnumerable.call(from, symbols[i])) {
                        to[symbols[i]] = from[symbols[i]];
                    }
                }
            }
        }
  
        return to;
    };
  
    /*!
     * @pixi/polyfill - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/polyfill is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
  
    if (typeof globalThis === 'undefined') {
        if (typeof self !== 'undefined') {
            // covers browsers
            // @ts-expect-error not-writable ts(2540) error only on node
            self.globalThis = self;
        }
        else if (typeof global !== 'undefined') {
            // covers versions of Node < 12
            // @ts-expect-error not-writable ts(2540) error only on node
            global.globalThis = global;
        }
    }
  
    // Support for IE 9 - 11 which does not include Promises
    if (!globalThis.Promise) {
        globalThis.Promise = Promise$1;
    }
  
    // References:
    if (!Object.assign) {
        Object.assign = objectAssign;
    }
  
    // References:
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // https://gist.github.com/1579671
    // http://updates.html5rocks.com/2012/05/requestAnimationFrame-API-now-with-sub-millisecond-precision
    // https://gist.github.com/timhall/4078614
    // https://github.com/Financial-Times/polyfill-service/tree/master/polyfills/requestAnimationFrame
    // Expected to be used with Browserfiy
    // Browserify automatically detects the use of `global` and passes the
    // correct reference of `global`, `globalThis`, and finally `window`
    var ONE_FRAME_TIME = 16;
    // Date.now
    if (!(Date.now && Date.prototype.getTime)) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }
    // performance.now
    if (!(globalThis.performance && globalThis.performance.now)) {
        var startTime_1 = Date.now();
        if (!globalThis.performance) {
            globalThis.performance = {};
        }
        globalThis.performance.now = function () { return Date.now() - startTime_1; };
    }
    // requestAnimationFrame
    var lastTime = Date.now();
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !globalThis.requestAnimationFrame; ++x) {
        var p = vendors[x];
        globalThis.requestAnimationFrame = globalThis[p + "RequestAnimationFrame"];
        globalThis.cancelAnimationFrame = globalThis[p + "CancelAnimationFrame"]
            || globalThis[p + "CancelRequestAnimationFrame"];
    }
    if (!globalThis.requestAnimationFrame) {
        globalThis.requestAnimationFrame = function (callback) {
            if (typeof callback !== 'function') {
                throw new TypeError(callback + "is not a function");
            }
            var currentTime = Date.now();
            var delay = ONE_FRAME_TIME + lastTime - currentTime;
            if (delay < 0) {
                delay = 0;
            }
            lastTime = currentTime;
            return globalThis.self.setTimeout(function () {
                lastTime = Date.now();
                callback(performance.now());
            }, delay);
        };
    }
    if (!globalThis.cancelAnimationFrame) {
        globalThis.cancelAnimationFrame = function (id) { return clearTimeout(id); };
    }
  
    // References:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
    if (!Math.sign) {
        Math.sign = function mathSign(x) {
            x = Number(x);
            if (x === 0 || isNaN(x)) {
                return x;
            }
            return x > 0 ? 1 : -1;
        };
    }
  
    // References:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
    if (!Number.isInteger) {
        Number.isInteger = function numberIsInteger(value) {
            return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
        };
    }
  
    if (!globalThis.ArrayBuffer) {
        globalThis.ArrayBuffer = Array;
    }
    if (!globalThis.Float32Array) {
        globalThis.Float32Array = Array;
    }
    if (!globalThis.Uint32Array) {
        globalThis.Uint32Array = Array;
    }
    if (!globalThis.Uint16Array) {
        globalThis.Uint16Array = Array;
    }
    if (!globalThis.Uint8Array) {
        globalThis.Uint8Array = Array;
    }
    if (!globalThis.Int32Array) {
        globalThis.Int32Array = Array;
    }
  
    var appleIphone = /iPhone/i;
    var appleIpod = /iPod/i;
    var appleTablet = /iPad/i;
    var appleUniversal = /\biOS-universal(?:.+)Mac\b/i;
    var androidPhone = /\bAndroid(?:.+)Mobile\b/i;
    var androidTablet = /Android/i;
    var amazonPhone = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i;
    var amazonTablet = /Silk/i;
    var windowsPhone = /Windows Phone/i;
    var windowsTablet = /\bWindows(?:.+)ARM\b/i;
    var otherBlackBerry = /BlackBerry/i;
    var otherBlackBerry10 = /BB10/i;
    var otherOpera = /Opera Mini/i;
    var otherChrome = /\b(CriOS|Chrome)(?:.+)Mobile/i;
    var otherFirefox = /Mobile(?:.+)Firefox\b/i;
    var isAppleTabletOnIos13 = function (navigator) {
        return (typeof navigator !== 'undefined' &&
            navigator.platform === 'MacIntel' &&
            typeof navigator.maxTouchPoints === 'number' &&
            navigator.maxTouchPoints > 1 &&
            typeof MSStream === 'undefined');
    };
    function createMatch(userAgent) {
        return function (regex) { return regex.test(userAgent); };
    }
    function isMobile(param) {
        var nav = {
            userAgent: '',
            platform: '',
            maxTouchPoints: 0
        };
        if (!param && typeof navigator !== 'undefined') {
            nav = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                maxTouchPoints: navigator.maxTouchPoints || 0
            };
        }
        else if (typeof param === 'string') {
            nav.userAgent = param;
        }
        else if (param && param.userAgent) {
            nav = {
                userAgent: param.userAgent,
                platform: param.platform,
                maxTouchPoints: param.maxTouchPoints || 0
            };
        }
        var userAgent = nav.userAgent;
        var tmp = userAgent.split('[FBAN');
        if (typeof tmp[1] !== 'undefined') {
            userAgent = tmp[0];
        }
        tmp = userAgent.split('Twitter');
        if (typeof tmp[1] !== 'undefined') {
            userAgent = tmp[0];
        }
        var match = createMatch(userAgent);
        var result = {
            apple: {
                phone: match(appleIphone) && !match(windowsPhone),
                ipod: match(appleIpod),
                tablet: !match(appleIphone) &&
                    (match(appleTablet) || isAppleTabletOnIos13(nav)) &&
                    !match(windowsPhone),
                universal: match(appleUniversal),
                device: (match(appleIphone) ||
                    match(appleIpod) ||
                    match(appleTablet) ||
                    match(appleUniversal) ||
                    isAppleTabletOnIos13(nav)) &&
                    !match(windowsPhone)
            },
            amazon: {
                phone: match(amazonPhone),
                tablet: !match(amazonPhone) && match(amazonTablet),
                device: match(amazonPhone) || match(amazonTablet)
            },
            android: {
                phone: (!match(windowsPhone) && match(amazonPhone)) ||
                    (!match(windowsPhone) && match(androidPhone)),
                tablet: !match(windowsPhone) &&
                    !match(amazonPhone) &&
                    !match(androidPhone) &&
                    (match(amazonTablet) || match(androidTablet)),
                device: (!match(windowsPhone) &&
                    (match(amazonPhone) ||
                        match(amazonTablet) ||
                        match(androidPhone) ||
                        match(androidTablet))) ||
                    match(/\bokhttp\b/i)
            },
            windows: {
                phone: match(windowsPhone),
                tablet: match(windowsTablet),
                device: match(windowsPhone) || match(windowsTablet)
            },
            other: {
                blackberry: match(otherBlackBerry),
                blackberry10: match(otherBlackBerry10),
                opera: match(otherOpera),
                firefox: match(otherFirefox),
                chrome: match(otherChrome),
                device: match(otherBlackBerry) ||
                    match(otherBlackBerry10) ||
                    match(otherOpera) ||
                    match(otherFirefox) ||
                    match(otherChrome)
            },
            any: false,
            phone: false,
            tablet: false
        };
        result.any =
            result.apple.device ||
                result.android.device ||
                result.windows.device ||
                result.other.device;
        result.phone =
            result.apple.phone || result.android.phone || result.windows.phone;
        result.tablet =
            result.apple.tablet || result.android.tablet || result.windows.tablet;
        return result;
    }
  
    /*!
     * @pixi/settings - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/settings is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
  
    // The ESM/CJS versions of ismobilejs only
    var isMobile$1 = isMobile(globalThis.navigator);
  
    /**
     * The maximum recommended texture units to use.
     * In theory the bigger the better, and for desktop we'll use as many as we can.
     * But some mobile devices slow down if there is to many branches in the shader.
     * So in practice there seems to be a sweet spot size that varies depending on the device.
     *
     * In v4, all mobile devices were limited to 4 texture units because for this.
     * In v5, we allow all texture units to be used on modern Apple or Android devices.
     *
     * @private
     * @param {number} max
     * @returns {number}
     */
    function maxRecommendedTextures(max) {
        var allowMax = true;
        if (isMobile$1.tablet || isMobile$1.phone) {
            if (isMobile$1.apple.device) {
                var match = (navigator.userAgent).match(/OS (\d+)_(\d+)?/);
                if (match) {
                    var majorVersion = parseInt(match[1], 10);
                    // Limit texture units on devices below iOS 11, which will be older hardware
                    if (majorVersion < 11) {
                        allowMax = false;
                    }
                }
            }
            if (isMobile$1.android.device) {
                var match = (navigator.userAgent).match(/Android\s([0-9.]*)/);
                if (match) {
                    var majorVersion = parseInt(match[1], 10);
                    // Limit texture units on devices below Android 7 (Nougat), which will be older hardware
                    if (majorVersion < 7) {
                        allowMax = false;
                    }
                }
            }
        }
        return allowMax ? max : 4;
    }
  
    /**
     * Uploading the same buffer multiple times in a single frame can cause performance issues.
     * Apparent on iOS so only check for that at the moment
     * This check may become more complex if this issue pops up elsewhere.
     *
     * @private
     * @returns {boolean}
     */
    function canUploadSameBuffer() {
        return !isMobile$1.apple.device;
    }
  
    /*!
     * @pixi/constants - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/constants is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
    /**
     * Different types of environments for WebGL.
     *
     * @static
     * @memberof PIXI
     * @name ENV
     * @enum {number}
     * @property {number} WEBGL_LEGACY - Used for older v1 WebGL devices. PixiJS will aim to ensure compatibility
     *  with older / less advanced devices. If you experience unexplained flickering prefer this environment.
     * @property {number} WEBGL - Version 1 of WebGL
     * @property {number} WEBGL2 - Version 2 of WebGL
     */
    var ENV;
    (function (ENV) {
        ENV[ENV["WEBGL_LEGACY"] = 0] = "WEBGL_LEGACY";
        ENV[ENV["WEBGL"] = 1] = "WEBGL";
        ENV[ENV["WEBGL2"] = 2] = "WEBGL2";
    })(ENV || (ENV = {}));
    /**
     * Constant to identify the Renderer Type.
     *
     * @static
     * @memberof PIXI
     * @name RENDERER_TYPE
     * @enum {number}
     * @property {number} UNKNOWN - Unknown render type.
     * @property {number} WEBGL - WebGL render type.
     * @property {number} CANVAS - Canvas render type.
     */
    var RENDERER_TYPE;
    (function (RENDERER_TYPE) {
        RENDERER_TYPE[RENDERER_TYPE["UNKNOWN"] = 0] = "UNKNOWN";
        RENDERER_TYPE[RENDERER_TYPE["WEBGL"] = 1] = "WEBGL";
        RENDERER_TYPE[RENDERER_TYPE["CANVAS"] = 2] = "CANVAS";
    })(RENDERER_TYPE || (RENDERER_TYPE = {}));
    /**
     * Bitwise OR of masks that indicate the buffers to be cleared.
     *
     * @static
     * @memberof PIXI
     * @name BUFFER_BITS
     * @enum {number}
     * @property {number} COLOR - Indicates the buffers currently enabled for color writing.
     * @property {number} DEPTH - Indicates the depth buffer.
     * @property {number} STENCIL - Indicates the stencil buffer.
     */
    var BUFFER_BITS;
    (function (BUFFER_BITS) {
        BUFFER_BITS[BUFFER_BITS["COLOR"] = 16384] = "COLOR";
        BUFFER_BITS[BUFFER_BITS["DEPTH"] = 256] = "DEPTH";
        BUFFER_BITS[BUFFER_BITS["STENCIL"] = 1024] = "STENCIL";
    })(BUFFER_BITS || (BUFFER_BITS = {}));
    /**
     * Various blend modes supported by PIXI.
     *
     * IMPORTANT - The WebGL renderer only supports the NORMAL, ADD, MULTIPLY and SCREEN blend modes.
     * Anything else will silently act like NORMAL.
     *
     * @memberof PIXI
     * @name BLEND_MODES
     * @enum {number}
     * @property {number} NORMAL
     * @property {number} ADD
     * @property {number} MULTIPLY
     * @property {number} SCREEN
     * @property {number} OVERLAY
     * @property {number} DARKEN
     * @property {number} LIGHTEN
     * @property {number} COLOR_DODGE
     * @property {number} COLOR_BURN
     * @property {number} HARD_LIGHT
     * @property {number} SOFT_LIGHT
     * @property {number} DIFFERENCE
     * @property {number} EXCLUSION
     * @property {number} HUE
     * @property {number} SATURATION
     * @property {number} COLOR
     * @property {number} LUMINOSITY
     * @property {number} NORMAL_NPM
     * @property {number} ADD_NPM
     * @property {number} SCREEN_NPM
     * @property {number} NONE
     * @property {number} SRC_IN
     * @property {number} SRC_OUT
     * @property {number} SRC_ATOP
     * @property {number} DST_OVER
     * @property {number} DST_IN
     * @property {number} DST_OUT
     * @property {number} DST_ATOP
     * @property {number} SUBTRACT
     * @property {number} SRC_OVER
     * @property {number} ERASE
     * @property {number} XOR
     */
    var BLEND_MODES;
    (function (BLEND_MODES) {
        BLEND_MODES[BLEND_MODES["NORMAL"] = 0] = "NORMAL";
        BLEND_MODES[BLEND_MODES["ADD"] = 1] = "ADD";
        BLEND_MODES[BLEND_MODES["MULTIPLY"] = 2] = "MULTIPLY";
        BLEND_MODES[BLEND_MODES["SCREEN"] = 3] = "SCREEN";
        BLEND_MODES[BLEND_MODES["OVERLAY"] = 4] = "OVERLAY";
        BLEND_MODES[BLEND_MODES["DARKEN"] = 5] = "DARKEN";
        BLEND_MODES[BLEND_MODES["LIGHTEN"] = 6] = "LIGHTEN";
        BLEND_MODES[BLEND_MODES["COLOR_DODGE"] = 7] = "COLOR_DODGE";
        BLEND_MODES[BLEND_MODES["COLOR_BURN"] = 8] = "COLOR_BURN";
        BLEND_MODES[BLEND_MODES["HARD_LIGHT"] = 9] = "HARD_LIGHT";
        BLEND_MODES[BLEND_MODES["SOFT_LIGHT"] = 10] = "SOFT_LIGHT";
        BLEND_MODES[BLEND_MODES["DIFFERENCE"] = 11] = "DIFFERENCE";
        BLEND_MODES[BLEND_MODES["EXCLUSION"] = 12] = "EXCLUSION";
        BLEND_MODES[BLEND_MODES["HUE"] = 13] = "HUE";
        BLEND_MODES[BLEND_MODES["SATURATION"] = 14] = "SATURATION";
        BLEND_MODES[BLEND_MODES["COLOR"] = 15] = "COLOR";
        BLEND_MODES[BLEND_MODES["LUMINOSITY"] = 16] = "LUMINOSITY";
        BLEND_MODES[BLEND_MODES["NORMAL_NPM"] = 17] = "NORMAL_NPM";
        BLEND_MODES[BLEND_MODES["ADD_NPM"] = 18] = "ADD_NPM";
        BLEND_MODES[BLEND_MODES["SCREEN_NPM"] = 19] = "SCREEN_NPM";
        BLEND_MODES[BLEND_MODES["NONE"] = 20] = "NONE";
        BLEND_MODES[BLEND_MODES["SRC_OVER"] = 0] = "SRC_OVER";
        BLEND_MODES[BLEND_MODES["SRC_IN"] = 21] = "SRC_IN";
        BLEND_MODES[BLEND_MODES["SRC_OUT"] = 22] = "SRC_OUT";
        BLEND_MODES[BLEND_MODES["SRC_ATOP"] = 23] = "SRC_ATOP";
        BLEND_MODES[BLEND_MODES["DST_OVER"] = 24] = "DST_OVER";
        BLEND_MODES[BLEND_MODES["DST_IN"] = 25] = "DST_IN";
        BLEND_MODES[BLEND_MODES["DST_OUT"] = 26] = "DST_OUT";
        BLEND_MODES[BLEND_MODES["DST_ATOP"] = 27] = "DST_ATOP";
        BLEND_MODES[BLEND_MODES["ERASE"] = 26] = "ERASE";
        BLEND_MODES[BLEND_MODES["SUBTRACT"] = 28] = "SUBTRACT";
        BLEND_MODES[BLEND_MODES["XOR"] = 29] = "XOR";
    })(BLEND_MODES || (BLEND_MODES = {}));
    /**
     * Various webgl draw modes. These can be used to specify which GL drawMode to use
     * under certain situations and renderers.
     *
     * @memberof PIXI
     * @static
     * @name DRAW_MODES
     * @enum {number}
     * @property {number} POINTS
     * @property {number} LINES
     * @property {number} LINE_LOOP
     * @property {number} LINE_STRIP
     * @property {number} TRIANGLES
     * @property {number} TRIANGLE_STRIP
     * @property {number} TRIANGLE_FAN
     */
    var DRAW_MODES;
    (function (DRAW_MODES) {
        DRAW_MODES[DRAW_MODES["POINTS"] = 0] = "POINTS";
        DRAW_MODES[DRAW_MODES["LINES"] = 1] = "LINES";
        DRAW_MODES[DRAW_MODES["LINE_LOOP"] = 2] = "LINE_LOOP";
        DRAW_MODES[DRAW_MODES["LINE_STRIP"] = 3] = "LINE_STRIP";
        DRAW_MODES[DRAW_MODES["TRIANGLES"] = 4] = "TRIANGLES";
        DRAW_MODES[DRAW_MODES["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
        DRAW_MODES[DRAW_MODES["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
    })(DRAW_MODES || (DRAW_MODES = {}));
    /**
     * Various GL texture/resources formats.
     *
     * @memberof PIXI
     * @static
     * @name FORMATS
     * @enum {number}
     * @property {number} RGBA=6408
     * @property {number} RGB=6407
     * @property {number} RG=33319
     * @property {number} RED=6403
     * @property {number} RGBA_INTEGER=36249
     * @property {number} RGB_INTEGER=36248
     * @property {number} RG_INTEGER=33320
     * @property {number} RED_INTEGER=36244
     * @property {number} ALPHA=6406
     * @property {number} LUMINANCE=6409
     * @property {number} LUMINANCE_ALPHA=6410
     * @property {number} DEPTH_COMPONENT=6402
     * @property {number} DEPTH_STENCIL=34041
     */
    var FORMATS;
    (function (FORMATS) {
        FORMATS[FORMATS["RGBA"] = 6408] = "RGBA";
        FORMATS[FORMATS["RGB"] = 6407] = "RGB";
        FORMATS[FORMATS["RG"] = 33319] = "RG";
        FORMATS[FORMATS["RED"] = 6403] = "RED";
        FORMATS[FORMATS["RGBA_INTEGER"] = 36249] = "RGBA_INTEGER";
        FORMATS[FORMATS["RGB_INTEGER"] = 36248] = "RGB_INTEGER";
        FORMATS[FORMATS["RG_INTEGER"] = 33320] = "RG_INTEGER";
        FORMATS[FORMATS["RED_INTEGER"] = 36244] = "RED_INTEGER";
        FORMATS[FORMATS["ALPHA"] = 6406] = "ALPHA";
        FORMATS[FORMATS["LUMINANCE"] = 6409] = "LUMINANCE";
        FORMATS[FORMATS["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
        FORMATS[FORMATS["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
        FORMATS[FORMATS["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
    })(FORMATS || (FORMATS = {}));
    /**
     * Various GL target types.
     *
     * @memberof PIXI
     * @static
     * @name TARGETS
     * @enum {number}
     * @property {number} TEXTURE_2D=3553
     * @property {number} TEXTURE_CUBE_MAP=34067
     * @property {number} TEXTURE_2D_ARRAY=35866
     * @property {number} TEXTURE_CUBE_MAP_POSITIVE_X=34069
     * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_X=34070
     * @property {number} TEXTURE_CUBE_MAP_POSITIVE_Y=34071
     * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_Y=34072
     * @property {number} TEXTURE_CUBE_MAP_POSITIVE_Z=34073
     * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_Z=34074
     */
    var TARGETS;
    (function (TARGETS) {
        TARGETS[TARGETS["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
        TARGETS[TARGETS["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
    })(TARGETS || (TARGETS = {}));
    /**
     * Various GL data format types.
     *
     * @memberof PIXI
     * @static
     * @name TYPES
     * @enum {number}
     * @property {number} UNSIGNED_BYTE=5121
     * @property {number} UNSIGNED_SHORT=5123
     * @property {number} UNSIGNED_SHORT_5_6_5=33635
     * @property {number} UNSIGNED_SHORT_4_4_4_4=32819
     * @property {number} UNSIGNED_SHORT_5_5_5_1=32820
     * @property {number} UNSIGNED_INT=5125
     * @property {number} UNSIGNED_INT_10F_11F_11F_REV=35899
     * @property {number} UNSIGNED_INT_2_10_10_10_REV=33640
     * @property {number} UNSIGNED_INT_24_8=34042
     * @property {number} UNSIGNED_INT_5_9_9_9_REV=35902
     * @property {number} BYTE=5120
     * @property {number} SHORT=5122
     * @property {number} INT=5124
     * @property {number} FLOAT=5126
     * @property {number} FLOAT_32_UNSIGNED_INT_24_8_REV=36269
     * @property {number} HALF_FLOAT=36193
     */
    var TYPES;
    (function (TYPES) {
        TYPES[TYPES["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
        TYPES[TYPES["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
        TYPES[TYPES["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
        TYPES[TYPES["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
        TYPES[TYPES["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
        TYPES[TYPES["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
        TYPES[TYPES["UNSIGNED_INT_10F_11F_11F_REV"] = 35899] = "UNSIGNED_INT_10F_11F_11F_REV";
        TYPES[TYPES["UNSIGNED_INT_2_10_10_10_REV"] = 33640] = "UNSIGNED_INT_2_10_10_10_REV";
        TYPES[TYPES["UNSIGNED_INT_24_8"] = 34042] = "UNSIGNED_INT_24_8";
        TYPES[TYPES["UNSIGNED_INT_5_9_9_9_REV"] = 35902] = "UNSIGNED_INT_5_9_9_9_REV";
        TYPES[TYPES["BYTE"] = 5120] = "BYTE";
        TYPES[TYPES["SHORT"] = 5122] = "SHORT";
        TYPES[TYPES["INT"] = 5124] = "INT";
        TYPES[TYPES["FLOAT"] = 5126] = "FLOAT";
        TYPES[TYPES["FLOAT_32_UNSIGNED_INT_24_8_REV"] = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV";
        TYPES[TYPES["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
    })(TYPES || (TYPES = {}));
    /**
     * Various sampler types. Correspond to `sampler`, `isampler`, `usampler` GLSL types respectively.
     * WebGL1 works only with FLOAT.
     *
     * @memberof PIXI
     * @static
     * @name SAMPLER_TYPES
     * @enum {number}
     * @property {number} FLOAT=0
     * @property {number} INT=1
     * @property {number} UINT=2
     */
    var SAMPLER_TYPES;
    (function (SAMPLER_TYPES) {
        SAMPLER_TYPES[SAMPLER_TYPES["FLOAT"] = 0] = "FLOAT";
        SAMPLER_TYPES[SAMPLER_TYPES["INT"] = 1] = "INT";
        SAMPLER_TYPES[SAMPLER_TYPES["UINT"] = 2] = "UINT";
    })(SAMPLER_TYPES || (SAMPLER_TYPES = {}));
    /**
     * The scale modes that are supported by pixi.
     *
     * The {@link PIXI.settings.SCALE_MODE} scale mode affects the default scaling mode of future operations.
     * It can be re-assigned to either LINEAR or NEAREST, depending upon suitability.
     *
     * @memberof PIXI
     * @static
     * @name SCALE_MODES
     * @enum {number}
     * @property {number} LINEAR Smooth scaling
     * @property {number} NEAREST Pixelating scaling
     */
    var SCALE_MODES;
    (function (SCALE_MODES) {
        SCALE_MODES[SCALE_MODES["NEAREST"] = 0] = "NEAREST";
        SCALE_MODES[SCALE_MODES["LINEAR"] = 1] = "LINEAR";
    })(SCALE_MODES || (SCALE_MODES = {}));
    /**
     * The wrap modes that are supported by pixi.
     *
     * The {@link PIXI.settings.WRAP_MODE} wrap mode affects the default wrapping mode of future operations.
     * It can be re-assigned to either CLAMP or REPEAT, depending upon suitability.
     * If the texture is non power of two then clamp will be used regardless as WebGL can
     * only use REPEAT if the texture is po2.
     *
     * This property only affects WebGL.
     *
     * @name WRAP_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} CLAMP - The textures uvs are clamped
     * @property {number} REPEAT - The texture uvs tile and repeat
     * @property {number} MIRRORED_REPEAT - The texture uvs tile and repeat with mirroring
     */
    var WRAP_MODES;
    (function (WRAP_MODES) {
        WRAP_MODES[WRAP_MODES["CLAMP"] = 33071] = "CLAMP";
        WRAP_MODES[WRAP_MODES["REPEAT"] = 10497] = "REPEAT";
        WRAP_MODES[WRAP_MODES["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
    })(WRAP_MODES || (WRAP_MODES = {}));
    /**
     * Mipmap filtering modes that are supported by pixi.
     *
     * The {@link PIXI.settings.MIPMAP_TEXTURES} affects default texture filtering.
     * Mipmaps are generated for a baseTexture if its `mipmap` field is `ON`,
     * or its `POW2` and texture dimensions are powers of 2.
     * Due to platform restriction, `ON` option will work like `POW2` for webgl-1.
     *
     * This property only affects WebGL.
     *
     * @name MIPMAP_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} OFF - No mipmaps
     * @property {number} POW2 - Generate mipmaps if texture dimensions are pow2
     * @property {number} ON - Always generate mipmaps
     * @property {number} ON_MANUAL - Use mipmaps, but do not auto-generate them; this is used with a resource
     *   that supports buffering each level-of-detail.
     */
    var MIPMAP_MODES;
    (function (MIPMAP_MODES) {
        MIPMAP_MODES[MIPMAP_MODES["OFF"] = 0] = "OFF";
        MIPMAP_MODES[MIPMAP_MODES["POW2"] = 1] = "POW2";
        MIPMAP_MODES[MIPMAP_MODES["ON"] = 2] = "ON";
        MIPMAP_MODES[MIPMAP_MODES["ON_MANUAL"] = 3] = "ON_MANUAL";
    })(MIPMAP_MODES || (MIPMAP_MODES = {}));
    /**
     * How to treat textures with premultiplied alpha
     *
     * @name ALPHA_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} NO_PREMULTIPLIED_ALPHA - Source is not premultiplied, leave it like that.
     *  Option for compressed and data textures that are created from typed arrays.
     * @property {number} PREMULTIPLY_ON_UPLOAD - Source is not premultiplied, premultiply on upload.
     *  Default option, used for all loaded images.
     * @property {number} PREMULTIPLIED_ALPHA - Source is already premultiplied
     *  Example: spine atlases with `_pma` suffix.
     * @property {number} NPM - Alias for NO_PREMULTIPLIED_ALPHA.
     * @property {number} UNPACK - Default option, alias for PREMULTIPLY_ON_UPLOAD.
     * @property {number} PMA - Alias for PREMULTIPLIED_ALPHA.
     */
    var ALPHA_MODES;
    (function (ALPHA_MODES) {
        ALPHA_MODES[ALPHA_MODES["NPM"] = 0] = "NPM";
        ALPHA_MODES[ALPHA_MODES["UNPACK"] = 1] = "UNPACK";
        ALPHA_MODES[ALPHA_MODES["PMA"] = 2] = "PMA";
        ALPHA_MODES[ALPHA_MODES["NO_PREMULTIPLIED_ALPHA"] = 0] = "NO_PREMULTIPLIED_ALPHA";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ON_UPLOAD"] = 1] = "PREMULTIPLY_ON_UPLOAD";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ALPHA"] = 2] = "PREMULTIPLY_ALPHA";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLIED_ALPHA"] = 2] = "PREMULTIPLIED_ALPHA";
    })(ALPHA_MODES || (ALPHA_MODES = {}));
    /**
     * Configure whether filter textures are cleared after binding.
     *
     * Filter textures need not be cleared if the filter does not use pixel blending. {@link CLEAR_MODES.BLIT} will detect
     * this and skip clearing as an optimization.
     *
     * @name CLEAR_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} BLEND - Do not clear the filter texture. The filter's output will blend on top of the output texture.
     * @property {number} CLEAR - Always clear the filter texture.
     * @property {number} BLIT - Clear only if {@link FilterSystem.forceClear} is set or if the filter uses pixel blending.
     * @property {number} NO - Alias for BLEND, same as `false` in earlier versions
     * @property {number} YES - Alias for CLEAR, same as `true` in earlier versions
     * @property {number} AUTO - Alias for BLIT
     */
    var CLEAR_MODES;
    (function (CLEAR_MODES) {
        CLEAR_MODES[CLEAR_MODES["NO"] = 0] = "NO";
        CLEAR_MODES[CLEAR_MODES["YES"] = 1] = "YES";
        CLEAR_MODES[CLEAR_MODES["AUTO"] = 2] = "AUTO";
        CLEAR_MODES[CLEAR_MODES["BLEND"] = 0] = "BLEND";
        CLEAR_MODES[CLEAR_MODES["CLEAR"] = 1] = "CLEAR";
        CLEAR_MODES[CLEAR_MODES["BLIT"] = 2] = "BLIT";
    })(CLEAR_MODES || (CLEAR_MODES = {}));
    /**
     * The gc modes that are supported by pixi.
     *
     * The {@link PIXI.settings.GC_MODE} Garbage Collection mode for PixiJS textures is AUTO
     * If set to GC_MODE, the renderer will occasionally check textures usage. If they are not
     * used for a specified period of time they will be removed from the GPU. They will of course
     * be uploaded again when they are required. This is a silent behind the scenes process that
     * should ensure that the GPU does not  get filled up.
     *
     * Handy for mobile devices!
     * This property only affects WebGL.
     *
     * @name GC_MODES
     * @enum {number}
     * @static
     * @memberof PIXI
     * @property {number} AUTO - Garbage collection will happen periodically automatically
     * @property {number} MANUAL - Garbage collection will need to be called manually
     */
    var GC_MODES;
    (function (GC_MODES) {
        GC_MODES[GC_MODES["AUTO"] = 0] = "AUTO";
        GC_MODES[GC_MODES["MANUAL"] = 1] = "MANUAL";
    })(GC_MODES || (GC_MODES = {}));
    /**
     * Constants that specify float precision in shaders.
     *
     * @name PRECISION
     * @memberof PIXI
     * @constant
     * @static
     * @enum {string}
     * @property {string} LOW='lowp'
     * @property {string} MEDIUM='mediump'
     * @property {string} HIGH='highp'
     */
    var PRECISION;
    (function (PRECISION) {
        PRECISION["LOW"] = "lowp";
        PRECISION["MEDIUM"] = "mediump";
        PRECISION["HIGH"] = "highp";
    })(PRECISION || (PRECISION = {}));
    /**
     * Constants for mask implementations.
     * We use `type` suffix because it leads to very different behaviours
     *
     * @name MASK_TYPES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} NONE - Mask is ignored
     * @property {number} SCISSOR - Scissor mask, rectangle on screen, cheap
     * @property {number} STENCIL - Stencil mask, 1-bit, medium, works only if renderer supports stencil
     * @property {number} SPRITE - Mask that uses SpriteMaskFilter, uses temporary RenderTexture
     */
    var MASK_TYPES;
    (function (MASK_TYPES) {
        MASK_TYPES[MASK_TYPES["NONE"] = 0] = "NONE";
        MASK_TYPES[MASK_TYPES["SCISSOR"] = 1] = "SCISSOR";
        MASK_TYPES[MASK_TYPES["STENCIL"] = 2] = "STENCIL";
        MASK_TYPES[MASK_TYPES["SPRITE"] = 3] = "SPRITE";
    })(MASK_TYPES || (MASK_TYPES = {}));
    /**
     * Constants for multi-sampling antialiasing.
     *
     * @see PIXI.Framebuffer#multisample
     *
     * @name MSAA_QUALITY
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} NONE - No multisampling for this renderTexture
     * @property {number} LOW - Try 2 samples
     * @property {number} MEDIUM - Try 4 samples
     * @property {number} HIGH - Try 8 samples
     */
    var MSAA_QUALITY;
    (function (MSAA_QUALITY) {
        MSAA_QUALITY[MSAA_QUALITY["NONE"] = 0] = "NONE";
        MSAA_QUALITY[MSAA_QUALITY["LOW"] = 2] = "LOW";
        MSAA_QUALITY[MSAA_QUALITY["MEDIUM"] = 4] = "MEDIUM";
        MSAA_QUALITY[MSAA_QUALITY["HIGH"] = 8] = "HIGH";
    })(MSAA_QUALITY || (MSAA_QUALITY = {}));
    /**
     * Constants for various buffer types in Pixi
     *
     * @see PIXI.BUFFER_TYPE
     *
     * @name BUFFER_TYPE
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} ELEMENT_ARRAY_BUFFER - buffer type for using as an index buffer
     * @property {number} ARRAY_BUFFER - buffer type for using attribute data
     * @property {number} UNIFORM_BUFFER - the buffer type is for uniform buffer objects
     */
    var BUFFER_TYPE;
    (function (BUFFER_TYPE) {
        BUFFER_TYPE[BUFFER_TYPE["ELEMENT_ARRAY_BUFFER"] = 34963] = "ELEMENT_ARRAY_BUFFER";
        BUFFER_TYPE[BUFFER_TYPE["ARRAY_BUFFER"] = 34962] = "ARRAY_BUFFER";
        // NOT YET SUPPORTED
        BUFFER_TYPE[BUFFER_TYPE["UNIFORM_BUFFER"] = 35345] = "UNIFORM_BUFFER";
    })(BUFFER_TYPE || (BUFFER_TYPE = {}));
  
    /**
     * User's customizable globals for overriding the default PIXI settings, such
     * as a renderer's default resolution, framerate, float precision, etc.
     * @example
     * // Use the native window resolution as the default resolution
     * // will support high-density displays when rendering
     * PIXI.settings.RESOLUTION = window.devicePixelRatio;
     *
     * // Disable interpolation when scaling, will make texture be pixelated
     * PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
     * @namespace PIXI.settings
     */
    var settings = {
        /**
         * If set to true WebGL will attempt make textures mimpaped by default.
         * Mipmapping will only succeed if the base texture uploaded has power of two dimensions.
         *
         * @static
         * @name MIPMAP_TEXTURES
         * @memberof PIXI.settings
         * @type {PIXI.MIPMAP_MODES}
         * @default PIXI.MIPMAP_MODES.POW2
         */
        MIPMAP_TEXTURES: MIPMAP_MODES.POW2,
        /**
         * Default anisotropic filtering level of textures.
         * Usually from 0 to 16
         *
         * @static
         * @name ANISOTROPIC_LEVEL
         * @memberof PIXI.settings
         * @type {number}
         * @default 0
         */
        ANISOTROPIC_LEVEL: 0,
        /**
         * Default resolution / device pixel ratio of the renderer.
         *
         * @static
         * @name RESOLUTION
         * @memberof PIXI.settings
         * @type {number}
         * @default 1
         */
        RESOLUTION: 1,
        /**
         * Default filter resolution.
         *
         * @static
         * @name FILTER_RESOLUTION
         * @memberof PIXI.settings
         * @type {number}
         * @default 1
         */
        FILTER_RESOLUTION: 1,
        /**
         * Default filter samples.
         *
         * @static
         * @name FILTER_MULTISAMPLE
         * @memberof PIXI.settings
         * @type {PIXI.MSAA_QUALITY}
         * @default PIXI.MSAA_QUALITY.NONE
         */
        FILTER_MULTISAMPLE: MSAA_QUALITY.NONE,
        /**
         * The maximum textures that this device supports.
         *
         * @static
         * @name SPRITE_MAX_TEXTURES
         * @memberof PIXI.settings
         * @type {number}
         * @default 32
         */
        SPRITE_MAX_TEXTURES: maxRecommendedTextures(32),
        // TODO: maybe change to SPRITE.BATCH_SIZE: 2000
        // TODO: maybe add PARTICLE.BATCH_SIZE: 15000
        /**
         * The default sprite batch size.
         *
         * The default aims to balance desktop and mobile devices.
         *
         * @static
         * @name SPRITE_BATCH_SIZE
         * @memberof PIXI.settings
         * @type {number}
         * @default 4096
         */
        SPRITE_BATCH_SIZE: 4096,
        /**
         * The default render options if none are supplied to {@link PIXI.Renderer}
         * or {@link PIXI.CanvasRenderer}.
         *
         * @static
         * @name RENDER_OPTIONS
         * @memberof PIXI.settings
         * @type {object}
         * @property {HTMLCanvasElement} view=null
         * @property {boolean} antialias=false
         * @property {boolean} autoDensity=false
         * @property {boolean} useContextAlpha=true
         * @property {number} backgroundColor=0x000000
         * @property {number} backgroundAlpha=1
         * @property {boolean} clearBeforeRender=true
         * @property {boolean} preserveDrawingBuffer=false
         * @property {number} width=800
         * @property {number} height=600
         * @property {boolean} legacy=false
         */
        RENDER_OPTIONS: {
            view: null,
            antialias: false,
            autoDensity: false,
            backgroundColor: 0x000000,
            backgroundAlpha: 1,
            useContextAlpha: true,
            clearBeforeRender: true,
            preserveDrawingBuffer: false,
            width: 800,
            height: 600,
            legacy: false,
        },
        /**
         * Default Garbage Collection mode.
         *
         * @static
         * @name GC_MODE
         * @memberof PIXI.settings
         * @type {PIXI.GC_MODES}
         * @default PIXI.GC_MODES.AUTO
         */
        GC_MODE: GC_MODES.AUTO,
        /**
         * Default Garbage Collection max idle.
         *
         * @static
         * @name GC_MAX_IDLE
         * @memberof PIXI.settings
         * @type {number}
         * @default 3600
         */
        GC_MAX_IDLE: 60 * 60,
        /**
         * Default Garbage Collection maximum check count.
         *
         * @static
         * @name GC_MAX_CHECK_COUNT
         * @memberof PIXI.settings
         * @type {number}
         * @default 600
         */
        GC_MAX_CHECK_COUNT: 60 * 10,
        /**
         * Default wrap modes that are supported by pixi.
         *
         * @static
         * @name WRAP_MODE
         * @memberof PIXI.settings
         * @type {PIXI.WRAP_MODES}
         * @default PIXI.WRAP_MODES.CLAMP
         */
        WRAP_MODE: WRAP_MODES.CLAMP,
        /**
         * Default scale mode for textures.
         *
         * @static
         * @name SCALE_MODE
         * @memberof PIXI.settings
         * @type {PIXI.SCALE_MODES}
         * @default PIXI.SCALE_MODES.LINEAR
         */
        SCALE_MODE: SCALE_MODES.LINEAR,
        /**
         * Default specify float precision in vertex shader.
         *
         * @static
         * @name PRECISION_VERTEX
         * @memberof PIXI.settings
         * @type {PIXI.PRECISION}
         * @default PIXI.PRECISION.HIGH
         */
        PRECISION_VERTEX: PRECISION.HIGH,
        /**
         * Default specify float precision in fragment shader.
         * iOS is best set at highp due to https://github.com/pixijs/pixi.js/issues/3742
         *
         * @static
         * @name PRECISION_FRAGMENT
         * @memberof PIXI.settings
         * @type {PIXI.PRECISION}
         * @default PIXI.PRECISION.MEDIUM
         */
        PRECISION_FRAGMENT: isMobile$1.apple.device ? PRECISION.HIGH : PRECISION.MEDIUM,
        /**
         * Can we upload the same buffer in a single frame?
         *
         * @static
         * @name CAN_UPLOAD_SAME_BUFFER
         * @memberof PIXI.settings
         * @type {boolean}
         */
        CAN_UPLOAD_SAME_BUFFER: canUploadSameBuffer(),
        /**
         * Enables bitmap creation before image load. This feature is experimental.
         *
         * @static
         * @name CREATE_IMAGE_BITMAP
         * @memberof PIXI.settings
         * @type {boolean}
         * @default false
         */
        CREATE_IMAGE_BITMAP: false,
        /**
         * If true PixiJS will Math.floor() x/y values when rendering, stopping pixel interpolation.
         * Advantages can include sharper image quality (like text) and faster rendering on canvas.
         * The main disadvantage is movement of objects may appear less smooth.
         *
         * @static
         * @constant
         * @memberof PIXI.settings
         * @type {boolean}
         * @default false
         */
        ROUND_PIXELS: false,
    };
  
    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
  
    function getDefaultExportFromCjs (x) {
        return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }
  
    function createCommonjsModule(fn, basedir, module) {
        return module = {
            path: basedir,
            exports: {},
            require: function (path, base) {
                return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
            }
        }, fn(module, module.exports), module.exports;
    }
  
    function getDefaultExportFromNamespaceIfPresent (n) {
        return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
    }
  
    function getDefaultExportFromNamespaceIfNotNamed (n) {
        return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
    }
  
    function getAugmentedNamespace(n) {
        if (n.__esModule) return n;
        var a = Object.defineProperty({}, '__esModule', {value: true});
        Object.keys(n).forEach(function (k) {
            var d = Object.getOwnPropertyDescriptor(n, k);
            Object.defineProperty(a, k, d.get ? d : {
                enumerable: true,
                get: function () {
                    return n[k];
                }
            });
        });
        return a;
    }
  
    function commonjsRequire () {
        throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }
  
    var eventemitter3 = createCommonjsModule(function (module) {
    'use strict';
  
    var has = Object.prototype.hasOwnProperty
      , prefix = '~';
  
    /**
     * Constructor to create a storage for our `EE` objects.
     * An `Events` instance is a plain object whose properties are event names.
     *
     * @constructor
     * @private
     */
    function Events() {}
  
    //
    // We try to not inherit from `Object.prototype`. In some engines creating an
    // instance in this way is faster than calling `Object.create(null)` directly.
    // If `Object.create(null)` is not supported we prefix the event names with a
    // character to make sure that the built-in object properties are not
    // overridden or used as an attack vector.
    //
    if (Object.create) {
      Events.prototype = Object.create(null);
  
      //
      // This hack is needed because the `__proto__` property is still inherited in
      // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
      //
      if (!new Events().__proto__) { prefix = false; }
    }
  
    /**
     * Representation of a single event listener.
     *
     * @param {Function} fn The listener function.
     * @param {*} context The context to invoke the listener with.
     * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
     * @constructor
     * @private
     */
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
  
    /**
     * Add a listener for a given event.
     *
     * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} context The context to invoke the listener with.
     * @param {Boolean} once Specify if the listener is a one-time listener.
     * @returns {EventEmitter}
     * @private
     */
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
      }
  
      var listener = new EE(fn, context || emitter, once)
        , evt = prefix ? prefix + event : event;
  
      if (!emitter._events[evt]) { emitter._events[evt] = listener, emitter._eventsCount++; }
      else if (!emitter._events[evt].fn) { emitter._events[evt].push(listener); }
      else { emitter._events[evt] = [emitter._events[evt], listener]; }
  
      return emitter;
    }
  
    /**
     * Clear event by name.
     *
     * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
     * @param {(String|Symbol)} evt The Event name.
     * @private
     */
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) { emitter._events = new Events(); }
      else { delete emitter._events[evt]; }
    }
  
    /**
     * Minimal `EventEmitter` interface that is molded against the Node.js
     * `EventEmitter` interface.
     *
     * @constructor
     * @public
     */
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }
  
    /**
     * Return an array listing the events for which the emitter has registered
     * listeners.
     *
     * @returns {Array}
     * @public
     */
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = []
        , events
        , name;
  
      if (this._eventsCount === 0) { return names; }
  
      for (name in (events = this._events)) {
        if (has.call(events, name)) { names.push(prefix ? name.slice(1) : name); }
      }
  
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
  
      return names;
    };
  
    /**
     * Return the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Array} The registered listeners.
     * @public
     */
    EventEmitter.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event
        , handlers = this._events[evt];
  
      if (!handlers) { return []; }
      if (handlers.fn) { return [handlers.fn]; }
  
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
  
      return ee;
    };
  
    /**
     * Return the number of listeners listening to a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Number} The number of listeners.
     * @public
     */
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event
        , listeners = this._events[evt];
  
      if (!listeners) { return 0; }
      if (listeners.fn) { return 1; }
      return listeners.length;
    };
  
    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Boolean} `true` if the event had listeners, else `false`.
     * @public
     */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var arguments$1 = arguments;
  
      var evt = prefix ? prefix + event : event;
  
      if (!this._events[evt]) { return false; }
  
      var listeners = this._events[evt]
        , len = arguments.length
        , args
        , i;
  
      if (listeners.fn) {
        if (listeners.once) { this.removeListener(event, listeners.fn, undefined, true); }
  
        switch (len) {
          case 1: return listeners.fn.call(listeners.context), true;
          case 2: return listeners.fn.call(listeners.context, a1), true;
          case 3: return listeners.fn.call(listeners.context, a1, a2), true;
          case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
  
        for (i = 1, args = new Array(len -1); i < len; i++) {
          args[i - 1] = arguments$1[i];
        }
  
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length
          , j;
  
        for (i = 0; i < length; i++) {
          if (listeners[i].once) { this.removeListener(event, listeners[i].fn, undefined, true); }
  
          switch (len) {
            case 1: listeners[i].fn.call(listeners[i].context); break;
            case 2: listeners[i].fn.call(listeners[i].context, a1); break;
            case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
            case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
            default:
              if (!args) { for (j = 1, args = new Array(len -1); j < len; j++) {
                args[j - 1] = arguments$1[j];
              } }
  
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
  
      return true;
    };
  
    /**
     * Add a listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
  
    /**
     * Add a one-time listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
  
    /**
     * Remove the listeners of a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn Only remove the listeners that match this function.
     * @param {*} context Only remove the listeners that have this context.
     * @param {Boolean} once Only remove one-time listeners.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
  
      if (!this._events[evt]) { return this; }
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
  
      var listeners = this._events[evt];
  
      if (listeners.fn) {
        if (
          listeners.fn === fn &&
          (!once || listeners.once) &&
          (!context || listeners.context === context)
        ) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (
            listeners[i].fn !== fn ||
            (once && !listeners[i].once) ||
            (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }
  
        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) { this._events[evt] = events.length === 1 ? events[0] : events; }
        else { clearEvent(this, evt); }
      }
  
      return this;
    };
  
    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param {(String|Symbol)} [event] The event name.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
  
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) { clearEvent(this, evt); }
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
  
      return this;
    };
  
    //
    // Alias methods names because people roll like that.
    //
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  
    //
    // Expose the prefix.
    //
    EventEmitter.prefixed = prefix;
  
    //
    // Allow `EventEmitter` to be imported as module namespace.
    //
    EventEmitter.EventEmitter = EventEmitter;
  
    //
    // Expose the module.
    //
    if ('undefined' !== 'object') {
      module.exports = EventEmitter;
    }
    });
  
    'use strict';
  
    var earcut_1 = earcut;
    var _default = earcut;
  
    function earcut(data, holeIndices, dim) {
  
        dim = dim || 2;
  
        var hasHoles = holeIndices && holeIndices.length,
            outerLen = hasHoles ? holeIndices[0] * dim : data.length,
            outerNode = linkedList(data, 0, outerLen, dim, true),
            triangles = [];
  
        if (!outerNode || outerNode.next === outerNode.prev) { return triangles; }
  
        var minX, minY, maxX, maxY, x, y, invSize;
  
        if (hasHoles) { outerNode = eliminateHoles(data, holeIndices, outerNode, dim); }
  
        // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
        if (data.length > 80 * dim) {
            minX = maxX = data[0];
            minY = maxY = data[1];
  
            for (var i = dim; i < outerLen; i += dim) {
                x = data[i];
                y = data[i + 1];
                if (x < minX) { minX = x; }
                if (y < minY) { minY = y; }
                if (x > maxX) { maxX = x; }
                if (y > maxY) { maxY = y; }
            }
  
            // minX, minY and invSize are later used to transform coords into integers for z-order calculation
            invSize = Math.max(maxX - minX, maxY - minY);
            invSize = invSize !== 0 ? 1 / invSize : 0;
        }
  
        earcutLinked(outerNode, triangles, dim, minX, minY, invSize);
  
        return triangles;
    }
  
    // create a circular doubly linked list from polygon points in the specified winding order
    function linkedList(data, start, end, dim, clockwise) {
        var i, last;
  
        if (clockwise === (signedArea(data, start, end, dim) > 0)) {
            for (i = start; i < end; i += dim) { last = insertNode(i, data[i], data[i + 1], last); }
        } else {
            for (i = end - dim; i >= start; i -= dim) { last = insertNode(i, data[i], data[i + 1], last); }
        }
  
        if (last && equals(last, last.next)) {
            removeNode(last);
            last = last.next;
        }
  
        return last;
    }
  
    // eliminate colinear or duplicate points
    function filterPoints(start, end) {
        if (!start) { return start; }
        if (!end) { end = start; }
  
        var p = start,
            again;
        do {
            again = false;
  
            if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
                removeNode(p);
                p = end = p.prev;
                if (p === p.next) { break; }
                again = true;
  
            } else {
                p = p.next;
            }
        } while (again || p !== end);
  
        return end;
    }
  
    // main ear slicing loop which triangulates a polygon (given as a linked list)
    function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
        if (!ear) { return; }
  
        // interlink polygon nodes in z-order
        if (!pass && invSize) { indexCurve(ear, minX, minY, invSize); }
  
        var stop = ear,
            prev, next;
  
        // iterate through ears, slicing them one by one
        while (ear.prev !== ear.next) {
            prev = ear.prev;
            next = ear.next;
  
            if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
                // cut off the triangle
                triangles.push(prev.i / dim);
                triangles.push(ear.i / dim);
                triangles.push(next.i / dim);
  
                removeNode(ear);
  
                // skipping the next vertex leads to less sliver triangles
                ear = next.next;
                stop = next.next;
  
                continue;
            }
  
            ear = next;
  
            // if we looped through the whole remaining polygon and can't find any more ears
            if (ear === stop) {
                // try filtering points and slicing again
                if (!pass) {
                    earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);
  
                // if this didn't work, try curing all small self-intersections locally
                } else if (pass === 1) {
                    ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
                    earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);
  
                // as a last resort, try splitting the remaining polygon into two
                } else if (pass === 2) {
                    splitEarcut(ear, triangles, dim, minX, minY, invSize);
                }
  
                break;
            }
        }
    }
  
    // check whether a polygon node forms a valid ear with adjacent nodes
    function isEar(ear) {
        var a = ear.prev,
            b = ear,
            c = ear.next;
  
        if (area(a, b, c) >= 0) { return false; } // reflex, can't be an ear
  
        // now make sure we don't have other points inside the potential ear
        var p = ear.next.next;
  
        while (p !== ear.prev) {
            if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) { return false; }
            p = p.next;
        }
  
        return true;
    }
  
    function isEarHashed(ear, minX, minY, invSize) {
        var a = ear.prev,
            b = ear,
            c = ear.next;
  
        if (area(a, b, c) >= 0) { return false; } // reflex, can't be an ear
  
        // triangle bbox; min & max are calculated like this for speed
        var minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x),
            minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y),
            maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x),
            maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);
  
        // z-order range for the current triangle bbox;
        var minZ = zOrder(minTX, minTY, minX, minY, invSize),
            maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);
  
        var p = ear.prevZ,
            n = ear.nextZ;
  
        // look for points inside the triangle in both directions
        while (p && p.z >= minZ && n && n.z <= maxZ) {
            if (p !== ear.prev && p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) { return false; }
            p = p.prevZ;
  
            if (n !== ear.prev && n !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
                area(n.prev, n, n.next) >= 0) { return false; }
            n = n.nextZ;
        }
  
        // look for remaining points in decreasing z-order
        while (p && p.z >= minZ) {
            if (p !== ear.prev && p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) { return false; }
            p = p.prevZ;
        }
  
        // look for remaining points in increasing z-order
        while (n && n.z <= maxZ) {
            if (n !== ear.prev && n !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
                area(n.prev, n, n.next) >= 0) { return false; }
            n = n.nextZ;
        }
  
        return true;
    }
  
    // go through all polygon nodes and cure small local self-intersections
    function cureLocalIntersections(start, triangles, dim) {
        var p = start;
        do {
            var a = p.prev,
                b = p.next.next;
  
            if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {
  
                triangles.push(a.i / dim);
                triangles.push(p.i / dim);
                triangles.push(b.i / dim);
  
                // remove two nodes involved
                removeNode(p);
                removeNode(p.next);
  
                p = start = b;
            }
            p = p.next;
        } while (p !== start);
  
        return filterPoints(p);
    }
  
    // try splitting polygon into two and triangulate them independently
    function splitEarcut(start, triangles, dim, minX, minY, invSize) {
        // look for a valid diagonal that divides the polygon into two
        var a = start;
        do {
            var b = a.next.next;
            while (b !== a.prev) {
                if (a.i !== b.i && isValidDiagonal(a, b)) {
                    // split the polygon in two by the diagonal
                    var c = splitPolygon(a, b);
  
                    // filter colinear points around the cuts
                    a = filterPoints(a, a.next);
                    c = filterPoints(c, c.next);
  
                    // run earcut on each half
                    earcutLinked(a, triangles, dim, minX, minY, invSize);
                    earcutLinked(c, triangles, dim, minX, minY, invSize);
                    return;
                }
                b = b.next;
            }
            a = a.next;
        } while (a !== start);
    }
  
    // link every hole into the outer loop, producing a single-ring polygon without holes
    function eliminateHoles(data, holeIndices, outerNode, dim) {
        var queue = [],
            i, len, start, end, list;
  
        for (i = 0, len = holeIndices.length; i < len; i++) {
            start = holeIndices[i] * dim;
            end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            list = linkedList(data, start, end, dim, false);
            if (list === list.next) { list.steiner = true; }
            queue.push(getLeftmost(list));
        }
  
        queue.sort(compareX);
  
        // process holes from left to right
        for (i = 0; i < queue.length; i++) {
            eliminateHole(queue[i], outerNode);
            outerNode = filterPoints(outerNode, outerNode.next);
        }
  
        return outerNode;
    }
  
    function compareX(a, b) {
        return a.x - b.x;
    }
  
    // find a bridge between vertices that connects hole with an outer ring and and link it
    function eliminateHole(hole, outerNode) {
        outerNode = findHoleBridge(hole, outerNode);
        if (outerNode) {
            var b = splitPolygon(outerNode, hole);
  
            // filter collinear points around the cuts
            filterPoints(outerNode, outerNode.next);
            filterPoints(b, b.next);
        }
    }
  
    // David Eberly's algorithm for finding a bridge between hole and outer polygon
    function findHoleBridge(hole, outerNode) {
        var p = outerNode,
            hx = hole.x,
            hy = hole.y,
            qx = -Infinity,
            m;
  
        // find a segment intersected by a ray from the hole's leftmost point to the left;
        // segment's endpoint with lesser x will be potential connection point
        do {
            if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
                var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
                if (x <= hx && x > qx) {
                    qx = x;
                    if (x === hx) {
                        if (hy === p.y) { return p; }
                        if (hy === p.next.y) { return p.next; }
                    }
                    m = p.x < p.next.x ? p : p.next;
                }
            }
            p = p.next;
        } while (p !== outerNode);
  
        if (!m) { return null; }
  
        if (hx === qx) { return m; } // hole touches outer segment; pick leftmost endpoint
  
        // look for points inside the triangle of hole point, segment intersection and endpoint;
        // if there are no points found, we have a valid connection;
        // otherwise choose the point of the minimum angle with the ray as connection point
  
        var stop = m,
            mx = m.x,
            my = m.y,
            tanMin = Infinity,
            tan;
  
        p = m;
  
        do {
            if (hx >= p.x && p.x >= mx && hx !== p.x &&
                    pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {
  
                tan = Math.abs(hy - p.y) / (hx - p.x); // tangential
  
                if (locallyInside(p, hole) &&
                    (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) {
                    m = p;
                    tanMin = tan;
                }
            }
  
            p = p.next;
        } while (p !== stop);
  
        return m;
    }
  
    // whether sector in vertex m contains sector in vertex p in the same coordinates
    function sectorContainsSector(m, p) {
        return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
    }
  
    // interlink polygon nodes in z-order
    function indexCurve(start, minX, minY, invSize) {
        var p = start;
        do {
            if (p.z === null) { p.z = zOrder(p.x, p.y, minX, minY, invSize); }
            p.prevZ = p.prev;
            p.nextZ = p.next;
            p = p.next;
        } while (p !== start);
  
        p.prevZ.nextZ = null;
        p.prevZ = null;
  
        sortLinked(p);
    }
  
    // Simon Tatham's linked list merge sort algorithm
    // http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
    function sortLinked(list) {
        var i, p, q, e, tail, numMerges, pSize, qSize,
            inSize = 1;
  
        do {
            p = list;
            list = null;
            tail = null;
            numMerges = 0;
  
            while (p) {
                numMerges++;
                q = p;
                pSize = 0;
                for (i = 0; i < inSize; i++) {
                    pSize++;
                    q = q.nextZ;
                    if (!q) { break; }
                }
                qSize = inSize;
  
                while (pSize > 0 || (qSize > 0 && q)) {
  
                    if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                        e = p;
                        p = p.nextZ;
                        pSize--;
                    } else {
                        e = q;
                        q = q.nextZ;
                        qSize--;
                    }
  
                    if (tail) { tail.nextZ = e; }
                    else { list = e; }
  
                    e.prevZ = tail;
                    tail = e;
                }
  
                p = q;
            }
  
            tail.nextZ = null;
            inSize *= 2;
  
        } while (numMerges > 1);
  
        return list;
    }
  
    // z-order of a point given coords and inverse of the longer side of data bbox
    function zOrder(x, y, minX, minY, invSize) {
        // coords are transformed into non-negative 15-bit integer range
        x = 32767 * (x - minX) * invSize;
        y = 32767 * (y - minY) * invSize;
  
        x = (x | (x << 8)) & 0x00FF00FF;
        x = (x | (x << 4)) & 0x0F0F0F0F;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;
  
        y = (y | (y << 8)) & 0x00FF00FF;
        y = (y | (y << 4)) & 0x0F0F0F0F;
        y = (y | (y << 2)) & 0x33333333;
        y = (y | (y << 1)) & 0x55555555;
  
        return x | (y << 1);
    }
  
    // find the leftmost node of a polygon ring
    function getLeftmost(start) {
        var p = start,
            leftmost = start;
        do {
            if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) { leftmost = p; }
            p = p.next;
        } while (p !== start);
  
        return leftmost;
    }
  
    // check if a point lies within a convex triangle
    function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
        return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
               (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
               (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
    }
  
    // check if a diagonal between two polygon nodes is valid (lies in polygon interior)
    function isValidDiagonal(a, b) {
        return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && // dones't intersect other edges
               (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && // locally visible
                (area(a.prev, a, b.prev) || area(a, b.prev, b)) || // does not create opposite-facing sectors
                equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); // special zero-length case
    }
  
    // signed area of a triangle
    function area(p, q, r) {
        return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    }
  
    // check if two points are equal
    function equals(p1, p2) {
        return p1.x === p2.x && p1.y === p2.y;
    }
  
    // check if two segments intersect
    function intersects(p1, q1, p2, q2) {
        var o1 = sign(area(p1, q1, p2));
        var o2 = sign(area(p1, q1, q2));
        var o3 = sign(area(p2, q2, p1));
        var o4 = sign(area(p2, q2, q1));
  
        if (o1 !== o2 && o3 !== o4) { return true; } // general case
  
        if (o1 === 0 && onSegment(p1, p2, q1)) { return true; } // p1, q1 and p2 are collinear and p2 lies on p1q1
        if (o2 === 0 && onSegment(p1, q2, q1)) { return true; } // p1, q1 and q2 are collinear and q2 lies on p1q1
        if (o3 === 0 && onSegment(p2, p1, q2)) { return true; } // p2, q2 and p1 are collinear and p1 lies on p2q2
        if (o4 === 0 && onSegment(p2, q1, q2)) { return true; } // p2, q2 and q1 are collinear and q1 lies on p2q2
  
        return false;
    }
  
    // for collinear points p, q, r, check if point q lies on segment pr
    function onSegment(p, q, r) {
        return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    }
  
    function sign(num) {
        return num > 0 ? 1 : num < 0 ? -1 : 0;
    }
  
    // check if a polygon diagonal intersects any polygon segments
    function intersectsPolygon(a, b) {
        var p = a;
        do {
            if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                    intersects(p, p.next, a, b)) { return true; }
            p = p.next;
        } while (p !== a);
  
        return false;
    }
  
    // check if a polygon diagonal is locally inside the polygon
    function locallyInside(a, b) {
        return area(a.prev, a, a.next) < 0 ?
            area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
            area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
    }
  
    // check if the middle point of a polygon diagonal is inside the polygon
    function middleInside(a, b) {
        var p = a,
            inside = false,
            px = (a.x + b.x) / 2,
            py = (a.y + b.y) / 2;
        do {
            if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                    (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
                { inside = !inside; }
            p = p.next;
        } while (p !== a);
  
        return inside;
    }
  
    // link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
    // if one belongs to the outer ring and another to a hole, it merges it into a single ring
    function splitPolygon(a, b) {
        var a2 = new Node(a.i, a.x, a.y),
            b2 = new Node(b.i, b.x, b.y),
            an = a.next,
            bp = b.prev;
  
        a.next = b;
        b.prev = a;
  
        a2.next = an;
        an.prev = a2;
  
        b2.next = a2;
        a2.prev = b2;
  
        bp.next = b2;
        b2.prev = bp;
  
        return b2;
    }
  
    // create a node and optionally link it with previous one (in a circular doubly linked list)
    function insertNode(i, x, y, last) {
        var p = new Node(i, x, y);
  
        if (!last) {
            p.prev = p;
            p.next = p;
  
        } else {
            p.next = last.next;
            p.prev = last;
            last.next.prev = p;
            last.next = p;
        }
        return p;
    }
  
    function removeNode(p) {
        p.next.prev = p.prev;
        p.prev.next = p.next;
  
        if (p.prevZ) { p.prevZ.nextZ = p.nextZ; }
        if (p.nextZ) { p.nextZ.prevZ = p.prevZ; }
    }
  
    function Node(i, x, y) {
        // vertex index in coordinates array
        this.i = i;
  
        // vertex coordinates
        this.x = x;
        this.y = y;
  
        // previous and next vertex nodes in a polygon ring
        this.prev = null;
        this.next = null;
  
        // z-order curve value
        this.z = null;
  
        // previous and next nodes in z-order
        this.prevZ = null;
        this.nextZ = null;
  
        // indicates whether this is a steiner point
        this.steiner = false;
    }
  
    // return a percentage difference between the polygon area and its triangulation area;
    // used to verify correctness of triangulation
    earcut.deviation = function (data, holeIndices, dim, triangles) {
        var hasHoles = holeIndices && holeIndices.length;
        var outerLen = hasHoles ? holeIndices[0] * dim : data.length;
  
        var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
        if (hasHoles) {
            for (var i = 0, len = holeIndices.length; i < len; i++) {
                var start = holeIndices[i] * dim;
                var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
                polygonArea -= Math.abs(signedArea(data, start, end, dim));
            }
        }
  
        var trianglesArea = 0;
        for (i = 0; i < triangles.length; i += 3) {
            var a = triangles[i] * dim;
            var b = triangles[i + 1] * dim;
            var c = triangles[i + 2] * dim;
            trianglesArea += Math.abs(
                (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
                (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
        }
  
        return polygonArea === 0 && trianglesArea === 0 ? 0 :
            Math.abs((trianglesArea - polygonArea) / polygonArea);
    };
  
    function signedArea(data, start, end, dim) {
        var sum = 0;
        for (var i = start, j = end - dim; i < end; i += dim) {
            sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
            j = i;
        }
        return sum;
    }
  
    // turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts
    earcut.flatten = function (data) {
        var dim = data[0][0].length,
            result = {vertices: [], holes: [], dimensions: dim},
            holeIndex = 0;
  
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].length; j++) {
                for (var d = 0; d < dim; d++) { result.vertices.push(data[i][j][d]); }
            }
            if (i > 0) {
                holeIndex += data[i - 1].length;
                result.holes.push(holeIndex);
            }
        }
        return result;
    };
    earcut_1.default = _default;
  
    var punycode = createCommonjsModule(function (module, exports) {
    /*! https://mths.be/punycode v1.3.2 by @mathias */
    ;(function(root) {
  
        /** Detect free variables */
        var freeExports = 'object' == 'object' && exports &&
            !exports.nodeType && exports;
        var freeModule = 'object' == 'object' && module &&
            !module.nodeType && module;
        var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
        if (
            freeGlobal.global === freeGlobal ||
            freeGlobal.window === freeGlobal ||
            freeGlobal.self === freeGlobal
        ) {
            root = freeGlobal;
        }
  
        /**
         * The `punycode` object.
         * @name punycode
         * @type Object
         */
        var punycode,
  
        /** Highest positive signed 32-bit float value */
        maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1
  
        /** Bootstring parameters */
        base = 36,
        tMin = 1,
        tMax = 26,
        skew = 38,
        damp = 700,
        initialBias = 72,
        initialN = 128, // 0x80
        delimiter = '-', // '\x2D'
  
        /** Regular expressions */
        regexPunycode = /^xn--/,
        regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
        regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators
  
        /** Error messages */
        errors = {
            'overflow': 'Overflow: input needs wider integers to process',
            'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
            'invalid-input': 'Invalid input'
        },
  
        /** Convenience shortcuts */
        baseMinusTMin = base - tMin,
        floor = Math.floor,
        stringFromCharCode = String.fromCharCode,
  
        /** Temporary variable */
        key;
  
        /*--------------------------------------------------------------------------*/
  
        /**
         * A generic error utility function.
         * @private
         * @param {String} type The error type.
         * @returns {Error} Throws a `RangeError` with the applicable error message.
         */
        function error(type) {
            throw RangeError(errors[type]);
        }
  
        /**
         * A generic `Array#map` utility function.
         * @private
         * @param {Array} array The array to iterate over.
         * @param {Function} callback The function that gets called for every array
         * item.
         * @returns {Array} A new array of values returned by the callback function.
         */
        function map(array, fn) {
            var length = array.length;
            var result = [];
            while (length--) {
                result[length] = fn(array[length]);
            }
            return result;
        }
  
        /**
         * A simple `Array#map`-like wrapper to work with domain name strings or email
         * addresses.
         * @private
         * @param {String} domain The domain name or email address.
         * @param {Function} callback The function that gets called for every
         * character.
         * @returns {Array} A new string of characters returned by the callback
         * function.
         */
        function mapDomain(string, fn) {
            var parts = string.split('@');
            var result = '';
            if (parts.length > 1) {
                // In email addresses, only the domain name should be punycoded. Leave
                // the local part (i.e. everything up to `@`) intact.
                result = parts[0] + '@';
                string = parts[1];
            }
            // Avoid `split(regex)` for IE8 compatibility. See #17.
            string = string.replace(regexSeparators, '\x2E');
            var labels = string.split('.');
            var encoded = map(labels, fn).join('.');
            return result + encoded;
        }
  
        /**
         * Creates an array containing the numeric code points of each Unicode
         * character in the string. While JavaScript uses UCS-2 internally,
         * this function will convert a pair of surrogate halves (each of which
         * UCS-2 exposes as separate characters) into a single code point,
         * matching UTF-16.
         * @see `punycode.ucs2.encode`
         * @see <https://mathiasbynens.be/notes/javascript-encoding>
         * @memberOf punycode.ucs2
         * @name decode
         * @param {String} string The Unicode input string (UCS-2).
         * @returns {Array} The new array of code points.
         */
        function ucs2decode(string) {
            var output = [],
                counter = 0,
                length = string.length,
                value,
                extra;
            while (counter < length) {
                value = string.charCodeAt(counter++);
                if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                    // high surrogate, and there is a next character
                    extra = string.charCodeAt(counter++);
                    if ((extra & 0xFC00) == 0xDC00) { // low surrogate
                        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                    } else {
                        // unmatched surrogate; only append this code unit, in case the next
                        // code unit is the high surrogate of a surrogate pair
                        output.push(value);
                        counter--;
                    }
                } else {
                    output.push(value);
                }
            }
            return output;
        }
  
        /**
         * Creates a string based on an array of numeric code points.
         * @see `punycode.ucs2.decode`
         * @memberOf punycode.ucs2
         * @name encode
         * @param {Array} codePoints The array of numeric code points.
         * @returns {String} The new Unicode string (UCS-2).
         */
        function ucs2encode(array) {
            return map(array, function(value) {
                var output = '';
                if (value > 0xFFFF) {
                    value -= 0x10000;
                    output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
                    value = 0xDC00 | value & 0x3FF;
                }
                output += stringFromCharCode(value);
                return output;
            }).join('');
        }
  
        /**
         * Converts a basic code point into a digit/integer.
         * @see `digitToBasic()`
         * @private
         * @param {Number} codePoint The basic numeric code point value.
         * @returns {Number} The numeric value of a basic code point (for use in
         * representing integers) in the range `0` to `base - 1`, or `base` if
         * the code point does not represent a value.
         */
        function basicToDigit(codePoint) {
            if (codePoint - 48 < 10) {
                return codePoint - 22;
            }
            if (codePoint - 65 < 26) {
                return codePoint - 65;
            }
            if (codePoint - 97 < 26) {
                return codePoint - 97;
            }
            return base;
        }
  
        /**
         * Converts a digit/integer into a basic code point.
         * @see `basicToDigit()`
         * @private
         * @param {Number} digit The numeric value of a basic code point.
         * @returns {Number} The basic code point whose value (when used for
         * representing integers) is `digit`, which needs to be in the range
         * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
         * used; else, the lowercase form is used. The behavior is undefined
         * if `flag` is non-zero and `digit` has no uppercase form.
         */
        function digitToBasic(digit, flag) {
            //  0..25 map to ASCII a..z or A..Z
            // 26..35 map to ASCII 0..9
            return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
        }
  
        /**
         * Bias adaptation function as per section 3.4 of RFC 3492.
         * http://tools.ietf.org/html/rfc3492#section-3.4
         * @private
         */
        function adapt(delta, numPoints, firstTime) {
            var k = 0;
            delta = firstTime ? floor(delta / damp) : delta >> 1;
            delta += floor(delta / numPoints);
            for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
                delta = floor(delta / baseMinusTMin);
            }
            return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
        }
  
        /**
         * Converts a Punycode string of ASCII-only symbols to a string of Unicode
         * symbols.
         * @memberOf punycode
         * @param {String} input The Punycode string of ASCII-only symbols.
         * @returns {String} The resulting string of Unicode symbols.
         */
        function decode(input) {
            // Don't use UCS-2
            var output = [],
                inputLength = input.length,
                out,
                i = 0,
                n = initialN,
                bias = initialBias,
                basic,
                j,
                index,
                oldi,
                w,
                k,
                digit,
                t,
                /** Cached calculation results */
                baseMinusT;
  
            // Handle the basic code points: let `basic` be the number of input code
            // points before the last delimiter, or `0` if there is none, then copy
            // the first basic code points to the output.
  
            basic = input.lastIndexOf(delimiter);
            if (basic < 0) {
                basic = 0;
            }
  
            for (j = 0; j < basic; ++j) {
                // if it's not a basic code point
                if (input.charCodeAt(j) >= 0x80) {
                    error('not-basic');
                }
                output.push(input.charCodeAt(j));
            }
  
            // Main decoding loop: start just after the last delimiter if any basic code
            // points were copied; start at the beginning otherwise.
  
            for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {
  
                // `index` is the index of the next character to be consumed.
                // Decode a generalized variable-length integer into `delta`,
                // which gets added to `i`. The overflow checking is easier
                // if we increase `i` as we go, then subtract off its starting
                // value at the end to obtain `delta`.
                for (oldi = i, w = 1, k = base; /* no condition */; k += base) {
  
                    if (index >= inputLength) {
                        error('invalid-input');
                    }
  
                    digit = basicToDigit(input.charCodeAt(index++));
  
                    if (digit >= base || digit > floor((maxInt - i) / w)) {
                        error('overflow');
                    }
  
                    i += digit * w;
                    t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
  
                    if (digit < t) {
                        break;
                    }
  
                    baseMinusT = base - t;
                    if (w > floor(maxInt / baseMinusT)) {
                        error('overflow');
                    }
  
                    w *= baseMinusT;
  
                }
  
                out = output.length + 1;
                bias = adapt(i - oldi, out, oldi == 0);
  
                // `i` was supposed to wrap around from `out` to `0`,
                // incrementing `n` each time, so we'll fix that now:
                if (floor(i / out) > maxInt - n) {
                    error('overflow');
                }
  
                n += floor(i / out);
                i %= out;
  
                // Insert `n` at position `i` of the output
                output.splice(i++, 0, n);
  
            }
  
            return ucs2encode(output);
        }
  
        /**
         * Converts a string of Unicode symbols (e.g. a domain name label) to a
         * Punycode string of ASCII-only symbols.
         * @memberOf punycode
         * @param {String} input The string of Unicode symbols.
         * @returns {String} The resulting Punycode string of ASCII-only symbols.
         */
        function encode(input) {
            var n,
                delta,
                handledCPCount,
                basicLength,
                bias,
                j,
                m,
                q,
                k,
                t,
                currentValue,
                output = [],
                /** `inputLength` will hold the number of code points in `input`. */
                inputLength,
                /** Cached calculation results */
                handledCPCountPlusOne,
                baseMinusT,
                qMinusT;
  
            // Convert the input in UCS-2 to Unicode
            input = ucs2decode(input);
  
            // Cache the length
            inputLength = input.length;
  
            // Initialize the state
            n = initialN;
            delta = 0;
            bias = initialBias;
  
            // Handle the basic code points
            for (j = 0; j < inputLength; ++j) {
                currentValue = input[j];
                if (currentValue < 0x80) {
                    output.push(stringFromCharCode(currentValue));
                }
            }
  
            handledCPCount = basicLength = output.length;
  
            // `handledCPCount` is the number of code points that have been handled;
            // `basicLength` is the number of basic code points.
  
            // Finish the basic string - if it is not empty - with a delimiter
            if (basicLength) {
                output.push(delimiter);
            }
  
            // Main encoding loop:
            while (handledCPCount < inputLength) {
  
                // All non-basic code points < n have been handled already. Find the next
                // larger one:
                for (m = maxInt, j = 0; j < inputLength; ++j) {
                    currentValue = input[j];
                    if (currentValue >= n && currentValue < m) {
                        m = currentValue;
                    }
                }
  
                // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
                // but guard against overflow
                handledCPCountPlusOne = handledCPCount + 1;
                if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
                    error('overflow');
                }
  
                delta += (m - n) * handledCPCountPlusOne;
                n = m;
  
                for (j = 0; j < inputLength; ++j) {
                    currentValue = input[j];
  
                    if (currentValue < n && ++delta > maxInt) {
                        error('overflow');
                    }
  
                    if (currentValue == n) {
                        // Represent delta as a generalized variable-length integer
                        for (q = delta, k = base; /* no condition */; k += base) {
                            t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
                            if (q < t) {
                                break;
                            }
                            qMinusT = q - t;
                            baseMinusT = base - t;
                            output.push(
                                stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
                            );
                            q = floor(qMinusT / baseMinusT);
                        }
  
                        output.push(stringFromCharCode(digitToBasic(q, 0)));
                        bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                        delta = 0;
                        ++handledCPCount;
                    }
                }
  
                ++delta;
                ++n;
  
            }
            return output.join('');
        }
  
        /**
         * Converts a Punycode string representing a domain name or an email address
         * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
         * it doesn't matter if you call it on a string that has already been
         * converted to Unicode.
         * @memberOf punycode
         * @param {String} input The Punycoded domain name or email address to
         * convert to Unicode.
         * @returns {String} The Unicode representation of the given Punycode
         * string.
         */
        function toUnicode(input) {
            return mapDomain(input, function(string) {
                return regexPunycode.test(string)
                    ? decode(string.slice(4).toLowerCase())
                    : string;
            });
        }
  
        /**
         * Converts a Unicode string representing a domain name or an email address to
         * Punycode. Only the non-ASCII parts of the domain name will be converted,
         * i.e. it doesn't matter if you call it with a domain that's already in
         * ASCII.
         * @memberOf punycode
         * @param {String} input The domain name or email address to convert, as a
         * Unicode string.
         * @returns {String} The Punycode representation of the given domain name or
         * email address.
         */
        function toASCII(input) {
            return mapDomain(input, function(string) {
                return regexNonASCII.test(string)
                    ? 'xn--' + encode(string)
                    : string;
            });
        }
  
        /*--------------------------------------------------------------------------*/
  
        /** Define the public API */
        punycode = {
            /**
             * A string representing the current Punycode.js version number.
             * @memberOf punycode
             * @type String
             */
            'version': '1.3.2',
            /**
             * An object of methods to convert from JavaScript's internal character
             * representation (UCS-2) to Unicode code points, and back.
             * @see <https://mathiasbynens.be/notes/javascript-encoding>
             * @memberOf punycode
             * @type Object
             */
            'ucs2': {
                'decode': ucs2decode,
                'encode': ucs2encode
            },
            'decode': decode,
            'encode': encode,
            'toASCII': toASCII,
            'toUnicode': toUnicode
        };
  
        /** Expose `punycode` */
        // Some AMD build optimizers, like r.js, check for specific condition patterns
        // like the following:
        if (
            typeof undefined == 'function' &&
            typeof undefined.amd == 'object' &&
            undefined.amd
        ) {
            undefined('punycode', function() {
                return punycode;
            });
        } else if (freeExports && freeModule) {
            if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
                freeModule.exports = punycode;
            } else { // in Narwhal or RingoJS v0.7.0-
                for (key in punycode) {
                    punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
                }
            }
        } else { // in Rhino or a web browser
            root.punycode = punycode;
        }
  
    }(commonjsGlobal));
    });
  
    'use strict';
  
    var util = {
      isString: function(arg) {
        return typeof(arg) === 'string';
      },
      isObject: function(arg) {
        return typeof(arg) === 'object' && arg !== null;
      },
      isNull: function(arg) {
        return arg === null;
      },
      isNullOrUndefined: function(arg) {
        return arg == null;
      }
    };
  
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.
  
    'use strict';
  
    // If obj.hasOwnProperty has been overridden, then calling
    // obj.hasOwnProperty(prop) will break.
    // See: https://github.com/joyent/node/issues/1707
    function hasOwnProperty$1(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }
  
    var decode = function(qs, sep, eq, options) {
      sep = sep || '&';
      eq = eq || '=';
      var obj = {};
  
      if (typeof qs !== 'string' || qs.length === 0) {
        return obj;
      }
  
      var regexp = /\+/g;
      qs = qs.split(sep);
  
      var maxKeys = 1000;
      if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
      }
  
      var len = qs.length;
      // maxKeys <= 0 means that we should not limit keys count
      if (maxKeys > 0 && len > maxKeys) {
        len = maxKeys;
      }
  
      for (var i = 0; i < len; ++i) {
        var x = qs[i].replace(regexp, '%20'),
            idx = x.indexOf(eq),
            kstr, vstr, k, v;
  
        if (idx >= 0) {
          kstr = x.substr(0, idx);
          vstr = x.substr(idx + 1);
        } else {
          kstr = x;
          vstr = '';
        }
  
        k = decodeURIComponent(kstr);
        v = decodeURIComponent(vstr);
  
        if (!hasOwnProperty$1(obj, k)) {
          obj[k] = v;
        } else if (Array.isArray(obj[k])) {
          obj[k].push(v);
        } else {
          obj[k] = [obj[k], v];
        }
      }
  
      return obj;
    };
  
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.
  
    'use strict';
  
    var stringifyPrimitive = function(v) {
      switch (typeof v) {
        case 'string':
          return v;
  
        case 'boolean':
          return v ? 'true' : 'false';
  
        case 'number':
          return isFinite(v) ? v : '';
  
        default:
          return '';
      }
    };
  
    var encode = function(obj, sep, eq, name) {
      sep = sep || '&';
      eq = eq || '=';
      if (obj === null) {
        obj = undefined;
      }
  
      if (typeof obj === 'object') {
        return Object.keys(obj).map(function(k) {
          var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
          if (Array.isArray(obj[k])) {
            return obj[k].map(function(v) {
              return ks + encodeURIComponent(stringifyPrimitive(v));
            }).join(sep);
          } else {
            return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
          }
        }).join(sep);
  
      }
  
      if (!name) { return ''; }
      return encodeURIComponent(stringifyPrimitive(name)) + eq +
             encodeURIComponent(stringifyPrimitive(obj));
    };
  
    var querystring = createCommonjsModule(function (module, exports) {
    'use strict';
  
    exports.decode = exports.parse = decode;
    exports.encode = exports.stringify = encode;
    });
  
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.
  
    'use strict';
  
  
  
  
    var parse = urlParse;
    var resolve$1 = urlResolve;
    var resolveObject = urlResolveObject;
    var format = urlFormat;
  
    var Url_1 = Url;
  
    function Url() {
      this.protocol = null;
      this.slashes = null;
      this.auth = null;
      this.host = null;
      this.port = null;
      this.hostname = null;
      this.hash = null;
      this.search = null;
      this.query = null;
      this.pathname = null;
      this.path = null;
      this.href = null;
    }
  
    // Reference: RFC 3986, RFC 1808, RFC 2396
  
    // define these here so at least they only have to be
    // compiled once on the first module load.
    var protocolPattern = /^([a-z0-9.+-]+:)/i,
        portPattern = /:[0-9]*$/,
  
        // Special case for a simple path URL
        simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
  
        // RFC 2396: characters reserved for delimiting URLs.
        // We actually just auto-escape these.
        delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
  
        // RFC 2396: characters not allowed for various reasons.
        unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),
  
        // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
        autoEscape = ['\''].concat(unwise),
        // Characters that are never ever allowed in a hostname.
        // Note that any invalid chars are also handled, but these
        // are the ones that are *expected* to be seen, so we fast-path
        // them.
        nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
        hostEndingChars = ['/', '?', '#'],
        hostnameMaxLen = 255,
        hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
        hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
        // protocols that can allow "unsafe" and "unwise" chars.
        unsafeProtocol = {
          'javascript': true,
          'javascript:': true
        },
        // protocols that never have a hostname.
        hostlessProtocol = {
          'javascript': true,
          'javascript:': true
        },
        // protocols that always contain a // bit.
        slashedProtocol = {
          'http': true,
          'https': true,
          'ftp': true,
          'gopher': true,
          'file': true,
          'http:': true,
          'https:': true,
          'ftp:': true,
          'gopher:': true,
          'file:': true
        };
  
    function urlParse(url, parseQueryString, slashesDenoteHost) {
      if (url && util.isObject(url) && url instanceof Url) { return url; }
  
      var u = new Url;
      u.parse(url, parseQueryString, slashesDenoteHost);
      return u;
    }
  
    Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
      if (!util.isString(url)) {
        throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
      }
  
      // Copy chrome, IE, opera backslash-handling behavior.
      // Back slashes before the query string get converted to forward slashes
      // See: https://code.google.com/p/chromium/issues/detail?id=25916
      var queryIndex = url.indexOf('?'),
          splitter =
              (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
          uSplit = url.split(splitter),
          slashRegex = /\\/g;
      uSplit[0] = uSplit[0].replace(slashRegex, '/');
      url = uSplit.join(splitter);
  
      var rest = url;
  
      // trim before proceeding.
      // This is to support parse stuff like "  http://foo.com  \n"
      rest = rest.trim();
  
      if (!slashesDenoteHost && url.split('#').length === 1) {
        // Try fast path regexp
        var simplePath = simplePathPattern.exec(rest);
        if (simplePath) {
          this.path = rest;
          this.href = rest;
          this.pathname = simplePath[1];
          if (simplePath[2]) {
            this.search = simplePath[2];
            if (parseQueryString) {
              this.query = querystring.parse(this.search.substr(1));
            } else {
              this.query = this.search.substr(1);
            }
          } else if (parseQueryString) {
            this.search = '';
            this.query = {};
          }
          return this;
        }
      }
  
      var proto = protocolPattern.exec(rest);
      if (proto) {
        proto = proto[0];
        var lowerProto = proto.toLowerCase();
        this.protocol = lowerProto;
        rest = rest.substr(proto.length);
      }
  
      // figure out if it's got a host
      // user@server is *always* interpreted as a hostname, and url
      // resolution will treat //foo/bar as host=foo,path=bar because that's
      // how the browser resolves relative URLs.
      if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
        var slashes = rest.substr(0, 2) === '//';
        if (slashes && !(proto && hostlessProtocol[proto])) {
          rest = rest.substr(2);
          this.slashes = true;
        }
      }
  
      if (!hostlessProtocol[proto] &&
          (slashes || (proto && !slashedProtocol[proto]))) {
  
        // there's a hostname.
        // the first instance of /, ?, ;, or # ends the host.
        //
        // If there is an @ in the hostname, then non-host chars *are* allowed
        // to the left of the last @ sign, unless some host-ending character
        // comes *before* the @-sign.
        // URLs are obnoxious.
        //
        // ex:
        // http://a@b@c/ => user:a@b host:c
        // http://a@b?@c => user:a host:c path:/?@c
  
        // v0.12 TODO(isaacs): This is not quite how Chrome does things.
        // Review our test case against browsers more comprehensively.
  
        // find the first instance of any hostEndingChars
        var hostEnd = -1;
        for (var i = 0; i < hostEndingChars.length; i++) {
          var hec = rest.indexOf(hostEndingChars[i]);
          if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
            { hostEnd = hec; }
        }
  
        // at this point, either we have an explicit point where the
        // auth portion cannot go past, or the last @ char is the decider.
        var auth, atSign;
        if (hostEnd === -1) {
          // atSign can be anywhere.
          atSign = rest.lastIndexOf('@');
        } else {
          // atSign must be in auth portion.
          // http://a@b/c@d => host:b auth:a path:/c@d
          atSign = rest.lastIndexOf('@', hostEnd);
        }
  
        // Now we have a portion which is definitely the auth.
        // Pull that off.
        if (atSign !== -1) {
          auth = rest.slice(0, atSign);
          rest = rest.slice(atSign + 1);
          this.auth = decodeURIComponent(auth);
        }
  
        // the host is the remaining to the left of the first non-host char
        hostEnd = -1;
        for (var i = 0; i < nonHostChars.length; i++) {
          var hec = rest.indexOf(nonHostChars[i]);
          if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
            { hostEnd = hec; }
        }
        // if we still have not hit it, then the entire thing is a host.
        if (hostEnd === -1)
          { hostEnd = rest.length; }
  
        this.host = rest.slice(0, hostEnd);
        rest = rest.slice(hostEnd);
  
        // pull out port.
        this.parseHost();
  
        // we've indicated that there is a hostname,
        // so even if it's empty, it has to be present.
        this.hostname = this.hostname || '';
  
        // if hostname begins with [ and ends with ]
        // assume that it's an IPv6 address.
        var ipv6Hostname = this.hostname[0] === '[' &&
            this.hostname[this.hostname.length - 1] === ']';
  
        // validate a little.
        if (!ipv6Hostname) {
          var hostparts = this.hostname.split(/\./);
          for (var i = 0, l = hostparts.length; i < l; i++) {
            var part = hostparts[i];
            if (!part) { continue; }
            if (!part.match(hostnamePartPattern)) {
              var newpart = '';
              for (var j = 0, k = part.length; j < k; j++) {
                if (part.charCodeAt(j) > 127) {
                  // we replace non-ASCII char with a temporary placeholder
                  // we need this to make sure size of hostname is not
                  // broken by replacing non-ASCII by nothing
                  newpart += 'x';
                } else {
                  newpart += part[j];
                }
              }
              // we test again with ASCII char only
              if (!newpart.match(hostnamePartPattern)) {
                var validParts = hostparts.slice(0, i);
                var notHost = hostparts.slice(i + 1);
                var bit = part.match(hostnamePartStart);
                if (bit) {
                  validParts.push(bit[1]);
                  notHost.unshift(bit[2]);
                }
                if (notHost.length) {
                  rest = '/' + notHost.join('.') + rest;
                }
                this.hostname = validParts.join('.');
                break;
              }
            }
          }
        }
  
        if (this.hostname.length > hostnameMaxLen) {
          this.hostname = '';
        } else {
          // hostnames are always lower case.
          this.hostname = this.hostname.toLowerCase();
        }
  
        if (!ipv6Hostname) {
          // IDNA Support: Returns a punycoded representation of "domain".
          // It only converts parts of the domain name that
          // have non-ASCII characters, i.e. it doesn't matter if
          // you call it with a domain that already is ASCII-only.
          this.hostname = punycode.toASCII(this.hostname);
        }
  
        var p = this.port ? ':' + this.port : '';
        var h = this.hostname || '';
        this.host = h + p;
        this.href += this.host;
  
        // strip [ and ] from the hostname
        // the host field still retains them, though
        if (ipv6Hostname) {
          this.hostname = this.hostname.substr(1, this.hostname.length - 2);
          if (rest[0] !== '/') {
            rest = '/' + rest;
          }
        }
      }
  
      // now rest is set to the post-host stuff.
      // chop off any delim chars.
      if (!unsafeProtocol[lowerProto]) {
  
        // First, make 100% sure that any "autoEscape" chars get
        // escaped, even if encodeURIComponent doesn't think they
        // need to be.
        for (var i = 0, l = autoEscape.length; i < l; i++) {
          var ae = autoEscape[i];
          if (rest.indexOf(ae) === -1)
            { continue; }
          var esc = encodeURIComponent(ae);
          if (esc === ae) {
            esc = escape(ae);
          }
          rest = rest.split(ae).join(esc);
        }
      }
  
  
      // chop off from the tail first.
      var hash = rest.indexOf('#');
      if (hash !== -1) {
        // got a fragment string.
        this.hash = rest.substr(hash);
        rest = rest.slice(0, hash);
      }
      var qm = rest.indexOf('?');
      if (qm !== -1) {
        this.search = rest.substr(qm);
        this.query = rest.substr(qm + 1);
        if (parseQueryString) {
          this.query = querystring.parse(this.query);
        }
        rest = rest.slice(0, qm);
      } else if (parseQueryString) {
        // no query string, but parseQueryString still requested
        this.search = '';
        this.query = {};
      }
      if (rest) { this.pathname = rest; }
      if (slashedProtocol[lowerProto] &&
          this.hostname && !this.pathname) {
        this.pathname = '/';
      }
  
      //to support http.request
      if (this.pathname || this.search) {
        var p = this.pathname || '';
        var s = this.search || '';
        this.path = p + s;
      }
  
      // finally, reconstruct the href based on what has been validated.
      this.href = this.format();
      return this;
    };
  
    // format a parsed object into a url string
    function urlFormat(obj) {
      // ensure it's an object, and not a string url.
      // If it's an obj, this is a no-op.
      // this way, you can call url_format() on strings
      // to clean up potentially wonky urls.
      if (util.isString(obj)) { obj = urlParse(obj); }
      if (!(obj instanceof Url)) { return Url.prototype.format.call(obj); }
      return obj.format();
    }
  
    Url.prototype.format = function() {
      var auth = this.auth || '';
      if (auth) {
        auth = encodeURIComponent(auth);
        auth = auth.replace(/%3A/i, ':');
        auth += '@';
      }
  
      var protocol = this.protocol || '',
          pathname = this.pathname || '',
          hash = this.hash || '',
          host = false,
          query = '';
  
      if (this.host) {
        host = auth + this.host;
      } else if (this.hostname) {
        host = auth + (this.hostname.indexOf(':') === -1 ?
            this.hostname :
            '[' + this.hostname + ']');
        if (this.port) {
          host += ':' + this.port;
        }
      }
  
      if (this.query &&
          util.isObject(this.query) &&
          Object.keys(this.query).length) {
        query = querystring.stringify(this.query);
      }
  
      var search = this.search || (query && ('?' + query)) || '';
  
      if (protocol && protocol.substr(-1) !== ':') { protocol += ':'; }
  
      // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
      // unless they had them to begin with.
      if (this.slashes ||
          (!protocol || slashedProtocol[protocol]) && host !== false) {
        host = '//' + (host || '');
        if (pathname && pathname.charAt(0) !== '/') { pathname = '/' + pathname; }
      } else if (!host) {
        host = '';
      }
  
      if (hash && hash.charAt(0) !== '#') { hash = '#' + hash; }
      if (search && search.charAt(0) !== '?') { search = '?' + search; }
  
      pathname = pathname.replace(/[?#]/g, function(match) {
        return encodeURIComponent(match);
      });
      search = search.replace('#', '%23');
  
      return protocol + host + pathname + search + hash;
    };
  
    function urlResolve(source, relative) {
      return urlParse(source, false, true).resolve(relative);
    }
  
    Url.prototype.resolve = function(relative) {
      return this.resolveObject(urlParse(relative, false, true)).format();
    };
  
    function urlResolveObject(source, relative) {
      if (!source) { return relative; }
      return urlParse(source, false, true).resolveObject(relative);
    }
  
    Url.prototype.resolveObject = function(relative) {
      if (util.isString(relative)) {
        var rel = new Url();
        rel.parse(relative, false, true);
        relative = rel;
      }
  
      var result = new Url();
      var tkeys = Object.keys(this);
      for (var tk = 0; tk < tkeys.length; tk++) {
        var tkey = tkeys[tk];
        result[tkey] = this[tkey];
      }
  
      // hash is always overridden, no matter what.
      // even href="" will remove it.
      result.hash = relative.hash;
  
      // if the relative url is empty, then there's nothing left to do here.
      if (relative.href === '') {
        result.href = result.format();
        return result;
      }
  
      // hrefs like //foo/bar always cut to the protocol.
      if (relative.slashes && !relative.protocol) {
        // take everything except the protocol from relative
        var rkeys = Object.keys(relative);
        for (var rk = 0; rk < rkeys.length; rk++) {
          var rkey = rkeys[rk];
          if (rkey !== 'protocol')
            { result[rkey] = relative[rkey]; }
        }
  
        //urlParse appends trailing / to urls like http://www.example.com
        if (slashedProtocol[result.protocol] &&
            result.hostname && !result.pathname) {
          result.path = result.pathname = '/';
        }
  
        result.href = result.format();
        return result;
      }
  
      if (relative.protocol && relative.protocol !== result.protocol) {
        // if it's a known url protocol, then changing
        // the protocol does weird things
        // first, if it's not file:, then we MUST have a host,
        // and if there was a path
        // to begin with, then we MUST have a path.
        // if it is file:, then the host is dropped,
        // because that's known to be hostless.
        // anything else is assumed to be absolute.
        if (!slashedProtocol[relative.protocol]) {
          var keys = Object.keys(relative);
          for (var v = 0; v < keys.length; v++) {
            var k = keys[v];
            result[k] = relative[k];
          }
          result.href = result.format();
          return result;
        }
  
        result.protocol = relative.protocol;
        if (!relative.host && !hostlessProtocol[relative.protocol]) {
          var relPath = (relative.pathname || '').split('/');
          while (relPath.length && !(relative.host = relPath.shift())){ ; }
          if (!relative.host) { relative.host = ''; }
          if (!relative.hostname) { relative.hostname = ''; }
          if (relPath[0] !== '') { relPath.unshift(''); }
          if (relPath.length < 2) { relPath.unshift(''); }
          result.pathname = relPath.join('/');
        } else {
          result.pathname = relative.pathname;
        }
        result.search = relative.search;
        result.query = relative.query;
        result.host = relative.host || '';
        result.auth = relative.auth;
        result.hostname = relative.hostname || relative.host;
        result.port = relative.port;
        // to support http.request
        if (result.pathname || result.search) {
          var p = result.pathname || '';
          var s = result.search || '';
          result.path = p + s;
        }
        result.slashes = result.slashes || relative.slashes;
        result.href = result.format();
        return result;
      }
  
      var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
          isRelAbs = (
              relative.host ||
              relative.pathname && relative.pathname.charAt(0) === '/'
          ),
          mustEndAbs = (isRelAbs || isSourceAbs ||
                        (result.host && relative.pathname)),
          removeAllDots = mustEndAbs,
          srcPath = result.pathname && result.pathname.split('/') || [],
          relPath = relative.pathname && relative.pathname.split('/') || [],
          psychotic = result.protocol && !slashedProtocol[result.protocol];
  
      // if the url is a non-slashed url, then relative
      // links like ../.. should be able
      // to crawl up to the hostname, as well.  This is strange.
      // result.protocol has already been set by now.
      // Later on, put the first path part into the host field.
      if (psychotic) {
        result.hostname = '';
        result.port = null;
        if (result.host) {
          if (srcPath[0] === '') { srcPath[0] = result.host; }
          else { srcPath.unshift(result.host); }
        }
        result.host = '';
        if (relative.protocol) {
          relative.hostname = null;
          relative.port = null;
          if (relative.host) {
            if (relPath[0] === '') { relPath[0] = relative.host; }
            else { relPath.unshift(relative.host); }
          }
          relative.host = null;
        }
        mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
      }
  
      if (isRelAbs) {
        // it's absolute.
        result.host = (relative.host || relative.host === '') ?
                      relative.host : result.host;
        result.hostname = (relative.hostname || relative.hostname === '') ?
                          relative.hostname : result.hostname;
        result.search = relative.search;
        result.query = relative.query;
        srcPath = relPath;
        // fall through to the dot-handling below.
      } else if (relPath.length) {
        // it's relative
        // throw away the existing file, and take the new path instead.
        if (!srcPath) { srcPath = []; }
        srcPath.pop();
        srcPath = srcPath.concat(relPath);
        result.search = relative.search;
        result.query = relative.query;
      } else if (!util.isNullOrUndefined(relative.search)) {
        // just pull out the search.
        // like href='?foo'.
        // Put this after the other two cases because it simplifies the booleans
        if (psychotic) {
          result.hostname = result.host = srcPath.shift();
          //occationaly the auth can get stuck only in host
          //this especially happens in cases like
          //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
          var authInHost = result.host && result.host.indexOf('@') > 0 ?
                           result.host.split('@') : false;
          if (authInHost) {
            result.auth = authInHost.shift();
            result.host = result.hostname = authInHost.shift();
          }
        }
        result.search = relative.search;
        result.query = relative.query;
        //to support http.request
        if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
          result.path = (result.pathname ? result.pathname : '') +
                        (result.search ? result.search : '');
        }
        result.href = result.format();
        return result;
      }
  
      if (!srcPath.length) {
        // no path at all.  easy.
        // we've already handled the other stuff above.
        result.pathname = null;
        //to support http.request
        if (result.search) {
          result.path = '/' + result.search;
        } else {
          result.path = null;
        }
        result.href = result.format();
        return result;
      }
  
      // if a url ENDs in . or .., then it must get a trailing slash.
      // however, if it ends in anything else non-slashy,
      // then it must NOT get a trailing slash.
      var last = srcPath.slice(-1)[0];
      var hasTrailingSlash = (
          (result.host || relative.host || srcPath.length > 1) &&
          (last === '.' || last === '..') || last === '');
  
      // strip single dots, resolve double dots to parent dir
      // if the path tries to go above the root, `up` ends up > 0
      var up = 0;
      for (var i = srcPath.length; i >= 0; i--) {
        last = srcPath[i];
        if (last === '.') {
          srcPath.splice(i, 1);
        } else if (last === '..') {
          srcPath.splice(i, 1);
          up++;
        } else if (up) {
          srcPath.splice(i, 1);
          up--;
        }
      }
  
      // if the path is allowed to go above the root, restore leading ..s
      if (!mustEndAbs && !removeAllDots) {
        for (; up--; up) {
          srcPath.unshift('..');
        }
      }
  
      if (mustEndAbs && srcPath[0] !== '' &&
          (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
        srcPath.unshift('');
      }
  
      if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
        srcPath.push('');
      }
  
      var isAbsolute = srcPath[0] === '' ||
          (srcPath[0] && srcPath[0].charAt(0) === '/');
  
      // put the host back
      if (psychotic) {
        result.hostname = result.host = isAbsolute ? '' :
                                        srcPath.length ? srcPath.shift() : '';
        //occationaly the auth can get stuck only in host
        //this especially happens in cases like
        //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
        var authInHost = result.host && result.host.indexOf('@') > 0 ?
                         result.host.split('@') : false;
        if (authInHost) {
          result.auth = authInHost.shift();
          result.host = result.hostname = authInHost.shift();
        }
      }
  
      mustEndAbs = mustEndAbs || (result.host && srcPath.length);
  
      if (mustEndAbs && !isAbsolute) {
        srcPath.unshift('');
      }
  
      if (!srcPath.length) {
        result.pathname = null;
        result.path = null;
      } else {
        result.pathname = srcPath.join('/');
      }
  
      //to support request.http
      if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
        result.path = (result.pathname ? result.pathname : '') +
                      (result.search ? result.search : '');
      }
      result.auth = relative.auth || result.auth;
      result.slashes = result.slashes || relative.slashes;
      result.href = result.format();
      return result;
    };
  
    Url.prototype.parseHost = function() {
      var host = this.host;
      var port = portPattern.exec(host);
      if (port) {
        port = port[0];
        if (port !== ':') {
          this.port = port.substr(1);
        }
        host = host.substr(0, host.length - port.length);
      }
      if (host) { this.hostname = host; }
    };
  
    var url = {
        parse: parse,
        resolve: resolve$1,
        resolveObject: resolveObject,
        format: format,
        Url: Url_1
    };
  
    /*!
     * @pixi/constants - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/constants is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
    /**
     * Different types of environments for WebGL.
     *
     * @static
     * @memberof PIXI
     * @name ENV
     * @enum {number}
     * @property {number} WEBGL_LEGACY - Used for older v1 WebGL devices. PixiJS will aim to ensure compatibility
     *  with older / less advanced devices. If you experience unexplained flickering prefer this environment.
     * @property {number} WEBGL - Version 1 of WebGL
     * @property {number} WEBGL2 - Version 2 of WebGL
     */
  
    (function (ENV) {
        ENV[ENV["WEBGL_LEGACY"] = 0] = "WEBGL_LEGACY";
        ENV[ENV["WEBGL"] = 1] = "WEBGL";
        ENV[ENV["WEBGL2"] = 2] = "WEBGL2";
    })(exports.ENV || (exports.ENV = {}));
    /**
     * Constant to identify the Renderer Type.
     *
     * @static
     * @memberof PIXI
     * @name RENDERER_TYPE
     * @enum {number}
     * @property {number} UNKNOWN - Unknown render type.
     * @property {number} WEBGL - WebGL render type.
     * @property {number} CANVAS - Canvas render type.
     */
  
    (function (RENDERER_TYPE) {
        RENDERER_TYPE[RENDERER_TYPE["UNKNOWN"] = 0] = "UNKNOWN";
        RENDERER_TYPE[RENDERER_TYPE["WEBGL"] = 1] = "WEBGL";
        RENDERER_TYPE[RENDERER_TYPE["CANVAS"] = 2] = "CANVAS";
    })(exports.RENDERER_TYPE || (exports.RENDERER_TYPE = {}));
    /**
     * Bitwise OR of masks that indicate the buffers to be cleared.
     *
     * @static
     * @memberof PIXI
     * @name BUFFER_BITS
     * @enum {number}
     * @property {number} COLOR - Indicates the buffers currently enabled for color writing.
     * @property {number} DEPTH - Indicates the depth buffer.
     * @property {number} STENCIL - Indicates the stencil buffer.
     */
  
    (function (BUFFER_BITS) {
        BUFFER_BITS[BUFFER_BITS["COLOR"] = 16384] = "COLOR";
        BUFFER_BITS[BUFFER_BITS["DEPTH"] = 256] = "DEPTH";
        BUFFER_BITS[BUFFER_BITS["STENCIL"] = 1024] = "STENCIL";
    })(exports.BUFFER_BITS || (exports.BUFFER_BITS = {}));
    /**
     * Various blend modes supported by PIXI.
     *
     * IMPORTANT - The WebGL renderer only supports the NORMAL, ADD, MULTIPLY and SCREEN blend modes.
     * Anything else will silently act like NORMAL.
     *
     * @memberof PIXI
     * @name BLEND_MODES
     * @enum {number}
     * @property {number} NORMAL
     * @property {number} ADD
     * @property {number} MULTIPLY
     * @property {number} SCREEN
     * @property {number} OVERLAY
     * @property {number} DARKEN
     * @property {number} LIGHTEN
     * @property {number} COLOR_DODGE
     * @property {number} COLOR_BURN
     * @property {number} HARD_LIGHT
     * @property {number} SOFT_LIGHT
     * @property {number} DIFFERENCE
     * @property {number} EXCLUSION
     * @property {number} HUE
     * @property {number} SATURATION
     * @property {number} COLOR
     * @property {number} LUMINOSITY
     * @property {number} NORMAL_NPM
     * @property {number} ADD_NPM
     * @property {number} SCREEN_NPM
     * @property {number} NONE
     * @property {number} SRC_IN
     * @property {number} SRC_OUT
     * @property {number} SRC_ATOP
     * @property {number} DST_OVER
     * @property {number} DST_IN
     * @property {number} DST_OUT
     * @property {number} DST_ATOP
     * @property {number} SUBTRACT
     * @property {number} SRC_OVER
     * @property {number} ERASE
     * @property {number} XOR
     */
  
    (function (BLEND_MODES) {
        BLEND_MODES[BLEND_MODES["NORMAL"] = 0] = "NORMAL";
        BLEND_MODES[BLEND_MODES["ADD"] = 1] = "ADD";
        BLEND_MODES[BLEND_MODES["MULTIPLY"] = 2] = "MULTIPLY";
        BLEND_MODES[BLEND_MODES["SCREEN"] = 3] = "SCREEN";
        BLEND_MODES[BLEND_MODES["OVERLAY"] = 4] = "OVERLAY";
        BLEND_MODES[BLEND_MODES["DARKEN"] = 5] = "DARKEN";
        BLEND_MODES[BLEND_MODES["LIGHTEN"] = 6] = "LIGHTEN";
        BLEND_MODES[BLEND_MODES["COLOR_DODGE"] = 7] = "COLOR_DODGE";
        BLEND_MODES[BLEND_MODES["COLOR_BURN"] = 8] = "COLOR_BURN";
        BLEND_MODES[BLEND_MODES["HARD_LIGHT"] = 9] = "HARD_LIGHT";
        BLEND_MODES[BLEND_MODES["SOFT_LIGHT"] = 10] = "SOFT_LIGHT";
        BLEND_MODES[BLEND_MODES["DIFFERENCE"] = 11] = "DIFFERENCE";
        BLEND_MODES[BLEND_MODES["EXCLUSION"] = 12] = "EXCLUSION";
        BLEND_MODES[BLEND_MODES["HUE"] = 13] = "HUE";
        BLEND_MODES[BLEND_MODES["SATURATION"] = 14] = "SATURATION";
        BLEND_MODES[BLEND_MODES["COLOR"] = 15] = "COLOR";
        BLEND_MODES[BLEND_MODES["LUMINOSITY"] = 16] = "LUMINOSITY";
        BLEND_MODES[BLEND_MODES["NORMAL_NPM"] = 17] = "NORMAL_NPM";
        BLEND_MODES[BLEND_MODES["ADD_NPM"] = 18] = "ADD_NPM";
        BLEND_MODES[BLEND_MODES["SCREEN_NPM"] = 19] = "SCREEN_NPM";
        BLEND_MODES[BLEND_MODES["NONE"] = 20] = "NONE";
        BLEND_MODES[BLEND_MODES["SRC_OVER"] = 0] = "SRC_OVER";
        BLEND_MODES[BLEND_MODES["SRC_IN"] = 21] = "SRC_IN";
        BLEND_MODES[BLEND_MODES["SRC_OUT"] = 22] = "SRC_OUT";
        BLEND_MODES[BLEND_MODES["SRC_ATOP"] = 23] = "SRC_ATOP";
        BLEND_MODES[BLEND_MODES["DST_OVER"] = 24] = "DST_OVER";
        BLEND_MODES[BLEND_MODES["DST_IN"] = 25] = "DST_IN";
        BLEND_MODES[BLEND_MODES["DST_OUT"] = 26] = "DST_OUT";
        BLEND_MODES[BLEND_MODES["DST_ATOP"] = 27] = "DST_ATOP";
        BLEND_MODES[BLEND_MODES["ERASE"] = 26] = "ERASE";
        BLEND_MODES[BLEND_MODES["SUBTRACT"] = 28] = "SUBTRACT";
        BLEND_MODES[BLEND_MODES["XOR"] = 29] = "XOR";
    })(exports.BLEND_MODES || (exports.BLEND_MODES = {}));
    /**
     * Various webgl draw modes. These can be used to specify which GL drawMode to use
     * under certain situations and renderers.
     *
     * @memberof PIXI
     * @static
     * @name DRAW_MODES
     * @enum {number}
     * @property {number} POINTS
     * @property {number} LINES
     * @property {number} LINE_LOOP
     * @property {number} LINE_STRIP
     * @property {number} TRIANGLES
     * @property {number} TRIANGLE_STRIP
     * @property {number} TRIANGLE_FAN
     */
  
    (function (DRAW_MODES) {
        DRAW_MODES[DRAW_MODES["POINTS"] = 0] = "POINTS";
        DRAW_MODES[DRAW_MODES["LINES"] = 1] = "LINES";
        DRAW_MODES[DRAW_MODES["LINE_LOOP"] = 2] = "LINE_LOOP";
        DRAW_MODES[DRAW_MODES["LINE_STRIP"] = 3] = "LINE_STRIP";
        DRAW_MODES[DRAW_MODES["TRIANGLES"] = 4] = "TRIANGLES";
        DRAW_MODES[DRAW_MODES["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
        DRAW_MODES[DRAW_MODES["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
    })(exports.DRAW_MODES || (exports.DRAW_MODES = {}));
    /**
     * Various GL texture/resources formats.
     *
     * @memberof PIXI
     * @static
     * @name FORMATS
     * @enum {number}
     * @property {number} RGBA=6408
     * @property {number} RGB=6407
     * @property {number} RG=33319
     * @property {number} RED=6403
     * @property {number} RGBA_INTEGER=36249
     * @property {number} RGB_INTEGER=36248
     * @property {number} RG_INTEGER=33320
     * @property {number} RED_INTEGER=36244
     * @property {number} ALPHA=6406
     * @property {number} LUMINANCE=6409
     * @property {number} LUMINANCE_ALPHA=6410
     * @property {number} DEPTH_COMPONENT=6402
     * @property {number} DEPTH_STENCIL=34041
     */
  
    (function (FORMATS) {
        FORMATS[FORMATS["RGBA"] = 6408] = "RGBA";
        FORMATS[FORMATS["RGB"] = 6407] = "RGB";
        FORMATS[FORMATS["RG"] = 33319] = "RG";
        FORMATS[FORMATS["RED"] = 6403] = "RED";
        FORMATS[FORMATS["RGBA_INTEGER"] = 36249] = "RGBA_INTEGER";
        FORMATS[FORMATS["RGB_INTEGER"] = 36248] = "RGB_INTEGER";
        FORMATS[FORMATS["RG_INTEGER"] = 33320] = "RG_INTEGER";
        FORMATS[FORMATS["RED_INTEGER"] = 36244] = "RED_INTEGER";
        FORMATS[FORMATS["ALPHA"] = 6406] = "ALPHA";
        FORMATS[FORMATS["LUMINANCE"] = 6409] = "LUMINANCE";
        FORMATS[FORMATS["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
        FORMATS[FORMATS["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
        FORMATS[FORMATS["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
    })(exports.FORMATS || (exports.FORMATS = {}));
    /**
     * Various GL target types.
     *
     * @memberof PIXI
     * @static
     * @name TARGETS
     * @enum {number}
     * @property {number} TEXTURE_2D=3553
     * @property {number} TEXTURE_CUBE_MAP=34067
     * @property {number} TEXTURE_2D_ARRAY=35866
     * @property {number} TEXTURE_CUBE_MAP_POSITIVE_X=34069
     * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_X=34070
     * @property {number} TEXTURE_CUBE_MAP_POSITIVE_Y=34071
     * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_Y=34072
     * @property {number} TEXTURE_CUBE_MAP_POSITIVE_Z=34073
     * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_Z=34074
     */
  
    (function (TARGETS) {
        TARGETS[TARGETS["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
        TARGETS[TARGETS["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
    })(exports.TARGETS || (exports.TARGETS = {}));
    /**
     * Various GL data format types.
     *
     * @memberof PIXI
     * @static
     * @name TYPES
     * @enum {number}
     * @property {number} UNSIGNED_BYTE=5121
     * @property {number} UNSIGNED_SHORT=5123
     * @property {number} UNSIGNED_SHORT_5_6_5=33635
     * @property {number} UNSIGNED_SHORT_4_4_4_4=32819
     * @property {number} UNSIGNED_SHORT_5_5_5_1=32820
     * @property {number} UNSIGNED_INT=5125
     * @property {number} UNSIGNED_INT_10F_11F_11F_REV=35899
     * @property {number} UNSIGNED_INT_2_10_10_10_REV=33640
     * @property {number} UNSIGNED_INT_24_8=34042
     * @property {number} UNSIGNED_INT_5_9_9_9_REV=35902
     * @property {number} BYTE=5120
     * @property {number} SHORT=5122
     * @property {number} INT=5124
     * @property {number} FLOAT=5126
     * @property {number} FLOAT_32_UNSIGNED_INT_24_8_REV=36269
     * @property {number} HALF_FLOAT=36193
     */
  
    (function (TYPES) {
        TYPES[TYPES["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
        TYPES[TYPES["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
        TYPES[TYPES["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
        TYPES[TYPES["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
        TYPES[TYPES["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
        TYPES[TYPES["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
        TYPES[TYPES["UNSIGNED_INT_10F_11F_11F_REV"] = 35899] = "UNSIGNED_INT_10F_11F_11F_REV";
        TYPES[TYPES["UNSIGNED_INT_2_10_10_10_REV"] = 33640] = "UNSIGNED_INT_2_10_10_10_REV";
        TYPES[TYPES["UNSIGNED_INT_24_8"] = 34042] = "UNSIGNED_INT_24_8";
        TYPES[TYPES["UNSIGNED_INT_5_9_9_9_REV"] = 35902] = "UNSIGNED_INT_5_9_9_9_REV";
        TYPES[TYPES["BYTE"] = 5120] = "BYTE";
        TYPES[TYPES["SHORT"] = 5122] = "SHORT";
        TYPES[TYPES["INT"] = 5124] = "INT";
        TYPES[TYPES["FLOAT"] = 5126] = "FLOAT";
        TYPES[TYPES["FLOAT_32_UNSIGNED_INT_24_8_REV"] = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV";
        TYPES[TYPES["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
    })(exports.TYPES || (exports.TYPES = {}));
    /**
     * Various sampler types. Correspond to `sampler`, `isampler`, `usampler` GLSL types respectively.
     * WebGL1 works only with FLOAT.
     *
     * @memberof PIXI
     * @static
     * @name SAMPLER_TYPES
     * @enum {number}
     * @property {number} FLOAT=0
     * @property {number} INT=1
     * @property {number} UINT=2
     */
  
    (function (SAMPLER_TYPES) {
        SAMPLER_TYPES[SAMPLER_TYPES["FLOAT"] = 0] = "FLOAT";
        SAMPLER_TYPES[SAMPLER_TYPES["INT"] = 1] = "INT";
        SAMPLER_TYPES[SAMPLER_TYPES["UINT"] = 2] = "UINT";
    })(exports.SAMPLER_TYPES || (exports.SAMPLER_TYPES = {}));
    /**
     * The scale modes that are supported by pixi.
     *
     * The {@link PIXI.settings.SCALE_MODE} scale mode affects the default scaling mode of future operations.
     * It can be re-assigned to either LINEAR or NEAREST, depending upon suitability.
     *
     * @memberof PIXI
     * @static
     * @name SCALE_MODES
     * @enum {number}
     * @property {number} LINEAR Smooth scaling
     * @property {number} NEAREST Pixelating scaling
     */
  
    (function (SCALE_MODES) {
        SCALE_MODES[SCALE_MODES["NEAREST"] = 0] = "NEAREST";
        SCALE_MODES[SCALE_MODES["LINEAR"] = 1] = "LINEAR";
    })(exports.SCALE_MODES || (exports.SCALE_MODES = {}));
    /**
     * The wrap modes that are supported by pixi.
     *
     * The {@link PIXI.settings.WRAP_MODE} wrap mode affects the default wrapping mode of future operations.
     * It can be re-assigned to either CLAMP or REPEAT, depending upon suitability.
     * If the texture is non power of two then clamp will be used regardless as WebGL can
     * only use REPEAT if the texture is po2.
     *
     * This property only affects WebGL.
     *
     * @name WRAP_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} CLAMP - The textures uvs are clamped
     * @property {number} REPEAT - The texture uvs tile and repeat
     * @property {number} MIRRORED_REPEAT - The texture uvs tile and repeat with mirroring
     */
  
    (function (WRAP_MODES) {
        WRAP_MODES[WRAP_MODES["CLAMP"] = 33071] = "CLAMP";
        WRAP_MODES[WRAP_MODES["REPEAT"] = 10497] = "REPEAT";
        WRAP_MODES[WRAP_MODES["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
    })(exports.WRAP_MODES || (exports.WRAP_MODES = {}));
    /**
     * Mipmap filtering modes that are supported by pixi.
     *
     * The {@link PIXI.settings.MIPMAP_TEXTURES} affects default texture filtering.
     * Mipmaps are generated for a baseTexture if its `mipmap` field is `ON`,
     * or its `POW2` and texture dimensions are powers of 2.
     * Due to platform restriction, `ON` option will work like `POW2` for webgl-1.
     *
     * This property only affects WebGL.
     *
     * @name MIPMAP_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} OFF - No mipmaps
     * @property {number} POW2 - Generate mipmaps if texture dimensions are pow2
     * @property {number} ON - Always generate mipmaps
     * @property {number} ON_MANUAL - Use mipmaps, but do not auto-generate them; this is used with a resource
     *   that supports buffering each level-of-detail.
     */
  
    (function (MIPMAP_MODES) {
        MIPMAP_MODES[MIPMAP_MODES["OFF"] = 0] = "OFF";
        MIPMAP_MODES[MIPMAP_MODES["POW2"] = 1] = "POW2";
        MIPMAP_MODES[MIPMAP_MODES["ON"] = 2] = "ON";
        MIPMAP_MODES[MIPMAP_MODES["ON_MANUAL"] = 3] = "ON_MANUAL";
    })(exports.MIPMAP_MODES || (exports.MIPMAP_MODES = {}));
    /**
     * How to treat textures with premultiplied alpha
     *
     * @name ALPHA_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} NO_PREMULTIPLIED_ALPHA - Source is not premultiplied, leave it like that.
     *  Option for compressed and data textures that are created from typed arrays.
     * @property {number} PREMULTIPLY_ON_UPLOAD - Source is not premultiplied, premultiply on upload.
     *  Default option, used for all loaded images.
     * @property {number} PREMULTIPLIED_ALPHA - Source is already premultiplied
     *  Example: spine atlases with `_pma` suffix.
     * @property {number} NPM - Alias for NO_PREMULTIPLIED_ALPHA.
     * @property {number} UNPACK - Default option, alias for PREMULTIPLY_ON_UPLOAD.
     * @property {number} PMA - Alias for PREMULTIPLIED_ALPHA.
     */
  
    (function (ALPHA_MODES) {
        ALPHA_MODES[ALPHA_MODES["NPM"] = 0] = "NPM";
        ALPHA_MODES[ALPHA_MODES["UNPACK"] = 1] = "UNPACK";
        ALPHA_MODES[ALPHA_MODES["PMA"] = 2] = "PMA";
        ALPHA_MODES[ALPHA_MODES["NO_PREMULTIPLIED_ALPHA"] = 0] = "NO_PREMULTIPLIED_ALPHA";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ON_UPLOAD"] = 1] = "PREMULTIPLY_ON_UPLOAD";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ALPHA"] = 2] = "PREMULTIPLY_ALPHA";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLIED_ALPHA"] = 2] = "PREMULTIPLIED_ALPHA";
    })(exports.ALPHA_MODES || (exports.ALPHA_MODES = {}));
    /**
     * Configure whether filter textures are cleared after binding.
     *
     * Filter textures need not be cleared if the filter does not use pixel blending. {@link CLEAR_MODES.BLIT} will detect
     * this and skip clearing as an optimization.
     *
     * @name CLEAR_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} BLEND - Do not clear the filter texture. The filter's output will blend on top of the output texture.
     * @property {number} CLEAR - Always clear the filter texture.
     * @property {number} BLIT - Clear only if {@link FilterSystem.forceClear} is set or if the filter uses pixel blending.
     * @property {number} NO - Alias for BLEND, same as `false` in earlier versions
     * @property {number} YES - Alias for CLEAR, same as `true` in earlier versions
     * @property {number} AUTO - Alias for BLIT
     */
  
    (function (CLEAR_MODES) {
        CLEAR_MODES[CLEAR_MODES["NO"] = 0] = "NO";
        CLEAR_MODES[CLEAR_MODES["YES"] = 1] = "YES";
        CLEAR_MODES[CLEAR_MODES["AUTO"] = 2] = "AUTO";
        CLEAR_MODES[CLEAR_MODES["BLEND"] = 0] = "BLEND";
        CLEAR_MODES[CLEAR_MODES["CLEAR"] = 1] = "CLEAR";
        CLEAR_MODES[CLEAR_MODES["BLIT"] = 2] = "BLIT";
    })(exports.CLEAR_MODES || (exports.CLEAR_MODES = {}));
    /**
     * The gc modes that are supported by pixi.
     *
     * The {@link PIXI.settings.GC_MODE} Garbage Collection mode for PixiJS textures is AUTO
     * If set to GC_MODE, the renderer will occasionally check textures usage. If they are not
     * used for a specified period of time they will be removed from the GPU. They will of course
     * be uploaded again when they are required. This is a silent behind the scenes process that
     * should ensure that the GPU does not  get filled up.
     *
     * Handy for mobile devices!
     * This property only affects WebGL.
     *
     * @name GC_MODES
     * @enum {number}
     * @static
     * @memberof PIXI
     * @property {number} AUTO - Garbage collection will happen periodically automatically
     * @property {number} MANUAL - Garbage collection will need to be called manually
     */
  
    (function (GC_MODES) {
        GC_MODES[GC_MODES["AUTO"] = 0] = "AUTO";
        GC_MODES[GC_MODES["MANUAL"] = 1] = "MANUAL";
    })(exports.GC_MODES || (exports.GC_MODES = {}));
    /**
     * Constants that specify float precision in shaders.
     *
     * @name PRECISION
     * @memberof PIXI
     * @constant
     * @static
     * @enum {string}
     * @property {string} LOW='lowp'
     * @property {string} MEDIUM='mediump'
     * @property {string} HIGH='highp'
     */
  
    (function (PRECISION) {
        PRECISION["LOW"] = "lowp";
        PRECISION["MEDIUM"] = "mediump";
        PRECISION["HIGH"] = "highp";
    })(exports.PRECISION || (exports.PRECISION = {}));
    /**
     * Constants for mask implementations.
     * We use `type` suffix because it leads to very different behaviours
     *
     * @name MASK_TYPES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} NONE - Mask is ignored
     * @property {number} SCISSOR - Scissor mask, rectangle on screen, cheap
     * @property {number} STENCIL - Stencil mask, 1-bit, medium, works only if renderer supports stencil
     * @property {number} SPRITE - Mask that uses SpriteMaskFilter, uses temporary RenderTexture
     */
  
    (function (MASK_TYPES) {
        MASK_TYPES[MASK_TYPES["NONE"] = 0] = "NONE";
        MASK_TYPES[MASK_TYPES["SCISSOR"] = 1] = "SCISSOR";
        MASK_TYPES[MASK_TYPES["STENCIL"] = 2] = "STENCIL";
        MASK_TYPES[MASK_TYPES["SPRITE"] = 3] = "SPRITE";
    })(exports.MASK_TYPES || (exports.MASK_TYPES = {}));
    /**
     * Constants for multi-sampling antialiasing.
     *
     * @see PIXI.Framebuffer#multisample
     *
     * @name MSAA_QUALITY
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} NONE - No multisampling for this renderTexture
     * @property {number} LOW - Try 2 samples
     * @property {number} MEDIUM - Try 4 samples
     * @property {number} HIGH - Try 8 samples
     */
  
    (function (MSAA_QUALITY) {
        MSAA_QUALITY[MSAA_QUALITY["NONE"] = 0] = "NONE";
        MSAA_QUALITY[MSAA_QUALITY["LOW"] = 2] = "LOW";
        MSAA_QUALITY[MSAA_QUALITY["MEDIUM"] = 4] = "MEDIUM";
        MSAA_QUALITY[MSAA_QUALITY["HIGH"] = 8] = "HIGH";
    })(exports.MSAA_QUALITY || (exports.MSAA_QUALITY = {}));
    /**
     * Constants for various buffer types in Pixi
     *
     * @see PIXI.BUFFER_TYPE
     *
     * @name BUFFER_TYPE
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} ELEMENT_ARRAY_BUFFER - buffer type for using as an index buffer
     * @property {number} ARRAY_BUFFER - buffer type for using attribute data
     * @property {number} UNIFORM_BUFFER - the buffer type is for uniform buffer objects
     */
  
    (function (BUFFER_TYPE) {
        BUFFER_TYPE[BUFFER_TYPE["ELEMENT_ARRAY_BUFFER"] = 34963] = "ELEMENT_ARRAY_BUFFER";
        BUFFER_TYPE[BUFFER_TYPE["ARRAY_BUFFER"] = 34962] = "ARRAY_BUFFER";
        // NOT YET SUPPORTED
        BUFFER_TYPE[BUFFER_TYPE["UNIFORM_BUFFER"] = 35345] = "UNIFORM_BUFFER";
    })(exports.BUFFER_TYPE || (exports.BUFFER_TYPE = {}));
  
    /*!
     * @pixi/utils - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/utils is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
  
    /**
     * This file contains redeclared types for Node `url` and `querystring` modules. These modules
     * don't provide their own typings but instead are a part of the full Node typings. The purpose of
     * this file is to redeclare the required types to avoid having the whole Node types as a
     * dependency.
     */
    var url$1 = {
        parse: parse,
        format: format,
        resolve: resolve$1,
    };
  
    /**
     * The prefix that denotes a URL is for a retina asset.
     *
     * @static
     * @name RETINA_PREFIX
     * @memberof PIXI.settings
     * @type {RegExp}
     * @default /@([0-9\.]+)x/
     * @example `@2x`
     */
    settings.RETINA_PREFIX = /@([0-9\.]+)x/;
    /**
     * Should the `failIfMajorPerformanceCaveat` flag be enabled as a context option used in the `isWebGLSupported` function.
     * If set to true, a WebGL renderer can fail to be created if the browser thinks there could be performance issues when
     * using WebGL.
     *
     * In PixiJS v6 this has changed from true to false by default, to allow WebGL to work in as many scenarios as possible.
     * However, some users may have a poor experience, for example, if a user has a gpu or driver version blacklisted by the
     * browser.
     *
     * If your application requires high performance rendering, you may wish to set this to false.
     * We recommend one of two options if you decide to set this flag to false:
     *
     * 1: Use the `pixi.js-legacy` package, which includes a Canvas renderer as a fallback in case high performance WebGL is
     *    not supported.
     *
     * 2: Call `isWebGLSupported` (which if found in the PIXI.utils package) in your code before attempting to create a PixiJS
     *    renderer, and show an error message to the user if the function returns false, explaining that their device & browser
     *    combination does not support high performance WebGL.
     *    This is a much better strategy than trying to create a PixiJS renderer and finding it then fails.
     *
     * @static
     * @name FAIL_IF_MAJOR_PERFORMANCE_CAVEAT
     * @memberof PIXI.settings
     * @type {boolean}
     * @default false
     */
    settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;
  
    var saidHello = false;
    var VERSION = '6.3.0';
    /**
     * Skips the hello message of renderers that are created after this is run.
     *
     * @function skipHello
     * @memberof PIXI.utils
     */
    function skipHello() {
        saidHello = true;
    }
    /**
     * Logs out the version and renderer information for this running instance of PIXI.
     * If you don't want to see this message you can run `PIXI.utils.skipHello()` before
     * creating your renderer. Keep in mind that doing that will forever make you a jerk face.
     *
     * @static
     * @function sayHello
     * @memberof PIXI.utils
     * @param {string} type - The string renderer type to log.
     */
    function sayHello(type) {
        var _a;
        if (saidHello) {
            return;
        }
        if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
            var args = [
                "\n %c %c %c PixiJS " + VERSION + " - \u2730 " + type + " \u2730  %c  %c  http://www.pixijs.com/  %c %c \u2665%c\u2665%c\u2665 \n\n",
                'background: #ff66a5; padding:5px 0;',
                'background: #ff66a5; padding:5px 0;',
                'color: #ff66a5; background: #030307; padding:5px 0;',
                'background: #ff66a5; padding:5px 0;',
                'background: #ffc3dc; padding:5px 0;',
                'background: #ff66a5; padding:5px 0;',
                'color: #ff2424; background: #fff; padding:5px 0;',
                'color: #ff2424; background: #fff; padding:5px 0;',
                'color: #ff2424; background: #fff; padding:5px 0;' ];
            (_a = globalThis.console).log.apply(_a, args);
        }
        else if (globalThis.console) {
            globalThis.console.log("PixiJS " + VERSION + " - " + type + " - http://www.pixijs.com/");
        }
        saidHello = true;
    }
  
    var supported;
    /**
     * Helper for checking for WebGL support.
     *
     * @memberof PIXI.utils
     * @function isWebGLSupported
     * @return {boolean} Is WebGL supported.
     */
    function isWebGLSupported() {
        if (typeof supported === 'undefined') {
            supported = (function supported() {
                var contextOptions = {
                    stencil: true,
                    failIfMajorPerformanceCaveat: settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT,
                };
                try {
                    if (!globalThis.WebGLRenderingContext) {
                        return false;
                    }
                    var canvas = document.createElement('canvas');
                    var gl = (canvas.getContext('webgl', contextOptions)
                        || canvas.getContext('experimental-webgl', contextOptions));
                    var success = !!(gl && gl.getContextAttributes().stencil);
                    if (gl) {
                        var loseContext = gl.getExtension('WEBGL_lose_context');
                        if (loseContext) {
                            loseContext.loseContext();
                        }
                    }
                    gl = null;
                    return success;
                }
                catch (e) {
                    return false;
                }
            })();
        }
        return supported;
    }
  
    var aliceblue = "#f0f8ff";
    var antiquewhite = "#faebd7";
    var aqua = "#00ffff";
    var aquamarine = "#7fffd4";
    var azure = "#f0ffff";
    var beige = "#f5f5dc";
    var bisque = "#ffe4c4";
    var black = "#000000";
    var blanchedalmond = "#ffebcd";
    var blue = "#0000ff";
    var blueviolet = "#8a2be2";
    var brown = "#a52a2a";
    var burlywood = "#deb887";
    var cadetblue = "#5f9ea0";
    var chartreuse = "#7fff00";
    var chocolate = "#d2691e";
    var coral = "#ff7f50";
    var cornflowerblue = "#6495ed";
    var cornsilk = "#fff8dc";
    var crimson = "#dc143c";
    var cyan = "#00ffff";
    var darkblue = "#00008b";
    var darkcyan = "#008b8b";
    var darkgoldenrod = "#b8860b";
    var darkgray = "#a9a9a9";
    var darkgreen = "#006400";
    var darkgrey = "#a9a9a9";
    var darkkhaki = "#bdb76b";
    var darkmagenta = "#8b008b";
    var darkolivegreen = "#556b2f";
    var darkorange = "#ff8c00";
    var darkorchid = "#9932cc";
    var darkred = "#8b0000";
    var darksalmon = "#e9967a";
    var darkseagreen = "#8fbc8f";
    var darkslateblue = "#483d8b";
    var darkslategray = "#2f4f4f";
    var darkslategrey = "#2f4f4f";
    var darkturquoise = "#00ced1";
    var darkviolet = "#9400d3";
    var deeppink = "#ff1493";
    var deepskyblue = "#00bfff";
    var dimgray = "#696969";
    var dimgrey = "#696969";
    var dodgerblue = "#1e90ff";
    var firebrick = "#b22222";
    var floralwhite = "#fffaf0";
    var forestgreen = "#228b22";
    var fuchsia = "#ff00ff";
    var gainsboro = "#dcdcdc";
    var ghostwhite = "#f8f8ff";
    var goldenrod = "#daa520";
    var gold = "#ffd700";
    var gray = "#808080";
    var green = "#008000";
    var greenyellow = "#adff2f";
    var grey = "#808080";
    var honeydew = "#f0fff0";
    var hotpink = "#ff69b4";
    var indianred = "#cd5c5c";
    var indigo = "#4b0082";
    var ivory = "#fffff0";
    var khaki = "#f0e68c";
    var lavenderblush = "#fff0f5";
    var lavender = "#e6e6fa";
    var lawngreen = "#7cfc00";
    var lemonchiffon = "#fffacd";
    var lightblue = "#add8e6";
    var lightcoral = "#f08080";
    var lightcyan = "#e0ffff";
    var lightgoldenrodyellow = "#fafad2";
    var lightgray = "#d3d3d3";
    var lightgreen = "#90ee90";
    var lightgrey = "#d3d3d3";
    var lightpink = "#ffb6c1";
    var lightsalmon = "#ffa07a";
    var lightseagreen = "#20b2aa";
    var lightskyblue = "#87cefa";
    var lightslategray = "#778899";
    var lightslategrey = "#778899";
    var lightsteelblue = "#b0c4de";
    var lightyellow = "#ffffe0";
    var lime = "#00ff00";
    var limegreen = "#32cd32";
    var linen = "#faf0e6";
    var magenta = "#ff00ff";
    var maroon = "#800000";
    var mediumaquamarine = "#66cdaa";
    var mediumblue = "#0000cd";
    var mediumorchid = "#ba55d3";
    var mediumpurple = "#9370db";
    var mediumseagreen = "#3cb371";
    var mediumslateblue = "#7b68ee";
    var mediumspringgreen = "#00fa9a";
    var mediumturquoise = "#48d1cc";
    var mediumvioletred = "#c71585";
    var midnightblue = "#191970";
    var mintcream = "#f5fffa";
    var mistyrose = "#ffe4e1";
    var moccasin = "#ffe4b5";
    var navajowhite = "#ffdead";
    var navy = "#000080";
    var oldlace = "#fdf5e6";
    var olive = "#808000";
    var olivedrab = "#6b8e23";
    var orange = "#ffa500";
    var orangered = "#ff4500";
    var orchid = "#da70d6";
    var palegoldenrod = "#eee8aa";
    var palegreen = "#98fb98";
    var paleturquoise = "#afeeee";
    var palevioletred = "#db7093";
    var papayawhip = "#ffefd5";
    var peachpuff = "#ffdab9";
    var peru = "#cd853f";
    var pink = "#ffc0cb";
    var plum = "#dda0dd";
    var powderblue = "#b0e0e6";
    var purple = "#800080";
    var rebeccapurple = "#663399";
    var red = "#ff0000";
    var rosybrown = "#bc8f8f";
    var royalblue = "#4169e1";
    var saddlebrown = "#8b4513";
    var salmon = "#fa8072";
    var sandybrown = "#f4a460";
    var seagreen = "#2e8b57";
    var seashell = "#fff5ee";
    var sienna = "#a0522d";
    var silver = "#c0c0c0";
    var skyblue = "#87ceeb";
    var slateblue = "#6a5acd";
    var slategray = "#708090";
    var slategrey = "#708090";
    var snow = "#fffafa";
    var springgreen = "#00ff7f";
    var steelblue = "#4682b4";
    var tan = "#d2b48c";
    var teal = "#008080";
    var thistle = "#d8bfd8";
    var tomato = "#ff6347";
    var turquoise = "#40e0d0";
    var violet = "#ee82ee";
    var wheat = "#f5deb3";
    var white = "#ffffff";
    var whitesmoke = "#f5f5f5";
    var yellow = "#ffff00";
    var yellowgreen = "#9acd32";
    var cssColorNames = {
        aliceblue: aliceblue,
        antiquewhite: antiquewhite,
        aqua: aqua,
        aquamarine: aquamarine,
        azure: azure,
        beige: beige,
        bisque: bisque,
        black: black,
        blanchedalmond: blanchedalmond,
        blue: blue,
        blueviolet: blueviolet,
        brown: brown,
        burlywood: burlywood,
        cadetblue: cadetblue,
        chartreuse: chartreuse,
        chocolate: chocolate,
        coral: coral,
        cornflowerblue: cornflowerblue,
        cornsilk: cornsilk,
        crimson: crimson,
        cyan: cyan,
        darkblue: darkblue,
        darkcyan: darkcyan,
        darkgoldenrod: darkgoldenrod,
        darkgray: darkgray,
        darkgreen: darkgreen,
        darkgrey: darkgrey,
        darkkhaki: darkkhaki,
        darkmagenta: darkmagenta,
        darkolivegreen: darkolivegreen,
        darkorange: darkorange,
        darkorchid: darkorchid,
        darkred: darkred,
        darksalmon: darksalmon,
        darkseagreen: darkseagreen,
        darkslateblue: darkslateblue,
        darkslategray: darkslategray,
        darkslategrey: darkslategrey,
        darkturquoise: darkturquoise,
        darkviolet: darkviolet,
        deeppink: deeppink,
        deepskyblue: deepskyblue,
        dimgray: dimgray,
        dimgrey: dimgrey,
        dodgerblue: dodgerblue,
        firebrick: firebrick,
        floralwhite: floralwhite,
        forestgreen: forestgreen,
        fuchsia: fuchsia,
        gainsboro: gainsboro,
        ghostwhite: ghostwhite,
        goldenrod: goldenrod,
        gold: gold,
        gray: gray,
        green: green,
        greenyellow: greenyellow,
        grey: grey,
        honeydew: honeydew,
        hotpink: hotpink,
        indianred: indianred,
        indigo: indigo,
        ivory: ivory,
        khaki: khaki,
        lavenderblush: lavenderblush,
        lavender: lavender,
        lawngreen: lawngreen,
        lemonchiffon: lemonchiffon,
        lightblue: lightblue,
        lightcoral: lightcoral,
        lightcyan: lightcyan,
        lightgoldenrodyellow: lightgoldenrodyellow,
        lightgray: lightgray,
        lightgreen: lightgreen,
        lightgrey: lightgrey,
        lightpink: lightpink,
        lightsalmon: lightsalmon,
        lightseagreen: lightseagreen,
        lightskyblue: lightskyblue,
        lightslategray: lightslategray,
        lightslategrey: lightslategrey,
        lightsteelblue: lightsteelblue,
        lightyellow: lightyellow,
        lime: lime,
        limegreen: limegreen,
        linen: linen,
        magenta: magenta,
        maroon: maroon,
        mediumaquamarine: mediumaquamarine,
        mediumblue: mediumblue,
        mediumorchid: mediumorchid,
        mediumpurple: mediumpurple,
        mediumseagreen: mediumseagreen,
        mediumslateblue: mediumslateblue,
        mediumspringgreen: mediumspringgreen,
        mediumturquoise: mediumturquoise,
        mediumvioletred: mediumvioletred,
        midnightblue: midnightblue,
        mintcream: mintcream,
        mistyrose: mistyrose,
        moccasin: moccasin,
        navajowhite: navajowhite,
        navy: navy,
        oldlace: oldlace,
        olive: olive,
        olivedrab: olivedrab,
        orange: orange,
        orangered: orangered,
        orchid: orchid,
        palegoldenrod: palegoldenrod,
        palegreen: palegreen,
        paleturquoise: paleturquoise,
        palevioletred: palevioletred,
        papayawhip: papayawhip,
        peachpuff: peachpuff,
        peru: peru,
        pink: pink,
        plum: plum,
        powderblue: powderblue,
        purple: purple,
        rebeccapurple: rebeccapurple,
        red: red,
        rosybrown: rosybrown,
        royalblue: royalblue,
        saddlebrown: saddlebrown,
        salmon: salmon,
        sandybrown: sandybrown,
        seagreen: seagreen,
        seashell: seashell,
        sienna: sienna,
        silver: silver,
        skyblue: skyblue,
        slateblue: slateblue,
        slategray: slategray,
        slategrey: slategrey,
        snow: snow,
        springgreen: springgreen,
        steelblue: steelblue,
        tan: tan,
        teal: teal,
        thistle: thistle,
        tomato: tomato,
        turquoise: turquoise,
        violet: violet,
        wheat: wheat,
        white: white,
        whitesmoke: whitesmoke,
        yellow: yellow,
        yellowgreen: yellowgreen
    };
  
    /**
     * Converts a hexadecimal color number to an [R, G, B] array of normalized floats (numbers from 0.0 to 1.0).
     *
     * @example
     * PIXI.utils.hex2rgb(0xffffff); // returns [1, 1, 1]
     * @memberof PIXI.utils
     * @function hex2rgb
     * @param {number} hex - The hexadecimal number to convert
     * @param  {number[]} [out=[]] - If supplied, this array will be used rather than returning a new one
     * @return {number[]} An array representing the [R, G, B] of the color where all values are floats.
     */
    function hex2rgb(hex, out) {
        if (out === void 0) { out = []; }
        out[0] = ((hex >> 16) & 0xFF) / 255;
        out[1] = ((hex >> 8) & 0xFF) / 255;
        out[2] = (hex & 0xFF) / 255;
        return out;
    }
    /**
     * Converts a hexadecimal color number to a string.
     *
     * @example
     * PIXI.utils.hex2string(0xffffff); // returns "#ffffff"
     * @memberof PIXI.utils
     * @function hex2string
     * @param {number} hex - Number in hex (e.g., `0xffffff`)
     * @return {string} The string color (e.g., `"#ffffff"`).
     */
    function hex2string(hex) {
        var hexString = hex.toString(16);
        hexString = '000000'.substring(0, 6 - hexString.length) + hexString;
        return "#" + hexString;
    }
    /**
     * Converts a string to a hexadecimal color number.
     * It can handle:
     *  hex strings starting with #: "#ffffff"
     *  hex strings starting with 0x: "0xffffff"
     *  hex strings without prefix: "ffffff"
     *  css colors: "black"
     *
     * @example
     * PIXI.utils.string2hex("#ffffff"); // returns 0xffffff
     * @memberof PIXI.utils
     * @function string2hex
     * @param {string} string - The string color (e.g., `"#ffffff"`)
     * @return {number} Number in hexadecimal.
     */
    function string2hex(string) {
        if (typeof string === 'string') {
            string = cssColorNames[string.toLowerCase()] || string;
            if (string[0] === '#') {
                string = string.slice(1);
            }
        }
        return parseInt(string, 16);
    }
    /**
     * Converts a color as an [R, G, B] array of normalized floats to a hexadecimal number.
     *
     * @example
     * PIXI.utils.rgb2hex([1, 1, 1]); // returns 0xffffff
     * @memberof PIXI.utils
     * @function rgb2hex
     * @param {number[]} rgb - Array of numbers where all values are normalized floats from 0.0 to 1.0.
     * @return {number} Number in hexadecimal.
     */
    function rgb2hex(rgb) {
        return (((rgb[0] * 255) << 16) + ((rgb[1] * 255) << 8) + (rgb[2] * 255 | 0));
    }
  
    /**
     * Corrects PixiJS blend, takes premultiplied alpha into account
     *
     * @memberof PIXI.utils
     * @function mapPremultipliedBlendModes
     * @private
     * @return {Array<number[]>} Mapped modes.
     */
    function mapPremultipliedBlendModes() {
        var pm = [];
        var npm = [];
        for (var i = 0; i < 32; i++) {
            pm[i] = i;
            npm[i] = i;
        }
        pm[exports.BLEND_MODES.NORMAL_NPM] = exports.BLEND_MODES.NORMAL;
        pm[exports.BLEND_MODES.ADD_NPM] = exports.BLEND_MODES.ADD;
        pm[exports.BLEND_MODES.SCREEN_NPM] = exports.BLEND_MODES.SCREEN;
        npm[exports.BLEND_MODES.NORMAL] = exports.BLEND_MODES.NORMAL_NPM;
        npm[exports.BLEND_MODES.ADD] = exports.BLEND_MODES.ADD_NPM;
        npm[exports.BLEND_MODES.SCREEN] = exports.BLEND_MODES.SCREEN_NPM;
        var array = [];
        array.push(npm);
        array.push(pm);
        return array;
    }
    /**
     * maps premultiply flag and blendMode to adjusted blendMode
     * @memberof PIXI.utils
     * @const premultiplyBlendMode
     * @type {Array<number[]>}
     */
    var premultiplyBlendMode = mapPremultipliedBlendModes();
    /**
     * changes blendMode according to texture format
     *
     * @memberof PIXI.utils
     * @function correctBlendMode
     * @param {number} blendMode - supposed blend mode
     * @param {boolean} premultiplied - whether source is premultiplied
     * @returns {number} true blend mode for this texture
     */
    function correctBlendMode(blendMode, premultiplied) {
        return premultiplyBlendMode[premultiplied ? 1 : 0][blendMode];
    }
    /**
     * combines rgb and alpha to out array
     *
     * @memberof PIXI.utils
     * @function premultiplyRgba
     * @param {Float32Array|number[]} rgb - input rgb
     * @param {number} alpha - alpha param
     * @param {Float32Array} [out] - output
     * @param {boolean} [premultiply=true] - do premultiply it
     * @returns {Float32Array} vec4 rgba
     */
    function premultiplyRgba(rgb, alpha, out, premultiply) {
        out = out || new Float32Array(4);
        if (premultiply || premultiply === undefined) {
            out[0] = rgb[0] * alpha;
            out[1] = rgb[1] * alpha;
            out[2] = rgb[2] * alpha;
        }
        else {
            out[0] = rgb[0];
            out[1] = rgb[1];
            out[2] = rgb[2];
        }
        out[3] = alpha;
        return out;
    }
    /**
     * premultiplies tint
     *
     * @memberof PIXI.utils
     * @function premultiplyTint
     * @param {number} tint - integer RGB
     * @param {number} alpha - floating point alpha (0.0-1.0)
     * @returns {number} tint multiplied by alpha
     */
    function premultiplyTint(tint, alpha) {
        if (alpha === 1.0) {
            return (alpha * 255 << 24) + tint;
        }
        if (alpha === 0.0) {
            return 0;
        }
        var R = ((tint >> 16) & 0xFF);
        var G = ((tint >> 8) & 0xFF);
        var B = (tint & 0xFF);
        R = ((R * alpha) + 0.5) | 0;
        G = ((G * alpha) + 0.5) | 0;
        B = ((B * alpha) + 0.5) | 0;
        return (alpha * 255 << 24) + (R << 16) + (G << 8) + B;
    }
    /**
     * converts integer tint and float alpha to vec4 form, premultiplies by default
     *
     * @memberof PIXI.utils
     * @function premultiplyTintToRgba
     * @param {number} tint - input tint
     * @param {number} alpha - alpha param
     * @param {Float32Array} [out] - output
     * @param {boolean} [premultiply=true] - do premultiply it
     * @returns {Float32Array} vec4 rgba
     */
    function premultiplyTintToRgba(tint, alpha, out, premultiply) {
        out = out || new Float32Array(4);
        out[0] = ((tint >> 16) & 0xFF) / 255.0;
        out[1] = ((tint >> 8) & 0xFF) / 255.0;
        out[2] = (tint & 0xFF) / 255.0;
        if (premultiply || premultiply === undefined) {
            out[0] *= alpha;
            out[1] *= alpha;
            out[2] *= alpha;
        }
        out[3] = alpha;
        return out;
    }
  
    /**
     * Generic Mask Stack data structure
     *
     * @memberof PIXI.utils
     * @function createIndicesForQuads
     * @param {number} size - Number of quads
     * @param {Uint16Array|Uint32Array} [outBuffer] - Buffer for output, length has to be `6 * size`
     * @return {Uint16Array|Uint32Array} - Resulting index buffer
     */
    function createIndicesForQuads(size, outBuffer) {
        if (outBuffer === void 0) { outBuffer = null; }
        // the total number of indices in our array, there are 6 points per quad.
        var totalIndices = size * 6;
        outBuffer = outBuffer || new Uint16Array(totalIndices);
        if (outBuffer.length !== totalIndices) {
            throw new Error("Out buffer length is incorrect, got " + outBuffer.length + " and expected " + totalIndices);
        }
        // fill the indices with the quads to draw
        for (var i = 0, j = 0; i < totalIndices; i += 6, j += 4) {
            outBuffer[i + 0] = j + 0;
            outBuffer[i + 1] = j + 1;
            outBuffer[i + 2] = j + 2;
            outBuffer[i + 3] = j + 0;
            outBuffer[i + 4] = j + 2;
            outBuffer[i + 5] = j + 3;
        }
        return outBuffer;
    }
  
    function getBufferType(array) {
        if (array.BYTES_PER_ELEMENT === 4) {
            if (array instanceof Float32Array) {
                return 'Float32Array';
            }
            else if (array instanceof Uint32Array) {
                return 'Uint32Array';
            }
            return 'Int32Array';
        }
        else if (array.BYTES_PER_ELEMENT === 2) {
            if (array instanceof Uint16Array) {
                return 'Uint16Array';
            }
        }
        else if (array.BYTES_PER_ELEMENT === 1) {
            if (array instanceof Uint8Array) {
                return 'Uint8Array';
            }
        }
        // TODO map out the rest of the array elements!
        return null;
    }
  
    /* eslint-disable object-shorthand */
    var map = { Float32Array: Float32Array, Uint32Array: Uint32Array, Int32Array: Int32Array, Uint8Array: Uint8Array };
    function interleaveTypedArrays(arrays, sizes) {
        var outSize = 0;
        var stride = 0;
        var views = {};
        for (var i = 0; i < arrays.length; i++) {
            stride += sizes[i];
            outSize += arrays[i].length;
        }
        var buffer = new ArrayBuffer(outSize * 4);
        var out = null;
        var littleOffset = 0;
        for (var i = 0; i < arrays.length; i++) {
            var size = sizes[i];
            var array = arrays[i];
            /*
            @todo This is unsafe casting but consistent with how the code worked previously. Should it stay this way
                  or should and `getBufferTypeUnsafe` function be exposed that throws an Error if unsupported type is passed?
             */
            var type = getBufferType(array);
            if (!views[type]) {
                views[type] = new map[type](buffer);
            }
            out = views[type];
            for (var j = 0; j < array.length; j++) {
                var indexStart = ((j / size | 0) * stride) + littleOffset;
                var index = j % size;
                out[indexStart + index] = array[j];
            }
            littleOffset += size;
        }
        return new Float32Array(buffer);
    }
  
    // Taken from the bit-twiddle package
    /**
     * Rounds to next power of two.
     *
     * @function nextPow2
     * @memberof PIXI.utils
     * @param {number} v - input value
     * @return {number}
     */
    function nextPow2(v) {
        v += v === 0 ? 1 : 0;
        --v;
        v |= v >>> 1;
        v |= v >>> 2;
        v |= v >>> 4;
        v |= v >>> 8;
        v |= v >>> 16;
        return v + 1;
    }
    /**
     * Checks if a number is a power of two.
     *
     * @function isPow2
     * @memberof PIXI.utils
     * @param {number} v - input value
     * @return {boolean} `true` if value is power of two
     */
    function isPow2(v) {
        return !(v & (v - 1)) && (!!v);
    }
    /**
     * Computes ceil of log base 2
     *
     * @function log2
     * @memberof PIXI.utils
     * @param {number} v - input value
     * @return {number} logarithm base 2
     */
    function log2(v) {
        var r = (v > 0xFFFF ? 1 : 0) << 4;
        v >>>= r;
        var shift = (v > 0xFF ? 1 : 0) << 3;
        v >>>= shift;
        r |= shift;
        shift = (v > 0xF ? 1 : 0) << 2;
        v >>>= shift;
        r |= shift;
        shift = (v > 0x3 ? 1 : 0) << 1;
        v >>>= shift;
        r |= shift;
        return r | (v >> 1);
    }
  
    /**
     * Remove items from a javascript array without generating garbage
     *
     * @function removeItems
     * @memberof PIXI.utils
     * @param {Array<any>} arr - Array to remove elements from
     * @param {number} startIdx - starting index
     * @param {number} removeCount - how many to remove
     */
    function removeItems(arr, startIdx, removeCount) {
        var length = arr.length;
        var i;
        if (startIdx >= length || removeCount === 0) {
            return;
        }
        removeCount = (startIdx + removeCount > length ? length - startIdx : removeCount);
        var len = length - removeCount;
        for (i = startIdx; i < len; ++i) {
            arr[i] = arr[i + removeCount];
        }
        arr.length = len;
    }
  
    /**
     * Returns sign of number
     *
     * @memberof PIXI.utils
     * @function sign
     * @param {number} n - the number to check the sign of
     * @returns {number} 0 if `n` is 0, -1 if `n` is negative, 1 if `n` is positive
     */
    function sign$1(n) {
        if (n === 0)
            { return 0; }
        return n < 0 ? -1 : 1;
    }
  
    var nextUid = 0;
    /**
     * Gets the next unique identifier
     *
     * @memberof PIXI.utils
     * @function uid
     * @return {number} The next unique identifier to use.
     */
    function uid() {
        return ++nextUid;
    }
  
    // A map of warning messages already fired
    var warnings = {};
    /**
     * Helper for warning developers about deprecated features & settings.
     * A stack track for warnings is given; useful for tracking-down where
     * deprecated methods/properties/classes are being used within the code.
     *
     * @memberof PIXI.utils
     * @function deprecation
     * @param {string} version - The version where the feature became deprecated
     * @param {string} message - Message should include what is deprecated, where, and the new solution
     * @param {number} [ignoreDepth=3] - The number of steps to ignore at the top of the error stack
     *        this is mostly to ignore internal deprecation calls.
     */
    function deprecation(version, message, ignoreDepth) {
        if (ignoreDepth === void 0) { ignoreDepth = 3; }
        // Ignore duplicat
        if (warnings[message]) {
            return;
        }
        /* eslint-disable no-console */
        var stack = new Error().stack;
        // Handle IE < 10 and Safari < 6
        if (typeof stack === 'undefined') {
            console.warn('PixiJS Deprecation Warning: ', message + "\nDeprecated since v" + version);
        }
        else {
            // chop off the stack trace which includes PixiJS internal calls
            stack = stack.split('\n').splice(ignoreDepth).join('\n');
            if (console.groupCollapsed) {
                console.groupCollapsed('%cPixiJS Deprecation Warning: %c%s', 'color:#614108;background:#fffbe6', 'font-weight:normal;color:#614108;background:#fffbe6', message + "\nDeprecated since v" + version);
                console.warn(stack);
                console.groupEnd();
            }
            else {
                console.warn('PixiJS Deprecation Warning: ', message + "\nDeprecated since v" + version);
                console.warn(stack);
            }
        }
        /* eslint-enable no-console */
        warnings[message] = true;
    }
  
    /**
     * @todo Describe property usage
     *
     * @static
     * @name ProgramCache
     * @memberof PIXI.utils
     * @type {Object}
     */
    var ProgramCache = {};
    /**
     * @todo Describe property usage
     *
     * @static
     * @name TextureCache
     * @memberof PIXI.utils
     * @type {Object}
     */
    var TextureCache = Object.create(null);
    /**
     * @todo Describe property usage
     *
     * @static
     * @name BaseTextureCache
     * @memberof PIXI.utils
     * @type {Object}
     */
    var BaseTextureCache = Object.create(null);
    /**
     * Destroys all texture in the cache
     *
     * @memberof PIXI.utils
     * @function destroyTextureCache
     */
    function destroyTextureCache() {
        var key;
        for (key in TextureCache) {
            TextureCache[key].destroy();
        }
        for (key in BaseTextureCache) {
            BaseTextureCache[key].destroy();
        }
    }
    /**
     * Removes all textures from cache, but does not destroy them
     *
     * @memberof PIXI.utils
     * @function clearTextureCache
     */
    function clearTextureCache() {
        var key;
        for (key in TextureCache) {
            delete TextureCache[key];
        }
        for (key in BaseTextureCache) {
            delete BaseTextureCache[key];
        }
    }
  
    /**
     * Creates a Canvas element of the given size to be used as a target for rendering to.
     *
     * @class
     * @memberof PIXI.utils
     */
    var CanvasRenderTarget = /** @class */ (function () {
        /**
         * @param width - the width for the newly created canvas
         * @param height - the height for the newly created canvas
         * @param {number} [resolution=PIXI.settings.RESOLUTION] - The resolution / device pixel ratio of the canvas
         */
        function CanvasRenderTarget(width, height, resolution) {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
            this.resolution = resolution || settings.RESOLUTION;
            this.resize(width, height);
        }
        /**
         * Clears the canvas that was created by the CanvasRenderTarget class.
         *
         * @private
         */
        CanvasRenderTarget.prototype.clear = function () {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        };
        /**
         * Resizes the canvas to the specified width and height.
         *
         * @param desiredWidth - the desired width of the canvas
         * @param desiredHeight - the desired height of the canvas
         */
        CanvasRenderTarget.prototype.resize = function (desiredWidth, desiredHeight) {
            this.canvas.width = Math.round(desiredWidth * this.resolution);
            this.canvas.height = Math.round(desiredHeight * this.resolution);
        };
        /** Destroys this canvas. */
        CanvasRenderTarget.prototype.destroy = function () {
            this.context = null;
            this.canvas = null;
        };
        Object.defineProperty(CanvasRenderTarget.prototype, "width", {
            /**
             * The width of the canvas buffer in pixels.
             *
             * @member {number}
             */
            get: function () {
                return this.canvas.width;
            },
            set: function (val) {
                this.canvas.width = Math.round(val);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CanvasRenderTarget.prototype, "height", {
            /**
             * The height of the canvas buffer in pixels.
             *
             * @member {number}
             */
            get: function () {
                return this.canvas.height;
            },
            set: function (val) {
                this.canvas.height = Math.round(val);
            },
            enumerable: false,
            configurable: true
        });
        return CanvasRenderTarget;
    }());
  
    /**
     * Trim transparent borders from a canvas
     *
     * @memberof PIXI.utils
     * @function trimCanvas
     * @param {HTMLCanvasElement} canvas - the canvas to trim
     * @returns {object} Trim data
     */
    function trimCanvas(canvas) {
        // https://gist.github.com/remy/784508
        var width = canvas.width;
        var height = canvas.height;
        var context = canvas.getContext('2d');
        var imageData = context.getImageData(0, 0, width, height);
        var pixels = imageData.data;
        var len = pixels.length;
        var bound = {
            top: null,
            left: null,
            right: null,
            bottom: null,
        };
        var data = null;
        var i;
        var x;
        var y;
        for (i = 0; i < len; i += 4) {
            if (pixels[i + 3] !== 0) {
                x = (i / 4) % width;
                y = ~~((i / 4) / width);
                if (bound.top === null) {
                    bound.top = y;
                }
                if (bound.left === null) {
                    bound.left = x;
                }
                else if (x < bound.left) {
                    bound.left = x;
                }
                if (bound.right === null) {
                    bound.right = x + 1;
                }
                else if (bound.right < x) {
                    bound.right = x + 1;
                }
                if (bound.bottom === null) {
                    bound.bottom = y;
                }
                else if (bound.bottom < y) {
                    bound.bottom = y;
                }
            }
        }
        if (bound.top !== null) {
            width = bound.right - bound.left;
            height = bound.bottom - bound.top + 1;
            data = context.getImageData(bound.left, bound.top, width, height);
        }
        return {
            height: height,
            width: width,
            data: data,
        };
    }
  
    /**
     * Regexp for data URI.
     * Based on: {@link https://github.com/ragingwind/data-uri-regex}
     *
     * @static
     * @constant {RegExp|string} DATA_URI
     * @memberof PIXI
     * @example data:image/png;base64
     */
    var DATA_URI = /^\s*data:(?:([\w-]+)\/([\w+.-]+))?(?:;charset=([\w-]+))?(?:;(base64))?,(.*)/i;
  
    /**
     * @memberof PIXI.utils
     * @interface DecomposedDataUri
     */
    /**
     * type, eg. `image`
     * @memberof PIXI.utils.DecomposedDataUri#
     * @member {string} mediaType
     */
    /**
     * Sub type, eg. `png`
     * @memberof PIXI.utils.DecomposedDataUri#
     * @member {string} subType
     */
    /**
     * @memberof PIXI.utils.DecomposedDataUri#
     * @member {string} charset
     */
    /**
     * Data encoding, eg. `base64`
     * @memberof PIXI.utils.DecomposedDataUri#
     * @member {string} encoding
     */
    /**
     * The actual data
     * @memberof PIXI.utils.DecomposedDataUri#
     * @member {string} data
     */
    /**
     * Split a data URI into components. Returns undefined if
     * parameter `dataUri` is not a valid data URI.
     *
     * @memberof PIXI.utils
     * @function decomposeDataUri
     * @param {string} dataUri - the data URI to check
     * @return {PIXI.utils.DecomposedDataUri|undefined} The decomposed data uri or undefined
     */
    function decomposeDataUri(dataUri) {
        var dataUriMatch = DATA_URI.exec(dataUri);
        if (dataUriMatch) {
            return {
                mediaType: dataUriMatch[1] ? dataUriMatch[1].toLowerCase() : undefined,
                subType: dataUriMatch[2] ? dataUriMatch[2].toLowerCase() : undefined,
                charset: dataUriMatch[3] ? dataUriMatch[3].toLowerCase() : undefined,
                encoding: dataUriMatch[4] ? dataUriMatch[4].toLowerCase() : undefined,
                data: dataUriMatch[5],
            };
        }
        return undefined;
    }
  
    var tempAnchor;
    /**
     * Sets the `crossOrigin` property for this resource based on if the url
     * for this resource is cross-origin. If crossOrigin was manually set, this
     * function does nothing.
     * Nipped from the resource loader!
     *
     * @ignore
     * @param {string} url - The url to test.
     * @param {object} [loc=window.location] - The location object to test against.
     * @return {string} The crossOrigin value to use (or empty string for none).
     */
    function determineCrossOrigin(url$1$1, loc) {
        if (loc === void 0) { loc = globalThis.location; }
        // data: and javascript: urls are considered same-origin
        if (url$1$1.indexOf('data:') === 0) {
            return '';
        }
        // default is window.location
        loc = loc || globalThis.location;
        if (!tempAnchor) {
            tempAnchor = document.createElement('a');
        }
        // let the browser determine the full href for the url of this resource and then
        // parse with the node url lib, we can't use the properties of the anchor element
        // because they don't work in IE9 :(
        tempAnchor.href = url$1$1;
        var parsedUrl = url$1.parse(tempAnchor.href);
        var samePort = (!parsedUrl.port && loc.port === '') || (parsedUrl.port === loc.port);
        // if cross origin
        if (parsedUrl.hostname !== loc.hostname || !samePort || parsedUrl.protocol !== loc.protocol) {
            return 'anonymous';
        }
        return '';
    }
  
    /**
     * get the resolution / device pixel ratio of an asset by looking for the prefix
     * used by spritesheets and image urls
     *
     * @memberof PIXI.utils
     * @function getResolutionOfUrl
     * @param {string} url - the image path
     * @param {number} [defaultValue=1] - the defaultValue if no filename prefix is set.
     * @return {number} resolution / device pixel ratio of an asset
     */
    function getResolutionOfUrl(url, defaultValue) {
        var resolution = settings.RETINA_PREFIX.exec(url);
        if (resolution) {
            return parseFloat(resolution[1]);
        }
        return defaultValue !== undefined ? defaultValue : 1;
    }
  
    var utils = {
      __proto__: null,
      BaseTextureCache: BaseTextureCache,
      CanvasRenderTarget: CanvasRenderTarget,
      DATA_URI: DATA_URI,
      ProgramCache: ProgramCache,
      TextureCache: TextureCache,
      clearTextureCache: clearTextureCache,
      correctBlendMode: correctBlendMode,
      createIndicesForQuads: createIndicesForQuads,
      decomposeDataUri: decomposeDataUri,
      deprecation: deprecation,
      destroyTextureCache: destroyTextureCache,
      determineCrossOrigin: determineCrossOrigin,
      getBufferType: getBufferType,
      getResolutionOfUrl: getResolutionOfUrl,
      hex2rgb: hex2rgb,
      hex2string: hex2string,
      interleaveTypedArrays: interleaveTypedArrays,
      isPow2: isPow2,
      isWebGLSupported: isWebGLSupported,
      log2: log2,
      nextPow2: nextPow2,
      premultiplyBlendMode: premultiplyBlendMode,
      premultiplyRgba: premultiplyRgba,
      premultiplyTint: premultiplyTint,
      premultiplyTintToRgba: premultiplyTintToRgba,
      removeItems: removeItems,
      rgb2hex: rgb2hex,
      sayHello: sayHello,
      sign: sign$1,
      skipHello: skipHello,
      string2hex: string2hex,
      trimCanvas: trimCanvas,
      uid: uid,
      url: url$1,
      isMobile: isMobile$1,
      EventEmitter: eventemitter3,
      earcut: earcut_1
    };
  
    /*!
     * @pixi/math - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/math is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
    /**
     * Two Pi.
     *
     * @static
     * @member {number}
     * @memberof PIXI
     */
    var PI_2 = Math.PI * 2;
    /**
     * Conversion factor for converting radians to degrees.
     *
     * @static
     * @member {number} RAD_TO_DEG
     * @memberof PIXI
     */
    var RAD_TO_DEG = 180 / Math.PI;
    /**
     * Conversion factor for converting degrees to radians.
     *
     * @static
     * @member {number}
     * @memberof PIXI
     */
    var DEG_TO_RAD = Math.PI / 180;
    /**
     * Constants that identify shapes, mainly to prevent `instanceof` calls.
     *
     * @static
     * @memberof PIXI
     * @enum {number}
     * @property {number} POLY Polygon
     * @property {number} RECT Rectangle
     * @property {number} CIRC Circle
     * @property {number} ELIP Ellipse
     * @property {number} RREC Rounded Rectangle
     */
  
    (function (SHAPES) {
        SHAPES[SHAPES["POLY"] = 0] = "POLY";
        SHAPES[SHAPES["RECT"] = 1] = "RECT";
        SHAPES[SHAPES["CIRC"] = 2] = "CIRC";
        SHAPES[SHAPES["ELIP"] = 3] = "ELIP";
        SHAPES[SHAPES["RREC"] = 4] = "RREC";
    })(exports.SHAPES || (exports.SHAPES = {}));
  
    /**
     * The Point object represents a location in a two-dimensional coordinate system, where `x` represents
     * the position on the horizontal axis and `y` represents the position on the vertical axis
     *
     * @class
     * @memberof PIXI
     * @implements IPoint
     */
    var Point = /** @class */ (function () {
        /** Creates a new `Point`
         * @param {number} [x=0] - position of the point on the x axis
         * @param {number} [y=0] - position of the point on the y axis
         */
        function Point(x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            /** Position of the point on the x axis */
            this.x = 0;
            /** Position of the point on the y axis */
            this.y = 0;
            this.x = x;
            this.y = y;
        }
        /** Creates a clone of this point
         * @returns A clone of this point
         */
        Point.prototype.clone = function () {
            return new Point(this.x, this.y);
        };
        /**
         * Copies `x` and `y` from the given point into this point
         *
         * @param p - The point to copy from
         * @returns The point instance itself
         */
        Point.prototype.copyFrom = function (p) {
            this.set(p.x, p.y);
            return this;
        };
        /**
         * Copies this point's x and y into the given point (`p`).
         *
         * @param p - The point to copy to. Can be any of type that is or extends `IPointData`
         * @returns The point (`p`) with values updated
         */
        Point.prototype.copyTo = function (p) {
            p.set(this.x, this.y);
            return p;
        };
        /**
         * Accepts another point (`p`) and returns `true` if the given point is equal to this point
         *
         * @param p - The point to check
         * @returns Returns `true` if both `x` and `y` are equal
         */
        Point.prototype.equals = function (p) {
            return (p.x === this.x) && (p.y === this.y);
        };
        /**
         * Sets the point to a new `x` and `y` position.
         * If `y` is omitted, both `x` and `y` will be set to `x`.
         *
         * @param {number} [x=0] - position of the point on the `x` axis
         * @param {number} [y=x] - position of the point on the `y` axis
         * @returns The point instance itself
         */
        Point.prototype.set = function (x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = x; }
            this.x = x;
            this.y = y;
            return this;
        };
        Point.prototype.toString = function () {
            return "[@pixi/math:Point x=" + this.x + " y=" + this.y + "]";
        };
        return Point;
    }());
  
    var tempPoints = [new Point(), new Point(), new Point(), new Point()];
    /**
     * Size object, contains width and height
     *
     * @memberof PIXI
     * @typedef {object} ISize
     */
    /**
     * Rectangle object is an area defined by its position, as indicated by its top-left corner
     * point (x, y) and by its width and its height.
     *
     * @memberof PIXI
     */
    var Rectangle = /** @class */ (function () {
        /**
         * @param x - The X coordinate of the upper-left corner of the rectangle
         * @param y - The Y coordinate of the upper-left corner of the rectangle
         * @param width - The overall width of the rectangle
         * @param height - The overall height of the rectangle
         */
        function Rectangle(x, y, width, height) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (width === void 0) { width = 0; }
            if (height === void 0) { height = 0; }
            this.x = Number(x);
            this.y = Number(y);
            this.width = Number(width);
            this.height = Number(height);
            this.type = exports.SHAPES.RECT;
        }
        Object.defineProperty(Rectangle.prototype, "left", {
            /** Returns the left edge of the rectangle. */
            get: function () {
                return this.x;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "right", {
            /** Returns the right edge of the rectangle. */
            get: function () {
                return this.x + this.width;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "top", {
            /** Returns the top edge of the rectangle. */
            get: function () {
                return this.y;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "bottom", {
            /** Returns the bottom edge of the rectangle. */
            get: function () {
                return this.y + this.height;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Rectangle, "EMPTY", {
            /** A constant empty rectangle. */
            get: function () {
                return new Rectangle(0, 0, 0, 0);
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Creates a clone of this Rectangle
         *
         * @return a copy of the rectangle
         */
        Rectangle.prototype.clone = function () {
            return new Rectangle(this.x, this.y, this.width, this.height);
        };
        /**
         * Copies another rectangle to this one.
         *
         * @param rectangle - The rectangle to copy from.
         * @return Returns itself.
         */
        Rectangle.prototype.copyFrom = function (rectangle) {
            this.x = rectangle.x;
            this.y = rectangle.y;
            this.width = rectangle.width;
            this.height = rectangle.height;
            return this;
        };
        /**
         * Copies this rectangle to another one.
         *
         * @param rectangle - The rectangle to copy to.
         * @return Returns given parameter.
         */
        Rectangle.prototype.copyTo = function (rectangle) {
            rectangle.x = this.x;
            rectangle.y = this.y;
            rectangle.width = this.width;
            rectangle.height = this.height;
            return rectangle;
        };
        /**
         * Checks whether the x and y coordinates given are contained within this Rectangle
         *
         * @param x - The X coordinate of the point to test
         * @param y - The Y coordinate of the point to test
         * @return Whether the x/y coordinates are within this Rectangle
         */
        Rectangle.prototype.contains = function (x, y) {
            if (this.width <= 0 || this.height <= 0) {
                return false;
            }
            if (x >= this.x && x < this.x + this.width) {
                if (y >= this.y && y < this.y + this.height) {
                    return true;
                }
            }
            return false;
        };
        /**
         * Determines whether the `other` Rectangle transformed by `transform` intersects with `this` Rectangle object.
         * Returns true only if the area of the intersection is >0, this means that Rectangles
         * sharing a side are not overlapping. Another side effect is that an arealess rectangle
         * (width or height equal to zero) can't intersect any other rectangle.
         *
         * @param {Rectangle} other - The Rectangle to intersect with `this`.
         * @param {Matrix} transform - The transformation matrix of `other`.
         * @returns {boolean} A value of `true` if the transformed `other` Rectangle intersects with `this`; otherwise `false`.
         */
        Rectangle.prototype.intersects = function (other, transform) {
            if (!transform) {
                var x0_1 = this.x < other.x ? other.x : this.x;
                var x1_1 = this.right > other.right ? other.right : this.right;
                if (x1_1 <= x0_1) {
                    return false;
                }
                var y0_1 = this.y < other.y ? other.y : this.y;
                var y1_1 = this.bottom > other.bottom ? other.bottom : this.bottom;
                return y1_1 > y0_1;
            }
            var x0 = this.left;
            var x1 = this.right;
            var y0 = this.top;
            var y1 = this.bottom;
            if (x1 <= x0 || y1 <= y0) {
                return false;
            }
            var lt = tempPoints[0].set(other.left, other.top);
            var lb = tempPoints[1].set(other.left, other.bottom);
            var rt = tempPoints[2].set(other.right, other.top);
            var rb = tempPoints[3].set(other.right, other.bottom);
            if (rt.x <= lt.x || lb.y <= lt.y) {
                return false;
            }
            var s = Math.sign((transform.a * transform.d) - (transform.b * transform.c));
            if (s === 0) {
                return false;
            }
            transform.apply(lt, lt);
            transform.apply(lb, lb);
            transform.apply(rt, rt);
            transform.apply(rb, rb);
            if (Math.max(lt.x, lb.x, rt.x, rb.x) <= x0
                || Math.min(lt.x, lb.x, rt.x, rb.x) >= x1
                || Math.max(lt.y, lb.y, rt.y, rb.y) <= y0
                || Math.min(lt.y, lb.y, rt.y, rb.y) >= y1) {
                return false;
            }
            var nx = s * (lb.y - lt.y);
            var ny = s * (lt.x - lb.x);
            var n00 = (nx * x0) + (ny * y0);
            var n10 = (nx * x1) + (ny * y0);
            var n01 = (nx * x0) + (ny * y1);
            var n11 = (nx * x1) + (ny * y1);
            if (Math.max(n00, n10, n01, n11) <= (nx * lt.x) + (ny * lt.y)
                || Math.min(n00, n10, n01, n11) >= (nx * rb.x) + (ny * rb.y)) {
                return false;
            }
            var mx = s * (lt.y - rt.y);
            var my = s * (rt.x - lt.x);
            var m00 = (mx * x0) + (my * y0);
            var m10 = (mx * x1) + (my * y0);
            var m01 = (mx * x0) + (my * y1);
            var m11 = (mx * x1) + (my * y1);
            if (Math.max(m00, m10, m01, m11) <= (mx * lt.x) + (my * lt.y)
                || Math.min(m00, m10, m01, m11) >= (mx * rb.x) + (my * rb.y)) {
                return false;
            }
            return true;
        };
        /**
         * Pads the rectangle making it grow in all directions.
         * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
         *
         * @param paddingX - The horizontal padding amount.
         * @param paddingY - The vertical padding amount.
         * @return Returns itself.
         */
        Rectangle.prototype.pad = function (paddingX, paddingY) {
            if (paddingX === void 0) { paddingX = 0; }
            if (paddingY === void 0) { paddingY = paddingX; }
            this.x -= paddingX;
            this.y -= paddingY;
            this.width += paddingX * 2;
            this.height += paddingY * 2;
            return this;
        };
        /**
         * Fits this rectangle around the passed one.
         *
         * @param rectangle - The rectangle to fit.
         * @return Returns itself.
         */
        Rectangle.prototype.fit = function (rectangle) {
            var x1 = Math.max(this.x, rectangle.x);
            var x2 = Math.min(this.x + this.width, rectangle.x + rectangle.width);
            var y1 = Math.max(this.y, rectangle.y);
            var y2 = Math.min(this.y + this.height, rectangle.y + rectangle.height);
            this.x = x1;
            this.width = Math.max(x2 - x1, 0);
            this.y = y1;
            this.height = Math.max(y2 - y1, 0);
            return this;
        };
        /**
         * Enlarges rectangle that way its corners lie on grid
         *
         * @param resolution - resolution
         * @param eps - precision
         * @return Returns itself.
         */
        Rectangle.prototype.ceil = function (resolution, eps) {
            if (resolution === void 0) { resolution = 1; }
            if (eps === void 0) { eps = 0.001; }
            var x2 = Math.ceil((this.x + this.width - eps) * resolution) / resolution;
            var y2 = Math.ceil((this.y + this.height - eps) * resolution) / resolution;
            this.x = Math.floor((this.x + eps) * resolution) / resolution;
            this.y = Math.floor((this.y + eps) * resolution) / resolution;
            this.width = x2 - this.x;
            this.height = y2 - this.y;
            return this;
        };
        /**
         * Enlarges this rectangle to include the passed rectangle.
         *
         * @param rectangle - The rectangle to include.
         * @return Returns itself.
         */
        Rectangle.prototype.enlarge = function (rectangle) {
            var x1 = Math.min(this.x, rectangle.x);
            var x2 = Math.max(this.x + this.width, rectangle.x + rectangle.width);
            var y1 = Math.min(this.y, rectangle.y);
            var y2 = Math.max(this.y + this.height, rectangle.y + rectangle.height);
            this.x = x1;
            this.width = x2 - x1;
            this.y = y1;
            this.height = y2 - y1;
            return this;
        };
        Rectangle.prototype.toString = function () {
            return "[@pixi/math:Rectangle x=" + this.x + " y=" + this.y + " width=" + this.width + " height=" + this.height + "]";
        };
        return Rectangle;
    }());
  
    /**
     * The Circle object is used to help draw graphics and can also be used to specify a hit area for displayObjects.
     *
     * @memberof PIXI
     */
    var Circle = /** @class */ (function () {
        /**
         * @param x - The X coordinate of the center of this circle
         * @param y - The Y coordinate of the center of this circle
         * @param radius - The radius of the circle
         */
        function Circle(x, y, radius) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (radius === void 0) { radius = 0; }
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.type = exports.SHAPES.CIRC;
        }
        /**
         * Creates a clone of this Circle instance
         *
         * @return A copy of the Circle
         */
        Circle.prototype.clone = function () {
            return new Circle(this.x, this.y, this.radius);
        };
        /**
         * Checks whether the x and y coordinates given are contained within this circle
         *
         * @param x - The X coordinate of the point to test
         * @param y - The Y coordinate of the point to test
         * @return Whether the x/y coordinates are within this Circle
         */
        Circle.prototype.contains = function (x, y) {
            if (this.radius <= 0) {
                return false;
            }
            var r2 = this.radius * this.radius;
            var dx = (this.x - x);
            var dy = (this.y - y);
            dx *= dx;
            dy *= dy;
            return (dx + dy <= r2);
        };
        /**
        * Returns the framing rectangle of the circle as a Rectangle object
        *
        * @return The framing rectangle
        */
        Circle.prototype.getBounds = function () {
            return new Rectangle(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        };
        Circle.prototype.toString = function () {
            return "[@pixi/math:Circle x=" + this.x + " y=" + this.y + " radius=" + this.radius + "]";
        };
        return Circle;
    }());
  
    /**
     * The Ellipse object is used to help draw graphics and can also be used to specify a hit area for displayObjects.
     *
     * @memberof PIXI
     */
    var Ellipse = /** @class */ (function () {
        /**
         * @param x - The X coordinate of the center of this ellipse
         * @param y - The Y coordinate of the center of this ellipse
         * @param halfWidth - The half width of this ellipse
         * @param halfHeight - The half height of this ellipse
         */
        function Ellipse(x, y, halfWidth, halfHeight) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (halfWidth === void 0) { halfWidth = 0; }
            if (halfHeight === void 0) { halfHeight = 0; }
            this.x = x;
            this.y = y;
            this.width = halfWidth;
            this.height = halfHeight;
            this.type = exports.SHAPES.ELIP;
        }
        /**
         * Creates a clone of this Ellipse instance
         *
         * @return {PIXI.Ellipse} A copy of the ellipse
         */
        Ellipse.prototype.clone = function () {
            return new Ellipse(this.x, this.y, this.width, this.height);
        };
        /**
         * Checks whether the x and y coordinates given are contained within this ellipse
         *
         * @param x - The X coordinate of the point to test
         * @param y - The Y coordinate of the point to test
         * @return Whether the x/y coords are within this ellipse
         */
        Ellipse.prototype.contains = function (x, y) {
            if (this.width <= 0 || this.height <= 0) {
                return false;
            }
            // normalize the coords to an ellipse with center 0,0
            var normx = ((x - this.x) / this.width);
            var normy = ((y - this.y) / this.height);
            normx *= normx;
            normy *= normy;
            return (normx + normy <= 1);
        };
        /**
         * Returns the framing rectangle of the ellipse as a Rectangle object
         *
         * @return The framing rectangle
         */
        Ellipse.prototype.getBounds = function () {
            return new Rectangle(this.x - this.width, this.y - this.height, this.width, this.height);
        };
        Ellipse.prototype.toString = function () {
            return "[@pixi/math:Ellipse x=" + this.x + " y=" + this.y + " width=" + this.width + " height=" + this.height + "]";
        };
        return Ellipse;
    }());
  
    /**
     * A class to define a shape via user defined coordinates.
     *
     * @memberof PIXI
     */
    var Polygon = /** @class */ (function () {
        /**
         * @param {PIXI.IPointData[]|number[]} points - This can be an array of Points
         *  that form the polygon, a flat array of numbers that will be interpreted as [x,y, x,y, ...], or
         *  the arguments passed can be all the points of the polygon e.g.
         *  `new PIXI.Polygon(new PIXI.Point(), new PIXI.Point(), ...)`, or the arguments passed can be flat
         *  x,y values e.g. `new Polygon(x,y, x,y, x,y, ...)` where `x` and `y` are Numbers.
         */
        function Polygon() {
            var arguments$1 = arguments;
  
            var points = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                points[_i] = arguments$1[_i];
            }
            var flat = Array.isArray(points[0]) ? points[0] : points;
            // if this is an array of points, convert it to a flat array of numbers
            if (typeof flat[0] !== 'number') {
                var p = [];
                for (var i = 0, il = flat.length; i < il; i++) {
                    p.push(flat[i].x, flat[i].y);
                }
                flat = p;
            }
            this.points = flat;
            this.type = exports.SHAPES.POLY;
            this.closeStroke = true;
        }
        /**
         * Creates a clone of this polygon.
         *
         * @return - A copy of the polygon.
         */
        Polygon.prototype.clone = function () {
            var points = this.points.slice();
            var polygon = new Polygon(points);
            polygon.closeStroke = this.closeStroke;
            return polygon;
        };
        /**
         * Checks whether the x and y coordinates passed to this function are contained within this polygon.
         *
         * @param x - The X coordinate of the point to test.
         * @param y - The Y coordinate of the point to test.
         * @return - Whether the x/y coordinates are within this polygon.
         */
        Polygon.prototype.contains = function (x, y) {
            var inside = false;
            // use some raycasting to test hits
            // https://github.com/substack/point-in-polygon/blob/master/index.js
            var length = this.points.length / 2;
            for (var i = 0, j = length - 1; i < length; j = i++) {
                var xi = this.points[i * 2];
                var yi = this.points[(i * 2) + 1];
                var xj = this.points[j * 2];
                var yj = this.points[(j * 2) + 1];
                var intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * ((y - yi) / (yj - yi))) + xi);
                if (intersect) {
                    inside = !inside;
                }
            }
            return inside;
        };
        Polygon.prototype.toString = function () {
            return "[@pixi/math:Polygon"
                + ("closeStroke=" + this.closeStroke)
                + ("points=" + this.points.reduce(function (pointsDesc, currentPoint) { return pointsDesc + ", " + currentPoint; }, '') + "]");
        };
        return Polygon;
    }());
  
    /**
     * The Rounded Rectangle object is an area that has nice rounded corners, as indicated by its
     * top-left corner point (x, y) and by its width and its height and its radius.
     *
     * @memberof PIXI
     */
    var RoundedRectangle = /** @class */ (function () {
        /**
         * @param x - The X coordinate of the upper-left corner of the rounded rectangle
         * @param y - The Y coordinate of the upper-left corner of the rounded rectangle
         * @param width - The overall width of this rounded rectangle
         * @param height - The overall height of this rounded rectangle
         * @param radius - Controls the radius of the rounded corners
         */
        function RoundedRectangle(x, y, width, height, radius) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (width === void 0) { width = 0; }
            if (height === void 0) { height = 0; }
            if (radius === void 0) { radius = 20; }
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.radius = radius;
            this.type = exports.SHAPES.RREC;
        }
        /**
         * Creates a clone of this Rounded Rectangle.
         *
         * @return - A copy of the rounded rectangle.
         */
        RoundedRectangle.prototype.clone = function () {
            return new RoundedRectangle(this.x, this.y, this.width, this.height, this.radius);
        };
        /**
         * Checks whether the x and y coordinates given are contained within this Rounded Rectangle
         *
         * @param x - The X coordinate of the point to test.
         * @param y - The Y coordinate of the point to test.
         * @return - Whether the x/y coordinates are within this Rounded Rectangle.
         */
        RoundedRectangle.prototype.contains = function (x, y) {
            if (this.width <= 0 || this.height <= 0) {
                return false;
            }
            if (x >= this.x && x <= this.x + this.width) {
                if (y >= this.y && y <= this.y + this.height) {
                    var radius = Math.max(0, Math.min(this.radius, Math.min(this.width, this.height) / 2));
                    if ((y >= this.y + radius && y <= this.y + this.height - radius)
                        || (x >= this.x + radius && x <= this.x + this.width - radius)) {
                        return true;
                    }
                    var dx = x - (this.x + radius);
                    var dy = y - (this.y + radius);
                    var radius2 = radius * radius;
                    if ((dx * dx) + (dy * dy) <= radius2) {
                        return true;
                    }
                    dx = x - (this.x + this.width - radius);
                    if ((dx * dx) + (dy * dy) <= radius2) {
                        return true;
                    }
                    dy = y - (this.y + this.height - radius);
                    if ((dx * dx) + (dy * dy) <= radius2) {
                        return true;
                    }
                    dx = x - (this.x + radius);
                    if ((dx * dx) + (dy * dy) <= radius2) {
                        return true;
                    }
                }
            }
            return false;
        };
        RoundedRectangle.prototype.toString = function () {
            return "[@pixi/math:RoundedRectangle x=" + this.x + " y=" + this.y
                + ("width=" + this.width + " height=" + this.height + " radius=" + this.radius + "]");
        };
        return RoundedRectangle;
    }());
  
    /**
     * The ObservablePoint object represents a location in a two-dimensional coordinate system, where `x` represents
     * the position on the horizontal axis and `y` represents the position on the vertical axis.
     *
     * An `ObservablePoint` is a point that triggers a callback when the point's position is changed.
     *
     * @memberof PIXI
     */
    var ObservablePoint = /** @class */ (function () {
        /**
         * Creates a new `ObservablePoint`
         *
         * @param cb - callback function triggered when `x` and/or `y` are changed
         * @param scope - owner of callback
         * @param {number} [x=0] - position of the point on the x axis
         * @param {number} [y=0] - position of the point on the y axis
        */
        function ObservablePoint(cb, scope, x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            this._x = x;
            this._y = y;
            this.cb = cb;
            this.scope = scope;
        }
        /**
         * Creates a clone of this point.
         * The callback and scope params can be overridden otherwise they will default
         * to the clone object's values.
         *
         * @override
         * @param cb - The callback function triggered when `x` and/or `y` are changed
         * @param scope - The owner of the callback
         * @return a copy of this observable point
         */
        ObservablePoint.prototype.clone = function (cb, scope) {
            if (cb === void 0) { cb = this.cb; }
            if (scope === void 0) { scope = this.scope; }
            return new ObservablePoint(cb, scope, this._x, this._y);
        };
        /**
         * Sets the point to a new `x` and `y` position.
         * If `y` is omitted, both `x` and `y` will be set to `x`.
         *
         * @param {number} [x=0] - position of the point on the x axis
         * @param {number} [y=x] - position of the point on the y axis
         * @returns The observable point instance itself
         */
        ObservablePoint.prototype.set = function (x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = x; }
            if (this._x !== x || this._y !== y) {
                this._x = x;
                this._y = y;
                this.cb.call(this.scope);
            }
            return this;
        };
        /**
         * Copies x and y from the given point (`p`)
         *
         * @param p - The point to copy from. Can be any of type that is or extends `IPointData`
         * @returns The observable point instance itself
         */
        ObservablePoint.prototype.copyFrom = function (p) {
            if (this._x !== p.x || this._y !== p.y) {
                this._x = p.x;
                this._y = p.y;
                this.cb.call(this.scope);
            }
            return this;
        };
        /**
         * Copies this point's x and y into that of the given point (`p`)
         *
         * @param p - The point to copy to. Can be any of type that is or extends `IPointData`
         * @returns The point (`p`) with values updated
         */
        ObservablePoint.prototype.copyTo = function (p) {
            p.set(this._x, this._y);
            return p;
        };
        /**
         * Accepts another point (`p`) and returns `true` if the given point is equal to this point
         *
         * @param p - The point to check
         * @returns Returns `true` if both `x` and `y` are equal
         */
        ObservablePoint.prototype.equals = function (p) {
            return (p.x === this._x) && (p.y === this._y);
        };
        ObservablePoint.prototype.toString = function () {
            return "[@pixi/math:ObservablePoint x=" + 0 + " y=" + 0 + " scope=" + this.scope + "]";
        };
        Object.defineProperty(ObservablePoint.prototype, "x", {
            /** Position of the observable point on the x axis. */
            get: function () {
                return this._x;
            },
            set: function (value) {
                if (this._x !== value) {
                    this._x = value;
                    this.cb.call(this.scope);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ObservablePoint.prototype, "y", {
            /** Position of the observable point on the y axis. */
            get: function () {
                return this._y;
            },
            set: function (value) {
                if (this._y !== value) {
                    this._y = value;
                    this.cb.call(this.scope);
                }
            },
            enumerable: false,
            configurable: true
        });
        return ObservablePoint;
    }());
  
    /**
     * The PixiJS Matrix as a class makes it a lot faster.
     *
     * Here is a representation of it:
     * ```js
     * | a | c | tx|
     * | b | d | ty|
     * | 0 | 0 | 1 |
     * ```
     *
     * @memberof PIXI
     */
    var Matrix = /** @class */ (function () {
        /**
         * @param a - x scale
         * @param b - y skew
         * @param c - x skew
         * @param d - y scale
         * @param tx - x translation
         * @param ty - y translation
         */
        function Matrix(a, b, c, d, tx, ty) {
            if (a === void 0) { a = 1; }
            if (b === void 0) { b = 0; }
            if (c === void 0) { c = 0; }
            if (d === void 0) { d = 1; }
            if (tx === void 0) { tx = 0; }
            if (ty === void 0) { ty = 0; }
            this.array = null;
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            this.tx = tx;
            this.ty = ty;
        }
        /**
         * Creates a Matrix object based on the given array. The Element to Matrix mapping order is as follows:
         *
         * a = array[0]
         * b = array[1]
         * c = array[3]
         * d = array[4]
         * tx = array[2]
         * ty = array[5]
         *
         * @param array - The array that the matrix will be populated from.
         */
        Matrix.prototype.fromArray = function (array) {
            this.a = array[0];
            this.b = array[1];
            this.c = array[3];
            this.d = array[4];
            this.tx = array[2];
            this.ty = array[5];
        };
        /**
         * Sets the matrix properties.
         *
         * @param a - Matrix component
         * @param b - Matrix component
         * @param c - Matrix component
         * @param d - Matrix component
         * @param tx - Matrix component
         * @param ty - Matrix component
         * @return This matrix. Good for chaining method calls.
         */
        Matrix.prototype.set = function (a, b, c, d, tx, ty) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            this.tx = tx;
            this.ty = ty;
            return this;
        };
        /**
         * Creates an array from the current Matrix object.
         *
         * @param transpose - Whether we need to transpose the matrix or not
         * @param [out=new Float32Array(9)] - If provided the array will be assigned to out
         * @return The newly created array which contains the matrix
         */
        Matrix.prototype.toArray = function (transpose, out) {
            if (!this.array) {
                this.array = new Float32Array(9);
            }
            var array = out || this.array;
            if (transpose) {
                array[0] = this.a;
                array[1] = this.b;
                array[2] = 0;
                array[3] = this.c;
                array[4] = this.d;
                array[5] = 0;
                array[6] = this.tx;
                array[7] = this.ty;
                array[8] = 1;
            }
            else {
                array[0] = this.a;
                array[1] = this.c;
                array[2] = this.tx;
                array[3] = this.b;
                array[4] = this.d;
                array[5] = this.ty;
                array[6] = 0;
                array[7] = 0;
                array[8] = 1;
            }
            return array;
        };
        /**
         * Get a new position with the current transformation applied.
         * Can be used to go from a child's coordinate space to the world coordinate space. (e.g. rendering)
         *
         * @param pos - The origin
         * @param {PIXI.Point} [newPos] - The point that the new position is assigned to (allowed to be same as input)
         * @return {PIXI.Point} The new point, transformed through this matrix
         */
        Matrix.prototype.apply = function (pos, newPos) {
            newPos = (newPos || new Point());
            var x = pos.x;
            var y = pos.y;
            newPos.x = (this.a * x) + (this.c * y) + this.tx;
            newPos.y = (this.b * x) + (this.d * y) + this.ty;
            return newPos;
        };
        /**
         * Get a new position with the inverse of the current transformation applied.
         * Can be used to go from the world coordinate space to a child's coordinate space. (e.g. input)
         *
         * @param pos - The origin
         * @param {PIXI.Point} [newPos] - The point that the new position is assigned to (allowed to be same as input)
         * @return {PIXI.Point} The new point, inverse-transformed through this matrix
         */
        Matrix.prototype.applyInverse = function (pos, newPos) {
            newPos = (newPos || new Point());
            var id = 1 / ((this.a * this.d) + (this.c * -this.b));
            var x = pos.x;
            var y = pos.y;
            newPos.x = (this.d * id * x) + (-this.c * id * y) + (((this.ty * this.c) - (this.tx * this.d)) * id);
            newPos.y = (this.a * id * y) + (-this.b * id * x) + (((-this.ty * this.a) + (this.tx * this.b)) * id);
            return newPos;
        };
        /**
         * Translates the matrix on the x and y.
         *
         * @param x - How much to translate x by
         * @param y - How much to translate y by
         * @return This matrix. Good for chaining method calls.
         */
        Matrix.prototype.translate = function (x, y) {
            this.tx += x;
            this.ty += y;
            return this;
        };
        /**
         * Applies a scale transformation to the matrix.
         *
         * @param x - The amount to scale horizontally
         * @param y - The amount to scale vertically
         * @return This matrix. Good for chaining method calls.
         */
        Matrix.prototype.scale = function (x, y) {
            this.a *= x;
            this.d *= y;
            this.c *= x;
            this.b *= y;
            this.tx *= x;
            this.ty *= y;
            return this;
        };
        /**
         * Applies a rotation transformation to the matrix.
         *
         * @param angle - The angle in radians.
         * @return This matrix. Good for chaining method calls.
         */
        Matrix.prototype.rotate = function (angle) {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            var a1 = this.a;
            var c1 = this.c;
            var tx1 = this.tx;
            this.a = (a1 * cos) - (this.b * sin);
            this.b = (a1 * sin) + (this.b * cos);
            this.c = (c1 * cos) - (this.d * sin);
            this.d = (c1 * sin) + (this.d * cos);
            this.tx = (tx1 * cos) - (this.ty * sin);
            this.ty = (tx1 * sin) + (this.ty * cos);
            return this;
        };
        /**
         * Appends the given Matrix to this Matrix.
         *
         * @param matrix - The matrix to append.
         * @return This matrix. Good for chaining method calls.
         */
        Matrix.prototype.append = function (matrix) {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            this.a = (matrix.a * a1) + (matrix.b * c1);
            this.b = (matrix.a * b1) + (matrix.b * d1);
            this.c = (matrix.c * a1) + (matrix.d * c1);
            this.d = (matrix.c * b1) + (matrix.d * d1);
            this.tx = (matrix.tx * a1) + (matrix.ty * c1) + this.tx;
            this.ty = (matrix.tx * b1) + (matrix.ty * d1) + this.ty;
            return this;
        };
        /**
         * Sets the matrix based on all the available properties
         *
         * @param x - Position on the x axis
         * @param y - Position on the y axis
         * @param pivotX - Pivot on the x axis
         * @param pivotY - Pivot on the y axis
         * @param scaleX - Scale on the x axis
         * @param scaleY - Scale on the y axis
         * @param rotation - Rotation in radians
         * @param skewX - Skew on the x axis
         * @param skewY - Skew on the y axis
         * @return This matrix. Good for chaining method calls.
         */
        Matrix.prototype.setTransform = function (x, y, pivotX, pivotY, scaleX, scaleY, rotation, skewX, skewY) {
            this.a = Math.cos(rotation + skewY) * scaleX;
            this.b = Math.sin(rotation + skewY) * scaleX;
            this.c = -Math.sin(rotation - skewX) * scaleY;
            this.d = Math.cos(rotation - skewX) * scaleY;
            this.tx = x - ((pivotX * this.a) + (pivotY * this.c));
            this.ty = y - ((pivotX * this.b) + (pivotY * this.d));
            return this;
        };
        /**
         * Prepends the given Matrix to this Matrix.
         *
         * @param matrix - The matrix to prepend
         * @return This matrix. Good for chaining method calls.
         */
        Matrix.prototype.prepend = function (matrix) {
            var tx1 = this.tx;
            if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
                var a1 = this.a;
                var c1 = this.c;
                this.a = (a1 * matrix.a) + (this.b * matrix.c);
                this.b = (a1 * matrix.b) + (this.b * matrix.d);
                this.c = (c1 * matrix.a) + (this.d * matrix.c);
                this.d = (c1 * matrix.b) + (this.d * matrix.d);
            }
            this.tx = (tx1 * matrix.a) + (this.ty * matrix.c) + matrix.tx;
            this.ty = (tx1 * matrix.b) + (this.ty * matrix.d) + matrix.ty;
            return this;
        };
        /**
         * Decomposes the matrix (x, y, scaleX, scaleY, and rotation) and sets the properties on to a transform.
         *
         * @param transform - The transform to apply the properties to.
         * @return The transform with the newly applied properties
         */
        Matrix.prototype.decompose = function (transform) {
            // sort out rotation / skew..
            var a = this.a;
            var b = this.b;
            var c = this.c;
            var d = this.d;
            var pivot = transform.pivot;
            var skewX = -Math.atan2(-c, d);
            var skewY = Math.atan2(b, a);
            var delta = Math.abs(skewX + skewY);
            if (delta < 0.00001 || Math.abs(PI_2 - delta) < 0.00001) {
                transform.rotation = skewY;
                transform.skew.x = transform.skew.y = 0;
            }
            else {
                transform.rotation = 0;
                transform.skew.x = skewX;
                transform.skew.y = skewY;
            }
            // next set scale
            transform.scale.x = Math.sqrt((a * a) + (b * b));
            transform.scale.y = Math.sqrt((c * c) + (d * d));
            // next set position
            transform.position.x = this.tx + ((pivot.x * a) + (pivot.y * c));
            transform.position.y = this.ty + ((pivot.x * b) + (pivot.y * d));
            return transform;
        };
        /**
         * Inverts this matrix
         *
         * @return This matrix. Good for chaining method calls.
         */
        Matrix.prototype.invert = function () {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            var tx1 = this.tx;
            var n = (a1 * d1) - (b1 * c1);
            this.a = d1 / n;
            this.b = -b1 / n;
            this.c = -c1 / n;
            this.d = a1 / n;
            this.tx = ((c1 * this.ty) - (d1 * tx1)) / n;
            this.ty = -((a1 * this.ty) - (b1 * tx1)) / n;
            return this;
        };
        /**
         * Resets this Matrix to an identity (default) matrix.
         *
         * @return This matrix. Good for chaining method calls.
         */
        Matrix.prototype.identity = function () {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.tx = 0;
            this.ty = 0;
            return this;
        };
        /**
         * Creates a new Matrix object with the same values as this one.
         *
         * @return A copy of this matrix. Good for chaining method calls.
         */
        Matrix.prototype.clone = function () {
            var matrix = new Matrix();
            matrix.a = this.a;
            matrix.b = this.b;
            matrix.c = this.c;
            matrix.d = this.d;
            matrix.tx = this.tx;
            matrix.ty = this.ty;
            return matrix;
        };
        /**
         * Changes the values of the given matrix to be the same as the ones in this matrix
         *
         * @param matrix - The matrix to copy to.
         * @return The matrix given in parameter with its values updated.
         */
        Matrix.prototype.copyTo = function (matrix) {
            matrix.a = this.a;
            matrix.b = this.b;
            matrix.c = this.c;
            matrix.d = this.d;
            matrix.tx = this.tx;
            matrix.ty = this.ty;
            return matrix;
        };
        /**
         * Changes the values of the matrix to be the same as the ones in given matrix
         *
         * @param {PIXI.Matrix} matrix - The matrix to copy from.
         * @return {PIXI.Matrix} this
         */
        Matrix.prototype.copyFrom = function (matrix) {
            this.a = matrix.a;
            this.b = matrix.b;
            this.c = matrix.c;
            this.d = matrix.d;
            this.tx = matrix.tx;
            this.ty = matrix.ty;
            return this;
        };
        Matrix.prototype.toString = function () {
            return "[@pixi/math:Matrix a=" + this.a + " b=" + this.b + " c=" + this.c + " d=" + this.d + " tx=" + this.tx + " ty=" + this.ty + "]";
        };
        Object.defineProperty(Matrix, "IDENTITY", {
            /**
             * A default (identity) matrix
             *
             * @readonly
             */
            get: function () {
                return new Matrix();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Matrix, "TEMP_MATRIX", {
            /**
             * A temp matrix
             *
             * @readonly
             */
            get: function () {
                return new Matrix();
            },
            enumerable: false,
            configurable: true
        });
        return Matrix;
    }());
  
    // Your friendly neighbour https://en.wikipedia.org/wiki/Dihedral_group
    /*
     * Transform matrix for operation n is:
     * | ux | vx |
     * | uy | vy |
     */
    var ux = [1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1];
    var uy = [0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1];
    var vx = [0, -1, -1, -1, 0, 1, 1, 1, 0, 1, 1, 1, 0, -1, -1, -1];
    var vy = [1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, 1, 1, 1, 0, -1];
    /**
     * [Cayley Table]{@link https://en.wikipedia.org/wiki/Cayley_table}
     * for the composition of each rotation in the dihederal group D8.
     *
     * @type number[][]
     * @private
     */
    var rotationCayley = [];
    /**
     * Matrices for each `GD8Symmetry` rotation.
     *
     * @type Matrix[]
     * @private
     */
    var rotationMatrices = [];
    /*
     * Alias for {@code Math.sign}.
     */
    var signum = Math.sign;
    /*
     * Initializes `rotationCayley` and `rotationMatrices`. It is called
     * only once below.
     */
    function init() {
        for (var i = 0; i < 16; i++) {
            var row = [];
            rotationCayley.push(row);
            for (var j = 0; j < 16; j++) {
                /* Multiplies rotation matrices i and j. */
                var _ux = signum((ux[i] * ux[j]) + (vx[i] * uy[j]));
                var _uy = signum((uy[i] * ux[j]) + (vy[i] * uy[j]));
                var _vx = signum((ux[i] * vx[j]) + (vx[i] * vy[j]));
                var _vy = signum((uy[i] * vx[j]) + (vy[i] * vy[j]));
                /* Finds rotation matrix matching the product and pushes it. */
                for (var k = 0; k < 16; k++) {
                    if (ux[k] === _ux && uy[k] === _uy
                        && vx[k] === _vx && vy[k] === _vy) {
                        row.push(k);
                        break;
                    }
                }
            }
        }
        for (var i = 0; i < 16; i++) {
            var mat = new Matrix();
            mat.set(ux[i], uy[i], vx[i], vy[i], 0, 0);
            rotationMatrices.push(mat);
        }
    }
    init();
    /**
     * @memberof PIXI
     * @typedef {number} GD8Symmetry
     * @see PIXI.groupD8
     */
    /**
     * Implements the dihedral group D8, which is similar to
     * [group D4]{@link http://mathworld.wolfram.com/DihedralGroupD4.html};
     * D8 is the same but with diagonals, and it is used for texture
     * rotations.
     *
     * The directions the U- and V- axes after rotation
     * of an angle of `a: GD8Constant` are the vectors `(uX(a), uY(a))`
     * and `(vX(a), vY(a))`. These aren't necessarily unit vectors.
     *
     * **Origin:**<br>
     *  This is the small part of gameofbombs.com portal system. It works.
     *
     * @see PIXI.groupD8.E
     * @see PIXI.groupD8.SE
     * @see PIXI.groupD8.S
     * @see PIXI.groupD8.SW
     * @see PIXI.groupD8.W
     * @see PIXI.groupD8.NW
     * @see PIXI.groupD8.N
     * @see PIXI.groupD8.NE
     * @author Ivan @ivanpopelyshev
     * @namespace PIXI.groupD8
     * @memberof PIXI
     */
    var groupD8 = {
        /**
         * | Rotation | Direction |
         * |----------|-----------|
         * | 0Â°       | East      |
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        E: 0,
        /**
         * | Rotation | Direction |
         * |----------|-----------|
         * | 45Â°â†»     | Southeast |
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        SE: 1,
        /**
         * | Rotation | Direction |
         * |----------|-----------|
         * | 90Â°â†»     | South     |
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        S: 2,
        /**
         * | Rotation | Direction |
         * |----------|-----------|
         * | 135Â°â†»    | Southwest |
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        SW: 3,
        /**
         * | Rotation | Direction |
         * |----------|-----------|
         * | 180Â°     | West      |
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        W: 4,
        /**
         * | Rotation    | Direction    |
         * |-------------|--------------|
         * | -135Â°/225Â°â†» | Northwest    |
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        NW: 5,
        /**
         * | Rotation    | Direction    |
         * |-------------|--------------|
         * | -90Â°/270Â°â†»  | North        |
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        N: 6,
        /**
         * | Rotation    | Direction    |
         * |-------------|--------------|
         * | -45Â°/315Â°â†»  | Northeast    |
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        NE: 7,
        /**
         * Reflection about Y-axis.
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        MIRROR_VERTICAL: 8,
        /**
         * Reflection about the main diagonal.
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        MAIN_DIAGONAL: 10,
        /**
         * Reflection about X-axis.
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        MIRROR_HORIZONTAL: 12,
        /**
         * Reflection about reverse diagonal.
         *
         * @memberof PIXI.groupD8
         * @constant {PIXI.GD8Symmetry}
         */
        REVERSE_DIAGONAL: 14,
        /**
         * @memberof PIXI.groupD8
         * @param {PIXI.GD8Symmetry} ind - sprite rotation angle.
         * @return {PIXI.GD8Symmetry} The X-component of the U-axis
         *    after rotating the axes.
         */
        uX: function (ind) { return ux[ind]; },
        /**
         * @memberof PIXI.groupD8
         * @param {PIXI.GD8Symmetry} ind - sprite rotation angle.
         * @return {PIXI.GD8Symmetry} The Y-component of the U-axis
         *    after rotating the axes.
         */
        uY: function (ind) { return uy[ind]; },
        /**
         * @memberof PIXI.groupD8
         * @param {PIXI.GD8Symmetry} ind - sprite rotation angle.
         * @return {PIXI.GD8Symmetry} The X-component of the V-axis
         *    after rotating the axes.
         */
        vX: function (ind) { return vx[ind]; },
        /**
         * @memberof PIXI.groupD8
         * @param {PIXI.GD8Symmetry} ind - sprite rotation angle.
         * @return {PIXI.GD8Symmetry} The Y-component of the V-axis
         *    after rotating the axes.
         */
        vY: function (ind) { return vy[ind]; },
        /**
         * @memberof PIXI.groupD8
         * @param {PIXI.GD8Symmetry} rotation - symmetry whose opposite
         *   is needed. Only rotations have opposite symmetries while
         *   reflections don't.
         * @return {PIXI.GD8Symmetry} The opposite symmetry of `rotation`
         */
        inv: function (rotation) {
            if (rotation & 8) // true only if between 8 & 15 (reflections)
             {
                return rotation & 15; // or rotation % 16
            }
            return (-rotation) & 7; // or (8 - rotation) % 8
        },
        /**
         * Composes the two D8 operations.
         *
         * Taking `^` as reflection:
         *
         * |       | E=0 | S=2 | W=4 | N=6 | E^=8 | S^=10 | W^=12 | N^=14 |
         * |-------|-----|-----|-----|-----|------|-------|-------|-------|
         * | E=0   | E   | S   | W   | N   | E^   | S^    | W^    | N^    |
         * | S=2   | S   | W   | N   | E   | S^   | W^    | N^    | E^    |
         * | W=4   | W   | N   | E   | S   | W^   | N^    | E^    | S^    |
         * | N=6   | N   | E   | S   | W   | N^   | E^    | S^    | W^    |
         * | E^=8  | E^  | N^  | W^  | S^  | E    | N     | W     | S     |
         * | S^=10 | S^  | E^  | N^  | W^  | S    | E     | N     | W     |
         * | W^=12 | W^  | S^  | E^  | N^  | W    | S     | E     | N     |
         * | N^=14 | N^  | W^  | S^  | E^  | N    | W     | S     | E     |
         *
         * [This is a Cayley table]{@link https://en.wikipedia.org/wiki/Cayley_table}
         * @memberof PIXI.groupD8
         * @param {PIXI.GD8Symmetry} rotationSecond - Second operation, which
         *   is the row in the above cayley table.
         * @param {PIXI.GD8Symmetry} rotationFirst - First operation, which
         *   is the column in the above cayley table.
         * @return {PIXI.GD8Symmetry} Composed operation
         */
        add: function (rotationSecond, rotationFirst) { return (rotationCayley[rotationSecond][rotationFirst]); },
        /**
         * Reverse of `add`.
         *
         * @memberof PIXI.groupD8
         * @param {PIXI.GD8Symmetry} rotationSecond - Second operation
         * @param {PIXI.GD8Symmetry} rotationFirst - First operation
         * @return {PIXI.GD8Symmetry} Result
         */
        sub: function (rotationSecond, rotationFirst) { return (rotationCayley[rotationSecond][groupD8.inv(rotationFirst)]); },
        /**
         * Adds 180 degrees to rotation, which is a commutative
         * operation.
         *
         * @memberof PIXI.groupD8
         * @param {number} rotation - The number to rotate.
         * @returns {number} Rotated number
         */
        rotate180: function (rotation) { return rotation ^ 4; },
        /**
         * Checks if the rotation angle is vertical, i.e. south
         * or north. It doesn't work for reflections.
         *
         * @memberof PIXI.groupD8
         * @param {PIXI.GD8Symmetry} rotation - The number to check.
         * @returns {boolean} Whether or not the direction is vertical
         */
        isVertical: function (rotation) { return (rotation & 3) === 2; },
        /**
         * Approximates the vector `V(dx,dy)` into one of the
         * eight directions provided by `groupD8`.
         *
         * @memberof PIXI.groupD8
         * @param {number} dx - X-component of the vector
         * @param {number} dy - Y-component of the vector
         * @return {PIXI.GD8Symmetry} Approximation of the vector into
         *  one of the eight symmetries.
         */
        byDirection: function (dx, dy) {
            if (Math.abs(dx) * 2 <= Math.abs(dy)) {
                if (dy >= 0) {
                    return groupD8.S;
                }
                return groupD8.N;
            }
            else if (Math.abs(dy) * 2 <= Math.abs(dx)) {
                if (dx > 0) {
                    return groupD8.E;
                }
                return groupD8.W;
            }
            else if (dy > 0) {
                if (dx > 0) {
                    return groupD8.SE;
                }
                return groupD8.SW;
            }
            else if (dx > 0) {
                return groupD8.NE;
            }
            return groupD8.NW;
        },
        /**
         * Helps sprite to compensate texture packer rotation.
         *
         * @memberof PIXI.groupD8
         * @param {PIXI.Matrix} matrix - sprite world matrix
         * @param {PIXI.GD8Symmetry} rotation - The rotation factor to use.
         * @param {number} tx - sprite anchoring
         * @param {number} ty - sprite anchoring
         */
        matrixAppendRotationInv: function (matrix, rotation, tx, ty) {
            if (tx === void 0) { tx = 0; }
            if (ty === void 0) { ty = 0; }
            // Packer used "rotation", we use "inv(rotation)"
            var mat = rotationMatrices[groupD8.inv(rotation)];
            mat.tx = tx;
            mat.ty = ty;
            matrix.append(mat);
        },
    };
  
    /**
     * Transform that takes care about its versions.
     *
     * @memberof PIXI
     */
    var Transform = /** @class */ (function () {
        function Transform() {
            this.worldTransform = new Matrix();
            this.localTransform = new Matrix();
            this.position = new ObservablePoint(this.onChange, this, 0, 0);
            this.scale = new ObservablePoint(this.onChange, this, 1, 1);
            this.pivot = new ObservablePoint(this.onChange, this, 0, 0);
            this.skew = new ObservablePoint(this.updateSkew, this, 0, 0);
            this._rotation = 0;
            this._cx = 1;
            this._sx = 0;
            this._cy = 0;
            this._sy = 1;
            this._localID = 0;
            this._currentLocalID = 0;
            this._worldID = 0;
            this._parentID = 0;
        }
        /** Called when a value changes. */
        Transform.prototype.onChange = function () {
            this._localID++;
        };
        /** Called when the skew or the rotation changes. */
        Transform.prototype.updateSkew = function () {
            this._cx = Math.cos(this._rotation + this.skew.y);
            this._sx = Math.sin(this._rotation + this.skew.y);
            this._cy = -Math.sin(this._rotation - this.skew.x); // cos, added PI/2
            this._sy = Math.cos(this._rotation - this.skew.x); // sin, added PI/2
            this._localID++;
        };
        Transform.prototype.toString = function () {
            return "[@pixi/math:Transform "
                + ("position=(" + this.position.x + ", " + this.position.y + ") ")
                + ("rotation=" + this.rotation + " ")
                + ("scale=(" + this.scale.x + ", " + this.scale.y + ") ")
                + ("skew=(" + this.skew.x + ", " + this.skew.y + ") ")
                + "]";
        };
        /** Updates the local transformation matrix. */
        Transform.prototype.updateLocalTransform = function () {
            var lt = this.localTransform;
            if (this._localID !== this._currentLocalID) {
                // get the matrix values of the displayobject based on its transform properties..
                lt.a = this._cx * this.scale.x;
                lt.b = this._sx * this.scale.x;
                lt.c = this._cy * this.scale.y;
                lt.d = this._sy * this.scale.y;
                lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
                lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
                this._currentLocalID = this._localID;
                // force an update..
                this._parentID = -1;
            }
        };
        /**
         * Updates the local and the world transformation matrices.
         *
         * @param parentTransform - The parent transform
         */
        Transform.prototype.updateTransform = function (parentTransform) {
            var lt = this.localTransform;
            if (this._localID !== this._currentLocalID) {
                // get the matrix values of the displayobject based on its transform properties..
                lt.a = this._cx * this.scale.x;
                lt.b = this._sx * this.scale.x;
                lt.c = this._cy * this.scale.y;
                lt.d = this._sy * this.scale.y;
                lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
                lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
                this._currentLocalID = this._localID;
                // force an update..
                this._parentID = -1;
            }
            if (this._parentID !== parentTransform._worldID) {
                // concat the parent matrix with the objects transform.
                var pt = parentTransform.worldTransform;
                var wt = this.worldTransform;
                wt.a = (lt.a * pt.a) + (lt.b * pt.c);
                wt.b = (lt.a * pt.b) + (lt.b * pt.d);
                wt.c = (lt.c * pt.a) + (lt.d * pt.c);
                wt.d = (lt.c * pt.b) + (lt.d * pt.d);
                wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
                wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;
                this._parentID = parentTransform._worldID;
                // update the id of the transform..
                this._worldID++;
            }
        };
        /**
         * Decomposes a matrix and sets the transforms properties based on it.
         *
         * @param matrix - The matrix to decompose
         */
        Transform.prototype.setFromMatrix = function (matrix) {
            matrix.decompose(this);
            this._localID++;
        };
        Object.defineProperty(Transform.prototype, "rotation", {
            /** The rotation of the object in radians. */
            get: function () {
                return this._rotation;
            },
            set: function (value) {
                if (this._rotation !== value) {
                    this._rotation = value;
                    this.updateSkew();
                }
            },
            enumerable: false,
            configurable: true
        });
        /** A default (identity) transform. */
        Transform.IDENTITY = new Transform();
        return Transform;
    }());
  
    /*!
     * @pixi/display - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/display is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
  
    /**
     * Sets the default value for the container property 'sortableChildren'.
     * If set to true, the container will sort its children by zIndex value
     * when updateTransform() is called, or manually if sortChildren() is called.
     *
     * This actually changes the order of elements in the array, so should be treated
     * as a basic solution that is not performant compared to other solutions,
     * such as @link https://github.com/pixijs/pixi-display
     *
     * Also be aware of that this may not work nicely with the addChildAt() function,
     * as the zIndex sorting may cause the child to automatically sorted to another position.
     *
     * @static
     * @constant
     * @name SORTABLE_CHILDREN
     * @memberof PIXI.settings
     * @type {boolean}
     * @default false
     */
    settings.SORTABLE_CHILDREN = false;
  
    /**
     * 'Builder' pattern for bounds rectangles.
     *
     * This could be called an Axis-Aligned Bounding Box.
     * It is not an actual shape. It is a mutable thing; no 'EMPTY' or those kind of problems.
     *
     * @memberof PIXI
     */
    var Bounds = /** @class */ (function () {
        function Bounds() {
            this.minX = Infinity;
            this.minY = Infinity;
            this.maxX = -Infinity;
            this.maxY = -Infinity;
            this.rect = null;
            this.updateID = -1;
        }
        /**
         * Checks if bounds are empty.
         *
         * @return - True if empty.
         */
        Bounds.prototype.isEmpty = function () {
            return this.minX > this.maxX || this.minY > this.maxY;
        };
        /** Clears the bounds and resets. */
        Bounds.prototype.clear = function () {
            this.minX = Infinity;
            this.minY = Infinity;
            this.maxX = -Infinity;
            this.maxY = -Infinity;
        };
        /**
         * Can return Rectangle.EMPTY constant, either construct new rectangle, either use your rectangle
         * It is not guaranteed that it will return tempRect
         *
         * @param rect - Temporary object will be used if AABB is not empty
         * @returns - A rectangle of the bounds
         */
        Bounds.prototype.getRectangle = function (rect) {
            if (this.minX > this.maxX || this.minY > this.maxY) {
                return Rectangle.EMPTY;
            }
            rect = rect || new Rectangle(0, 0, 1, 1);
            rect.x = this.minX;
            rect.y = this.minY;
            rect.width = this.maxX - this.minX;
            rect.height = this.maxY - this.minY;
            return rect;
        };
        /**
         * This function should be inlined when its possible.
         *
         * @param point - The point to add.
         */
        Bounds.prototype.addPoint = function (point) {
            this.minX = Math.min(this.minX, point.x);
            this.maxX = Math.max(this.maxX, point.x);
            this.minY = Math.min(this.minY, point.y);
            this.maxY = Math.max(this.maxY, point.y);
        };
        /** Adds a point, after transformed. This should be inlined when its possible. */
        Bounds.prototype.addPointMatrix = function (matrix, point) {
            var a = matrix.a, b = matrix.b, c = matrix.c, d = matrix.d, tx = matrix.tx, ty = matrix.ty;
            var x = (a * point.x) + (c * point.y) + tx;
            var y = (b * point.x) + (d * point.y) + ty;
            this.minX = Math.min(this.minX, x);
            this.maxX = Math.max(this.maxX, x);
            this.minY = Math.min(this.minY, y);
            this.maxY = Math.max(this.maxY, y);
        };
        /**
         * Adds a quad, not transformed
         *
         * @param vertices - The verts to add.
         */
        Bounds.prototype.addQuad = function (vertices) {
            var minX = this.minX;
            var minY = this.minY;
            var maxX = this.maxX;
            var maxY = this.maxY;
            var x = vertices[0];
            var y = vertices[1];
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
            x = vertices[2];
            y = vertices[3];
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
            x = vertices[4];
            y = vertices[5];
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
            x = vertices[6];
            y = vertices[7];
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
            this.minX = minX;
            this.minY = minY;
            this.maxX = maxX;
            this.maxY = maxY;
        };
        /**
         * Adds sprite frame, transformed.
         *
         * @param transform - transform to apply
         * @param x0 - left X of frame
         * @param y0 - top Y of frame
         * @param x1 - right X of frame
         * @param y1 - bottom Y of frame
         */
        Bounds.prototype.addFrame = function (transform, x0, y0, x1, y1) {
            this.addFrameMatrix(transform.worldTransform, x0, y0, x1, y1);
        };
        /**
         * Adds sprite frame, multiplied by matrix
         *
         * @param matrix - matrix to apply
         * @param x0 - left X of frame
         * @param y0 - top Y of frame
         * @param x1 - right X of frame
         * @param y1 - bottom Y of frame
         */
        Bounds.prototype.addFrameMatrix = function (matrix, x0, y0, x1, y1) {
            var a = matrix.a;
            var b = matrix.b;
            var c = matrix.c;
            var d = matrix.d;
            var tx = matrix.tx;
            var ty = matrix.ty;
            var minX = this.minX;
            var minY = this.minY;
            var maxX = this.maxX;
            var maxY = this.maxY;
            var x = (a * x0) + (c * y0) + tx;
            var y = (b * x0) + (d * y0) + ty;
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
            x = (a * x1) + (c * y0) + tx;
            y = (b * x1) + (d * y0) + ty;
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
            x = (a * x0) + (c * y1) + tx;
            y = (b * x0) + (d * y1) + ty;
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
            x = (a * x1) + (c * y1) + tx;
            y = (b * x1) + (d * y1) + ty;
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
            this.minX = minX;
            this.minY = minY;
            this.maxX = maxX;
            this.maxY = maxY;
        };
        /**
         * Adds screen vertices from array
         *
         * @param vertexData - calculated vertices
         * @param beginOffset - begin offset
         * @param endOffset - end offset, excluded
         */
        Bounds.prototype.addVertexData = function (vertexData, beginOffset, endOffset) {
            var minX = this.minX;
            var minY = this.minY;
            var maxX = this.maxX;
            var maxY = this.maxY;
            for (var i = beginOffset; i < endOffset; i += 2) {
                var x = vertexData[i];
                var y = vertexData[i + 1];
                minX = x < minX ? x : minX;
                minY = y < minY ? y : minY;
                maxX = x > maxX ? x : maxX;
                maxY = y > maxY ? y : maxY;
            }
            this.minX = minX;
            this.minY = minY;
            this.maxX = maxX;
            this.maxY = maxY;
        };
        /**
         * Add an array of mesh vertices
         *
         * @param transform - mesh transform
         * @param vertices - mesh coordinates in array
         * @param beginOffset - begin offset
         * @param endOffset - end offset, excluded
         */
        Bounds.prototype.addVertices = function (transform, vertices, beginOffset, endOffset) {
            this.addVerticesMatrix(transform.worldTransform, vertices, beginOffset, endOffset);
        };
        /**
         * Add an array of mesh vertices.
         *
         * @param matrix - mesh matrix
         * @param vertices - mesh coordinates in array
         * @param beginOffset - begin offset
         * @param endOffset - end offset, excluded
         * @param padX - x padding
         * @param padY - y padding
         */
        Bounds.prototype.addVerticesMatrix = function (matrix, vertices, beginOffset, endOffset, padX, padY) {
            if (padX === void 0) { padX = 0; }
            if (padY === void 0) { padY = padX; }
            var a = matrix.a;
            var b = matrix.b;
            var c = matrix.c;
            var d = matrix.d;
            var tx = matrix.tx;
            var ty = matrix.ty;
            var minX = this.minX;
            var minY = this.minY;
            var maxX = this.maxX;
            var maxY = this.maxY;
            for (var i = beginOffset; i < endOffset; i += 2) {
                var rawX = vertices[i];
                var rawY = vertices[i + 1];
                var x = (a * rawX) + (c * rawY) + tx;
                var y = (d * rawY) + (b * rawX) + ty;
                minX = Math.min(minX, x - padX);
                maxX = Math.max(maxX, x + padX);
                minY = Math.min(minY, y - padY);
                maxY = Math.max(maxY, y + padY);
            }
            this.minX = minX;
            this.minY = minY;
            this.maxX = maxX;
            this.maxY = maxY;
        };
        /**
         * Adds other {@link Bounds}.
         *
         * @param bounds - The Bounds to be added
         */
        Bounds.prototype.addBounds = function (bounds) {
            var minX = this.minX;
            var minY = this.minY;
            var maxX = this.maxX;
            var maxY = this.maxY;
            this.minX = bounds.minX < minX ? bounds.minX : minX;
            this.minY = bounds.minY < minY ? bounds.minY : minY;
            this.maxX = bounds.maxX > maxX ? bounds.maxX : maxX;
            this.maxY = bounds.maxY > maxY ? bounds.maxY : maxY;
        };
        /**
         * Adds other Bounds, masked with Bounds.
         *
         * @param bounds - The Bounds to be added.
         * @param mask - TODO
         */
        Bounds.prototype.addBoundsMask = function (bounds, mask) {
            var _minX = bounds.minX > mask.minX ? bounds.minX : mask.minX;
            var _minY = bounds.minY > mask.minY ? bounds.minY : mask.minY;
            var _maxX = bounds.maxX < mask.maxX ? bounds.maxX : mask.maxX;
            var _maxY = bounds.maxY < mask.maxY ? bounds.maxY : mask.maxY;
            if (_minX <= _maxX && _minY <= _maxY) {
                var minX = this.minX;
                var minY = this.minY;
                var maxX = this.maxX;
                var maxY = this.maxY;
                this.minX = _minX < minX ? _minX : minX;
                this.minY = _minY < minY ? _minY : minY;
                this.maxX = _maxX > maxX ? _maxX : maxX;
                this.maxY = _maxY > maxY ? _maxY : maxY;
            }
        };
        /**
         * Adds other Bounds, multiplied by matrix. Bounds shouldn't be empty.
         *
         * @param bounds - other bounds
         * @param matrix - multiplicator
         */
        Bounds.prototype.addBoundsMatrix = function (bounds, matrix) {
            this.addFrameMatrix(matrix, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
        };
        /**
         * Adds other Bounds, masked with Rectangle.
         *
         * @param bounds - TODO
         * @param area - TODO
         */
        Bounds.prototype.addBoundsArea = function (bounds, area) {
            var _minX = bounds.minX > area.x ? bounds.minX : area.x;
            var _minY = bounds.minY > area.y ? bounds.minY : area.y;
            var _maxX = bounds.maxX < area.x + area.width ? bounds.maxX : (area.x + area.width);
            var _maxY = bounds.maxY < area.y + area.height ? bounds.maxY : (area.y + area.height);
            if (_minX <= _maxX && _minY <= _maxY) {
                var minX = this.minX;
                var minY = this.minY;
                var maxX = this.maxX;
                var maxY = this.maxY;
                this.minX = _minX < minX ? _minX : minX;
                this.minY = _minY < minY ? _minY : minY;
                this.maxX = _maxX > maxX ? _maxX : maxX;
                this.maxY = _maxY > maxY ? _maxY : maxY;
            }
        };
        /**
         * Pads bounds object, making it grow in all directions.
         * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
         *
         * @param paddingX - The horizontal padding amount.
         * @param paddingY - The vertical padding amount.
         */
        Bounds.prototype.pad = function (paddingX, paddingY) {
            if (paddingX === void 0) { paddingX = 0; }
            if (paddingY === void 0) { paddingY = paddingX; }
            if (!this.isEmpty()) {
                this.minX -= paddingX;
                this.maxX += paddingX;
                this.minY -= paddingY;
                this.maxY += paddingY;
            }
        };
        /**
         * Adds padded frame. (x0, y0) should be strictly less than (x1, y1)
         *
         * @param x0 - left X of frame
         * @param y0 - top Y of frame
         * @param x1 - right X of frame
         * @param y1 - bottom Y of frame
         * @param padX - padding X
         * @param padY - padding Y
         */
        Bounds.prototype.addFramePad = function (x0, y0, x1, y1, padX, padY) {
            x0 -= padX;
            y0 -= padY;
            x1 += padX;
            y1 += padY;
            this.minX = this.minX < x0 ? this.minX : x0;
            this.maxX = this.maxX > x1 ? this.maxX : x1;
            this.minY = this.minY < y0 ? this.minY : y0;
            this.maxY = this.maxY > y1 ? this.maxY : y1;
        };
        return Bounds;
    }());
  
    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0
  
    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.
  
    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */
  
    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
        return extendStatics(d, b);
    };
  
    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
  
    /**
     * The base class for all objects that are rendered on the screen.
     *
     * This is an abstract class and can not be used on its own; rather it should be extended.
     *
     * ## Display objects implemented in PixiJS
     *
     * | Display Object                  | Description                                                           |
     * | ------------------------------- | --------------------------------------------------------------------- |
     * | {@link PIXI.Container}          | Adds support for `children` to DisplayObject                          |
     * | {@link PIXI.Graphics}           | Shape-drawing display object similar to the Canvas API                |
     * | {@link PIXI.Sprite}             | Draws textures (i.e. images)                                          |
     * | {@link PIXI.Text}               | Draws text using the Canvas API internally                            |
     * | {@link PIXI.BitmapText}         | More scaleable solution for text rendering, reusing glyph textures    |
     * | {@link PIXI.TilingSprite}       | Draws textures/images in a tiled fashion                              |
     * | {@link PIXI.AnimatedSprite}     | Draws an animation of multiple images                                 |
     * | {@link PIXI.Mesh}               | Provides a lower-level API for drawing meshes with custom data        |
     * | {@link PIXI.NineSlicePlane}     | Mesh-related                                                          |
     * | {@link PIXI.SimpleMesh}         | v4-compatible mesh                                                    |
     * | {@link PIXI.SimplePlane}        | Mesh-related                                                          |
     * | {@link PIXI.SimpleRope}         | Mesh-related                                                          |
     *
     * ## Transforms
     *
     * The [transform]{@link DisplayObject#transform} of a display object describes the projection from its
     * local coordinate space to its parent's local coordinate space. The following properties are derived
     * from the transform:
     *
     * <table>
     *   <thead>
     *     <tr>
     *       <th>Property</th>
     *       <th>Description</th>
     *     </tr>
     *   </thead>
     *   <tbody>
     *     <tr>
     *       <td>[pivot]{@link PIXI.DisplayObject#pivot}</td>
     *       <td>
     *         Invariant under rotation, scaling, and skewing. The projection of into the parent's space of the pivot
     *         is equal to position, regardless of the other three transformations. In other words, It is the center of
     *         rotation, scaling, and skewing.
     *       </td>
     *     </tr>
     *     <tr>
     *       <td>[position]{@link PIXI.DisplayObject#position}</td>
     *       <td>
     *         Translation. This is the position of the [pivot]{@link PIXI.DisplayObject#pivot} in the parent's local
     *         space. The default value of the pivot is the origin (0,0). If the top-left corner of your display object
     *         is (0,0) in its local space, then the position will be its top-left corner in the parent's local space.
     *       </td>
     *     </tr>
     *     <tr>
     *       <td>[scale]{@link PIXI.DisplayObject#scale}</td>
     *       <td>
     *         Scaling. This will stretch (or compress) the display object's projection. The scale factors are along the
     *         local coordinate axes. In other words, the display object is scaled before rotated or skewed. The center
     *         of scaling is the [pivot]{@link PIXI.DisplayObject#pivot}.
     *       </td>
     *     </tr>
     *     <tr>
     *       <td>[rotation]{@link PIXI.DisplayObject#rotation}</td>
     *       <td>
     *          Rotation. This will rotate the display object's projection by this angle (in radians).
     *       </td>
     *     </tr>
     *     <tr>
     *       <td>[skew]{@link PIXI.DisplayObject#skew}</td>
     *       <td>
     *         <p>Skewing. This can be used to deform a rectangular display object into a parallelogram.</p>
     *         <p>
     *         In PixiJS, skew has a slightly different behaviour than the conventional meaning. It can be
     *         thought of the net rotation applied to the coordinate axes (separately). For example, if "skew.x" is
     *         âº and "skew.y" is Î², then the line x = 0 will be rotated by âº (y = -x*cotâº) and the line y = 0 will be
     *         rotated by Î² (y = x*tanÎ²). A line y = x*tanÏ´ (i.e. a line at angle Ï´ to the x-axis in local-space) will
     *         be rotated by an angle between âº and Î².
     *         </p>
     *         <p>
     *         It can be observed that if skew is applied equally to both axes, then it will be equivalent to applying
     *         a rotation. Indeed, if "skew.x" = -Ï´ and "skew.y" = Ï´, it will produce an equivalent of "rotation" = Ï´.
     *         </p>
     *         <p>
     *         Another quite interesting observation is that "skew.x", "skew.y", rotation are communtative operations. Indeed,
     *         because rotation is essentially a careful combination of the two.
     *         </p>
     *       </td>
     *     </tr>
     *     <tr>
     *       <td>angle</td>
     *       <td>Rotation. This is an alias for [rotation]{@link PIXI.DisplayObject#rotation}, but in degrees.</td>
     *     </tr>
     *     <tr>
     *       <td>x</td>
     *       <td>Translation. This is an alias for position.x!</td>
     *     </tr>
     *     <tr>
     *       <td>y</td>
     *       <td>Translation. This is an alias for position.y!</td>
     *     </tr>
     *     <tr>
     *       <td>width</td>
     *       <td>
     *         Implemented in [Container]{@link PIXI.Container}. Scaling. The width property calculates scale.x by dividing
     *         the "requested" width by the local bounding box width. It is indirectly an abstraction over scale.x, and there
     *         is no concept of user-defined width.
     *       </td>
     *     </tr>
     *     <tr>
     *       <td>height</td>
     *       <td>
     *         Implemented in [Container]{@link PIXI.Container}. Scaling. The height property calculates scale.y by dividing
     *         the "requested" height by the local bounding box height. It is indirectly an abstraction over scale.y, and there
     *         is no concept of user-defined height.
     *       </td>
     *     </tr>
     *   </tbody>
     * </table>
     *
     * ## Bounds
     *
     * The bounds of a display object is defined by the minimum axis-aligned rectangle in world space that can fit
     * around it. The abstract `calculateBounds` method is responsible for providing it (and it should use the
     * `worldTransform` to calculate in world space).
     *
     * There are a few additional types of bounding boxes:
     *
     * | Bounds                | Description                                                                              |
     * | --------------------- | ---------------------------------------------------------------------------------------- |
     * | World Bounds          | This is synonymous is the regular bounds described above. See `getBounds()`.             |
     * | Local Bounds          | This the axis-aligned bounding box in the parent's local space. See `getLocalBounds()`.  |
     * | Render Bounds         | The bounds, but including extra rendering effects like filter padding.                   |
     * | Projected Bounds      | The bounds of the projected display object onto the screen. Usually equals world bounds. |
     * | Relative Bounds       | The bounds of a display object when projected onto a ancestor's (or parent's) space.     |
     * | Natural Bounds        | The bounds of an object in its own local space (not parent's space, like in local bounds)|
     * | Content Bounds        | The natural bounds when excluding all children of a `Container`.                         |
     *
     * ### calculateBounds
     *
     * [Container]{@link Container} already implements `calculateBounds` in a manner that includes children.
     *
     * But for a non-Container display object, the `calculateBounds` method must be overridden in order for `getBounds` and
     * `getLocalBounds` to work. This method must write the bounds into `this._bounds`.
     *
     * Generally, the following technique works for most simple cases: take the list of points
     * forming the "hull" of the object (i.e. outline of the object's shape), and then add them
     * using {@link PIXI.Bounds#addPointMatrix}.
     *
     * ```js
     * calculateBounds(): void
     * {
     *     const points = [...];
     *
     *     for (let i = 0, j = points.length; i < j; i++)
     *     {
     *         this._bounds.addPointMatrix(this.worldTransform, points[i]);
     *     }
     * }
     * ```
     *
     * You can optimize this for a large number of points by using {@link PIXI.Bounds#addVerticesMatrix} to pass them
     * in one array together.
     *
     * ## Alpha
     *
     * This alpha sets a display object's **relative opacity** w.r.t its parent. For example, if the alpha of a display
     * object is 0.5 and its parent's alpha is 0.5, then it will be rendered with 25% opacity (assuming alpha is not
     * applied on any ancestor further up the chain).
     *
     * The alpha with which the display object will be rendered is called the [worldAlpha]{@link PIXI.DisplayObject#worldAlpha}.
     *
     * ## Renderable vs Visible
     *
     * The `renderable` and `visible` properties can be used to prevent a display object from being rendered to the
     * screen. However, there is a subtle difference between the two. When using `renderable`, the transforms  of the display
     * object (and its children subtree) will continue to be calculated. When using `visible`, the transforms will not
     * be calculated.
     *
     * It is recommended that applications use the `renderable` property for culling. See
     * [@pixi-essentials/cull]{@link https://www.npmjs.com/package/@pixi-essentials/cull} or
     * [pixi-cull]{@link https://www.npmjs.com/package/pixi-cull} for more details.
     *
     * Otherwise, to prevent an object from rendering in the general-purpose sense - `visible` is the property to use. This
     * one is also better in terms of performance.
     *
     * @memberof PIXI
     */
    var DisplayObject = /** @class */ (function (_super) {
        __extends(DisplayObject, _super);
        function DisplayObject() {
            var _this = _super.call(this) || this;
            _this.tempDisplayObjectParent = null;
            // TODO: need to create Transform from factory
            _this.transform = new Transform();
            _this.alpha = 1;
            _this.visible = true;
            _this.renderable = true;
            _this.cullable = false;
            _this.cullArea = null;
            _this.parent = null;
            _this.worldAlpha = 1;
            _this._lastSortedIndex = 0;
            _this._zIndex = 0;
            _this.filterArea = null;
            _this.filters = null;
            _this._enabledFilters = null;
            _this._bounds = new Bounds();
            _this._localBounds = null;
            _this._boundsID = 0;
            _this._boundsRect = null;
            _this._localBoundsRect = null;
            _this._mask = null;
            _this._maskRefCount = 0;
            _this._destroyed = false;
            _this.isSprite = false;
            _this.isMask = false;
            return _this;
        }
        /**
         * Mixes all enumerable properties and methods from a source object to DisplayObject.
         *
         * @param source - The source of properties and methods to mix in.
         */
        DisplayObject.mixin = function (source) {
            // in ES8/ES2017, this would be really easy:
            // Object.defineProperties(DisplayObject.prototype, Object.getOwnPropertyDescriptors(source));
            // get all the enumerable property keys
            var keys = Object.keys(source);
            // loop through properties
            for (var i = 0; i < keys.length; ++i) {
                var propertyName = keys[i];
                // Set the property using the property descriptor - this works for accessors and normal value properties
                Object.defineProperty(DisplayObject.prototype, propertyName, Object.getOwnPropertyDescriptor(source, propertyName));
            }
        };
        Object.defineProperty(DisplayObject.prototype, "destroyed", {
            /**
             * Fired when this DisplayObject is added to a Container.
             *
             * @instance
             * @event added
             * @param {PIXI.Container} container - The container added to.
             */
            /**
             * Fired when this DisplayObject is removed from a Container.
             *
             * @instance
             * @event removed
             * @param {PIXI.Container} container - The container removed from.
             */
            /**
             * Fired when this DisplayObject is destroyed.
             *
             * @instance
             * @event destroyed
             */
            /** Readonly flag for destroyed display objects. */
            get: function () {
                return this._destroyed;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Recursively updates transform of all objects from the root to this one
         * internal function for toLocal()
         */
        DisplayObject.prototype._recursivePostUpdateTransform = function () {
            if (this.parent) {
                this.parent._recursivePostUpdateTransform();
                this.transform.updateTransform(this.parent.transform);
            }
            else {
                this.transform.updateTransform(this._tempDisplayObjectParent.transform);
            }
        };
        /**
         * Updates the object transform for rendering.
         *
         * TODO - Optimization pass!
         */
        DisplayObject.prototype.updateTransform = function () {
            this._boundsID++;
            this.transform.updateTransform(this.parent.transform);
            // multiply the alphas..
            this.worldAlpha = this.alpha * this.parent.worldAlpha;
        };
        /**
         * Calculates and returns the (world) bounds of the display object as a [Rectangle]{@link PIXI.Rectangle}.
         *
         * This method is expensive on containers with a large subtree (like the stage). This is because the bounds
         * of a container depend on its children's bounds, which recursively causes all bounds in the subtree to
         * be recalculated. The upside, however, is that calling `getBounds` once on a container will indeed update
         * the bounds of all children (the whole subtree, in fact). This side effect should be exploited by using
         * `displayObject._bounds.getRectangle()` when traversing through all the bounds in a scene graph. Otherwise,
         * calling `getBounds` on each object in a subtree will cause the total cost to increase quadratically as
         * its height increases.
         *
         * * The transforms of all objects in a container's **subtree** and of all **ancestors** are updated.
         * * The world bounds of all display objects in a container's **subtree** will also be recalculated.
         *
         * The `_bounds` object stores the last calculation of the bounds. You can use to entirely skip bounds
         * calculation if needed.
         *
         * ```js
         * const lastCalculatedBounds = displayObject._bounds.getRectangle(optionalRect);
         * ```
         *
         * Do know that usage of `getLocalBounds` can corrupt the `_bounds` of children (the whole subtree, actually). This
         * is a known issue that has not been solved. See [getLocalBounds]{@link PIXI.DisplayObject#getLocalBounds} for more
         * details.
         *
         * `getBounds` should be called with `skipUpdate` equal to `true` in a render() call. This is because the transforms
         * are guaranteed to be update-to-date. In fact, recalculating inside a render() call may cause corruption in certain
         * cases.
         *
         * @param skipUpdate - Setting to `true` will stop the transforms of the scene graph from
         *  being updated. This means the calculation returned MAY be out of date BUT will give you a
         *  nice performance boost.
         * @param rect - Optional rectangle to store the result of the bounds calculation.
         * @return - The minimum axis-aligned rectangle in world space that fits around this object.
         */
        DisplayObject.prototype.getBounds = function (skipUpdate, rect) {
            if (!skipUpdate) {
                if (!this.parent) {
                    this.parent = this._tempDisplayObjectParent;
                    this.updateTransform();
                    this.parent = null;
                }
                else {
                    this._recursivePostUpdateTransform();
                    this.updateTransform();
                }
            }
            if (this._bounds.updateID !== this._boundsID) {
                this.calculateBounds();
                this._bounds.updateID = this._boundsID;
            }
            if (!rect) {
                if (!this._boundsRect) {
                    this._boundsRect = new Rectangle();
                }
                rect = this._boundsRect;
            }
            return this._bounds.getRectangle(rect);
        };
        /**
         * Retrieves the local bounds of the displayObject as a rectangle object.
         *
         * @param rect - Optional rectangle to store the result of the bounds calculation.
         * @return - The rectangular bounding area.
         */
        DisplayObject.prototype.getLocalBounds = function (rect) {
            if (!rect) {
                if (!this._localBoundsRect) {
                    this._localBoundsRect = new Rectangle();
                }
                rect = this._localBoundsRect;
            }
            if (!this._localBounds) {
                this._localBounds = new Bounds();
            }
            var transformRef = this.transform;
            var parentRef = this.parent;
            this.parent = null;
            this.transform = this._tempDisplayObjectParent.transform;
            var worldBounds = this._bounds;
            var worldBoundsID = this._boundsID;
            this._bounds = this._localBounds;
            var bounds = this.getBounds(false, rect);
            this.parent = parentRef;
            this.transform = transformRef;
            this._bounds = worldBounds;
            this._bounds.updateID += this._boundsID - worldBoundsID; // reflect side-effects
            return bounds;
        };
        /**
         * Calculates the global position of the display object.
         *
         * @param position - The world origin to calculate from.
         * @param point - A Point object in which to store the value, optional
         *  (otherwise will create a new Point).
         * @param skipUpdate - Should we skip the update transform.
         * @return - A point object representing the position of this object.
         */
        DisplayObject.prototype.toGlobal = function (position, point, skipUpdate) {
            if (skipUpdate === void 0) { skipUpdate = false; }
            if (!skipUpdate) {
                this._recursivePostUpdateTransform();
                // this parent check is for just in case the item is a root object.
                // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
                // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
                if (!this.parent) {
                    this.parent = this._tempDisplayObjectParent;
                    this.displayObjectUpdateTransform();
                    this.parent = null;
                }
                else {
                    this.displayObjectUpdateTransform();
                }
            }
            // don't need to update the lot
            return this.worldTransform.apply(position, point);
        };
        /**
         * Calculates the local position of the display object relative to another point.
         *
         * @param position - The world origin to calculate from.
         * @param from - The DisplayObject to calculate the global position from.
         * @param point - A Point object in which to store the value, optional
         *  (otherwise will create a new Point).
         * @param skipUpdate - Should we skip the update transform
         * @return - A point object representing the position of this object
         */
        DisplayObject.prototype.toLocal = function (position, from, point, skipUpdate) {
            if (from) {
                position = from.toGlobal(position, point, skipUpdate);
            }
            if (!skipUpdate) {
                this._recursivePostUpdateTransform();
                // this parent check is for just in case the item is a root object.
                // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
                // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
                if (!this.parent) {
                    this.parent = this._tempDisplayObjectParent;
                    this.displayObjectUpdateTransform();
                    this.parent = null;
                }
                else {
                    this.displayObjectUpdateTransform();
                }
            }
            // simply apply the matrix..
            return this.worldTransform.applyInverse(position, point);
        };
        /**
         * Set the parent Container of this DisplayObject.
         *
         * @param container - The Container to add this DisplayObject to.
         * @return - The Container that this DisplayObject was added to.
         */
        DisplayObject.prototype.setParent = function (container) {
            if (!container || !container.addChild) {
                throw new Error('setParent: Argument must be a Container');
            }
            container.addChild(this);
            return container;
        };
        /**
         * Convenience function to set the position, scale, skew and pivot at once.
         *
         * @param x - The X position
         * @param y - The Y position
         * @param scaleX - The X scale value
         * @param scaleY - The Y scale value
         * @param rotation - The rotation
         * @param skewX - The X skew value
         * @param skewY - The Y skew value
         * @param pivotX - The X pivot value
         * @param pivotY - The Y pivot value
         * @return - The DisplayObject instance
         */
        DisplayObject.prototype.setTransform = function (x, y, scaleX, scaleY, rotation, skewX, skewY, pivotX, pivotY) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (scaleX === void 0) { scaleX = 1; }
            if (scaleY === void 0) { scaleY = 1; }
            if (rotation === void 0) { rotation = 0; }
            if (skewX === void 0) { skewX = 0; }
            if (skewY === void 0) { skewY = 0; }
            if (pivotX === void 0) { pivotX = 0; }
            if (pivotY === void 0) { pivotY = 0; }
            this.position.x = x;
            this.position.y = y;
            this.scale.x = !scaleX ? 1 : scaleX;
            this.scale.y = !scaleY ? 1 : scaleY;
            this.rotation = rotation;
            this.skew.x = skewX;
            this.skew.y = skewY;
            this.pivot.x = pivotX;
            this.pivot.y = pivotY;
            return this;
        };
        /**
         * Base destroy method for generic display objects. This will automatically
         * remove the display object from its parent Container as well as remove
         * all current event listeners and internal references. Do not use a DisplayObject
         * after calling `destroy()`.
         */
        DisplayObject.prototype.destroy = function (_options) {
            if (this.parent) {
                this.parent.removeChild(this);
            }
            this.emit('destroyed');
            this.removeAllListeners();
            this.transform = null;
            this.parent = null;
            this._bounds = null;
            this.mask = null;
            this.cullArea = null;
            this.filters = null;
            this.filterArea = null;
            this.hitArea = null;
            this.interactive = false;
            this.interactiveChildren = false;
            this._destroyed = true;
        };
        Object.defineProperty(DisplayObject.prototype, "_tempDisplayObjectParent", {
            /**
             * @protected
             * @member {PIXI.Container}
             */
            get: function () {
                if (this.tempDisplayObjectParent === null) {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    this.tempDisplayObjectParent = new TemporaryDisplayObject();
                }
                return this.tempDisplayObjectParent;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Used in Renderer, cacheAsBitmap and other places where you call an `updateTransform` on root
         *
         * ```
         * const cacheParent = elem.enableTempParent();
         * elem.updateTransform();
         * elem.disableTempParent(cacheParent);
         * ```
         *
         * @returns - current parent
         */
        DisplayObject.prototype.enableTempParent = function () {
            var myParent = this.parent;
            this.parent = this._tempDisplayObjectParent;
            return myParent;
        };
        /**
         * Pair method for `enableTempParent`
         *
         * @param cacheParent - Actual parent of element
         */
        DisplayObject.prototype.disableTempParent = function (cacheParent) {
            this.parent = cacheParent;
        };
        Object.defineProperty(DisplayObject.prototype, "x", {
            /**
             * The position of the displayObject on the x axis relative to the local coordinates of the parent.
             * An alias to position.x
             */
            get: function () {
                return this.position.x;
            },
            set: function (value) {
                this.transform.position.x = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "y", {
            /**
             * The position of the displayObject on the y axis relative to the local coordinates of the parent.
             * An alias to position.y
             */
            get: function () {
                return this.position.y;
            },
            set: function (value) {
                this.transform.position.y = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "worldTransform", {
            /**
             * Current transform of the object based on world (parent) factors.
             *
             * @readonly
             */
            get: function () {
                return this.transform.worldTransform;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "localTransform", {
            /**
             * Current transform of the object based on local factors: position, scale, other stuff.
             *
             * @readonly
             */
            get: function () {
                return this.transform.localTransform;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "position", {
            /**
             * The coordinate of the object relative to the local coordinates of the parent.
             *
             * @since PixiJS 4
             */
            get: function () {
                return this.transform.position;
            },
            set: function (value) {
                this.transform.position.copyFrom(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "scale", {
            /**
             * The scale factors of this object along the local coordinate axes.
             *
             * The default scale is (1, 1).
             *
             * @since PixiJS 4
             */
            get: function () {
                return this.transform.scale;
            },
            set: function (value) {
                this.transform.scale.copyFrom(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "pivot", {
            /**
             * The center of rotation, scaling, and skewing for this display object in its local space. The `position`
             * is the projection of `pivot` in the parent's local space.
             *
             * By default, the pivot is the origin (0, 0).
             *
             * @since PixiJS 4
             */
            get: function () {
                return this.transform.pivot;
            },
            set: function (value) {
                this.transform.pivot.copyFrom(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "skew", {
            /**
             * The skew factor for the object in radians.
             *
             * @since PixiJS 4
             */
            get: function () {
                return this.transform.skew;
            },
            set: function (value) {
                this.transform.skew.copyFrom(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "rotation", {
            /**
             * The rotation of the object in radians.
             * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
             */
            get: function () {
                return this.transform.rotation;
            },
            set: function (value) {
                this.transform.rotation = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "angle", {
            /**
             * The angle of the object in degrees.
             * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
             */
            get: function () {
                return this.transform.rotation * RAD_TO_DEG;
            },
            set: function (value) {
                this.transform.rotation = value * DEG_TO_RAD;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "zIndex", {
            /**
             * The zIndex of the displayObject.
             *
             * If a container has the sortableChildren property set to true, children will be automatically
             * sorted by zIndex value; a higher value will mean it will be moved towards the end of the array,
             * and thus rendered on top of other display objects within the same container.
             *
             * @see PIXI.Container#sortableChildren
             */
            get: function () {
                return this._zIndex;
            },
            set: function (value) {
                this._zIndex = value;
                if (this.parent) {
                    this.parent.sortDirty = true;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "worldVisible", {
            /**
             * Indicates if the object is globally visible.
             *
             * @readonly
             */
            get: function () {
                var item = this;
                do {
                    if (!item.visible) {
                        return false;
                    }
                    item = item.parent;
                } while (item);
                return true;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DisplayObject.prototype, "mask", {
            /**
             * Sets a mask for the displayObject. A mask is an object that limits the visibility of an
             * object to the shape of the mask applied to it. In PixiJS a regular mask must be a
             * {@link PIXI.Graphics} or a {@link PIXI.Sprite} object. This allows for much faster masking in canvas as it
             * utilities shape clipping. To remove a mask, set this property to `null`.
             *
             * For sprite mask both alpha and red channel are used. Black mask is the same as transparent mask.
             *
             * @example
             * const graphics = new PIXI.Graphics();
             * graphics.beginFill(0xFF3300);
             * graphics.drawRect(50, 250, 100, 100);
             * graphics.endFill();
             *
             * const sprite = new PIXI.Sprite(texture);
             * sprite.mask = graphics;
             *
             * @todo At the moment, PIXI.CanvasRenderer doesn't support PIXI.Sprite as mask.
             */
            get: function () {
                return this._mask;
            },
            set: function (value) {
                if (this._mask === value) {
                    return;
                }
                if (this._mask) {
                    var maskObject = (this._mask.maskObject || this._mask);
                    maskObject._maskRefCount--;
                    if (maskObject._maskRefCount === 0) {
                        maskObject.renderable = true;
                        maskObject.isMask = false;
                    }
                }
                this._mask = value;
                if (this._mask) {
                    var maskObject = (this._mask.maskObject || this._mask);
                    if (maskObject._maskRefCount === 0) {
                        maskObject.renderable = false;
                        maskObject.isMask = true;
                    }
                    maskObject._maskRefCount++;
                }
            },
            enumerable: false,
            configurable: true
        });
        return DisplayObject;
    }(eventemitter3));
    /**
     * @private
     */
    var TemporaryDisplayObject = /** @class */ (function (_super) {
        __extends(TemporaryDisplayObject, _super);
        function TemporaryDisplayObject() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.sortDirty = null;
            return _this;
        }
        return TemporaryDisplayObject;
    }(DisplayObject));
    /**
     * DisplayObject default updateTransform, does not update children of container.
     * Will crash if there's no parent element.
     *
     * @memberof PIXI.DisplayObject#
     * @method displayObjectUpdateTransform
     */
    DisplayObject.prototype.displayObjectUpdateTransform = DisplayObject.prototype.updateTransform;
  
    /*!
     * @pixi/constants - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/constants is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
    /**
     * Different types of environments for WebGL.
     *
     * @static
     * @memberof PIXI
     * @name ENV
     * @enum {number}
     * @property {number} WEBGL_LEGACY - Used for older v1 WebGL devices. PixiJS will aim to ensure compatibility
     *  with older / less advanced devices. If you experience unexplained flickering prefer this environment.
     * @property {number} WEBGL - Version 1 of WebGL
     * @property {number} WEBGL2 - Version 2 of WebGL
     */
    var ENV$1;
    (function (ENV) {
        ENV[ENV["WEBGL_LEGACY"] = 0] = "WEBGL_LEGACY";
        ENV[ENV["WEBGL"] = 1] = "WEBGL";
        ENV[ENV["WEBGL2"] = 2] = "WEBGL2";
    })(ENV$1 || (ENV$1 = {}));
    /**
     * Constant to identify the Renderer Type.
     *
     * @static
     * @memberof PIXI
     * @name RENDERER_TYPE
     * @enum {number}
     * @property {number} UNKNOWN - Unknown render type.
     * @property {number} WEBGL - WebGL render type.
     * @property {number} CANVAS - Canvas render type.
     */
    var RENDERER_TYPE$1;
    (function (RENDERER_TYPE) {
        RENDERER_TYPE[RENDERER_TYPE["UNKNOWN"] = 0] = "UNKNOWN";
        RENDERER_TYPE[RENDERER_TYPE["WEBGL"] = 1] = "WEBGL";
        RENDERER_TYPE[RENDERER_TYPE["CANVAS"] = 2] = "CANVAS";
    })(RENDERER_TYPE$1 || (RENDERER_TYPE$1 = {}));
    /**
     * Bitwise OR of masks that indicate the buffers to be cleared.
     *
     * @static
     * @memberof PIXI
     * @name BUFFER_BITS
     * @enum {number}
     * @property {number} COLOR - Indicates the buffers currently enabled for color writing.
     * @property {number} DEPTH - Indicates the depth buffer.
     * @property {number} STENCIL - Indicates the stencil buffer.
     */
    var BUFFER_BITS$1;
    (function (BUFFER_BITS) {
        BUFFER_BITS[BUFFER_BITS["COLOR"] = 16384] = "COLOR";
        BUFFER_BITS[BUFFER_BITS["DEPTH"] = 256] = "DEPTH";
        BUFFER_BITS[BUFFER_BITS["STENCIL"] = 1024] = "STENCIL";
    })(BUFFER_BITS$1 || (BUFFER_BITS$1 = {}));
    /**
     * Various blend modes supported by PIXI.
     *
     * IMPORTANT - The WebGL renderer only supports the NORMAL, ADD, MULTIPLY and SCREEN blend modes.
     * Anything else will silently act like NORMAL.
     *
     * @memberof PIXI
     * @name BLEND_MODES
     * @enum {number}
     * @property {number} NORMAL
     * @property {number} ADD
     * @property {number} MULTIPLY
     * @property {number} SCREEN
     * @property {number} OVERLAY
     * @property {number} DARKEN
     * @property {number} LIGHTEN
     * @property {number} COLOR_DODGE
     * @property {number} COLOR_BURN
     * @property {number} HARD_LIGHT
     * @property {number} SOFT_LIGHT
     * @property {number} DIFFERENCE
     * @property {number} EXCLUSION
     * @property {number} HUE
     * @property {number} SATURATION
     * @property {number} COLOR
     * @property {number} LUMINOSITY
     * @property {number} NORMAL_NPM
     * @property {number} ADD_NPM
     * @property {number} SCREEN_NPM
     * @property {number} NONE
     * @property {number} SRC_IN
     * @property {number} SRC_OUT
     * @property {number} SRC_ATOP
     * @property {number} DST_OVER
     * @property {number} DST_IN
     * @property {number} DST_OUT
     * @property {number} DST_ATOP
     * @property {number} SUBTRACT
     * @property {number} SRC_OVER
     * @property {number} ERASE
     * @property {number} XOR
     */
    var BLEND_MODES$1;
    (function (BLEND_MODES) {
        BLEND_MODES[BLEND_MODES["NORMAL"] = 0] = "NORMAL";
        BLEND_MODES[BLEND_MODES["ADD"] = 1] = "ADD";
        BLEND_MODES[BLEND_MODES["MULTIPLY"] = 2] = "MULTIPLY";
        BLEND_MODES[BLEND_MODES["SCREEN"] = 3] = "SCREEN";
        BLEND_MODES[BLEND_MODES["OVERLAY"] = 4] = "OVERLAY";
        BLEND_MODES[BLEND_MODES["DARKEN"] = 5] = "DARKEN";
        BLEND_MODES[BLEND_MODES["LIGHTEN"] = 6] = "LIGHTEN";
        BLEND_MODES[BLEND_MODES["COLOR_DODGE"] = 7] = "COLOR_DODGE";
        BLEND_MODES[BLEND_MODES["COLOR_BURN"] = 8] = "COLOR_BURN";
        BLEND_MODES[BLEND_MODES["HARD_LIGHT"] = 9] = "HARD_LIGHT";
        BLEND_MODES[BLEND_MODES["SOFT_LIGHT"] = 10] = "SOFT_LIGHT";
        BLEND_MODES[BLEND_MODES["DIFFERENCE"] = 11] = "DIFFERENCE";
        BLEND_MODES[BLEND_MODES["EXCLUSION"] = 12] = "EXCLUSION";
        BLEND_MODES[BLEND_MODES["HUE"] = 13] = "HUE";
        BLEND_MODES[BLEND_MODES["SATURATION"] = 14] = "SATURATION";
        BLEND_MODES[BLEND_MODES["COLOR"] = 15] = "COLOR";
        BLEND_MODES[BLEND_MODES["LUMINOSITY"] = 16] = "LUMINOSITY";
        BLEND_MODES[BLEND_MODES["NORMAL_NPM"] = 17] = "NORMAL_NPM";
        BLEND_MODES[BLEND_MODES["ADD_NPM"] = 18] = "ADD_NPM";
        BLEND_MODES[BLEND_MODES["SCREEN_NPM"] = 19] = "SCREEN_NPM";
        BLEND_MODES[BLEND_MODES["NONE"] = 20] = "NONE";
        BLEND_MODES[BLEND_MODES["SRC_OVER"] = 0] = "SRC_OVER";
        BLEND_MODES[BLEND_MODES["SRC_IN"] = 21] = "SRC_IN";
        BLEND_MODES[BLEND_MODES["SRC_OUT"] = 22] = "SRC_OUT";
        BLEND_MODES[BLEND_MODES["SRC_ATOP"] = 23] = "SRC_ATOP";
        BLEND_MODES[BLEND_MODES["DST_OVER"] = 24] = "DST_OVER";
        BLEND_MODES[BLEND_MODES["DST_IN"] = 25] = "DST_IN";
        BLEND_MODES[BLEND_MODES["DST_OUT"] = 26] = "DST_OUT";
        BLEND_MODES[BLEND_MODES["DST_ATOP"] = 27] = "DST_ATOP";
        BLEND_MODES[BLEND_MODES["ERASE"] = 26] = "ERASE";
        BLEND_MODES[BLEND_MODES["SUBTRACT"] = 28] = "SUBTRACT";
        BLEND_MODES[BLEND_MODES["XOR"] = 29] = "XOR";
    })(BLEND_MODES$1 || (BLEND_MODES$1 = {}));
    /**
     * Various webgl draw modes. These can be used to specify which GL drawMode to use
     * under certain situations and renderers.
     *
     * @memberof PIXI
     * @static
     * @name DRAW_MODES
     * @enum {number}
     * @property {number} POINTS
     * @property {number} LINES
     * @property {number} LINE_LOOP
     * @property {number} LINE_STRIP
     * @property {number} TRIANGLES
     * @property {number} TRIANGLE_STRIP
     * @property {number} TRIANGLE_FAN
     */
    var DRAW_MODES$1;
    (function (DRAW_MODES) {
        DRAW_MODES[DRAW_MODES["POINTS"] = 0] = "POINTS";
        DRAW_MODES[DRAW_MODES["LINES"] = 1] = "LINES";
        DRAW_MODES[DRAW_MODES["LINE_LOOP"] = 2] = "LINE_LOOP";
        DRAW_MODES[DRAW_MODES["LINE_STRIP"] = 3] = "LINE_STRIP";
        DRAW_MODES[DRAW_MODES["TRIANGLES"] = 4] = "TRIANGLES";
        DRAW_MODES[DRAW_MODES["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
        DRAW_MODES[DRAW_MODES["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
    })(DRAW_MODES$1 || (DRAW_MODES$1 = {}));
    /**
     * Various GL texture/resources formats.
     *
     * @memberof PIXI
     * @static
     * @name FORMATS
     * @enum {number}
     * @property {number} RGBA=6408
     * @property {number} RGB=6407
     * @property {number} RG=33319
     * @property {number} RED=6403
     * @property {number} RGBA_INTEGER=36249
     * @property {number} RGB_INTEGER=36248
     * @property {number} RG_INTEGER=33320
     * @property {number} RED_INTEGER=36244
     * @property {number} ALPHA=6406
     * @property {number} LUMINANCE=6409
     * @property {number} LUMINANCE_ALPHA=6410
     * @property {number} DEPTH_COMPONENT=6402
     * @property {number} DEPTH_STENCIL=34041
     */
    var FORMATS$1;
    (function (FORMATS) {
        FORMATS[FORMATS["RGBA"] = 6408] = "RGBA";
        FORMATS[FORMATS["RGB"] = 6407] = "RGB";
        FORMATS[FORMATS["RG"] = 33319] = "RG";
        FORMATS[FORMATS["RED"] = 6403] = "RED";
        FORMATS[FORMATS["RGBA_INTEGER"] = 36249] = "RGBA_INTEGER";
        FORMATS[FORMATS["RGB_INTEGER"] = 36248] = "RGB_INTEGER";
        FORMATS[FORMATS["RG_INTEGER"] = 33320] = "RG_INTEGER";
        FORMATS[FORMATS["RED_INTEGER"] = 36244] = "RED_INTEGER";
        FORMATS[FORMATS["ALPHA"] = 6406] = "ALPHA";
        FORMATS[FORMATS["LUMINANCE"] = 6409] = "LUMINANCE";
        FORMATS[FORMATS["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
        FORMATS[FORMATS["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
        FORMATS[FORMATS["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
    })(FORMATS$1 || (FORMATS$1 = {}));
    /**
     * Various GL target types.
     *
     * @memberof PIXI
     * @static
     * @name TARGETS
     * @enum {number}
     * @property {number} TEXTURE_2D=3553
     * @property {number} TEXTURE_CUBE_MAP=34067
     * @property {number} TEXTURE_2D_ARRAY=35866
     * @property {number} TEXTURE_CUBE_MAP_POSITIVE_X=34069
     * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_X=34070
     * @property {number} TEXTURE_CUBE_MAP_POSITIVE_Y=34071
     * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_Y=34072
     * @property {number} TEXTURE_CUBE_MAP_POSITIVE_Z=34073
     * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_Z=34074
     */
    var TARGETS$1;
    (function (TARGETS) {
        TARGETS[TARGETS["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
        TARGETS[TARGETS["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
        TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
    })(TARGETS$1 || (TARGETS$1 = {}));
    /**
     * Various GL data format types.
     *
     * @memberof PIXI
     * @static
     * @name TYPES
     * @enum {number}
     * @property {number} UNSIGNED_BYTE=5121
     * @property {number} UNSIGNED_SHORT=5123
     * @property {number} UNSIGNED_SHORT_5_6_5=33635
     * @property {number} UNSIGNED_SHORT_4_4_4_4=32819
     * @property {number} UNSIGNED_SHORT_5_5_5_1=32820
     * @property {number} UNSIGNED_INT=5125
     * @property {number} UNSIGNED_INT_10F_11F_11F_REV=35899
     * @property {number} UNSIGNED_INT_2_10_10_10_REV=33640
     * @property {number} UNSIGNED_INT_24_8=34042
     * @property {number} UNSIGNED_INT_5_9_9_9_REV=35902
     * @property {number} BYTE=5120
     * @property {number} SHORT=5122
     * @property {number} INT=5124
     * @property {number} FLOAT=5126
     * @property {number} FLOAT_32_UNSIGNED_INT_24_8_REV=36269
     * @property {number} HALF_FLOAT=36193
     */
    var TYPES$1;
    (function (TYPES) {
        TYPES[TYPES["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
        TYPES[TYPES["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
        TYPES[TYPES["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
        TYPES[TYPES["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
        TYPES[TYPES["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
        TYPES[TYPES["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
        TYPES[TYPES["UNSIGNED_INT_10F_11F_11F_REV"] = 35899] = "UNSIGNED_INT_10F_11F_11F_REV";
        TYPES[TYPES["UNSIGNED_INT_2_10_10_10_REV"] = 33640] = "UNSIGNED_INT_2_10_10_10_REV";
        TYPES[TYPES["UNSIGNED_INT_24_8"] = 34042] = "UNSIGNED_INT_24_8";
        TYPES[TYPES["UNSIGNED_INT_5_9_9_9_REV"] = 35902] = "UNSIGNED_INT_5_9_9_9_REV";
        TYPES[TYPES["BYTE"] = 5120] = "BYTE";
        TYPES[TYPES["SHORT"] = 5122] = "SHORT";
        TYPES[TYPES["INT"] = 5124] = "INT";
        TYPES[TYPES["FLOAT"] = 5126] = "FLOAT";
        TYPES[TYPES["FLOAT_32_UNSIGNED_INT_24_8_REV"] = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV";
        TYPES[TYPES["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
    })(TYPES$1 || (TYPES$1 = {}));
    /**
     * Various sampler types. Correspond to `sampler`, `isampler`, `usampler` GLSL types respectively.
     * WebGL1 works only with FLOAT.
     *
     * @memberof PIXI
     * @static
     * @name SAMPLER_TYPES
     * @enum {number}
     * @property {number} FLOAT=0
     * @property {number} INT=1
     * @property {number} UINT=2
     */
    var SAMPLER_TYPES$1;
    (function (SAMPLER_TYPES) {
        SAMPLER_TYPES[SAMPLER_TYPES["FLOAT"] = 0] = "FLOAT";
        SAMPLER_TYPES[SAMPLER_TYPES["INT"] = 1] = "INT";
        SAMPLER_TYPES[SAMPLER_TYPES["UINT"] = 2] = "UINT";
    })(SAMPLER_TYPES$1 || (SAMPLER_TYPES$1 = {}));
    /**
     * The scale modes that are supported by pixi.
     *
     * The {@link PIXI.settings.SCALE_MODE} scale mode affects the default scaling mode of future operations.
     * It can be re-assigned to either LINEAR or NEAREST, depending upon suitability.
     *
     * @memberof PIXI
     * @static
     * @name SCALE_MODES
     * @enum {number}
     * @property {number} LINEAR Smooth scaling
     * @property {number} NEAREST Pixelating scaling
     */
    var SCALE_MODES$1;
    (function (SCALE_MODES) {
        SCALE_MODES[SCALE_MODES["NEAREST"] = 0] = "NEAREST";
        SCALE_MODES[SCALE_MODES["LINEAR"] = 1] = "LINEAR";
    })(SCALE_MODES$1 || (SCALE_MODES$1 = {}));
    /**
     * The wrap modes that are supported by pixi.
     *
     * The {@link PIXI.settings.WRAP_MODE} wrap mode affects the default wrapping mode of future operations.
     * It can be re-assigned to either CLAMP or REPEAT, depending upon suitability.
     * If the texture is non power of two then clamp will be used regardless as WebGL can
     * only use REPEAT if the texture is po2.
     *
     * This property only affects WebGL.
     *
     * @name WRAP_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} CLAMP - The textures uvs are clamped
     * @property {number} REPEAT - The texture uvs tile and repeat
     * @property {number} MIRRORED_REPEAT - The texture uvs tile and repeat with mirroring
     */
    var WRAP_MODES$1;
    (function (WRAP_MODES) {
        WRAP_MODES[WRAP_MODES["CLAMP"] = 33071] = "CLAMP";
        WRAP_MODES[WRAP_MODES["REPEAT"] = 10497] = "REPEAT";
        WRAP_MODES[WRAP_MODES["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
    })(WRAP_MODES$1 || (WRAP_MODES$1 = {}));
    /**
     * Mipmap filtering modes that are supported by pixi.
     *
     * The {@link PIXI.settings.MIPMAP_TEXTURES} affects default texture filtering.
     * Mipmaps are generated for a baseTexture if its `mipmap` field is `ON`,
     * or its `POW2` and texture dimensions are powers of 2.
     * Due to platform restriction, `ON` option will work like `POW2` for webgl-1.
     *
     * This property only affects WebGL.
     *
     * @name MIPMAP_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} OFF - No mipmaps
     * @property {number} POW2 - Generate mipmaps if texture dimensions are pow2
     * @property {number} ON - Always generate mipmaps
     * @property {number} ON_MANUAL - Use mipmaps, but do not auto-generate them; this is used with a resource
     *   that supports buffering each level-of-detail.
     */
    var MIPMAP_MODES$1;
    (function (MIPMAP_MODES) {
        MIPMAP_MODES[MIPMAP_MODES["OFF"] = 0] = "OFF";
        MIPMAP_MODES[MIPMAP_MODES["POW2"] = 1] = "POW2";
        MIPMAP_MODES[MIPMAP_MODES["ON"] = 2] = "ON";
        MIPMAP_MODES[MIPMAP_MODES["ON_MANUAL"] = 3] = "ON_MANUAL";
    })(MIPMAP_MODES$1 || (MIPMAP_MODES$1 = {}));
    /**
     * How to treat textures with premultiplied alpha
     *
     * @name ALPHA_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} NO_PREMULTIPLIED_ALPHA - Source is not premultiplied, leave it like that.
     *  Option for compressed and data textures that are created from typed arrays.
     * @property {number} PREMULTIPLY_ON_UPLOAD - Source is not premultiplied, premultiply on upload.
     *  Default option, used for all loaded images.
     * @property {number} PREMULTIPLIED_ALPHA - Source is already premultiplied
     *  Example: spine atlases with `_pma` suffix.
     * @property {number} NPM - Alias for NO_PREMULTIPLIED_ALPHA.
     * @property {number} UNPACK - Default option, alias for PREMULTIPLY_ON_UPLOAD.
     * @property {number} PMA - Alias for PREMULTIPLIED_ALPHA.
     */
    var ALPHA_MODES$1;
    (function (ALPHA_MODES) {
        ALPHA_MODES[ALPHA_MODES["NPM"] = 0] = "NPM";
        ALPHA_MODES[ALPHA_MODES["UNPACK"] = 1] = "UNPACK";
        ALPHA_MODES[ALPHA_MODES["PMA"] = 2] = "PMA";
        ALPHA_MODES[ALPHA_MODES["NO_PREMULTIPLIED_ALPHA"] = 0] = "NO_PREMULTIPLIED_ALPHA";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ON_UPLOAD"] = 1] = "PREMULTIPLY_ON_UPLOAD";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ALPHA"] = 2] = "PREMULTIPLY_ALPHA";
        ALPHA_MODES[ALPHA_MODES["PREMULTIPLIED_ALPHA"] = 2] = "PREMULTIPLIED_ALPHA";
    })(ALPHA_MODES$1 || (ALPHA_MODES$1 = {}));
    /**
     * Configure whether filter textures are cleared after binding.
     *
     * Filter textures need not be cleared if the filter does not use pixel blending. {@link CLEAR_MODES.BLIT} will detect
     * this and skip clearing as an optimization.
     *
     * @name CLEAR_MODES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} BLEND - Do not clear the filter texture. The filter's output will blend on top of the output texture.
     * @property {number} CLEAR - Always clear the filter texture.
     * @property {number} BLIT - Clear only if {@link FilterSystem.forceClear} is set or if the filter uses pixel blending.
     * @property {number} NO - Alias for BLEND, same as `false` in earlier versions
     * @property {number} YES - Alias for CLEAR, same as `true` in earlier versions
     * @property {number} AUTO - Alias for BLIT
     */
    var CLEAR_MODES$1;
    (function (CLEAR_MODES) {
        CLEAR_MODES[CLEAR_MODES["NO"] = 0] = "NO";
        CLEAR_MODES[CLEAR_MODES["YES"] = 1] = "YES";
        CLEAR_MODES[CLEAR_MODES["AUTO"] = 2] = "AUTO";
        CLEAR_MODES[CLEAR_MODES["BLEND"] = 0] = "BLEND";
        CLEAR_MODES[CLEAR_MODES["CLEAR"] = 1] = "CLEAR";
        CLEAR_MODES[CLEAR_MODES["BLIT"] = 2] = "BLIT";
    })(CLEAR_MODES$1 || (CLEAR_MODES$1 = {}));
    /**
     * The gc modes that are supported by pixi.
     *
     * The {@link PIXI.settings.GC_MODE} Garbage Collection mode for PixiJS textures is AUTO
     * If set to GC_MODE, the renderer will occasionally check textures usage. If they are not
     * used for a specified period of time they will be removed from the GPU. They will of course
     * be uploaded again when they are required. This is a silent behind the scenes process that
     * should ensure that the GPU does not  get filled up.
     *
     * Handy for mobile devices!
     * This property only affects WebGL.
     *
     * @name GC_MODES
     * @enum {number}
     * @static
     * @memberof PIXI
     * @property {number} AUTO - Garbage collection will happen periodically automatically
     * @property {number} MANUAL - Garbage collection will need to be called manually
     */
    var GC_MODES$1;
    (function (GC_MODES) {
        GC_MODES[GC_MODES["AUTO"] = 0] = "AUTO";
        GC_MODES[GC_MODES["MANUAL"] = 1] = "MANUAL";
    })(GC_MODES$1 || (GC_MODES$1 = {}));
    /**
     * Constants that specify float precision in shaders.
     *
     * @name PRECISION
     * @memberof PIXI
     * @constant
     * @static
     * @enum {string}
     * @property {string} LOW='lowp'
     * @property {string} MEDIUM='mediump'
     * @property {string} HIGH='highp'
     */
    var PRECISION$1;
    (function (PRECISION) {
        PRECISION["LOW"] = "lowp";
        PRECISION["MEDIUM"] = "mediump";
        PRECISION["HIGH"] = "highp";
    })(PRECISION$1 || (PRECISION$1 = {}));
    /**
     * Constants for mask implementations.
     * We use `type` suffix because it leads to very different behaviours
     *
     * @name MASK_TYPES
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} NONE - Mask is ignored
     * @property {number} SCISSOR - Scissor mask, rectangle on screen, cheap
     * @property {number} STENCIL - Stencil mask, 1-bit, medium, works only if renderer supports stencil
     * @property {number} SPRITE - Mask that uses SpriteMaskFilter, uses temporary RenderTexture
     */
    var MASK_TYPES$1;
    (function (MASK_TYPES) {
        MASK_TYPES[MASK_TYPES["NONE"] = 0] = "NONE";
        MASK_TYPES[MASK_TYPES["SCISSOR"] = 1] = "SCISSOR";
        MASK_TYPES[MASK_TYPES["STENCIL"] = 2] = "STENCIL";
        MASK_TYPES[MASK_TYPES["SPRITE"] = 3] = "SPRITE";
    })(MASK_TYPES$1 || (MASK_TYPES$1 = {}));
    /**
     * Constants for multi-sampling antialiasing.
     *
     * @see PIXI.Framebuffer#multisample
     *
     * @name MSAA_QUALITY
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} NONE - No multisampling for this renderTexture
     * @property {number} LOW - Try 2 samples
     * @property {number} MEDIUM - Try 4 samples
     * @property {number} HIGH - Try 8 samples
     */
    var MSAA_QUALITY$1;
    (function (MSAA_QUALITY) {
        MSAA_QUALITY[MSAA_QUALITY["NONE"] = 0] = "NONE";
        MSAA_QUALITY[MSAA_QUALITY["LOW"] = 2] = "LOW";
        MSAA_QUALITY[MSAA_QUALITY["MEDIUM"] = 4] = "MEDIUM";
        MSAA_QUALITY[MSAA_QUALITY["HIGH"] = 8] = "HIGH";
    })(MSAA_QUALITY$1 || (MSAA_QUALITY$1 = {}));
    /**
     * Constants for various buffer types in Pixi
     *
     * @see PIXI.BUFFER_TYPE
     *
     * @name BUFFER_TYPE
     * @memberof PIXI
     * @static
     * @enum {number}
     * @property {number} ELEMENT_ARRAY_BUFFER - buffer type for using as an index buffer
     * @property {number} ARRAY_BUFFER - buffer type for using attribute data
     * @property {number} UNIFORM_BUFFER - the buffer type is for uniform buffer objects
     */
    var BUFFER_TYPE$1;
    (function (BUFFER_TYPE) {
        BUFFER_TYPE[BUFFER_TYPE["ELEMENT_ARRAY_BUFFER"] = 34963] = "ELEMENT_ARRAY_BUFFER";
        BUFFER_TYPE[BUFFER_TYPE["ARRAY_BUFFER"] = 34962] = "ARRAY_BUFFER";
        // NOT YET SUPPORTED
        BUFFER_TYPE[BUFFER_TYPE["UNIFORM_BUFFER"] = 35345] = "UNIFORM_BUFFER";
    })(BUFFER_TYPE$1 || (BUFFER_TYPE$1 = {}));
  
    function sortChildren(a, b) {
        if (a.zIndex === b.zIndex) {
            return a._lastSortedIndex - b._lastSortedIndex;
        }
        return a.zIndex - b.zIndex;
    }
    /**
     * Container is a general-purpose display object that holds children. It also adds built-in support for advanced
     * rendering features like masking and filtering.
     *
     * It is the base class of all display objects that act as a container for other objects, including Graphics
     * and Sprite.
     *
     * ```js
     * import { BlurFilter } from '@pixi/filter-blur';
     * import { Container } from '@pixi/display';
     * import { Graphics } from '@pixi/graphics';
     * import { Sprite } from '@pixi/sprite';
     *
     * let container = new Container();
     * let sprite = Sprite.from("https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/IaUrttj.png");
     *
     * sprite.width = 512;
     * sprite.height = 512;
     *
     * // Adds a sprite as a child to this container. As a result, the sprite will be rendered whenever the container
     * // is rendered.
     * container.addChild(sprite);
     *
     * // Blurs whatever is rendered by the container
     * container.filters = [new BlurFilter()];
     *
     * // Only the contents within a circle at the center should be rendered onto the screen.
     * container.mask = new Graphics()
     *  .beginFill(0xffffff)
     *  .drawCircle(sprite.width / 2, sprite.height / 2, Math.min(sprite.width, sprite.height) / 2)
     *  .endFill();
     * ```
     *
     * @memberof PIXI
     */
    var Container = /** @class */ (function (_super) {
        __extends(Container, _super);
        function Container() {
            var _this = _super.call(this) || this;
            _this.children = [];
            _this.sortableChildren = settings.SORTABLE_CHILDREN;
            _this.sortDirty = false;
            return _this;
            /**
             * Fired when a DisplayObject is added to this Container.
             *
             * @event PIXI.Container#childAdded
             * @param {PIXI.DisplayObject} child - The child added to the Container.
             * @param {PIXI.Container} container - The container that added the child.
             * @param {number} index - The children's index of the added child.
             */
            /**
             * Fired when a DisplayObject is removed from this Container.
             *
             * @event PIXI.DisplayObject#removedFrom
             * @param {PIXI.DisplayObject} child - The child removed from the Container.
             * @param {PIXI.Container} container - The container that removed removed the child.
             * @param {number} index - The former children's index of the removed child
             */
        }
        /** Overridable method that can be used by Container subclasses whenever the children array is modified. */
        Container.prototype.onChildrenChange = function (_length) {
            /* empty */
        };
        /**
         * Adds one or more children to the container.
         *
         * Multiple items can be added like so: `myContainer.addChild(thingOne, thingTwo, thingThree)`
         *
         * @param {...PIXI.DisplayObject} children - The DisplayObject(s) to add to the container
         * @return {PIXI.DisplayObject} - The first child that was added.
         */
        Container.prototype.addChild = function () {
            var arguments$1 = arguments;
  
            var children = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                children[_i] = arguments$1[_i];
            }
            // if there is only one argument we can bypass looping through the them
            if (children.length > 1) {
                // loop through the array and add all children
                for (var i = 0; i < children.length; i++) {
                    // eslint-disable-next-line prefer-rest-params
                    this.addChild(children[i]);
                }
            }
            else {
                var child = children[0];
                // if the child has a parent then lets remove it as PixiJS objects can only exist in one place
                if (child.parent) {
                    child.parent.removeChild(child);
                }
                child.parent = this;
                this.sortDirty = true;
                // ensure child transform will be recalculated
                child.transform._parentID = -1;
                this.children.push(child);
                // ensure bounds will be recalculated
                this._boundsID++;
                // TODO - lets either do all callbacks or all events.. not both!
                this.onChildrenChange(this.children.length - 1);
                this.emit('childAdded', child, this, this.children.length - 1);
                child.emit('added', this);
            }
            return children[0];
        };
        /**
         * Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown
         *
         * @param {PIXI.DisplayObject} child - The child to add
         * @param {number} index - The index to place the child in
         * @return {PIXI.DisplayObject} The child that was added.
         */
        Container.prototype.addChildAt = function (child, index) {
            if (index < 0 || index > this.children.length) {
                throw new Error(child + "addChildAt: The index " + index + " supplied is out of bounds " + this.children.length);
            }
            if (child.parent) {
                child.parent.removeChild(child);
            }
            child.parent = this;
            this.sortDirty = true;
            // ensure child transform will be recalculated
            child.transform._parentID = -1;
            this.children.splice(index, 0, child);
            // ensure bounds will be recalculated
            this._boundsID++;
            // TODO - lets either do all callbacks or all events.. not both!
            this.onChildrenChange(index);
            child.emit('added', this);
            this.emit('childAdded', child, this, index);
            return child;
        };
        /**
         * Swaps the position of 2 Display Objects within this container.
         *
         * @param child - First display object to swap
         * @param child2 - Second display object to swap
         */
        Container.prototype.swapChildren = function (child, child2) {
            if (child === child2) {
                return;
            }
            var index1 = this.getChildIndex(child);
            var index2 = this.getChildIndex(child2);
            this.children[index1] = child2;
            this.children[index2] = child;
            this.onChildrenChange(index1 < index2 ? index1 : index2);
        };
        /**
         * Returns the index position of a child DisplayObject instance
         *
         * @param child - The DisplayObject instance to identify
         * @return - The index position of the child display object to identify
         */
        Container.prototype.getChildIndex = function (child) {
            var index = this.children.indexOf(child);
            if (index === -1) {
                throw new Error('The supplied DisplayObject must be a child of the caller');
            }
            return index;
        };
        /**
         * Changes the position of an existing child in the display object container
         *
         * @param child - The child DisplayObject instance for which you want to change the index number
         * @param index - The resulting index number for the child display object
         */
        Container.prototype.setChildIndex = function (child, index) {
            if (index < 0 || index >= this.children.length) {
                throw new Error("The index " + index + " supplied is out of bounds " + this.children.length);
            }
            var currentIndex = this.getChildIndex(child);
            removeItems(this.children, currentIndex, 1); // remove from old position
            this.children.splice(index, 0, child); // add at new position
            this.onChildrenChange(index);
        };
        /**
         * Returns the child at the specified index
         *
         * @param index - The index to get the child at
         * @return - The child at the given index, if any.
         */
        Container.prototype.getChildAt = function (index) {
            if (index < 0 || index >= this.children.length) {
                throw new Error("getChildAt: Index (" + index + ") does not exist.");
            }
            return this.children[index];
        };
        /**
         * Removes one or more children from the container.
         *
         * @param {...PIXI.DisplayObject} children - The DisplayObject(s) to remove
         * @return {PIXI.DisplayObject} The first child that was removed.
         */
        Container.prototype.removeChild = function () {
            var arguments$1 = arguments;
  
            var children = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                children[_i] = arguments$1[_i];
            }
            // if there is only one argument we can bypass looping through the them
            if (children.length > 1) {
                // loop through the arguments property and remove all children
                for (var i = 0; i < children.length; i++) {
                    this.removeChild(children[i]);
                }
            }
            else {
                var child = children[0];
                var index = this.children.indexOf(child);
                if (index === -1)
                    { return null; }
                child.parent = null;
                // ensure child transform will be recalculated
                child.transform._parentID = -1;
                removeItems(this.children, index, 1);
                // ensure bounds will be recalculated
                this._boundsID++;
                // TODO - lets either do all callbacks or all events.. not both!
                this.onChildrenChange(index);
                child.emit('removed', this);
                this.emit('childRemoved', child, this, index);
            }
            return children[0];
        };
        /**
         * Removes a child from the specified index position.
         *
         * @param index - The index to get the child from
         * @return The child that was removed.
         */
        Container.prototype.removeChildAt = function (index) {
            var child = this.getChildAt(index);
            // ensure child transform will be recalculated..
            child.parent = null;
            child.transform._parentID = -1;
            removeItems(this.children, index, 1);
            // ensure bounds will be recalculated
            this._boundsID++;
            // TODO - lets either do all callbacks or all events.. not both!
            this.onChildrenChange(index);
            child.emit('removed', this);
            this.emit('childRemoved', child, this, index);
            return child;
        };
        /**
         * Removes all children from this container that are within the begin and end indexes.
         *
         * @param beginIndex - The beginning position.
         * @param endIndex - The ending position. Default value is size of the container.
         * @returns - List of removed children
         */
        Container.prototype.removeChildren = function (beginIndex, endIndex) {
            if (beginIndex === void 0) { beginIndex = 0; }
            if (endIndex === void 0) { endIndex = this.children.length; }
            var begin = beginIndex;
            var end = endIndex;
            var range = end - begin;
            var removed;
            if (range > 0 && range <= end) {
                removed = this.children.splice(begin, range);
                for (var i = 0; i < removed.length; ++i) {
                    removed[i].parent = null;
                    if (removed[i].transform) {
                        removed[i].transform._parentID = -1;
                    }
                }
                this._boundsID++;
                this.onChildrenChange(beginIndex);
                for (var i = 0; i < removed.length; ++i) {
                    removed[i].emit('removed', this);
                    this.emit('childRemoved', removed[i], this, i);
                }
                return removed;
            }
            else if (range === 0 && this.children.length === 0) {
                return [];
            }
            throw new RangeError('removeChildren: numeric values are outside the acceptable range.');
        };
        /** Sorts children by zIndex. Previous order is maintained for 2 children with the same zIndex. */
        Container.prototype.sortChildren = function () {
            var sortRequired = false;
            for (var i = 0, j = this.children.length; i < j; ++i) {
                var child = this.children[i];
                child._lastSortedIndex = i;
                if (!sortRequired && child.zIndex !== 0) {
                    sortRequired = true;
                }
            }
            if (sortRequired && this.children.length > 1) {
                this.children.sort(sortChildren);
            }
            this.sortDirty = false;
        };
        /** Updates the transform on all children of this container for rendering. */
        Container.prototype.updateTransform = function () {
            if (this.sortableChildren && this.sortDirty) {
                this.sortChildren();
            }
            this._boundsID++;
            this.transform.updateTransform(this.parent.transform);
            // TODO: check render flags, how to process stuff here
            this.worldAlpha = this.alpha * this.parent.worldAlpha;
            for (var i = 0, j = this.children.length; i < j; ++i) {
                var child = this.children[i];
                if (child.visible) {
                    child.updateTransform();
                }
            }
        };
        /**
         * Recalculates the bounds of the container.
         *
         * This implementation will automatically fit the children's bounds into the calculation. Each child's bounds
         * is limited to its mask's bounds or filterArea, if any is applied.
         */
        Container.prototype.calculateBounds = function () {
            this._bounds.clear();
            this._calculateBounds();
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if (!child.visible || !child.renderable) {
                    continue;
                }
                child.calculateBounds();
                // TODO: filter+mask, need to mask both somehow
                if (child._mask) {
                    var maskObject = (child._mask.maskObject || child._mask);
                    maskObject.calculateBounds();
                    this._bounds.addBoundsMask(child._bounds, maskObject._bounds);
                }
                else if (child.filterArea) {
                    this._bounds.addBoundsArea(child._bounds, child.filterArea);
                }
                else {
                    this._bounds.addBounds(child._bounds);
                }
            }
            this._bounds.updateID = this._boundsID;
        };
        /**
         * Retrieves the local bounds of the displayObject as a rectangle object.
         *
         * Calling `getLocalBounds` may invalidate the `_bounds` of the whole subtree below. If using it inside a render()
         * call, it is advised to call `getBounds()` immediately after to recalculate the world bounds of the subtree.
         *
         * @param rect - Optional rectangle to store the result of the bounds calculation.
         * @param skipChildrenUpdate - Setting to `true` will stop re-calculation of children transforms,
         *  it was default behaviour of pixi 4.0-5.2 and caused many problems to users.
         * @return - The rectangular bounding area.
         */
        Container.prototype.getLocalBounds = function (rect, skipChildrenUpdate) {
            if (skipChildrenUpdate === void 0) { skipChildrenUpdate = false; }
            var result = _super.prototype.getLocalBounds.call(this, rect);
            if (!skipChildrenUpdate) {
                for (var i = 0, j = this.children.length; i < j; ++i) {
                    var child = this.children[i];
                    if (child.visible) {
                        child.updateTransform();
                    }
                }
            }
            return result;
        };
        /**
         * Recalculates the content bounds of this object. This should be overriden to
         * calculate the bounds of this specific object (not including children).
         *
         * @protected
         */
        Container.prototype._calculateBounds = function () {
            // FILL IN//
        };
        /**
         * Renders this object and its children with culling.
         *
         * @protected
         * @param {PIXI.Renderer} renderer - The renderer
         */
        Container.prototype._renderWithCulling = function (renderer) {
            var sourceFrame = renderer.renderTexture.sourceFrame;
            // If the source frame is empty, stop rendering.
            if (!(sourceFrame.width > 0 && sourceFrame.height > 0)) {
                return;
            }
            // Render the content of the container only if its bounds intersect with the source frame.
            // All filters are on the stack at this point, and the filter source frame is bound:
            // therefore, even if the bounds to non intersect the filter frame, the filter
            // is still applied and any filter padding that is in the frame is rendered correctly.
            var bounds;
            var transform;
            // If cullArea is set, we use this rectangle instead of the bounds of the object. The cullArea
            // rectangle must completely contain the container and its children including filter padding.
            if (this.cullArea) {
                bounds = this.cullArea;
                transform = this.worldTransform;
            }
            // If the container doesn't override _render, we can skip the bounds calculation and intersection test.
            else if (this._render !== Container.prototype._render) {
                bounds = this.getBounds(true);
            }
            // Render the container if the source frame intersects the bounds.
            if (bounds && sourceFrame.intersects(bounds, transform)) {
                this._render(renderer);
            }
            // If the bounds are defined by cullArea and do not intersect with the source frame, stop rendering.
            else if (this.cullArea) {
                return;
            }
            // Unless cullArea is set, we cannot skip the children if the bounds of the container do not intersect
            // the source frame, because the children might have filters with nonzero padding, which may intersect
            // with the source frame while the bounds do not: filter padding is not included in the bounds.
            // If cullArea is not set, render the children with culling temporarily enabled so that they are not rendered
            // if they are out of frame; otherwise, render the children normally.
            for (var i = 0, j = this.children.length; i < j; ++i) {
                var child = this.children[i];
                var childCullable = child.cullable;
                child.cullable = childCullable || !this.cullArea;
                child.render(renderer);
                child.cullable = childCullable;
            }
        };
        /**
         * Renders the object using the WebGL renderer.
         *
         * The [_render]{@link PIXI.Container#_render} method is be overriden for rendering the contents of the
         * container itself. This `render` method will invoke it, and also invoke the `render` methods of all
         * children afterward.
         *
         * If `renderable` or `visible` is false or if `worldAlpha` is not positive or if `cullable` is true and
         * the bounds of this object are out of frame, this implementation will entirely skip rendering.
         * See {@link PIXI.DisplayObject} for choosing between `renderable` or `visible`. Generally,
         * setting alpha to zero is not recommended for purely skipping rendering.
         *
         * When your scene becomes large (especially when it is larger than can be viewed in a single screen), it is
         * advised to employ **culling** to automatically skip rendering objects outside of the current screen.
         * See [cullable]{@link PIXI.DisplayObject#cullable} and [cullArea]{@link PIXI.DisplayObject#cullArea}.
         * Other culling methods might be better suited for a large number static objects; see
         * [@pixi-essentials/cull]{@link https://www.npmjs.com/package/@pixi-essentials/cull} and
         * [pixi-cull]{@link https://www.npmjs.com/package/pixi-cull}.
         *
         * The [renderAdvanced]{@link PIXI.Container#renderAdvanced} method is internally used when when masking or
         * filtering is applied on a container. This does, however, break batching and can affect performance when
         * masking and filtering is applied extensively throughout the scene graph.
         *
         * @param renderer - The renderer
         */
        Container.prototype.render = function (renderer) {
            // if the object is not visible or the alpha is 0 then no need to render this element
            if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
                return;
            }
            // do a quick check to see if this element has a mask or a filter.
            if (this._mask || (this.filters && this.filters.length)) {
                this.renderAdvanced(renderer);
            }
            else if (this.cullable) {
                this._renderWithCulling(renderer);
            }
            else {
                this._render(renderer);
                for (var i = 0, j = this.children.length; i < j; ++i) {
                    this.children[i].render(renderer);
                }
            }
        };
        /**
         * Render the object using the WebGL renderer and advanced features.
         *
         * @param renderer - The renderer
         */
        Container.prototype.renderAdvanced = function (renderer) {
            var filters = this.filters;
            var mask = this._mask;
            // push filter first as we need to ensure the stencil buffer is correct for any masking
            if (filters) {
                if (!this._enabledFilters) {
                    this._enabledFilters = [];
                }
                this._enabledFilters.length = 0;
                for (var i = 0; i < filters.length; i++) {
                    if (filters[i].enabled) {
                        this._enabledFilters.push(filters[i]);
                    }
                }
            }
            var flush = (filters && this._enabledFilters && this._enabledFilters.length)
                || (mask && (!mask.isMaskData
                    || (mask.enabled && (mask.autoDetect || mask.type !== MASK_TYPES$1.NONE))));
            if (flush) {
                renderer.batch.flush();
            }
            if (filters && this._enabledFilters && this._enabledFilters.length) {
                renderer.filter.push(this, this._enabledFilters);
            }
            if (mask) {
                renderer.mask.push(this, this._mask);
            }
            if (this.cullable) {
                this._renderWithCulling(renderer);
            }
            else {
                this._render(renderer);
                for (var i = 0, j = this.children.length; i < j; ++i) {
                    this.children[i].render(renderer);
                }
            }
            if (flush) {
                renderer.batch.flush();
            }
            if (mask) {
                renderer.mask.pop(this);
            }
            if (filters && this._enabledFilters && this._enabledFilters.length) {
                renderer.filter.pop();
            }
        };
        /**
         * To be overridden by the subclasses.
         *
         * @param renderer - The renderer
         */
        Container.prototype._render = function (_renderer) {
            // this is where content itself gets rendered...
        };
        /**
         * Removes all internal references and listeners as well as removes children from the display list.
         * Do not use a Container after calling `destroy`.
         *
         * @param options - Options parameter. A boolean will act as if all options
         *  have been set to that value
         * @param {boolean} [options.children=false] - if set to true, all the children will have their destroy
         *  method called as well. 'options' will be passed on to those calls.
         * @param {boolean} [options.texture=false] - Only used for child Sprites if options.children is set to true
         *  Should it destroy the texture of the child sprite
         * @param {boolean} [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
         *  Should it destroy the base texture of the child sprite
         */
        Container.prototype.destroy = function (options) {
            _super.prototype.destroy.call(this);
            this.sortDirty = false;
            var destroyChildren = typeof options === 'boolean' ? options : options && options.children;
            var oldChildren = this.removeChildren(0, this.children.length);
            if (destroyChildren) {
                for (var i = 0; i < oldChildren.length; ++i) {
                    oldChildren[i].destroy(options);
                }
            }
        };
        Object.defineProperty(Container.prototype, "width", {
            /** The width of the Container, setting this will actually modify the scale to achieve the value set. */
            get: function () {
                return this.scale.x * this.getLocalBounds().width;
            },
            set: function (value) {
                var width = this.getLocalBounds().width;
                if (width !== 0) {
                    this.scale.x = value / width;
                }
                else {
                    this.scale.x = 1;
                }
                this._width = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Container.prototype, "height", {
            /** The height of the Container, setting this will actually modify the scale to achieve the value set. */
            get: function () {
                return this.scale.y * this.getLocalBounds().height;
            },
            set: function (value) {
                var height = this.getLocalBounds().height;
                if (height !== 0) {
                    this.scale.y = value / height;
                }
                else {
                    this.scale.y = 1;
                }
                this._height = value;
            },
            enumerable: false,
            configurable: true
        });
        return Container;
    }(DisplayObject));
    /**
     * Container default updateTransform, does update children of container.
     * Will crash if there's no parent element.
     *
     * @memberof PIXI.Container#
     * @method containerUpdateTransform
     */
    Container.prototype.containerUpdateTransform = Container.prototype.updateTransform;
  
    /*!
     * @pixi/accessibility - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/accessibility is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
  
    /**
     * Default property values of accessible objects
     * used by {@link PIXI.AccessibilityManager}.
     *
     * @private
     * @function accessibleTarget
     * @memberof PIXI
     * @type {Object}
     * @example
     *      function MyObject() {}
     *
     *      Object.assign(
     *          MyObject.prototype,
     *          PIXI.accessibleTarget
     *      );
     */
    var accessibleTarget = {
        /**
         *  Flag for if the object is accessible. If true AccessibilityManager will overlay a
         *   shadow div with attributes set
         *
         * @member {boolean}
         * @memberof PIXI.DisplayObject#
         */
        accessible: false,
        /**
         * Sets the title attribute of the shadow div
         * If accessibleTitle AND accessibleHint has not been this will default to 'displayObject [tabIndex]'
         *
         * @member {?string}
         * @memberof PIXI.DisplayObject#
         */
        accessibleTitle: null,
        /**
         * Sets the aria-label attribute of the shadow div
         *
         * @member {string}
         * @memberof PIXI.DisplayObject#
         */
        accessibleHint: null,
        /**
         * @member {number}
         * @memberof PIXI.DisplayObject#
         * @private
         * @todo Needs docs.
         */
        tabIndex: 0,
        /**
         * @member {boolean}
         * @memberof PIXI.DisplayObject#
         * @todo Needs docs.
         */
        _accessibleActive: false,
        /**
         * @member {boolean}
         * @memberof PIXI.DisplayObject#
         * @todo Needs docs.
         */
        _accessibleDiv: null,
        /**
         * Specify the type of div the accessible layer is. Screen readers treat the element differently
         * depending on this type. Defaults to button.
         *
         * @member {string}
         * @memberof PIXI.DisplayObject#
         * @default 'button'
         */
        accessibleType: 'button',
        /**
         * Specify the pointer-events the accessible div will use
         * Defaults to auto.
         *
         * @member {string}
         * @memberof PIXI.DisplayObject#
         * @default 'auto'
         */
        accessiblePointerEvents: 'auto',
        /**
         * Setting to false will prevent any children inside this container to
         * be accessible. Defaults to true.
         *
         * @member {boolean}
         * @memberof PIXI.DisplayObject#
         * @default true
         */
        accessibleChildren: true,
        renderId: -1,
    };
  
    // add some extra variables to the container..
    DisplayObject.mixin(accessibleTarget);
    var KEY_CODE_TAB = 9;
    var DIV_TOUCH_SIZE = 100;
    var DIV_TOUCH_POS_X = 0;
    var DIV_TOUCH_POS_Y = 0;
    var DIV_TOUCH_ZINDEX = 2;
    var DIV_HOOK_SIZE = 1;
    var DIV_HOOK_POS_X = -1000;
    var DIV_HOOK_POS_Y = -1000;
    var DIV_HOOK_ZINDEX = 2;
    /**
     * The Accessibility manager recreates the ability to tab and have content read by screen readers.
     * This is very important as it can possibly help people with disabilities access PixiJS content.
     *
     * A DisplayObject can be made accessible just like it can be made interactive. This manager will map the
     * events as if the mouse was being used, minimizing the effort required to implement.
     *
     * An instance of this class is automatically created by default, and can be found at `renderer.plugins.accessibility`
     *
     * @class
     * @memberof PIXI
     */
    var AccessibilityManager = /** @class */ (function () {
        /**
         * @param {PIXI.CanvasRenderer|PIXI.Renderer} renderer - A reference to the current renderer
         */
        function AccessibilityManager(renderer) {
            /** Setting this to true will visually show the divs. */
            this.debug = false;
            /** Internal variable, see isActive getter. */
            this._isActive = false;
            /** Internal variable, see isMobileAccessibility getter. */
            this._isMobileAccessibility = false;
            /** A simple pool for storing divs. */
            this.pool = [];
            /** This is a tick used to check if an object is no longer being rendered. */
            this.renderId = 0;
            /** The array of currently active accessible items. */
            this.children = [];
            /** Count to throttle div updates on android devices. */
            this.androidUpdateCount = 0;
            /**  The frequency to update the div elements. */
            this.androidUpdateFrequency = 500; // 2fps
            this._hookDiv = null;
            if (isMobile$1.tablet || isMobile$1.phone) {
                this.createTouchHook();
            }
            // first we create a div that will sit over the PixiJS element. This is where the div overlays will go.
            var div = document.createElement('div');
            div.style.width = DIV_TOUCH_SIZE + "px";
            div.style.height = DIV_TOUCH_SIZE + "px";
            div.style.position = 'absolute';
            div.style.top = DIV_TOUCH_POS_X + "px";
            div.style.left = DIV_TOUCH_POS_Y + "px";
            div.style.zIndex = DIV_TOUCH_ZINDEX.toString();
            this.div = div;
            this.renderer = renderer;
            /**
             * pre-bind the functions
             *
             * @type {Function}
             * @private
             */
            this._onKeyDown = this._onKeyDown.bind(this);
            /**
             * pre-bind the functions
             *
             * @type {Function}
             * @private
             */
            this._onMouseMove = this._onMouseMove.bind(this);
            // let listen for tab.. once pressed we can fire up and show the accessibility layer
            globalThis.addEventListener('keydown', this._onKeyDown, false);
        }
        Object.defineProperty(AccessibilityManager.prototype, "isActive", {
            /**
             * Value of `true` if accessibility is currently active and accessibility layers are showing.
             * @member {boolean}
             * @readonly
             */
            get: function () {
                return this._isActive;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(AccessibilityManager.prototype, "isMobileAccessibility", {
            /**
             * Value of `true` if accessibility is enabled for touch devices.
             * @member {boolean}
             * @readonly
             */
            get: function () {
                return this._isMobileAccessibility;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Creates the touch hooks.
         *
         * @private
         */
        AccessibilityManager.prototype.createTouchHook = function () {
            var _this = this;
            var hookDiv = document.createElement('button');
            hookDiv.style.width = DIV_HOOK_SIZE + "px";
            hookDiv.style.height = DIV_HOOK_SIZE + "px";
            hookDiv.style.position = 'absolute';
            hookDiv.style.top = DIV_HOOK_POS_X + "px";
            hookDiv.style.left = DIV_HOOK_POS_Y + "px";
            hookDiv.style.zIndex = DIV_HOOK_ZINDEX.toString();
            hookDiv.style.backgroundColor = '#FF0000';
            hookDiv.title = 'select to enable accessibility for this content';
            hookDiv.addEventListener('focus', function () {
                _this._isMobileAccessibility = true;
                _this.activate();
                _this.destroyTouchHook();
            });
            document.body.appendChild(hookDiv);
            this._hookDiv = hookDiv;
        };
        /**
         * Destroys the touch hooks.
         *
         * @private
         */
        AccessibilityManager.prototype.destroyTouchHook = function () {
            if (!this._hookDiv) {
                return;
            }
            document.body.removeChild(this._hookDiv);
            this._hookDiv = null;
        };
        /**
         * Activating will cause the Accessibility layer to be shown.
         * This is called when a user presses the tab key.
         *
         * @private
         */
        AccessibilityManager.prototype.activate = function () {
            var _a;
            if (this._isActive) {
                return;
            }
            this._isActive = true;
            globalThis.document.addEventListener('mousemove', this._onMouseMove, true);
            globalThis.removeEventListener('keydown', this._onKeyDown, false);
            this.renderer.on('postrender', this.update, this);
            (_a = this.renderer.view.parentNode) === null || _a === void 0 ? void 0 : _a.appendChild(this.div);
        };
        /**
         * Deactivating will cause the Accessibility layer to be hidden.
         * This is called when a user moves the mouse.
         *
         * @private
         */
        AccessibilityManager.prototype.deactivate = function () {
            var _a;
            if (!this._isActive || this._isMobileAccessibility) {
                return;
            }
            this._isActive = false;
            globalThis.document.removeEventListener('mousemove', this._onMouseMove, true);
            globalThis.addEventListener('keydown', this._onKeyDown, false);
            this.renderer.off('postrender', this.update);
            (_a = this.div.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this.div);
        };
        /**
         * This recursive function will run through the scene graph and add any new accessible objects to the DOM layer.
         *
         * @private
         * @param {PIXI.Container} displayObject - The DisplayObject to check.
         */
        AccessibilityManager.prototype.updateAccessibleObjects = function (displayObject) {
            if (!displayObject.visible || !displayObject.accessibleChildren) {
                return;
            }
            if (displayObject.accessible && displayObject.interactive) {
                if (!displayObject._accessibleActive) {
                    this.addChild(displayObject);
                }
                displayObject.renderId = this.renderId;
            }
            var children = displayObject.children;
            if (children) {
                for (var i = 0; i < children.length; i++) {
                    this.updateAccessibleObjects(children[i]);
                }
            }
        };
        /**
         * Before each render this function will ensure that all divs are mapped correctly to their DisplayObjects.
         *
         * @private
         */
        AccessibilityManager.prototype.update = function () {
            /* On Android default web browser, tab order seems to be calculated by position rather than tabIndex,
            *  moving buttons can cause focus to flicker between two buttons making it hard/impossible to navigate,
            *  so I am just running update every half a second, seems to fix it.
            */
            var now = performance.now();
            if (isMobile$1.android.device && now < this.androidUpdateCount) {
                return;
            }
            this.androidUpdateCount = now + this.androidUpdateFrequency;
            if (!this.renderer.renderingToScreen) {
                return;
            }
            // update children...
            if (this.renderer._lastObjectRendered) {
                this.updateAccessibleObjects(this.renderer._lastObjectRendered);
            }
            var _a = this.renderer.view.getBoundingClientRect(), left = _a.left, top = _a.top, width = _a.width, height = _a.height;
            var _b = this.renderer, viewWidth = _b.width, viewHeight = _b.height, resolution = _b.resolution;
            var sx = (width / viewWidth) * resolution;
            var sy = (height / viewHeight) * resolution;
            var div = this.div;
            div.style.left = left + "px";
            div.style.top = top + "px";
            div.style.width = viewWidth + "px";
            div.style.height = viewHeight + "px";
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if (child.renderId !== this.renderId) {
                    child._accessibleActive = false;
                    removeItems(this.children, i, 1);
                    this.div.removeChild(child._accessibleDiv);
                    this.pool.push(child._accessibleDiv);
                    child._accessibleDiv = null;
                    i--;
                }
                else {
                    // map div to display..
                    div = child._accessibleDiv;
                    var hitArea = child.hitArea;
                    var wt = child.worldTransform;
                    if (child.hitArea) {
                        div.style.left = (wt.tx + (hitArea.x * wt.a)) * sx + "px";
                        div.style.top = (wt.ty + (hitArea.y * wt.d)) * sy + "px";
                        div.style.width = hitArea.width * wt.a * sx + "px";
                        div.style.height = hitArea.height * wt.d * sy + "px";
                    }
                    else {
                        hitArea = child.getBounds();
                        this.capHitArea(hitArea);
                        div.style.left = hitArea.x * sx + "px";
                        div.style.top = hitArea.y * sy + "px";
                        div.style.width = hitArea.width * sx + "px";
                        div.style.height = hitArea.height * sy + "px";
                        // update button titles and hints if they exist and they've changed
                        if (div.title !== child.accessibleTitle && child.accessibleTitle !== null) {
                            div.title = child.accessibleTitle;
                        }
                        if (div.getAttribute('aria-label') !== child.accessibleHint
                            && child.accessibleHint !== null) {
                            div.setAttribute('aria-label', child.accessibleHint);
                        }
                    }
                    // the title or index may have changed, if so lets update it!
                    if (child.accessibleTitle !== div.title || child.tabIndex !== div.tabIndex) {
                        div.title = child.accessibleTitle;
                        div.tabIndex = child.tabIndex;
                        if (this.debug)
                            { this.updateDebugHTML(div); }
                    }
                }
            }
            // increment the render id..
            this.renderId++;
        };
        /**
         * private function that will visually add the information to the
         * accessability div
         *
         * @param {HTMLElement} div
         */
        AccessibilityManager.prototype.updateDebugHTML = function (div) {
            div.innerHTML = "type: " + div.type + "</br> title : " + div.title + "</br> tabIndex: " + div.tabIndex;
        };
        /**
         * Adjust the hit area based on the bounds of a display object
         *
         * @param {PIXI.Rectangle} hitArea - Bounds of the child
         */
        AccessibilityManager.prototype.capHitArea = function (hitArea) {
            if (hitArea.x < 0) {
                hitArea.width += hitArea.x;
                hitArea.x = 0;
            }
            if (hitArea.y < 0) {
                hitArea.height += hitArea.y;
                hitArea.y = 0;
            }
            var _a = this.renderer, viewWidth = _a.width, viewHeight = _a.height;
            if (hitArea.x + hitArea.width > viewWidth) {
                hitArea.width = viewWidth - hitArea.x;
            }
            if (hitArea.y + hitArea.height > viewHeight) {
                hitArea.height = viewHeight - hitArea.y;
            }
        };
        /**
         * Adds a DisplayObject to the accessibility manager
         *
         * @private
         * @param {PIXI.DisplayObject} displayObject - The child to make accessible.
         */
        AccessibilityManager.prototype.addChild = function (displayObject) {
            //    this.activate();
            var div = this.pool.pop();
            if (!div) {
                div = document.createElement('button');
                div.style.width = DIV_TOUCH_SIZE + "px";
                div.style.height = DIV_TOUCH_SIZE + "px";
                div.style.backgroundColor = this.debug ? 'rgba(255,255,255,0.5)' : 'transparent';
                div.style.position = 'absolute';
                div.style.zIndex = DIV_TOUCH_ZINDEX.toString();
                div.style.borderStyle = 'none';
                // ARIA attributes ensure that button title and hint updates are announced properly
                if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
                    // Chrome doesn't need aria-live to work as intended; in fact it just gets more confused.
                    div.setAttribute('aria-live', 'off');
                }
                else {
                    div.setAttribute('aria-live', 'polite');
                }
                if (navigator.userAgent.match(/rv:.*Gecko\//)) {
                    // FireFox needs this to announce only the new button name
                    div.setAttribute('aria-relevant', 'additions');
                }
                else {
                    // required by IE, other browsers don't much care
                    div.setAttribute('aria-relevant', 'text');
                }
                div.addEventListener('click', this._onClick.bind(this));
                div.addEventListener('focus', this._onFocus.bind(this));
                div.addEventListener('focusout', this._onFocusOut.bind(this));
            }
            // set pointer events
            div.style.pointerEvents = displayObject.accessiblePointerEvents;
            // set the type, this defaults to button!
            div.type = displayObject.accessibleType;
            if (displayObject.accessibleTitle && displayObject.accessibleTitle !== null) {
                div.title = displayObject.accessibleTitle;
            }
            else if (!displayObject.accessibleHint
                || displayObject.accessibleHint === null) {
                div.title = "displayObject " + displayObject.tabIndex;
            }
            if (displayObject.accessibleHint
                && displayObject.accessibleHint !== null) {
                div.setAttribute('aria-label', displayObject.accessibleHint);
            }
            if (this.debug)
                { this.updateDebugHTML(div); }
            displayObject._accessibleActive = true;
            displayObject._accessibleDiv = div;
            div.displayObject = displayObject;
            this.children.push(displayObject);
            this.div.appendChild(displayObject._accessibleDiv);
            displayObject._accessibleDiv.tabIndex = displayObject.tabIndex;
        };
        /**
         * Maps the div button press to pixi's InteractionManager (click)
         *
         * @private
         * @param {MouseEvent} e - The click event.
         */
        AccessibilityManager.prototype._onClick = function (e) {
            var interactionManager = this.renderer.plugins.interaction;
            var displayObject = e.target.displayObject;
            var eventData = interactionManager.eventData;
            interactionManager.dispatchEvent(displayObject, 'click', eventData);
            interactionManager.dispatchEvent(displayObject, 'pointertap', eventData);
            interactionManager.dispatchEvent(displayObject, 'tap', eventData);
        };
        /**
         * Maps the div focus events to pixi's InteractionManager (mouseover)
         *
         * @private
         * @param {FocusEvent} e - The focus event.
         */
        AccessibilityManager.prototype._onFocus = function (e) {
            if (!e.target.getAttribute('aria-live')) {
                e.target.setAttribute('aria-live', 'assertive');
            }
            var interactionManager = this.renderer.plugins.interaction;
            var displayObject = e.target.displayObject;
            var eventData = interactionManager.eventData;
            interactionManager.dispatchEvent(displayObject, 'mouseover', eventData);
        };
        /**
         * Maps the div focus events to pixi's InteractionManager (mouseout)
         *
         * @private
         * @param {FocusEvent} e - The focusout event.
         */
        AccessibilityManager.prototype._onFocusOut = function (e) {
            if (!e.target.getAttribute('aria-live')) {
                e.target.setAttribute('aria-live', 'polite');
            }
            var interactionManager = this.renderer.plugins.interaction;
            var displayObject = e.target.displayObject;
            var eventData = interactionManager.eventData;
            interactionManager.dispatchEvent(displayObject, 'mouseout', eventData);
        };
        /**
         * Is called when a key is pressed
         *
         * @private
         * @param {KeyboardEvent} e - The keydown event.
         */
        AccessibilityManager.prototype._onKeyDown = function (e) {
            if (e.keyCode !== KEY_CODE_TAB) {
                return;
            }
            this.activate();
        };
        /**
         * Is called when the mouse moves across the renderer element
         *
         * @private
         * @param {MouseEvent} e - The mouse event.
         */
        AccessibilityManager.prototype._onMouseMove = function (e) {
            if (e.movementX === 0 && e.movementY === 0) {
                return;
            }
            this.deactivate();
        };
        /**
         * Destroys the accessibility manager
         *
         */
        AccessibilityManager.prototype.destroy = function () {
            this.destroyTouchHook();
            this.div = null;
            globalThis.document.removeEventListener('mousemove', this._onMouseMove, true);
            globalThis.removeEventListener('keydown', this._onKeyDown);
            this.pool = null;
            this.children = null;
            this.renderer = null;
        };
        return AccessibilityManager;
    }());
  
    /*!
     * @pixi/ticker - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/ticker is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
  
    /**
     * Target frames per millisecond.
     *
     * @static
     * @name TARGET_FPMS
     * @memberof PIXI.settings
     * @type {number}
     * @default 0.06
     */
    settings.TARGET_FPMS = 0.06;
  
    /**
     * Represents the update priorities used by internal PIXI classes when registered with
     * the {@link PIXI.Ticker} object. Higher priority items are updated first and lower
     * priority items, such as render, should go later.
     *
     * @static
     * @constant
     * @name UPDATE_PRIORITY
     * @memberof PIXI
     * @enum {number}
     * @property {number} INTERACTION=50 Highest priority, used for {@link PIXI.InteractionManager}
     * @property {number} HIGH=25 High priority updating, {@link PIXI.VideoBaseTexture} and {@link PIXI.AnimatedSprite}
     * @property {number} NORMAL=0 Default priority for ticker events, see {@link PIXI.Ticker#add}.
     * @property {number} LOW=-25 Low priority used for {@link PIXI.Application} rendering.
     * @property {number} UTILITY=-50 Lowest priority used for {@link PIXI.BasePrepare} utility.
     */
  
    (function (UPDATE_PRIORITY) {
        UPDATE_PRIORITY[UPDATE_PRIORITY["INTERACTION"] = 50] = "INTERACTION";
        UPDATE_PRIORITY[UPDATE_PRIORITY["HIGH"] = 25] = "HIGH";
        UPDATE_PRIORITY[UPDATE_PRIORITY["NORMAL"] = 0] = "NORMAL";
        UPDATE_PRIORITY[UPDATE_PRIORITY["LOW"] = -25] = "LOW";
        UPDATE_PRIORITY[UPDATE_PRIORITY["UTILITY"] = -50] = "UTILITY";
    })(exports.UPDATE_PRIORITY || (exports.UPDATE_PRIORITY = {}));
  
    /**
     * Internal class for handling the priority sorting of ticker handlers.
     *
     * @private
     * @class
     * @memberof PIXI
     */
    var TickerListener = /** @class */ (function () {
        /**
         * Constructor
         * @private
         * @param fn - The listener function to be added for one update
         * @param context - The listener context
         * @param priority - The priority for emitting
         * @param once - If the handler should fire once
         */
        function TickerListener(fn, context, priority, once) {
            if (context === void 0) { context = null; }
            if (priority === void 0) { priority = 0; }
            if (once === void 0) { once = false; }
            /** The next item in chain. */
            this.next = null;
            /** The previous item in chain. */
            this.previous = null;
            /** `true` if this listener has been destroyed already. */
            this._destroyed = false;
            this.fn = fn;
            this.context = context;
            this.priority = priority;
            this.once = once;
        }
        /**
         * Simple compare function to figure out if a function and context match.
         * @private
         * @param fn - The listener function to be added for one update
         * @param context - The listener context
         * @return `true` if the listener match the arguments
         */
        TickerListener.prototype.match = function (fn, context) {
            if (context === void 0) { context = null; }
            return this.fn === fn && this.context === context;
        };
        /**
         * Emit by calling the current function.
         * @private
         * @param deltaTime - time since the last emit.
         * @return Next ticker
         */
        TickerListener.prototype.emit = function (deltaTime) {
            if (this.fn) {
                if (this.context) {
                    this.fn.call(this.context, deltaTime);
                }
                else {
                    this.fn(deltaTime);
                }
            }
            var redirect = this.next;
            if (this.once) {
                this.destroy(true);
            }
            // Soft-destroying should remove
            // the next reference
            if (this._destroyed) {
                this.next = null;
            }
            return redirect;
        };
        /**
         * Connect to the list.
         * @private
         * @param previous - Input node, previous listener
         */
        TickerListener.prototype.connect = function (previous) {
            this.previous = previous;
            if (previous.next) {
                previous.next.previous = this;
            }
            this.next = previous.next;
            previous.next = this;
        };
        /**
         * Destroy and don't use after this.
         * @private
         * @param hard - `true` to remove the `next` reference, this
         *        is considered a hard destroy. Soft destroy maintains the next reference.
         * @return The listener to redirect while emitting or removing.
         */
        TickerListener.prototype.destroy = function (hard) {
            if (hard === void 0) { hard = false; }
            this._destroyed = true;
            this.fn = null;
            this.context = null;
            // Disconnect, hook up next and previous
            if (this.previous) {
                this.previous.next = this.next;
            }
            if (this.next) {
                this.next.previous = this.previous;
            }
            // Redirect to the next item
            var redirect = this.next;
            // Remove references
            this.next = hard ? null : redirect;
            this.previous = null;
            return redirect;
        };
        return TickerListener;
    }());
  
    /**
     * A Ticker class that runs an update loop that other objects listen to.
     *
     * This class is composed around listeners meant for execution on the next requested animation frame.
     * Animation frames are requested only when necessary, e.g. When the ticker is started and the emitter has listeners.
     *
     * @class
     * @memberof PIXI
     */
    var Ticker = /** @class */ (function () {
        function Ticker() {
            var _this = this;
            /**
             * Whether or not this ticker should invoke the method
             * {@link PIXI.Ticker#start} automatically
             * when a listener is added.
             */
            this.autoStart = false;
            /**
             * Scalar time value from last frame to this frame.
             * This value is capped by setting {@link PIXI.Ticker#minFPS}
             * and is scaled with {@link PIXI.Ticker#speed}.
             * **Note:** The cap may be exceeded by scaling.
             */
            this.deltaTime = 1;
            /**
             * The last time {@link PIXI.Ticker#update} was invoked.
             * This value is also reset internally outside of invoking
             * update, but only when a new animation frame is requested.
             * If the platform supports DOMHighResTimeStamp,
             * this value will have a precision of 1 Âµs.
             */
            this.lastTime = -1;
            /**
             * Factor of current {@link PIXI.Ticker#deltaTime}.
             * @example
             * // Scales ticker.deltaTime to what would be
             * // the equivalent of approximately 120 FPS
             * ticker.speed = 2;
             */
            this.speed = 1;
            /**
             * Whether or not this ticker has been started.
             * `true` if {@link PIXI.Ticker#start} has been called.
             * `false` if {@link PIXI.Ticker#stop} has been called.
             * While `false`, this value may change to `true` in the
             * event of {@link PIXI.Ticker#autoStart} being `true`
             * and a listener is added.
             */
            this.started = false;
            /** Internal current frame request ID */
            this._requestId = null;
            /**
             * Internal value managed by minFPS property setter and getter.
             * This is the maximum allowed milliseconds between updates.
             */
            this._maxElapsedMS = 100;
            /**
             * Internal value managed by minFPS property setter and getter.
             * This is the minimum allowed milliseconds between updates.
             */
            this._minElapsedMS = 0;
            /** If enabled, deleting is disabled.*/
            this._protected = false;
            /**
             * The last time keyframe was executed.
             * Maintains a relatively fixed interval with the previous value.
             */
            this._lastFrame = -1;
            this._head = new TickerListener(null, null, Infinity);
            this.deltaMS = 1 / settings.TARGET_FPMS;
            this.elapsedMS = 1 / settings.TARGET_FPMS;
            this._tick = function (time) {
                _this._requestId = null;
                if (_this.started) {
                    // Invoke listeners now
                    _this.update(time);
                    // Listener side effects may have modified ticker state.
                    if (_this.started && _this._requestId === null && _this._head.next) {
                        _this._requestId = requestAnimationFrame(_this._tick);
                    }
                }
            };
        }
        /**
         * Conditionally requests a new animation frame.
         * If a frame has not already been requested, and if the internal
         * emitter has listeners, a new frame is requested.
         *
         * @private
         */
        Ticker.prototype._requestIfNeeded = function () {
            if (this._requestId === null && this._head.next) {
                // ensure callbacks get correct delta
                this.lastTime = performance.now();
                this._lastFrame = this.lastTime;
                this._requestId = requestAnimationFrame(this._tick);
            }
        };
        /**
         * Conditionally cancels a pending animation frame.
         * @private
         */
        Ticker.prototype._cancelIfNeeded = function () {
            if (this._requestId !== null) {
                cancelAnimationFrame(this._requestId);
                this._requestId = null;
            }
        };
        /**
         * Conditionally requests a new animation frame.
         * If the ticker has been started it checks if a frame has not already
         * been requested, and if the internal emitter has listeners. If these
         * conditions are met, a new frame is requested. If the ticker has not
         * been started, but autoStart is `true`, then the ticker starts now,
         * and continues with the previous conditions to request a new frame.
         *
         * @private
         */
        Ticker.prototype._startIfPossible = function () {
            if (this.started) {
                this._requestIfNeeded();
            }
            else if (this.autoStart) {
                this.start();
            }
        };
        /**
         * Register a handler for tick events. Calls continuously unless
         * it is removed or the ticker is stopped.
         *
         * @param fn - The listener function to be added for updates
         * @param context - The listener context
         * @param {number} [priority=PIXI.UPDATE_PRIORITY.NORMAL] - The priority for emitting
         * @returns This instance of a ticker
         */
        Ticker.prototype.add = function (fn, context, priority) {
            if (priority === void 0) { priority = exports.UPDATE_PRIORITY.NORMAL; }
            return this._addListener(new TickerListener(fn, context, priority));
        };
        /**
         * Add a handler for the tick event which is only execute once.
         *
         * @param fn - The listener function to be added for one update
         * @param context - The listener context
         * @param {number} [priority=PIXI.UPDATE_PRIORITY.NORMAL] - The priority for emitting
         * @returns This instance of a ticker
         */
        Ticker.prototype.addOnce = function (fn, context, priority) {
            if (priority === void 0) { priority = exports.UPDATE_PRIORITY.NORMAL; }
            return this._addListener(new TickerListener(fn, context, priority, true));
        };
        /**
         * Internally adds the event handler so that it can be sorted by priority.
         * Priority allows certain handler (user, AnimatedSprite, Interaction) to be run
         * before the rendering.
         *
         * @private
         * @param listener - Current listener being added.
         * @returns This instance of a ticker
         */
        Ticker.prototype._addListener = function (listener) {
            // For attaching to head
            var current = this._head.next;
            var previous = this._head;
            // Add the first item
            if (!current) {
                listener.connect(previous);
            }
            else {
                // Go from highest to lowest priority
                while (current) {
                    if (listener.priority > current.priority) {
                        listener.connect(previous);
                        break;
                    }
                    previous = current;
                    current = current.next;
                }
                // Not yet connected
                if (!listener.previous) {
                    listener.connect(previous);
                }
            }
            this._startIfPossible();
            return this;
        };
        /**
         * Removes any handlers matching the function and context parameters.
         * If no handlers are left after removing, then it cancels the animation frame.
         *
         * @param fn - The listener function to be removed
         * @param context - The listener context to be removed
         * @returns This instance of a ticker
         */
        Ticker.prototype.remove = function (fn, context) {
            var listener = this._head.next;
            while (listener) {
                // We found a match, lets remove it
                // no break to delete all possible matches
                // incase a listener was added 2+ times
                if (listener.match(fn, context)) {
                    listener = listener.destroy();
                }
                else {
                    listener = listener.next;
                }
            }
            if (!this._head.next) {
                this._cancelIfNeeded();
            }
            return this;
        };
        Object.defineProperty(Ticker.prototype, "count", {
            /**
             * The number of listeners on this ticker, calculated by walking through linked list
             *
             * @readonly
             * @member {number}
             */
            get: function () {
                if (!this._head) {
                    return 0;
                }
                var count = 0;
                var current = this._head;
                while ((current = current.next)) {
                    count++;
                }
                return count;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Starts the ticker. If the ticker has listeners
         * a new animation frame is requested at this point.
         */
        Ticker.prototype.start = function () {
            if (!this.started) {
                this.started = true;
                this._requestIfNeeded();
            }
        };
        /**
         * Stops the ticker. If the ticker has requested
         * an animation frame it is canceled at this point.
         */
        Ticker.prototype.stop = function () {
            if (this.started) {
                this.started = false;
                this._cancelIfNeeded();
            }
        };
        /**
         * Destroy the ticker and don't use after this. Calling
         * this method removes all references to internal events.
         */
        Ticker.prototype.destroy = function () {
            if (!this._protected) {
                this.stop();
                var listener = this._head.next;
                while (listener) {
                    listener = listener.destroy(true);
                }
                this._head.destroy();
                this._head = null;
            }
        };
        /**
         * Triggers an update. An update entails setting the
         * current {@link PIXI.Ticker#elapsedMS},
         * the current {@link PIXI.Ticker#deltaTime},
         * invoking all listeners with current deltaTime,
         * and then finally setting {@link PIXI.Ticker#lastTime}
         * with the value of currentTime that was provided.
         * This method will be called automatically by animation
         * frame callbacks if the ticker instance has been started
         * and listeners are added.
         *
         * @param {number} [currentTime=performance.now()] - the current time of execution
         */
        Ticker.prototype.update = function (currentTime) {
            if (currentTime === void 0) { currentTime = performance.now(); }
            var elapsedMS;
            // If the difference in time is zero or negative, we ignore most of the work done here.
            // If there is no valid difference, then should be no reason to let anyone know about it.
            // A zero delta, is exactly that, nothing should update.
            //
            // The difference in time can be negative, and no this does not mean time traveling.
            // This can be the result of a race condition between when an animation frame is requested
            // on the current JavaScript engine event loop, and when the ticker's start method is invoked
            // (which invokes the internal _requestIfNeeded method). If a frame is requested before
            // _requestIfNeeded is invoked, then the callback for the animation frame the ticker requests,
            // can receive a time argument that can be less than the lastTime value that was set within
            // _requestIfNeeded. This difference is in microseconds, but this is enough to cause problems.
            //
            // This check covers this browser engine timing issue, as well as if consumers pass an invalid
            // currentTime value. This may happen if consumers opt-out of the autoStart, and update themselves.
            if (currentTime > this.lastTime) {
                // Save uncapped elapsedMS for measurement
                elapsedMS = this.elapsedMS = currentTime - this.lastTime;
                // cap the milliseconds elapsed used for deltaTime
                if (elapsedMS > this._maxElapsedMS) {
                    elapsedMS = this._maxElapsedMS;
                }
                elapsedMS *= this.speed;
                // If not enough time has passed, exit the function.
                // Get ready for next frame by setting _lastFrame, but based on _minElapsedMS
                // adjustment to ensure a relatively stable interval.
                if (this._minElapsedMS) {
                    var delta = currentTime - this._lastFrame | 0;
                    if (delta < this._minElapsedMS) {
                        return;
                    }
                    this._lastFrame = currentTime - (delta % this._minElapsedMS);
                }
                this.deltaMS = elapsedMS;
                this.deltaTime = this.deltaMS * settings.TARGET_FPMS;
                // Cache a local reference, in-case ticker is destroyed
                // during the emit, we can still check for head.next
                var head = this._head;
                // Invoke listeners added to internal emitter
                var listener = head.next;
                while (listener) {
                    listener = listener.emit(this.deltaTime);
                }
                if (!head.next) {
                    this._cancelIfNeeded();
                }
            }
            else {
                this.deltaTime = this.deltaMS = this.elapsedMS = 0;
            }
            this.lastTime = currentTime;
        };
        Object.defineProperty(Ticker.prototype, "FPS", {
            /**
             * The frames per second at which this ticker is running.
             * The default is approximately 60 in most modern browsers.
             * **Note:** This does not factor in the value of
             * {@link PIXI.Ticker#speed}, which is specific
             * to scaling {@link PIXI.Ticker#deltaTime}.
             *
             * @member {number}
             * @readonly
             */
            get: function () {
                return 1000 / this.elapsedMS;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Ticker.prototype, "minFPS", {
            /**
             * Manages the maximum amount of milliseconds allowed to
             * elapse between invoking {@link PIXI.Ticker#update}.
             * This value is used to cap {@link PIXI.Ticker#deltaTime},
             * but does not effect the measured value of {@link PIXI.Ticker#FPS}.
             * When setting this property it is clamped to a value between
             * `0` and `PIXI.settings.TARGET_FPMS * 1000`.
             *
             * @member {number}
             * @default 10
             */
            get: function () {
                return 1000 / this._maxElapsedMS;
            },
            set: function (fps) {
                // Minimum must be below the maxFPS
                var minFPS = Math.min(this.maxFPS, fps);
                // Must be at least 0, but below 1 / settings.TARGET_FPMS
                var minFPMS = Math.min(Math.max(0, minFPS) / 1000, settings.TARGET_FPMS);
                this._maxElapsedMS = 1 / minFPMS;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Ticker.prototype, "maxFPS", {
            /**
             * Manages the minimum amount of milliseconds required to
             * elapse between invoking {@link PIXI.Ticker#update}.
             * This will effect the measured value of {@link PIXI.Ticker#FPS}.
             * If it is set to `0`, then there is no limit; PixiJS will render as many frames as it can.
             * Otherwise it will be at least `minFPS`
             *
             * @member {number}
             * @default 0
             */
            get: function () {
                if (this._minElapsedMS) {
                    return Math.round(1000 / this._minElapsedMS);
                }
                return 0;
            },
            set: function (fps) {
                if (fps === 0) {
                    this._minElapsedMS = 0;
                }
                else {
                    // Max must be at least the minFPS
                    var maxFPS = Math.max(this.minFPS, fps);
                    this._minElapsedMS = 1 / (maxFPS / 1000);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Ticker, "shared", {
            /**
             * The shared ticker instance used by {@link PIXI.AnimatedSprite} and by
             * {@link PIXI.VideoResource} to update animation frames / video textures.
             *
             * It may also be used by {@link PIXI.Application} if created with the `sharedTicker` option property set to true.
             *
             * The property {@link PIXI.Ticker#autoStart} is set to `true` for this instance.
             * Please follow the examples for usage, including how to opt-out of auto-starting the shared ticker.
             *
             * @example
             * let ticker = PIXI.Ticker.shared;
             * // Set this to prevent starting this ticker when listeners are added.
             * // By default this is true only for the PIXI.Ticker.shared instance.
             * ticker.autoStart = false;
             * // FYI, call this to ensure the ticker is stopped. It should be stopped
             * // if you have not attempted to render anything yet.
             * ticker.stop();
             * // Call this when you are ready for a running shared ticker.
             * ticker.start();
             *
             * @example
             * // You may use the shared ticker to render...
             * let renderer = PIXI.autoDetectRenderer();
             * let stage = new PIXI.Container();
             * document.body.appendChild(renderer.view);
             * ticker.add(function (time) {
             *     renderer.render(stage);
             * });
             *
             * @example
             * // Or you can just update it manually.
             * ticker.autoStart = false;
             * ticker.stop();
             * function animate(time) {
             *     ticker.update(time);
             *     renderer.render(stage);
             *     requestAnimationFrame(animate);
             * }
             * animate(performance.now());
             *
             * @member {PIXI.Ticker}
             * @static
             */
            get: function () {
                if (!Ticker._shared) {
                    var shared = Ticker._shared = new Ticker();
                    shared.autoStart = true;
                    shared._protected = true;
                }
                return Ticker._shared;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Ticker, "system", {
            /**
             * The system ticker instance used by {@link PIXI.InteractionManager} and by
             * {@link PIXI.BasePrepare} for core timing functionality that shouldn't usually need to be paused,
             * unlike the `shared` ticker which drives visual animations and rendering which may want to be paused.
             *
             * The property {@link PIXI.Ticker#autoStart} is set to `true` for this instance.
             *
             * @member {PIXI.Ticker}
             * @static
             */
            get: function () {
                if (!Ticker._system) {
                    var system = Ticker._system = new Ticker();
                    system.autoStart = true;
                    system._protected = true;
                }
                return Ticker._system;
            },
            enumerable: false,
            configurable: true
        });
        return Ticker;
    }());
  
    /**
     * Middleware for for Application Ticker.
     *
     * @example
     * import {TickerPlugin} from '@pixi/ticker';
     * import {Application} from '@pixi/app';
     * Application.registerPlugin(TickerPlugin);
     *
     * @class
     * @memberof PIXI
     */
    var TickerPlugin = /** @class */ (function () {
        function TickerPlugin() {
        }
        /**
         * Initialize the plugin with scope of application instance
         *
         * @static
         * @private
         * @param {object} [options] - See application options
         */
        TickerPlugin.init = function (options) {
            var _this = this;
            // Set default
            options = Object.assign({
                autoStart: true,
                sharedTicker: false,
            }, options);
            // Create ticker setter
            Object.defineProperty(this, 'ticker', {
                set: function (ticker) {
                    if (this._ticker) {
                        this._ticker.remove(this.render, this);
                    }
                    this._ticker = ticker;
                    if (ticker) {
                        ticker.add(this.render, this, exports.UPDATE_PRIORITY.LOW);
                    }
                },
                get: function () {
                    return this._ticker;
                },
            });
            /**
             * Convenience method for stopping the render.
             *
             * @method
             * @memberof PIXI.Application
             * @instance
             */
            this.stop = function () {
                _this._ticker.stop();
            };
            /**
             * Convenience method for starting the render.
             *
             * @method
             * @memberof PIXI.Application
             * @instance
             */
            this.start = function () {
                _this._ticker.start();
            };
            /**
             * Internal reference to the ticker.
             *
             * @type {PIXI.Ticker}
             * @name _ticker
             * @memberof PIXI.Application#
             * @private
             */
            this._ticker = null;
            /**
             * Ticker for doing render updates.
             *
             * @type {PIXI.Ticker}
             * @name ticker
             * @memberof PIXI.Application#
             * @default PIXI.Ticker.shared
             */
            this.ticker = options.sharedTicker ? Ticker.shared : new Ticker();
            // Start the rendering
            if (options.autoStart) {
                this.start();
            }
        };
        /**
         * Clean up the ticker, scoped to application.
         *
         * @static
         * @private
         */
        TickerPlugin.destroy = function () {
            if (this._ticker) {
                var oldTicker = this._ticker;
                this.ticker = null;
                oldTicker.destroy();
            }
        };
        return TickerPlugin;
    }());
  
    /*!
     * @pixi/interaction - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/interaction is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
  
    /**
     * Holds all information related to an Interaction event
     *
     * @memberof PIXI
     */
    var InteractionData = /** @class */ (function () {
        function InteractionData() {
            /**
             * Pressure applied by the pointing device during the event. A Touch's force property
             * will be represented by this value.
             *
             * @see https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pressure
             */
            this.pressure = 0;
            /**
             * From TouchEvents (not PointerEvents triggered by touches), the rotationAngle of the Touch.
             *
             * @see https://developer.mozilla.org/en-US/docs/Web/API/Touch/rotationAngle
             */
            this.rotationAngle = 0;
            /**
             * Twist of a stylus pointer.
             *
             * @see https://w3c.github.io/pointerevents/#pointerevent-interface
             */
            this.twist = 0;
            /**
             * Barrel pressure on a stylus pointer.
             *
             * @see https://w3c.github.io/pointerevents/#pointerevent-interface
             */
            this.tangentialPressure = 0;
            this.global = new Point();
            this.target = null;
            this.originalEvent = null;
            this.identifier = null;
            this.isPrimary = false;
            this.button = 0;
            this.buttons = 0;
            this.width = 0;
            this.height = 0;
            this.tiltX = 0;
            this.tiltY = 0;
            this.pointerType = null;
            this.pressure = 0;
            this.rotationAngle = 0;
            this.twist = 0;
            this.tangentialPressure = 0;
        }
        Object.defineProperty(InteractionData.prototype, "pointerId", {
            /**
             * The unique identifier of the pointer. It will be the same as `identifier`.
             *
             * @readonly
             * @see https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerId
             */
            get: function () {
                return this.identifier;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * This will return the local coordinates of the specified displayObject for this InteractionData
         *
         * @param displayObject - The DisplayObject that you would like the local
         *  coords off
         * @param point - A Point object in which to store the value, optional (otherwise
         *  will create a new point)
         * @param globalPos - A Point object containing your custom global coords, optional
         *  (otherwise will use the current global coords)
         * @return - A point containing the coordinates of the InteractionData position relative
         *  to the DisplayObject
         */
        InteractionData.prototype.getLocalPosition = function (displayObject, point, globalPos) {
            return displayObject.worldTransform.applyInverse(globalPos || this.global, point);
        };
        /**
         * Copies properties from normalized event data.
         *
         * @param {Touch|MouseEvent|PointerEvent} event - The normalized event data
         */
        InteractionData.prototype.copyEvent = function (event) {
            // isPrimary should only change on touchstart/pointerdown, so we don't want to overwrite
            // it with "false" on later events when our shim for it on touch events might not be
            // accurate
            if ('isPrimary' in event && event.isPrimary) {
                this.isPrimary = true;
            }
            this.button = 'button' in event && event.button;
            // event.buttons is not available in all browsers (ie. Safari), but it does have a non-standard
            // event.which property instead, which conveys the same information.
            var buttons = 'buttons' in event && event.buttons;
            this.buttons = Number.isInteger(buttons) ? buttons : 'which' in event && event.which;
            this.width = 'width' in event && event.width;
            this.height = 'height' in event && event.height;
            this.tiltX = 'tiltX' in event && event.tiltX;
            this.tiltY = 'tiltY' in event && event.tiltY;
            this.pointerType = 'pointerType' in event && event.pointerType;
            this.pressure = 'pressure' in event && event.pressure;
            this.rotationAngle = 'rotationAngle' in event && event.rotationAngle;
            this.twist = ('twist' in event && event.twist) || 0;
            this.tangentialPressure = ('tangentialPressure' in event && event.tangentialPressure) || 0;
        };
        /** Resets the data for pooling. */
        InteractionData.prototype.reset = function () {
            // isPrimary is the only property that we really need to reset - everything else is
            // guaranteed to be overwritten
            this.isPrimary = false;
        };
        return InteractionData;
    }());
  
    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0
  
    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.
  
    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */
  
    var extendStatics$1 = function(d, b) {
        extendStatics$1 = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
        return extendStatics$1(d, b);
    };
  
    function __extends$1(d, b) {
        extendStatics$1(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
  
    /**
     * Event class that mimics native DOM events.
     *
     * @memberof PIXI
     */
    var InteractionEvent = /** @class */ (function () {
        function InteractionEvent() {
            this.stopped = false;
            this.stopsPropagatingAt = null;
            this.stopPropagationHint = false;
            this.target = null;
            this.currentTarget = null;
            this.type = null;
            this.data = null;
        }
        /** Prevents event from reaching any objects other than the current object. */
        InteractionEvent.prototype.stopPropagation = function () {
            this.stopped = true;
            this.stopPropagationHint = true;
            this.stopsPropagatingAt = this.currentTarget;
        };
        /** Resets the event. */
        InteractionEvent.prototype.reset = function () {
            this.stopped = false;
            this.stopsPropagatingAt = null;
            this.stopPropagationHint = false;
            this.currentTarget = null;
            this.target = null;
        };
        return InteractionEvent;
    }());
  
    /**
     * DisplayObjects with the {@link PIXI.interactiveTarget} mixin use this class to track interactions
     *
     * @class
     * @private
     * @memberof PIXI
     */
    var InteractionTrackingData = /** @class */ (function () {
        /**
         * @param {number} pointerId - Unique pointer id of the event
         * @private
         */
        function InteractionTrackingData(pointerId) {
            this._pointerId = pointerId;
            this._flags = InteractionTrackingData.FLAGS.NONE;
        }
        /**
         *
         * @private
         * @param {number} flag - The interaction flag to set
         * @param {boolean} yn - Should the flag be set or unset
         */
        InteractionTrackingData.prototype._doSet = function (flag, yn) {
            if (yn) {
                this._flags = this._flags | flag;
            }
            else {
                this._flags = this._flags & (~flag);
            }
        };
        Object.defineProperty(InteractionTrackingData.prototype, "pointerId", {
            /**
             * Unique pointer id of the event
             *
             * @readonly
             * @private
             * @member {number}
             */
            get: function () {
                return this._pointerId;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(InteractionTrackingData.prototype, "flags", {
            /**
             * State of the tracking data, expressed as bit flags
             *
             * @private
             * @member {number}
             */
            get: function () {
                return this._flags;
            },
            set: function (flags) {
                this._flags = flags;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(InteractionTrackingData.prototype, "none", {
            /**
             * Is the tracked event inactive (not over or down)?
             *
             * @private
             * @member {number}
             */
            get: function () {
                return this._flags === InteractionTrackingData.FLAGS.NONE;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(InteractionTrackingData.prototype, "over", {
            /**
             * Is the tracked event over the DisplayObject?
             *
             * @private
             * @member {boolean}
             */
            get: function () {
                return (this._flags & InteractionTrackingData.FLAGS.OVER) !== 0;
            },
            set: function (yn) {
                this._doSet(InteractionTrackingData.FLAGS.OVER, yn);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(InteractionTrackingData.prototype, "rightDown", {
            /**
             * Did the right mouse button come down in the DisplayObject?
             *
             * @private
             * @member {boolean}
             */
            get: function () {
                return (this._flags & InteractionTrackingData.FLAGS.RIGHT_DOWN) !== 0;
            },
            set: function (yn) {
                this._doSet(InteractionTrackingData.FLAGS.RIGHT_DOWN, yn);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(InteractionTrackingData.prototype, "leftDown", {
            /**
             * Did the left mouse button come down in the DisplayObject?
             *
             * @private
             * @member {boolean}
             */
            get: function () {
                return (this._flags & InteractionTrackingData.FLAGS.LEFT_DOWN) !== 0;
            },
            set: function (yn) {
                this._doSet(InteractionTrackingData.FLAGS.LEFT_DOWN, yn);
            },
            enumerable: false,
            configurable: true
        });
        InteractionTrackingData.FLAGS = Object.freeze({
            NONE: 0,
            OVER: 1 << 0,
            LEFT_DOWN: 1 << 1,
            RIGHT_DOWN: 1 << 2,
        });
        return InteractionTrackingData;
    }());
  
    /**
     * Strategy how to search through stage tree for interactive objects
     *
     * @memberof PIXI
     */
    var TreeSearch = /** @class */ (function () {
        function TreeSearch() {
            this._tempPoint = new Point();
        }
        /**
         * Recursive implementation for findHit
         *
         * @private
         * @param interactionEvent - event containing the point that
         *  is tested for collision
         * @param displayObject - the displayObject
         *  that will be hit test (recursively crawls its children)
         * @param func - the function that will be called on each interactive object. The
         *  interactionEvent, displayObject and hit will be passed to the function
         * @param hitTest - this indicates if the objects inside should be hit test against the point
         * @param interactive - Whether the displayObject is interactive
         * @return - Returns true if the displayObject hit the point
         */
        TreeSearch.prototype.recursiveFindHit = function (interactionEvent, displayObject, func, hitTest, interactive) {
            if (!displayObject || !displayObject.visible) {
                return false;
            }
            var point = interactionEvent.data.global;
            // Took a little while to rework this function correctly! But now it is done and nice and optimized! ^_^
            //
            // This function will now loop through all objects and then only hit test the objects it HAS
            // to, not all of them. MUCH faster..
            // An object will be hit test if the following is true:
            //
            // 1: It is interactive.
            // 2: It belongs to a parent that is interactive AND one of the parents children have not already been hit.
            //
            // As another little optimization once an interactive object has been hit we can carry on
            // through the scenegraph, but we know that there will be no more hits! So we can avoid extra hit tests
            // A final optimization is that an object is not hit test directly if a child has already been hit.
            interactive = displayObject.interactive || interactive;
            var hit = false;
            var interactiveParent = interactive;
            // Flag here can set to false if the event is outside the parents hitArea or mask
            var hitTestChildren = true;
            // If there is a hitArea, no need to test against anything else if the pointer is not within the hitArea
            // There is also no longer a need to hitTest children.
            if (displayObject.hitArea) {
                if (hitTest) {
                    displayObject.worldTransform.applyInverse(point, this._tempPoint);
                    if (!displayObject.hitArea.contains(this._tempPoint.x, this._tempPoint.y)) {
                        hitTest = false;
                        hitTestChildren = false;
                    }
                    else {
                        hit = true;
                    }
                }
                interactiveParent = false;
            }
            // If there is a mask, no need to hitTest against anything else if the pointer is not within the mask.
            // We still want to hitTestChildren, however, to ensure a mouseout can still be generated.
            // https://github.com/pixijs/pixi.js/issues/5135
            else if (displayObject._mask) {
                if (hitTest) {
                    if (!(displayObject._mask.containsPoint && displayObject._mask.containsPoint(point))) {
                        hitTest = false;
                    }
                }
            }
            // ** FREE TIP **! If an object is not interactive or has no buttons in it
            // (such as a game scene!) set interactiveChildren to false for that displayObject.
            // This will allow PixiJS to completely ignore and bypass checking the displayObjects children.
            if (hitTestChildren && displayObject.interactiveChildren && displayObject.children) {
                var children = displayObject.children;
                for (var i = children.length - 1; i >= 0; i--) {
                    var child = children[i];
                    // time to get recursive.. if this function will return if something is hit..
                    var childHit = this.recursiveFindHit(interactionEvent, child, func, hitTest, interactiveParent);
                    if (childHit) {
                        // its a good idea to check if a child has lost its parent.
                        // this means it has been removed whilst looping so its best
                        if (!child.parent) {
                            continue;
                        }
                        // we no longer need to hit test any more objects in this container as we we
                        // now know the parent has been hit
                        interactiveParent = false;
                        // If the child is interactive , that means that the object hit was actually
                        // interactive and not just the child of an interactive object.
                        // This means we no longer need to hit test anything else. We still need to run
                        // through all objects, but we don't need to perform any hit tests.
                        if (childHit) {
                            if (interactionEvent.target) {
                                hitTest = false;
                            }
                            hit = true;
                        }
                    }
                }
            }
            // no point running this if the item is not interactive or does not have an interactive parent.
            if (interactive) {
                // if we are hit testing (as in we have no hit any objects yet)
                // We also don't need to worry about hit testing if once of the displayObjects children
                // has already been hit - but only if it was interactive, otherwise we need to keep
                // looking for an interactive child, just in case we hit one
                if (hitTest && !interactionEvent.target) {
                    // already tested against hitArea if it is defined
                    if (!displayObject.hitArea && displayObject.containsPoint) {
                        if (displayObject.containsPoint(point)) {
                            hit = true;
                        }
                    }
                }
                if (displayObject.interactive) {
                    if (hit && !interactionEvent.target) {
                        interactionEvent.target = displayObject;
                    }
                    if (func) {
                        func(interactionEvent, displayObject, !!hit);
                    }
                }
            }
            return hit;
        };
        /**
         * This function is provides a neat way of crawling through the scene graph and running a
         * specified function on all interactive objects it finds. It will also take care of hit
         * testing the interactive objects and passes the hit across in the function.
         *
         * @private
         * @param interactionEvent - event containing the point that
         *  is tested for collision
         * @param displayObject - the displayObject
         *  that will be hit test (recursively crawls its children)
         * @param func - the function that will be called on each interactive object. The
         *  interactionEvent, displayObject and hit will be passed to the function
         * @param hitTest - this indicates if the objects inside should be hit test against the point
         * @return - Returns true if the displayObject hit the point
         */
        TreeSearch.prototype.findHit = function (interactionEvent, displayObject, func, hitTest) {
            this.recursiveFindHit(interactionEvent, displayObject, func, hitTest, false);
        };
        return TreeSearch;
    }());
  
    /**
     * Interface for classes that represent a hit area.
     *
     * It is implemented by the following classes:
     * - {@link PIXI.Circle}
     * - {@link PIXI.Ellipse}
     * - {@link PIXI.Polygon}
     * - {@link PIXI.RoundedRectangle}
     *
     * @interface IHitArea
     * @memberof PIXI
     */
    /**
     * Checks whether the x and y coordinates given are contained within this area
     *
     * @method
     * @name contains
     * @memberof PIXI.IHitArea#
     * @param {number} x - The X coordinate of the point to test
     * @param {number} y - The Y coordinate of the point to test
     * @return {boolean} Whether the x/y coordinates are within this area
     */
    /**
     * Default property values of interactive objects
     * Used by {@link PIXI.InteractionManager} to automatically give all DisplayObjects these properties
     *
     * @private
     * @name interactiveTarget
     * @type {Object}
     * @memberof PIXI
     * @example
     *      function MyObject() {}
     *
     *      Object.assign(
     *          DisplayObject.prototype,
     *          PIXI.interactiveTarget
     *      );
     */
    var interactiveTarget = {
        interactive: false,
        interactiveChildren: true,
        hitArea: null,
        /**
         * If enabled, the mouse cursor use the pointer behavior when hovered over the displayObject if it is interactive
         * Setting this changes the 'cursor' property to `'pointer'`.
         *
         * @example
         * const sprite = new PIXI.Sprite(texture);
         * sprite.interactive = true;
         * sprite.buttonMode = true;
         * @member {boolean}
         * @memberof PIXI.DisplayObject#
         */
        get buttonMode() {
            return this.cursor === 'pointer';
        },
        set buttonMode(value) {
            if (value) {
                this.cursor = 'pointer';
            }
            else if (this.cursor === 'pointer') {
                this.cursor = null;
            }
        },
        /**
         * This defines what cursor mode is used when the mouse cursor
         * is hovered over the displayObject.
         *
         * @example
         * const sprite = new PIXI.Sprite(texture);
         * sprite.interactive = true;
         * sprite.cursor = 'wait';
         * @see https://developer.mozilla.org/en/docs/Web/CSS/cursor
         *
         * @member {string}
         * @memberof PIXI.DisplayObject#
         */
        cursor: null,
        /**
         * Internal set of all active pointers, by identifier
         *
         * @member {Map<number, InteractionTrackingData>}
         * @memberof PIXI.DisplayObject#
         * @private
         */
        get trackedPointers() {
            if (this._trackedPointers === undefined)
                { this._trackedPointers = {}; }
            return this._trackedPointers;
        },
        /**
         * Map of all tracked pointers, by identifier. Use trackedPointers to access.
         *
         * @private
         * @type {Map<number, InteractionTrackingData>}
         */
        _trackedPointers: undefined,
    };
  
    // Mix interactiveTarget into DisplayObject.prototype
    DisplayObject.mixin(interactiveTarget);
    var MOUSE_POINTER_ID = 1;
    // helpers for hitTest() - only used inside hitTest()
    var hitTestEvent = {
        target: null,
        data: {
            global: null,
        },
    };
    /**
     * The interaction manager deals with mouse, touch and pointer events.
     *
     * Any DisplayObject can be interactive if its `interactive` property is set to true.
     *
     * This manager also supports multitouch.
     *
     * An instance of this class is automatically created by default, and can be found at `renderer.plugins.interaction`
     *
     * @memberof PIXI
     */
    var InteractionManager = /** @class */ (function (_super) {
        __extends$1(InteractionManager, _super);
        /**
         * @param {PIXI.CanvasRenderer|PIXI.Renderer} renderer - A reference to the current renderer
         * @param options - The options for the manager.
         * @param {boolean} [options.autoPreventDefault=true] - Should the manager automatically prevent default browser actions.
         * @param {number} [options.interactionFrequency=10] - Maximum frequency (ms) at pointer over/out states will be checked.
         * @param {number} [options.useSystemTicker=true] - Whether to add {@link tickerUpdate} to {@link PIXI.Ticker.system}.
         */
        function InteractionManager(renderer, options) {
            var _this = _super.call(this) || this;
            options = options || {};
            _this.renderer = renderer;
            _this.autoPreventDefault = options.autoPreventDefault !== undefined ? options.autoPreventDefault : true;
            _this.interactionFrequency = options.interactionFrequency || 10;
            _this.mouse = new InteractionData();
            _this.mouse.identifier = MOUSE_POINTER_ID;
            // setting the mouse to start off far off screen will mean that mouse over does
            //  not get called before we even move the mouse.
            _this.mouse.global.set(-999999);
            _this.activeInteractionData = {};
            _this.activeInteractionData[MOUSE_POINTER_ID] = _this.mouse;
            _this.interactionDataPool = [];
            _this.eventData = new InteractionEvent();
            _this.interactionDOMElement = null;
            _this.moveWhenInside = false;
            _this.eventsAdded = false;
            _this.tickerAdded = false;
            _this.mouseOverRenderer = !('PointerEvent' in globalThis);
            _this.supportsTouchEvents = 'ontouchstart' in globalThis;
            _this.supportsPointerEvents = !!globalThis.PointerEvent;
            // this will make it so that you don't have to call bind all the time
            _this.onPointerUp = _this.onPointerUp.bind(_this);
            _this.processPointerUp = _this.processPointerUp.bind(_this);
            _this.onPointerCancel = _this.onPointerCancel.bind(_this);
            _this.processPointerCancel = _this.processPointerCancel.bind(_this);
            _this.onPointerDown = _this.onPointerDown.bind(_this);
            _this.processPointerDown = _this.processPointerDown.bind(_this);
            _this.onPointerMove = _this.onPointerMove.bind(_this);
            _this.processPointerMove = _this.processPointerMove.bind(_this);
            _this.onPointerOut = _this.onPointerOut.bind(_this);
            _this.processPointerOverOut = _this.processPointerOverOut.bind(_this);
            _this.onPointerOver = _this.onPointerOver.bind(_this);
            _this.cursorStyles = {
                default: 'inherit',
                pointer: 'pointer',
            };
            _this.currentCursorMode = null;
            _this.cursor = null;
            _this.resolution = 1;
            _this.delayedEvents = [];
            _this.search = new TreeSearch();
            _this._tempDisplayObject = new TemporaryDisplayObject();
            _this._eventListenerOptions = { capture: true, passive: false };
            /**
             * Fired when a pointer device button (usually a mouse left-button) is pressed on the display
             * object.
             *
             * @event PIXI.InteractionManager#mousedown
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device secondary button (usually a mouse right-button) is pressed
             * on the display object.
             *
             * @event PIXI.InteractionManager#rightdown
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button (usually a mouse left-button) is released over the display
             * object.
             *
             * @event PIXI.InteractionManager#mouseup
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device secondary button (usually a mouse right-button) is released
             * over the display object.
             *
             * @event PIXI.InteractionManager#rightup
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button (usually a mouse left-button) is pressed and released on
             * the display object.
             *
             * @event PIXI.InteractionManager#click
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device secondary button (usually a mouse right-button) is pressed
             * and released on the display object.
             *
             * @event PIXI.InteractionManager#rightclick
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button (usually a mouse left-button) is released outside the
             * display object that initially registered a
             * [mousedown]{@link PIXI.InteractionManager#event:mousedown}.
             *
             * @event PIXI.InteractionManager#mouseupoutside
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device secondary button (usually a mouse right-button) is released
             * outside the display object that initially registered a
             * [rightdown]{@link PIXI.InteractionManager#event:rightdown}.
             *
             * @event PIXI.InteractionManager#rightupoutside
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device (usually a mouse) is moved while over the display object
             *
             * @event PIXI.InteractionManager#mousemove
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device (usually a mouse) is moved onto the display object
             *
             * @event PIXI.InteractionManager#mouseover
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device (usually a mouse) is moved off the display object
             *
             * @event PIXI.InteractionManager#mouseout
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button is pressed on the display object.
             *
             * @event PIXI.InteractionManager#pointerdown
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button is released over the display object.
             * Not always fired when some buttons are held down while others are released. In those cases,
             * use [mousedown]{@link PIXI.InteractionManager#event:mousedown} and
             * [mouseup]{@link PIXI.InteractionManager#event:mouseup} instead.
             *
             * @event PIXI.InteractionManager#pointerup
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when the operating system cancels a pointer event
             *
             * @event PIXI.InteractionManager#pointercancel
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button is pressed and released on the display object.
             *
             * @event PIXI.InteractionManager#pointertap
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button is released outside the display object that initially
             * registered a [pointerdown]{@link PIXI.InteractionManager#event:pointerdown}.
             *
             * @event PIXI.InteractionManager#pointerupoutside
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device is moved while over the display object
             *
             * @event PIXI.InteractionManager#pointermove
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device is moved onto the display object
             *
             * @event PIXI.InteractionManager#pointerover
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device is moved off the display object
             *
             * @event PIXI.InteractionManager#pointerout
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a touch point is placed on the display object.
             *
             * @event PIXI.InteractionManager#touchstart
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a touch point is removed from the display object.
             *
             * @event PIXI.InteractionManager#touchend
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when the operating system cancels a touch
             *
             * @event PIXI.InteractionManager#touchcancel
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a touch point is placed and removed from the display object.
             *
             * @event PIXI.InteractionManager#tap
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a touch point is removed outside of the display object that initially
             * registered a [touchstart]{@link PIXI.InteractionManager#event:touchstart}.
             *
             * @event PIXI.InteractionManager#touchendoutside
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a touch point is moved along the display object.
             *
             * @event PIXI.InteractionManager#touchmove
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button (usually a mouse left-button) is pressed on the display.
             * object. DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#mousedown
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device secondary button (usually a mouse right-button) is pressed
             * on the display object. DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#rightdown
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button (usually a mouse left-button) is released over the display
             * object. DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#mouseup
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device secondary button (usually a mouse right-button) is released
             * over the display object. DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#rightup
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button (usually a mouse left-button) is pressed and released on
             * the display object. DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#click
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device secondary button (usually a mouse right-button) is pressed
             * and released on the display object. DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#rightclick
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button (usually a mouse left-button) is released outside the
             * display object that initially registered a
             * [mousedown]{@link PIXI.DisplayObject#event:mousedown}.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#mouseupoutside
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device secondary button (usually a mouse right-button) is released
             * outside the display object that initially registered a
             * [rightdown]{@link PIXI.DisplayObject#event:rightdown}.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#rightupoutside
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device (usually a mouse) is moved while over the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#mousemove
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device (usually a mouse) is moved onto the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#mouseover
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device (usually a mouse) is moved off the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#mouseout
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button is pressed on the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#pointerdown
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button is released over the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#pointerup
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when the operating system cancels a pointer event.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#pointercancel
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button is pressed and released on the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#pointertap
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device button is released outside the display object that initially
             * registered a [pointerdown]{@link PIXI.DisplayObject#event:pointerdown}.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#pointerupoutside
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device is moved while over the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#pointermove
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device is moved onto the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#pointerover
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a pointer device is moved off the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#pointerout
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a touch point is placed on the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#touchstart
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a touch point is removed from the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#touchend
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when the operating system cancels a touch.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#touchcancel
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a touch point is placed and removed from the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#tap
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a touch point is removed outside of the display object that initially
             * registered a [touchstart]{@link PIXI.DisplayObject#event:touchstart}.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#touchendoutside
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            /**
             * Fired when a touch point is moved along the display object.
             * DisplayObject's `interactive` property must be set to `true` to fire event.
             *
             * This comes from the @pixi/interaction package.
             *
             * @event PIXI.DisplayObject#touchmove
             * @param {PIXI.InteractionEvent} event - Interaction event
             */
            _this._useSystemTicker = options.useSystemTicker !== undefined ? options.useSystemTicker : true;
            _this.setTargetElement(_this.renderer.view, _this.renderer.resolution);
            return _this;
        }
        Object.defineProperty(InteractionManager.prototype, "useSystemTicker", {
            /**
             * Should the InteractionManager automatically add {@link tickerUpdate} to {@link PIXI.Ticker.system}.
             *
             * @default true
             */
            get: function () {
                return this._useSystemTicker;
            },
            set: function (useSystemTicker) {
                this._useSystemTicker = useSystemTicker;
                if (useSystemTicker) {
                    this.addTickerListener();
                }
                else {
                    this.removeTickerListener();
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(InteractionManager.prototype, "lastObjectRendered", {
            /**
             * Last rendered object or temp object.
             *
             * @readonly
             * @protected
             */
            get: function () {
                return this.renderer._lastObjectRendered || this._tempDisplayObject;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Hit tests a point against the display tree, returning the first interactive object that is hit.
         *
         * @param globalPoint - A point to hit test with, in global space.
         * @param root - The root display object to start from. If omitted, defaults
         * to the last rendered root of the associated renderer.
         * @return - The hit display object, if any.
         */
        InteractionManager.prototype.hitTest = function (globalPoint, root) {
            // clear the target for our hit test
            hitTestEvent.target = null;
            // assign the global point
            hitTestEvent.data.global = globalPoint;
            // ensure safety of the root
            if (!root) {
                root = this.lastObjectRendered;
            }
            // run the hit test
            this.processInteractive(hitTestEvent, root, null, true);
            // return our found object - it'll be null if we didn't hit anything
            return hitTestEvent.target;
        };
        /**
         * Sets the DOM element which will receive mouse/touch events. This is useful for when you have
         * other DOM elements on top of the renderers Canvas element. With this you'll be bale to delegate
         * another DOM element to receive those events.
         *
         * @param element - the DOM element which will receive mouse and touch events.
         * @param resolution - The resolution / device pixel ratio of the new element (relative to the canvas).
         */
        InteractionManager.prototype.setTargetElement = function (element, resolution) {
            if (resolution === void 0) { resolution = 1; }
            this.removeTickerListener();
            this.removeEvents();
            this.interactionDOMElement = element;
            this.resolution = resolution;
            this.addEvents();
            this.addTickerListener();
        };
        /** Adds the ticker listener. */
        InteractionManager.prototype.addTickerListener = function () {
            if (this.tickerAdded || !this.interactionDOMElement || !this._useSystemTicker) {
                return;
            }
            Ticker.system.add(this.tickerUpdate, this, exports.UPDATE_PRIORITY.INTERACTION);
            this.tickerAdded = true;
        };
        /** Removes the ticker listener. */
        InteractionManager.prototype.removeTickerListener = function () {
            if (!this.tickerAdded) {
                return;
            }
            Ticker.system.remove(this.tickerUpdate, this);
            this.tickerAdded = false;
        };
        /** Registers all the DOM events. */
        InteractionManager.prototype.addEvents = function () {
            if (this.eventsAdded || !this.interactionDOMElement) {
                return;
            }
            var style = this.interactionDOMElement.style;
            if (globalThis.navigator.msPointerEnabled) {
                style.msContentZooming = 'none';
                style.msTouchAction = 'none';
            }
            else if (this.supportsPointerEvents) {
                style.touchAction = 'none';
            }
            /*
             * These events are added first, so that if pointer events are normalized, they are fired
             * in the same order as non-normalized events. ie. pointer event 1st, mouse / touch 2nd
             */
            if (this.supportsPointerEvents) {
                globalThis.document.addEventListener('pointermove', this.onPointerMove, this._eventListenerOptions);
                this.interactionDOMElement.addEventListener('pointerdown', this.onPointerDown, this._eventListenerOptions);
                // pointerout is fired in addition to pointerup (for touch events) and pointercancel
                // we already handle those, so for the purposes of what we do in onPointerOut, we only
                // care about the pointerleave event
                this.interactionDOMElement.addEventListener('pointerleave', this.onPointerOut, this._eventListenerOptions);
                this.interactionDOMElement.addEventListener('pointerover', this.onPointerOver, this._eventListenerOptions);
                globalThis.addEventListener('pointercancel', this.onPointerCancel, this._eventListenerOptions);
                globalThis.addEventListener('pointerup', this.onPointerUp, this._eventListenerOptions);
            }
            else {
                globalThis.document.addEventListener('mousemove', this.onPointerMove, this._eventListenerOptions);
                this.interactionDOMElement.addEventListener('mousedown', this.onPointerDown, this._eventListenerOptions);
                this.interactionDOMElement.addEventListener('mouseout', this.onPointerOut, this._eventListenerOptions);
                this.interactionDOMElement.addEventListener('mouseover', this.onPointerOver, this._eventListenerOptions);
                globalThis.addEventListener('mouseup', this.onPointerUp, this._eventListenerOptions);
            }
            // always look directly for touch events so that we can provide original data
            // In a future version we should change this to being just a fallback and rely solely on
            // PointerEvents whenever available
            if (this.supportsTouchEvents) {
                this.interactionDOMElement.addEventListener('touchstart', this.onPointerDown, this._eventListenerOptions);
                this.interactionDOMElement.addEventListener('touchcancel', this.onPointerCancel, this._eventListenerOptions);
                this.interactionDOMElement.addEventListener('touchend', this.onPointerUp, this._eventListenerOptions);
                this.interactionDOMElement.addEventListener('touchmove', this.onPointerMove, this._eventListenerOptions);
            }
            this.eventsAdded = true;
        };
        /** Removes all the DOM events that were previously registered. */
        InteractionManager.prototype.removeEvents = function () {
            if (!this.eventsAdded || !this.interactionDOMElement) {
                return;
            }
            var style = this.interactionDOMElement.style;
            if (globalThis.navigator.msPointerEnabled) {
                style.msContentZooming = '';
                style.msTouchAction = '';
            }
            else if (this.supportsPointerEvents) {
                style.touchAction = '';
            }
            if (this.supportsPointerEvents) {
                globalThis.document.removeEventListener('pointermove', this.onPointerMove, this._eventListenerOptions);
                this.interactionDOMElement.removeEventListener('pointerdown', this.onPointerDown, this._eventListenerOptions);
                this.interactionDOMElement.removeEventListener('pointerleave', this.onPointerOut, this._eventListenerOptions);
                this.interactionDOMElement.removeEventListener('pointerover', this.onPointerOver, this._eventListenerOptions);
                globalThis.removeEventListener('pointercancel', this.onPointerCancel, this._eventListenerOptions);
                globalThis.removeEventListener('pointerup', this.onPointerUp, this._eventListenerOptions);
            }
            else {
                globalThis.document.removeEventListener('mousemove', this.onPointerMove, this._eventListenerOptions);
                this.interactionDOMElement.removeEventListener('mousedown', this.onPointerDown, this._eventListenerOptions);
                this.interactionDOMElement.removeEventListener('mouseout', this.onPointerOut, this._eventListenerOptions);
                this.interactionDOMElement.removeEventListener('mouseover', this.onPointerOver, this._eventListenerOptions);
                globalThis.removeEventListener('mouseup', this.onPointerUp, this._eventListenerOptions);
            }
            if (this.supportsTouchEvents) {
                this.interactionDOMElement.removeEventListener('touchstart', this.onPointerDown, this._eventListenerOptions);
                this.interactionDOMElement.removeEventListener('touchcancel', this.onPointerCancel, this._eventListenerOptions);
                this.interactionDOMElement.removeEventListener('touchend', this.onPointerUp, this._eventListenerOptions);
                this.interactionDOMElement.removeEventListener('touchmove', this.onPointerMove, this._eventListenerOptions);
            }
            this.interactionDOMElement = null;
            this.eventsAdded = false;
        };
        /**
         * Updates the state of interactive objects if at least {@link interactionFrequency}
         * milliseconds have passed since the last invocation.
         *
         * Invoked by a throttled ticker update from {@link PIXI.Ticker.system}.
         *
         * @param deltaTime - time delta since the last call
         */
        InteractionManager.prototype.tickerUpdate = function (deltaTime) {
            this._deltaTime += deltaTime;
            if (this._deltaTime < this.interactionFrequency) {
                return;
            }
            this._deltaTime = 0;
            this.update();
        };
        /** Updates the state of interactive objects. */
        InteractionManager.prototype.update = function () {
            if (!this.interactionDOMElement) {
                return;
            }
            // if the user move the mouse this check has already been done using the mouse move!
            if (this._didMove) {
                this._didMove = false;
                return;
            }
            this.cursor = null;
            // Resets the flag as set by a stopPropagation call. This flag is usually reset by a user interaction of any kind,
            // but there was a scenario of a display object moving under a static mouse cursor.
            // In this case, mouseover and mouseevents would not pass the flag test in dispatchEvent function
            for (var k in this.activeInteractionData) {
                // eslint-disable-next-line no-prototype-builtins
                if (this.activeInteractionData.hasOwnProperty(k)) {
                    var interactionData = this.activeInteractionData[k];
                    if (interactionData.originalEvent && interactionData.pointerType !== 'touch') {
                        var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, interactionData.originalEvent, interactionData);
                        this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerOverOut, true);
                    }
                }
            }
            this.setCursorMode(this.cursor);
        };
        /**
         * Sets the current cursor mode, handling any callbacks or CSS style changes.
         *
         * @param mode - cursor mode, a key from the cursorStyles dictionary
         */
        InteractionManager.prototype.setCursorMode = function (mode) {
            mode = mode || 'default';
            var applyStyles = true;
            // offscreen canvas does not support setting styles, but cursor modes can be functions,
            // in order to handle pixi rendered cursors, so we can't bail
            if (globalThis.OffscreenCanvas && this.interactionDOMElement instanceof OffscreenCanvas) {
                applyStyles = false;
            }
            // if the mode didn't actually change, bail early
            if (this.currentCursorMode === mode) {
                return;
            }
            this.currentCursorMode = mode;
            var style = this.cursorStyles[mode];
            // only do things if there is a cursor style for it
            if (style) {
                switch (typeof style) {
                    case 'string':
                        // string styles are handled as cursor CSS
                        if (applyStyles) {
                            this.interactionDOMElement.style.cursor = style;
                        }
                        break;
                    case 'function':
                        // functions are just called, and passed the cursor mode
                        style(mode);
                        break;
                    case 'object':
                        // if it is an object, assume that it is a dictionary of CSS styles,
                        // apply it to the interactionDOMElement
                        if (applyStyles) {
                            Object.assign(this.interactionDOMElement.style, style);
                        }
                        break;
                }
            }
            else if (applyStyles && typeof mode === 'string' && !Object.prototype.hasOwnProperty.call(this.cursorStyles, mode)) {
                // if it mode is a string (not a Symbol) and cursorStyles doesn't have any entry
                // for the mode, then assume that the dev wants it to be CSS for the cursor.
                this.interactionDOMElement.style.cursor = mode;
            }
        };
        /**
         * Dispatches an event on the display object that was interacted with.
         *
         * @param displayObject - the display object in question
         * @param eventString - the name of the event (e.g, mousedown)
         * @param eventData - the event data object
         */
        InteractionManager.prototype.dispatchEvent = function (displayObject, eventString, eventData) {
            // Even if the event was stopped, at least dispatch any remaining events
            // for the same display object.
            if (!eventData.stopPropagationHint || displayObject === eventData.stopsPropagatingAt) {
                eventData.currentTarget = displayObject;
                eventData.type = eventString;
                displayObject.emit(eventString, eventData);
                if (displayObject[eventString]) {
                    displayObject[eventString](eventData);
                }
            }
        };
        /**
         * Puts a event on a queue to be dispatched later. This is used to guarantee correct
         * ordering of over/out events.
         *
         * @param displayObject - the display object in question
         * @param eventString - the name of the event (e.g, mousedown)
         * @param eventData - the event data object
         */
        InteractionManager.prototype.delayDispatchEvent = function (displayObject, eventString, eventData) {
            this.delayedEvents.push({ displayObject: displayObject, eventString: eventString, eventData: eventData });
        };
        /**
         * Maps x and y coords from a DOM object and maps them correctly to the PixiJS view. The
         * resulting value is stored in the point. This takes into account the fact that the DOM
         * element could be scaled and positioned anywhere on the screen.
         *
         * @param point - the point that the result will be stored in
         * @param x - the x coord of the position to map
         * @param y - the y coord of the position to map
         */
        InteractionManager.prototype.mapPositionToPoint = function (point, x, y) {
            var rect;
            // IE 11 fix
            if (!this.interactionDOMElement.parentElement) {
                rect = {
                    x: 0,
                    y: 0,
                    width: this.interactionDOMElement.width,
                    height: this.interactionDOMElement.height,
                    left: 0,
                    top: 0
                };
            }
            else {
                rect = this.interactionDOMElement.getBoundingClientRect();
            }
            var resolutionMultiplier = 1.0 / this.resolution;
            point.x = ((x - rect.left) * (this.interactionDOMElement.width / rect.width)) * resolutionMultiplier;
            point.y = ((y - rect.top) * (this.interactionDOMElement.height / rect.height)) * resolutionMultiplier;
        };
        /**
         * This function is provides a neat way of crawling through the scene graph and running a
         * specified function on all interactive objects it finds. It will also take care of hit
         * testing the interactive objects and passes the hit across in the function.
         *
         * @protected
         * @param interactionEvent - event containing the point that
         *  is tested for collision
         * @param displayObject - the displayObject
         *  that will be hit test (recursively crawls its children)
         * @param func - the function that will be called on each interactive object. The
         *  interactionEvent, displayObject and hit will be passed to the function
         * @param hitTest - indicates whether we want to calculate hits
         *  or just iterate through all interactive objects
         */
        InteractionManager.prototype.processInteractive = function (interactionEvent, displayObject, func, hitTest) {
            var hit = this.search.findHit(interactionEvent, displayObject, func, hitTest);
            var delayedEvents = this.delayedEvents;
            if (!delayedEvents.length) {
                return hit;
            }
            // Reset the propagation hint, because we start deeper in the tree again.
            interactionEvent.stopPropagationHint = false;
            var delayedLen = delayedEvents.length;
            this.delayedEvents = [];
            for (var i = 0; i < delayedLen; i++) {
                var _a = delayedEvents[i], displayObject_1 = _a.displayObject, eventString = _a.eventString, eventData = _a.eventData;
                // When we reach the object we wanted to stop propagating at,
                // set the propagation hint.
                if (eventData.stopsPropagatingAt === displayObject_1) {
                    eventData.stopPropagationHint = true;
                }
                this.dispatchEvent(displayObject_1, eventString, eventData);
            }
            return hit;
        };
        /**
         * Is called when the pointer button is pressed down on the renderer element
         *
         * @param originalEvent - The DOM event of a pointer button being pressed down
         */
        InteractionManager.prototype.onPointerDown = function (originalEvent) {
            // if we support touch events, then only use those for touch events, not pointer events
            if (this.supportsTouchEvents && originalEvent.pointerType === 'touch')
                { return; }
            var events = this.normalizeToPointerData(originalEvent);
            /*
             * No need to prevent default on natural pointer events, as there are no side effects
             * Normalized events, however, may have the double mousedown/touchstart issue on the native android browser,
             * so still need to be prevented.
             */
            // Guaranteed that there will be at least one event in events, and all events must have the same pointer type
            if (this.autoPreventDefault && events[0].isNormalized) {
                var cancelable = originalEvent.cancelable || !('cancelable' in originalEvent);
                if (cancelable) {
                    originalEvent.preventDefault();
                }
            }
            var eventLen = events.length;
            for (var i = 0; i < eventLen; i++) {
                var event = events[i];
                var interactionData = this.getInteractionDataForPointerId(event);
                var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
                interactionEvent.data.originalEvent = originalEvent;
                this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerDown, true);
                this.emit('pointerdown', interactionEvent);
                if (event.pointerType === 'touch') {
                    this.emit('touchstart', interactionEvent);
                }
                // emit a mouse event for "pen" pointers, the way a browser would emit a fallback event
                else if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                    var isRightButton = event.button === 2;
                    this.emit(isRightButton ? 'rightdown' : 'mousedown', this.eventData);
                }
            }
        };
        /**
         * Processes the result of the pointer down check and dispatches the event if need be
         *
         * @param interactionEvent - The interaction event wrapping the DOM event
         * @param displayObject - The display object that was tested
         * @param hit - the result of the hit test on the display object
         */
        InteractionManager.prototype.processPointerDown = function (interactionEvent, displayObject, hit) {
            var data = interactionEvent.data;
            var id = interactionEvent.data.identifier;
            if (hit) {
                if (!displayObject.trackedPointers[id]) {
                    displayObject.trackedPointers[id] = new InteractionTrackingData(id);
                }
                this.dispatchEvent(displayObject, 'pointerdown', interactionEvent);
                if (data.pointerType === 'touch') {
                    this.dispatchEvent(displayObject, 'touchstart', interactionEvent);
                }
                else if (data.pointerType === 'mouse' || data.pointerType === 'pen') {
                    var isRightButton = data.button === 2;
                    if (isRightButton) {
                        displayObject.trackedPointers[id].rightDown = true;
                    }
                    else {
                        displayObject.trackedPointers[id].leftDown = true;
                    }
                    this.dispatchEvent(displayObject, isRightButton ? 'rightdown' : 'mousedown', interactionEvent);
                }
            }
        };
        /**
         * Is called when the pointer button is released on the renderer element
         *
         * @param originalEvent - The DOM event of a pointer button being released
         * @param cancelled - true if the pointer is cancelled
         * @param func - Function passed to {@link processInteractive}
         */
        InteractionManager.prototype.onPointerComplete = function (originalEvent, cancelled, func) {
            var events = this.normalizeToPointerData(originalEvent);
            var eventLen = events.length;
            // if the event wasn't targeting our canvas, then consider it to be pointerupoutside
            // in all cases (unless it was a pointercancel)
            var eventAppend = originalEvent.target !== this.interactionDOMElement ? 'outside' : '';
            for (var i = 0; i < eventLen; i++) {
                var event = events[i];
                var interactionData = this.getInteractionDataForPointerId(event);
                var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
                interactionEvent.data.originalEvent = originalEvent;
                // perform hit testing for events targeting our canvas or cancel events
                this.processInteractive(interactionEvent, this.lastObjectRendered, func, cancelled || !eventAppend);
                this.emit(cancelled ? 'pointercancel' : "pointerup" + eventAppend, interactionEvent);
                if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                    var isRightButton = event.button === 2;
                    this.emit(isRightButton ? "rightup" + eventAppend : "mouseup" + eventAppend, interactionEvent);
                }
                else if (event.pointerType === 'touch') {
                    this.emit(cancelled ? 'touchcancel' : "touchend" + eventAppend, interactionEvent);
                    this.releaseInteractionDataForPointerId(event.pointerId);
                }
            }
        };
        /**
         * Is called when the pointer button is cancelled
         *
         * @param event - The DOM event of a pointer button being released
         */
        InteractionManager.prototype.onPointerCancel = function (event) {
            // if we support touch events, then only use those for touch events, not pointer events
            if (this.supportsTouchEvents && event.pointerType === 'touch')
                { return; }
            this.onPointerComplete(event, true, this.processPointerCancel);
        };
        /**
         * Processes the result of the pointer cancel check and dispatches the event if need be
         *
         * @param interactionEvent - The interaction event wrapping the DOM event
         * @param displayObject - The display object that was tested
         */
        InteractionManager.prototype.processPointerCancel = function (interactionEvent, displayObject) {
            var data = interactionEvent.data;
            var id = interactionEvent.data.identifier;
            if (displayObject.trackedPointers[id] !== undefined) {
                delete displayObject.trackedPointers[id];
                this.dispatchEvent(displayObject, 'pointercancel', interactionEvent);
                if (data.pointerType === 'touch') {
                    this.dispatchEvent(displayObject, 'touchcancel', interactionEvent);
                }
            }
        };
        /**
         * Is called when the pointer button is released on the renderer element
         *
         * @param event - The DOM event of a pointer button being released
         */
        InteractionManager.prototype.onPointerUp = function (event) {
            // if we support touch events, then only use those for touch events, not pointer events
            if (this.supportsTouchEvents && event.pointerType === 'touch')
                { return; }
            this.onPointerComplete(event, false, this.processPointerUp);
        };
        /**
         * Processes the result of the pointer up check and dispatches the event if need be
         *
         * @param interactionEvent - The interaction event wrapping the DOM event
         * @param displayObject - The display object that was tested
         * @param hit - the result of the hit test on the display object
         */
        InteractionManager.prototype.processPointerUp = function (interactionEvent, displayObject, hit) {
            var data = interactionEvent.data;
            var id = interactionEvent.data.identifier;
            var trackingData = displayObject.trackedPointers[id];
            var isTouch = data.pointerType === 'touch';
            var isMouse = (data.pointerType === 'mouse' || data.pointerType === 'pen');
            // need to track mouse down status in the mouse block so that we can emit
            // event in a later block
            var isMouseTap = false;
            // Mouse only
            if (isMouse) {
                var isRightButton = data.button === 2;
                var flags = InteractionTrackingData.FLAGS;
                var test = isRightButton ? flags.RIGHT_DOWN : flags.LEFT_DOWN;
                var isDown = trackingData !== undefined && (trackingData.flags & test);
                if (hit) {
                    this.dispatchEvent(displayObject, isRightButton ? 'rightup' : 'mouseup', interactionEvent);
                    if (isDown) {
                        this.dispatchEvent(displayObject, isRightButton ? 'rightclick' : 'click', interactionEvent);
                        // because we can confirm that the mousedown happened on this object, flag for later emit of pointertap
                        isMouseTap = true;
                    }
                }
                else if (isDown) {
                    this.dispatchEvent(displayObject, isRightButton ? 'rightupoutside' : 'mouseupoutside', interactionEvent);
                }
                // update the down state of the tracking data
                if (trackingData) {
                    if (isRightButton) {
                        trackingData.rightDown = false;
                    }
                    else {
                        trackingData.leftDown = false;
                    }
                }
            }
            // Pointers and Touches, and Mouse
            if (hit) {
                this.dispatchEvent(displayObject, 'pointerup', interactionEvent);
                if (isTouch)
                    { this.dispatchEvent(displayObject, 'touchend', interactionEvent); }
                if (trackingData) {
                    // emit pointertap if not a mouse, or if the mouse block decided it was a tap
                    if (!isMouse || isMouseTap) {
                        this.dispatchEvent(displayObject, 'pointertap', interactionEvent);
                    }
                    if (isTouch) {
                        this.dispatchEvent(displayObject, 'tap', interactionEvent);
                        // touches are no longer over (if they ever were) when we get the touchend
                        // so we should ensure that we don't keep pretending that they are
                        trackingData.over = false;
                    }
                }
            }
            else if (trackingData) {
                this.dispatchEvent(displayObject, 'pointerupoutside', interactionEvent);
                if (isTouch)
                    { this.dispatchEvent(displayObject, 'touchendoutside', interactionEvent); }
            }
            // Only remove the tracking data if there is no over/down state still associated with it
            if (trackingData && trackingData.none) {
                delete displayObject.trackedPointers[id];
            }
        };
        /**
         * Is called when the pointer moves across the renderer element
         *
         * @param originalEvent - The DOM event of a pointer moving
         */
        InteractionManager.prototype.onPointerMove = function (originalEvent) {
            // if we support touch events, then only use those for touch events, not pointer events
            if (this.supportsTouchEvents && originalEvent.pointerType === 'touch')
                { return; }
            var events = this.normalizeToPointerData(originalEvent);
            if (events[0].pointerType === 'mouse' || events[0].pointerType === 'pen') {
                this._didMove = true;
                this.cursor = null;
            }
            var eventLen = events.length;
            for (var i = 0; i < eventLen; i++) {
                var event = events[i];
                var interactionData = this.getInteractionDataForPointerId(event);
                var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
                interactionEvent.data.originalEvent = originalEvent;
                this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerMove, true);
                this.emit('pointermove', interactionEvent);
                if (event.pointerType === 'touch')
                    { this.emit('touchmove', interactionEvent); }
                if (event.pointerType === 'mouse' || event.pointerType === 'pen')
                    { this.emit('mousemove', interactionEvent); }
            }
            if (events[0].pointerType === 'mouse') {
                this.setCursorMode(this.cursor);
                // TODO BUG for parents interactive object (border order issue)
            }
        };
        /**
         * Processes the result of the pointer move check and dispatches the event if need be
         *
         * @param interactionEvent - The interaction event wrapping the DOM event
         * @param displayObject - The display object that was tested
         * @param hit - the result of the hit test on the display object
         */
        InteractionManager.prototype.processPointerMove = function (interactionEvent, displayObject, hit) {
            var data = interactionEvent.data;
            var isTouch = data.pointerType === 'touch';
            var isMouse = (data.pointerType === 'mouse' || data.pointerType === 'pen');
            if (isMouse) {
                this.processPointerOverOut(interactionEvent, displayObject, hit);
            }
            if (!this.moveWhenInside || hit) {
                this.dispatchEvent(displayObject, 'pointermove', interactionEvent);
                if (isTouch)
                    { this.dispatchEvent(displayObject, 'touchmove', interactionEvent); }
                if (isMouse)
                    { this.dispatchEvent(displayObject, 'mousemove', interactionEvent); }
            }
        };
        /**
         * Is called when the pointer is moved out of the renderer element
         *
         * @private
         * @param {PointerEvent} originalEvent - The DOM event of a pointer being moved out
         */
        InteractionManager.prototype.onPointerOut = function (originalEvent) {
            // if we support touch events, then only use those for touch events, not pointer events
            if (this.supportsTouchEvents && originalEvent.pointerType === 'touch')
                { return; }
            var events = this.normalizeToPointerData(originalEvent);
            // Only mouse and pointer can call onPointerOut, so events will always be length 1
            var event = events[0];
            if (event.pointerType === 'mouse') {
                this.mouseOverRenderer = false;
                this.setCursorMode(null);
            }
            var interactionData = this.getInteractionDataForPointerId(event);
            var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
            interactionEvent.data.originalEvent = event;
            this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerOverOut, false);
            this.emit('pointerout', interactionEvent);
            if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                this.emit('mouseout', interactionEvent);
            }
            else {
                // we can get touchleave events after touchend, so we want to make sure we don't
                // introduce memory leaks
                this.releaseInteractionDataForPointerId(interactionData.identifier);
            }
        };
        /**
         * Processes the result of the pointer over/out check and dispatches the event if need be.
         *
         * @param interactionEvent - The interaction event wrapping the DOM event
         * @param displayObject - The display object that was tested
         * @param hit - the result of the hit test on the display object
         */
        InteractionManager.prototype.processPointerOverOut = function (interactionEvent, displayObject, hit) {
            var data = interactionEvent.data;
            var id = interactionEvent.data.identifier;
            var isMouse = (data.pointerType === 'mouse' || data.pointerType === 'pen');
            var trackingData = displayObject.trackedPointers[id];
            // if we just moused over the display object, then we need to track that state
            if (hit && !trackingData) {
                trackingData = displayObject.trackedPointers[id] = new InteractionTrackingData(id);
            }
            if (trackingData === undefined)
                { return; }
            if (hit && this.mouseOverRenderer) {
                if (!trackingData.over) {
                    trackingData.over = true;
                    this.delayDispatchEvent(displayObject, 'pointerover', interactionEvent);
                    if (isMouse) {
                        this.delayDispatchEvent(displayObject, 'mouseover', interactionEvent);
                    }
                }
                // only change the cursor if it has not already been changed (by something deeper in the
                // display tree)
                if (isMouse && this.cursor === null) {
                    this.cursor = displayObject.cursor;
                }
            }
            else if (trackingData.over) {
                trackingData.over = false;
                this.dispatchEvent(displayObject, 'pointerout', this.eventData);
                if (isMouse) {
                    this.dispatchEvent(displayObject, 'mouseout', interactionEvent);
                }
                // if there is no mouse down information for the pointer, then it is safe to delete
                if (trackingData.none) {
                    delete displayObject.trackedPointers[id];
                }
            }
        };
        /**
         * Is called when the pointer is moved into the renderer element.
         *
         * @param originalEvent - The DOM event of a pointer button being moved into the renderer view.
         */
        InteractionManager.prototype.onPointerOver = function (originalEvent) {
            var events = this.normalizeToPointerData(originalEvent);
            // Only mouse and pointer can call onPointerOver, so events will always be length 1
            var event = events[0];
            var interactionData = this.getInteractionDataForPointerId(event);
            var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
            interactionEvent.data.originalEvent = event;
            if (event.pointerType === 'mouse') {
                this.mouseOverRenderer = true;
            }
            this.emit('pointerover', interactionEvent);
            if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                this.emit('mouseover', interactionEvent);
            }
        };
        /**
         * Get InteractionData for a given pointerId. Store that data as well.
         *
         * @param event - Normalized pointer event, output from normalizeToPointerData.
         * @return - Interaction data for the given pointer identifier.
         */
        InteractionManager.prototype.getInteractionDataForPointerId = function (event) {
            var pointerId = event.pointerId;
            var interactionData;
            if (pointerId === MOUSE_POINTER_ID || event.pointerType === 'mouse') {
                interactionData = this.mouse;
            }
            else if (this.activeInteractionData[pointerId]) {
                interactionData = this.activeInteractionData[pointerId];
            }
            else {
                interactionData = this.interactionDataPool.pop() || new InteractionData();
                interactionData.identifier = pointerId;
                this.activeInteractionData[pointerId] = interactionData;
            }
            // copy properties from the event, so that we can make sure that touch/pointer specific
            // data is available
            interactionData.copyEvent(event);
            return interactionData;
        };
        /**
         * Return unused InteractionData to the pool, for a given pointerId
         *
         * @param pointerId - Identifier from a pointer event
         */
        InteractionManager.prototype.releaseInteractionDataForPointerId = function (pointerId) {
            var interactionData = this.activeInteractionData[pointerId];
            if (interactionData) {
                delete this.activeInteractionData[pointerId];
                interactionData.reset();
                this.interactionDataPool.push(interactionData);
            }
        };
        /**
         * Configure an InteractionEvent to wrap a DOM PointerEvent and InteractionData
         *
         * @param interactionEvent - The event to be configured
         * @param pointerEvent - The DOM event that will be paired with the InteractionEvent
         * @param interactionData - The InteractionData that will be paired
         *        with the InteractionEvent
         * @return - the interaction event that was passed in
         */
        InteractionManager.prototype.configureInteractionEventForDOMEvent = function (interactionEvent, pointerEvent, interactionData) {
            interactionEvent.data = interactionData;
            this.mapPositionToPoint(interactionData.global, pointerEvent.clientX, pointerEvent.clientY);
            // Not really sure why this is happening, but it's how a previous version handled things
            if (pointerEvent.pointerType === 'touch') {
                pointerEvent.globalX = interactionData.global.x;
                pointerEvent.globalY = interactionData.global.y;
            }
            interactionData.originalEvent = pointerEvent;
            interactionEvent.reset();
            return interactionEvent;
        };
        /**
         * Ensures that the original event object contains all data that a regular pointer event would have
         *
         * @param {TouchEvent|MouseEvent|PointerEvent} event - The original event data from a touch or mouse event
         * @return - An array containing a single normalized pointer event, in the case of a pointer
         *  or mouse event, or a multiple normalized pointer events if there are multiple changed touches
         */
        InteractionManager.prototype.normalizeToPointerData = function (event) {
            var normalizedEvents = [];
            if (this.supportsTouchEvents && event instanceof TouchEvent) {
                for (var i = 0, li = event.changedTouches.length; i < li; i++) {
                    var touch = event.changedTouches[i];
                    if (typeof touch.button === 'undefined')
                        { touch.button = event.touches.length ? 1 : 0; }
                    if (typeof touch.buttons === 'undefined')
                        { touch.buttons = event.touches.length ? 1 : 0; }
                    if (typeof touch.isPrimary === 'undefined') {
                        touch.isPrimary = event.touches.length === 1 && event.type === 'touchstart';
                    }
                    if (typeof touch.width === 'undefined')
                        { touch.width = touch.radiusX || 1; }
                    if (typeof touch.height === 'undefined')
                        { touch.height = touch.radiusY || 1; }
                    if (typeof touch.tiltX === 'undefined')
                        { touch.tiltX = 0; }
                    if (typeof touch.tiltY === 'undefined')
                        { touch.tiltY = 0; }
                    if (typeof touch.pointerType === 'undefined')
                        { touch.pointerType = 'touch'; }
                    if (typeof touch.pointerId === 'undefined')
                        { touch.pointerId = touch.identifier || 0; }
                    if (typeof touch.pressure === 'undefined')
                        { touch.pressure = touch.force || 0.5; }
                    if (typeof touch.twist === 'undefined')
                        { touch.twist = 0; }
                    if (typeof touch.tangentialPressure === 'undefined')
                        { touch.tangentialPressure = 0; }
                    // TODO: Remove these, as layerX/Y is not a standard, is deprecated, has uneven
                    // support, and the fill ins are not quite the same
                    // offsetX/Y might be okay, but is not the same as clientX/Y when the canvas's top
                    // left is not 0,0 on the page
                    if (typeof touch.layerX === 'undefined')
                        { touch.layerX = touch.offsetX = touch.clientX; }
                    if (typeof touch.layerY === 'undefined')
                        { touch.layerY = touch.offsetY = touch.clientY; }
                    // mark the touch as normalized, just so that we know we did it
                    touch.isNormalized = true;
                    normalizedEvents.push(touch);
                }
            }
            // apparently PointerEvent subclasses MouseEvent, so yay
            else if (!globalThis.MouseEvent
                || (event instanceof MouseEvent && (!this.supportsPointerEvents || !(event instanceof globalThis.PointerEvent)))) {
                var tempEvent = event;
                if (typeof tempEvent.isPrimary === 'undefined')
                    { tempEvent.isPrimary = true; }
                if (typeof tempEvent.width === 'undefined')
                    { tempEvent.width = 1; }
                if (typeof tempEvent.height === 'undefined')
                    { tempEvent.height = 1; }
                if (typeof tempEvent.tiltX === 'undefined')
                    { tempEvent.tiltX = 0; }
                if (typeof tempEvent.tiltY === 'undefined')
                    { tempEvent.tiltY = 0; }
                if (typeof tempEvent.pointerType === 'undefined')
                    { tempEvent.pointerType = 'mouse'; }
                if (typeof tempEvent.pointerId === 'undefined')
                    { tempEvent.pointerId = MOUSE_POINTER_ID; }
                if (typeof tempEvent.pressure === 'undefined')
                    { tempEvent.pressure = 0.5; }
                if (typeof tempEvent.twist === 'undefined')
                    { tempEvent.twist = 0; }
                if (typeof tempEvent.tangentialPressure === 'undefined')
                    { tempEvent.tangentialPressure = 0; }
                // mark the mouse event as normalized, just so that we know we did it
                tempEvent.isNormalized = true;
                normalizedEvents.push(tempEvent);
            }
            else {
                normalizedEvents.push(event);
            }
            return normalizedEvents;
        };
        /** Destroys the interaction manager. */
        InteractionManager.prototype.destroy = function () {
            this.removeEvents();
            this.removeTickerListener();
            this.removeAllListeners();
            this.renderer = null;
            this.mouse = null;
            this.eventData = null;
            this.interactionDOMElement = null;
            this.onPointerDown = null;
            this.processPointerDown = null;
            this.onPointerUp = null;
            this.processPointerUp = null;
            this.onPointerCancel = null;
            this.processPointerCancel = null;
            this.onPointerMove = null;
            this.processPointerMove = null;
            this.onPointerOut = null;
            this.processPointerOverOut = null;
            this.onPointerOver = null;
            this.search = null;
        };
        return InteractionManager;
    }(eventemitter3));
  
    /*!
     * @pixi/runner - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/runner is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
    /**
     * A Runner is a highly performant and simple alternative to signals. Best used in situations
     * where events are dispatched to many objects at high frequency (say every frame!)
     *
     *
     * like a signal..
     * ```
     * import { Runner } from '@pixi/runner';
     *
     * const myObject = {
     *     loaded: new Runner('loaded')
     * }
     *
     * const listener = {
     *     loaded: function(){
     *         // thin
     *     }
     * }
     *
     * myObject.loaded.add(listener);
     *
     * myObject.loaded.emit();
     * ```
     *
     * Or for handling calling the same function on many items
     * ```
     * import { Runner } from '@pixi/runner';
     *
     * const myGame = {
     *     update: new Runner('update')
     * }
     *
     * const gameObject = {
     *     update: function(time){
     *         // update my gamey state
     *     }
     * }
     *
     * myGame.update.add(gameObject);
     *
     * myGame.update.emit(time);
     * ```
     *
     * @memberof PIXI
     */
    var Runner = /** @class */ (function () {
        /**
         * @param name - The function name that will be executed on the listeners added to this Runner.
         */
        function Runner(name) {
            this.items = [];
            this._name = name;
            this._aliasCount = 0;
        }
        /**
         * Dispatch/Broadcast Runner to all listeners added to the queue.
         *
         * @param {...any} params - (optional) parameters to pass to each listener
         */
        Runner.prototype.emit = function (a0, a1, a2, a3, a4, a5, a6, a7) {
            if (arguments.length > 8) {
                throw new Error('max arguments reached');
            }
            var _a = this, name = _a.name, items = _a.items;
            this._aliasCount++;
            for (var i = 0, len = items.length; i < len; i++) {
                items[i][name](a0, a1, a2, a3, a4, a5, a6, a7);
            }
            if (items === this.items) {
                this._aliasCount--;
            }
            return this;
        };
        Runner.prototype.ensureNonAliasedItems = function () {
            if (this._aliasCount > 0 && this.items.length > 1) {
                this._aliasCount = 0;
                this.items = this.items.slice(0);
            }
        };
        /**
         * Add a listener to the Runner
         *
         * Runners do not need to have scope or functions passed to them.
         * All that is required is to pass the listening object and ensure that it has contains a function that has the same name
         * as the name provided to the Runner when it was created.
         *
         * Eg A listener passed to this Runner will require a 'complete' function.
         *
         * ```
         * import { Runner } from '@pixi/runner';
         *
         * const complete = new Runner('complete');
         * ```
         *
         * The scope used will be the object itself.
         *
         * @param {any} item - The object that will be listening.
         */
        Runner.prototype.add = function (item) {
            if (item[this._name]) {
                this.ensureNonAliasedItems();
                this.remove(item);
                this.items.push(item);
            }
            return this;
        };
        /**
         * Remove a single listener from the dispatch queue.
         *
         * @param {any} item - The listener that you would like to remove.
         */
        Runner.prototype.remove = function (item) {
            var index = this.items.indexOf(item);
            if (index !== -1) {
                this.ensureNonAliasedItems();
                this.items.splice(index, 1);
            }
            return this;
        };
        /**
         * Check to see if the listener is already in the Runner
         *
         * @param {any} item - The listener that you would like to check.
         */
        Runner.prototype.contains = function (item) {
            return this.items.indexOf(item) !== -1;
        };
        /** Remove all listeners from the Runner */
        Runner.prototype.removeAll = function () {
            this.ensureNonAliasedItems();
            this.items.length = 0;
            return this;
        };
        /** Remove all references, don't use after this. */
        Runner.prototype.destroy = function () {
            this.removeAll();
            this.items = null;
            this._name = null;
        };
        Object.defineProperty(Runner.prototype, "empty", {
            /**
             * `true` if there are no this Runner contains no listeners
             *
             * @readonly
             */
            get: function () {
                return this.items.length === 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Runner.prototype, "name", {
            /**
             * The name of the runner.
             *
             * @readonly
             */
            get: function () {
                return this._name;
            },
            enumerable: false,
            configurable: true
        });
        return Runner;
    }());
    Object.defineProperties(Runner.prototype, {
        /**
         * Alias for `emit`
         * @memberof PIXI.Runner#
         * @method dispatch
         * @see PIXI.Runner#emit
         */
        dispatch: { value: Runner.prototype.emit },
        /**
         * Alias for `emit`
         * @memberof PIXI.Runner#
         * @method run
         * @see PIXI.Runner#emit
         */
        run: { value: Runner.prototype.emit },
    });
  
    /*!
     * @pixi/core - v6.3.0
     * Compiled Wed, 23 Mar 2022 18:58:56 UTC
     *
     * @pixi/core is licensed under the MIT License.
     * http://www.opensource.org/licenses/mit-license
     */
  
    /**
     * The maximum support for using WebGL. If a device does not
     * support WebGL version, for instance WebGL 2, it will still
     * attempt to fallback support to WebGL 1. If you want to
     * explicitly remove feature support to target a more stable
     * baseline, prefer a lower environment.
     *
     * Due to {@link https://bugs.chromium.org/p/chromium/issues/detail?id=934823|bug in chromium}
     * we disable webgl2 by default for all non-apple mobile devices.
     *
     * @static
     * @name PREFER_ENV
     * @memberof PIXI.settings
     * @type {number}
     * @default PIXI.ENV.WEBGL2
     */
    settings.PREFER_ENV = isMobile$1.any ? exports.ENV.WEBGL : exports.ENV.WEBGL2;
    /**
     * If set to `true`, *only* Textures and BaseTexture objects stored
     * in the caches ({@link PIXI.utils.TextureCache TextureCache} and
     * {@link PIXI.utils.BaseTextureCache BaseTextureCache}) can be
     * used when calling {@link PIXI.Texture.from Texture.from} or
     * {@link PIXI.BaseTexture.from BaseTexture.from}.
     * Otherwise, these `from` calls throw an exception. Using this property
     * can be useful if you want to enforce preloading all assets with
     * {@link PIXI.Loader Loader}.
     *
     * @static
     * @name STRICT_TEXTURE_CACHE
     * @memberof PIXI.settings
     * @type {boolean}
     * @default false
     */
    settings.STRICT_TEXTURE_CACHE = false;
  
    /**
     * Collection of installed resource types, class must extend {@link PIXI.Resource}.
     * @example
     * class CustomResource extends PIXI.Resource {
     *   // MUST have source, options constructor signature
     *   // for auto-detected resources to be created.
     *   constructor(source, options) {
     *     super();
     *   }
     *   upload(renderer, baseTexture, glTexture) {
     *     // upload with GL
     *     return true;
     *   }
     *   // used to auto-detect resource
     *   static test(source, extension) {
     *     return extension === 'xyz'|| source instanceof SomeClass;
     *   }
     * }
     * // Install the new resource type
     * PIXI.INSTALLED.push(CustomResource);
     *
     * @memberof PIXI
     * @type {Array<PIXI.IResourcePlugin>}
     * @static
     * @readonly
     */
    var INSTALLED = [];
    /**
     * Create a resource element from a single source element. This
     * auto-detects which type of resource to create. All resources that
     * are auto-detectable must have a static `test` method and a constructor
     * with the arguments `(source, options?)`. Currently, the supported
     * resources for auto-detection include:
     *  - {@link PIXI.ImageResource}
     *  - {@link PIXI.CanvasResource}
     *  - {@link PIXI.VideoResource}
     *  - {@link PIXI.SVGResource}
     *  - {@link PIXI.BufferResource}
     * @static
     * @memberof PIXI
     * @function autoDetectResource
     * @param {string|*} source - Resource source, this can be the URL to the resource,
     *        a typed-array (for BufferResource), HTMLVideoElement, SVG data-uri
     *        or any other resource that can be auto-detected. If not resource is
     *        detected, it's assumed to be an ImageResource.
     * @param {object} [options] - Pass-through options to use for Resource
     * @param {number} [options.width] - Width of BufferResource or SVG rasterization
     * @param {number} [options.height] - Height of BufferResource or SVG rasterization
     * @param {boolean} [options.autoLoad=true] - Image, SVG and Video flag to start loading
     * @param {number} [options.scale=1] - SVG source scale. Overridden by width, height
     * @param {boolean} [options.createBitmap=PIXI.settings.CREATE_IMAGE_BITMAP] - Image option to create Bitmap object
     * @param {boolean} [options.crossorigin=true] - Image and Video option to set crossOrigin
     * @param {boolean} [options.autoPlay=true] - Video option to start playing video immediately
     * @param {number} [options.updateFPS=0] - Video option to update how many times a second the
     *        texture should be updated from the video. Leave at 0 to update at every render
     * @return {PIXI.Resource} The created resource.
     */
    function autoDetectResource(source, options) {
        if (!source) {
            return null;
        }
        var extension = '';
        if (typeof source === 'string') {
            // search for file extension: period, 3-4 chars, then ?, # or EOL
            var result = (/\.(\w{3,4})(?:$|\?|#)/i).exec(source);
            if (result) {
                extension = result[1].toLowerCase();
            }
        }
        for (var i = INSTALLED.length - 1; i >= 0; --i) {
            var ResourcePlugin = INSTALLED[i];
            if (ResourcePlugin.test && ResourcePlugin.test(source, extension)) {
                return new ResourcePlugin(source, options);
            }
        }
        throw new Error('Unrecognized source type to auto-detect Resource');
    }
  
    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0
  
    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.
  
    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */
  
    var extendStatics$2 = function(d, b) {
        extendStatics$2 = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
        return extendStatics$2(d, b);
    };
  
    function __extends$2(d, b) {
        extendStatics$2(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
  
    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            var arguments$1 = arguments;
  
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments$1[i];
                for (var p in s) { if (Object.prototype.hasOwnProperty.call(s, p)) { t[p] = s[p]; } }
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
  
    function __rest(s, e) {
        var t = {};
        for (var p in s) { if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            { t[p] = s[p]; } }
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            { for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) { if (e.indexOf(p[i]) < 0)
                { t[p[i]] = s[p[i]]; } } }
        return t;
    }
  
    /**
     * Base resource class for textures that manages validation and uploading, depending on its type.
     *
     * Uploading of a base texture to the GPU is required.
     *
     * @memberof PIXI
     */
    var Resource = /** @class */ (function () {
        /**
         * @param width - Width of the resource
         * @param height - Height of the resource
         */
        function Resource(width, height) {
            if (width === void 0) { width = 0; }
            if (height === void 0) { height = 0; }
            this._width = width;
            this._height = height;
            this.destroyed = false;
            this.internal = false;
            this.onResize = new Runner('setRealSize');
            this.onUpdate = new Runner('update');
            this.onError = new Runner('onError');
        }
        /**
         * Bind to a parent BaseTexture
         *
         * @param baseTexture - Parent texture
         */
        Resource.prototype.bind = function (baseTexture) {
            this.onResize.add(baseTexture);
            this.onUpdate.add(baseTexture);
            this.onError.add(baseTexture);
            // Call a resize immediate if we already
            // have the width and height of the resource
            if (this._width || this._height) {
                this.onResize.emit(this._width, this._height);
            }
        };
        /**
         * Unbind to a parent BaseTexture
         *
         * @param baseTexture - Parent texture
         */
        Resource.prototype.unbind = function (baseTexture) {
            this.onResize.remove(baseTexture);
            this.onUpdate.remove(baseTexture);
            this.onError.remove(baseTexture);
        };
        /**
         * Trigger a resize event
         *
         * @param width - X dimension
         * @param height - Y dimension
         */
        Resource.prototype.resize = function (width, height) {
            if (width !== this._width || height !== this._height) {
                this._width = width;
                this._height = height;
                this.onResize.emit(width, height);
            }
        };
        Object.defineProperty(Resource.prototype, "valid", {
            /**
             * Has been validated
             *
             * @readonly
             */
            get: function () {
                return !!this._width && !!this._height;
            },
            enumerable: false,
            configurable: true
        });
        /** Has been updated trigger event. */
        Resource.prototype.update = function () {
            if (!this.destroyed) {
                this.onUpdate.emit();
            }
        };
        /**
         * This can be overridden to start preloading a resource
         * or do any other prepare step.
         *
         * @protected
         * @return Handle the validate event
         */
        Resource.prototype.load = function () {
            return Promise.resolve(this);
        };
        Object.defineProperty(Resource.prototype, "width", {
            /**
             * The width of the resource.
             *
             * @readonly
             */
            get: function () {
                return this._width;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Resource.prototype, "height", {
            /**
             * The height of the resource.
             *
             * @readonly
             */
            get: function () {
                return this._height;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Set the style, optional to override
         *
         * @param renderer - yeah, renderer!
         * @param baseTexture - the texture
         * @param glTexture - texture instance for this webgl context
         * @returns - `true` is success
         */
        Resource.prototype.style = function (_renderer, _baseTexture, _glTexture) {
            return false;
        };
        /** Clean up anything, this happens when destroying is ready. */
        Resource.prototype.dispose = function () {
            // override
        };
        /**
         * Call when destroying resource, unbind any BaseTexture object
         * before calling this method, as reference counts are maintained
         * internally.
         */
        Resource.prototype.destroy = function () {
            if (!this.destroyed) {
                this.destroyed = true;
                this.dispose();
                this.onError.removeAll();
                this.onError = null;
                this.onResize.removeAll();
                this.onResize = null;
                this.onUpdate.removeAll();
                this.onUpdate = null;
            }
        };
        /**
         * Abstract, used to auto-detect resource type.
         *
         * @param {*} source - The source object
         * @param {string} extension - The extension of source, if set
         */
        Resource.test = function (_source, _extension) {
            return false;
        };
        return Resource;
    }());
  
    /**
     * @interface SharedArrayBuffer
     */
    /**
     * Buffer resource with data of typed array.
     *
     * @memberof PIXI
     */
    var BufferResource = /** @class */ (function (_super) {
        __extends$2(BufferResource, _super);
        /**
         * @param source - Source buffer
         * @param options - Options
         * @param {number} options.width - Width of the texture
         * @param {number} options.height - Height of the texture
         */
        function BufferResource(source, options) {
            var _this = this;
            var _a = options || {}, width = _a.width, height = _a.height;
            if (!width || !height) {
                throw new Error('BufferResource width or height invalid');
            }
            _this = _super.call(this, width, height) || this;
            _this.data = source;
            return _this;
        }
        /**
         * Upload the texture to the GPU.
         *
         * @param renderer - Upload to the renderer
         * @param baseTexture - Reference to parent texture
         * @param glTexture - glTexture
         * @returns - true is success
         */
        BufferResource.prototype.upload = function (renderer, baseTexture, glTexture) {
            var gl = renderer.gl;
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === exports.ALPHA_MODES.UNPACK);
            var width = baseTexture.realWidth;
            var height = baseTexture.realHeight;
            if (glTexture.width === width && glTexture.height === height) {
                gl.texSubImage2D(baseTexture.target, 0, 0, 0, width, height, baseTexture.format, glTexture.type, this.data);
            }
            else {
                glTexture.width = width;
                glTexture.height = height;
                gl.texImage2D(baseTexture.target, 0, glTexture.internalFormat, width, height, 0, baseTexture.format, glTexture.type, this.data);
            }
            return true;
        };
        /** Destroy and don't use after this. */
        BufferResource.prototype.dispose = function () {
            this.data = null;
        };
        /**
         * Used to auto-detect the type of resource.
         *
         * @param {*} source - The source object
         * @return {boolean} `true` if <canvas>
         */
        BufferResource.test = function (source) {
            return source instanceof Float32Array
                || source instanceof Uint8Array
                || source instanceof Uint32Array;
        };
        return BufferResource;
    }(Resource));
  
    var defaultBufferOptions = {
        scaleMode: exports.SCALE_MODES.NEAREST,
        format: exports.FORMATS.RGBA,
        alphaMode: exports.ALPHA_MODES.NPM,
    };
    /**
     * A Texture stores the information that represents an image.
     * All textures have a base texture, which contains information about the source.
     * Therefore you can have many textures all using a single BaseTexture
     *
     * @memberof PIXI
     * @typeParam R - The BaseTexture's Resource type.
     * @typeParam RO - The options for constructing resource.
     */
    var BaseTexture = /** @class */ (function (_super) {
        __extends$2(BaseTexture, _super);
        /**
         * @param {PIXI.Resource|string|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} [resource=null] -
         *        The current resource to use, for things that aren't Resource objects, will be converted
         *        into a Resource.
         * @param options - Collection of options
         * @param {PIXI.MIPMAP_MODES} [options.mipmap=PIXI.settings.MIPMAP_TEXTURES] - If mipmapping is enabled for texture
         * @param {number} [options.anisotropicLevel=PIXI.settings.ANISOTROPIC_LEVEL] - Anisotropic filtering level of texture
         * @param {PIXI.WRAP_MODES} [options.wrapMode=PIXI.settings.WRAP_MODE] - Wrap mode for textures
         * @param {PIXI.SCALE_MODES} [options.scaleMode=PIXI.settings.SCALE_MODE] - Default scale mode, linear, nearest
         * @param {PIXI.FORMATS} [options.format=PIXI.FORMATS.RGBA] - GL format type
         * @param {PIXI.TYPES} [options.type=PIXI.TYPES.UNSIGNED_BYTE] - GL data type
         * @param {PIXI.TARGETS} [options.target=PIXI.TARGETS.TEXTURE_2D] - GL texture target
         * @param {PIXI.ALPHA_MODES} [options.alphaMode=PIXI.ALPHA_MODES.UNPACK] - Pre multiply the image alpha
         * @param {number} [options.width=0] - Width of the texture
         * @param {number} [options.height=0] - Height of the texture
         * @param {number} [options.resolution=PIXI.settings.RESOLUTION] - Resolution of the base texture
         * @param {object} [options.resourceOptions] - Optional resource options,
         *        see {@link PIXI.autoDetectResource autoDetectResource}
         */
        function BaseTexture(resource, options) {
            if (resource === void 0) { resource = null; }
            if (options === void 0) { options = null; }
            var _this = _super.call(this) || this;
            options = options || {};
            var alphaMode = options.alphaMode, mipmap = options.mipmap, anisotropicLevel = options.anisotropicLevel, scaleMode = options.scaleMode, width = options.width, height = options.height, wrapMode = options.wrapMode, format = options.format, type = options.type, target = options.target, resolution = options.resolution, resourceOptions = options.resourceOptions;
            // Convert the resource to a Resource object
            if (resource && !(resource instanceof Resource)) {
                resource = autoDetectResource(resource, resourceOptions);
                resource.internal = true;
            }
            _this.resolution = resolution || settings.RESOLUTION;
            _this.width = Math.round((width || 0) * _this.resolution) / _this.resolution;
            _this.height = Math.round((height || 0) * _this.resolution) / _this.resolution;
            _this._mipmap = mipmap !== undefined ? mipmap : settings.MIPMAP_TEXTURES;
            _this.anisotropicLevel = anisotropicLevel !== undefined ? anisotropicLevel : settings.ANISOTROPIC_LEVEL;
            _this._wrapMode = wrapMode || settings.WRAP_MODE;
            _this._scaleMode = scaleMode !== undefined ? scaleMode : settings.SCALE_MODE;
            _this.format = format || exports.FORMATS.RGBA;
            _this.type = type || exports.TYPES.UNSIGNED_BYTE;
            _this.target = target || exports.TARGETS.TEXTURE_2D;
            _this.alphaMode = alphaMode !== undefined ? alphaMode : exports.ALPHA_MODES.UNPACK;
            _this.uid = uid();
            _this.touched = 0;
            _this.isPowerOfTwo = false;
            _this._refreshPOT();
            _this._glTextures = {};
            _this.dirtyId = 0;
            _this.dirtyStyleId = 0;
            _this.cacheId = null;
            _this.valid = width > 0 && height > 0;
            _this.textureCacheIds = [];
            _this.destroyed = false;
            _this.resource = null;
            _this._batchEnabled = 0;
            _this._batchLocation = 0;
            _this.parentTextureArray = null;
            /**
             * Fired when a not-immediately-available source finishes loading.
             *
             * @protected
             * @event PIXI.BaseTexture#loaded
             * @param {PIXI.BaseTexture} baseTexture - Resource loaded.
             */
            /**
             * Fired when a not-immediately-available source fails to load.
             *
             * @protected
             * @event PIXI.BaseTexture#error
             * @param {PIXI.BaseTexture} baseTexture - Resource errored.
             * @param {ErrorEvent} event - Load error event.
             */
            /**
             * Fired when BaseTexture is updated.
             *
             * @protected
             * @event PIXI.BaseTexture#loaded
             * @param {PIXI.BaseTexture} baseTexture - Resource loaded.
             */
            /**
             * Fired when BaseTexture is updated.
             *
             * @protected
             * @event PIXI.BaseTexture#update
             * @param {PIXI.BaseTexture} baseTexture - Instance of texture being updated.
             */
            /**
             * Fired when BaseTexture is destroyed.
             *
             * @protected
             * @event PIXI.BaseTexture#dispose
             * @param {PIXI.BaseTexture} baseTexture - Instance of texture being destroyed.
             */
            // Set the resource
            _this.setResource(resource);
            return _this;
        }
        Object.defineProperty(BaseTexture.prototype, "realWidth", {
            /**
             * Pixel width of the source of this texture
             *
             * @readonly
             */
            get: function () {
                return Math.round(this.width * this.resolution);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BaseTexture.prototype, "realHeight", {
            /**
             * Pixel height of the source of this texture
             *
             * @readonly
             */
            get: function () {
                return Math.round(this.height * this.resolution);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BaseTexture.prototype, "mipmap", {
            /**
             * Mipmap mode of the texture, affects downscaled images
             *
             * @default PIXI.settings.MIPMAP_TEXTURES
             */
            get: function () {
                return this._mipmap;
            },
            set: function (value) {
                if (this._mipmap !== value) {
                    this._mipmap = value;
                    this.dirtyStyleId++;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BaseTexture.prototype, "scaleMode", {
            /**
             * The scale mode to apply when scaling this texture
             *
             * @default PIXI.settings.SCALE_MODE
             */
            get: function () {
                return this._scaleMode;
            },
            set: function (value) {
                if (this._scaleMode !== value) {
                    this._scaleMode = value;
                    this.dirtyStyleId++;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BaseTexture.prototype, "wrapMode", {
            /**
             * How the texture wraps
             *
             * @default PIXI.settings.WRAP_MODE
             */
            get: function () {
                return this._wrapMode;
            },
            set: function (value) {
                if (this._wrapMode !== value) {
                    this._wrapMode = value;
                    this.dirtyStyleId++;
                }
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Changes style options of BaseTexture
         *
         * @param scaleMode - Pixi scalemode
         * @param mipmap - enable mipmaps
         * @returns - this
         */
        BaseTexture.prototype.setStyle = function (scaleMode, mipmap) {
            var dirty;
            if (scaleMode !== undefined && scaleMode !== this.scaleMode) {
                this.scaleMode = scaleMode;
                dirty = true;
            }
            if (mipmap !== undefined && mipmap !== this.mipmap) {
                this.mipmap = mipmap;
                dirty = true;
            }
            if (dirty) {
                this.dirtyStyleId++;
            }
            return this;
        };
        /**
         * Changes w/h/resolution. Texture becomes valid if width and height are greater than zero.
         *
         * @param desiredWidth - Desired visual width
         * @param desiredHeight - Desired visual height
         * @param resolution - Optionally set resolution
         * @returns - this
         */
        BaseTexture.prototype.setSize = function (desiredWidth, desiredHeight, resolution) {
            resolution = resolution || this.resolution;
            return this.setRealSize(desiredWidth * resolution, desiredHeight * resolution, resolution);
        };
        /**
         * Sets real size of baseTexture, preserves current resolution.
         *
         * @param realWidth - Full rendered width
         * @param realHeight - Full rendered height
         * @param resolution - Optionally set resolution
         * @returns - this
         */
        BaseTexture.prototype.setRealSize = function (realWidth, realHeight, resolution) {
            this.resolution = resolution || this.resolution;
            this.width = Math.round(realWidth) / this.resolution;
            this.height = Math.round(realHeight) / this.resolution;
            this._refreshPOT();
            this.update();
            return this;
        };
        /**
         * Refresh check for isPowerOfTwo texture based on size
         *
         * @private
         */
        BaseTexture.prototype._refreshPOT = function () {
            this.isPowerOfTwo = isPow2(this.realWidth) && isPow2(this.realHeight);
        };
        /**
         * Changes resolution
         *
         * @param resolution - res
         * @returns - this
         */
        BaseTexture.prototype.setResolution = function (resolution) {
            var oldResolution = this.resolution;
            if (oldResolution === resolution) {
                return this;
            }
            this.resolution = resolution;
            if (this.valid) {
                this.width = Math.round(this.width * oldResolution) / resolution;
                this.height = Math.round(this.height * oldResolution) / resolution;
                this.emit('update', this);
            }
            this._refreshPOT();
            return this;
        };
        /**
         * Sets the resource if it wasn't set. Throws error if resource already present
         *
         * @param resource - that is managing this BaseTexture
         * @returns - this
         */
        BaseTexture.prototype.setResource = function (resource) {
            if (this.resource === resource) {
                return this;
            }
            if (this.resource) {
                throw new Error('Resource can be set only once');
            }
            resource.bind(this);
            this.resource = resource;
            return this;
        };
        /** Invalidates the object. Texture becomes valid if width and height are greater than zero. */
        BaseTexture.prototype.update = function () {
            if (!this.valid) {
                if (this.width > 0 && this.height > 0) {
                    this.valid = true;
                    this.emit('loaded', this);
                    this.emit('update', this);
                }
            }
            else {
                this.dirtyId++;
                this.dirtyStyleId++;
                this.emit('update', this);
            }
        };
        /**
         * Handle errors with resources.
         *
         * @private
         * @param event - Error event emitted.
         */
        BaseTexture.prototype.onError = function (event) {
            this.emit('error', this, event);
        };
        /**
         * Destroys this base texture.
         * The method stops if resource doesn't want this texture to be destroyed.
         * Removes texture from all caches.
         */
        BaseTexture.prototype.destroy = function () {
            // remove and destroy the resource
            if (this.resource) {
                this.resource.unbind(this);
                // only destroy resourced created internally
                if (this.resource.internal) {
                    this.resource.destroy();
                }
                this.resource = null;
            }
            if (this.cacheId) {
                delete BaseTextureCache[this.cacheId];
                delete TextureCache[this.cacheId];
                this.cacheId = null;
            }
            // finally let the WebGL renderer know..
            this.dispose();
            BaseTexture.removeFromCache(this);
            this.textureCacheIds = null;
            this.destroyed = true;
        };
        /**
         * Frees the texture from WebGL memory without destroying this texture object.
         * This means you can still use the texture later which will upload it to GPU
         * memory again.
         *
         * @fires PIXI.BaseTexture#dispose
         */
        BaseTexture.prototype.dispose = function () {
            this.emit('dispose', this);
        };
        /** Utility function for BaseTexture|Texture cast. */
        BaseTexture.prototype.castToBaseTexture = function () {
            return this;
        };
        /**
         * Helper function that creates a base texture based on the source you provide.
         * The source can be - image url, image element, canvas element. If the
         * source is an image url or an image element and not in the base texture
         * cache, it will be created and loaded.
         *
         * @static
         * @param {string|HTMLImageElement|HTMLCanvasElement|SVGElement|HTMLVideoElement} source - The
         *        source to create base texture from.
         * @param options - See {@link PIXI.BaseTexture}'s constructor for options.
         * @param {string} [options.pixiIdPrefix=pixiid] - If a source has no id, this is the prefix of the generated id
         * @param {boolean} [strict] - Enforce strict-mode, see {@link PIXI.settings.STRICT_TEXTURE_CACHE}.
         * @returns {PIXI.BaseTexture} The new base texture.
         */
        BaseTexture.from = function (source, options, strict) {
            if (strict === void 0) { strict = settings.STRICT_TEXTURE_CACHE; }
            var isFrame = typeof source === 'string';
            var cacheId = null;
            if (isFrame) {
                cacheId = source;
            }
            else {
                if (!source._pixiId) {
                    var prefix = (options && options.pixiIdPrefix) || 'pixiid';
                    source._pixiId = prefix + "_" + uid();
                }
                cacheId = source._pixiId;
            }
            var baseTexture = BaseTextureCache[cacheId];
            // Strict-mode rejects invalid cacheIds
            if (isFrame && strict && !baseTexture) {
                throw new Error("The cacheId \"" + cacheId + "\" does not exist in BaseTextureCache.");
            }
            if (!baseTexture) {
                baseTexture = new BaseTexture(source, options);
                baseTexture.cacheId = cacheId;
                BaseTexture.addToCache(baseTexture, cacheId);
            }
            return baseTexture;
        };
        /**
         * Create a new BaseTexture with a BufferResource from a Float32Array.
         * RGBA values are floats from 0 to 1.
         *
         * @param {Float32Array|Uint8Array} buffer - The optional array to use, if no data
         *        is provided, a new Float32Array is created.
         * @param width - Width of the resource
         * @param height - Height of the resource
         * @param options - See {@link PIXI.BaseTexture}'s constructor for options.
         * @return - The resulting new BaseTexture
         */
        BaseTexture.fromBuffer = function (buffer, width, height, options) {
            buffer = buffer || new Float32Array(width * height * 4);
            var resource = new BufferResource(buffer, { width: width, height: height });
            var type = buffer instanceof Float32Array ? exports.TYPES.FLOAT : exports.TYPES.UNSIGNED_BYTE;
            return new BaseTexture(resource, Object.assign(defaultBufferOptions, options || { width: width, height: height, type: type }));
        };
        /**
         * Adds a BaseTexture to the global BaseTextureCache. This cache is shared across the whole PIXI object.
         *
         *
         * @param {PIXI.BaseTexture} baseTexture - The BaseTexture to add to the cache.
         * @param {string} id - The id that the BaseTexture will be stored against.
         */
        BaseTexture.addToCache = function (baseTexture, id) {
            if (id) {
                if (baseTexture.textureCacheIds.indexOf(id) === -1) {
                    baseTexture.textureCacheIds.push(id);
                }
                if (BaseTextureCache[id]) {
                    // eslint-disable-next-line no-console
                    console.warn("BaseTexture added to the cache with an id [" + id + "] that already had an entry");
                }
                BaseTextureCache[id] = baseTexture;
            }
        };
        /**
         * Remove a BaseTexture from the global BaseTextureCache.
         *
         * @param {string|PIXI.BaseTexture} baseTexture - id of a BaseTexture to be removed, or a BaseTexture instance itself.
         * @return {PIXI.BaseTexture|null} The BaseTexture that was removed.
         */
        BaseTexture.removeFromCache = function (baseTexture) {
            if (typeof baseTexture === 'string') {
                var baseTextureFromCache = BaseTextureCache[baseTexture];
                if (baseTextureFromCache) {
                    var index = baseTextureFromCache.textureCacheIds.indexOf(baseTexture);
                    if (index > -1) {
                        baseTextureFromCache.textureCacheIds.splice(index, 1);
                    }
                    delete BaseTextureCache[baseTexture];
                    return baseTextureFromCache;
                }
            }
            else if (baseTexture && baseTexture.textureCacheIds) {
                for (var i = 0; i < baseTexture.textureCacheIds.length; ++i) {
                    delete BaseTextureCache[baseTexture.textureCacheIds[i]];
                }
                baseTexture.textureCacheIds.length = 0;
                return baseTexture;
            }
            return null;
        };
        /** Global number of the texture batch, used by multi-texture renderers. */
        BaseTexture._globalBatch = 0;
        return BaseTexture;
    }(eventemitter3));
  
    /**
     * Resource that can manage several resource (items) inside.
     * All resources need to have the same pixel size.
     * Parent class for CubeResource and ArrayResource
     *
     * @memberof PIXI
     */
    var AbstractMultiResource = /** @class */ (function (_super) {
        __extends$2(AbstractMultiResource, _super);
        /**
         * @param length
         * @param options - Options to for Resource constructor
         * @param {number} [options.width] - Width of the resource
         * @param {number} [options.height] - Height of the resource
         */
        function AbstractMultiResource(length, options) {
            var _this = this;
            var _a = options || {}, width = _a.width, height = _a.height;
            _this = _super.call(this, width, height) || this;
            _this.items = [];
            _this.itemDirtyIds = [];
            for (var i = 0; i < length; i++) {
                var partTexture = new BaseTexture();
                _this.items.push(partTexture);
                // -2 - first run of texture array upload
                // -1 - texture item was allocated
                // >=0 - texture item uploaded , in sync with items[i].dirtyId
                _this.itemDirtyIds.push(-2);
            }
            _this.length = length;
            _this._load = null;
            _this.baseTexture = null;
            return _this;
        }
        /**
         * Used from ArrayResource and CubeResource constructors.
         *
         * @param resources - Can be resources, image elements, canvas, etc. ,
         *  length should be same as constructor length
         * @param options - Detect options for resources
         */
        AbstractMultiResource.prototype.initFromArray = function (resources, options) {
            for (var i = 0; i < this.length; i++) {
                if (!resources[i]) {
                    continue;
                }
                if (resources[i].castToBaseTexture) {
                    this.addBaseTextureAt(resources[i].castToBaseTexture(), i);
                }
                else if (resources[i] instanceof Resource) {
                    this.addResourceAt(resources[i], i);
                }
                else {
                    this.addResourceAt(autoDetectResource(resources[i], options), i);
                }
            }
        };
        /** Destroy this BaseImageResource. */
        AbstractMultiResource.prototype.dispose = function () {
            for (var i = 0, len = this.length; i < len; i++) {
                this.items[i].destroy();
            }
            this.items = null;
            this.itemDirtyIds = null;
            this._load = null;
        };
        /**
         * Set a resource by ID
         *
         * @param resource
         * @param index - Zero-based index of resource to set
         * @return - Instance for chaining
         */
        AbstractMultiResource.prototype.addResourceAt = function (resource, index) {
            if (!this.items[index]) {
                throw new Error("Index " + index + " is out of bounds");
            }
            // Inherit the first resource dimensions
            if (resource.valid && !this.valid) {
                this.resize(resource.width, resource.height);
            }
            this.items[index].setResource(resource);
            return this;
        };
        /** Set the parent base texture. */
        AbstractMultiResource.prototype.bind = function (baseTexture) {
            if (this.baseTexture !== null) {
                throw new Error('Only one base texture per TextureArray is allowed');
            }
            _super.prototype.bind.call(this, baseTexture);
            for (var i = 0; i < this.length; i++) {
                this.items[i].parentTextureArray = baseTexture;
                this.items[i].on('update', baseTexture.update, baseTexture);
            }
        };
        /** Unset the parent base texture. */
        AbstractMultiResource.prototype.unbind = function (baseTexture) {
            _super.prototype.unbind.call(this, baseTexture);
            for (var i = 0; i < this.length; i++) {
                this.items[i].parentTextureArray = null;
                this.items[i].off('update', baseTexture.update, baseTexture);
            }
        };
        /**
         * Load all the resources simultaneously
         *
         * @return - When load is resolved
         */
        AbstractMultiResource.prototype.load = function () {
            var _this = this;
            if (this._load) {
                return this._load;
            }
            var resources = this.items.map(function (item) { return item.resource; }).filter(function (item) { return item; });
            // TODO: also implement load part-by-part strategy
            var promises = resources.map(function (item) { return item.load(); });
            this._load = Promise.all(promises)
                .then(function () {
                var _a = _this.items[0], realWidth = _a.realWidth, realHeight = _a.realHeight;
                _this.resize(realWidth, realHeight);
                return Promise.resolve(_this);
            });
            return this._load;
        };
        return AbstractMultiResource;
    }(Resource));
  
    /**
     * A resource that contains a number of sources.
     *
     * @memberof PIXI
     */
    var ArrayResource = /** @class */ (function (_super) {
        __extends$2(ArrayResource, _super);
        /**
         * @param source - Number of items in array or the collection
         *        of image URLs to use. Can also be resources, image elements, canvas, etc.
         * @param options - Options to apply to {@link PIXI.autoDetectResource}
         * @param {number} [options.width] - Width of the resource
         * @param {number} [options.height] - Height of the resource
         */
        function ArrayResource(source, options) {
            var _this = this;
            var _a = options || {}, width = _a.width, height = _a.height;
            var urls;
            var length;
            if (Array.isArray(source)) {
                urls = source;
                length = source.length;
            }
            else {
                length = source;
            }
            _this = _super.call(this, length, { width: width, height: height }) || this;
            if (urls) {
                _this.initFromArray(urls, options);
            }
            return _this;
        }
        /**
         * Set a baseTexture by ID,
         * ArrayResource just takes resource from it, nothing more
         *
         * @param baseTexture
         * @param index - Zero-based index of resource to set
         * @return - Instance for chaining
         */
        ArrayResource.prototype.addBaseTextureAt = function (baseTexture, index) {
            if (baseTexture.resource) {
                this.addResourceAt(baseTexture.resource, index);
            }
            else {
                throw new Error('ArrayResource does not support RenderTexture');
            }
            return this;
        };
        /** Add binding */
        ArrayResource.prototype.bind = function (baseTexture) {
            _super.prototype.bind.call(this, baseTexture);
            baseTexture.target = exports.TARGETS.TEXTURE_2D_ARRAY;
        };
        /**
         * Upload the resources to the GPU.
         *
         * @param renderer
         * @param texture
         * @param glTexture
         * @returns - whether texture was uploaded
         */
        ArrayResource.prototype.upload = function (renderer, texture, glTexture) {
            var _a = this, length = _a.length, itemDirtyIds = _a.itemDirtyIds, items = _a.items;
            var gl = renderer.gl;
            if (glTexture.dirtyId < 0) {
                gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, glTexture.internalFormat, this._width, this._height, length, 0, texture.format, glTexture.type, null);
            }
            for (var i = 0; i < length; i++) {
                var item = items[i];
                if (itemDirtyIds[i] < item.dirtyId) {
                    itemDirtyIds[i] = item.dirtyId;
                    if (item.valid) {
                        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, // xoffset
                        0, // yoffset
                        i, // zoffset
                        item.resource.width, item.resource.height, 1, texture.format, glTexture.type, item.resource.source);
                    }
                }
            }
            return true;
        };
        return ArrayResource;
    }(AbstractMultiResource));
  
    /**
     * Base for all the image/canvas resources.
     *
     * @memberof PIXI
     */
    var BaseImageResource = /** @class */ (function (_super) {
        __extends$2(BaseImageResource, _super);
        /**
         * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|SVGElement} source
         */
        function BaseImageResource(source) {
            var _this = this;
            var sourceAny = source;
            var width = sourceAny.naturalWidth || sourceAny.videoWidth || sourceAny.width;
            var height = sourceAny.naturalHeight || sourceAny.videoHeight || sourceAny.height;
            _this = _super.call(this, width, height) || this;
            _this.source = source;
            _this.noSubImage = false;
            return _this;
        }
        /**
         * Set cross origin based detecting the url and the crossorigin
         *
         * @param element - Element to apply crossOrigin
         * @param url - URL to check
         * @param crossorigin - Cross origin value to use
         */
        BaseImageResource.crossOrigin = function (element, url, crossorigin) {
            if (crossorigin === undefined && url.indexOf('data:') !== 0) {
                element.crossOrigin = determineCrossOrigin(url);
            }
            else if (crossorigin !== false) {
                element.crossOrigin = typeof crossorigin === 'string' ? crossorigin : 'anonymous';
            }
        };
        /**
         * Upload the texture to the GPU.
         *
         * @param renderer - Upload to the renderer
         * @param baseTexture - Reference to parent texture
         * @param glTexture
         * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|SVGElement} [source] - (optional)
         * @returns - true is success
         */
        BaseImageResource.prototype.upload = function (renderer, baseTexture, glTexture, source) {
            var gl = renderer.gl;
            var width = baseTexture.realWidth;
            var height = baseTexture.realHeight;
            source = source || this.source;
            if (source instanceof HTMLImageElement) {
                if (!source.complete || source.naturalWidth === 0) {
                    return false;
                }
            }
            else if (source instanceof HTMLVideoElement) {
                if (source.readyState <= 1) {
                    return false;
                }
            }
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === exports.ALPHA_MODES.UNPACK);
            if (!this.noSubImage
                && baseTexture.target === gl.TEXTURE_2D
                && glTexture.width === width
                && glTexture.height === height) {
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, baseTexture.format, glTexture.type, source);
            }
            else {
                glTexture.width = width;
                glTexture.height = height;
                gl.texImage2D(baseTexture.target, 0, glTexture.internalFormat, baseTexture.format, glTexture.type, source);
            }
            return true;
        };
        /**
         * Checks if source width/height was changed, resize can cause extra baseTexture update.
         * Triggers one update in any case.
         */
        BaseImageResource.prototype.update = function () {
            if (this.destroyed) {
                return;
            }
            var source = this.source;
            var width = source.naturalWidth || source.videoWidth || source.width;
            var height = source.naturalHeight || source.videoHeight || source.height;
            this.resize(width, height);
            _super.prototype.update.call(this);
        };
        /** Destroy this {@link BaseImageResource} */
        BaseImageResource.prototype.dispose = function () {
            this.source = null;
        };
        return BaseImageResource;
    }(Resource));
  
    /**
     * @interface OffscreenCanvas
     */
    /**
     * Resource type for HTMLCanvasElement.
     *
     * @memberof PIXI
     */
    var CanvasResource = /** @class */ (function (_super) {
        __extends$2(CanvasResource, _super);
        /**
         * @param source - Canvas element to use
         */
        // eslint-disable-next-line @typescript-eslint/no-useless-constructor
        function CanvasResource(source) {
            return _super.call(this, source) || this;
        }
        /**
         * Used to auto-detect the type of resource.
         *
         * @param {*} source - The source object
         * @return {boolean} `true` if source is HTMLCanvasElement or OffscreenCanvas
         */
        CanvasResource.test = function (source) {
            var OffscreenCanvas = globalThis.OffscreenCanvas;
            // Check for browsers that don't yet support OffscreenCanvas
            if (OffscreenCanvas && source instanceof OffscreenCanvas) {
                return true;
            }
            return globalThis.HTMLCanvasElement && source instanceof HTMLCanvasElement;
        };
        return CanvasResource;
    }(BaseImageResource));
  
    /**
     * Resource for a CubeTexture which contains six resources.
     *
     * @memberof PIXI
     */
    var CubeResource = /** @class */ (function (_super) {
        __extends$2(CubeResource, _super);
        /**
         * @param {Array<string|PIXI.Resource>} [source] - Collection of URLs or resources
         *        to use as the sides of the cube.
         * @param options - ImageResource options
         * @param {number} [options.width] - Width of resource
         * @param {number} [options.height] - Height of resource
         * @param {number} [options.autoLoad=true] - Whether to auto-load resources
         * @param {number} [options.linkBaseTexture=true] - In case BaseTextures are supplied,
         *   whether to copy them or use
         */
        function CubeResource(source, options) {
            var _this = this;
            var _a = options || {}, width = _a.width, height = _a.height, autoLoad = _a.autoLoad, linkBaseTexture = _a.linkBaseTexture;
            if (source && source.length !== CubeResource.SIDES) {
                throw new Error("Invalid length. Got " + source.length + ", expected 6");
            }
            _this = _super.call(this, 6, { width: width, height: height }) || this;
            for (var i = 0; i < CubeResource.SIDES; i++) {
                _this.items[i].target = exports.TARGETS.TEXTURE_CUBE_MAP_POSITIVE_X + i;
            }
            _this.linkBaseTexture = linkBaseTexture !== false;
            if (source) {
                _this.initFromArray(source, options);
            }
            if (autoLoad !== false) {
                _this.load();
            }
            return _this;
        }
        /**
         * Add binding.
         *
         * @param baseTexture - parent base texture
         */
        CubeResource.prototype.bind = function (baseTexture) {
            _super.prototype.bind.call(this, baseTexture);
            baseTexture.target = exports.TARGETS.TEXTURE_CUBE_MAP;
        };
        CubeResource.prototype.addBaseTextureAt = function (baseTexture, index, linkBaseTexture) {
            if (linkBaseTexture === undefined) {
                linkBaseTexture = this.linkBaseTexture;
            }
            if (!this.items[index]) {
                throw new Error("Index " + index + " is out of bounds");
            }
            if (!this.linkBaseTexture
                || baseTexture.parentTextureArray
                || Object.keys(baseTexture._glTextures).length > 0) {
                // copy mode
                if (baseTexture.resource) {
                    this.addResourceAt(baseTexture.resource, index);
                }
                else {
                    throw new Error("CubeResource does not support copying of renderTexture.");
                }
            }
            else {
                // link mode, the difficult one!
                baseTexture.target = exports.TARGETS.TEXTURE_CUBE_MAP_POSITIVE_X + index;
                baseTexture.parentTextureArray = this.baseTexture;
                this.items[index] = baseTexture;
            }
            if (baseTexture.valid && !this.valid) {
                this.resize(baseTexture.realWidth, baseTexture.realHeight);
            }
            this.items[index] = baseTexture;
            return this;
        };
        /**
         * Upload the resource
         *
         * @returns {boolean} true is success
         */
        CubeResource.prototype.upload = function (renderer, _baseTexture, glTexture) {
            var dirty = this.itemDirtyIds;
            for (var i = 0; i < CubeResource.SIDES; i++) {
                var side = this.items[i];
                if (dirty[i] < side.dirtyId) {
                    if (side.valid && side.resource) {
                        side.resource.upload(renderer, side, glTexture);
                        dirty[i] = side.dirtyId;
                    }
                    else if (dirty[i] < -1) {
                        // either item is not valid yet, either its a renderTexture
                        // allocate the memory
                        renderer.gl.texImage2D(side.target, 0, glTexture.internalFormat, _baseTexture.realWidth, _baseTexture.realHeight, 0, _baseTexture.format, glTexture.type, null);
                        dirty[i] = -1;
                    }
                }
            }
            return true;
        };
        /**
         * Used to auto-detect the type of resource.
         *
         * @param {*} source - The source object
         * @return {boolean} `true` if source is an array of 6 elements
         */
        CubeResource.test = function (source) {
            return Array.isArray(source) && source.length === CubeResource.SIDES;
        };
        /** Number of texture sides to store for CubeResources. */
        CubeResource.SIDES = 6;
        return CubeResource;
    }(AbstractMultiResource));
  
    /**
     * Resource type for HTMLImageElement.
     *
     * @memberof PIXI
     */
    var ImageResource = /** @class */ (function (_super) {
        __extends$2(ImageResource, _super);
        /**
         * @param source - image source or URL
         * @param options
         * @param {boolean} [options.autoLoad=true] - start loading process
         * @param {boolean} [options.createBitmap=PIXI.settings.CREATE_IMAGE_BITMAP] - whether its required to create
         *        a bitmap before upload
         * @param {boolean} [options.crossorigin=true] - Load image using cross origin
         * @param {PIXI.ALPHA_MODES} [options.alphaMode=PIXI.ALPHA_MODES.UNPACK] - Premultiply image alpha in bitmap
         */
        function ImageResource(source, options) {
            var _this = this;
            options = options || {};
            if (!(source instanceof HTMLImageElement)) {
                var imageElement = new Image();
                BaseImageResource.crossOrigin(imageElement, source, options.crossorigin);
                imageElement.src = source;
                source = imageElement;
            }
            _this = _super.call(this, source) || this;
            // FireFox 68, and possibly other versions, seems like setting the HTMLImageElement#width and #height
            // to non-zero values before its loading completes if images are in a cache.
            // Because of this, need to set the `_width` and the `_height` to zero to avoid uploading incomplete images.
            // Please refer to the issue #5968 (https://github.com/pixijs/pixi.js/issues/5968).
            if (!source.complete && !!_this._width && !!_this._height) {
                _this._width = 0;
                _this._height = 0;
            }
            _this.url = source.src;
            _this._process = null;
            _this.preserveBitmap = false;
            _this.createBitmap = (options.createBitmap !== undefined
                ? options.createBitmap : settings.CREATE_IMAGE_BITMAP) && !!globalThis.createImageBitmap;
            _this.alphaMode = typeof options.alphaMode === 'number' ? options.alphaMode : null;
            _this.bitmap = null;
            _this._load = null;
            if (options.autoLoad !== false) {
                _this.load();
            }
            return _this;
        }
        /**
         * Returns a promise when image will be loaded and processed.
         *
         * @param createBitmap - whether process image into bitmap
         */
        ImageResource.prototype.load = function (createBitmap) {
            var _this = this;
            if (this._load) {
                return this._load;
            }
            if (createBitmap !== undefined) {
                this.createBitmap = createBitmap;
            }
            this._load = new Promise(function (resolve, reject) {
                var source = _this.source;
                _this.url = source.src;
                var completed = function () {
                    if (_this.destroyed) {
                        return;
                    }
                    source.onload = null;
                    source.onerror = null;
                    _this.resize(source.width, source.height);
                    _this._load = null;
                    if (_this.createBitmap) {
                        resolve(_this.process());
                    }
                    else {
                        resolve(_this);
                    }
                };
                if (source.complete && source.src) {
                    completed();
                }
                else {
                    source.onload = completed;
                    source.onerror = function (event) {
                        // Avoids Promise freezing when resource broken
                        reject(event);
                        _this.onError.emit(event);
                    };
                }
            });
            return this._load;
        };
        /**
         * Called when we need to convert image into BitmapImage.
         * Can be called multiple times, real promise is cached inside.
         *
         * @return - Cached promise to fill that bitmap
         */
        ImageResource.prototype.process = function () {
            var _this = this;
            var source = this.source;
            if (this._process !== null) {
                return this._process;
            }
            if (this.bitmap !== null || !globalThis.createImageBitmap) {
                return Promise.resolve(this);
            }
            var createImageBitmap = globalThis.createImageBitmap;
            var cors = !source.crossOrigin || source.crossOrigin === 'anonymous';
            this._process = fetch(source.src, {
                mode: cors ? 'cors' : 'no-cors'
            })
                .then(function (r) { return r.blob(); })
                .then(function (blob) { return createImageBitmap(blob, 0, 0, source.width, source.height, {
                premultiplyAlpha: _this.alphaMode === exports.ALPHA_MODES.UNPACK ? 'premultiply' : 'none',
            }); })
                .then(function (bitmap) {
                if (_this.destroyed) {
                    return Promise.reject();
                }
                _this.bitmap = bitmap;
                _this.update();
                _this._process = null;
                return Promise.resolve(_this);
            });
            return this._process;
        };
        /**
         * Upload the image resource to GPU.
         *
         * @param renderer - Renderer to upload to
         * @param baseTexture - BaseTexture for this resource
         * @param glTexture - GLTexture to use
         * @returns {boolean} true is success
         */
        ImageResource.prototype.upload = function (renderer, baseTexture, glTexture) {
            if (typeof this.alphaMode === 'number') {
                // bitmap stores unpack premultiply flag, we dont have to notify texImage2D about it
                baseTexture.alphaMode = this.alphaMode;
            }
            if (!this.createBitmap) {
                return _super.prototype.upload.call(this, renderer, baseTexture, glTexture);
            }
            if (!this.bitmap) {
                // yeah, ignore the output
                this.process();
                if (!this.bitmap) {
                    return false;
                }
            }
            _super.prototype.upload.call(this, renderer, baseTexture, glTexture, this.bitmap);
            if (!this.preserveBitmap) {
                // checks if there are other renderers that possibly need this bitmap
                var flag = true;
                var glTextures = baseTexture._glTextures;
                for (var key in glTextures) {
                    var otherTex = glTextures[key];
                    if (otherTex !== glTexture && otherTex.dirtyId !== baseTexture.dirtyId) {
                        flag = false;
                        break;
                    }
                }
                if (flag) {
                    if (this.bitmap.close) {
                        this.bitmap.close();
                    }
                    this.bitmap = null;
                }
            }
            return true;
        };
        /** Destroys this resource. */
        ImageResource.prototype.dispose = function () {
            this.source.onload = null;
            this.source.onerror = null;
            _super.prototype.dispose.call(this);
            if (this.bitmap) {
                this.bitmap.close();
                this.bitmap = null;
            }
            this._process = null;
            this._load = null;
        };
        /**
         * Used to auto-detect the type of resource.
         *
         * @param {*} source - The source object
         * @return {boolean} `true` if source is string or HTMLImageElement
         */
        ImageResource.test = function (source) {
            return typeof source === 'string' || source instanceof HTMLImageElement;
        };
        return ImageResource;
    }(BaseImageResource));
  
    /**
     * Resource type for SVG elements and graphics.
     *
     * @memberof PIXI
     */
    var SVGResource = /** @class */ (function (_super) {
        __extends$2(SVGResource, _super);
        /**
         * @param sourceBase64 - Base64 encoded SVG element or URL for SVG file.
         * @param {object} [options] - Options to use
         * @param {number} [options.scale=1] - Scale to apply to SVG. Overridden by...
         * @param {number} [options.width] - Rasterize SVG this wide. Aspect ratio preserved if height not specified.
         * @param {number} [options.height] - Rasterize SVG this high. Aspect ratio preserved if width not specified.
         * @param {boolean} [options.autoLoad=true] - Start loading right away.
         */
        function SVGResource(sourceBase64, options) {
            var _this = this;
            options = options || {};
            _this = _super.call(this, document.createElement('canvas')) || this;
            _this._width = 0;
            _this._height = 0;
            _this.svg = sourceBase64;
            _this.scale = options.scale || 1;
            _this._overrideWidth = options.width;
            _this._overrideHeight = options.height;
            _this._resolve = null;
            _this._crossorigin = options.crossorigin;
            _this._load = null;
            if (options.autoLoad !== false) {
                _this.load();
            }
            return _this;
        }
        SVGResource.prototype.load = function () {
            var _this = this;
            if (this._load) {
                return this._load;
            }
            this._load = new Promise(function (resolve) {
                // Save this until after load is finished
                _this._resolve = function () {
                    _this.resize(_this.source.width, _this.source.height);
                    resolve(_this);
                };
                // Convert SVG inline string to data-uri
                if (SVGResource.SVG_XML.test(_this.svg.trim())) {
                    if (!btoa) {
                        throw new Error('Your browser doesn\'t support base64 conversions.');
                    }
                    _this.svg = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(_this.svg)));
                }
                _this._loadSvg();
            });
            return this._load;
        };
        /** Loads an SVG image from `imageUrl` or `data URL`. */
        SVGResource.prototype._loadSvg = function () {
            var _this = this;
            var tempImage = new Image();
            BaseImageResource.crossOrigin(tempImage, this.svg, this._crossorigin);
            tempImage.src = this.svg;
            tempImage.onerror = function (event) {
                if (!_this._resolve) {
                    return;
                }
                tempImage.onerror = null;
                _this.onError.emit(event);
            };
            tempImage.onload = function () {
                if (!_this._resolve) {
                    return;
                }
                var svgWidth = tempImage.width;
                var svgHeight = tempImage.height;
                if (!svgWidth || !svgHeight) {
                    throw new Error('The SVG image must have width and height defined (in pixels), canvas API needs them.');
                }
                // Set render size
                var width = svgWidth * _this.scale;
                var height = svgHeight * _this.scale;
                if (_this._overrideWidth || _this._overrideHeight) {
                    width = _this._overrideWidth || _this._overrideHeight / svgHeight * svgWidth;
                    height = _this._overrideHeight || _this._overrideWidth / svgWidth * svgHeight;
                }
                width = Math.round(width);
                height = Math.round(height);
                // Create a canvas element
                var canvas = _this.source;
                canvas.width = width;
                canvas.height = height;
                canvas._pixiId = "canvas_" + uid();
                // Draw the Svg to the canvas
                canvas
                    .getContext('2d')
                    .drawImage(tempImage, 0, 0, svgWidth, svgHeight, 0, 0, width, height);
                _this._resolve();
                _this._resolve = null;
            };
        };
        /**
         * Get size from an svg string using a regular expression.
         *
         * @param svgString - a serialized svg element
         * @return - image extension
         */
        SVGResource.getSize = function (svgString) {
            var sizeMatch = SVGResource.SVG_SIZE.exec(svgString);
            var size = {};
            if (sizeMatch) {
                size[sizeMatch[1]] = Math.round(parseFloat(sizeMatch[3]));
                size[sizeMatch[5]] = Math.round(parseFloat(sizeMatch[7]));
            }
            return size;
        };
        /** Destroys this texture. */
        SVGResource.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this._resolve = null;
            this._crossorigin = null;
        };
        /**
         * Used to auto-detect the type of resource.
         *
         * @param {*} source - The source object
         * @param {string} extension - The extension of source, if set
         * @return {boolean} - If the source is a SVG source or data file
         */
        SVGResource.test = function (source, extension) {
            // url file extension is SVG
            return extension === 'svg'
                // source is SVG data-uri
                || (typeof source === 'string' && (/^data:image\/svg\+xml(;(charset=utf8|utf8))?;base64/).test(source))
                // source is SVG inline
                || (typeof source === 'string' && SVGResource.SVG_XML.test(source));
        };
        /**
         * Regular expression for SVG XML document.
         *
         * @example &lt;?xml version="1.0" encoding="utf-8" ?&gt;&lt;!-- image/svg --&gt;&lt;svg
         * @readonly
         */
        SVGResource.SVG_XML = /^(<\?xml[^?]+\?>)?\s*(<!--[^(-->)]*-->)?\s*\<svg/m;
        /**
         * Regular expression for SVG size.
         *
         * @example &lt;svg width="100" height="100"&gt;&lt;/svg&gt;
         * @readonly
         */
        SVGResource.SVG_SIZE = /<svg[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*>/i; // eslint-disable-line max-len
        return SVGResource;
    }(BaseImageResource));
  
    /**
     * Resource type for {@code HTMLVideoElement}.
     *
     * @memberof PIXI
     */
    var VideoResource = /** @class */ (function (_super) {
        __extends$2(VideoResource, _super);
        /**
         * @param {HTMLVideoElement|object|string|Array<string|object>} source - Video element to use.
         * @param {object} [options] - Options to use
         * @param {boolean} [options.autoLoad=true] - Start loading the video immediately
         * @param {boolean} [options.autoPlay=true] - Start playing video immediately
         * @param {number} [options.updateFPS=0] - How many times a second to update the texture from the video.
         * Leave at 0 to update at every render.
         * @param {boolean} [options.crossorigin=true] - Load image using cross origin
         */
        function VideoResource(source, options) {
            var _this = this;
            options = options || {};
            if (!(source instanceof HTMLVideoElement)) {
                var videoElement = document.createElement('video');
                // workaround for https://github.com/pixijs/pixi.js/issues/5996
                videoElement.setAttribute('preload', 'auto');
                videoElement.setAttribute('webkit-playsinline', '');
                videoElement.setAttribute('playsinline', '');
                if (typeof source === 'string') {
                    source = [source];
                }
                var firstSrc = source[0].src || source[0];
                BaseImageResource.crossOrigin(videoElement, firstSrc, options.crossorigin);
                // array of objects or strings
                for (var i = 0; i < source.length; ++i) {
                    var sourceElement = document.createElement('source');
                    var _a = source[i], src = _a.src, mime = _a.mime;
                    src = src || source[i];
                    var baseSrc = src.split('?').shift().toLowerCase();
                    var ext = baseSrc.slice(baseSrc.lastIndexOf('.') + 1);
                    mime = mime || VideoResource.MIME_TYPES[ext] || "video/" + ext;
                    sourceElement.src = src;
                    sourceElement.type = mime;
                    videoElement.appendChild(sourceElement);
                }
                // Override the source
                source = videoElement;
            }
            _this = _super.call(this, source) || this;
            _this.noSubImage = true;
            _this._autoUpdate = true;
            _this._isConnectedToTicker = false;
            _this._updateFPS = options.updateFPS || 0;
            _this._msToNextUpdate = 0;
            _this.autoPlay = options.autoPlay !== false;
            _this._load = null;
            _this._resolve = null;
            // Bind for listeners
            _this._onCanPlay = _this._onCanPlay.bind(_this);
            _this._onError = _this._onError.bind(_this);
            if (options.autoLoad !== false) {
                _this.load();
            }
            return _this;
        }
        /**
         * Trigger updating of the texture.
         *
         * @param deltaTime - time delta since last tick
         */
        VideoResource.prototype.update = function (_deltaTime) {
            if (!this.destroyed) {
                // account for if video has had its playbackRate changed
                var elapsedMS = Ticker.shared.elapsedMS * this.source.playbackRate;
                this._msToNextUpdate = Math.floor(this._msToNextUpdate - elapsedMS);
                if (!this._updateFPS || this._msToNextUpdate <= 0) {
                    _super.prototype.update.call(this);
                    this._msToNextUpdate = this._updateFPS ? Math.floor(1000 / this._updateFPS) : 0;
                }
            }
        };
        /**
         * Start preloading the video resource.
         *
         * @return {Promise<void>} Handle the validate event
         */
        VideoResource.prototype.load = function () {
            var _this = this;
            if (this._load) {
                return this._load;
            }
            var source = this.source;
            if ((source.readyState === source.HAVE_ENOUGH_DATA || source.readyState === source.HAVE_FUTURE_DATA)
                && source.width && source.height) {
                source.complete = true;
            }
            source.addEventListener('play', this._onPlayStart.bind(this));
            source.addEventListener('pause', this._onPlayStop.bind(this));
            if (!this._isSourceReady()) {
                source.addEventListener('canplay', this._onCanPlay);
                source.addEventListener('canplaythrough', this._onCanPlay);
                source.addEventListener('error', this._onError, true);
            }
            else {
                this._onCanPlay();
            }
            this._load = new Promise(function (resolve) {
                if (_this.valid) {
                    resolve(_this);
                }
                else {
                    _this._resolve = resolve;
                    source.load();
                }
            });
            return this._load;
        };
        /** Handle video error events. */
        VideoResource.prototype._onError = function (event) {
            this.source.removeEventListener('error', this._onError, true);
            this.onError.emit(event);
        };
        /**
         * Returns true if the underlying source is playing.
         *
         * @return - True if playing.
         */
        VideoResource.prototype._isSourcePlaying = function () {
            var source = this.source;
            return (source.currentTime > 0 && source.paused === false && source.ended === false && source.readyState > 2);
        };
        /**
         * Returns true if the underlying source is ready for playing.
         *
         * @return - True if ready.
         */
        VideoResource.prototype._isSourceReady = function () {
            var source = this.source;
            return source.readyState === 3 || source.readyState === 4;
        };
        /** Runs the update loop when the video is ready to play. */
        VideoResource.prototype._onPlayStart = function () {
            // Just in case the video has not received its can play even yet..
            if (!this.valid) {
                this._onCanPlay();
            }
            if (this.autoUpdate && !this._isConnectedToTicker) {
                Ticker.shared.add(this.update, this);
                this._isConnectedToTicker = true;
            }
        };
        /** Fired when a pause event is triggered, stops the update loop. */
        VideoResource.prototype._onPlayStop = function () {
            if (this._isConnectedToTicker) {
                Ticker.shared.remove(this.update, this);
                this._isConnectedToTicker = false;
            }
        };
        /** Fired when the video is loaded and ready to play. */
        VideoResource.prototype._onCanPlay = function () {
            var source = this.source;
            source.removeEventListener('canplay', this._onCanPlay);
            source.removeEventListener('canplaythrough', this._onCanPlay);
            var valid = this.valid;
            this.resize(source.videoWidth, source.videoHeight);
            // prevent multiple loaded dispatches..
            if (!valid && this._resolve) {
                this._resolve(this);
                this._resolve = null;
            }
            if (this._isSourcePlaying()) {
                this._onPlayStart();
            }
            else if (this.autoPlay) {
                source.play();
            }
        };
        /** Destroys this texture. */
        VideoResource.prototype.dispose = function () {
            if (this._isConnectedToTicker) {
                Ticker.shared.remove(this.update, this);
                this._isConnectedToTicker = false;
            }
            var source = this.source;
            if (source) {
                source.removeEventListener('error', this._onError, true);
                source.pause();
                source.src = '';
                source.load();
            }
            _super.prototype.dispose.call(this);
        };
        Object.defineProperty(VideoResource.prototype, "autoUpdate", {
            /** Should the base texture automatically update itself, set to true by default. */
            get: function () {
                return this._autoUpdate;
            },
            set: function (value) {
                if (value !== this._autoUpdate) {
                    this._autoUpdate = value;
                    if (!this._autoUpdate && this._isConnectedToTicker) {
                        Ticker.shared.remove(this.update, this);
                        this._isConnectedToTicker = false;
                    }
                    else if (this._autoUpdate && !this._isConnectedToTicker && this._isSourcePlaying()) {
                        Ticker.shared.add(this.update, this);
                        this._isConnectedToTicker = true;
                    }
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(VideoResource.prototype, "updateFPS", {
            /**
             * How many times a second to update the texture from the video. Leave at 0 to update at every render.
             * A lower fps can help performance, as updating the texture at 60fps on a 30ps video may not be efficient.
             */
            get: function () {
                return this._updateFPS;
            },
            set: function (value) {
                if (value !== this._updateFPS) {
                    this._updateFPS = value;
                }
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Used to auto-detect the type of resource.
         *
         * @param {*} source - The source object
         * @param {string} extension - The extension of source, if set
         * @return {boolean} `true` if video source
         */
        VideoResource.test = function (source, extension) {
            return (globalThis.HTMLVideoElement && source instanceof HTMLVideoElement)
                || VideoResource.TYPES.indexOf(extension) > -1;
        };
        /**
         * List of common video file extensions supported by VideoResource.
         *
         * @readonly
         */
        VideoResource.TYPES = ['mp4', 'm4v', 'webm', 'ogg', 'ogv', 'h264', 'avi', 'mov'];
        /**
         * Map of video MIME types that can't be directly derived from file extensions.
         *
         * @readonly
         */
        VideoResource.MIME_TYPES = {
            ogv: 'video/ogg',
            mov: 'video/quicktime',
            m4v: 'video/mp4',
        };
        return VideoResource;
    }(BaseImageResource));
  
    /**
     * Resource type for ImageBitmap.
     *
     * @memberof PIXI
     */
    var ImageBitmapResource = /** @class */ (function (_super) {
        __extends$2(ImageBitmapResource, _super);
        /**
         * @param source - Image element to use
         */
        // eslint-disable-next-line @typescript-eslint/no-useless-constructor
        function ImageBitmapResource(source) {
            return _super.call(this, source) || this;
        }
        /**
         * Used to auto-detect the type of resource.
         *
         * @param {*} source - The source object
         * @return {boolean} `true` if source is an ImageBitmap
         */
        ImageBitmapResource.test = function (source) {
            return !!globalThis.createImageBitmap && source instanceof ImageBitmap;
        };
        return ImageBitmapResource;
    }(BaseImageResource));
  
    INSTALLED.push(ImageResource, ImageBitmapResource, CanvasResource, VideoResource, SVGResource, BufferResource, CubeResource, ArrayResource);
  
    var _resources = {
        __proto__: null,
        Resource: Resource,
        BaseImageResource: BaseImageResource,
        INSTALLED: INSTALLED,
        autoDetectResource: autoDetectResource,
        AbstractMultiResource: AbstractMultiResource,
        ArrayResource: ArrayResource,
        BufferResource: BufferResource,
        CanvasResource: CanvasResource,
        CubeResource: CubeResource,
        ImageResource: ImageResource,
        SVGResource: SVGResource,
        VideoResource: VideoResource,
        ImageBitmapResource: ImageBitmapResource
    };
  
    /**
     * Resource type for DepthTexture.
     *
     * @memberof PIXI
     */
    var DepthResource = /** @class */ (function (_super) {
        __extends$2(DepthResource, _super);
        function DepthResource() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Upload the texture to the GPU.
         *
         * @param renderer - Upload to the renderer
         * @param baseTexture - Reference to parent texture
         * @param glTexture - glTexture
         * @return - true is success
         */
        DepthResource.prototype.upload = function (renderer, baseTexture, glTexture) {
            var gl = renderer.gl;
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === exports.ALPHA_MODES.UNPACK);
            var width = baseTexture.realWidth;
            var height = baseTexture.realHeight;
            if (glTexture.width === width && glTexture.height === height) {
                gl.texSubImage2D(baseTexture.target, 0, 0, 0, width, height, baseTexture.format, glTexture.type, this.data);
            }
            else {
                glTexture.width = width;
                glTexture.height = height;
                gl.texImage2D(baseTexture.target, 0, glTexture.internalFormat, width, height, 0, baseTexture.format, glTexture.type, this.data);
            }
            return true;
        };
        return DepthResource;
    }(BufferResource));
  
    /**
     * A framebuffer can be used to render contents off of the screen. {@link PIXI.BaseRenderTexture} uses
     * one internally to render into itself. You can attach a depth or stencil buffer to a framebuffer.
     *
     * On WebGL 2 machines, shaders can output to multiple textures simultaneously with GLSL 300 ES.
     *
     * @memberof PIXI
     */
    var Framebuffer = /** @class */ (function () {
        /**
         * @param width - Width of the frame buffer
         * @param height - Height of the frame buffer
         */
        function Framebuffer(width, height) {
            this.width = Math.round(width || 100);
            this.height = Math.round(height || 100);
            this.stencil = false;
            this.depth = false;
            this.dirtyId = 0;
            this.dirtyFormat = 0;
            this.dirtySize = 0;
            this.depthTexture = null;
            this.colorTextures = [];
            this.glFramebuffers = {};
            this.disposeRunner = new Runner('disposeFramebuffer');
            this.multisample = exports.MSAA_QUALITY.NONE;
        }
        Object.defineProperty(Framebuffer.prototype, "colorTexture", {
            /**
             * Reference to the colorTexture.
             *
             * @readonly
             */
            get: function () {
                return this.colorTextures[0];
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Add texture to the colorTexture array.
         *
         * @param index - Index of the array to add the texture to
         * @param texture - Texture to add to the array
         */
        Framebuffer.prototype.addColorTexture = function (index, texture) {
            if (index === void 0) { index = 0; }
            // TODO add some validation to the texture - same width / height etc?
            this.colorTextures[index] = texture || new BaseTexture(null, {
                scaleMode: exports.SCALE_MODES.NEAREST,
                resolution: 1,
                mipmap: exports.MIPMAP_MODES.OFF,
                width: this.width,
                height: this.height,
            });
            this.dirtyId++;
            this.dirtyFormat++;
            return this;
        };
        /**
         * Add a depth texture to the frame buffer.
         *
         * @param texture - Texture to add.
         */
        Framebuffer.prototype.addDepthTexture = function (texture) {
            /* eslint-disable max-len */
            this.depthTexture = texture || new BaseTexture(new DepthResource(null, { width: this.width, height: this.height }), {
                scaleMode: exports.SCALE_MODES.NEAREST,
                resolution: 1,
                width: this.width,
                height: this.height,
                mipmap: exports.MIPMAP_MODES.OFF,
                format: exports.FORMATS.DEPTH_COMPONENT,
                type: exports.TYPES.UNSIGNED_SHORT,
            });
            this.dirtyId++;
            this.dirtyFormat++;
            return this;
        };
        /** Enable depth on the frame buffer. */
        Framebuffer.prototype.enableDepth = function () {
            this.depth = true;
            this.dirtyId++;
            this.dirtyFormat++;
            return this;
        };
        /** Enable stencil on the frame buffer. */
        Framebuffer.prototype.enableStencil = function () {
            this.stencil = true;
            this.dirtyId++;
            this.dirtyFormat++;
            return this;
        };
        /**
         * Resize the frame buffer
         *
         * @param width - Width of the frame buffer to resize to
         * @param height - Height of the frame buffer to resize to
         */
        Framebuffer.prototype.resize = function (width, height) {
            width = Math.round(width);
            height = Math.round(height);
            if (width === this.width && height === this.height)
                { return; }
            this.width = width;
            this.height = height;
            this.dirtyId++;
            this.dirtySize++;
            for (var i = 0; i < this.colorTextures.length; i++) {
                var texture = this.colorTextures[i];
                var resolution = texture.resolution;
                // take into account the fact the texture may have a different resolution..
                texture.setSize(width / resolution, height / resolution);
            }
            if (this.depthTexture) {
                var resolution = this.depthTexture.resolution;
                this.depthTexture.setSize(width / resolution, height / resolution);
            }
        };
        /** Disposes WebGL resources that are connected to this geometry. */
        Framebuffer.prototype.dispose = function () {
            this.disposeRunner.emit(this, false);
        };
        /** Destroys and removes the depth texture added to this framebuffer. */
        Framebuffer.prototype.destroyDepthTexture = function () {
            if (this.depthTexture) {
                this.depthTexture.destroy();
                this.depthTexture = null;
                ++this.dirtyId;
                ++this.dirtyFormat;
            }
        };
        return Framebuffer;
    }());
  
    /**
     * A BaseRenderTexture is a special texture that allows any PixiJS display object to be rendered to it.
     *
     * __Hint__: All DisplayObjects (i.e. Sprites) that render to a BaseRenderTexture should be preloaded
     * otherwise black rectangles will be drawn instead.
     *
     * A BaseRenderTexture takes a snapshot of any Display Object given to its render method. The position
     * and rotation of the given Display Objects is ignored. For example:
     *
     * ```js
     * let renderer = PIXI.autoDetectRenderer();
     * let baseRenderTexture = new PIXI.BaseRenderTexture({ width: 800, height: 600 });
     * let renderTexture = new PIXI.RenderTexture(baseRenderTexture);
     * let sprite = PIXI.Sprite.from("spinObj_01.png");
     *
     * sprite.position.x = 800/2;
     * sprite.position.y = 600/2;
     * sprite.anchor.x = 0.5;
     * sprite.anchor.y = 0.5;
     *
     * renderer.render(sprite, {renderTexture});
     * ```
     *
     * The Sprite in this case will be rendered using its local transform. To render this sprite at 0,0
     * you can clear the transform
     *
     * ```js
     *
     * sprite.setTransform()
     *
     * let baseRenderTexture = new PIXI.BaseRenderTexture({ width: 100, height: 100 });
     * let renderTexture = new PIXI.RenderTexture(baseRenderTexture);
     *
     * renderer.render(sprite, {renderTexture});  // Renders to center of RenderTexture
     * ```
     *
     * @memberof PIXI
     */
    var BaseRenderTexture = /** @class */ (function (_super) {
        __extends$2(BaseRenderTexture, _super);
        /**
         * @param options
         * @param {number} [options.width=100] - The width of the base render texture.
         * @param {number} [options.height=100] - The height of the base render texture.
         * @param {PIXI.SCALE_MODES} [options.scaleMode=PIXI.settings.SCALE_MODE] - See {@link PIXI.SCALE_MODES}
         *   for possible values.
         * @param {number} [options.resolution=PIXI.settings.RESOLUTION] - The resolution / device pixel ratio
         *   of the texture being generated.
         * @param {PIXI.MSAA_QUALITY} [options.multisample=PIXI.MSAA_QUALITY.NONE] - The number of samples of the frame buffer.
         */
        function BaseRenderTexture(options) {
            if (options === void 0) { options = {}; }
            var _this = this;
            if (typeof options === 'number') {
                /* eslint-disable prefer-rest-params */
                // Backward compatibility of signature
                var width = arguments[0];
                var height = arguments[1];
                var scaleMode = arguments[2];
                var resolution = arguments[3];
                options = { width: width, height: height, scaleMode: scaleMode, resolution: resolution };
                /* eslint-enable prefer-rest-params */
            }
            options.width = options.width || 100;
            options.height = options.height || 100;
            options.multisample = options.multisample !== undefined ? options.multisample : exports.MSAA_QUALITY.NONE;
            _this = _super.call(this, null, options) || this;
            // Set defaults
            _this.mipmap = exports.MIPMAP_MODES.OFF;
            _this.valid = true;
            _this.clearColor = [0, 0, 0, 0];
            _this.framebuffer = new Framebuffer(_this.realWidth, _this.realHeight)
                .addColorTexture(0, _this);
            _this.framebuffer.multisample = options.multisample;
            // TODO - could this be added the systems?
            _this.maskStack = [];
            _this.filterStack = [{}];
            return _this;
        }
        /**
         * Resizes the BaseRenderTexture.
         *
         * @param desiredWidth - The desired width to resize to.
         * @param desiredHeight - The desired height to resize to.
         */
        BaseRenderTexture.prototype.resize = function (desiredWidth, desiredHeight) {
            this.framebuffer.resize(desiredWidth * this.resolution, desiredHeight * this.resolution);
            this.setRealSize(this.framebuffer.width, this.framebuffer.height);
        };
        /**
         * Frees the texture and framebuffer from WebGL memory without destroying this texture object.
         * This means you can still use the texture later which will upload it to GPU
         * memory again.
         *
         * @fires PIXI.BaseTexture#dispose
         */
        BaseRenderTexture.prototype.dispose = function () {
            this.framebuffer.dispose();
            _super.prototype.dispose.call(this);
        };
        /** Destroys this texture. */
        BaseRenderTexture.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.framebuffer.destroyDepthTexture();
            this.framebuffer = null;
        };
        return BaseRenderTexture;
    }(BaseTexture));
  
    /**
     * Stores a texture's frame in UV coordinates, in
     * which everything lies in the rectangle `[(0,0), (1,0),
     * (1,1), (0,1)]`.
     *
     * | Corner       | Coordinates |
     * |--------------|-------------|
     * | Top-Left     | `(x0,y0)`   |
     * | Top-Right    | `(x1,y1)`   |
     * | Bottom-Right | `(x2,y2)`   |
     * | Bottom-Left  | `(x3,y3)`   |
     *
     * @protected
     * @memberof PIXI
     */
    var TextureUvs = /** @class */ (function () {
        function TextureUvs() {
            this.x0 = 0;
            this.y0 = 0;
            this.x1 = 1;
            this.y1 = 0;
            this.x2 = 1;
            this.y2 = 1;
            this.x3 = 0;
            this.y3 = 1;
            this.uvsFloat32 = new Float32Array(8);
        }
        /**
         * Sets the texture Uvs based on the given frame information.
         *
         * @protected
         * @param frame - The frame of the texture
         * @param baseFrame - The base frame of the texture
         * @param rotate - Rotation of frame, see {@link PIXI.groupD8}
         */
        TextureUvs.prototype.set = function (frame, baseFrame, rotate) {
            var tw = baseFrame.width;
            var th = baseFrame.height;
            if (rotate) {
                // width and height div 2 div baseFrame size
                var w2 = frame.width / 2 / tw;
                var h2 = frame.height / 2 / th;
                // coordinates of center
                var cX = (frame.x / tw) + w2;
                var cY = (frame.y / th) + h2;
                rotate = groupD8.add(rotate, groupD8.NW); // NW is top-left corner
                this.x0 = cX + (w2 * groupD8.uX(rotate));
                this.y0 = cY + (h2 * groupD8.uY(rotate));
                rotate = groupD8.add(rotate, 2); // rotate 90 degrees clockwise
                this.x1 = cX + (w2 * groupD8.uX(rotate));
                this.y1 = cY + (h2 * groupD8.uY(rotate));
                rotate = groupD8.add(rotate, 2);
                this.x2 = cX + (w2 * groupD8.uX(rotate));
                this.y2 = cY + (h2 * groupD8.uY(rotate));
                rotate = groupD8.add(rotate, 2);
                this.x3 = cX + (w2 * groupD8.uX(rotate));
                this.y3 = cY + (h2 * groupD8.uY(rotate));
            }
            else {
                this.x0 = frame.x / tw;
                this.y0 = frame.y / th;
                this.x1 = (frame.x + frame.width) / tw;
                this.y1 = frame.y / th;
                this.x2 = (frame.x + frame.width) / tw;
                this.y2 = (frame.y + frame.height) / th;
                this.x3 = frame.x / tw;
                this.y3 = (frame.y + frame.height) / th;
            }
            this.uvsFloat32[0] = this.x0;
            this.uvsFloat32[1] = this.y0;
            this.uvsFloat32[2] = this.x1;
            this.uvsFloat32[3] = this.y1;
            this.uvsFloat32[4] = this.x2;
            this.uvsFloat32[5] = this.y2;
            this.uvsFloat32[6] = this.x3;
            this.uvsFloat32[7] = this.y3;
        };
        TextureUvs.prototype.toString = function () {
            return "[@pixi/core:TextureUvs "
                + ("x0=" + this.x0 + " y0=" + this.y0 + " ")
                + ("x1=" + this.x1 + " y1=" + this.y1 + " x2=" + this.x2 + " ")
                + ("y2=" + this.y2 + " x3=" + this.x3 + " y3=" + this.y3)
                + "]";
        };
        return TextureUvs;
    }());
  
    var DEFAULT_UVS = new TextureUvs();
    /**
     * A texture stores the information that represents an image or part of an image.
     *
     * It cannot be added to the display list directly; instead use it as the texture for a Sprite.
     * If no frame is provided for a texture, then the whole image is used.
     *
     * You can directly create a texture from an image and then reuse it multiple times like this :
     *
     * ```js
     * let texture = PIXI.Texture.from('assets/image.png');
     * let sprite1 = new PIXI.Sprite(texture);
     * let sprite2 = new PIXI.Sprite(texture);
     * ```
     *
     * If you didnt pass the texture frame to constructor, it enables `noFrame` mode:
     * it subscribes on baseTexture events, it automatically resizes at the same time as baseTexture.
     *
     * Textures made from SVGs, loaded or not, cannot be used before the file finishes processing.
     * You can check for this by checking the sprite's _textureID property.
     * ```js
     * var texture = PIXI.Texture.from('assets/image.svg');
     * var sprite1 = new PIXI.Sprite(texture);
     * //sprite1._textureID should not be undefined if the texture has finished processing the SVG file
     * ```
     * You can use a ticker or rAF to ensure your sprites load the finished textures after processing. See issue #3068.
     *
     * @memberof PIXI
     * @typeParam R - The BaseTexture's Resource type.
     */
    var Texture = /** @class */ (function (_super) {
        __extends$2(Texture, _super);
        /**
         * @param baseTexture - The base texture source to create the texture from
         * @param frame - The rectangle frame of the texture to show
         * @param orig - The area of original texture
         * @param trim - Trimmed rectangle of original texture
         * @param rotate - indicates how the texture was rotated by texture packer. See {@link PIXI.groupD8}
         * @param anchor - Default anchor point used for sprite placement / rotation
         */
        function Texture(baseTexture, frame, orig, trim, rotate, anchor) {
            var _this = _super.call(this) || this;
            _this.noFrame = false;
            if (!frame) {
                _this.noFrame = true;
                frame = new Rectangle(0, 0, 1, 1);
            }
            if (baseTexture instanceof Texture) {
                baseTexture = baseTexture.baseTexture;
            }
            _this.baseTexture = baseTexture;
            _this._frame = frame;
            _this.trim = trim;
            _this.valid = false;
            _this._uvs = DEFAULT_UVS;
            _this.uvMatrix = null;
            _this.orig = orig || frame; // new Rectangle(0, 0, 1, 1);
            _this._rotate = Number(rotate || 0);
            if (rotate === true) {
                // this is old texturepacker legacy, some games/libraries are passing "true" for rotated textures
                _this._rotate = 2;
            }
            else if (_this._rotate % 2 !== 0) {
                throw new Error('attempt to use diamond-shaped UVs. If you are sure, set rotation manually');
            }
            _this.defaultAnchor = anchor ? new Point(anchor.x, anchor.y) : new Point(0, 0);
            _this._updateID = 0;
            _this.textureCacheIds = [];
            if (!baseTexture.valid) {
                baseTexture.once('loaded', _this.onBaseTextureUpdated, _this);
            }
            else if (_this.noFrame) {
                // if there is no frame we should monitor for any base texture changes..
                if (baseTexture.valid) {
                    _this.onBaseTextureUpdated(baseTexture);
                }
            }
            else {
                _this.frame = frame;
            }
            if (_this.noFrame) {
                baseTexture.on('update', _this.onBaseTextureUpdated, _this);
            }
            return _this;
        }
        /**
         * Updates this texture on the gpu.
         *
         * Calls the TextureResource update.
         *
         * If you adjusted `frame` manually, please call `updateUvs()` instead.
         */
        Texture.prototype.update = function () {
            if (this.baseTexture.resource) {
                this.baseTexture.resource.update();
            }
        };
        /**
         * Called when the base texture is updated
         *
         * @protected
         * @param baseTexture - The base texture.
         */
        Texture.prototype.onBaseTextureUpdated = function (baseTexture) {
            if (this.noFrame) {
                if (!this.baseTexture.valid) {
                    return;
                }
                this._frame.width = baseTexture.width;
                this._frame.height = baseTexture.height;
                this.valid = true;
                this.updateUvs();
            }
            else {
                // TODO this code looks confusing.. boo to abusing getters and setters!
                // if user gave us frame that has bigger size than resized texture it can be a problem
                this.frame = this._frame;
            }
            this.emit('update', this);
        };
        /**
         * Destroys this texture
         *
         * @param [destroyBase=false] - Whether to destroy the base texture as well
         */
        Texture.prototype.destroy = function (destroyBase) {
            if (this.baseTexture) {
                if (destroyBase) {
                    var resource = this.baseTexture.resource;
                    // delete the texture if it exists in the texture cache..
                    // this only needs to be removed if the base texture is actually destroyed too..
                    if (resource && resource.url && TextureCache[resource.url]) {
                        Texture.removeFromCache(resource.url);
                    }
                    this.baseTexture.destroy();
                }
                this.baseTexture.off('loaded', this.onBaseTextureUpdated, this);
                this.baseTexture.off('update', this.onBaseTextureUpdated, this);
                this.baseTexture = null;
            }
            this._frame = null;
            this._uvs = null;
            this.trim = null;
            this.orig = null;
            this.valid = false;
            Texture.removeFromCache(this);
            this.textureCacheIds = null;
        };
        /**
         * Creates a new texture object that acts the same as this one.
         *
         * @return - The new texture
         */
        Texture.prototype.clone = function () {
            var clonedFrame = this._frame.clone();
            var clonedOrig = this._frame === this.orig ? clonedFrame : this.orig.clone();
            var clonedTexture = new Texture(this.baseTexture, !this.noFrame && clonedFrame, clonedOrig, this.trim && this.trim.clone(), this.rotate, this.defaultAnchor);
            if (this.noFrame) {
                clonedTexture._frame = clonedFrame;
            }
            return clonedTexture;
        };
        /**
         * Updates the internal WebGL UV cache. Use it after you change `frame` or `trim` of the texture.
         * Call it after changing the frame
         */
        Texture.prototype.updateUvs = function () {
            if (this._uvs === DEFAULT_UVS) {
                this._uvs = new TextureUvs();
            }
            this._uvs.set(this._frame, this.baseTexture, this.rotate);
            this._updateID++;
        };
        /**
         * Helper function that creates a new Texture based on the source you provide.
         * The source can be - frame id, image url, video url, canvas element, video element, base texture
         *
         * @param {string|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|PIXI.BaseTexture} source -
         *        Source to create texture from
         * @param options - See {@link PIXI.BaseTexture}'s constructor for options.
         * @param {string} [options.pixiIdPrefix=pixiid] - If a source has no id, this is the prefix of the generated id
         * @param {boolean} [strict] - Enforce strict-mode, see {@link PIXI.settings.STRICT_TEXTURE_CACHE}.
         * @return {PIXI.Texture} The newly created texture
         */
        Texture.from = function (source, options, strict) {
            if (options === void 0) { options = {}; }
            if (strict === void 0) { strict = settings.STRICT_TEXTURE_CACHE; }
            var isFrame = typeof source === 'string';
            var cacheId = null;
            if (isFrame) {
                cacheId = source;
            }
            else if (source instanceof BaseTexture) {
                if (!source.cacheId) {
                    var prefix = (options && options.pixiIdPrefix) || 'pixiid';
                    source.cacheId = prefix + "-" + uid();
                    BaseTexture.addToCache(source, source.cacheId);
                }
                cacheId = source.cacheId;
            }
            else {
                if (!source._pixiId) {
                    var prefix = (options && options.pixiIdPrefix) || 'pixiid';
                    source._pixiId = prefix + "_" + uid();
                }
                cacheId = source._pixiId;
            }
            var texture = TextureCache[cacheId];
            // Strict-mode rejects invalid cacheIds
            if (isFrame && strict && !texture) {
                throw new Error("The cacheId \"" + cacheId + "\" does not exist in TextureCache.");
            }
            if (!texture && !(source instanceof BaseTexture)) {
                if (!options.resolution) {
                    options.resolution = getResolutionOfUrl(source);
                }
                texture = new Texture(new BaseTexture(source, options));
                texture.baseTexture.cacheId = cacheId;
                BaseTexture.addToCache(texture.baseTexture, cacheId);
                Texture.addToCache(texture, cacheId);
            }
            else if (!texture && (source instanceof BaseTexture)) {
                texture = new Texture(source);
                Texture.addToCache(texture, cacheId);
            }
            // lets assume its a base texture!
            return texture;
        };
        /**
         * Useful for loading textures via URLs. Use instead of `Texture.from` because
         * it does a better job of handling failed URLs more effectively. This also ignores
         * `PIXI.settings.STRICT_TEXTURE_CACHE`. Works for Videos, SVGs, Images.
         *
         * @param url - The remote URL to load.
         * @param options - Optional options to include
         * @return - A Promise that resolves to a Texture.
         */
        Texture.fromURL = function (url, options) {
            var resourceOptions = Object.assign({ autoLoad: false }, options === null || options === void 0 ? void 0 : options.resourceOptions);
            var texture = Texture.from(url, Object.assign({ resourceOptions: resourceOptions }, options), false);
            var resource = texture.baseTexture.resource;
            // The texture was already loaded
            if (texture.baseTexture.valid) {
                return Promise.resolve(texture);
            }
            // Manually load the texture, this should allow users to handle load errors
            return resource.load().then(function () { return Promise.resolve(texture); });
        };
        /**
         * Create a new Texture with a BufferResource from a Float32Array.
         * RGBA values are floats from 0 to 1.
         *
         * @param {Float32Array|Uint8Array} buffer - The optional array to use, if no data
         *        is provided, a new Float32Array is created.
         * @param width - Width of the resource
         * @param height - Height of the resource
         * @param options - See {@link PIXI.BaseTexture}'s constructor for options.
         * @return - The resulting new BaseTexture
         */
        Texture.fromBuffer = function (buffer, width, height, options) {
            return new Texture(BaseTexture.fromBuffer(buffer, width, height, options));
        };
        /**
         * Create a texture from a source and add to the cache.
         *
         * @param {HTMLImageElement|HTMLCanvasElement|string} source - The input source.
         * @param imageUrl - File name of texture, for cache and resolving resolution.
         * @param name - Human readable name for the texture cache. If no name is
         *        specified, only `imageUrl` will be used as the cache ID.
         * @return - Output texture
         */
        Texture.fromLoader = function (source, imageUrl, name, options) {
            var baseTexture = new BaseTexture(source, Object.assign({
                scaleMode: settings.SCALE_MODE,
                resolution: getResolutionOfUrl(imageUrl),
            }, options));
            var resource = baseTexture.resource;
            if (resource instanceof ImageResource) {
                resource.url = imageUrl;
            }
            var texture = new Texture(baseTexture);
            // No name, use imageUrl instead
            if (!name) {
                name = imageUrl;
            }
            // lets also add the frame to pixi's global cache for 'fromLoader' function
            BaseTexture.addToCache(texture.baseTexture, name);
            Texture.addToCache(texture, name);
            // also add references by url if they are different.
            if (name !== imageUrl) {
                BaseTexture.addToCache(texture.baseTexture, imageUrl);
                Texture.addToCache(texture, imageUrl);
            }
            // Generally images are valid right away
            if (texture.baseTexture.valid) {
                return Promise.resolve(texture);
            }
            // SVG assets need to be parsed async, let's wait
            return new Promise(function (resolve) {
                texture.baseTexture.once('loaded', function () { return resolve(texture); });
            });
        };
        /**
         * Adds a Texture to the global TextureCache. This cache is shared across the whole PIXI object.
         *
         * @param texture - The Texture to add to the cache.
         * @param id - The id that the Texture will be stored against.
         */
        Texture.addToCache = function (texture, id) {
            if (id) {
                if (texture.textureCacheIds.indexOf(id) === -1) {
                    texture.textureCacheIds.push(id);
                }
                if (TextureCache[id]) {
                    // eslint-disable-next-line no-console
                    console.warn("Texture added to the cache with an id [" + id + "] that already had an entry");
                }
                TextureCache[id] = texture;
            }
        };
        /**
         * Remove a Texture from the global TextureCache.
         *
         * @param texture - id of a Texture to be removed, or a Texture instance itself
         * @return - The Texture that was removed
         */
        Texture.removeFromCache = function (texture) {
            if (typeof texture === 'string') {
                var textureFromCache = TextureCache[texture];
                if (textureFromCache) {
                    var index = textureFromCache.textureCacheIds.indexOf(texture);
                    if (index > -1) {
                        textureFromCache.textureCacheIds.splice(index, 1);
                    }
                    delete TextureCache[texture];
                    return textureFromCache;
                }
            }
            else if (texture && texture.textureCacheIds) {
                for (var i = 0; i < texture.textureCacheIds.length; ++i) {
                    // Check that texture matches the one being passed in before deleting it from the cache.
                    if (TextureCache[texture.textureCacheIds[i]] === texture) {
                        delete TextureCache[texture.textureCacheIds[i]];
                    }
                }
                texture.textureCacheIds.length = 0;
                return texture;
            }
            return null;
        };
        Object.defineProperty(Texture.prototype, "resolution", {
            /**
             * Returns resolution of baseTexture
             *
             * @readonly
             */
            get: function () {
                return this.baseTexture.resolution;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Texture.prototype, "frame", {
            /**
             * The frame specifies the region of the base texture that this texture uses.
             * Please call `updateUvs()` after you change coordinates of `frame` manually.
             */
            get: function () {
                return this._frame;
            },
            set: function (frame) {
                this._frame = frame;
                this.noFrame = false;
                var x = frame.x, y = frame.y, width = frame.width, height = frame.height;
                var xNotFit = x + width > this.baseTexture.width;
                var yNotFit = y + height > this.baseTexture.height;
                if (xNotFit || yNotFit) {
                    var relationship = xNotFit && yNotFit ? 'and' : 'or';
                    var errorX = "X: " + x + " + " + width + " = " + (x + width) + " > " + this.baseTexture.width;
                    var errorY = "Y: " + y + " + " + height + " = " + (y + height) + " > " + this.baseTexture.height;
                    throw new Error('Texture Error: frame does not fit inside the base Texture dimensions: '
                        + (errorX + " " + relationship + " " + errorY));
                }
                this.valid = width && height && this.baseTexture.valid;
                if (!this.trim && !this.rotate) {
                    this.orig = frame;
                }
                if (this.valid) {
                    this.updateUvs();
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Texture.prototype, "rotate", {
            /**
             * Indicates whether the texture is rotated inside the atlas
             * set to 2 to compensate for texture packer rotation
             * set to 6 to compensate for spine packer rotation
             * can be used to rotate or mirror sprites
             * See {@link PIXI.groupD8} for explanation
             */
            get: function () {
                return this._rotate;
            },
            set: function (rotate) {
                this._rotate = rotate;
                if (this.valid) {
                    this.updateUvs();
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Texture.prototype, "width", {
            /** The width of the Texture in pixels. */
            get: function () {
                return this.orig.width;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Texture.prototype, "height", {
            /** The height of the Texture in pixels. */
            get: function () {
                return this.orig.height;
            },
            enumerable: false,
            configurable: true
        });
        /** Utility function for BaseTexture|Texture cast. */
        Texture.prototype.castToBaseTexture = function () {
            return this.baseTexture;
        };
        return Texture;
    }(eventemitter3));
    function createWhiteTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        var context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.fillRect(0, 0, 16, 16);
        return new Texture(new BaseTexture(new CanvasResource(canvas)));
    }
    function removeAllHandlers(tex) {
        tex.destroy = function _emptyDestroy() { };
        tex.on = function _emptyOn() { };
        tex.once = function _emptyOnce() { };
        tex.emit = function _emptyEmit() { };
    }
    /**
     * An empty texture, used often to not have to create multiple empty textures.
     * Can not be destroyed.
     *
     * @static
     * @constant
     * @member {PIXI.Texture}
     */
    Texture.EMPTY = new Texture(new BaseTexture());
    removeAllHandlers(Texture.EMPTY);
    removeAllHandlers(Texture.EMPTY.baseTexture);
    /**
     * A white texture of 16x16 size, used for graphics and other things
     * Can not be destroyed.
     *
     * @static
     * @constant
     * @member {PIXI.Texture}
     */
    Texture.WHITE = createWhiteTexture();
    removeAllHandlers(Texture.WHITE);
    removeAllHandlers(Texture.WHITE.baseTexture);
  
    /**
     * A RenderTexture is a special texture that allows any PixiJS display object to be rendered to it.
     *
     * __Hint__: All DisplayObjects (i.e. Sprites) that render to a RenderTexture should be preloaded
     * otherwise black rectangles will be drawn instead.
     *
     * __Hint-2__: The actual memory allocation will happen on first render.
     * You shouldn't create renderTextures each frame just to delete them after, try to reuse them.
     *
     * A RenderTexture takes a snapshot of any Display Object given to its render method. For example:
     *
     * ```js
     * let renderer = PIXI.autoDetectRenderer();
     * let renderTexture = PIXI.RenderTexture.create({ width: 800, height: 600 });
     * let sprite = PIXI.Sprite.from("spinObj_01.png");
     *
     * sprite.position.x = 800/2;
     * sprite.position.y = 600/2;
     * sprite.anchor.x = 0.5;
     * sprite.anchor.y = 0.5;
     *
     * renderer.render(sprite, {renderTexture});
     * ```
     * Note that you should not create a new renderer, but reuse the same one as the rest of the application.
     *
     * The Sprite in this case will be rendered using its local transform. To render this sprite at 0,0
     * you can clear the transform
     *
     * ```js
     *
     * sprite.setTransform()
     *
     * let renderTexture = new PIXI.RenderTexture.create({ width: 100, height: 100 });
     *
     * renderer.render(sprite, {renderTexture});  // Renders to center of RenderTexture
     * ```
     *
     * @memberof PIXI
     */
    var RenderTexture = /** @class */ (function (_super) {
        __extends$2(RenderTexture, _super);
        /**
         * @param baseRenderTexture - The base texture object that this texture uses.
         * @param frame - The rectangle frame of the texture to show.
         */
        function RenderTexture(baseRenderTexture, frame) {
            var _this = _super.call(this, baseRenderTexture, frame) || this;
            _this.valid = true;
            _this.filterFrame = null;
            _this.filterPoolKey = null;
            _this.updateUvs();
            return _this;
        }
        Object.defineProperty(RenderTexture.prototype, "framebuffer", {
            /**
             * Shortcut to `this.baseTexture.framebuffer`, saves baseTexture cast.
             *
             * @readonly
             */
            get: function () {
                return this.baseTexture.framebuffer;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(RenderTexture.prototype, "multisample", {
            /**
             * Shortcut to `this.framebuffer.multisample`.
             *
             * @default PIXI.MSAA_QUALITY.NONE
             */
            get: function () {
                return this.framebuffer.multisample;
            },
            set: function (value) {
                this.framebuffer.multisample = value;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Resizes the RenderTexture.
         *
         * @param desiredWidth - The desired width to resize to.
         * @param desiredHeight - The desired height to resize to.
         * @param resizeBaseTexture - Should the baseTexture.width and height values be resized as well?
         */
        RenderTexture.prototype.resize = function (desiredWidth, desiredHeight, resizeBaseTexture) {
            if (resizeBaseTexture === void 0) { resizeBaseTexture = true; }
            var resolution = this.baseTexture.resolution;
            var width = Math.round(desiredWidth * resolution) / resolution;
            var height = Math.round(desiredHeight * resolution) / resolution;
            // TODO - could be not required..
            this.valid = (width > 0 && height > 0);
            this._frame.width = this.orig.width = width;
            this._frame.height = this.orig.height = height;
            if (resizeBaseTexture) {
                this.baseTexture.resize(width, height);
            }
            this.updateUvs();
        };
        /**
         * Changes the resolution of baseTexture, but does not change framebuffer size.
         *
         * @param resolution - The new resolution to apply to RenderTexture
         */
        RenderTexture.prototype.setResolution = function (resolution) {
            var baseTexture = this.baseTexture;
            if (baseTexture.resolution === resolution) {
                return;
            }
            baseTexture.setResolution(resolution);
            this.resize(baseTexture.width, baseTexture.height, false);
        };
        RenderTexture.create = function (options) {
            var arguments$1 = arguments;
  
            var rest = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                rest[_i - 1] = arguments$1[_i];
            }
            // @deprecated fallback, old-style: create(width, height, scaleMode, resolution)
            if (typeof options === 'number') {
                deprecation('6.0.0', 'Arguments (width, height, scaleMode, resolution) have been deprecated.');
                /* eslint-disable prefer-rest-params */
                options = {
                    width: options,
                    height: rest[0],
                    scaleMode: rest[1],
                    resolution: rest[2],
                };
                /* eslint-enable prefer-rest-params */
            }
            return new RenderTexture(new BaseRenderTexture(options));
        };
        return RenderTexture;
    }(Texture));
  
    /**
     * Texture pool, used by FilterSystem and plugins.
     *
     * Stores collection of temporary pow2 or screen-sized renderTextures
     *
     * If you use custom RenderTexturePool for your filters, you can use methods
     * `getFilterTexture` and `returnFilterTexture` same as in
     *
     * @memberof PIXI
     */
    var RenderTexturePool = /** @class */ (function () {
        /**
         * @param textureOptions - options that will be passed to BaseRenderTexture constructor
         * @param {PIXI.SCALE_MODES} [textureOptions.scaleMode] - See {@link PIXI.SCALE_MODES} for possible values.
         */
        function RenderTexturePool(textureOptions) {
            this.texturePool = {};
            this.textureOptions = textureOptions || {};
            this.enableFullScreen = false;
            this._pixelsWidth = 0;
            this._pixelsHeight = 0;
        }
        /**
         * Creates texture with params that were specified in pool constructor.
         *
         * @param realWidth - Width of texture in pixels.
         * @param realHeight - Height of texture in pixels.
         * @param multisample - Number of samples of the framebuffer.
         */
        RenderTexturePool.prototype.createTexture = function (realWidth, realHeight, multisample) {
            if (multisample === void 0) { multisample = exports.MSAA_QUALITY.NONE; }
            var baseRenderTexture = new BaseRenderTexture(Object.assign({
                width: realWidth,
                height: realHeight,
                resolution: 1,
                multisample: multisample,
            }, this.textureOptions));
            return new RenderTexture(baseRenderTexture);
        };
        /**
         * Gets a Power-of-Two render texture or fullScreen texture
         *
         * @param minWidth - The minimum width of the render texture.
         * @param minHeight - The minimum height of the render texture.
         * @param resolution - The resolution of the render texture.
         * @param multisample - Number of samples of the render texture.
         * @return The new render texture.
         */
        RenderTexturePool.prototype.getOptimalTexture = function (minWidth, minHeight, resolution, multisample) {
            if (resolution === void 0) { resolution = 1; }
            if (multisample === void 0) { multisample = exports.MSAA_QUALITY.NONE; }
            var key;
            minWidth = Math.ceil((minWidth * resolution) - 1e-6);
            minHeight = Math.ceil((minHeight * resolution) - 1e-6);
            if (!this.enableFullScreen || minWidth !== this._pixelsWidth || minHeight !== this._pixelsHeight) {
                minWidth = nextPow2(minWidth);
                minHeight = nextPow2(minHeight);
                key = (((minWidth & 0xFFFF) << 16) | (minHeight & 0xFFFF)) >>> 0;
                if (multisample > 1) {
                    key += multisample * 0x100000000;
                }
            }
            else {
                key = multisample > 1 ? -multisample : -1;
            }
            if (!this.texturePool[key]) {
                this.texturePool[key] = [];
            }
            var renderTexture = this.texturePool[key].pop();
            if (!renderTexture) {
                renderTexture = this.createTexture(minWidth, minHeight, multisample);
            }
            renderTexture.filterPoolKey = key;
            renderTexture.setResolution(resolution);
            return renderTexture;
        };
        /**
         * Gets extra texture of the same size as input renderTexture
         *
         * `getFilterTexture(input, 0.5)` or `getFilterTexture(0.5, input)`
         *
         * @param input - renderTexture from which size and resolution will be copied
         * @param resolution - override resolution of the renderTexture
         *  It overrides, it does not multiply
         * @param multisample - number of samples of the renderTexture
         * @returns
         */
        RenderTexturePool.prototype.getFilterTexture = function (input, resolution, multisample) {
            var filterTexture = this.getOptimalTexture(input.width, input.height, resolution || input.resolution, multisample || exports.MSAA_QUALITY.NONE);
            filterTexture.filterFrame = input.filterFrame;
            return filterTexture;
        };
        /**
         * Place a render texture back into the pool.
         *
         * @param renderTexture - The renderTexture to free
         */
        RenderTexturePool.prototype.returnTexture = function (renderTexture) {
            var key = renderTexture.filterPoolKey;
            renderTexture.filterFrame = null;
            this.texturePool[key].push(renderTexture);
        };
        /**
         * Alias for returnTexture, to be compliant with FilterSystem interface.
         *
         * @param renderTexture - The renderTexture to free
         */
        RenderTexturePool.prototype.returnFilterTexture = function (renderTexture) {
            this.returnTexture(renderTexture);
        };
        /**
         * Clears the pool.
         *
         * @param destroyTextures - Destroy all stored textures.
         */
        RenderTexturePool.prototype.clear = function (destroyTextures) {
            destroyTextures = destroyTextures !== false;
            if (destroyTextures) {
                for (var i in this.texturePool) {
                    var textures = this.texturePool[i];
                    if (textures) {
                        for (var j = 0; j < textures.length; j++) {
                            textures[j].destroy(true);
                        }
                    }
                }
            }
            this.texturePool = {};
        };
        /**
         * If screen size was changed, drops all screen-sized textures,
         * sets new screen size, sets `enableFullScreen` to true
         *
         * Size is measured in pixels, `renderer.view` can be passed here, not `renderer.screen`
         *
         * @param size - Initial size of screen.
         */
        RenderTexturePool.prototype.setScreenSize = function (size) {
            if (size.width === this._pixelsWidth
                && size.height === this._pixelsHeight) {
                return;
            }
            this.enableFullScreen = size.width > 0 && size.height > 0;
            for (var i in this.texturePool) {
                if (!(Number(i) < 0)) {
                    continue;
                }
                var textures = this.texturePool[i];
                if (textures) {
                    for (var j = 0; j < textures.length; j++) {
                        textures[j].destroy(true);
                    }
                }
                this.texturePool[i] = [];
            }
            this._pixelsWidth = size.width;
            this._pixelsHeight = size.height;
        };
        /**
         * Key that is used to store fullscreen renderTextures in a pool
         *
         * @constant
         */
        RenderTexturePool.SCREEN_KEY = -1;
        return RenderTexturePool;
    }());
  
    /* eslint-disable max-len */
    /**
     * Holds the information for a single attribute structure required to render geometry.
     *
     * This does not contain the actual data, but instead has a buffer id that maps to a {@link PIXI.Buffer}
     * This can include anything from positions, uvs, normals, colors etc.
     *
     * @memberof PIXI
     */
    var Attribute = /** @class */ (function () {
        /**
         * @param buffer - the id of the buffer that this attribute will look for
         * @param size - the size of the attribute. If you have 2 floats per vertex (eg position x and y) this would be 2.
         * @param normalized - should the data be normalized.
         * @param {PIXI.TYPES} [type=PIXI.TYPES.FLOAT] - what type of number is the attribute. Check {@link PIXI.TYPES} to see the ones available
         * @param [stride=0] - How far apart, in bytes, the start of each value is. (used for interleaving data)
         * @param [start=0] - How far into the array to start reading values (used for interleaving data)
         * @param [instance=false] - Whether the geometry is instanced.
         */
        function Attribute(buffer, size, normalized, type, stride, start, instance) {
            if (size === void 0) { size = 0; }
            if (normalized === void 0) { normalized = false; }
            if (type === void 0) { type = exports.TYPES.FLOAT; }
            this.buffer = buffer;
            this.size = size;
            this.normalized = normalized;
            this.type = type;
            this.stride = stride;
            this.start = start;
            this.instance = instance;
        }
        /** Destroys the Attribute. */
        Attribute.prototype.destroy = function () {
            this.buffer = null;
        };
        /**
         * Helper function that creates an Attribute based on the information provided
         *
         * @param buffer - the id of the buffer that this attribute will look for
         * @param [size=0] - the size of the attribute. If you have 2 floats per vertex (eg position x and y) this would be 2
         * @param [normalized=false] - should the data be normalized.
         * @param [type=PIXI.TYPES.FLOAT] - what type of number is the attribute. Check {@link PIXI.TYPES} to see the ones available
         * @param [stride=0] - How far apart, in bytes, the start of each value is. (used for interleaving data)
         * @returns - A new {@link PIXI.Attribute} based on the information provided
         */
        Attribute.from = function (buffer, size, normalized, type, stride) {
            return new Attribute(buffer, size, normalized, type, stride);
        };
        return Attribute;
    }());
  
    var UID = 0;
    /**
     * A wrapper for data so that it can be used and uploaded by WebGL
     *
     * @memberof PIXI
     */
    var Buffer = /** @class */ (function () {
        /**
         * @param {ArrayBuffer| SharedArrayBuffer|ArrayBufferView} data - the data to store in the buffer.
         * @param _static - `true` for static buffer
         * @param index - `true` for index buffer
         */
        function Buffer(data, _static, index) {
            if (_static === void 0) { _static = true; }
            if (index === void 0) { index = false; }
            this.data = (data || new Float32Array(1));
            this._glBuffers = {};
            this._updateID = 0;
            this.index = index;
            this.static = _static;
            this.id = UID++;
            this.disposeRunner = new Runner('disposeBuffer');
        }
        // TODO could explore flagging only a partial upload?
        /**
         * Flags this buffer as requiring an upload to the GPU.
         * @param {ArrayBuffer|SharedArrayBuffer|ArrayBufferView|number[]} [data] - the data to update in the buffer.
         */
        Buffer.prototype.update = function (data) {
            if (data instanceof Array) {
                data = new Float32Array(data);
            }
            this.data = data || this.data;
            this._updateID++;
        };
        /** Disposes WebGL resources that are connected to this geometry. */
        Buffer.prototype.dispose = function () {
            this.disposeRunner.emit(this, false);
        };
        /** Destroys the buffer. */
        Buffer.prototype.destroy = function () {
            this.dispose();
            this.data = null;
        };
        Object.defineProperty(Buffer.prototype, "index", {
            get: function () {
                return this.type === exports.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
            },
            /**
             * Flags whether this is an index buffer.
             *
             * Index buffers are of type `ELEMENT_ARRAY_BUFFER`. Note that setting this property to false will make
             * the buffer of type `ARRAY_BUFFER`.
             *
             * For backwards compatibility.
             */
            set: function (value) {
                this.type = value ? exports.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER : exports.BUFFER_TYPE.ARRAY_BUFFER;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Helper function that creates a buffer based on an array or TypedArray
         *
         * @param {ArrayBufferView | number[]} data - the TypedArray that the buffer will store. If this is a regular Array it will be converted to a Float32Array.
         * @return - A new Buffer based on the data provided.
         */
        Buffer.from = function (data) {
            if (data instanceof Array) {
                data = new Float32Array(data);
            }
            return new Buffer(data);
        };
        return Buffer;
    }());
  
    /* eslint-disable object-shorthand */
    var map$1 = {
        Float32Array: Float32Array,
        Uint32Array: Uint32Array,
        Int32Array: Int32Array,
        Uint8Array: Uint8Array,
    };
    function interleaveTypedArrays$1(arrays, sizes) {
        var outSize = 0;
        var stride = 0;
        var views = {};
        for (var i = 0; i < arrays.length; i++) {
            stride += sizes[i];
            outSize += arrays[i].length;
        }
        var buffer = new ArrayBuffer(outSize * 4);
        var out = null;
        var littleOffset = 0;
        for (var i = 0; i < arrays.length; i++) {
            var size = sizes[i];
            var array = arrays[i];
            var type = getBufferType(array);
            if (!views[type]) {
                views[type] = new map$1[type](buffer);
            }
            out = views[type];
            for (var j = 0; j < array.length; j++) {
                var indexStart = ((j / size | 0) * stride) + littleOffset;
                var index = j % size;
                out[indexStart + index] = array[j];
            }
            littleOffset += size;
        }
        return new Float32Array(buffer);
    }
  
    var byteSizeMap = { 5126: 4, 5123: 2, 5121: 1 };
    var UID$1 = 0;
    /* eslint-disable object-shorthand */
    var map$1$1 = {
        Float32Array: Float32Array,
        Uint32Array: Uint32Array,
        Int32Array: Int32Array,
        Uint8Array: Uint8Array,
        Uint16Array: Uint16Array,
    };
    /* eslint-disable max-len */
    /**
     * The Geometry represents a model. It consists of two components:
     * - GeometryStyle - The structure of the model such as the attributes layout
     * - GeometryData - the data of the model - this consists of buffers.
     * This can include anything from positions, uvs, normals, colors etc.
     *
     * Geometry can be defined without passing in a style or data if required (thats how I prefer!)
     *
     * ```js
     * let geometry = new PIXI.Geometry();
     *
     * geometry.addAttribute('positions', [0, 0, 100, 0, 100, 100, 0, 100], 2);
     * geometry.addAttribute('uvs', [0,0,1,0,1,1,0,1],2)
     * geometry.addIndex([0,1,2,1,3,2])
     * ```
     *
     * @memberof PIXI
     */
    var Geometry = /** @class */ (function () {
        /**
         * @param buffers - An array of buffers. optional.
         * @param attributes - Of the geometry, optional structure of the attributes layout
         */
        function Geometry(buffers, attributes) {
            if (buffers === void 0) { buffers = []; }
            if (attributes === void 0) { attributes = {}; }
            this.buffers = buffers;
            this.indexBuffer = null;
            this.attributes = attributes;
            this.glVertexArrayObjects = {};
            this.id = UID$1++;
            this.instanced = false;
            this.instanceCount = 1;
            this.disposeRunner = new Runner('disposeGeometry');
            this.refCount = 0;
        }
        /**
         *
         * Adds an attribute to the geometry
         * Note: `stride` and `start` should be `undefined` if you dont know them, not 0!
         *
         * @param id - the name of the attribute (matching up to a shader)
         * @param {PIXI.Buffer|number[]} buffer - the buffer that holds the data of the attribute . You can also provide an Array and a buffer will be created from it.
         * @param size - the size of the attribute. If you have 2 floats per vertex (eg position x and y) this would be 2
         * @param normalized - should the data be normalized.
         * @param [type=PIXI.TYPES.FLOAT] - what type of number is the attribute. Check {PIXI.TYPES} to see the ones available
         * @param [stride=0] - How far apart, in bytes, the start of each value is. (used for interleaving data)
         * @param [start=0] - How far into the array to start reading values (used for interleaving data)
         * @param instance - Instancing flag
         * @return - Returns self, useful for chaining.
         */
        Geometry.prototype.addAttribute = function (id, buffer, size, normalized, type, stride, start, instance) {
            if (size === void 0) { size = 0; }
            if (normalized === void 0) { normalized = false; }
            if (instance === void 0) { instance = false; }
            if (!buffer) {
                throw new Error('You must pass a buffer when creating an attribute');
            }
            // check if this is a buffer!
            if (!(buffer instanceof Buffer)) {
                // its an array!
                if (buffer instanceof Array) {
                    buffer = new Float32Array(buffer);
                }
                buffer = new Buffer(buffer);
            }
            var ids = id.split('|');
            if (ids.length > 1) {
                for (var i = 0; i < ids.length; i++) {
                    this.addAttribute(ids[i], buffer, size, normalized, type);
                }
                return this;
            }
            var bufferIndex = this.buffers.indexOf(buffer);
            if (bufferIndex === -1) {
                this.buffers.push(buffer);
                bufferIndex = this.buffers.length - 1;
            }
            this.attributes[id] = new Attribute(bufferIndex, size, normalized, type, stride, start, instance);
            // assuming that if there is instanced data then this will be drawn with instancing!
            this.instanced = this.instanced || instance;
            return this;
        };
        /**
         * Returns the requested attribute.
         *
         * @param id - The name of the attribute required
         * @return - The attribute requested.
         */
        Geometry.prototype.getAttribute = function (id) {
            return this.attributes[id];
        };
        /**
         * Returns the requested buffer.
         *
         * @param id - The name of the buffer required.
         * @return - The buffer requested.
         */
        Geometry.prototype.getBuffer = function (id) {
            return this.buffers[this.getAttribute(id).buffer];
        };
        /**
        *
        * Adds an index buffer to the geometry
        * The index buffer contains integers, three for each triangle in the geometry, which reference the various attribute buffers (position, colour, UV coordinates, other UV coordinates, normal, â€¦). There is only ONE index buffer.
        *
        * @param {PIXI.Buffer|number[]} [buffer] - The buffer that holds the data of the index buffer. You can also provide an Array and a buffer will be created from it.
        * @return - Returns self, useful for chaining.
        */
        Geometry.prototype.addIndex = function (buffer) {
            if (!(buffer instanceof Buffer)) {
                // its an array!
                if (buffer instanceof Array) {
                    buffer = new Uint16Array(buffer);
                }
                buffer = new Buffer(buffer);
            }
            buffer.type = exports.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
            this.indexBuffer = buffer;
            if (this.buffers.indexOf(buffer) === -1) {
                this.buffers.push(buffer);
            }
            return this;
        };
        /**
         * Returns the index buffer
         *
         * @return - The index buffer.
         */
        Geometry.prototype.getIndex = function () {
            return this.indexBuffer;
        };
        /**
         * This function modifies the structure so that all current attributes become interleaved into a single buffer
         * This can be useful if your model remains static as it offers a little performance boost
         *
         * @return - Returns self, useful for chaining.
         */
        Geometry.prototype.interleave = function () {
            // a simple check to see if buffers are already interleaved..
            if (this.buffers.length === 1 || (this.buffers.length === 2 && this.indexBuffer))
                { return this; }
            // assume already that no buffers are interleaved
            var arrays = [];
            var sizes = [];
            var interleavedBuffer = new Buffer();
            var i;
            for (i in this.attributes) {
                var attribute = this.attributes[i];
                var buffer = this.buffers[attribute.buffer];
                arrays.push(buffer.data);
                sizes.push((attribute.size * byteSizeMap[attribute.type]) / 4);
                attribute.buffer = 0;
            }
            interleavedBuffer.data = interleaveTypedArrays$1(arrays, sizes);
            for (i = 0; i < this.buffers.length; i++) {
                if (this.buffers[i] !== this.indexBuffer) {
                    this.buffers[i].destroy();
                }
            }
            this.buffers = [interleavedBuffer];
            if (this.indexBuffer) {
                this.buffers.push(this.indexBuffer);
            }
            return this;
        };
        /** Get the size of the geometries, in vertices. */
        Geometry.prototype.getSize = function () {
            for (var i in this.attributes) {
                var attribute = this.attributes[i];
                var buffer = this.buffers[attribute.buffer];
                return buffer.data.length / ((attribute.stride / 4) || attribute.size);
            }
            return 0;
        };
        /** Disposes WebGL resources that are connected to this geometry. */
        Geometry.prototype.dispose = function () {
            this.disposeRunner.emit(this, false);
        };
        /** Destroys the geometry. */
        Geometry.prototype.destroy = function () {
            this.dispose();
            this.buffers = null;
            this.indexBuffer = null;
            this.attributes = null;
        };
        /**
         * Returns a clone of the geometry.
         *
         * @returns - A new clone of this geometry.
         */
        Geometry.prototype.clone = function () {
            var geometry = new Geometry();
            for (var i = 0; i < this.buffers.length; i++) {
                geometry.buffers[i] = new Buffer(this.buffers[i].data.slice(0));
            }
            for (var i in this.attributes) {
                var attrib = this.attributes[i];
                geometry.attributes[i] = new Attribute(attrib.buffer, attrib.size, attrib.normalized, attrib.type, attrib.stride, attrib.start, attrib.instance);
            }
            if (this.indexBuffer) {
                geometry.indexBuffer = geometry.buffers[this.buffers.indexOf(this.indexBuffer)];
                geometry.indexBuffer.type = exports.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
            }
            return geometry;
        };
        /**
         * Merges an array of geometries into a new single one.
         *
         * Geometry attribute styles must match for this operation to work.
         *
         * @param geometries - array of geometries to merge
         * @return - Shiny new geometry!
         */
        Geometry.merge = function (geometries) {
            // todo add a geometry check!
            // also a size check.. cant be too big!]
            var geometryOut = new Geometry();
            var arrays = [];
            var sizes = [];
            var offsets = [];
            var geometry;
            // pass one.. get sizes..
            for (var i = 0; i < geometries.length; i++) {
                geometry = geometries[i];
                for (var j = 0; j < geometry.buffers.length; j++) {
                    sizes[j] = sizes[j] || 0;
                    sizes[j] += geometry.buffers[j].data.length;
                    offsets[j] = 0;
                }
            }
            // build the correct size arrays..
            for (var i = 0; i < geometry.buffers.length; i++) {
                // TODO types!
                arrays[i] = new map$1$1[getBufferType(geometry.buffers[i].data)](sizes[i]);
                geometryOut.buffers[i] = new Buffer(arrays[i]);
            }
            // pass to set data..
            for (var i = 0; i < geometries.length; i++) {
                geometry = geometries[i];
                for (var j = 0; j < geometry.buffers.length; j++) {
                    arrays[j].set(geometry.buffers[j].data, offsets[j]);
                    offsets[j] += geometry.buffers[j].data.length;
                }
            }
            geometryOut.attributes = geometry.attributes;
            if (geometry.indexBuffer) {
                geometryOut.indexBuffer = geometryOut.buffers[geometry.buffers.indexOf(geometry.indexBuffer)];
                geometryOut.indexBuffer.type = exports.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
                var offset = 0;
                var stride = 0;
                var offset2 = 0;
                var bufferIndexToCount = 0;
                // get a buffer
                for (var i = 0; i < geometry.buffers.length; i++) {
                    if (geometry.buffers[i] !== geometry.indexBuffer) {
                        bufferIndexToCount = i;
                        break;
                    }
                }
                // figure out the stride of one buffer..
                for (var i in geometry.attributes) {
                    var attribute = geometry.attributes[i];
                    if ((attribute.buffer | 0) === bufferIndexToCount) {
                        stride += ((attribute.size * byteSizeMap[attribute.type]) / 4);
                    }
                }
                // time to off set all indexes..
                for (var i = 0; i < geometries.length; i++) {
                    var indexBufferData = geometries[i].indexBuffer.data;
                    for (var j = 0; j < indexBufferData.length; j++) {
                        geometryOut.indexBuffer.data[j + offset2] += offset;
                    }
                    offset += geometries[i].buffers[bufferIndexToCount].data.length / (stride);
                    offset2 += indexBufferData.length;
                }
            }
            return geometryOut;
        };
        return Geometry;
    }());
  
    /**
     * Helper class to create a quad
     *
     * @memberof PIXI
     */
    var Quad = /** @class */ (function (_super) {
        __extends$2(Quad, _super);
        function Quad() {
            var _this = _super.call(this) || this;
            _this.addAttribute('aVertexPosition', new Float32Array([
                0, 0,
                1, 0,
                1, 1,
                0, 1 ]))
                .addIndex([0, 1, 3, 2]);
            return _this;
        }
        return Quad;
    }(Geometry));
  
    /**
     * Helper class to create a quad with uvs like in v4
     *
     * @memberof PIXI
     */
    var QuadUv = /** @class */ (function (_super) {
        __extends$2(QuadUv, _super);
        function QuadUv() {
            var _this = _super.call(this) || this;
            _this.vertices = new Float32Array([
                -1, -1,
                1, -1,
                1, 1,
                -1, 1 ]);
            _this.uvs = new Float32Array([
                0, 0,
                1, 0,
                1, 1,
                0, 1 ]);
            _this.vertexBuffer = new Buffer(_this.vertices);
            _this.uvBuffer = new Buffer(_this.uvs);
            _this.addAttribute('aVertexPosition', _this.vertexBuffer)
                .addAttribute('aTextureCoord', _this.uvBuffer)
                .addIndex([0, 1, 2, 0, 2, 3]);
            return _this;
        }
        /**
         * Maps two Rectangle to the quad.
         *
         * @param targetTextureFrame - The first rectangle
         * @param destinationFrame - The second rectangle
         * @return - Returns itself.
         */
        QuadUv.prototype.map = function (targetTextureFrame, destinationFrame) {
            var x = 0; // destinationFrame.x / targetTextureFrame.width;
            var y = 0; // destinationFrame.y / targetTextureFrame.height;
            this.uvs[0] = x;
            this.uvs[1] = y;
            this.uvs[2] = x + (destinationFrame.width / targetTextureFrame.width);
            this.uvs[3] = y;
            this.uvs[4] = x + (destinationFrame.width / targetTextureFrame.width);
            this.uvs[5] = y + (destinationFrame.height / targetTextureFrame.height);
            this.uvs[6] = x;
            this.uvs[7] = y + (destinationFrame.height / targetTextureFrame.height);
            x = destinationFrame.x;
            y = destinationFrame.y;
            this.vertices[0] = x;
            this.vertices[1] = y;
            this.vertices[2] = x + destinationFrame.width;
            this.vertices[3] = y;
            this.vertices[4] = x + destinationFrame.width;
            this.vertices[5] = y + destinationFrame.height;
            this.vertices[6] = x;
            this.vertices[7] = y + destinationFrame.height;
            this.invalidate();
            return this;
        };
        /**
         * Legacy upload method, just marks buffers dirty.
         *
         * @returns - Returns itself.
         */
        QuadUv.prototype.invalidate = function () {
            this.vertexBuffer._updateID++;
            this.uvBuffer._updateID++;
            return this;
        };
        return QuadUv;
    }(Geometry));
  
    var UID$2 = 0;
    /**
     * Uniform group holds uniform map and some ID's for work
     *
     * `UniformGroup` has two modes:
     *
     * 1: Normal mode
     * Normal mode will upload the uniforms with individual function calls as required
     *
     * 2: Uniform buffer mode
     * This mode will treat the uniforms as a uniform buffer. You can pass in either a buffer that you manually handle, or
     * or a generic object that PixiJS will automatically map to a buffer for you.
     * For maximum benefits, make Ubo UniformGroups static, and only update them each frame.
     *
     * Rules of UBOs:
     * - UBOs only work with WebGL2, so make sure you have a fallback!
     * - Only floats are supported (including vec[2,3,4], mat[2,3,4])
     * - Samplers cannot be used in ubo's (a GPU limitation)
     * - You must ensure that the object you pass in exactly matches in the shader ubo structure.
     * Otherwise, weirdness will ensue!
     * - The name of the ubo object added to the group must match exactly the name of the ubo in the shader.
     *
     * ```
     * // ubo in shader:
     * uniform myCoolData { // declaring a ubo..
     * mat4 uCoolMatrix;
     * float uFloatyMcFloatFace
     *
     *
     * // a new uniform buffer object..
     * const myCoolData = new UniformBufferGroup({
     *   uCoolMatrix: new Matrix(),
     *   uFloatyMcFloatFace: 23,
     * }}
     *
     * // build a shader...
     * const shader = Shader.from(srcVert, srcFrag, {
     *   myCoolData // name matches the ubo name in the shader. will be processed accordingly.
     * })
     *
     *  ```
     *
     * @memberof PIXI
     */
    var UniformGroup = /** @class */ (function () {
        /**
         * @param {object | Buffer} [uniforms] - Custom uniforms to use to augment the built-in ones. Or a pixi buffer.
         * @param isStatic - Uniforms wont be changed after creation.
         * @param isUbo - If true, will treat this uniform group as a uniform buffer object.
         */
        function UniformGroup(uniforms, isStatic, isUbo) {
            this.group = true;
            // lets generate this when the shader ?
            this.syncUniforms = {};
            this.dirtyId = 0;
            this.id = UID$2++;
            this.static = !!isStatic;
            this.ubo = !!isUbo;
            if (uniforms instanceof Buffer) {
                this.buffer = uniforms;
                this.buffer.type = exports.BUFFER_TYPE.UNIFORM_BUFFER;
                this.autoManage = false;
                this.ubo = true;
            }
            else {
                this.uniforms = uniforms;
                if (this.ubo) {
                    this.buffer = new Buffer(new Float32Array(1));
                    this.buffer.type = exports.BUFFER_TYPE.UNIFORM_BUFFER;
                    this.autoManage = true;
                }
            }
        }
        UniformGroup.prototype.update = function () {
            this.dirtyId++;
            if (!this.autoManage && this.buffer) {
                this.buffer.update();
            }
        };
        UniformGroup.prototype.add = function (name, uniforms, _static) {
            if (!this.ubo) {
                this.uniforms[name] = new UniformGroup(uniforms, _static);
            }
            else {
                // eslint-disable-next-line max-len
                throw new Error('[UniformGroup] uniform groups in ubo mode cannot be modified, or have uniform groups nested in them');
            }
        };
        UniformGroup.from = function (uniforms, _static, _ubo) {
            return new UniformGroup(uniforms, _static, _ubo);
        };
        /**
         * A short hand function for creating a static UBO UniformGroup.
         *
         * @param uniforms - the ubo item
         * @param _static - should this be updated each time it is used? defaults to true here!
         */
        UniformGroup.uboFrom = function (uniforms, _static) {
            return new UniformGroup(uniforms, _static !== null && _static !== void 0 ? _static : true, true);
        };
        return UniformGroup;
    }());
  
    /**
     * System plugin to the renderer to manage filter states.
     *
     * @ignore
     */
    var FilterState = /** @class */ (function () {
        function FilterState() {
            this.renderTexture = null;
            this.target = null;
            this.legacy = false;
            this.resolution = 1;
            this.multisample = exports.MSAA_QUALITY.NONE;
            // next three fields are created only for root
            // re-assigned for everything else
            this.sourceFrame = new Rectangle();
            this.destinationFrame = new Rectangle();
            this.bindingSourceFrame = new Rectangle();
            this.bindingDestinationFrame = new Rectangle();
            this.filters = [];
            this.transform = null;
        }
        /** Clears the state */
        FilterState.prototype.clear = function () {
            this.target = null;
            this.filters = null;
            this.renderTexture = null;
        };
        return FilterState;
    }());
  
    var tempPoints$1 = [new Point(), new Point(), new Point(), new Point()];
    var tempMatrix = new Matrix();
    /**
     * System plugin to the renderer to manage filters.
     *
     * ## Pipeline
     *
     * The FilterSystem executes the filtering pipeline by rendering the display-object into a texture, applying its
     * [filters]{@link PIXI.Filter} in series, and the last filter outputs into the final render-target.
     *
     * The filter-frame is the rectangle in world space being filtered, and those contents are mapped into
     * `(0, 0, filterFrame.width, filterFrame.height)` into the filter render-texture. The filter-frame is also called
     * the source-frame, as it is used to bind the filter render-textures. The last filter outputs to the `filterFrame`
     * in the final render-target.
     *
     * ## Usage
     *
     * {@link PIXI.Container#renderAdvanced} is an example of how to use the filter system. It is a 3 step process:
     *
     * * **push**: Use {@link PIXI.FilterSystem#push} to push the set of filters to be applied on a filter-target.
     * * **render**: Render the contents to be filtered using the renderer. The filter-system will only capture the contents
     *      inside the bounds of the filter-target. NOTE: Using {@link PIXI.Renderer#render} is
     *      illegal during an existing render cycle, and it may reset the filter system.
     * * **pop**: Use {@link PIXI.FilterSystem#pop} to pop & execute the filters you initially pushed. It will apply them
     *      serially and output to the bounds of the filter-target.
     *
     * @memberof PIXI
     */
    var FilterSystem = /** @class */ (function () {
        /**
         * @param renderer - The renderer this System works for.
         */
        function FilterSystem(renderer) {
            this.renderer = renderer;
            this.defaultFilterStack = [{}];
            this.texturePool = new RenderTexturePool();
            this.texturePool.setScreenSize(renderer.view);
            this.statePool = [];
            this.quad = new Quad();
            this.quadUv = new QuadUv();
            this.tempRect = new Rectangle();
            this.activeState = {};
            this.globalUniforms = new UniformGroup({
                outputFrame: new Rectangle(),
                inputSize: new Float32Array(4),
                inputPixel: new Float32Array(4),
                inputClamp: new Float32Array(4),
                resolution: 1,
                // legacy variables
                filterArea: new Float32Array(4),
                filterClamp: new Float32Array(4),
            }, true);
            this.forceClear = false;
            this.useMaxPadding = false;
        }
        /**
         * Pushes a set of filters to be applied later to the system. This will redirect further rendering into an
         * input render-texture for the rest of the filtering pipeline.
         *
         * @param {PIXI.DisplayObject} target - The target of the filter to render.
         * @param filters - The filters to apply.
         */
        FilterSystem.prototype.push = function (target, filters) {
            var _a, _b;
            var renderer = this.renderer;
            var filterStack = this.defaultFilterStack;
            var state = this.statePool.pop() || new FilterState();
            var renderTextureSystem = this.renderer.renderTexture;
            var resolution = filters[0].resolution;
            var multisample = filters[0].multisample;
            var padding = filters[0].padding;
            var autoFit = filters[0].autoFit;
            // We don't know whether it's a legacy filter until it was bound for the first time,
            // therefore we have to assume that it is if legacy is undefined.
            var legacy = (_a = filters[0].legacy) !== null && _a !== void 0 ? _a : true;
            for (var i = 1; i < filters.length; i++) {
                var filter = filters[i];
                // let's use the lowest resolution
                resolution = Math.min(resolution, filter.resolution);
                // let's use the lowest number of samples
                multisample = Math.min(multisample, filter.multisample);
                // figure out the padding required for filters
                padding = this.useMaxPadding
                    // old behavior: use largest amount of padding!
                    ? Math.max(padding, filter.padding)
                    // new behavior: sum the padding
                    : padding + filter.padding;
                // only auto fit if all filters are autofit
                autoFit = autoFit && filter.autoFit;
                legacy = legacy || ((_b = filter.legacy) !== null && _b !== void 0 ? _b : true);
            }
            if (filterStack.length === 1) {
                this.defaultFilterStack[0].renderTexture = renderTextureSystem.current;
            }
            filterStack.push(state);
            state.resolution = resolution;
            state.multisample = multisample;
            state.legacy = legacy;
            state.target = target;
            state.sourceFrame.copyFrom(target.filterArea || target.getBounds(true));
            state.sourceFrame.pad(padding);
            if (autoFit) {
                var sourceFrameProjected = this.tempRect.copyFrom(renderTextureSystem.sourceFrame);
                // Project source frame into world space (if projection is applied)
                if (renderer.projection.transform) {
                    this.transformAABB(tempMatrix.copyFrom(renderer.projection.transform).invert(), sourceFrameProjected);
                }
                state.sourceFrame.fit(sourceFrameProjected);
            }
            // Round sourceFrame in screen space based on render-texture.
            this.roundFrame(state.sourceFrame, renderTextureSystem.current ? renderTextureSystem.current.resolution : renderer.resolution, renderTextureSystem.sourceFrame, renderTextureSystem.destinationFrame, renderer.projection.transform);
            state.renderTexture = this.getOptimalFilterTexture(state.sourceFrame.width, state.sourceFrame.height, resolution, multisample);
            state.filters = filters;
            state.destinationFrame.width = state.renderTexture.width;
            state.destinationFrame.height = state.renderTexture.height;
            var destinationFrame = this.tempRect;
            destinationFrame.x = 0;
            destinationFrame.y = 0;
            destinationFrame.width = state.sourceFrame.width;
            destinationFrame.height = state.sourceFrame.height;
            state.renderTexture.filterFrame = state.sourceFrame;
            state.bindingSourceFrame.copyFrom(renderTextureSystem.sourceFrame);
            state.bindingDestinationFrame.copyFrom(renderTextureSystem.destinationFrame);
            state.transform = renderer.projection.transform;
            renderer.projection.transform = null;
            renderTextureSystem.bind(state.renderTexture, state.sourceFrame, destinationFrame);
            renderer.framebuffer.clear(0, 0, 0, 0);
        };
        /** Pops off the filter and applies it. */
        FilterSystem.prototype.pop = function () {
            var filterStack = this.defaultFilterStack;
            var state = filterStack.pop();
            var filters = state.filters;
            this.activeState = state;
            var globalUniforms = this.globalUniforms.uniforms;
            globalUniforms.outputFrame = state.sourceFrame;
            globalUniforms.resolution = state.resolution;
            var inputSize = globalUniforms.inputSize;
            var inputPixel = globalUniforms.inputPixel;
            var inputClamp = globalUniforms.inputClamp;
            inputSize[0] = state.destinationFrame.width;
            inputSize[1] = state.destinationFrame.height;
            inputSize[2] = 1.0 / inputSize[0];
            inputSize[3] = 1.0 / inputSize[1];
            inputPixel[0] = Math.round(inputSize[0] * state.resolution);
            inputPixel[1] = Math.round(inputSize[1] * state.resolution);
            inputPixel[2] = 1.0 / inputPixel[0];
            inputPixel[3] = 1.0 / inputPixel[1];
            inputClamp[0] = 0.5 * inputPixel[2];
            inputClamp[1] = 0.5 * inputPixel[3];
            inputClamp[2] = (state.sourceFrame.width * inputSize[2]) - (0.5 * inputPixel[2]);
            inputClamp[3] = (state.sourceFrame.height * inputSize[3]) - (0.5 * inputPixel[3]);
            // only update the rect if its legacy..
            if (state.legacy) {
                var filterArea = globalUniforms.filterArea;
                filterArea[0] = state.destinationFrame.width;
                filterArea[1] = state.destinationFrame.height;
                filterArea[2] = state.sourceFrame.x;
                filterArea[3] = state.sourceFrame.y;
                globalUniforms.filterClamp = globalUniforms.inputClamp;
            }
            this.globalUniforms.update();
            var lastState = filterStack[filterStack.length - 1];
            this.renderer.framebuffer.blit();
            if (filters.length === 1) {
                filters[0].apply(this, state.renderTexture, lastState.renderTexture, exports.CLEAR_MODES.BLEND, state);
                this.returnFilterTexture(state.renderTexture);
            }
            else {
                var flip = state.renderTexture;
                var flop = this.getOptimalFilterTexture(flip.width, flip.height, state.resolution);
                flop.filterFrame = flip.filterFrame;
                var i = 0;
                for (i = 0; i < filters.length - 1; ++i) {
                    if (i === 1 && state.multisample > 1) {
                        flop = this.getOptimalFilterTexture(flip.width, flip.height, state.resolution);
                        flop.filterFrame = flip.filterFrame;
                    }
                    filters[i].apply(this, flip, flop, exports.CLEAR_MODES.CLEAR, state);
                    var t = flip;
                    flip = flop;
                    flop = t;
                }
                filters[i].apply(this, flip, lastState.renderTexture, exports.CLEAR_MODES.BLEND, state);
                if (i > 1 && state.multisample > 1) {
                    this.returnFilterTexture(state.renderTexture);
                }
                this.returnFilterTexture(flip);
                this.returnFilterTexture(flop);
            }
            // lastState.renderTexture is blitted when lastState is popped
            state.clear();
            this.statePool.push(state);
        };
        /**
         * Binds a renderTexture with corresponding `filterFrame`, clears it if mode corresponds.
         *
         * @param filterTexture - renderTexture to bind, should belong to filter pool or filter stack
         * @param clearMode - clearMode, by default its CLEAR/YES. See {@link PIXI.CLEAR_MODES}
         */
        FilterSystem.prototype.bindAndClear = function (filterTexture, clearMode) {
            if (clearMode === void 0) { clearMode = exports.CLEAR_MODES.CLEAR; }
            var _a = this.renderer, renderTextureSystem = _a.renderTexture, stateSystem = _a.state;
            if (filterTexture === this.defaultFilterStack[this.defaultFilterStack.length - 1].renderTexture) {
                // Restore projection transform if rendering into the output render-target.
                this.renderer.projection.transform = this.activeState.transform;
            }
            else {
                // Prevent projection within filtering pipeline.
                this.renderer.projection.transform = null;
            }
            if (filterTexture && filterTexture.filterFrame) {
                var destinationFrame = this.tempRect;
                destinationFrame.x = 0;
                destinationFrame.y = 0;
                destinationFrame.width = filterTexture.filterFrame.width;
                destinationFrame.height = filterTexture.filterFrame.height;
                renderTextureSystem.bind(filterTexture, filterTexture.filterFrame, destinationFrame);
            }
            else if (filterTexture !== this.defaultFilterStack[this.defaultFilterStack.length - 1].renderTexture) {
                renderTextureSystem.bind(filterTexture);
            }
            else {
                // Restore binding for output render-target.
                this.renderer.renderTexture.bind(filterTexture, this.activeState.bindingSourceFrame, this.activeState.bindingDestinationFrame);
            }
            // Clear the texture in BLIT mode if blending is disabled or the forceClear flag is set. The blending
            // is stored in the 0th bit of the state.
            var autoClear = (stateSystem.stateId & 1) || this.forceClear;
            if (clearMode === exports.CLEAR_MODES.CLEAR
                || (clearMode === exports.CLEAR_MODES.BLIT && autoClear)) {
                // Use framebuffer.clear because we want to clear the whole filter texture, not just the filtering
                // area over which the shaders are run. This is because filters may sampling outside of it (e.g. blur)
                // instead of clamping their arithmetic.
                this.renderer.framebuffer.clear(0, 0, 0, 0);
            }
        };
        /**
         * Draws a filter using the default rendering process.
         *
         * This should be called only by {@link Filter#apply}.
         *
         * @param filter - The filter to draw.
         * @param input - The input render target.
         * @param output - The target to output to.
         * @param clearMode - Should the output be cleared before rendering to it
         */
        FilterSystem.prototype.applyFilter = function (filter, input, output, clearMode) {
            var renderer = this.renderer;
            // Set state before binding, so bindAndClear gets the blend mode.
            renderer.state.set(filter.state);
            this.bindAndClear(output, clearMode);
            // set the uniforms..
            filter.uniforms.uSampler = input;
            filter.uniforms.filterGlobals = this.globalUniforms;
            // TODO make it so that the order of this does not matter..
            // because it does at the moment cos of global uniforms.
            // they need to get resynced
            renderer.shader.bind(filter);
            // check to see if the filter is a legacy one..
            filter.legacy = !!filter.program.attributeData.aTextureCoord;
            if (filter.legacy) {
                this.quadUv.map(input._frame, input.filterFrame);
                renderer.geometry.bind(this.quadUv);
                renderer.geometry.draw(exports.DRAW_MODES.TRIANGLES);
            }
            else {
                renderer.geometry.bind(this.quad);
                renderer.geometry.draw(exports.DRAW_MODES.TRIANGLE_STRIP);
            }
        };
        /**
         * Multiply _input normalized coordinates_ to this matrix to get _sprite texture normalized coordinates_.
         *
         * Use `outputMatrix * vTextureCoord` in the shader.
         *
         * @param outputMatrix - The matrix to output to.
         * @param {PIXI.Sprite} sprite - The sprite to map to.
         * @return The mapped matrix.
         */
        FilterSystem.prototype.calculateSpriteMatrix = function (outputMatrix, sprite) {
            var _a = this.activeState, sourceFrame = _a.sourceFrame, destinationFrame = _a.destinationFrame;
            var orig = sprite._texture.orig;
            var mappedMatrix = outputMatrix.set(destinationFrame.width, 0, 0, destinationFrame.height, sourceFrame.x, sourceFrame.y);
            var worldTransform = sprite.worldTransform.copyTo(Matrix.TEMP_MATRIX);
            worldTransform.invert();
            mappedMatrix.prepend(worldTransform);
            mappedMatrix.scale(1.0 / orig.width, 1.0 / orig.height);
            mappedMatrix.translate(sprite.anchor.x, sprite.anchor.y);
            return mappedMatrix;
        };
        /** Destroys this Filter System. */
        FilterSystem.prototype.destroy = function () {
            this.renderer = null;
            // Those textures has to be destroyed by RenderTextureSystem or FramebufferSystem
            this.texturePool.clear(false);
        };
        /**
         * Gets a Power-of-Two render texture or fullScreen texture
         *
         * @param minWidth - The minimum width of the render texture in real pixels.
         * @param minHeight - The minimum height of the render texture in real pixels.
         * @param resolution - The resolution of the render texture.
         * @param multisample - Number of samples of the render texture.
         * @return - The new render texture.
         */
        FilterSystem.prototype.getOptimalFilterTexture = function (minWidth, minHeight, resolution, multisample) {
            if (resolution === void 0) { resolution = 1; }
            if (multisample === void 0) { multisample = exports.MSAA_QUALITY.NONE; }
            return this.texturePool.getOptimalTexture(minWidth, minHeight, resolution, multisample);
        };
        /**
         * Gets extra render texture to use inside current filter
         * To be compliant with older filters, you can use params in any order
         *
         * @param input - renderTexture from which size and resolution will be copied
         * @param resolution - override resolution of the renderTexture
         * @param multisample - number of samples of the renderTexture
         */
        FilterSystem.prototype.getFilterTexture = function (input, resolution, multisample) {
            if (typeof input === 'number') {
                var swap = input;
                input = resolution;
                resolution = swap;
            }
            input = input || this.activeState.renderTexture;
            var filterTexture = this.texturePool.getOptimalTexture(input.width, input.height, resolution || input.resolution, multisample || exports.MSAA_QUALITY.NONE);
            filterTexture.filterFrame = input.filterFrame;
            return filterTexture;
        };
        /**
         * Frees a render texture back into the pool.
         *
         * @param renderTexture - The renderTarget to free
         */
        FilterSystem.prototype.returnFilterTexture = function (renderTexture) {
            this.texturePool.returnTexture(renderTexture);
        };
        /** Empties the texture pool. */
        FilterSystem.prototype.emptyPool = function () {
            this.texturePool.clear(true);
        };
        /** Calls `texturePool.resize()`, affects fullScreen renderTextures. */
        FilterSystem.prototype.resize = function () {
            this.texturePool.setScreenSize(this.renderer.view);
        };
        /**
         * @param matrix - first param
         * @param rect - second param
         */
        FilterSystem.prototype.transformAABB = function (matrix, rect) {
            var lt = tempPoints$1[0];
            var lb = tempPoints$1[1];
            var rt = tempPoints$1[2];
            var rb = tempPoints$1[3];
            lt.set(rect.left, rect.top);
            lb.set(rect.left, rect.bottom);
            rt.set(rect.right, rect.top);
            rb.set(rect.right, rect.bottom);
            matrix.apply(lt, lt);
            matrix.apply(lb, lb);
            matrix.apply(rt, rt);
            matrix.apply(rb, rb);
            var x0 = Math.min(lt.x, lb.x, rt.x, rb.x);
            var y0 = Math.min(lt.y, lb.y, rt.y, rb.y);
            var x1 = Math.max(lt.x, lb.x, rt.x, rb.x);
            var y1 = Math.max(lt.y, lb.y, rt.y, rb.y);
            rect.x = x0;
            rect.y = y0;
            rect.width = x1 - x0;
            rect.height = y1 - y0;
        };
        FilterSystem.prototype.roundFrame = function (frame, resolution, bindingSourceFrame, bindingDestinationFrame, transform) {
            if (frame.width <= 0 || frame.height <= 0 || bindingSourceFrame.width <= 0 || bindingSourceFrame.height <= 0) {
                return;
            }
            if (transform) {
                var a = transform.a, b = transform.b, c = transform.c, d = transform.d;
                // Skip if skew/rotation present in matrix, except for multiple of 90Â° rotation. If rotation
                // is a multiple of 90Â°, then either pair of (b,c) or (a,d) will be (0,0).
                if ((Math.abs(b) > 1e-4 || Math.abs(c) > 1e-4)
                    && (Math.abs(a) > 1e-4 || Math.abs(d) > 1e-4)) {
                    return;
                }
            }
            transform = transform ? tempMatrix.copyFrom(transform) : tempMatrix.identity();
            // Get forward transform from world space to screen space
            transform
                .translate(-bindingSourceFrame.x, -bindingSourceFrame.y)
                .scale(bindingDestinationFrame.width / bindingSourceFrame.width, bindingDestinationFrame.height / bindingSourceFrame.height)
                .translate(bindingDestinationFrame.x, bindingDestinationFrame.y);
            // Convert frame to screen space
            this.transformAABB(transform, frame);
            // Round frame in screen space
            frame.ceil(resolution);
            // Project back into world space.
            this.transformAABB(transform.invert(), frame);
        };
        return FilterSystem;
    }());
  
    /**
     * Base for a common object renderer that can be used as a
     * system renderer plugin.
     *
     * @memberof PIXI
     */
    var ObjectRenderer = /** @class */ (function () {
        /**
         * @param renderer - The renderer this manager works for.
         */
        function ObjectRenderer(renderer) {
            this.renderer = renderer;
        }
        /**
         * Stub method that should be used to empty the current
         * batch by rendering objects now.
         */
        ObjectRenderer.prototype.flush = function () {
            // flush!
        };
        /**
         * Generic destruction method that frees all resources. This
         * should be called by subclasses.
         */
        ObjectRenderer.prototype.destroy = function () {
            this.renderer = null;
        };
        /**
         * Stub method that initializes any state required before
         * rendering starts. It is different from the `prerender`
         * signal, which occurs every frame, in that it is called
         * whenever an object requests _this_ renderer specifically.
         */
        ObjectRenderer.prototype.start = function () {
            // set the shader..
        };
        /**
         * Stops the renderer. It should free up any state and
         * become dormant.
         */
        ObjectRenderer.prototype.stop = function () {
            this.flush();
        };
        /**
         * Keeps the object to render. It doesn't have to be
         * rendered immediately.
         *
         * @param {PIXI.DisplayObject} object - The object to render.
         */
        ObjectRenderer.prototype.render = function (_object) {
            // render the object
        };
        return ObjectRenderer;
    }());
  
    /**
     * System plugin to the renderer to manage batching.
     *
     * @memberof PIXI
     */
    var BatchSystem = /** @class */ (function () {
        /**
         * @param renderer - The renderer this System works for.
         */
        function BatchSystem(renderer) {
            this.renderer = renderer;
            this.emptyRenderer = new ObjectRenderer(renderer);
            this.currentRenderer = this.emptyRenderer;
        }
        /**
         * Changes the current renderer to the one given in parameter
         *
         * @param objectRenderer - The object renderer to use.
         */
        BatchSystem.prototype.setObjectRenderer = function (objectRenderer) {
            if (this.currentRenderer === objectRenderer) {
                return;
            }
            this.currentRenderer.stop();
            this.currentRenderer = objectRenderer;
            this.currentRenderer.start();
        };
        /**
         * This should be called if you wish to do some custom rendering
         * It will basically render anything that may be batched up such as sprites
         */
        BatchSystem.prototype.flush = function () {
            this.setObjectRenderer(this.emptyRenderer);
        };
        /**
         * Reset the system to an empty renderer
         */
        BatchSystem.prototype.reset = function () {
            this.setObjectRenderer(this.emptyRenderer);
        };
        /**
         * Handy function for batch renderers: copies bound textures in first maxTextures locations to array
         * sets actual _batchLocation for them
         *
         * @param arr - arr copy destination
         * @param maxTextures - number of copied elements
         */
        BatchSystem.prototype.copyBoundTextures = function (arr, maxTextures) {
            var boundTextures = this.renderer.texture.boundTextures;
            for (var i = maxTextures - 1; i >= 0; --i) {
                arr[i] = boundTextures[i] || null;
                if (arr[i]) {
                    arr[i]._batchLocation = i;
                }
            }
        };
        /**
         * Assigns batch locations to textures in array based on boundTextures state.
         * All textures in texArray should have `_batchEnabled = _batchId`,
         * and their count should be less than `maxTextures`.
         *
         * @param texArray - textures to bound
         * @param boundTextures - current state of bound textures
         * @param batchId - marker for _batchEnabled param of textures in texArray
         * @param maxTextures - number of texture locations to manipulate
         */
        BatchSystem.prototype.boundArray = function (texArray, boundTextures, batchId, maxTextures) {
            var elements = texArray.elements, ids = texArray.ids, count = texArray.count;
            var j = 0;
            for (var i = 0; i < count; i++) {
                var tex = elements[i];
                var loc = tex._batchLocation;
                if (loc >= 0 && loc < maxTextures
                    && boundTextures[loc] === tex) {
                    ids[i] = loc;
                    continue;
                }
                while (j < maxTextures) {
                    var bound = boundTextures[j];
                    if (bound && bound._batchEnabled === batchId
                        && bound._batchLocation === j) {
                        j++;
                        continue;
                    }
                    ids[i] = j;
                    tex._batchLocation = j;
                    boundTextures[j] = tex;
                    break;
                }
            }
        };
        /**
         * @ignore
         */
        BatchSystem.prototype.destroy = function () {
            this.renderer = null;
        };
        return BatchSystem;
    }());
  
    var CONTEXT_UID_COUNTER = 0;
    /**
     * System plugin to the renderer to manage the context.
     *
     * @memberof PIXI
     */
    var ContextSystem = /** @class */ (function () {
        /** @param renderer - The renderer this System works for. */
        function ContextSystem(renderer) {
            this.renderer = renderer;
            this.webGLVersion = 1;
            this.extensions = {};
            this.supports = {
                uint32Indices: false,
            };
            // Bind functions
            this.handleContextLost = this.handleContextLost.bind(this);
            this.handleContextRestored = this.handleContextRestored.bind(this);
            renderer.view.addEventListener('webglcontextlost', this.handleContextLost, false);
            renderer.view.addEventListener('webglcontextrestored', this.handleContextRestored, false);
        }
        Object.defineProperty(ContextSystem.prototype, "isLost", {
            /**
             * `true` if the context is lost
             *
             * @readonly
             */
            get: function () {
                return (!this.gl || this.gl.isContextLost());
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Handles the context change event.
         *
         * @param {WebGLRenderingContext} gl - New WebGL context.
         */
        ContextSystem.prototype.contextChange = function (gl) {
            this.gl = gl;
            this.renderer.gl = gl;
            this.renderer.CONTEXT_UID = CONTEXT_UID_COUNTER++;
            // restore a context if it was previously lost
            if (gl.isContextLost() && gl.getExtension('WEBGL_lose_context')) {
                gl.getExtension('WEBGL_lose_context').restoreContext();
            }
        };
        /**
         * Initializes the context.
         *
         * @protected
         * @param {WebGLRenderingContext} gl - WebGL context
         */
        ContextSystem.prototype.initFromContext = function (gl) {
            this.gl = gl;
            this.validateContext(gl);
            this.renderer.gl = gl;
            this.renderer.CONTEXT_UID = CONTEXT_UID_COUNTER++;
            this.renderer.runners.contextChange.emit(gl);
        };
        /**
         * Initialize from context options
         *
         * @protected
         * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
         * @param {object} options - context attributes
         */
        ContextSystem.prototype.initFromOptions = function (options) {
            var gl = this.createContext(this.renderer.view, options);
            this.initFromContext(gl);
        };
        /**
         * Helper class to create a WebGL Context
         *
         * @param canvas - the canvas element that we will get the context from
         * @param options - An options object that gets passed in to the canvas element containing the
         *    context attributes
         * @see https://developer.mozilla.org/en/docs/Web/API/HTMLCanvasElement/getContext
         * @return {WebGLRenderingContext} the WebGL context
         */
        ContextSystem.prototype.createContext = function (canvas, options) {
            var gl;
            if (settings.PREFER_ENV >= exports.ENV.WEBGL2) {
                gl = canvas.getContext('webgl2', options);
            }
            if (gl) {
                this.webGLVersion = 2;
            }
            else {
                this.webGLVersion = 1;
                gl = canvas.getContext('webgl', options)
                    || canvas.getContext('experimental-webgl', options);
                if (!gl) {
                    // fail, not able to get a context
                    throw new Error('This browser does not support WebGL. Try using the canvas renderer');
                }
            }
            this.gl = gl;
            this.getExtensions();
            return this.gl;
        };
        /** Auto-populate the {@link PIXI.ContextSystem.extensions extensions}. */
        ContextSystem.prototype.getExtensions = function () {
            // time to set up default extensions that Pixi uses.
            var gl = this.gl;
            var common = {
                anisotropicFiltering: gl.getExtension('EXT_texture_filter_anisotropic'),
                floatTextureLinear: gl.getExtension('OES_texture_float_linear'),
                s3tc: gl.getExtension('WEBGL_compressed_texture_s3tc'),
                s3tc_sRGB: gl.getExtension('WEBGL_compressed_texture_s3tc_srgb'),
                etc: gl.getExtension('WEBGL_compressed_texture_etc'),
                etc1: gl.getExtension('WEBGL_compressed_texture_etc1'),
                pvrtc: gl.getExtension('WEBGL_compressed_texture_pvrtc')
                    || gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc'),
                atc: gl.getExtension('WEBGL_compressed_texture_atc'),
                astc: gl.getExtension('WEBGL_compressed_texture_astc')
            };
            if (this.webGLVersion === 1) {
                Object.assign(this.extensions, common, {
                    drawBuffers: gl.getExtension('WEBGL_draw_buffers'),
                    depthTexture: gl.getExtension('WEBGL_depth_texture'),
                    loseContext: gl.getExtension('WEBGL_lose_context'),
                    vertexArrayObject: gl.getExtension('OES_vertex_array_object')
                        || gl.getExtension('MOZ_OES_vertex_array_object')
                        || gl.getExtension('WEBKIT_OES_vertex_array_object'),
                    uint32ElementIndex: gl.getExtension('OES_element_index_uint'),
                    // Floats and half-floats
                    floatTexture: gl.getExtension('OES_texture_float'),
                    floatTextureLinear: gl.getExtension('OES_texture_float_linear'),
                    textureHalfFloat: gl.getExtension('OES_texture_half_float'),
                    textureHalfFloatLinear: gl.getExtension('OES_texture_half_float_linear'),
                });
            }
            else if (this.webGLVersion === 2) {
                Object.assign(this.extensions, common, {
                    // Floats and half-floats
                    colorBufferFloat: gl.getExtension('EXT_color_buffer_float')
                });
            }
        };
        /**
         * Handles a lost webgl context
         *
         * @param {WebGLContextEvent} event - The context lost event.
         */
        ContextSystem.prototype.handleContextLost = function (event) {
            event.preventDefault();
        };
        /** Handles a restored webgl context. */
        ContextSystem.prototype.handleContextRestored = function () {
            this.renderer.runners.contextChange.emit(this.gl);
        };
        ContextSystem.prototype.destroy = function () {
            var view = this.renderer.view;
            this.renderer = null;
            // remove listeners
            view.removeEventListener('webglcontextlost', this.handleContextLost);
            view.removeEventListener('webglcontextrestored', this.handleContextRestored);
            this.gl.useProgram(null);
            if (this.extensions.loseContext) {
                this.extensions.loseContext.loseContext();
            }
        };
        /** Handle the post-render runner event. */
        ContextSystem.prototype.postrender = function () {
            if (this.renderer.renderingToScreen) {
                this.gl.flush();
            }
        };
        /**
         * Validate context.
         *
         * @param {WebGLRenderingContext} gl - Render context.
         */
        ContextSystem.prototype.validateContext = function (gl) {
            var attributes = gl.getContextAttributes();
            var isWebGl2 = 'WebGL2RenderingContext' in globalThis && gl instanceof globalThis.WebGL2RenderingContext;
            if (isWebGl2) {
                this.webGLVersion = 2;
            }
            // this is going to be fairly simple for now.. but at least we have room to grow!
            if (!attributes.stencil) {
                /* eslint-disable max-len, no-console */
                console.warn('Provided WebGL context does not have a stencil buffer, masks may not render correctly');
                /* eslint-enable max-len, no-console */
            }
            var hasuint32 = isWebGl2 || !!gl.getExtension('OES_element_index_uint');
            this.supports.uint32Indices = hasuint32;
            if (!hasuint32) {
                /* eslint-disable max-len, no-console */
                console.warn('Provided WebGL context does not support 32 index buffer, complex graphics may not render correctly');
                /* eslint-enable max-len, no-console */
            }
        };
        return ContextSystem;
    }());
  
    /**
     * Internal framebuffer for WebGL context.
     *
     * @memberof PIXI
     */
    var GLFramebuffer = /** @class */ (function () {
        function GLFramebuffer(framebuffer) {
            this.framebuffer = framebuffer;
            this.stencil = null;
            this.dirtyId = -1;
            this.dirtyFormat = -1;
            this.dirtySize = -1;
            this.multisample = exports.MSAA_QUALITY.NONE;
            this.msaaBuffer = null;
            this.blitFramebuffer = null;
            this.mipLevel = 0;
        }
        return GLFramebuffer;
    }());
  
    var tempRectangle = new Rectangle();
    /**
     * System plugin to the renderer to manage framebuffers.
     *
     * @memberof PIXI
     */
    var FramebufferSystem = /** @class */ (function () {
        /**
         * @param renderer - The renderer this System works for.
         */
        function FramebufferSystem(renderer) {
            this.renderer = renderer;
            this.managedFramebuffers = [];
            this.unknownFramebuffer = new Framebuffer(10, 10);
            this.msaaSamples = null;
        }
        /** Sets up the renderer context and necessary buffers. */
        FramebufferSystem.prototype.contextChange = function () {
            var gl = this.gl = this.renderer.gl;
            this.CONTEXT_UID = this.renderer.CONTEXT_UID;
            this.current = this.unknownFramebuffer;
            this.viewport = new Rectangle();
            this.hasMRT = true;
            this.writeDepthTexture = true;
            this.disposeAll(true);
            // webgl2
            if (this.renderer.context.webGLVersion === 1) {
                // webgl 1!
                var nativeDrawBuffersExtension_1 = this.renderer.context.extensions.drawBuffers;
                var nativeDepthTextureExtension = this.renderer.context.extensions.depthTexture;
                if (settings.PREFER_ENV === exports.ENV.WEBGL_LEGACY) {
                    nativeDrawBuffersExtension_1 = null;
                    nativeDepthTextureExtension = null;
                }
                if (nativeDrawBuffersExtension_1) {
                    gl.drawBuffers = function (activeTextures) {
                        return nativeDrawBuffersExtension_1.drawBuffersWEBGL(activeTextures);
                    };
                }
                else {
                    this.hasMRT = false;
                    gl.drawBuffers = function () {
                        // empty
                    };
                }
                if (!nativeDepthTextureExtension) {
                    this.writeDepthTexture = false;
                }
            }
            else {
                // WebGL2
                // cache possible MSAA samples
                this.msaaSamples = gl.getInternalformatParameter(gl.RENDERBUFFER, gl.RGBA8, gl.SAMPLES);
            }
        };
        /**
         * Bind a framebuffer.
         *
         * @param framebuffer
         * @param frame - frame, default is framebuffer size
         * @param mipLevel - optional mip level to set on the framebuffer - defaults to 0
         */
        FramebufferSystem.prototype.bind = function (framebuffer, frame, mipLevel) {
            if (mipLevel === void 0) { mipLevel = 0; }
            var gl = this.gl;
            if (framebuffer) {
                // TODO caching layer!
                var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID] || this.initFramebuffer(framebuffer);
                if (this.current !== framebuffer) {
                    this.current = framebuffer;
                    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
                }
                // make sure all textures are unbound..
                if (fbo.mipLevel !== mipLevel) {
                    framebuffer.dirtyId++;
                    framebuffer.dirtyFormat++;
                    fbo.mipLevel = mipLevel;
                }
                // now check for updates...
                if (fbo.dirtyId !== framebuffer.dirtyId) {
                    fbo.dirtyId = framebuffer.dirtyId;
                    if (fbo.dirtyFormat !== framebuffer.dirtyFormat) {
                        fbo.dirtyFormat = framebuffer.dirtyFormat;
                        fbo.dirtySize = framebuffer.dirtySize;
                        this.updateFramebuffer(framebuffer, mipLevel);
                    }
                    else if (fbo.dirtySize !== framebuffer.dirtySize) {
                        fbo.dirtySize = framebuffer.dirtySize;
                        this.resizeFramebuffer(framebuffer);
                    }
                }
                for (var i = 0; i < framebuffer.colorTextures.length; i++) {
                    var tex = framebuffer.colorTextures[i];
                    this.renderer.texture.unbind(tex.parentTextureArray || tex);
                }
                if (framebuffer.depthTexture) {
                    this.renderer.texture.unbind(framebuffer.depthTexture);
                }
                if (frame) {
                    var mipWidth = (frame.width >> mipLevel);
                    var mipHeight = (frame.height >> mipLevel);
                    var scale = mipWidth / frame.width;
                    this.setViewport(frame.x * scale, frame.y * scale, mipWidth, mipHeight);
                }
                else {
                    var mipWidth = (framebuffer.width >> mipLevel);
                    var mipHeight = (framebuffer.height >> mipLevel);
                    this.setViewport(0, 0, mipWidth, mipHeight);
                }
            }
            else {
                if (this.current) {
                    this.current = null;
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                }
                if (frame) {
                    this.setViewport(frame.x, frame.y, frame.width, frame.height);
                }
                else {
                    this.setViewport(0, 0, this.renderer.width, this.renderer.height);
                }
            }
        };
        /**
         * Set the WebGLRenderingContext's viewport.
         *
         * @param x - X position of viewport
         * @param y - Y position of viewport
         * @param width - Width of viewport
         * @param height - Height of viewport
         */
        FramebufferSystem.prototype.setViewport = function (x, y, width, height) {
            var v = this.viewport;
            x = Math.round(x);
            y = Math.round(y);
            width = Math.round(width);
            height = Math.round(height);
            if (v.width !== width || v.height !== height || v.x !== x || v.y !== y) {
                v.x = x;
                v.y = y;
                v.width = width;
                v.height = height;
                this.gl.viewport(x, y, width, height);
            }
        };
        Object.defineProperty(FramebufferSystem.prototype, "size", {
            /**
             * Get the size of the current width and height. Returns object with `width` and `height` values.
             *
             * @readonly
             */
            get: function () {
                if (this.current) {
                    // TODO store temp
                    return { x: 0, y: 0, width: this.current.width, height: this.current.height };
                }
                return { x: 0, y: 0, width: this.renderer.width, height: this.renderer.height };
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Clear the color of the context
         *
         * @param r - Red value from 0 to 1
         * @param g - Green value from 0 to 1
         * @param b - Blue value from 0 to 1
         * @param a - Alpha value from 0 to 1
         * @param {PIXI.BUFFER_BITS} [mask=BUFFER_BITS.COLOR | BUFFER_BITS.DEPTH] - Bitwise OR of masks
         *  that indicate the buffers to be cleared, by default COLOR and DEPTH buffers.
         */
        FramebufferSystem.prototype.clear = function (r, g, b, a, mask) {
            if (mask === void 0) { mask = exports.BUFFER_BITS.COLOR | exports.BUFFER_BITS.DEPTH; }
            var gl = this.gl;
            // TODO clear color can be set only one right?
            gl.clearColor(r, g, b, a);
            gl.clear(mask);
        };
        /**
         * Initialize framebuffer for this context
         *
         * @protected
         * @param framebuffer
         * @returns - created GLFramebuffer
         */
        FramebufferSystem.prototype.initFramebuffer = function (framebuffer) {
            var gl = this.gl;
            var fbo = new GLFramebuffer(gl.createFramebuffer());
            fbo.multisample = this.detectSamples(framebuffer.multisample);
            framebuffer.glFramebuffers[this.CONTEXT_UID] = fbo;
            this.managedFramebuffers.push(framebuffer);
            framebuffer.disposeRunner.add(this);
            return fbo;
        };
        /**
         * Resize the framebuffer
         *
         * @protected
         */
        FramebufferSystem.prototype.resizeFramebuffer = function (framebuffer) {
            var gl = this.gl;
            var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
            if (fbo.msaaBuffer) {
                gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.msaaBuffer);
                gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.RGBA8, framebuffer.width, framebuffer.height);
            }
            if (fbo.stencil) {
                gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil);
                if (fbo.msaaBuffer) {
                    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.DEPTH24_STENCIL8, framebuffer.width, framebuffer.height);
                }
                else {
                    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, framebuffer.width, framebuffer.height);
                }
            }
            var colorTextures = framebuffer.colorTextures;
            var count = colorTextures.length;
            if (!gl.drawBuffers) {
                count = Math.min(count, 1);
            }
            for (var i = 0; i < count; i++) {
                var texture = colorTextures[i];
                var parentTexture = texture.parentTextureArray || texture;
                this.renderer.texture.bind(parentTexture, 0);
            }
            if (framebuffer.depthTexture && this.writeDepthTexture) {
                this.renderer.texture.bind(framebuffer.depthTexture, 0);
            }
        };
        /**
         * Update the framebuffer
         *
         * @protected
         */
        FramebufferSystem.prototype.updateFramebuffer = function (framebuffer, mipLevel) {
            var gl = this.gl;
            var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
            // bind the color texture
            var colorTextures = framebuffer.colorTextures;
            var count = colorTextures.length;
            if (!gl.drawBuffers) {
                count = Math.min(count, 1);
            }
            if (fbo.multisample > 1 && this.canMultisampleFramebuffer(framebuffer)) {
                fbo.msaaBuffer = fbo.msaaBuffer || gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.msaaBuffer);
                gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.RGBA8, framebuffer.width, framebuffer.height);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, fbo.msaaBuffer);
            }
            else if (fbo.msaaBuffer) {
                gl.deleteRenderbuffer(fbo.msaaBuffer);
                fbo.msaaBuffer = null;
                if (fbo.blitFramebuffer) {
                    fbo.blitFramebuffer.dispose();
                    fbo.blitFramebuffer = null;
                }
            }
            var activeTextures = [];
            for (var i = 0; i < count; i++) {
                var texture = colorTextures[i];
                var parentTexture = texture.parentTextureArray || texture;
                this.renderer.texture.bind(parentTexture, 0);
                if (i === 0 && fbo.msaaBuffer) {
                    continue;
                }
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, texture.target, parentTexture._glTextures[this.CONTEXT_UID].texture, mipLevel);
                activeTextures.push(gl.COLOR_ATTACHMENT0 + i);
            }
            if (activeTextures.length > 1) {
                gl.drawBuffers(activeTextures);
            }
            if (framebuffer.depthTexture) {
                var writeDepthTexture = this.writeDepthTexture;
                if (writeDepthTexture) {
                    var depthTexture = framebuffer.depthTexture;
                    this.renderer.texture.bind(depthTexture, 0);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture._glTextures[this.CONTEXT_UID].texture, mipLevel);
                }
            }
            if ((framebuffer.stencil || framebuffer.depth) && !(framebuffer.depthTexture && this.writeDepthTexture)) {
                fbo.stencil = fbo.stencil || gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil);
                if (fbo.msaaBuffer) {
                    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.DEPTH24_STENCIL8, framebuffer.width, framebuffer.height);
                }
                else {
                    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, framebuffer.width, framebuffer.height);
                }
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, fbo.stencil);
            }
            else if (fbo.stencil) {
                gl.deleteRenderbuffer(fbo.stencil);
                fbo.stencil = null;
            }
        };
        /** Returns true if the frame buffer can be multisampled. */
        FramebufferSystem.prototype.canMultisampleFramebuffer = function (framebuffer) {
            return this.renderer.context.webGLVersion !== 1
                && framebuffer.colorTextures.length <= 1 && !framebuffer.depthTexture;
        };
        /**
         * Detects number of samples that is not more than a param but as close to it as possible
         *
         * @param samples - number of samples
         * @returns - recommended number of samples
         */
        FramebufferSystem.prototype.detectSamples = function (samples) {
            var msaaSamples = this.msaaSamples;
            var res = exports.MSAA_QUALITY.NONE;
            if (samples <= 1 || msaaSamples === null) {
                return res;
            }
            for (var i = 0; i < msaaSamples.length; i++) {
                if (msaaSamples[i] <= samples) {
                    res = msaaSamples[i];
                    break;
                }
            }
            if (res === 1) {
                res = exports.MSAA_QUALITY.NONE;
            }
            return res;
        };
        /**
         * Only works with WebGL2
         *
         * blits framebuffer to another of the same or bigger size
         * after that target framebuffer is bound
         *
         * Fails with WebGL warning if blits multisample framebuffer to different size
         *
         * @param framebuffer - by default it blits "into itself", from renderBuffer to texture.
         * @param sourcePixels - source rectangle in pixels
         * @param destPixels - dest rectangle in pixels, assumed to be the same as sourcePixels
         */
        FramebufferSystem.prototype.blit = function (framebuffer, sourcePixels, destPixels) {
            var _a = this, current = _a.current, renderer = _a.renderer, gl = _a.gl, CONTEXT_UID = _a.CONTEXT_UID;
            if (renderer.context.webGLVersion !== 2) {
                return;
            }
            if (!current) {
                return;
            }
            var fbo = current.glFramebuffers[CONTEXT_UID];
            if (!fbo) {
                return;
            }
            if (!framebuffer) {
                if (!fbo.msaaBuffer) {
                    return;
                }
                var colorTexture = current.colorTextures[0];
                if (!colorTexture) {
                    return;
                }
                if (!fbo.blitFramebuffer) {
                    fbo.blitFramebuffer = new Framebuffer(current.width, current.height);
                    fbo.blitFramebuffer.addColorTexture(0, colorTexture);
                }
                framebuffer = fbo.blitFramebuffer;
                if (framebuffer.colorTextures[0] !== colorTexture) {
                    framebuffer.colorTextures[0] = colorTexture;
                    framebuffer.dirtyId++;
                    framebuffer.dirtyFormat++;
                }
                if (framebuffer.width !== current.width || framebuffer.height !== current.height) {
                    framebuffer.width = current.width;
                    framebuffer.height = current.height;
                    framebuffer.dirtyId++;
                    framebuffer.dirtySize++;
                }
            }
            if (!sourcePixels) {
                sourcePixels = tempRectangle;
                sourcePixels.width = current.width;
                sourcePixels.height = current.height;
            }
            if (!destPixels) {
                destPixels = sourcePixels;
            }
            var sameSize = sourcePixels.width === destPixels.width && sourcePixels.height === destPixels.height;
            this.bind(framebuffer);
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo.framebuffer);
            gl.blitFramebuffer(sourcePixels.left, sourcePixels.top, sourcePixels.right, sourcePixels.bottom, destPixels.left, destPixels.top, destPixels.right, destPixels.bottom, gl.COLOR_BUFFER_BIT, sameSize ? gl.NEAREST : gl.LINEAR);
        };
        /**
         * Disposes framebuffer.
         *
         * @param framebuffer - framebuffer that has to be disposed of
         * @param contextLost - If context was lost, we suppress all delete function calls
         */
        FramebufferSystem.prototype.disposeFramebuffer = function (framebuffer, contextLost) {
            var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
            var gl = this.gl;
            if (!fbo) {
                return;
            }
            delete framebuffer.glFramebuffers[this.CONTEXT_UID];
            var index = this.managedFramebuffers.indexOf(framebuffer);
            if (index >= 0) {
                this.managedFramebuffers.splice(index, 1);
            }
            framebuffer.disposeRunner.remove(this);
            if (!contextLost) {
                gl.deleteFramebuffer(fbo.framebuffer);
                if (fbo.msaaBuffer) {
                    gl.deleteRenderbuffer(fbo.msaaBuffer);
                }
                if (fbo.stencil) {
                    gl.deleteRenderbuffer(fbo.stencil);
                }
            }
            if (fbo.blitFramebuffer) {
                fbo.blitFramebuffer.dispose();
            }
        };
        /**
         * Disposes all framebuffers, but not textures bound to them.
         *
         * @param [contextLost=false] - If context was lost, we suppress all delete function calls
         */
        FramebufferSystem.prototype.disposeAll = function (contextLost) {
            var list = this.managedFramebuffers;
            this.managedFramebuffers = [];
            for (var i = 0; i < list.length; i++) {
                this.disposeFramebuffer(list[i], contextLost);
            }
        };
        /**
         * Forcing creation of stencil buffer for current framebuffer, if it wasn't done before.
         * Used by MaskSystem, when its time to use stencil mask for Graphics element.
         *
         * Its an alternative for public lazy `framebuffer.enableStencil`, in case we need stencil without rebind.
         *
         * @private
         */
        FramebufferSystem.prototype.forceStencil = function () {
            var framebuffer = this.current;
            if (!framebuffer) {
                return;
            }
            var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
            if (!fbo || fbo.stencil) {
                return;
            }
            framebuffer.stencil = true;
            var w = framebuffer.width;
            var h = framebuffer.height;
            var gl = this.gl;
            var stencil = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, stencil);
            if (fbo.msaaBuffer) {
                gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.DEPTH24_STENCIL8, w, h);
            }
            else {
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h);
            }
            fbo.stencil = stencil;
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencil);
        };
        /**
         * Resets framebuffer stored state, binds screen framebuffer.
         *
         * Should be called before renderTexture reset().
         */
        FramebufferSystem.prototype.reset = function () {
            this.current = this.unknownFramebuffer;
            this.viewport = new Rectangle();
        };
        FramebufferSystem.prototype.destroy = function () {
            this.renderer = null;
        };
        return FramebufferSystem;
    }());
  
    var byteSizeMap$1 = { 5126: 4, 5123: 2, 5121: 1 };
    /**
     * System plugin to the renderer to manage geometry.
     *
     * @memberof PIXI
     */
    var GeometrySystem = /** @class */ (function () {
        /** @param renderer - The renderer this System works for. */
        function GeometrySystem(renderer) {
            this.renderer = renderer;
            this._activeGeometry = null;
            this._activeVao = null;
            this.hasVao = true;
            this.hasInstance = true;
            this.canUseUInt32ElementIndex = false;
            this.managedGeometries = {};
        }
        /** Sets up the renderer context and necessary buffers. */
        GeometrySystem.prototype.contextChange = function () {
            this.disposeAll(true);
            var gl = this.gl = this.renderer.gl;
            var context = this.renderer.context;
            this.CONTEXT_UID = this.renderer.CONTEXT_UID;
            // webgl2
            if (context.webGLVersion !== 2) {
                // webgl 1!
                var nativeVaoExtension_1 = this.renderer.context.extensions.vertexArrayObject;
                if (settings.PREFER_ENV === exports.ENV.WEBGL_LEGACY) {
                    nativeVaoExtension_1 = null;
                }
                if (nativeVaoExtension_1) {
                    gl.createVertexArray = function () {
                        return nativeVaoExtension_1.createVertexArrayOES();
                    };
                    gl.bindVertexArray = function (vao) {
                        return nativeVaoExtension_1.bindVertexArrayOES(vao);
                    };
                    gl.deleteVertexArray = function (vao) {
                        return nativeVaoExtension_1.deleteVertexArrayOES(vao);
                    };
                }
                else {
                    this.hasVao = false;
                    gl.createVertexArray = function () {
                        return null;
                    };
                    gl.bindVertexArray = function () {
                        return null;
                    };
                    gl.deleteVertexArray = function () {
                        return null;
                    };
                }
            }
            if (context.webGLVersion !== 2) {
                var instanceExt_1 = gl.getExtension('ANGLE_instanced_arrays');
                if (instanceExt_1) {
                    gl.vertexAttribDivisor = function (a, b) {
                        return instanceExt_1.vertexAttribDivisorANGLE(a, b);
                    };
                    gl.drawElementsInstanced = function (a, b, c, d, e) {
                        return instanceExt_1.drawElementsInstancedANGLE(a, b, c, d, e);
                    };
                    gl.drawArraysInstanced = function (a, b, c, d) {
                        return instanceExt_1.drawArraysInstancedANGLE(a, b, c, d);
                    };
                }
                else {
                    this.hasInstance = false;
                }
            }
            this.canUseUInt32ElementIndex = context.webGLVersion === 2 || !!context.extensions.uint32ElementIndex;
        };
        /**
         * Binds geometry so that is can be drawn. Creating a Vao if required
         *
         * @param geometry - Instance of geometry to bind.
         * @param shader - Instance of shader to use vao for.
         */
        GeometrySystem.prototype.bind = function (geometry, shader) {
            shader = shader || this.renderer.shader.shader;
            var gl = this.gl;
            // not sure the best way to address this..
            // currently different shaders require different VAOs for the same geometry
            // Still mulling over the best way to solve this one..
            // will likely need to modify the shader attribute locations at run time!
            var vaos = geometry.glVertexArrayObjects[this.CONTEXT_UID];
            var incRefCount = false;
            if (!vaos) {
                this.managedGeometries[geometry.id] = geometry;
                geometry.disposeRunner.add(this);
                geometry.glVertexArrayObjects[this.CONTEXT_UID] = vaos = {};
                incRefCount = true;
            }
            var vao = vaos[shader.program.id] || this.initGeometryVao(geometry, shader, incRefCount);
            this._activeGeometry = geometry;
            if (this._activeVao !== vao) {
                this._activeVao = vao;
                if (this.hasVao) {
                    gl.bindVertexArray(vao);
                }
                else {
                    this.activateVao(geometry, shader.program);
                }
            }
            // TODO - optimise later!
            // don't need to loop through if nothing changed!
            // maybe look to add an 'autoupdate' to geometry?
            this.updateBuffers();
        };
        /** Reset and unbind any active VAO and geometry. */
        GeometrySystem.prototype.reset = function () {
            this.unbind();
        };
        /** Update buffers of the currently bound geometry. */
        GeometrySystem.prototype.updateBuffers = function () {
            var geometry = this._activeGeometry;
            var bufferSystem = this.renderer.buffer;
            for (var i = 0; i < geometry.buffers.length; i++) {
                var buffer = geometry.buffers[i];
                bufferSystem.update(buffer);
            }
        };
        /**
         * Check compatibility between a geometry and a program
         *
         * @param geometry - Geometry instance.
         * @param program - Program instance.
         */
        GeometrySystem.prototype.checkCompatibility = function (geometry, program) {
            // geometry must have at least all the attributes that the shader requires.
            var geometryAttributes = geometry.attributes;
            var shaderAttributes = program.attributeData;
            for (var j in shaderAttributes) {
                if (!geometryAttributes[j]) {
                    throw new Error("shader and geometry incompatible, geometry missing the \"" + j + "\" attribute");
                }
            }
        };
        /**
         * Takes a geometry and program and generates a unique signature for them.
         *
         * @param geometry - To get signature from.
         * @param program - To test geometry against.
         * @return - Unique signature of the geometry and program
         */
        GeometrySystem.prototype.getSignature = function (geometry, program) {
            var attribs = geometry.attributes;
            var shaderAttributes = program.attributeData;
            var strings = ['g', geometry.id];
            for (var i in attribs) {
                if (shaderAttributes[i]) {
                    strings.push(i, shaderAttributes[i].location);
                }
            }
            return strings.join('-');
        };
        /**
         * Creates or gets Vao with the same structure as the geometry and stores it on the geometry.
         * If vao is created, it is bound automatically. We use a shader to infer what and how to set up the
         * attribute locations.
         *
         * @param geometry - Instance of geometry to to generate Vao for.
         * @param shader - Instance of the shader.
         * @param incRefCount - Increment refCount of all geometry buffers.
         */
        GeometrySystem.prototype.initGeometryVao = function (geometry, shader, incRefCount) {
            if (incRefCount === void 0) { incRefCount = true; }
            var gl = this.gl;
            var CONTEXT_UID = this.CONTEXT_UID;
            var bufferSystem = this.renderer.buffer;
            var program = shader.program;
            if (!program.glPrograms[CONTEXT_UID]) {
                this.renderer.shader.generateProgram(shader);
            }
            this.checkCompatibility(geometry, program);
            var signature = this.getSignature(geometry, program);
            var vaoObjectHash = geometry.glVertexArrayObjects[this.CONTEXT_UID];
            var vao = vaoObjectHash[signature];
            if (vao) {
                // this will give us easy access to the vao
                vaoObjectHash[program.id] = vao;
                return vao;
            }
            var buffers = geometry.buffers;
            var attributes = geometry.attributes;
            var tempStride = {};
            var tempStart = {};
            for (var j in buffers) {
                tempStride[j] = 0;
                tempStart[j] = 0;
            }
            for (var j in attributes) {
                if (!attributes[j].size && program.attributeData[j]) {
                    attributes[j].size = program.attributeData[j].size;
                }
                else if (!attributes[j].size) {
                    console.warn("PIXI Geometry attribute '" + j + "' size cannot be determined (likely the bound shader does not have the attribute)"); // eslint-disable-line
                }
                tempStride[attributes[j].buffer] += attributes[j].size * byteSizeMap$1[attributes[j].type];
            }
            for (var j in attributes) {
                var attribute = attributes[j];
                var attribSize = attribute.size;
                if (attribute.stride === undefined) {
                    if (tempStride[attribute.buffer] === attribSize * byteSizeMap$1[attribute.type]) {
                        attribute.stride = 0;
                    }
                    else {
                        attribute.stride = tempStride[attribute.buffer];
                    }
                }
                if (attribute.start === undefined) {
                    attribute.start = tempStart[attribute.buffer];
                    tempStart[attribute.buffer] += attribSize * byteSizeMap$1[attribute.type];
                }
            }
            vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            // first update - and create the buffers!
            // only create a gl buffer if it actually gets
            for (var i = 0; i < buffers.length; i++) {
                var buffer = buffers[i];
                bufferSystem.bind(buffer);
                if (incRefCount) {
                    buffer._glBuffers[CONTEXT_UID].refCount++;
                }
            }
            // TODO - maybe make this a data object?
            // lets wait to see if we need to first!
            this.activateVao(geometry, program);
            this._activeVao = vao;
            // add it to the cache!
            vaoObjectHash[program.id] = vao;
            vaoObjectHash[signature] = vao;
            return vao;
        };
        /**
         * Disposes geometry.
         *
         * @param geometry - Geometry with buffers. Only VAO will be disposed
         * @param [contextLost=false] - If context was lost, we suppress deleteVertexArray
         */
        GeometrySystem.prototype.disposeGeometry = function (geometry, contextLost) {
            var _a;
            if (!this.managedGeometries[geometry.id]) {
                return;
            }
            delete this.managedGeometries[geometry.id];
            var vaos = geometry.glVertexArrayObjects[this.CONTEXT_UID];
            var gl = this.gl;
            var buffers = geometry.buffers;
            var bufferSystem = (_a = this.renderer) === null || _a === void 0 ? void 0 : _a.buffer;
            geometry.disposeRunner.remove(this);
            if (!vaos) {
                return;
            }
            // bufferSystem may have already been destroyed..
            // if this is the case, there is no need to destroy the geometry buffers...
            // they already have been!
            if (bufferSystem) {
                for (var i = 0; i < buffers.length; i++) {
                    var buf = buffers[i]._glBuffers[this.CONTEXT_UID];
                    // my be null as context may have changed right before the dispose is called
                    if (buf) {
                        buf.refCount--;
                        if (buf.refCount === 0 && !contextLost) {
                            bufferSystem.dispose(buffers[i], contextLost);
                        }
                    }
                }
            }
            if (!contextLost) {
                for (var vaoId in vaos) {
                    // delete only signatures, everything else are copies
                    if (vaoId[0] === 'g') {
                        var vao = vaos[vaoId];
                        if (this._activeVao === vao) {
                            this.unbind();
                        }
                        gl.deleteVertexArray(vao);
                    }
                }
            }
            delete geometry.glVertexArrayObjects[this.CONTEXT_UID];
        };
        /**
         * Dispose all WebGL resources of all managed geometries.
         *
         * @param [contextLost=false] - If context was lost, we suppress `gl.delete` calls
         */
        GeometrySystem.prototype.disposeAll = function (contextLost) {
            var all = Object.keys(this.managedGeometries);
            for (var i = 0; i < all.length; i++) {
                this.disposeGeometry(this.managedGeometries[all[i]], contextLost);
            }
        };
        /**
         * Activate vertex array object.
         *
         * @param geometry - Geometry instance.
         * @param program - Shader program instance.
         */
        GeometrySystem.prototype.activateVao = function (geometry, program) {
            var gl = this.gl;
            var CONTEXT_UID = this.CONTEXT_UID;
            var bufferSystem = this.renderer.buffer;
            var buffers = geometry.buffers;
            var attributes = geometry.attributes;
            if (geometry.indexBuffer) {
                // first update the index buffer if we have one..
                bufferSystem.bind(geometry.indexBuffer);
            }
            var lastBuffer = null;
            // add a new one!
            for (var j in attributes) {
                var attribute = attributes[j];
                var buffer = buffers[attribute.buffer];
                var glBuffer = buffer._glBuffers[CONTEXT_UID];
                if (program.attributeData[j]) {
                    if (lastBuffer !== glBuffer) {
                        bufferSystem.bind(buffer);
                        lastBuffer = glBuffer;
                    }
                    var location = program.attributeData[j].location;
                    // TODO introduce state again
                    // we can optimise this for older devices that have no VAOs
                    gl.enableVertexAttribArray(location);
                    gl.vertexAttribPointer(location, attribute.size, attribute.type || gl.FLOAT, attribute.normalized, attribute.stride, attribute.start);
                    if (attribute.instance) {
                        // TODO calculate instance count based of this...
                        if (this.hasInstance) {
                            gl.vertexAttribDivisor(location, 1);
                        }
                        else {
                            throw new Error('geometry error, GPU Instancing is not supported on this device');
                        }
                    }
                }
            }
        };
        /**
         * Draws the currently bound geometry.
         *
         * @param type - The type primitive to render.
         * @param size - The number of elements to be rendered. If not specified, all vertices after the
         *  starting vertex will be drawn.
         * @param start - The starting vertex in the geometry to start drawing from. If not specified,
         *  drawing will start from the first vertex.
         * @param instanceCount - The number of instances of the set of elements to execute. If not specified,
         *  all instances will be drawn.
         */
        GeometrySystem.prototype.draw = function (type, size, start, instanceCount) {
            var gl = this.gl;
            var geometry = this._activeGeometry;
            // TODO.. this should not change so maybe cache the function?
            if (geometry.indexBuffer) {
                var byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT;
                var glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
                if (byteSize === 2 || (byteSize === 4 && this.canUseUInt32ElementIndex)) {
                    if (geometry.instanced) {
                        /* eslint-disable max-len */
                        gl.drawElementsInstanced(type, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize, instanceCount || 1);
                        /* eslint-enable max-len */
                    }
                    else {
                        /* eslint-disable max-len */
                        gl.drawElements(type, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize);
                        /* eslint-enable max-len */
                    }
                }
                else {
                    console.warn('unsupported index buffer type: uint32');
                }
            }
            else if (geometry.instanced) {
                // TODO need a better way to calculate size..
                gl.drawArraysInstanced(type, start, size || geometry.getSize(), instanceCount || 1);
            }
            else {
                gl.drawArrays(type, start, size || geometry.getSize());
            }
            return this;
        };
        /** Unbind/reset everything. */
        GeometrySystem.prototype.unbind = function () {
            this.gl.bindVertexArray(null);
            this._activeVao = null;
            this._activeGeometry = null;
        };
        GeometrySystem.prototype.destroy = function () {
            this.renderer = null;
        };
        return GeometrySystem;
    }());
  
    /**
     * Component for masked elements.
     *
     * Holds mask mode and temporary data about current mask.
     *
     * @memberof PIXI
     */
    var MaskData = /** @class */ (function () {
        /**
         * Create MaskData
         *
         * @param {PIXI.DisplayObject} [maskObject=null] - object that describes the mask
         */
        function MaskData(maskObject) {
            if (maskObject === void 0) { maskObject = null; }
            this.type = exports.MASK_TYPES.NONE;
            this.autoDetect = true;
            this.maskObject = maskObject || null;
            this.pooled = false;
            this.isMaskData = true;
            this.resolution = null;
            this.multisample = settings.FILTER_MULTISAMPLE;
            this.enabled = true;
            this._filters = null;
            this._stencilCounter = 0;
            this._scissorCounter = 0;
            this._scissorRect = null;
            this._scissorRectLocal = null;
            this._target = null;
        }
        Object.defineProperty(MaskData.prototype, "filter", {
            /**
             * The sprite mask filter.
             * If set to `null`, the default sprite mask filter is used.
             * @default null
             */
            get: function () {
                return this._filters ? this._filters[0] : null;
            },
            set: function (value) {
                if (value) {
                    if (this._filters) {
                        this._filters[0] = value;
                    }
                    else {
                        this._filters = [value];
                    }
                }
                else {
                    this._filters = null;
                }
            },
            enumerable: false,
            configurable: true
        });
        /** Resets the mask data after popMask(). */
        MaskData.prototype.reset = function () {
            if (this.pooled) {
                this.maskObject = null;
                this.type = exports.MASK_TYPES.NONE;
                this.autoDetect = true;
            }
            this._target = null;
            this._scissorRectLocal = null;
        };
        /** Copies counters from maskData above, called from pushMask(). */
        MaskData.prototype.copyCountersOrReset = function (maskAbove) {
            if (maskAbove) {
                this._stencilCounter = maskAbove._stencilCounter;
                this._scissorCounter = maskAbove._scissorCounter;
                this._scissorRect = maskAbove._scissorRect;
            }
            else {
                this._stencilCounter = 0;
                this._scissorCounter = 0;
                this._scissorRect = null;
            }
        };
        return MaskData;
    }());
  
    /**
     * @private
     * @param {WebGLRenderingContext} gl - The current WebGL context {WebGLProgram}
     * @param {Number} type - the type, can be either VERTEX_SHADER or FRAGMENT_SHADER
     * @param {string} src - The vertex shader source as an array of strings.
     * @return {WebGLShader} the shader
     */
    function compileShader(gl, type, src) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
    }
  
    /**
     * will log a shader error highlighting the lines with the error
     * also will add numbers along the side.
     *
     * @param gl - the WebGLContext
     * @param shader - the shader to log errors for
     */
    function logPrettyShaderError(gl, shader) {
        var shaderSrc = gl.getShaderSource(shader)
            .split('\n')
            .map(function (line, index) { return index + ": " + line; });
        var shaderLog = gl.getShaderInfoLog(shader);
        var splitShader = shaderLog.split('\n');
        var dedupe = {};
        var lineNumbers = splitShader.map(function (line) { return parseFloat(line.replace(/^ERROR\: 0\:([\d]+)\:.*$/, '$1')); })
            .filter(function (n) {
            if (n && !dedupe[n]) {
                dedupe[n] = true;
                return true;
            }
            return false;
        });
        var logArgs = [''];
        lineNumbers.forEach(function (number) {
            shaderSrc[number - 1] = "%c" + shaderSrc[number - 1] + "%c";
            logArgs.push('background: #FF0000; color:#FFFFFF; font-size: 10px', 'font-size: 10px');
        });
        var fragmentSourceToLog = shaderSrc
            .join('\n');
        logArgs[0] = fragmentSourceToLog;
        console.error(shaderLog);
        // eslint-disable-next-line no-console
        console.groupCollapsed('click to view full shader code');
        console.warn.apply(console, logArgs);
        // eslint-disable-next-line no-console
        console.groupEnd();
    }
    /**
     *
     * logs out any program errors
     *
     * @param gl - The current WebGL context
     * @param program - the WebGL program to display errors for
     * @param vertexShader  - the fragment WebGL shader program
     * @param fragmentShader - the vertex WebGL shader program
     */
    function logProgramError(gl, program, vertexShader, fragmentShader) {
        // if linking fails, then log and cleanup
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                logPrettyShaderError(gl, vertexShader);
            }
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                logPrettyShaderError(gl, fragmentShader);
            }
            console.error('PixiJS Error: Could not initialize shader.');
            // if there is a program info log, log it
            if (gl.getProgramInfoLog(program) !== '') {
                console.warn('PixiJS Warning: gl.getProgramInfoLog()', gl.getProgramInfoLog(program));
            }
        }
    }
  
    function booleanArray(size) {
        var array = new Array(size);
        for (var i = 0; i < array.length; i++) {
            array[i] = false;
        }
        return array;
    }
    /**
     * @method defaultValue
     * @memberof PIXI.glCore.shader
     * @param {string} type - Type of value
     * @param {number} size
     * @private
     */
    function defaultValue(type, size) {
        switch (type) {
            case 'float':
                return 0;
            case 'vec2':
                return new Float32Array(2 * size);
            case 'vec3':
                return new Float32Array(3 * size);
            case 'vec4':
                return new Float32Array(4 * size);
            case 'int':
            case 'uint':
            case 'sampler2D':
            case 'sampler2DArray':
                return 0;
            case 'ivec2':
                return new Int32Array(2 * size);
            case 'ivec3':
                return new Int32Array(3 * size);
            case 'ivec4':
                return new Int32Array(4 * size);
            case 'uvec2':
                return new Uint32Array(2 * size);
            case 'uvec3':
                return new Uint32Array(3 * size);
            case 'uvec4':
                return new Uint32Array(4 * size);
            case 'bool':
                return false;
            case 'bvec2':
                return booleanArray(2 * size);
            case 'bvec3':
                return booleanArray(3 * size);
            case 'bvec4':
                return booleanArray(4 * size);
            case 'mat2':
                return new Float32Array([1, 0,
                    0, 1]);
            case 'mat3':
                return new Float32Array([1, 0, 0,
                    0, 1, 0,
                    0, 0, 1]);
            case 'mat4':
                return new Float32Array([1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1]);
        }
        return null;
    }
  
    var unknownContext = {};
    var context = unknownContext;
    /**
     * returns a little WebGL context to use for program inspection.
     *
     * @static
     * @private
     * @returns {WebGLRenderingContext} a gl context to test with
     */
    function getTestContext() {
        if (context === unknownContext || (context && context.isContextLost())) {
            var canvas = document.createElement('canvas');
            var gl = void 0;
            if (settings.PREFER_ENV >= exports.ENV.WEBGL2) {
                gl = canvas.getContext('webgl2', {});
            }
            if (!gl) {
                gl = canvas.getContext('webgl', {})
                    || canvas.getContext('experimental-webgl', {});
                if (!gl) {
                    // fail, not able to get a context
                    gl = null;
                }
                else {
                    // for shader testing..
                    gl.getExtension('WEBGL_draw_buffers');
                }
            }
            context = gl;
        }
        return context;
    }
  
    var maxFragmentPrecision;
    function getMaxFragmentPrecision() {
        if (!maxFragmentPrecision) {
            maxFragmentPrecision = exports.PRECISION.MEDIUM;
            var gl = getTestContext();
            if (gl) {
                if (gl.getShaderPrecisionFormat) {
                    var shaderFragment = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
                    maxFragmentPrecision = shaderFragment.precision ? exports.PRECISION.HIGH : exports.PRECISION.MEDIUM;
                }
            }
        }
        return maxFragmentPrecision;
    }
  
    /**
     * Sets the float precision on the shader, ensuring the device supports the request precision.
     * If the precision is already present, it just ensures that the device is able to handle it.
     *
     * @private
     * @param {string} src - The shader source
     * @param {PIXI.PRECISION} requestedPrecision - The request float precision of the shader.
     * @param {PIXI.PRECISION} maxSupportedPrecision - The maximum precision the shader supports.
     *
     * @return {string} modified shader source
     */
    function setPrecision(src, requestedPrecision, maxSupportedPrecision) {
        if (src.substring(0, 9) !== 'precision') {
            // no precision supplied, so PixiJS will add the requested level.
            var precision = requestedPrecision;
            // If highp is requested but not supported, downgrade precision to a level all devices support.
            if (requestedPrecision === exports.PRECISION.HIGH && maxSupportedPrecision !== exports.PRECISION.HIGH) {
                precision = exports.PRECISION.MEDIUM;
            }
            return "precision " + precision + " float;\n" + src;
        }
        else if (maxSupportedPrecision !== exports.PRECISION.HIGH && src.substring(0, 15) === 'precision highp') {
            // precision was supplied, but at a level this device does not support, so downgrading to mediump.
            return src.replace('precision highp', 'precision mediump');
        }
        return src;
    }
  
    var GLSL_TO_SIZE = {
        float: 1,
        vec2: 2,
        vec3: 3,
        vec4: 4,
        int: 1,
        ivec2: 2,
        ivec3: 3,
        ivec4: 4,
        uint: 1,
        uvec2: 2,
        uvec3: 3,
        uvec4: 4,
        bool: 1,
        bvec2: 2,
        bvec3: 3,
        bvec4: 4,
        mat2: 4,
        mat3: 9,
        mat4: 16,
        sampler2D: 1,
    };
    /**
     * @private
     * @method mapSize
     * @memberof PIXI.glCore.shader
     * @param {String} type
     * @return {Number}
     */
    function mapSize(type) {
        return GLSL_TO_SIZE[type];
    }
  
    var GL_TABLE = null;
    var GL_TO_GLSL_TYPES = {
        FLOAT: 'float',
        FLOAT_VEC2: 'vec2',
        FLOAT_VEC3: 'vec3',
        FLOAT_VEC4: 'vec4',
        INT: 'int',
        INT_VEC2: 'ivec2',
        INT_VEC3: 'ivec3',
        INT_VEC4: 'ivec4',
        UNSIGNED_INT: 'uint',
        UNSIGNED_INT_VEC2: 'uvec2',
        UNSIGNED_INT_VEC3: 'uvec3',
        UNSIGNED_INT_VEC4: 'uvec4',
        BOOL: 'bool',
        BOOL_VEC2: 'bvec2',
        BOOL_VEC3: 'bvec3',
        BOOL_VEC4: 'bvec4',
        FLOAT_MAT2: 'mat2',
        FLOAT_MAT3: 'mat3',
        FLOAT_MAT4: 'mat4',
        SAMPLER_2D: 'sampler2D',
        INT_SAMPLER_2D: 'sampler2D',
        UNSIGNED_INT_SAMPLER_2D: 'sampler2D',
        SAMPLER_CUBE: 'samplerCube',
        INT_SAMPLER_CUBE: 'samplerCube',
        UNSIGNED_INT_SAMPLER_CUBE: 'samplerCube',
        SAMPLER_2D_ARRAY: 'sampler2DArray',
        INT_SAMPLER_2D_ARRAY: 'sampler2DArray',
        UNSIGNED_INT_SAMPLER_2D_ARRAY: 'sampler2DArray',
    };
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    function mapType(gl, type) {
        if (!GL_TABLE) {
            var typeNames = Object.keys(GL_TO_GLSL_TYPES);
            GL_TABLE = {};
            for (var i = 0; i < typeNames.length; ++i) {
                var tn = typeNames[i];
                GL_TABLE[gl[tn]] = GL_TO_GLSL_TYPES[tn];
            }
        }
        return GL_TABLE[type];
    }
  
    /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
    // Parsers, each one of these will take a look at the type of shader property and uniform.
    // if they pass the test function then the code function is called that returns a the shader upload code for that uniform.
    // Shader upload code is automagically generated with these parsers.
    // If no parser is valid then the default upload functions are used.
    // exposing Parsers means that custom upload logic can be added to pixi's shaders.
    // A good example would be a pixi rectangle can be directly set on a uniform.
    // If the shader sees it it knows how to upload the rectangle structure as a vec4
    // format is as follows:
    //
    // {
    //     test: (data, uniform) => {} <--- test is this code should be used for this uniform
    //     code: (name, uniform) => {} <--- returns the string of the piece of code that uploads the uniform
    //     codeUbo: (name, uniform) => {} <--- returns the string of the piece of code that uploads the
    //                                         uniform to a uniform buffer
    // }
    var uniformParsers = [
        // a float cache layer
        {
            test: function (data) {
                return data.type === 'float' && data.size === 1;
            },
            code: function (name) {
                return "\n            if(uv[\"" + name + "\"] !== ud[\"" + name + "\"].value)\n            {\n                ud[\"" + name + "\"].value = uv[\"" + name + "\"]\n                gl.uniform1f(ud[\"" + name + "\"].location, uv[\"" + name + "\"])\n            }\n            ";
            },
        },
        // handling samplers
        {
            test: function (data) {
                // eslint-disable-next-line max-len
                return (data.type === 'sampler2D' || data.type === 'samplerCube' || data.type === 'sampler2DArray') && data.size === 1 && !data.isArray;
            },
            code: function (name) { return "t = syncData.textureCount++;\n\n            renderer.texture.bind(uv[\"" + name + "\"], t);\n\n            if(ud[\"" + name + "\"].value !== t)\n            {\n                ud[\"" + name + "\"].value = t;\n                gl.uniform1i(ud[\"" + name + "\"].location, t);\n; // eslint-disable-line max-len\n            }"; },
        },
        // uploading pixi matrix object to mat3
        {
            test: function (data, uniform) {
                return data.type === 'mat3' && data.size === 1 && uniform.a !== undefined;
            },
            code: function (name) {
                // TODO and some smart caching dirty ids here!
                return "\n            gl.uniformMatrix3fv(ud[\"" + name + "\"].location, false, uv[\"" + name + "\"].toArray(true));\n            ";
            },
            codeUbo: function (name) {
                return "\n                var " + name + "_matrix = uv." + name + ".toArray(true);\n\n                data[offset] = " + name + "_matrix[0];\n                data[offset+1] = " + name + "_matrix[1];\n                data[offset+2] = " + name + "_matrix[2];\n        \n                data[offset + 4] = " + name + "_matrix[3];\n                data[offset + 5] = " + name + "_matrix[4];\n                data[offset + 6] = " + name + "_matrix[5];\n        \n                data[offset + 8] = " + name + "_matrix[6];\n                data[offset + 9] = " + name + "_matrix[7];\n                data[offset + 10] = " + name + "_matrix[8];\n            ";
            },
        },
        // uploading a pixi point as a vec2 with caching layer
        {
            test: function (data, uniform) {
                return data.type === 'vec2' && data.size === 1 && uniform.x !== undefined;
            },
            code: function (name) {
                return "\n                cv = ud[\"" + name + "\"].value;\n                v = uv[\"" + name + "\"];\n\n                if(cv[0] !== v.x || cv[1] !== v.y)\n                {\n                    cv[0] = v.x;\n                    cv[1] = v.y;\n                    gl.uniform2f(ud[\"" + name + "\"].location, v.x, v.y);\n                }";
            },
            codeUbo: function (name) {
                return "\n                v = uv." + name + ";\n\n                data[offset] = v.x;\n                data[offset+1] = v.y;\n            ";
            }
        },
        // caching layer for a vec2
        {
            test: function (data) {
                return data.type === 'vec2' && data.size === 1;
            },
            code: function (name) {
                return "\n                cv = ud[\"" + name + "\"].value;\n                v = uv[\"" + name + "\"];\n\n                if(cv[0] !== v[0] || cv[1] !== v[1])\n                {\n                    cv[0] = v[0];\n                    cv[1] = v[1];\n                    gl.uniform2f(ud[\"" + name + "\"].location, v[0], v[1]);\n                }\n            ";
            },
        },
        // upload a pixi rectangle as a vec4 with caching layer
        {
            test: function (data, uniform) {
                return data.type === 'vec4' && data.size === 1 && uniform.width !== undefined;
            },
            code: function (name) {
                return "\n                cv = ud[\"" + name + "\"].value;\n                v = uv[\"" + name + "\"];\n\n                if(cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height)\n                {\n                    cv[0] = v.x;\n                    cv[1] = v.y;\n                    cv[2] = v.width;\n                    cv[3] = v.height;\n                    gl.uniform4f(ud[\"" + name + "\"].location, v.x, v.y, v.width, v.height)\n                }";
            },
            codeUbo: function (name) {
                return "\n                    v = uv." + name + ";\n\n                    data[offset] = v.x;\n                    data[offset+1] = v.y;\n                    data[offset+2] = v.width;\n                    data[offset+3] = v.height;\n                ";
            }
        },
        // a caching layer for vec4 uploading
        {
            test: function (data) {
                return data.type === 'vec4' && data.size === 1;
            },
            code: function (name) {
                return "\n                cv = ud[\"" + name + "\"].value;\n                v = uv[\"" + name + "\"];\n\n                if(cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n                {\n                    cv[0] = v[0];\n                    cv[1] = v[1];\n                    cv[2] = v[2];\n                    cv[3] = v[3];\n\n                    gl.uniform4f(ud[\"" + name + "\"].location, v[0], v[1], v[2], v[3])\n                }";
            },
        } ];
  
    // cu = Cached value's uniform data field
    // cv = Cached value
    // v = value to upload
    // ud = uniformData
    // uv = uniformValue
    // l = location
    var GLSL_TO_SINGLE_SETTERS_CACHED = {
        float: "\n    if (cv !== v)\n    {\n        cu.value = v;\n        gl.uniform1f(location, v);\n    }",
        vec2: "\n    if (cv[0] !== v[0] || cv[1] !== v[1])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n\n        gl.uniform2f(location, v[0], v[1])\n    }",
        vec3: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n\n        gl.uniform3f(location, v[0], v[1], v[2])\n    }",
        vec4: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n        cv[3] = v[3];\n\n        gl.uniform4f(location, v[0], v[1], v[2], v[3]);\n    }",
        int: "\n    if (cv !== v)\n    {\n        cu.value = v;\n\n        gl.uniform1i(location, v);\n    }",
        ivec2: "\n    if (cv[0] !== v[0] || cv[1] !== v[1])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n\n        gl.uniform2i(location, v[0], v[1]);\n    }",
        ivec3: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n\n        gl.uniform3i(location, v[0], v[1], v[2]);\n    }",
        ivec4: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n        cv[3] = v[3];\n\n        gl.uniform4i(location, v[0], v[1], v[2], v[3]);\n    }",
        uint: "\n    if (cv !== v)\n    {\n        cu.value = v;\n\n        gl.uniform1ui(location, v);\n    }",
        uvec2: "\n    if (cv[0] !== v[0] || cv[1] !== v[1])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n\n        gl.uniform2ui(location, v[0], v[1]);\n    }",
        uvec3: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n\n        gl.uniform3ui(location, v[0], v[1], v[2]);\n    }",
        uvec4: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n        cv[3] = v[3];\n\n        gl.uniform4ui(location, v[0], v[1], v[2], v[3]);\n    }",
        bool: "\n    if (cv !== v)\n    {\n        cu.value = v;\n        gl.uniform1i(location, v);\n    }",
        bvec2: "\n    if (cv[0] != v[0] || cv[1] != v[1])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n\n        gl.uniform2i(location, v[0], v[1]);\n    }",
        bvec3: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n\n        gl.uniform3i(location, v[0], v[1], v[2]);\n    }",
        bvec4: "\n    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n        cv[3] = v[3];\n\n        gl.uniform4i(location, v[0], v[1], v[2], v[3]);\n    }",
        mat2: 'gl.uniformMatrix2fv(location, false, v)',
        mat3: 'gl.uniformMatrix3fv(location, false, v)',
        mat4: 'gl.uniformMatrix4fv(location, false, v)',
        sampler2D: 'gl.uniform1i(location, v)',
        samplerCube: 'gl.uniform1i(location, v)',
        sampler2DArray: 'gl.uniform1i(location, v)',
    };
    var GLSL_TO_ARRAY_SETTERS = {
        float: "gl.uniform1fv(location, v)",
        vec2: "gl.uniform2fv(location, v)",
        vec3: "gl.uniform3fv(location, v)",
        vec4: 'gl.uniform4fv(location, v)',
        mat4: 'gl.uniformMatrix4fv(location, false, v)',
        mat3: 'gl.uniformMatrix3fv(location, false, v)',
        mat2: 'gl.uniformMatrix2fv(location, false, v)',
        int: 'gl.uniform1iv(location, v)',
        ivec2: 'gl.uniform2iv(location, v)',
        ivec3: 'gl.uniform3iv(location, v)',
        ivec4: 'gl.uniform4iv(location, v)',
        uint: 'gl.uniform1uiv(location, v)',
        uvec2: 'gl.uniform2uiv(location, v)',
        uvec3: 'gl.uniform3uiv(location, v)',
        uvec4: 'gl.uniform4uiv(location, v)',
        bool: 'gl.uniform1iv(location, v)',
        bvec2: 'gl.uniform2iv(location, v)',
        bvec3: 'gl.uniform3iv(location, v)',
        bvec4: 'gl.uniform4iv(location, v)',
        sampler2D: 'gl.uniform1iv(location, v)',
        samplerCube: 'gl.uniform1iv(location, v)',
        sampler2DArray: 'gl.uniform1iv(location, v)',
    };
    function generateUniformsSync(group, uniformData) {
        var _a;
        var funcFragments = ["\n        var v = null;\n        var cv = null;\n        var cu = null;\n        var t = 0;\n        var gl = renderer.gl;\n    "];
        for (var i in group.uniforms) {
            var data = uniformData[i];
            if (!data) {
                if ((_a = group.uniforms[i]) === null || _a === void 0 ? void 0 : _a.group) {
                    if (group.uniforms[i].ubo) {
                        funcFragments.push("\n                        renderer.shader.syncUniformBufferGroup(uv." + i + ", '" + i + "');\n                    ");
                    }
                    else {
                        funcFragments.push("\n                        renderer.shader.syncUniformGroup(uv." + i + ", syncData);\n                    ");
                    }
                }
                continue;
            }
            var uniform = group.uniforms[i];
            var parsed = false;
            for (var j = 0; j < uniformParsers.length; j++) {
                if (uniformParsers[j].test(data, uniform)) {
                    funcFragments.push(uniformParsers[j].code(i, uniform));
                    parsed = true;
                    break;
                }
            }
            if (!parsed) {
                var templateType = (data.size === 1) ? GLSL_TO_SINGLE_SETTERS_CACHED : GLSL_TO_ARRAY_SETTERS;
                var template = templateType[data.type].replace('location', "ud[\"" + i + "\"].location");
                funcFragments.push("\n            cu = ud[\"" + i + "\"];\n            cv = cu.value;\n            v = uv[\"" + i + "\"];\n            " + template + ";");
            }
        }
        /*
         * the introduction of syncData is to solve an issue where textures in uniform groups are not set correctly
         * the texture count was always starting from 0 in each group. This needs to increment each time a texture is used
         * no matter which group is being used
         *
         */
        // eslint-disable-next-line no-new-func
        return new Function('ud', 'uv', 'renderer', 'syncData', funcFragments.join('\n'));
    }
  
    var fragTemplate = [
        'precision mediump float;',
        'void main(void){',
        'float test = 0.1;',
        '%forloop%',
        'gl_FragColor = vec4(0.0);',
        '}' ].join('\n');
    function generateIfTestSrc(maxIfs) {
        var src = '';
        for (var i = 0; i < maxIfs; ++i) {
            if (i > 0) {
                src += '\nelse ';
            }
            if (i < maxIfs - 1) {
                src += "if(test == " + i + ".0){}";
            }
        }
        return src;
    }
    function checkMaxIfStatementsInShader(maxIfs, gl) {
        if (maxIfs === 0) {
            throw new Error('Invalid value of `0` passed to `checkMaxIfStatementsInShader`');
        }
        var shader = gl.createShader(gl.FRAGMENT_SHADER);
        while (true) // eslint-disable-line no-constant-condition
         {
            var fragmentSrc = fragTemplate.replace(/%forloop%/gi, generateIfTestSrc(maxIfs));
            gl.shaderSource(shader, fragmentSrc);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                maxIfs = (maxIfs / 2) | 0;
            }
            else {
                // valid!
                break;
            }
        }
        return maxIfs;
    }
  
    // Cache the result to prevent running this over and over
    var unsafeEval;
    /**
     * Not all platforms allow to generate function code (e.g., `new Function`).
     * this provides the platform-level detection.
     *
     * @private
     * @returns {boolean}
     */
    function unsafeEvalSupported() {
        if (typeof unsafeEval === 'boolean') {
            return unsafeEval;
        }
        try {
            /* eslint-disable no-new-func */
            var func = new Function('param1', 'param2', 'param3', 'return param1[param2] === param3;');
            /* eslint-enable no-new-func */
            unsafeEval = func({ a: 'b' }, 'a', 'b') === true;
        }
        catch (e) {
            unsafeEval = false;
        }
        return unsafeEval;
    }
  
    var defaultFragment = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void){\n   gl_FragColor *= texture2D(uSampler, vTextureCoord);\n}";
  
    var defaultVertex = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void){\n   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n   vTextureCoord = aTextureCoord;\n}\n";
  
    var UID$3 = 0;
    var nameCache = {};
    /**
     * Helper class to create a shader program.
     *
     * @memberof PIXI
     */
    var Program = /** @class */ (function () {
        /**
         * @param vertexSrc - The source of the vertex shader.
         * @param fragmentSrc - The source of the fragment shader.
         * @param name - Name for shader
         */
        function Program(vertexSrc, fragmentSrc, name) {
            if (name === void 0) { name = 'pixi-shader'; }
            this.id = UID$3++;
            this.vertexSrc = vertexSrc || Program.defaultVertexSrc;
            this.fragmentSrc = fragmentSrc || Program.defaultFragmentSrc;
            this.vertexSrc = this.vertexSrc.trim();
            this.fragmentSrc = this.fragmentSrc.trim();
            if (this.vertexSrc.substring(0, 8) !== '#version') {
                name = name.replace(/\s+/g, '-');
                if (nameCache[name]) {
                    nameCache[name]++;
                    name += "-" + nameCache[name];
                }
                else {
                    nameCache[name] = 1;
                }
                this.vertexSrc = "#define SHADER_NAME " + name + "\n" + this.vertexSrc;
                this.fragmentSrc = "#define SHADER_NAME " + name + "\n" + this.fragmentSrc;
                this.vertexSrc = setPrecision(this.vertexSrc, settings.PRECISION_VERTEX, exports.PRECISION.HIGH);
                this.fragmentSrc = setPrecision(this.fragmentSrc, settings.PRECISION_FRAGMENT, getMaxFragmentPrecision());
            }
            // currently this does not extract structs only default types
            // this is where we store shader references..
            this.glPrograms = {};
            this.syncUniforms = null;
        }
        Object.defineProperty(Program, "defaultVertexSrc", {
            /**
             * The default vertex shader source.
             *
             * @constant
             */
            get: function () {
                return defaultVertex;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Program, "defaultFragmentSrc", {
            /**
             * The default fragment shader source.
             *
             * @constant
             */
            get: function () {
                return defaultFragment;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * A short hand function to create a program based of a vertex and fragment shader.
         *
         * This method will also check to see if there is a cached program.
         *
         * @param vertexSrc - The source of the vertex shader.
         * @param fragmentSrc - The source of the fragment shader.
         * @param name - Name for shader
         * @returns A shiny new PixiJS shader program!
         */
        Program.from = function (vertexSrc, fragmentSrc, name) {
            var key = vertexSrc + fragmentSrc;
            var program = ProgramCache[key];
            if (!program) {
                ProgramCache[key] = program = new Program(vertexSrc, fragmentSrc, name);
            }
            return program;
        };
        return Program;
    }());
  
    /**
     * A helper class for shaders.
     *
     * @memberof PIXI
     */
    var Shader = /** @class */ (function () {
        /**
         * @param program - The program the shader will use.
         * @param uniforms - Custom uniforms to use to augment the built-in ones.
         */
        function Shader(program, uniforms) {
            /**
             * Used internally to bind uniform buffer objects.
             * @ignore
             */
            this.uniformBindCount = 0;
            this.program = program;
            // lets see whats been passed in
            // uniforms should be converted to a uniform group
            if (uniforms) {
                if (uniforms instanceof UniformGroup) {
                    this.uniformGroup = uniforms;
                }
                else {
                    this.uniformGroup = new UniformGroup(uniforms);
                }
            }
            else {
                this.uniformGroup = new UniformGroup({});
            }
        }
        // TODO move to shader system..
        Shader.prototype.checkUniformExists = function (name, group) {
            if (group.uniforms[name]) {
                return true;
            }
            for (var i in group.uniforms) {
                var uniform = group.uniforms[i];
                if (uniform.group) {
                    if (this.checkUniformExists(name, uniform)) {
                        return true;
                    }
                }
            }
            return false;
        };
        Shader.prototype.destroy = function () {
            // usage count on programs?
            // remove if not used!
            this.uniformGroup = null;
        };
        Object.defineProperty(Shader.prototype, "uniforms", {
            /**
             * Shader uniform values, shortcut for `uniformGroup.uniforms`.
             *
             * @readonly
             */
            get: function () {
                return this.uniformGroup.uniforms;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * A short hand function to create a shader based of a vertex and fragment shader.
         *
         * @param vertexSrc - The source of the vertex shader.
         * @param fragmentSrc - The source of the fragment shader.
         * @param uniforms - Custom uniforms to use to augment the built-in ones.
         * @returns A shiny new PixiJS shader!
         */
        Shader.from = function (vertexSrc, fragmentSrc, uniforms) {
            var program = Program.from(vertexSrc, fragmentSrc);
            return new Shader(program, uniforms);
        };
        return Shader;
    }());
  
    /* eslint-disable max-len */
    var BLEND = 0;
    var OFFSET = 1;
    var CULLING = 2;
    var DEPTH_TEST = 3;
    var WINDING = 4;
    var DEPTH_MASK = 5;
    /**
     * This is a WebGL state, and is is passed to {@link PIXI.StateSystem}.
     *
     * Each mesh rendered may require WebGL to be in a different state.
     * For example you may want different blend mode or to enable polygon offsets
     *
     * @memberof PIXI
     */
    var State = /** @class */ (function () {
        function State() {
            this.data = 0;
            this.blendMode = exports.BLEND_MODES.NORMAL;
            this.polygonOffset = 0;
            this.blend = true;
            this.depthMask = true;
            //  this.depthTest = true;
        }
        Object.defineProperty(State.prototype, "blend", {
            /**
             * Activates blending of the computed fragment color values.
             *
             * @default true
             */
            get: function () {
                return !!(this.data & (1 << BLEND));
            },
            set: function (value) {
                if (!!(this.data & (1 << BLEND)) !== value) {
                    this.data ^= (1 << BLEND);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(State.prototype, "offsets", {
            /**
             * Activates adding an offset to depth values of polygon's fragments
             *
             * @default false
             */
            get: function () {
                return !!(this.data & (1 << OFFSET));
            },
            set: function (value) {
                if (!!(this.data & (1 << OFFSET)) !== value) {
                    this.data ^= (1 << OFFSET);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(State.prototype, "culling", {
            /**
             * Activates culling of polygons.
             *
             * @default false
             */
            get: function () {
                return !!(this.data & (1 << CULLING));
            },
            set: function (value) {
                if (!!(this.data & (1 << CULLING)) !== value) {
                    this.data ^= (1 << CULLING);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(State.prototype, "depthTest", {
            /**
             * Activates depth comparisons and updates to the depth buffer.
             *
             * @default false
             */
            get: function () {
                return !!(this.data & (1 << DEPTH_TEST));
            },
            set: function (value) {
                if (!!(this.data & (1 << DEPTH_TEST)) !== value) {
                    this.data ^= (1 << DEPTH_TEST);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(State.prototype, "depthMask", {
            /**
             * Enables or disables writing to the depth buffer.
             *
             * @default true
             */
            get: function () {
                return !!(this.data & (1 << DEPTH_MASK));
            },
            set: function (value) {
                if (!!(this.data & (1 << DEPTH_MASK)) !== value) {
                    this.data ^= (1 << DEPTH_MASK);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(State.prototype, "clockwiseFrontFace", {
            /**
             * Specifies whether or not front or back-facing polygons can be culled.
             *
             * @default false
             */
            get: function () {
                return !!(this.data & (1 << WINDING));
            },
            set: function (value) {
                if (!!(this.data & (1 << WINDING)) !== value) {
                    this.data ^= (1 << WINDING);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(State.prototype, "blendMode", {
            /**
             * The blend mode to be applied when this state is set. Apply a value of `PIXI.BLEND_MODES.NORMAL` to reset the blend mode.
             * Setting this mode to anything other than NO_BLEND will automatically switch blending on.
             *
             * @default PIXI.BLEND_MODES.NORMAL
             */
            get: function () {
                return this._blendMode;
            },
            set: function (value) {
                this.blend = (value !== exports.BLEND_MODES.NONE);
                this._blendMode = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(State.prototype, "polygonOffset", {
            /**
             * The polygon offset. Setting this property to anything other than 0 will automatically enable polygon offset fill.
             *
             * @default 0
             */
            get: function () {
                return this._polygonOffset;
            },
            set: function (value) {
                this.offsets = !!value;
                this._polygonOffset = value;
            },
            enumerable: false,
            configurable: true
        });
        State.prototype.toString = function () {
            return "[@pixi/core:State "
                + ("blendMode=" + this.blendMode + " ")
                + ("clockwiseFrontFace=" + this.clockwiseFrontFace + " ")
                + ("culling=" + this.culling + " ")
                + ("depthMask=" + this.depthMask + " ")
                + ("polygonOffset=" + this.polygonOffset)
                + "]";
        };
        State.for2d = function () {
            var state = new State();
            state.depthTest = false;
            state.blend = true;
            return state;
        };
        return State;
    }());
  
    var defaultVertex$1 = "attribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nuniform vec4 inputSize;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aVertexPosition * (outputFrame.zw * inputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n";
  
    var defaultFragment$1 = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void){\n   gl_FragColor = texture2D(uSampler, vTextureCoord);\n}\n";
  
    /**
     * A filter is a special shader that applies post-processing effects to an input texture and writes into an output
     * render-target.
     *
     * {@link http://pixijs.io/examples/#/filters/blur-filter.js Example} of the
     * {@link PIXI.filters.BlurFilter BlurFilter}.
     *
     * ### Usage
     * Filters can be applied to any DisplayObject or Container.
     * PixiJS' `FilterSystem` renders the container into temporary Framebuffer,
     * then filter renders it to the screen.
     * Multiple filters can be added to the `filters` array property and stacked on each other.
     *
     * ```
     * const filter = new PIXI.Filter(myShaderVert, myShaderFrag, { myUniform: 0.5 });
     * const container = new PIXI.Container();
     * container.filters = [filter];
     * ```
     *
     * ### Previous Version Differences
     *
     * In PixiJS **v3**, a filter was always applied to _whole screen_.
     *
     * In PixiJS **v4**, a filter can be applied _only part of the screen_.
     * Developers had to create a set of uniforms to deal with coordinates.
     *
     * In PixiJS **v5** combines _both approaches_.
     * Developers can use normal coordinates of v3 and then allow filter to use partial Framebuffers,
     * bringing those extra uniforms into account.
     *
     * Also be aware that we have changed default vertex shader, please consult
     * {@link https://github.com/pixijs/pixi.js/wiki/v5-Creating-filters Wiki}.
     *
     * ### Frames
     *
     * The following table summarizes the coordinate spaces used in the filtering pipeline:
     *
     * <table>
     * <thead>
     *   <tr>
     *     <th>Coordinate Space</th>
     *     <th>Description</th>
     *   </tr>
     * </thead>
     * <tbody>
     *   <tr>
     *     <td>Texture Coordinates</td>
     *     <td>
     *         The texture (or UV) coordinates in the input base-texture's space. These are normalized into the (0,1) range along
     *         both axes.
     *     </td>
     *   </tr>
     *   <tr>
     *     <td>World Space</td>
     *     <td>
     *         A point in the same space as the world bounds of any display-object (i.e. in the scene graph's space).
     *     </td>
     *   </tr>
     *   <tr>
     *     <td>Physical Pixels</td>
     *     <td>
     *         This is base-texture's space with the origin on the top-left. You can calculate these by multiplying the texture
     *         coordinates by the dimensions of the texture.
     *     </td>
     *   </tr>
     * </tbody>
     * </table>
     *
     * ### Built-in Uniforms
     *
     * PixiJS viewport uses screen (CSS) coordinates, `(0, 0, renderer.screen.width, renderer.screen.height)`,
     * and `projectionMatrix` uniform maps it to the gl viewport.
     *
     * **uSampler**
     *
     * The most important uniform is the input texture that container was rendered into.
     * _Important note: as with all Framebuffers in PixiJS, both input and output are
     * premultiplied by alpha._
     *
     * By default, input normalized coordinates are passed to fragment shader with `vTextureCoord`.
     * Use it to sample the input.
     *
     * ```
     * const fragment = `
     * varying vec2 vTextureCoord;
     * uniform sampler2D uSampler;
     * void main(void)
     * {
     *    gl_FragColor = texture2D(uSampler, vTextureCoord);
     * }
     * `;
     *
     * const myFilter = new PIXI.Filter(null, fragment);
     * ```
     *
     * This filter is just one uniform less than {@link PIXI.filters.AlphaFilter AlphaFilter}.
     *
     * **outputFrame**
     *
     * The `outputFrame` holds the rectangle where filter is applied in screen (CSS) coordinates.
     * It's the same as `renderer.screen` for a fullscreen filter.
     * Only a part of  `outputFrame.zw` size of temporary Framebuffer is used,
     * `(0, 0, outputFrame.width, outputFrame.height)`,
     *
     * Filters uses this quad to normalized (0-1) space, its passed into `aVertexPosition` attribute.
     * To calculate vertex position in screen space using normalized (0-1) space:
     *
     * ```
     * vec4 filterVertexPosition( void )
     * {
     *     vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;
     *     return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
     * }
     * ```
     *
     * **inputSize**
     *
     * Temporary framebuffer is different, it can be either the size of screen, either power-of-two.
     * The `inputSize.xy` are size of temporary framebuffer that holds input.
     * The `inputSize.zw` is inverted, it's a shortcut to evade division inside the shader.
     *
     * Set `inputSize.xy = outputFrame.zw` for a fullscreen filter.
     *
     * To calculate input normalized coordinate, you have to map it to filter normalized space.
     * Multiply by `outputFrame.zw` to get input coordinate.
     * Divide by `inputSize.xy` to get input normalized coordinate.
     *
     * ```
     * vec2 filterTextureCoord( void )
     * {
     *     return aVertexPosition * (outputFrame.zw * inputSize.zw); // same as /inputSize.xy
     * }
     * ```
     * **resolution**
     *
     * The `resolution` is the ratio of screen (CSS) pixels to real pixels.
     *
     * **inputPixel**
     *
     * `inputPixel.xy` is the size of framebuffer in real pixels, same as `inputSize.xy * resolution`
     * `inputPixel.zw` is inverted `inputPixel.xy`.
     *
     * It's handy for filters that use neighbour pixels, like {@link PIXI.filters.FXAAFilter FXAAFilter}.
     *
     * **inputClamp**
     *
     * If you try to get info from outside of used part of Framebuffer - you'll get undefined behaviour.
     * For displacements, coordinates has to be clamped.
     *
     * The `inputClamp.xy` is left-top pixel center, you may ignore it, because we use left-top part of Framebuffer
     * `inputClamp.zw` is bottom-right pixel center.
     *
     * ```
     * vec4 color = texture2D(uSampler, clamp(modifiedTextureCoord, inputClamp.xy, inputClamp.zw))
     * ```
     * OR
     * ```
     * vec4 color = texture2D(uSampler, min(modifigedTextureCoord, inputClamp.zw))
     * ```
     *
     * ### Additional Information
     *
     * Complete documentation on Filter usage is located in the
     * {@link https://github.com/pixijs/pixi.js/wiki/v5-Creating-filters Wiki}.
     *
     * Since PixiJS only had a handful of built-in filters, additional filters can be downloaded
     * {@link https://github.com/pixijs/pixi-filters here} from the PixiJS Filters repository.
     *
     * @memberof PIXI
     */
    var Filter = /** @class */ (function (_super) {
        __extends$2(Filter, _super);
        /**
         * @param vertexSrc - The source of the vertex shader.
         * @param fragmentSrc - The source of the fragment shader.
         * @param uniforms - Custom uniforms to use to augment the built-in ones.
         */
        function Filter(vertexSrc, fragmentSrc, uniforms) {
            var _this = this;
            var program = Program.from(vertexSrc || Filter.defaultVertexSrc, fragmentSrc || Filter.defaultFragmentSrc);
            _this = _super.call(this, program, uniforms) || this;
            _this.padding = 0;
            _this.resolution = settings.FILTER_RESOLUTION;
            _this.multisample = settings.FILTER_MULTISAMPLE;
            _this.enabled = true;
            _this.autoFit = true;
            _this.state = new State();
            return _this;
        }
        /**
         * Applies the filter
         *
         * @param {PIXI.FilterSystem} filterManager - The renderer to retrieve the filter from
         * @param {PIXI.RenderTexture} input - The input render target.
         * @param {PIXI.RenderTexture} output - The target to output to.
         * @param {PIXI.CLEAR_MODES} [clearMode] - Should the output be cleared before rendering to it.
         * @param {object} [currentState] - It's current state of filter.
         *        There are some useful properties in the currentState :
         *        target, filters, sourceFrame, destinationFrame, renderTarget, resolution
         */
        Filter.prototype.apply = function (filterManager, input, output, clearMode, _currentState) {
            // do as you please!
            filterManager.applyFilter(this, input, output, clearMode);
            // or just do a regular render..
        };
        Object.defineProperty(Filter.prototype, "blendMode", {
            /**
             * Sets the blend mode of the filter.
             *
             * @default PIXI.BLEND_MODES.NORMAL
             */
            get: function () {
                return this.state.blendMode;
            },
            set: function (value) {
                this.state.blendMode = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Filter.prototype, "resolution", {
            /**
             * The resolution of the filter. Setting this to be lower will lower the quality but
             * increase the performance of the filter.
             */
            get: function () {
                return this._resolution;
            },
            set: function (value) {
                this._resolution = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Filter, "defaultVertexSrc", {
            /**
             * The default vertex shader source
             *
             * @constant
             */
            get: function () {
                return defaultVertex$1;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Filter, "defaultFragmentSrc", {
            /**
             * The default fragment shader source
             *
             * @constant
             */
            get: function () {
                return defaultFragment$1;
            },
            enumerable: false,
            configurable: true
        });
        return Filter;
    }(Shader));
  
    var vertex = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 otherMatrix;\n\nvarying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;\n}\n";
  
    var fragment = "varying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform sampler2D mask;\nuniform float alpha;\nuniform float npmAlpha;\nuniform vec4 maskClamp;\n\nvoid main(void)\n{\n    float clip = step(3.5,\n        step(maskClamp.x, vMaskCoord.x) +\n        step(maskClamp.y, vMaskCoord.y) +\n        step(vMaskCoord.x, maskClamp.z) +\n        step(vMaskCoord.y, maskClamp.w));\n\n    vec4 original = texture2D(uSampler, vTextureCoord);\n    vec4 masky = texture2D(mask, vMaskCoord);\n    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);\n\n    original *= (alphaMul * masky.r * alpha * clip);\n\n    gl_FragColor = original