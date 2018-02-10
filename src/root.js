'use strict';
function createToolkit(){
	/*
		Create an instance of the toolkit library. Canonically, this is 
		assigned to a variable named `tk`.
	*/

	//	A sentinel value used internally.
	var _sentinel = new Object();
	
	var tk = function(selection){
		return new ToolkitSelection(selection);
	}

	tk.initFunctions = [];

	/* ---- Function definitions ---- */
	tk.fn = {
		eatCall: function(){},
		identity: function(a){ return a; },
		contradiction: function(){ return false; },
		tautology: function(){ return true; },
		resign: function(a){ return -a; },
		negation: function(a){ return !a; }
	}

	/* ---- Default configuration ---- */
	//	TODO: Allow override.
	tk.config = {
		debug: false,
		documentRoot: document,
		callbacks: {
			preInsert: tk.fn.eatCall,
			preRequest: tk.fn.eatCall
		}
	}

	function applyOverride(src, dest){
		for (var key in src){
			if (typeof dest[key] == 'object'){
				applyOverride(src[key], dest[key]);
			}
			else if (src[key] !== undefined) {
				dest[key] = src[key];
			}
		}
	}

	if (arguments.length > 0){
		applyOverride(tk.config, arguments[0]);
	}


	/* ---- Core utility functions ---- */
	tk.varg = function(args, i, defaultValue){
		/*
			Return the `i`th member of `args`, or `defaultValue` if there are 
			fewer than `i` arguments.
		*/
		return args.length > i ? args[i] : defaultValue;
	}
	tk.varg.on = function(args){
		/*
			Return a function that is equivalent to `tk.varg`, except that 
			the first parameter can be omitted and is invariantly `args`.
		*/
		return function(i, defaultValue){
			return tk.varg(args, i, defaultValue);
		}
	}

	tk.prop = function(object, property){
		/*
			::argspec -
			Return whether `object` has a property named the value of 
			`property`.

			::argspec -, defaultValue
			Return the value of the property of `object` named `property`, or 
			`defaultValue` if it doesn't exist.
		*/
		var defaultValue = tk.varg(arguments, 2, _sentinel),
			hasProperty = object.hasOwnProperty(property);
		if (defaultValue === _sentinel){
			return hasProperty;
		}
		return hasProperty ? object[property] : defaultValue;
	}
	tk.prop.on = function(object){
		/*
			Return a function that is equivalent to `tk.prop`, except that 
			the first parameter can be omitted and is invariantly `object`.
		*/
		return function(property){
			tk.prop.apply(this, [
				object, 
				property, 
				tk.varg(arguments, 1, _sentinel)
			]);
		}
	}

	tk.extends = function(object, cls){
		/*
			Make `object` a proper subclass of `cls`.
		*/
		var args = [].slice.call(arguments);
		args.splice(0, 2);
		args = [object].concat(args);
		cls.apply(object, args);
	}

	tk.functionName = function(func){
		/*
			Return the name of `func` or `'<anonymous function>'` if the 
			function has no name.
		*/
		var name = /^function\s+([\w\$]+)\s*\(/.exec(func.toString());
		return name ? name[1] : '<anonymous function>';
	}

	tk.typeCheck = function(object){
		/*
			::argspec -, type0, ..., typeN
			Return the index of the type of `object` in the list of types 
			supplied beyond the first positional argument, or throw an 
			exception if `object` is none of those types.
		*/
		for (var i = 1; i < arguments.length; i++){
			var check = arguments[i];
			if (check === null) {
				//	Null check.
				if (object === null){
					return i - 1;
				}
			}
			else if (typeof object == check){
				//	Typeof check.
				return i - 1;
			}
			else {
				//	Class check.
				try {
					if (object instanceof check){
						return i - 1;
					}
				}
				catch (e){}
			}
		}
		//	No match found, create and throw a formatted error.
		var expected = [];
		for (var i = 1; i < arguments.length; i++){
			var type = arguments[i];
			if (type == null){
				//	Null.
				expected.push('null');
			}
			else if (typeof type == 'string'){
				//	Type.
				expected.push(type);
			}
			else {
				//	Constructor function.
				expected.push(tk.functionName(type));
			}
		}
		throw 'Incorrect parameter type: ' 
			+ (typeof object) + ' (expected one of ' 
			+ expected.join(', ') + ')';
	}

	tk.resolve = function(target){
		/*
			Call `target` if it's a function, passing it the remainder of the 
			parameters passed to this function.
		*/
		if (typeof target !== 'function'){
			return target;
		}
		var toPass = [].slice.call(arguments);
		toPass.splice(0, 1);
		return target.apply(null, toPass);
	}

	tk.log = function(){
		/*
			Log all arguments if this toolkit is configured to be in debug 
			mode.
		*/
		if (tk.config.debug){
			console.log.apply(null, arguments);
		}
	}

	tk.time = function(){
		/*
			Return the current system time, in milliseconds.
		*/
		var date = new Date();
		return data.getTime();
	}

	tk.range = function(max){
		/*
			::argspec -
			Return a list containing the integers between 0 and `max`.

			::argspec min, max
			Return a list containing the intergers between `min` and `max`.
		*/
		var min = 0, max = max;
		if (arguments.length > 1){
			min = arg;
			max = arguments[1];
		}

		var list = [];
		for (var k = min; k < max; k++){
			list.push(k);
		}
		return list;
	}

	tk.tag = function(name){
		var e = new ToolkitSelection(document.createElement(name)),
			varg = tk.varg.on(arguments);

		var cls = varg(1, null),
			html = varg(2, '');
		return e.classify(cls).html(html);
	}

	tk.iter = function(iterable, callback){
		/*
			Iterate an object or array.
		*/
		switch (tk.typeCheck(iterable, Array, 'object')){
			case 0:
				for (var i = 0; i < iterable.length; i++){
					callback(iterable[i], i);
				}
				break;
			case 1:
				for (var property in iterable){
					callback(property, iterable[property]);
				}
		}
	}

	tk.comprehension = function(ary, callback){
		var comprehension = [];
		for (var i = 0; i < ary.length; i++){
			var value = callback(ary[i], i);
			if (value !== undefined){
				comprehension.push(value);
			}
		}
		return comprehension;
	}

	tk.defer = function(func, milliseconds){
		setTimeout(func, milliseconds);
	}

	tk.init = function(initFunction){
		tk.initFunctions.push(initFunction);
	}

	if (/complete|loaded|interactive/.test(document.readyState)){
		tk.iter(tk.initFunctions, function(f){ f(); });
	}
	else {
		if (window){
			window.addEventListener('DOMContentLoaded', function(){
				tk.iter(tk.initFunctions, function(f){ f(); });
			});
		}
	}

	/* ---- Selection ---- */
	/* ::insertsource selection.js */

	/* ---- Requests ---- */
	/* ::insertsource requests.js */

	/* ---- Binding ---- */
	/* ::insertsource binding.js */

	return tk;
}
