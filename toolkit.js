/*
	Creating an instance of this library.

	::object
	::argspec config
	:config (Optional) A configuration object containing zero or more of the 
			following configurable values:
		* `debug`: The debug flag, enabling or disabling logging via 
			`Toolkit.debug()` and `ToolkitInstance.debug()`.
		* `rootElement`: The root element used by the returned Toolkit. 
			Defaults to `document`.
		* `templateContainer`: A selector for the element(s) containing your 
			mapping templates.
		* `dataPrefix`: The prefix used for all element attributes. Defaults
			to `tk`. Individual attribute names can be updated through the
			`attrNames` property of the created object.
		* `templateFunctions`: A name to function mapping of functions
			available in data-DOM mappings.
		* `bindFunction`: A function to be passed a `ToolkitInstance` for each 
			root element being added to the DOM to allow callbacks to be bound 
			on it.
*/
function createToolkit(){
	'use strict';

	//	Polyfill Element.matches for IE 7-.
	if (!Element.prototype.matches){
		Element.prototype.matches = Element.prototype.msMatchesSelector;
	}
	//	Placehold `Window` for non-browser environments.
	if (!Window){ var Window = function(){}; }

	//	Define the base Toolkit object for population.
	var tk = function(object){
		return new ToolkitInstance(object);
	};

	//	Create the default configuration.
	tk.config = {
		debug: false,
		rootElement: document,
		templateContainer: '.tk-templates',
		dataPrefix: 'tk',
		templateFunctions: {}, 
		bindFunction: function(){}
	};
	//	Update the default configuration if a configuration parameter was 
	//	passed.
	if (arguments.length > 0){
		var ovr = arguments[0];
		for (var entry in ovr){
			tk.config[entry] = ovr[entry];
		}
	}

	//	Define the default attribute names.
	function makeDefault(ext){ return tk.config.dataPrefix + '-' + ext; }
	tk.config.attrNames = {
		bind: makeDefault('bind'),
		onto: makeDefault('onto'),
		viewFn: makeDefault('view-fn'),
		src: makeDefault('src'),
		callback: makeDefault('callback'),
		event: makeDefault('event'),
		on: makeDefault('on'),
		template: makeDefault('template')
	}
	
	/* ## Debug logging (Extra) */
	/*
		Log values for debugging if the `debug` flag is set in configuration.

		::usage
		```
		var tk = createToolkit({debug: true});
		//	Will log to console.
		tk.debug('Hello Console!');

		tk = createToolkit({debug: false});
		//	Won't log to console.
		tk.debug('Hello Console!');
		```

		::argspec item1, ..., itemN
	*/
	tk.debug = function(){
		if (tk.config.debug){
			console.log.apply(null, arguments);
		}
	}

	/* ## Basic utilities */
	/*
		Return the current time in milliseconds.
	*/
	tk.millis = function(){
		var now = new Date();
		return now.getTime();
	}

	/*
		Iterate an `Array` or `Object`, calling `func` for each (`Object`, 
		index) or (property name, property value) pair, respectively.

		`func` can return `false` to stop the iteration.
		
		:target The `Array` or `Object` to iterate.
		:func The function to call at each iteration.
	*/
	tk.iter = function(target, func){
		switch (tk.typeCheck(target, [MappedArray, Array, 'object'])){
			case 0:
			case 1:
				for (var i = 0; i < target.length; i++){
					if (func(target[i], i) === false){
						break;
					}
				}
				return;
			case 2:
				for (var key in target){
					if (func(key, target[key]) === false){
						break;
					}
				}
				return;
		}
	}

	/*
		Perform a comprehension on the array or `MappedArray` `ary`. All non-
		`undefined` values returned from `func` are added to an array which 
		is returned by this function.

		:ary The array to comprehend.
		:func The comprehension function.
	*/
	tk.comprehension = function(ary, func){
		typeCheck(ary, [Array, MappedArray]);
		var comprehension = [];
		for (var i = 0; i < ary.length; i++){
			var value = func(ary[i], i);
			if (value !== undefined){
				comprehension.push(value);
			}
		}
		return comprehension;
	}

	/*
		::argspec -
		Return whether or not an object has the given property.

		::usage
		```
		var obj = {};
		
		tk.debug(tk.prop(obj, 'x'));
		//	Logs 'false'.

		obj.x = null;
		tk.debug(tk.prop(obj, 'x'));
		//	Logs 'true'.
		```
		
		::argspec object, propertyName, default
		Return the value of `object[propertyName]` or `default` if `object` 
		doesn't have the `propertyName` property.

		::usage
		```
		var obj = {};
		
		tk.debug(tk.prop(obj, 'x', 100));
		//	Logs '100'.

		obj.x = 200;
		tk.debug(tk.prop(obj, 'x', 100));
		//	Logs '200'.
		```

		:obj The object to check for the given property.
		:propertyName The name of the property to check for.
		:default (Optional) A default value to return if the property isn't 
			present.
	*/
	tk.prop = function(obj, propertyName){
		var exists = obj.hasOwnProperty(p);
		if (arguments.length == 2){
			return exists;
		}
		return exists ? obj[propertyName] : arguments[2];
	}

	/*	
		Return a version of `prop()` bound to the given object.

		::usage
		```
		var obj = {},
			prop = tk.prop.on(obj);
		
		tk.debug(prop('x', 100));
		//	Logs '100'.

		obj.x = 200;
		tk.debug(prop('x', 100));
		//	Logs '200'.
		```

		::obj The object to bind the returned function to.
	*/
	tk.prop.on = function(obj){
		return function(prop){
			if (arguments.length == 2){
				return tk.prop(obj, prop, arguments[1]);
			}
			return tk.prop(obj, prop);
		}
	}

	/*
		Call a function later.
		
		:func The function to call.
		:milliseconds The timeout before the function is
			called, in milliseconds.
	*/
	tk.defer = function(func, milliseconds){
		setTimeout(func, milliseconds);
	}

	/*
		TODO[v0.1]: Better pattern.

		Call a function at an interval. Returns an object with a `stop()` 
		method that can clears the interval when called.

		::argspec func, milliseconds, initial
		:func The function to call.
		:milliseconds The interval in milliseconds.
		:initial (Optional, default `false`) Whether to call the function 
			initially.
	*/
	tk.repeat = function(func, milliseconds){
		var i = setInterval(func, milliseconds);
		if (tk.varg(arguments, 2, false)){
			func();
		}
		return {
			stop: function(){ clearInterval(i); }
		}
	}

	/*
		Generate a range.

		::argspec max
		Return the range of numbers between 0 and `max`.

		::argspec min, max
		Return the range of numbers between `min` and `max`.

		:min The lower bound (inclusive).
		:max The upper bound (exclusive).
	*/
	tk.range = function(arg){
		var min = 0, max = arg;
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

	/*
		Return the name of `func` or `'<anonymous function>'` if the function
		has no name.

		:func The function to return the name of.
	*/
	tk.functionName = function(func){
		var name = /^function\s+([\w\$]+)\s*\(/.exec(type.toString());
		return name ? name[1] : '<anonymous function>';
	}

	/* ## Variable argument utilities (Extra) */
	/*
		Return the argument at index `i` or a default value if there are fewer 
		than `i + 1` arguments.

		::usage
		```
		function f(){
			tk.debug(tk.varg(arguments, 0, 'No arguments!'));
		}

		f();
		//	Logs 'No arguments!'.
		f('foobar');
		//	Logs 'foobar'.
		```
		
		::argspec args, i, defaultValue, defaultOnNull
		:args The `arguments` object.
		:i The index of the argument to (*maybe*) retrieve.
		:defaultValue The default value to return if there are fewer than 
			`i + 1` arguments.
		:defaultOnNull (Optional, default `false`) Whether the value of the 
			argument at index `i` being `null` should cause this function to 
			return `default`.
	*/
	tk.varg = function(args, i, defaultValue){
		if (args.length > i){
			if (arguments.length > 3 && arguments[3] && args[i] == null){
				//	4th arguments says you want default for null.
				return defaultValue;
			}
			return args[i];
		}
		return defaultValue;
	}
	/*
		Return a version of `varg()` bound to the given arguments list.

		::usage
		```
		function f(){
			var varg = tk.varg.on(arguments);
			tk.debug(tk.varg(0, 'No first argument!'), tk.varg('No second argument!'));
		}

		f();
		//	Logs 'No first argument!', 'No second argument!'.
		f('foobar');
		//	Logs 'foobar', 'No second argument!'.
		```

		:args The arguments list to bind the returned function to.
	*/
	tk.varg.on = function(args){
		return function(i, defaultValue){
			return tk.varg(args, i, defaultValue, tk.varg(arguments, 2, false));
		}
	}

	/*
		Check the type of an object against a type or list of types, throwing 
		a `TypeError` if the check fails. Otherwise, return the index of the 
		type for which the check succeeded.

		`types` can contain any combination of:
		* Type strings (e.g. `'number'`, `'function'`, etc.)
		* Constructors (e.g. `Array`, `Element`, etc.)
		* `null`s

		::usage
		```
		tk.debug(tk.typeCheck({}, ['string', 'function', Array, 'object']));
		//	Logs `3`.

		tk.debug(tk.typeCheck({}, ['string', 'function', Array]));
		//	Throws a `TypeError`.
		```

		:object The object to check the type of.
		:types The type, or list of types, against which to check the object.
	*/
	tk.typeCheck = function(object, types){
		//	Ensure types is iterable.
		if (!(types instanceof Array)){
			types = [types];
		}
		var match = -1;
		for (var i = 0; i < types.length; i++){
			var check = types[i];
			if (check == null) {
				//	Null check.
				if (object == null){
					match = i;
					break;
				}
			}
			else if (typeof object == check){
				//	Typeof check.
				match = i;
				break;
			}
			else {
				//	Class check.
				try {
					if (object instanceof check){
						match = i;
						break;
					}
				}
				catch (e){}
			}
		}
		if (match == -1){
			//	No match, create a nicely formatted error.
			var expected = [];
			for (var i = 0; i < types.length; i++){
				var type = types[i];
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
			throw new TypeError('Incorrect parameter type ' + (typeof param) 
					+ ' (expected one of ' + expected.join(', ') + ')');
		}
		return match;
	}

	/*
		Resolve a potentially functional value.

		If `target` is a function, call it and pass it the remainder of the 
		parameters passed to this function, then return the result.

		Otherwise, return `target`.

		::usage
		```
		tk.debug(tk.resolve(function(i, j){ return i + j; }, 1, 2));
		//	Logs '3'.

		tk.debug(tk.resolve(4, 1, 2));
		//	Logs '4'.
		```

		::argspec target, wrapElements
		:target The value to resolve
		:wrapElements (Optional, default `true`) Whether to replace all 
			`Element` arguments with `ToolkitInstance`s selecting that
			element.
	*/
	tk.resolve = function(target){
		if (typeof target == 'function'){
			var args = [].slice.call(arguments);
			args.splice(0, 1);
			if (tk.varg(arguments, 1, true)){
				for (var i = 0; i < args.length; i++){
					if (args[i] instanceof Element){
						args[i] = new ToolkitInstance(args[i]);
					}
				}
			}
			return target.apply(null, args);
		}
		else {
			return target;
		}
	}
	
	/* ## The `ToolkitInstance` object */
	/*	
		The `ToolkitInstance` object holds a set of selected DOM `Node`s and 
		provides methods for modifying the properties of its members.

		The set of elements selected by a `ToolkitInstance` is immutable.

		`ToolkitInstance`s can be conviently instantiated by calling the 
		function returned by `createToolkit()`.
		
		For example:
		```
		var foobars = tk('.foobar');
		```

		Aside from the methods below, `ToolkitInstance`s have the properties 
		`length` and `empty` for inspecting the cardinality of the set of 
		selected elements.

		::object
		:selection An `Element`, query selector, `Array` of `Element`s and or
			`ToolkitInstance`s, or `Window`.
	*/
	function ToolkitInstance(selection){
		//	Store reference to `this`.
		var self = this;

		var origin = tk.varg(arguments, 1, null);
		
		//	Resolve the selection.
		this.set = (function(){
			if (selection instanceof ToolkitInstance){
				selection = selection.set.splice();
			}
			switch (tk.typeCheck(selection, [Element, Window, Array, 'string'])){
				case 0:
				case 1: return [selection];
				case 2:
					for (var i = 0; i < selection.length; i++){
						var element = selection[i];
						if (element instanceof ToolkitInstance){
							selection[i] = element.set[0];
						}
					}
					return selection;
				case 3: return tk.config.rootElement.querySelectorAll(selection);
			}
		})();
		//	Set cardinality properties.
		this.length = this.set.length;
		this.empty = this.length == 0;
		
		/* ## In-chain debugging (Extra) */
		/*
			Print a labeled debug statement while chaining.
			
			::usage.
			```
			tk('.foo').debug('Before reduction')
				.reduce('.bar').debug('After reduction');
			```
			::argspec label
			:label (Optional, default `'Debug'`) The label to use.
		*/
		this.debug = function(){
			console.log(tk.varg(arguments, 0, 'Debug') + ':', this);
			return this;
		}

		/* ## Selection modifiers and chaining */
		/*
			Move backwards once in the chain (i.e., return the 
			`ToolkitInstance` that created this one).

			::usage
			```
			tk('.foo').reduce('.bar')
				.debug("Selecting all 'foo's that are 'bar's")
				.back().debug("Selecting all 'foo's again");
			```
		*/
		this.back = function(){
			if (origin == null){
				throw new ChainingError('Called back() without parent');
			}
			return origin;
		}

		/*
			Return a new `ToolkitInstance` selecting the same set, but in 
			reverse order.
		*/
		this.reverse = function(){
			var newSet = this.set.slice();
			newSet.reverse();
			return new ToolkitInstance(newSet, this);
		}

		/*	
			Return a new `ToolkitInstance` selecting the `i`th selected element, 
			or the `i`th selected element itself.

			If `i` is out of bounds, throw an `OutOfSetBounds` exception.
			
			::argspec i, wrapElement
			:i The index of the element to return.
			:wrapElement (Optional, default `true`) Whether to return a 
				`ToolkitInstance` selecting the `i`th element instead of
				the `i`th element itself.
		*/
		this.ith = function(i){
			if (i < 0 || i >= this.length){
				throw new OutOfSetBounds(i);
			}
			var wrap = tk.varg(arguments, 1, true);
			return wrap ? new ToolkitInstance(this.set[i], this) : this.set[i];
		}

		/*
			Return a new `ToolkitInstance` selecting all selected elements that 
			match the query selector `'reducer'`.

			If `'reducer'` is a function, return a new `ToolkitInstance` 
			selecting all elements for which it returned true. 

			:reducer (Functional) The reduction filter.
		*/
		this.reduce = function(reducer){
			var newSet;
			switch (tk.typeCheck(reducer, ['string', 'function'])){
				case 0:
					newSet = this.comprehension(function(e){
						if (e.is(reducer)){ return e; }
					});
					break;
				case 1:
					newSet = this.comprehension(reducer);
			}
			
			return new ToolkitInstance(newSet, this);
		}

		/*
			Return a new `ToolkitInstance` with an expanded set of selected 
			elements.

			:extension A `ToolkitInstance` or `Array` of `Element`s and or 
				`ToolkitInstance`s.
		*/
		this.extend = function(extension){
			switch (tk.typeCheck(extension, [ToolkitInstance, Array])){
				case 0:
					extension = extension.set;
				case 1:
					//	Convert `ToolkitInstance`s to elements.
					//	TODO: Handle multi-selected `ToolkitInstance`s.
					extension = tk.comprehension(extension, function(e){
						return e instanceof ToolkitInstance ? e.set[0] : e;
					});
					return new ToolkitInstance(this.set.concat(extension), this);
			}
		}

		/*
			Return a new `ToolkitInstance` selecting parents of the currently 
			selected elements.

			::argspec reducer, high 
			Return all parent elements after filtering with `reducer`. 
			
			If `reducer` is a query selector, return all elements which match 
			it. If it is a function, return all elements for which it returned
			`true`.

			::argspec high
			Return an unfiltered set of parent elements.

			:reducer (Optional) A query selector or function for filtering.
			:high (Optional, default `true`) Whether to return all parents or 
				only immediate ones.
		*/
		this.parents = function(){
			if (arguments.length == 1){
				//	`high` flag only.
				//	TODO: Better impl.
				return this.parents('*', arguments[0]);
			}
			//	Collect and assert arguments.
			var reducer = tk.varg(arguments, 0, null),
				reducerType = typeCheck(reducer, [null, 'string', 'function']),
				high = tk.varg(arguments, 1, true), 
				list;
			//	Assert high is a flag.
			typeCheck(high, ['boolean']);
			
			//	TODO: `i` is the index of the element whose parent this is.
			//		(unintuative).
			function filter(e, i){
				return (
					(reducer == null) || 
					(reducerType == 1 &&  parent.matches(reducer)) ||
					(reducerType == 2 && reducer(e, i))
				);
			}
			
			if (high){
				list = []
				this.iter(function(e, i){
					var parent = e.parentNode;
					while (parent !== document){
						if (filter(parent, i)){
							list.push(parent);
						}
						parent = parent.parentNode;
					}
				}, false);
			}
			else {
				list = this.comprehension(function(e, i){
					if (filter(e.parent, i)){ return e.parent; }
				}, false);
			}
			return new ToolkitInstance(list, this);
		}
		
		/*
			Return a new `ToolkitInstance` selecting all the childen of all 
			selected elements.

			A selector can be used to filter which elements are selected.

			::argspec selector, deep | deep
			:selector (Optional, functional) A selection filter.
			:deep (Optional, default `true`) Whether to return all children
				or only immediate ones.
		*/
		this.children = function(){
			if (arguments.length == 1){
				//	`deep` flag only.
				return this.children('*', arguments[0]);
			}
			//	Collect and assert parameters.
			var selector = tk.varg(arguments, 0, '*'),
				deep = tk.varg(arguments, 1, true), list = [];
			
			if (deep){
				this.iter(function(e, i){
					tk.iter(e.querySelectorAll(tk.resolve(selector, e, i)), function(g, j){
						//	Ensure we don't have duplicate entries.
						if (list.indexOf(g) == -1){
							list.push(g);
						}
					});
				}, false);
			}
			else {
				this.iter(function(e, i){
					tk.iter(e.children, function(g, j){
						if (selector == null || g.matches(tk.resolve(selector, e, i))){
							list.push(g);
						}
					});
				}, false);
			}
			return new ToolkitInstance(list, this);
		}

		/*
			Deep-copy the first selected element and return a `ToolkitInstance`
			selecting it.

			::firstonly
		*/
		this.copy = function(){
			return new ToolkitInstance(this.set[0].cloneNode(true), this);
		}

		/* ## Inspection */
		/*
			Return:
			* Given an `Element`, whether the selected set contains only that 
				element.
			* Given an `Array`, whether the array contains all elements of the 
				selected set, and vice-versa.
			* Given a `ToolkitInstance`, whether it is selecting the identical 
				set of elements.

			:object The `Element`, `Array`, or `ToolkitInstance` to check for 
				equality against.
		*/
		this.equals = function(object){
			switch(tk.typeCheck(object, [Element, Array, ToolkitInstance])){
				case 0:
					return self.length == 1 && self.set[0] == object;
				case 2:
					object = object.set;
				case 1:
					var diff = false;
					iter(object, function(e){
						if (self.set.indexOf(e) == -1){
							diff = true;
							return false;
						}
					});
					iter(self.set, function(e){
						if (object.indexOf(e) == -1){
							diff = true;
							return false;
						}
					})
					return !diff && self.length == object.length;
			}
		}

		/*	
			Iterate the currently selected set, passing each selected element 
			and its index to a callback (in that order).

			Like `iter()`, `func` can return `false` to iteration.

			::argspec func, propagate
			:func The iteration callback.
			:propagate (Optional, default `true`) whether to pass `Element`s to 
				the callback selected by `ToolkitInstance`s.
		*/
		this.iter = function(func){
			var propogate = varg(arguments, 1, true);
			for (var i = 0; i < this.set.length; i++){
				var e = this.set[i];
				if (propogate){
					e = new ToolkitInstance(e, this);
				}
				if (func(e, i) === false){
					break;
				}
			}
			return this;
		}

		/*
			Perform a comprehension on the currently selected set of elements. 
			All non-`undefined` values returned from `func` are added to an 
			array which is returned by this function.

			::argspec func, propagate
			:func The comprehension function.
			:propagate (Optional, default `true`) whether to pass `Element`s to 
				the callback selected by `ToolkitInstance`s.
		*/
		this.comprehension = function(func){
			var propogate = varg(arguments, 1, true);
			var compr = [];
			for (var i = 0; i < this.set.length; i++){
				var e = this.set[i];
				if (propogate){
					e = new ToolkitInstance(e, this);
				}
				var val = func(e, i);
				if (val !== undefined){
					compr.push(val);
				}
			}
			return compr;
		}

		/*	
			Return whether all selected elements match a selector.
		
			:selector (Functionable) The selector to check.
		*/
		this.is = function(selector){
			typeCheck(selector, ['string', 'function']);
			for (var i = 0; i < this.length; i++){
				var e = this.set[i];
				if (!e.matches(tk.resolve(selector, e, i))){
					return false;
				}
			}
			return true;
		}

		/*
			Return the complete list of classes for all selected elements.
		*/
		this.classes = function(){
			var all = [];
			this.iter(function(e){
				var mine = e.className.split(/\s+/);
				for (var i = 0; i < mine.length; i++){
					var cls = mine[i];
					if (all.indexOf(cls) == -1){
						all.push(cls);
					}
				}
			}, false);
			return all;
		}

		/*
			Return the value of the first selected element if it's an input.
		*/
		this.value = function(){
			if (arguments.length > 0){
				var value = arguments[0];
				this.iter(function(e, i){
					e.value = v;
				}, false);
				return this;
			}
			else {
				if (this.set[0].type == 'checkbox'){
					return this.set[0].checked;
				}
				return this.set[0].value;
			}
		}

		/* ## Inspection and modification */
		/*
			Get, set, or modify element attributes.

			### Get
			Return the value of an attribute on the first selected element, 
			or `null` if it isn't present.

			### Set
			Set an attribute, or multiple attributes from an object by property. 
			Attribute values are functional.
			
			If a single attribute is being set, attribute name is functional.
			
			To remove an attribute, pass `null`.

			::usage
			```
			var x = tk('.foobar');
			tk.debug('data-foo of first foobar:', x.attr('data-foo'));

			tk.debug('data-fake of first foobar:', x.attr('data-bar'));
			
			x.attr('data-bar', 'foo');
			x.attr(function(e, i){ return 'data-foo-' + i; }, function(e, i){ return i; });
			x.attr({
				'data-foo': 'bar',
				'data-bar': function(e, i){ return e.attr('data-bar') + x.length - i; }
			});
			```
			
			::softfirstonly
			::argspec attr, value | object
			:attr (Functional) The attribute name.
			:value (Optional, functional) The attribute value.
			:object The object containing attribute names and values as 
				properties.
		*/
		this.attr = function(attr){
			switch (tk.typeCheck(attr, ['string', 'object'])) {
				case 0:
					if (arguments.length > 1){
						var name = attr, value = arguments[1];
						switch (tk.typeCheck(value, [null, 'string', 'function'])){
							case 0:
								this.iter(function(e, i){
									e.removeAttribute(name, null);
								}, false);
								break;
							default:
								this.iter(function(e, i){
									e.setAttribute(tk.resolve(name, e, i), tk.resolve(value, e, i));
								}, false);
						}
					}
					else {
						if (this.set[0].hasAttribute(attr)){
							return this.set[0].getAttribute(attr);
						}
						return null;
					}
					break;
				case 1:
					this.iter(function(e, i){
						for (var name in attr){
							e.setAttribute(name, tk.resolve(attr[name], e, i));
						}
					}, false);
					break;
			}
			return this;
		}

		/*
			Get computed styles and set element-level styles.
			
			### Get
			Retrieve the computed value of a style for the first selected 
			element.

			### Set
			Set an element-level style for each selected element, or set
			multiple styles from object by property.

			When setting a single style, style name is functional.

			Style value is always functionable.

			::usage
			```
			var x = tk('.foobar');

			x.css('background-color', 'red');
			x.css('background-color', function(e){ 
				return e.is('.cucumber') ? 'green' : 'blue'; 
			});
			x.css(function(e){
				if (e.css('background-color') == 'green'){
					return 'margin-bottom';
				}
				return 'margin-left';
			}, '20px');
			x.css({
				'color': 'red',
				'font-weight': 'bold',
				'font-size': function(e){
					return e.is('.cucumber') ? '10pt' : '20pt';
				}
			});
			```

			::softfirstonly
			::argspec styleName, value | object
			:styleName (functional) The name of the CSS style to set, in either
				`dash-case` or `camelCase`.
			:value (Optional, functional) The property value.
		*/
		this.css = function(prop){
			function applyOne(name, value){
				//	Make dash case.
				name = name.replace(/-([a-z])/g, function(g){
					return g[1].toUpperCase();
				});	
				self.iter(function(e, i){
					e.style[name] = tk.resolve(value, e, i);
				}, false);
			}

			switch (tk.typeCheck(prop, ['string', 'object'])){
				case 0:
					if (arguments.length > 1){
						//	Set a single style.
						applyOne(prop, arguments[1]);
					}
					else {
						return window.getComputedStyle(this.set[0]).getPropertyValue(prop);
					}
					break;
				case 1:
					for (var name in prop){
						applyOne(name, prop[name]);
					}
					break;
			}
			return this;
		}

		/*
			Attach a callback to all selected elements.

			The callback will be passed a `ToolkitInstance` of the firing 
			element, as well as its index.

			::usage
			```
			var x = tk('.foobar');

			x.on('click', function(e){
				alert('Foo!');
			});

			x.on('mouseover', function(e){
				e.css('background-color', 'green');
			});

			x.on({
				'mouseout': function(e){
					e.css('background-color', 'red');
				},
				'click': function(e){
					e.css('color', 'salmon');
				}
			});
			```

			::argspec event, callback
			:event (Functional) The name of the event to bind the callback to.
			:callback The callback function to bind.
		*/
		this.on = function(arg){
			function setOne(event, func){
				self.iter(function(e, i){
					if (!tk.prop(e, 'tkEventListeners')){
						e.tkEventListeners = [];
					}
					var add = {
						event: resolve(evt, e, i),
						func: function(g){
							func(new ToolkitInstance(e), g, i);
						}
					}
					list.push(add)
					e.addEventListener(add.event, add.func);
				}, false);
			}

			switch (tk.typeCheck(arg, ['function', 'string', 'object'])){
				case 0:
				case 1:
					setOne(arg, arguments[1]);
					break;
				case 2:
					for (var name in arg){
						setOne(name, arg[name]);
					}
					break;
			}
			return this;
		}

		/*
			Remove all listeners for a given event from all selected elements.

			:event The event to remove listeners for.
		*/
		this.off = function(event){
			this.iter(function(e){
				var list = prop(e, 'tkEventListeners', []), remove = [];
				//	Find the callbacks to remove.
				iter(list, function(o, i){
					if (o.event == event){
						e.removeEventListener(o.event, o.func);
						remove.push(i);
					}
				});
				//	Remove all found callbacks.
				iter(remove, function(i){
					list = list.splice(i, 1);
				});
			}, false);
			return this;
		}

		/*
			Add, remove, or toggle a class. Modify multiple classes by object 
			property.

			`flag` is functional.

			If a single class is being flagged, class name if functional.

			Passing a non-negative value as the third parameter, `time`, will 
			cause the opposite classification to the one performed by this 
			function to occur after `time` milliseconds.

			*Please contribute on GitHub to help that sentence*.

			::usage
			```
			//	Add the class 'hot' to all '.foo.bar' elements.
			tk('.foo').classify('hot', function(e){
				return e.is('.bar');
			}, 500);
			
			//	Swap all '.foo's to '.bar's
			tk('.foo').classify({
				'foo': false,
				'bar': true
			});
			```

			::argspec cls, flag, time | obj
			:cls The class name.
			:flag (Optional, functional, default `true`) Whether to add or 
				remove the class.
			:time (Optional, functional, default `-1`) The deferred reversal 
				parameter.
		*/
		this.classify = function(arg){
			function classifyOne(cls, flag, time){
				var selector = '.' + cls, toAdd = ' ' + cls;
				if (flag == 'toggle'){
					//	Special second parameter option.
					f = function(e, i){
						return !e.is(selector);
					}
				}
				self.iter(function(e, i){
					var actualFlag = tk.resolve(flag, e, i);
					if (actualFlag){
						//	Add.
						if (!e.is(selector)){
							e.set[0].className += toAdd;
						}
					}
					else {
						//	Remove.
						if (e.is(selector)){
							var classes = e.classes();
							classes.splice(classes.indexOf(cls), 1);
							e.set[0].className = classes.join(' ');
						}
					}
					var actualTime = tk.resolve(time, e, i);
					if (actualTime >= 0){
						//	Reverse the classification later.
						defer(function(){
							classifyOne(cls, !actualFlag, -1);
						}, actualTime);
					}
				});
			}

			switch (tk.typeCheck(arg, ['string', 'object'])){
				case 0:
					//	Set a single attribute.
					var varg = tk.varg.on(arguments);
					classifyOne(arg, varg(1, true), varg(2, -1));
					break;
				case 1:
					//	Set attributes from a mapping.
					tk.iter(arg, classifyOne);
					break;
			}
			return this;
		}

		/*
			Remove all currently selected elements from the DOM (they remain 
			selected).
		*/
		this.remove = function(){
			this.iter(function(e){
				if (e.parentNode != null){
					e.parentNode.removeChild(e);
				}
			}, false);
			return this;
		}

		/*
			Append an element to the first matched element. If passed a 
			`ToolkitInstance`, each of its selected elements are appended.

			Returns a new `ToolkitInstance` selecting all appended elements.
			
			::firstonly
			:element The element or `ToolkitInstance` to append.
		*/
		this.append = function(e){
			switch (typeCheck(e, [Array, ToolkitInstance, Element])){
				case 0:
					//	TODO: Efficiency.
					var set = [];
					iter(e, function(g){
						var tki = self.append(g);
						tki.iter(function(h){
							set.push(h.set[0]);
						});
					});
					return new ToolkitInstance(set, this);
				case 1:
					e.iter(function(g){
						g.remove();
						self.set[0].appendChild(g.set[0]);
						config.bindFunction(g);
					});
					e.backP = this;
					return e;
				case 2:
					self.set[0].appendChild(e);
					config.bindFunction(e);
					return new ToolkitInstance(e, this);
			}
		}

		/*
			Prepend an element to the first matched element. If passed a 
			`ToolkitInstance`, each of its selected elements are prepended.

			Returns a new `ToolkitInstance` selecting all prepended elements.
		
			::firstonly
			::argspec element
			:element The element or `ToolkitInstance` to append
		*/
		this.prepend = function(e){
			switch (typeCheck(e, [Array, ToolkitInstance, Element])){
				case 0:
					//	TODO: Efficiency
					var set = [];
					e = e.splice(0).reverse();
					iter(e, function(g){
						var tki = self.prepend(g);
						tki.iter(function(h){
							set.push(h.set[0]);
						});
					});
					return new ToolkitInstance(set, this);
				case 1:
					e.reverse().iter(function(g){
						g.remove();
						self.set[0].insertBefore(g.set[0], self.set[0].firstChild);
						config.bindFunction(g);
					});
					e.backP = this;
					return e;
				case 2:
					self.set[0].insertBefore(e, this.set[0].firstChild);
					config.bindFunction(e);
					return new ToolkitInstance(e, this);
			}
		}

		//	TODO: Doc
		this.tag = function(){
			return this.set[0].tagName;
		}

		//	TODO: Doc and move
		this.next = function(){
			var n = this.set[0].nextElementSibling;
			if (n == null){
				n = [];
			}
			return new ToolkitInstance(n, this);
		}

		//	TODO: Doc and move
		this.prev = function(){
			var n = this.set[0].previousElementSibling;
			if (n == null){
				n = [];
			}
			return new ToolkitInstance(n, this);
		}

		/*
			Get the HTML content of the first selected
			element, or set the HTML content of each selected
			element.

			::softfirstonly
			::argspec html
			:html (Optional, functional) The HTML to set
		*/
		this.html = function(){
			if (arguments.length > 0){
				var h = arguments[0];
				this.iter(function(e, i){
					e.innerHTML = resolve(h, e, i);
				}, false);
				return this;
			}
			else {
				return this.set[0].innerHTML;
			}
		}

		/*
			Get the text content of the first selected
			element, or set the text content of each selected
			element.
			
			::softfirstonly
			::argspec text
			:text (Optional, functional) The text to set
		*/
		this.text = function(){
			if (arguments.length > 0){
				var t = arguments[0];
				this.iter(function(e, i){
					e.textContent = resolve(t, e, i);
				}, false);
				return this;
			}
			else {
				return this.set[0].textContent;
			}
		}

		/*
			Select the first selected element if
			it's an input.

			::firstonly
		*/
		this.select = function(){
			this.set[0].select();
			return this;
		}

		/* ## Layout calculation */
		/*
			Return the (`x`, `y`) offset within the document 
			of the first selected element.

			::firstonly
		*/
		this.offset = function(){
			var x = 0, y = 0, e = this.set[0];
			while (e != null){
				x += e.offsetLeft;
				y += e.offsetTop;
				e = e.offsetParent;
			}
			return {x: x, y: y};
		}

		/*
			Return the (`width`, `height`) size of the `content-box`
			of the first selected element.

			::firstonly
			::argspec outer
			:outer (Optional, default `false`) Whether to include `border`
				`margin` and `padding` in the returned size.
		*/
		this.size = function(){
			var e = this.set[0];
			var box = e.getBoundingClientRect();
			var size = {width: box.width, height: box.height};
			if (varg(arguments, 0, false)){
				var style = window.getComputedStyle(e, null);
				//	Add margin
				size.width 
					+= style.getPropertyValue('margin-left') 
					+ style.getPropertyValue('margin-right');
				size.height 
					+= style.getPropertyValue('margin-top') 
					+ style.getPropertyValue('margin-bottom');
				if (style.getPropertyValue('box-sizing') == 'border-box'){
					//	Add padding and TODO: border
					size.width 
						+= style.getPropertyValue('padding-left') 
						+ style.getPropertyValue('padding-right');
					size.height 
						+= style.getPropertyValue('padding-top') 
						+ style.getPropertyValue('padding-bottom');
				}
			}
			return size;
		}
	}

	

	/* ## Other objects (Extras) */
	function UnderfullSet(){}

	/*
		An exception thrown when incorrect chaining occurs 
		(e.g., `back()` is called on a `ToolkitInstance` with
		no parent).

		::object
		:message The exception message
	*/
	function ChainingError(message){
		this.message = message
	}

	/*
		An exception throw when invalid binding parameters
		are parsed.
		
		::object
		:message The exception message
	*/
	function BindParameterError(message){
		this.message = message;
	}

	/*
		The object used internally to live-map a data 
		`Object` to a templated `Element`.

		::internal
		::object
	*/
	function MappedObject(obj, node, parent){
		var self = this;
		var funcs = parent._funcs; // TODO: Remove

		var props = Object.getOwnPropertyNames(obj),
			subtemplates = {};
		this.node = node;
		
		/*
			Remove this object from its parent array.
		*/
		this.remove = function(){
			parent.remove(this, true);
		}

		/*
			Return an unmapped, JSON-serializable copy
			of the mapped data in its current state.
		*/
		this.extract = function(){
			var d = {};
			//	Collect all original properties
			iter(props, function(n, i){
				var v = self[n];
				if (v instanceof MappedArray){
					//	Extract subtemplate
					v = v.extract();
				}
				d[n] = v;
			});
			return d;
		}

		this.remap = function(d){
			parent.remap([d]);
			//	TODO: This is a hotfix; the object should be mutable
			return parent[0];
		}

		var bindings = {};
		//	Binds each properties onto all template
		//	nodes binding to it
		function parseBindings(remove){

			//	Returns all values (w.s. separated)
			//	or the given binding parameter
			function param(e, a){
				var v = e.attr(a);
				if (v != null){
					if (remove){
						e.attr(a, null);
					}
					var found = v.match(/(?:(?:<.*?>)|[^\s]+)(?:\s+|$)/g);
					iter(found, function(s, i){
						if (s.indexOf('<') == 0){
							s = s.substring(1, s.length - 1);
						}
						found[i] = s.trim();
					});
					return found;
				}
				return [];
			}

			node.children('[' + attrNames.bind + ']').iter(function(e, i){
				//	Read binding parameters
				var to = param(e, attrNames.bind),
					onto = param(e, attrNames.onto),
					viewWith = param(e, attrNames.viewFn),
					callback = param(e, attrNames.callback);
				iter(to, function(t, j){
					if (!prop(bindings, t)){
						bindings[t] = [];
					}
					//	Push binding parameters, expanding those
					//	shorter than to to contain defaults
					bindings[t].push({
						e: e,
						onto: varg(onto, j , 'html'),
						viewWith: varg(viewWith, j, '-'),
						callback: varg(callback, j, '-')
					});
				});
			});
		}
		//	Parse bindings initially to see which elements grabbed 
		//	arrays; those need to be subtemplated
		parseBindings(false);

		//	Remove subtemplates now so we dont bind
		//	callbacks on them at this depth, then reparse 
		//	bindings
		//	TODO: More efficient
		iter(bindings, function(a, bound){
			if (obj[a] instanceof Array){
				//	This will bind to array, virtualize
				//	in subtemplates
				iter(bound, function(b){
					subtemplates[a] = b.e.children('*', false).remove();
				});
			}
		});
		//	Reparse bindings, for real this time
		bindings = {};
		parseBindings(true);

		//	Bind generally without worrying about
		//	depth since subtemplates are gone
		node.children('[' + attrNames.src + ']').on('keyup', function(e){
			self[e.attr(attrNames.src)] = e.value();
		});
		node.children('[' + attrNames.event + ']').on(function(e){
			//	Check if target event was specified
			return e.is('[' + attrNames.on + ']') ? e.attr(attrNames.on) : 'click';
		}, function(e, i){
			funcs[e.attr(attrNames.event)](self, e, i);
		});

		//	Realize a property binding
		function applyBind(p){
			//	On value change new value is specified since
			//	it hasn't applied yet
			var value = varg(arguments, 1, self[p]);
			if (value instanceof MappedArray){
				//	TODO: Y? lol
				return;
			}
			var bound = tk.prop(bindings, p, null);
			if (bound == null){
				//	No bindings on this property
				return;
			}
			iter(bound, function(b, i){
				if (value instanceof Array){
					//	Subtemplate
					self[p] = new MappedArray(value, subtemplates[p], b.e, funcs);
				}
				else {
					//	Transform
					var asViewed = value;
					if  (b.viewWith != '-'){
						if (b.viewWith.indexOf('lambda:') > -1){
							//	Evaluate lambda
							var v = value;
							asViewed = eval('(function(){ return ' + b.viewWith.substring(7) + ' })();');
						}
						else {
							asViewed = funcs[b.viewWith](value, p);
						}
					}
					//	Place
					if (b.onto == 'html'){
						b.e.html(asViewed);
					}
					else if (b.onto.indexOf('attr:') > -1){
						b.e.attr(b.onto.substring(5), asViewed);
					}
					else {
						throw new BindParameterError('Invalid bind ' + attrNames.bind + '="' + b.onto + '"');
					}
					//	Callback
					if (b.callback != '-'){
						funcs[b.callback](asViewed);
					}
				}
			});
		}
		//	Create mapping
		iter(props, function(p){
			//	Define property p here
			Object.defineProperty(self, p, (function(iv, p){
				var v = iv;	//	Tightly-scoped value
				return {
					get: function(){
						return v;
					},
					set: function(n){
						if (v instanceof MappedArray){
							//	n is a new one
							v.remove();
						}
						v = n;
						//	Update the view value
						applyBind(p, v);
					}
				}
			})(obj[p], p));
			//	Apply the initial value
			applyBind(p);
		});
	}

	/*
		The object used internally to map an array of `Object`s
		to a template and the array contents to nodes.

		Replicates common array behavior so as not to be 
		transparently different.

		::internal
		::object
	*/
	function MappedArray(ary, template, target, funcs){
		var self = this;

		//	Add global template functions
		iter(config.globalTemplateFunctions, function(n, f){
			if (prop(funcs, n, null) == null){
				funcs[n] = f;
			}
		});

		this.length = 0;
		this._funcs = funcs; // TODO: Remove
		
		//	Create a fake array-index-like property
		function applyIndex(i, iv){
			Object.defineProperty(self, '' + i, (function(){
				var v = iv;
				return {
					get: function(){
						return v;
					},
					set: function(n){
						v = new MappedObject(o, v.node, self);
					},
					//	May need to be deleted when
					//	array contents change
					configurable: true
				}
			})());
		}

		/*
			Set the data being mapped by this `MappedArray`.
			
			Since even single-object mappings are really
			`MappedArray`s, remapping can be applied in any 
			context with this function.
		*/
		this.remap = function(a){
			while (this.length > 0){
				this.remove(0);
			}
			iter(a, function(o){ self.push(o); });
		}

		/*
			Return an unmapped, JSON-serializable copy
			of the mapped data in its current state.
		*/
		this.extract = function(){
			var d = [];
			for (var i = 0; i < this.length; i++){
				var v = this[i];
				if (v instanceof MappedObject){
					v = v.extract();
				}
				d.push(v);
			}
			return d;
		}

		/*
			Add objects to the list and therefore
			mapped `Element`s to the DOM

			::argspec value1, ..., valueN
		*/
		this.push = function(){
			for (var i = 0; i < arguments.length; i++){
				var v = arguments[i];
				var node = template.copy().attr(tk.config.attrNames., null);
				applyIndex(self.length, new MappedObject(v, node, self));
				self.length++;
				target.append(node);
			}
		}

		/*
			Return the index of the given object
			in this `MappedArray`, or `-1` if it
			isn't present.

			::argspec object
			:object The object to find the index
				of
		*/
		this.indexOf = function(v){
			for (var i = 0; i < this.length; i++){
				if (this[i] == v){
					return i;
				}
			}
			return -1;
		}

		/*
			Remove an object from this `MappedArray`
			by index, or value.

			If no arguments are supplied, the entire 
			`MappedArray` is emptied.

			::argspec toRemove, useValue
			:toRemove (Optional) The index to remove, or
				if `useValue` is `true`, the object
			:useValue (Optional, default `false`) Whether
				to remove by value or index
		*/
		this.remove = function(){
			if (arguments.length > 0){
				var p = arguments[0];
				if (varg(arguments, 1, false)){
					//	Find index for value
					p = this.indexOf(p);
				}
				//	Remove the index
				this[p].node.remove();
				delete this[p];
				//	Shift all proceeding back
				for (var i = p + 1; i < this.length; i++){
					var v = this[i];
					delete this[i];
					applyIndex(i - 1, v);
				}
				//	Shrink
				this.length--;
			}
			else {
				//	Empty self
				while (this.length > 0){
					this.remove(0);
				}
			}
		}

		//	Map initial data
		this.remap(ary);
	}

	/* ## Basic utilities (TODO: Join) */
	/*
		Create an element.

		::name e
		::argspec tag, cls, html, attrs
		:tag (Optional, default `'div'`) The tag name of the element
		:cls (Optional) The class attribute of the element
		:html (Optional) The html content of the element
		:attrs (Optional) An object containing attributes to be set
			on the element by property name
	*/
	function createElement(){
		var v = varg.on(arguments);
		var e = document.createElement(v(0, 'div'));
		e.className = v(1, '', true);
		e.innerHTML = v(2, '', true);
		iter(v(3, {}), function(a, v){
			e.setAttribute(a, v);
		});
		return new ToolkitInstance(e);
	}

	var processors = [];
	/*
		Send a JSON AJAX request.

		::argspec url, method, data, success, failure
		:url The URL to send the request to
		:method (Default `POST`) The request method
		:data The object to serialize into JSON for the
			request body
		:success A callback on response. Passed the response
			JSON and the response status code
		:failure (Optional, default `success`) A seperate callback
			for if an error status is returned
	*/
	function request(url, method, data, success){
		var failure = varg(arguments, 4, success);
		var method = method.toUpperCase();

		//	Just in case
		if (data instanceof MappedObject || data instanceof MappedArray){
			data = data.extract();
		}
		
		var r = new XMLHttpRequest();
		r.onreadystatechange = function(){
			if (this.readyState == 4){
				var c = this.status, d = JSON.parse(this.responseText);
				(c < 400 ? success : failure)(d, c);
			}
		}

		var d;
		if (method == 'GET'){
			url += '?';
			iter(data, function(a, v){
				url += a + '=' + encodeURIComponent(v);
			});
			r.open(method, url, true);
			d = '';
		}
		else if (method == 'POST'){
			r.open('POST', url, true);
			r.setRequestHeader('Content-Type', 'application/json');
			d = JSON.stringify(data);
		}
		else {
			//	TODO: Support more
			throw 'Unsupported method ' + method;
		}
		iter(processors, function(p){
			p(r, d);
		});
		r.send(d);
		//	TODO: Logging here
	}
	/*
		Add a request processor to modify outgoing
		`XMLHTTPRequest`s.
		
		::argspec func
		:func A callback to modify `XMLHTTPRequest`s
			before they are sent
	*/
	request.processor = function(f){
		processors.push(f);
		return tk;
	}

	var templates = {};
	/*
		Create an return a live mapping between `data`,
		and it's imposition on `template`, inserted as
		children of `target`.

		TODO: Better doc.
	*/
	function map(data, template, target){
		var t = typeof data;
		if (t == 'string' || t == 'number' || t == 'boolean'){
			return data;
		}
		var wrap = !(data instanceof Array);
		if (wrap){
			data = [data];
		}
		var m = new MappedArray(data, templates[template], 
				target, varg(arguments, 3, {}));
		return wrap ? m[0] : m;
	}

	var initFns = [];
	/*
		Add a function to be called when the DOM
		content is loaded.

		::argspec func
		:func The function to call
	*/
	function init(f){
		initFns.push(f);
		return tk;
	}

	tk.types = {
		ToolkitInstance: ToolkitInstance,
		MappedObject: MappedObject,
		MappedArray: MappedArray,
		ChainingError: ChainingError
	}

	function doInit(){
		//	Remove and map templates
		var container = tk(config.templateContainer).remove();
		container.children('[' + attrNames.template + ']', false)
			.iter(function(e){
				templates[e.attr(attrNames.template)] = e;
			}).attr(attrNames.template, null);
		debug('Loaded templates:', templates);
		
		//	Call init. functions
		iter(initFns, function(f){
			f();
		});
	}
	
	//	Initialize or wait
	if (/complete|loaded|interactive/.test(document.readyState)){
		doInit();
	}
	else {
		if (window){
			window.addEventListener('DOMContentLoaded', doInit);
		}
	}
	return tk;
}