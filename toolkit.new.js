'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  var Request,
      Toolkit,
      ToolkitGuts,
      ToolkitSelection,
      ToolkitVirtualFragment,
      _RequestModule,
      _SelectionModule,
      _Toolkit,
      _VirtualDOM,
      _sentinel,
      callable,
      guts,
      toolkit,
      indexOf = [].indexOf;

  _sentinel = {};

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
          if (typeof obj[name] === 'function') {
            func[name] = obj[name];
          } else {
            Object.defineProperty(func, name, Object.getOwnPropertyDescriptor(obj, name));
          }
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

      this.initFunctions = [];
      this.inspectionFunctions = [];
      this.modules = [];
      return;
    }

    _createClass(ToolkitGuts, [{
      key: 'attach',
      value: function attach(Module) {
        this.modules.push(Module);
        return this;
      }
    }, {
      key: 'onto',
      value: function onto(tk) {
        var Module, inst, j, len, ref;
        ref = this.modules;
        for (j = 0, len = ref.length; j < len; j++) {
          Module = ref[j];
          inst = new Module(tk);
          if (inst.called) {
            tk[inst.called] = inst;
          }
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
    function Request(tk1, method, url) {
      _classCallCheck(this, Request);

      this.tk = tk1;
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
          _this.tk.log('Recieved ' + status + ' (' + _this.info.method + ', ' + _this.info.url + ')');
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

  guts.attach(callable(_RequestModule = function () {
    function _RequestModule(tk1) {
      _classCallCheck(this, _RequestModule);

      this.tk = tk1;
      this.called = 'request';
    }

    _createClass(_RequestModule, [{
      key: '_call',
      value: function _call(method, url) {
        return new Request(this, method, url);
      }
    }]);

    return _RequestModule;
  }()));

  ToolkitSelection = function () {
    var ToolkitSelection = function () {
      _createClass(ToolkitSelection, null, [{
        key: 'clean',
        value: function clean(set) {
          var clean, item, j, len;
          clean = [];
          for (j = 0, len = set.length; j < len; j++) {
            item = set[j];
            if (item instanceof ToolkitSelection) {
              clean = clean.concat(item.set);
            } else {
              clean.push(item);
            }
          }
          return clean;
        }
      }]);

      function ToolkitSelection(selection, parent1) {
        _classCallCheck(this, ToolkitSelection);

        this.parent = parent1;
        //	Resolve the selection set.
        if (selection instanceof ToolkitSelection) {
          this.set = selection.set.slice();
        } else if (selection instanceof Element || selection instanceof Node || selection instanceof Window) {
          this.set = [selection];
        } else if (selection instanceof NodeList || selection instanceof Array) {
          this.set = ToolkitSelection.clean(selection);
        } else if (typeof selection === 'string') {
          this.set = ToolkitSelection.tk.config.root.querySelectorAll(selection);
        } else {
          throw 'Illegal selection';
        }
        this.length = this.set.length;
        this.empty = this.length === 0;
      }

      _createClass(ToolkitSelection, [{
        key: 'back',
        value: function back() {
          if (!this.parent) {
            throw 'Illegal back';
          }
          return this.parent;
        }
      }, {
        key: 'ith',
        value: function ith(i) {
          var wrap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

          if (i < 0 || i > this.length) {
            throw 'Out of bounds: ' + i;
          }
          if (wrap) {
            return new ToolkitSelection(this.set[i], this);
          } else {
            return this.set[i];
          }
        }
      }, {
        key: 'first',
        value: function first() {
          var wrap = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

          return this.ith(0, wrap);
        }
      }, {
        key: 'reversed',
        value: function reversed() {
          var set;
          set = this.set.slice();
          set.reverse();
          return new ToolkitSelection(set, this);
        }
      }, {
        key: 'reduce',
        value: function reduce(reducer) {
          var set;
          switch (typeof reducer === 'undefined' ? 'undefined' : _typeof(reducer)) {
            case 'string':
              set = this.compr(function (el) {
                if (el.is(reducer)) {
                  return el;
                }
              });
              break;
            case 'function':
              set = this.compr(reducer);
              break;
            default:
              throw 'Illegal reducer';
          }
          return new ToolkitSelection(set, this);
        }
      }, {
        key: 'extend',
        value: function extend(extension) {
          var set;
          if (extension instanceof ToolkitSelection) {
            set = extension.set;
          } else if (extension instanceof Array || extension instanceof NodeList) {
            set = ToolkitSelection.clean(extension);
          } else {
            throw 'Illegal extension';
          }
          return new ToolkitSelection(this.set.concat(set, this));
        }
      }, {
        key: 'parents',
        value: function parents() {
          var condition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '*';
          var high = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

          var checkElement, conditionType, set;
          conditionType = ['string', 'function'].indexOf(typeof condition === 'undefined' ? 'undefined' : _typeof(condition));
          if (conditionType < 0) {
            throw 'Illegal condition';
          }
          checkElement = function checkElement(element, index) {
            if (conditionType === 0) {
              return e.is(condition);
            } else {
              return condition(element, index);
            }
          };
          set = [];
          this.iter(function (el, i) {
            var parent;
            parent = el.parentNode;
            while (parent !== ToolkitSelection.tk.config.root) {
              if (checkElement(parent, i)) {
                set.push(parent);
              }
              if (!high) {
                return;
              }
              parent = parent.parentNode;
            }
          });
          return new ToolkitSelection(set, this);
        }
      }, {
        key: 'children',
        value: function children() {
          var condition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '*';
          var deep = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

          var conditionType, fullSet;
          conditionType = ['string', 'function'].indexOf(typeof condition === 'undefined' ? 'undefined' : _typeof(condition));
          if (conditionType < 0) {
            throw 'Illegal condition';
          }
          fullSet = [];
          this.iter(function (el, i) {
            var check, child, j, k, len, len1, ref, set, wrapped;
            el = el.first(false);
            if (el.nodeType === Node.TEXT_NODE) {
              return;
            }
            set = [];
            if (conditionType === 0) {
              if (deep) {
                set = el.querySelectorAll(condition);
              } else {
                ref = el.children;
                for (j = 0, len = ref.length; j < len; j++) {
                  child = ref[j];
                  if (child.matches(condition)) {
                    set = child;
                  }
                }
              }
            } else {
              check = deep ? el.querySelectorAll('*') : el.children;
              wrapped = new ToolkitSelection(check);
              for (k = 0, len1 = check.length; k < len1; k++) {
                child = check[k];
                if (condition(wrap, i)) {
                  set = child;
                }
              }
            }
            return fullSet = fullSet.concat(set);
          });
          return new ToolkitSelection(fullSet, this);
        }
      }, {
        key: 'copy',
        value: function copy() {
          var copy;
          copy = this.set[0].cloneNode(true);
          return new ToolkitSelection(copy, this);
        }

        //	---- Iteration and comprehension ----

      }, {
        key: 'iter',
        value: function iter(callback) {
          var el, i, j, len, ref;
          ref = this.set;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            el = ref[i];
            el = new ToolkitSelection(el);
            if (callback(el, i) === false) {
              break;
            }
          }
          return this;
        }
      }, {
        key: 'compr',
        value: function compr(callback) {
          var el, i, j, len, ref, result, value;
          result = [];
          ref = this.set;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            el = ref[i];
            el = new ToolkitSelection(el);
            value = callback(el, i);
            if (value !== void 0) {
              result.push(value);
            }
          }
          return result;
        }
      }, {
        key: 'is',
        value: function is(check) {
          var checkType, el, i, j, len, ref;
          checkType = ['string', 'function'].indexOf(typeof check === 'undefined' ? 'undefined' : _typeof(check));
          ref = this.set;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            el = ref[i];
            if (checkType === 0 && !e.matches(check)) {
              return false;
            } else if (checkType === 1 && !check(new ToolkitSelection(e), i)) {
              return false;
            }
          }
          return true;
        }
      }, {
        key: 'classes',
        value: function classes() {
          var all, cls, el, i, j, k, len, len1, mine, ref;
          all = [];
          ref = this.set;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            el = ref[i];
            mine = el.className.split(/\s+/);
            for (k = 0, len1 = mine.length; k < len1; k++) {
              cls = mine[k];
              if (indexOf.call(all, cls) < 0) {
                all.push(cls);
              }
            }
          }
          return all;
        }
      }, {
        key: 'value',
        value: function value() {
          var _value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _sentinel;

          if (_value === _sentinel) {
            //	Get.
            if (this.set[0].type === 'checkbox') {
              return this.set[0].checked;
            }
            _value = this.set[0].value;
            if (!_value) {
              return null;
            } else if (this.set[0].type === 'number') {
              return +_value;
            } else {
              return _value;
            }
          } else {
            //	Set.
            this.iter(function (el) {
              if (el.tag().toLowerCase() === 'select') {
                return el.children('option').attr('selected', function (gl) {
                  if (gl.attr('value' === _value)) {
                    return true;
                  } else {
                    return null;
                  }
                });
              } else {
                return el.first(false).value = _value;
              }
            });
          }
          return this;
        }
      }, {
        key: 'attr',
        value: function attr(nameOrMap) {
          var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _sentinel;

          var el, j, len, ref;
          if (typeof nameOrMap === 'string') {
            if (value === _sentinel) {
              //	Get.
              return this.first().attr(nameOrMap);
            } else {
              ref = this.set;
              //	Set.
              for (j = 0, len = ref.length; j < len; j++) {
                el = ref[j];
                if (value === null) {
                  el.removeAttribute(nameOrMap);
                } else {
                  el.setAttribute(nameOrMap, value);
                }
              }
              return this;
            }
          } else if ((typeof nameOrMap === 'undefined' ? 'undefined' : _typeof(nameOrMap)) === 'object') {
            this.iter(function (el) {
              var key;
              for (key in nameOrMap) {
                value = nameOrMap[key];
                el.attr(key, value);
              }
            });
            return this;
          } else {
            throw 'Illegal argument';
          }
        }
      }, {
        key: 'css',
        value: function css(propertyOrMap) {
          var _this2 = this;

          var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _sentinel;

          var applyOne, name;
          applyOne = function applyOne(name, value) {
            name = name.replace(/-([a-z])/g, function (g) {
              return g[1].toUpperCase();
            });
            return _this2.iter(function (el, i) {
              var resolved;
              resolved = ToolkitSelection.tk.resolve(value, el, i);
              if (typeof resolved === 'number') {
                resolved += 'px';
              }
              return el.set[0].style[name] = resolved;
            });
          };
          if (typeof propertyOrMap === 'string') {
            if (value === _sentinel) {
              //	Get.
              return window.getComputedStyle(this.set[0]).getPropertyValue(propertyOrMap);
            } else {
              applyOne(propertyOrMap, value);
            }
          } else if ((typeof propertyOrMap === 'undefined' ? 'undefined' : _typeof(propertyOrMap)) === 'object') {
            for (name in propertyOrMap) {
              value = propertyOrMap[name];
              applyOne(name, value);
            }
          } else {
            throw 'Illegal argument';
          }
          return this;
        }
      }, {
        key: 'on',
        value: function on(nameOrMap) {
          var _this3 = this;

          var _callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _sentinel;

          var attachOne, j, key, len, ref, repr, value;
          attachOne = function attachOne(name, value) {
            return _this3.iter(function (el, i) {
              var pure, repr;
              pure = el.first(false);
              if (!pure.__listeners__) {
                pure.__listeners__ = [];
              }
              repr = {
                event: ToolkitSelection.tk.resolve(event, el, i),
                callback: function callback(g) {
                  return _callback(el, g, i);
                }
              };
              pure.__listeners__.push(repr);
              return pure.addEventListener(repr.event, repr.callback);
            });
          };
          if (typeof nameOrMap === 'string') {
            if (_callback === _sentinel) {
              //	Get.
              if (pure.__listeners__ != null) {
                ref = pure.__listeners__;
                for (j = 0, len = ref.length; j < len; j++) {
                  repr = ref[j];
                  return repr.callback;
                }
              } else {
                return [];
              }
            } else {
              attachOne(nameOrMap, _callback);
            }
          } else if ((typeof nameOrMap === 'undefined' ? 'undefined' : _typeof(nameOrMap)) === 'object') {
            for (key in nameOrMap) {
              value = nameOrMap[key];
              attachOne(name, value);
            }
          } else {
            throw 'Illegal argument';
          }
          return this;
        }
      }, {
        key: 'off',
        value: function off(name) {
          var el, j, k, len, len1, list, ref, repr;
          ref = this.set;
          for (j = 0, len = ref.length; j < len; j++) {
            el = ref[j];
            list = el.__listeners__ != null || [];
            for (k = 0, len1 = list.length; k < len1; k++) {
              repr = list[k];
              if (repr.event === name) {
                el.removeEventListener(repr.event, repr.callback);
              }
            }
            el.__listeners__ = function () {
              var l, len2, results;
              results = [];
              for (l = 0, len2 = list.length; l < len2; l++) {
                repr = list[l];
                if (repr.event !== name) {
                  results.push(repr);
                }
              }
              return results;
            }();
          }
          return this;
        }
      }, {
        key: 'classify',
        value: function classify(classOrMap) {
          var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
          var time = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _sentinel;

          var _classifyOne, flag, name, ref;
          _classifyOne = function classifyOne(name, flag, time) {
            if (flag === 'toggle') {
              //	Special second parameter case.
              flag = function flag(el, i) {
                return !e.is(selector);
              };
            }
            return this.iter(function (el, i) {
              var classes, flagValue, has, index, timeValue;
              flagValue = ToolkitSelection.tk.resolve(flag, el, i);
              classes = el.classes();
              has = indexOf.call(classes, name) >= 0;
              if (flagValue && !has) {
                classes.push(name);
              } else if (!flagValue && has) {
                index = classes.indexOf(name);
                classes.splice(index, 1);
              }
              el.set[0].className = classes.join(' ').trim();
              if (time !== _sentinel) {
                timeValue = ToolkitSelection.tk.resolve(time, el, i);
                return ToolkitSelection.tk.timeout(timeValue, function (el) {
                  return _classifyOne(name, !actualFlag, _sentinel);
                });
              }
            });
          };
          if (typeof classOrMap === 'string') {
            _classifyOne(classOrMap, value, time);
          } else {
            ref = this.classOrMap;
            for (name in ref) {
              flag = ref[name];
              _classifyOne(name, flag);
            }
          }
          return this;
        }
      }, {
        key: 'remove',
        value: function remove() {
          var el, j, len, ref;
          ref = this.set;
          for (j = 0, len = ref.length; j < len; j++) {
            el = ref[j];
            if (el.parentNode !== null) {
              el.parentNode.removeChild(el);
            }
          }
          return this;
        }
      }, {
        key: 'append',
        value: function append(children) {
          var child, inspected, j, len, ref;
          children = new ToolkitSelection(children, this);
          children.remove();
          inspected = children.extend(children.children());
          ToolkitSelection.tk.guts.inspect(inspected);
          ref = children.set;
          for (j = 0, len = ref.length; j < len; j++) {
            child = ref[j];
            this.set[0].appendChild(child);
          }
          return children;
        }
      }, {
        key: 'prepend',
        value: function prepend(children) {
          var child, inspected, j, ref;
          children = new ToolkitSelection(children, this);
          children.remove();
          inspected = children.extend(children.children());
          ToolkitSelection.tk.guts.inspect(inspected);
          ref = children.set;
          for (j = ref.length - 1; j >= 0; j += -1) {
            child = ref[j];
            this.set[0].prepend(child);
          }
          return children;
        }
      }, {
        key: 'tag',
        value: function tag() {
          return this.set[0].tagName;
        }
      }, {
        key: 'next',
        value: function next() {
          var ref;
          return new ToolkitSelection((ref = this.set[0]) != null ? ref.nextElementSibling : void 0, this);
        }
      }, {
        key: 'prev',
        value: function prev() {
          var ref;
          return new ToolkitSelection((ref = this.set[0]) != null ? ref.prevElementSibling : void 0, this);
        }
      }, {
        key: 'html',
        value: function html() {
          var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _sentinel;

          if (value === _sentinel) {
            //	Get.
            return this.set[0].innerHTML;
          } else {
            this.iter(function (el, i) {
              return el.set[0].innerHTML = ToolkitSelection.tk.resolve(value, el, i);
            });
          }
          return this;
        }
      }, {
        key: 'text',
        value: function text() {
          var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _sentinel;

          if (value === _sentinel) {
            //	Get.
            return this.set[0].textContent;
          } else {
            this.iter(function (el, i) {
              return el.set[0].textContent = ToolkitSelection.tk.resolve(value, el, i);
            });
          }
          return this;
        }
      }, {
        key: 'select',
        value: function select() {
          this.set[0].select();
          return this;
        }
      }, {
        key: 'offset',
        value: function offset() {
          var toParent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

          var el, o;
          o = {
            x: 0,
            y: 0
          };
          el = this.set[0];
          while (el) {
            o.x += el.offsetLeft;
            o.y += el.offsetRight;
            if (toParent) {
              break;
            }
            el = el.offsetParent;
          }
          return o;
        }
      }, {
        key: 'size',
        value: function size() {
          var includeInner = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

          var box, el, size, style;
          el = this.set[0];
          box = el.getBoundingClientRect();
          size = {
            width: box.width,
            height: box.height
          };
          if (includeInner) {
            style = window.getComputedStyle(el, null);
            size.width += style.getPropertyValue('margin-left');
            size.width += style.getPropertyValue('margin-right');
            size.height += style.getPropertyValue('margin-top');
            size.height += style.getPropertyValue('margin-bottom');
            if ('border-box' === style.getPropertyValue('box-sizing')) {
              size.width += style.getPropertyValue('padding-left');
              size.width += style.getPropertyValue('padding-right');
              size.height += style.getPropertyValue('padding-top');
              size.height += style.getPropertyValue('padding-bottom');
            }
          }
          return size;
        }
      }]);

      return ToolkitSelection;
    }();

    ;

    ToolkitSelection.tk = null;

    return ToolkitSelection;
  }.call(this);

  guts.attach(_SelectionModule = function _SelectionModule(tk) {
    _classCallCheck(this, _SelectionModule);

    tk.ToolkitSelection = ToolkitSelection;
    ToolkitSelection.tk = tk;
  });

  ToolkitVirtualFragment = function () {
    function ToolkitVirtualFragment(elementGenerator) {
      _classCallCheck(this, ToolkitVirtualFragment);

      this.elementGenerator = elementGenerator;
      this._data = null;
    }

    _createClass(ToolkitVirtualFragment, [{
      key: 'data',
      value: function data(_data2) {
        this._data = _data2;
        return this;
      }
    }, {
      key: 'render',
      value: function render() {
        var item, _renderOne;
        _renderOne = function renderOne(node) {
          var child;
          if (typeof node === 'string') {
            return tk(document.createTextNode(node));
          }
          return tk.tag(node.tag).attr(node.properties).append(function () {
            var j, len, ref, results;
            ref = node.children;
            results = [];
            for (j = 0, len = ref.length; j < len; j++) {
              child = ref[j];
              results.push(_renderOne(child));
            }
            return results;
          }()).back();
        };
        return tk(function () {
          var j, len, ref, results;
          ref = this._data;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            item = ref[j];
            results.push(_renderOne(this.elementGenerator(item)));
          }
          return results;
        }.call(this));
      }
    }]);

    return ToolkitVirtualFragment;
  }();

  guts.attach(callable(_VirtualDOM = function () {
    function _VirtualDOM() {
      _classCallCheck(this, _VirtualDOM);

      this.called = 'virtual';
    }

    _createClass(_VirtualDOM, [{
      key: '_call',
      value: function _call(element) {
        return new ToolkitVirtualFragment(element);
      }
    }, {
      key: 'tag',
      value: function tag(_tag, properties) {
        for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          children[_key - 2] = arguments[_key];
        }

        return {
          tag: _tag,
          properties: properties || {},
          children: children
        };
      }
    }]);

    return _VirtualDOM;
  }()));

  Toolkit = callable(_Toolkit = function () {
    function _Toolkit() {
      var _this4 = this;

      _classCallCheck(this, _Toolkit);

      //	Define the 'here' debug helper.
      Object.defineProperty(this, 'here', {
        get: function get() {
          return _this4.log('here');
        }
      });
    }

    _createClass(_Toolkit, [{
      key: '_call',
      value: function _call(selection) {
        return new ToolkitSelection(selection);
      }
    }, {
      key: '_finalize',
      value: function _finalize(config) {
        var _this5 = this;

        var ref, ref1;
        //	Read config.
        this.config = {
          root: (ref = config.root) != null ? ref : typeof document !== "undefined" && document !== null ? document : null,
          debug: (ref1 = config.debug) != null ? ref1 : false
        };

        //	Create guts.
        this.guts = guts.onto(this);
        //	Prepare initialization.
        if (/complete|loaded|interactive/.test(typeof document !== "undefined" && document !== null ? document.readyState : void 0)) {
          this.guts.init();
        } else if (typeof window !== "undefined" && window !== null) {
          window.addEventListener('DOMContentLoaded', function () {
            return _this5.guts.init();
          });
        }
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
        var ref;

        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        if ((ref = this.config) != null ? ref.debug : void 0) {
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
          for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
            args[_key3 - 1] = arguments[_key3];
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
    }, {
      key: 'tag',
      value: function tag(tagName) {
        var attributes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var children = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

        var child, el, j, key, len, value;
        el = document.createElement(tagName);
        for (key in attributes) {
          value = attributes[key];
          el.setAttribute(key, value);
        }
        for (j = 0, len = children.length; j < len; j++) {
          child = children[j];
          el.appendChild(this.tag(child));
        }
        return new ToolkitSelection(el);
      }
    }]);

    return _Toolkit;
  }());

  //	Export either to the window or as a module, depending on context.s
  toolkit = {
    create: function create() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var tk;
      tk = new Toolkit();
      tk._finalize(config);
      return tk;
    }
  };

  if (typeof window !== "undefined" && window !== null) {
    window.toolkit = toolkit;
  } else {
    module.exports = toolkit;
  }
}).call(undefined);