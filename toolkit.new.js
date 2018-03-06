'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  var Request, RequestModule, Toolkit, ToolkitGuts, _Toolkit, callable, guts, toolkit;

  callable = function callable(Class) {
    return function () {
      var func, inst, j, len, name, names, obj;
      //	Create an instance.
      inst = new Class();
      //	Create a function that invokes _call()
      func = function func() {
        return inst._call.apply(this, arguments);
      };

      //	Copy the properties of the instance onto the function.
      obj = inst;
      while (true) {
        names = Object.getOwnPropertyNames(obj);
        for (j = 0, len = names.length; j < len; j++) {
          name = names[j];
          func[name] = inst[name];
        }
        if (!(obj = Object.getPrototypeOf(obj))) {
          break;
        }
      }

      //	Return the function.
      return func;
    };
  };

  //	The protected internals of the base Toolkit instance. Nothing within this
  //	object should be considered exposed.
  ToolkitGuts = function () {
    function ToolkitGuts() {
      _classCallCheck(this, ToolkitGuts);
    }

    _createClass(ToolkitGuts, [{
      key: 'contructor',
      value: function contructor() {
        this.initFunctions = [];
        this.inspectionFunctions = [];
        return this.modules = [];
      }
    }, {
      key: 'attach',
      value: function attach(Module) {
        this.Modules.push(module);
        return this;
      }
    }, {
      key: 'onto',
      value: function onto(tk) {
        var Module, j, len, ref;
        ref = this.Modules;
        for (j = 0, len = ref.length; j < len; j++) {
          Module = ref[j];
          tk[Module.name] = new Module(this);
        }
        return this;
      }
    }, {
      key: 'init',
      value: function init() {
        var f, j, len, ref;
        ref = this.initFunctions;
        for (j = 0, len = ref.length; j < len; j++) {
          f = ref[j];
          f();
        }
        return this;
      }
    }, {
      key: 'inspect',
      value: function inspect(check) {
        var f, j, len, ref;
        ref = this.inspectionFunctions;
        for (j = 0, len = ref.length; j < len; j++) {
          f = ref[j];
          f(check);
        }
        return this;
      }
    }]);

    return ToolkitGuts;
  }();

  //	Create the guts.	
  guts = new ToolkitGuts();

  Request = function () {
    var Request = function () {
      function Request(method, url) {
        _classCallCheck(this, Request);

        this.info = {
          method: method,
          url: url,
          success: function success() {
            return {};
          },
          failure: function failure() {
            return {};
          },
          query: {},
          headers: {},
          body: null
        };
      }

      _createClass(Request, [{
        key: 'success',
        value: function success(callback) {
          this.info.success = callback;
          return this;
        }
      }, {
        key: 'failure',
        value: function failure(callback) {
          this.info.failure = callback;
          return this;
        }
      }, {
        key: 'json',
        value: function json(data) {
          this.info.headers['Content-Type'] = 'application/json';
          this.info.body = this.tk.unbound(data);
          return this;
        }
      }, {
        key: 'data',
        value: function data(_data) {
          var mimetype = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'text/plain';

          this.info.headers['Content-Type'] = mimetype;
          this.info.body = _data;
          return this;
        }
      }, {
        key: 'header',
        value: function header(key, value) {
          this.info.headers[key] = value;
          return this;
        }
      }, {
        key: 'query',
        value: function query(map) {
          this.info.query = map;
          return this;
        }

        //	TODO: More mimetype support.

      }, {
        key: 'send',
        value: function send() {
          var _this = this;

          var fullURL, key, mimetypeOut, processResponse, queryKeys, queryStatements, ref, serializedBody, value, xhr;
          //	Declare response callback.
          processResponse = function processResponse(xhr) {
            var data, mimetype, status;
            status = xhr.status;
            mimetype = xhr.getResponseHeader('Content-Type');
            data = xhr.responseText;
            switch (mimetype) {
              case 'application/json':
                data = JSON.parse(data);
            }
            _this.tk.log('Recieved ' + status + ' (' + _this.info.method + ', ' + _this.info.url(')'));
            return (status < 400 ? _this.info.success : _this.info.failure)(data, status);
          };

          //	Prepare data.
          fullURL = this.info.url;
          serializedBody = '';
          queryKeys = Object.keys(this.info.query);
          if (queryKeys > 0) {
            queryStatements = function () {
              var j, len, results;
              results = [];
              for (j = 0, len = queryKeys.length; j < len; j++) {
                key = queryKeys[j];
                results.push(key + '=' + encodeURIComponent(this.info.query[key]));
              }
              return results;
            }.call(this);
            fullURL += '?' + queryStatements.join('&');
          }
          if (this.info.body) {
            mimetypeOut = this.info.headers['Content-Type'];
            switch (mimetypeOut) {
              case 'application/json':
                serializedBody = JSON.stringify(this.info.body);
                break;
              default:
                throw 'Unknown outgoing mimetype ' + mimetypeOut;
            }
          }
          //	Prepare an XHR.
          xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function () {
            if (this.readyState === 4) {
              return processResponse(this);
            }
          };
          xhr.open(this.info.method, fullURL, true);
          ref = this.info.headers;
          for (key in ref) {
            value = ref[key];
            xhr.setRequestHeader(key, value);
          }
          xhr.send(serializedBody);
          return this.tk.log('Sent (' + this.info.method + ', ' + this.info.url + ')', this.info.body);
        }
      }]);

      return Request;
    }();

    ;

    Request.tk = null;

    return Request;
  }.call(this);

  guts.attach(callable(RequestModule = function () {
    var RequestModule = function () {
      function RequestModule(tk) {
        _classCallCheck(this, RequestModule);

        Request.tk = tk;
      }

      _createClass(RequestModule, [{
        key: '_call',
        value: function _call(method, url) {
          return new Request(method, url);
        }
      }]);

      return RequestModule;
    }();

    ;

    RequestModule.name = 'request';

    return RequestModule;
  }.call(this)));

  Toolkit = callable(_Toolkit = function () {
    function _Toolkit(config) {
      var _this2 = this;

      _classCallCheck(this, _Toolkit);

      var ref;
      //	Create guts.
      this.guts = guts.onto(this);
      //	Read config.
      this.debug = (ref = config.debug) != null ? ref : false;
      //	Define the 'here' debug helper.
      Object.defineProperty(this, 'here', {
        get: function get() {
          return _this2.log('here');
        }
      });
      //	Prepare initialization.
      if (/complete|loaded|interactive/.test(typeof document !== "undefined" && document !== null ? document.readyState : void 0)) {
        this.guts.init();
      } else if (typeof window !== "undefined" && window !== null) {
        window.addEventListender('DOMContentLoaded', function () {
          return _this2.guts.init();
        });
      }
    }

    _createClass(_Toolkit, [{
      key: '_call',
      value: function _call(selection) {
        return new ToolkitSelection(selection);
      }

      //	Initialization callback registery.

    }, {
      key: 'init',
      value: function init(callback) {
        this.guts.initFunctions.push(callback);
        return this;
      }

      //	Element inspection registery.

    }, {
      key: 'inspection',
      value: function inspection(callback) {
        this.guts.inspectionFunctions.push(callback);
        return this;
      }

      //	Logging.

    }, {
      key: 'log',
      value: function log() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        if (this.debug) {
          console.log.apply(null, args);
        }
        return args[0];
      }

      //	Function name retrieval.

    }, {
      key: 'nameOf',
      value: function nameOf(func) {
        var ref;
        return (/^function\s+([\w\$]+)\s*\(/.exec((ref = func.toString()) != null ? ref : '<anonymous function>')
        );
      }

      //	Resolve a potentially functional parameter.

    }, {
      key: 'resolve',
      value: function resolve(thing) {
        if (typeof thing !== 'function') {
          return thing;
        } else {
          for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }

          return thing.apply(null, args);
        }
      }

      //	Current time in milliseconds.

    }, {
      key: 'time',
      value: function time() {
        return new Date().getTime();
      }

      //	Numerical range generation.

    }, {
      key: 'range',
      value: function range(max) {
        var realMax = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        var i, j, min, ref, ref1, results;
        //	Parse var-args.
        min = 0;
        if (realMax) {
          min = max;
          max = realMax;
        }
        results = [];
        for (i = j = ref = min, ref1 = max; ref <= ref1 ? j < ref1 : j > ref1; i = ref <= ref1 ? ++j : --j) {
          results.push(i);
        }
        return results;
      }

      //	Iteration.

    }, {
      key: 'iter',
      value: function iter(iterable, callback) {
        var i, item, j, len, name, results, results1, value;
        if (iterable instanceof Array) {
          results = [];
          for (i = j = 0, len = interable.length; j < len; i = ++j) {
            item = interable[i];
            results.push(callback(item, i));
          }
          return results;
        } else if ((typeof iterable === 'undefined' ? 'undefined' : _typeof(iterable)) === 'object') {
          results1 = [];
          for (name in iterable) {
            value = iterable[name];
            results1.push(callback(name, value));
          }
          return results1;
        } else {
          throw 'Not iterable: ' + iterable;
        }
      }

      //	Comprehension.

    }, {
      key: 'compr',
      value: function compr(array, callback) {
        var i, item, j, len, result, returned;
        result = [];
        for (i = j = 0, len = array.length; j < len; i = ++j) {
          item = array[i];
          returned = callback(item, i);
          if (returned != null) {
            result.push(returned);
          }
        }
        return returned;
      }
    }]);

    return _Toolkit;
  }());

  //	Export either to the window or as a module, depending on context.s
  toolkit = {
    create: function create() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return new Toolkit(config);
    }
  };

  if (typeof window !== "undefined" && window !== null) {
    window.toolkit = toolkit;
  } else {
    module.exports = toolkit;
  }
}).call(undefined);