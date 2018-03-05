(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var selection_1 = require("./selection");
require("./features/snap");
var toolkit;
(function (toolkit) {
    function makeCallable(cls, func) {
        for (var prop in cls.prototype) {
            func[prop] = cls.prototype[prop];
        }
        ;
        return func;
    }
    toolkit.makeCallable = makeCallable;
    var _Toolkit = /** @class */ (function () {
        function _Toolkit() {
        }
        _Toolkit.prototype._init = function () {
        };
        return _Toolkit;
    }());
    toolkit._Toolkit = _Toolkit;
    var features = {};
    function feature(name, onCall) {
        return function (target) {
            features[name] = {
                target: target,
                onCall: onCall || (function () { })
            };
            console.log('attached ' + name);
        };
    }
    toolkit.feature = feature;
    //	Import features.
    function create() {
        var inst = makeCallable(_Toolkit, function (selection) {
            return new selection_1.ToolkitSelection(selection);
        });
        inst._init();
        for (var name in features) {
            var feature = features[name];
            inst[name] = makeCallable(feature.target, function () {
                feature.onCall(inst);
            });
            inst[name]._init.apply(inst);
        }
        return inst;
    }
    toolkit.create = create;
})(toolkit = exports.toolkit || (exports.toolkit = {}));

},{"./features/snap":2,"./selection":3}],2:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("../core");
var _Snap = /** @class */ (function () {
    function _Snap() {
    }
    _Snap.prototype._init = function () {
    };
    _Snap = __decorate([
        core_1.toolkit.feature('snap', function (tk) {
            console.log('snap');
        })
    ], _Snap);
    return _Snap;
}());

},{"../core":1}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var ToolkitSelection = /** @class */ (function () {
    function ToolkitSelection(selection) {
        console.log('created instance');
    }
    return ToolkitSelection;
}());
exports.ToolkitSelection = ToolkitSelection;

},{}],4:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var core_1 = require("./core");
core_1.toolkit.create()();

},{"./core":1}]},{},[4]);
