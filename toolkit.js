/*
	toolkit.js

	Author: Robin Saxifrage
	License: Apache 2.0
*/
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

	Object.defineProperty(tk, 'here', {
		get: function(){
			tk.log('here');
			return 'here';
		}
	})

	tk.initFunctions = [];
	tk.inspectionFunctions = [];
	function initCall(){
		tk.iter(tk.initFunctions, tk.fn.call);
		tk.iter(tk.inspectionFunctions, function(f){
			f(tk('html'));
		});
	}

	/* ---- Function definitions ---- */
	tk.fn = {
		eatCall: function(){},
		identity: function(a){ return a; },
		contradiction: function(){ return false; },
		tautology: function(){ return true; },
		resign: function(a){ return -a; },
		negation: function(a){ return !a; },
		call: function(a){ return a(); },
		cleanWhitespace: function(a){
			return a.replace(/\s+/g, ' ').trim();
		},
		removeWhitespace: function(a){
			return a.replace(/\s+/, '');
		}
	}

	/* ---- Default configuration ---- */
	tk.config = {
		debug: false,
		documentRoot: document
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
		applyOverride(arguments[0], tk.config);
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
			if (check == 'any'){
				return i - 1;
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

	tk.init = function(initFunction){
		tk.initFunctions.push(initFunction);
	}

	tk.inspection = function(inspectFunction){
		tk.inspectionFunctions.push(inspectFunction);
	}

	/* ---- Delay ---- */
	function Timeout(callback, milliseconds){
		this.handle = null;
	
		this.start = function(){
			this.handle = setTimeout(callback, milliseconds);
			return this;
		}
	
		this.cancel = function(){
			clearTimeout(this.handle);
			this.handle = null;
			return this;
		}
	}
	
	tk.timeout = function(func, milliseconds){
		var t = new Timeout(func, milliseconds);
		t.start();
		return t;
	}
	
	function Interval(callback, milliseconds){
		this.milliseconds = milliseconds;
		this.handle = null;
	
		this.time = function(milliseconds){
			var pausedHere = this.handle != null;
			if (pausedHere){
				this.stop();
			}
			this.milliseconds = milliseconds;
			if (pausedHere){
				this.start();
			}
			return this;
		}
	
		this.start = function(){
			if (this.handle != null){
				throw 'Already started';
			}
			this.handle = setInterval(callback, this.milliseconds);
			return this;
		}
	
		this.stop = function(){
			if (this.handle == null){
				throw 'Not running';
			}
			clearInterval(this.handle);
			this.handle = null;
			return this;
		}
	}
	
	tk.interval = function(callback, milliseconds){
		var i = new Interval(callback, milliseconds);
		i.start();
		return i;
	}
	

	/* ---- Shorthand notation ---- */
	tk.snap = function(shorthand, rootElement){
		//	Process timeouts.
		var oArguments = [].slice.call(arguments);
		oArguments.splice(0, 2);
		var timeoutMatcher = /\.\.\.\(([0-9]+)\)/;
		if (timeoutMatcher.test(shorthand)){
			//	Includes sleeps.
			var steps = shorthand.split(timeoutMatcher),
				isTimeout = false,
				timeout = 0,
				returnValue;
			tk.iter(steps, function(step, i){
				if (isTimeout){
					timeout += step;
				}
				else {
					if (timeout > 0){
						tk.timeout(function(){
							tk.snap.apply(tk, [steps[i], rootElement].concat(oArguments));
						}, timeout);
					}
					else {
						returnValue = tk.snap.apply(tk, [steps[i], rootElement].concat(oArguments));
					}
				}
	
				isTimeout = !isTimeout;
			});
	
			return returnValue;
		}
	
		//	Collect variables.
		var variables = {
			'$e': rootElement
		};
		for (var i = 2; i < arguments.length; i++){
			var arg = arguments[i];
			if (typeof arg == 'object' && arg !== null){
				for (var name in arg){
					variables['$' + name] = arg[name];
				}
			}
			else {
				variables['$' + (i - 2)] = arg;
			}
		}
	
		function error(){
			throw [].slice.call(arguments).join(' ') + ' (in snap: ' + shorthand.substring(0, shorthand.length - 1) + ')';
		}
	
		function resolveVariable(variable){
			var expression;
	
			//	Resolve values.
			if (variable === undefined || variable.length == 0){
				variable = '$0';
			}
			else if (expression = /([a-z]+)\((.*?)\)/.exec(variable)){
				var name = expression[1],
					params = tk.comprehension(expression[2].split(/\s+/), tk.fn.cleanWhitespace),
					found = false;
				
				tk.iter(tk.snap.storage.functions, function(key, func){
					if (key == name){
						variable = func(params, resolveVariable);
						found = true;
						return false;
					}
				});
				if (!found){
					error('No such function:', name);
				}
			}
			
			if (variable[0] == '$'){
				variable = variables[variable];
			}
	
			if (variable == 'true'){ return true; }
			else if (variable == 'false'){ return false; }
			return variable;
		}
	
		function resolveOne(left, right, prefix){
			right = resolveVariable(right);
	
			//	Resolve a single expression.
			if (prefix.length > 0){
				element.attr(left, right);
			}
			else {
				//	Locate directive.
				var expression;
				if (!(expression = /^([a-z]+)(?:\((.*?)\)|)$/.exec(left))){
					error('Invalid directive:', left);
				}
	
				var name = expression[1],
					pure = expression[2] === undefined ? [] : expression[2].split(/\s+/),
					params = tk.comprehension(pure, function(s){
						s = s.trim();
						if (s.length > 0){ return s; }
					}),
					found = false;
				
				tk.iter(tk.snap.storage.directives, function(key, directive){
					if (name == key){
						if (directive(params, right, element, resolveVariable) === false){
							error('Illegal call to directive:', left);
						}
						found = true;
						return false;
					}
				});
				if (!found){
					error('No such directive:', name);
				}
			}
		}
	
		function createReferencedElement(tagName, idMod, classMod){
			var created = tk.tag(tagName);
			if (idMod.length > 0){
				created.attr('id', idMod.substring(1))
			}
			if (classMod.length > 0){
				var classes = classMod.split('.');
				for (var i = 1; i < classes.length; i++){
					created.classify(classes[i]);
				}
			}
			return created;
		}
	
		shorthand += '&';
		var depthFinder = /(.*?)([>&^])/g,
			element = rootElement,
			depth,
			last = element;
		while (depth = depthFinder.exec(shorthand)){
			var siblingMode = depth[2].length > 0 && depth[2] == '&',
				riseMode = depth[2].length > 0 && depth[2] == '^',
				item = depth[1];
	
			//	Parse.
			var match = /^([+\-]|)(\*|)([$a-z0-9]+)((?:\([$a-z0-9]+\))|)((?:#\w+)|)((?:\.[\w\-]+)+|)((?:\:{1,2}[$\w\s\-()]+(?:=[$\w\s.]+){0,1})+|)$/.exec(item),
				resolve = function(){ return element; };
	
			if (match == null){
				error('Invalid element reference:', item);
			}
			//	Parse match for maintainability
			var elementPolicy = match[1],
				laxElementPolicy = match[2].length > 0,
				tagName = match[3],
				childIndex = match[4],
				idMod = match[5],
				classMod = match[6],
				assignments = match[7];
	
			//	Process child index.
			if (childIndex.length > 0){
				childIndex = resolveVariable(childIndex.substring(1, childIndex.length - 1));
			}
			else {
				childIndex = null;
			}
	
			if (elementPolicy.length == 0){
				//	Selection.
				if (tagName == '$e'){
					element = rootElement;
				}
				else {
					element = element.children(tagName + idMod + classMod);
					if (element.empty){
						error('No matched element for reference:', item);
					}
					if (childIndex != null){
						element = element.ith(childIndex);
					}
				}
			}
			else {
				//	Create.
				var create = true;
				if (laxElementPolicy){
					element = element.children(tagName + idMod + classMod);
					create = element.empty;
					if (childIndex != null){
						create = create || element.length <= childIndex;
						if (!create){
							element = element.ith(childIndex);
						}
					}
					if (create){
						element = element.back();
					}
				}
	
				if (create){
					var parent = element;
					element = createReferencedElement(tagName, idMod, classMod);
					
					resolve = function(){
						elementPolicy == '-' ? parent.prepend(element) : parent.append(element);
					}
				}
			}
	
			if (assignments.length > 0){
				var matcher = /:(:|)([$\w\s\-()]+)((?:=[$\w\s.]+)|)/g,
					assignment;
				while (assignment = matcher.exec(assignments)){
					//	Parse for maintainability.
					var prefix = assignment[1],
						left = assignment[2],
						right = assignment[3].substring(1);
	
					if (left.length > 0){
						resolveOne(left, right, prefix);
					}
					else {
						resolveOne(left, 'v', prefix);
					}
				}
			}
	
			resolve();
			if (siblingMode){
				if (element.backChain){
					last = element;
					element = element.back();
				}
			}
			else if (riseMode){
				last = element.back();
				element = last.back();
			}
		}
	
		return last;
	}
	tk.snap.storage = {
		directives: {
			html: function(params, right, element){
				if (params.length > 0){ return false; }
				element.html(right);
			},
			text: function(params, right, element){
				if (params.length > 0){ return false; }
				element.text(right);
			},
			remove: function(params, right, element){
				if (params.length > 0){ return false; }
				element.remove();
			},
			wipe: function(params, right, element){
				if (params.length > 0){ return false; }
				element.html('');
			},
			class: function(params, right, element, resolve){
				if (params.length == 0){ return false; }
				var varg = tk.varg.on(params);
				element.classify(resolve(params[0]), resolve(varg(1, true)), +resolve(varg(2, -1)));
			},
			declass: function(params, right, element, resolve){
				if (params.length == 0){ return false; }
				var varg = tk.varg.on(params);
				element.classify(resolve(params[0]), !resolve(varg(1, true)), +resolve(varg(2, -1)));
			},
			css: function(params, right, element, resolve){
				if (params.length == 0){ return false; }
				element.css(resolve(params[0]), resolve(params[1]));
			}
		},
		functions: {
			null: function(params, resolve){
				return resolve(params[0]) === null;
			},
			notnull: function(params, resolve){
				return resolve(params[0]) !== null;
			}
		}
	}
	tk.snap.directive = function(name, directive){
		tk.snap.storage.directives[name] = directive;
	}
	tk.snap.function = function(name, func){
		tk.snap.storage.functions[name] = func;
	}

	/* ---- Selection ---- */
	function ToolkitSelection(selection){
		/*
			A selection of a set of elements.
		*/
		var self = this;
		this.backChain = tk.varg(arguments, 1, null);
		
		//	Resolve the selection.
		this.set = (function(){
			if (selection instanceof ToolkitSelection){
				//  Duplicate.
				selection = selection.set.splice();
			}
			switch (tk.typeCheck(selection, Element, Window, NodeList, Array, 'string')){
				case 0:
				case 1: return [selection];
				case 2:
				case 3:
					var elements = [];
					//  Collect elements, accounting for `ToolkitSelection` 
					//  presence.
					for (var i = 0; i < selection.length; i++){
						var item = selection[i];
						if (item instanceof ToolkitSelection){
							elements = elements.concat(item.set);
						}
						else {
							elements.push(item);
						}
					}
					return elements;
				case 4: 
					return tk.config.documentRoot.querySelectorAll(selection);
			}
		})();
		//	Define the cardinality of the selection.
		this.length = this.set.length;
		this.empty = this.length == 0;
	
		this.back = function(){
			/*
				Return the `ToolkitSelection` that generated this one (through a 
				call to `append`, `children`, etc.).
			*/
			if (this.backChain == null){
				throw 'Illegal back()';
			}
			return this.backChain;
		}
	
		this.ith = function(i){
			/*
				Return a new `ToolkitSelection` selecting the `i`th selected 
				element, or the `i`th selected element itself if a second 
				positional argument is `false`.
				
				If `i` is out of bounds, throw an exception.
			*/
			if (i < 0 || i >= this.length){
				throw 'Out of bounds: ' + i;
			}
			if (tk.varg(arguments, 1, true)){
				return new ToolkitSelection(this.set[i], this);
			}
			return this.set[i];
		}
	
		this.first = function(){
			return this.ith(0);
		}
	
		this.reversed = function(){
			/*
				Return a new `ToolkitSelection` selecting the same set, but in 
				reverse order.
			*/
			var newSet = this.set.slice();
			newSet.reverse();
			return new ToolkitSelection(newSet, this);
		}
	
		this.reduce = function(reducer){
			/*
				Return a new `ToolkitSelection` selecting all selected elements 
				that match the query selector `reducer`.
	
				If `reducer` is a function, return a new `ToolkitSelection` 
				selecting all elements for which it returned true. 
			*/
			var newSet;
			switch (tk.typeCheck(reducer, 'string', 'function')){
				case 0:
					newSet = this.comprehension(function(e){
						if (e.is(reducer)){ return e; }
					});
					break;
				case 1:
					newSet = this.comprehension(reducer);
			}
			
			return new ToolkitSelection(function(){
			}, this);
		}
	
		this.extend = function(extension){
			/*
				Return a new `ToolkitSelection` with an expanded set of selected 
				elements.
			*/
			switch (tk.typeCheck(extension, ToolkitSelection, Array)){
				case 0:
					return new ToolkitSelection(this.set.concat(extension.set), this);
				case 1:
					var elements = [];
					//	Convert `ToolkitSelection`s to elements.
					for (var i = 0; i < extension.length; i++){
						var item = extension[i];
						if (item instanceof ToolkitSelection){
							elements = elements.concat(item.set);
						}
						else {
							elements.push(item);
						}
					}
					return new ToolkitSelection(this.set.concat(extension), this);
			}
		}
	
		this.parents = function(){
			/*
				Return a new `ToolkitSelection` selecting parents of the currently 
				selected elements.
	
				Can be passed any permutation of one or more of the following
				parameters:
				* `high`: Whether to select all parents rather than only immediate
					ones (default `true`).
				* `reducer`: A filter on the selected parents. Either a query 
					selector or a boolean function passed each parent element and 
					the index of its selected child.
			*/
			if (arguments.length == 1 && typeof arguments[0] == 'boolean'){
				//	Recurse with long-hand call.
				return this.parents('*', arguments[0]);
			}
	
			//	Collect parameters.
			var varg = tk.varg.on(arguments);
			var reducer = varg(0, '*'),
				high = varg(1, true);
			//	Assert parameter types.
			var reduction = tk.typeCheck(reducer, 'string', 'function');
			tk.typeCheck(high, 'boolean');
	
			var parents = [];
			function filter(e, i){
				return (
					(reduction == 0 && e.matches(reducer)) ||
					(reduction == 1 && reducer(e, i))
				);
			}
	
			this.iter(function(e, i){
				var parent = e.parentNode;
				while (parent != tk.config.documentRoot){
					if (filter(parent, i)){
						parents.push(parent);
					}
					if (!high){ return; }
					parent = parent.parentNode;
				}
			}, false);
			return new ToolkitSelection(parents, this);
		}
		
		this.children = function(){
			/*
				Return a new `ToolkitSelection` selecting all the childen of all 
				selected elements.
	
				Can be passed any permutation of one or more of the following
				parameters:
				* `deep`: Whether to select all children rather than only immediate
					ones (default `true`).
				* `reducer`: A filter on the selected children. Either a query 
					selector or a boolean function passed each child element and 
					the index of its selected parent.
			*/
			if (arguments.length == 1 && typeof arguments[0] == 'boolean'){
				//	Recurse with long-hand call.
				return this.children('*', arguments[0]);
			}
			
			//	Collect parameters.
			var varg = tk.varg.on(arguments);
			var selector = varg(0, '*'),
				deep = varg(1, true);
			//	Assert parameter types.
			var selection = tk.typeCheck(selector, 'string', 'function');
			tk.typeCheck(deep, 'boolean');
	
			var children = [];
			function retriever(e, i){
				if (selection == 0){
					return deep ? e.querySelectorAll(selector) : e.children;
				}
				else {
					var check = deep ? e.querySelectorAll('*') : e.children;
					return tk.comprehension(check, function(c){
						if (selector(new ToolkitSelection(c), i)){ return c; }
					});
				}
			}
	
			this.iter(function(e, i){
				var vals = retriever(e, i);
				for (var i = 0; i < vals.length; i++){
					children.push(vals[i]);
				}
			}, false);
			return new ToolkitSelection(children, this);
		}
		
		this.copy = function(){
			/*
				Deep-copy the first selected element and return a 
				`ToolkitSelection` selecting it.
	
				::firstonly
			*/
			return new ToolkitSelection(this.set[0].cloneNode(true), this);
		}
	
		this.equals = function(object){
			/*
				Return:
				* Given an `Element`, whether the selected set contains only that 
					element.
				* Given an `Array`, whether the array contains all elements of the 
					selected set, and vice-versa.
				* Given a `ToolkitSelection`, whether it is selecting the identical 
					set of elements.
			*/
			switch(tk.typeCheck(object, Element, Array, ToolkitSelection)){
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
	
		this.iter = function(func){
			/*	
				Iterate the currently selected set, passing each selected element 
				and its index to a callback.
	
				Like `iter()`, `func` can return `false` to cease the iteration.
			*/
			var propogate = tk.varg(arguments, 1, true);
			for (var i = 0; i < this.set.length; i++){
				var e = this.set[i];
				if (propogate){
					e = new ToolkitSelection(e, this);
				}
				if (func(e, i) === false){
					break;
				}
			}
			return this;
		}
	
		this.comprehension = function(func){
			/*
				Perform a comprehension on the currently selected set of elements. 
				All non-`undefined` values returned from `func` are added to an 
				array which is returned by this function.
			*/
			var propogate = tk.varg(arguments, 1, true),
				result = [];
			for (var i = 0; i < this.set.length; i++){
				var e = this.set[i];
				if (propogate){
					e = new ToolkitSelection(e, this);
				}
				var value = func(e, i);
				if (value !== undefined){
					result.push(value);
				}
			}
			return result;
		}
	
		this.is = function(check){
			/*	
				Return whether all selected elements match a selector or the
				condition imposed by a boolean function.
			*/
			//	Assert parameter type.
			var type = tk.typeCheck(check, 'string', 'function');
			for (var i = 0; i < this.length; i++){
				var e = this.set[i];
				if (type == 0){
					if (!e.matches(check)){
						return false;
					}
				}
				else {
					if (!check(new ToolkitInstance(e), i)){
						return false;
					}
				}
			}
			return true;
		}
	
		this.classes = function(){
			/*
				Return the complete list of classes for all selected elements.
			*/
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
	
		this.value = function(){
			/*
				Return the value of the first selected element if it's an input,
				or if a parameter is provided set the value of each selected input.
	
				::firstonly
			*/
			if (arguments.length > 0){
				var value = arguments[0];
				this.iter(function(e){
					e.value = value;
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
	
		this.attr = function(arg){
			/*
				Get, set, or modify element attributes.
	
				To remove an attribute, pass `null` as its value.
	
				::argspec attr
				Return the value of an attribute on the first selected element, 
				or `null` if it isn't present.
	
				::argspec attr, value
				Set the value of `attr` to `value` for each selected element. 
				`value` can be a function to resolve.
	
				::argspec attrMap
				Set the attribute values of all selected elements from the object
				`attrMap`. Values can be functions to resolve.
	
				::softfirstonly
			*/
			switch (tk.typeCheck(arg, 'string', 'object')) {
				case 0:
					if (arguments.length > 1){
						//	Single attribute assignment.
						var name = arg, value = arguments[1];
						switch (tk.typeCheck(value, null, 'string', 'function')){
							case 0:
								this.iter(function(e, i){
									e.removeAttribute(name, null);
								}, false);
								break;
							default:
								this.iter(function(e, i){
									e.setAttribute(name, tk.resolve(value, e, i));
								}, false);
						}
					}
					else {
						if (this.set[0].hasAttribute(arg)){
							return this.set[0].getAttribute(arg);
						}
						return null;
					}
					break;
				case 1:
					//	Multi-set.
					this.iter(function(e, i){
						for (var name in arg){
							e.setAttribute(name, tk.resolve(arg[name], e, i));
						}
					}, false);
					break;
			}
			return this;
		}
	
		this.css = function(prop){
			/*
				Get computed styles and set element-level styles.
	
				Style names can be in camel or hyphen case.
				
				::argspec - 
				Return the computed value of the CSS style named `prop` for the
				first selected element.
	
				::argspec styleMap
				Set the style of each selected element based on that style's value
				in `styleMap`. Values can be functions to resolve.
	
				::argspec -, value
				Set the element-level style for each selected element. `value`
				can be a function to resolve.
	
				::softfirstonly
			*/
			function applyOne(name, value){
				//	Make dash case.
				name = name.replace(/-([a-z])/g, function(g){
					return g[1].toUpperCase();
				});	
				self.iter(function(e, i){
					var realValue = tk.resolve(value, e, i);
					if (typeof realValue == 'number'){
						//	Default to pixels.
						realValue = realValue + 'px';
					}
					e.style[name] = realValue;
				}, false);
			}
	
			switch (tk.typeCheck(prop, 'string', 'object')){
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
					//	Multi-set.
					for (var name in prop){
						applyOne(name, prop[name]);
					}
					break;
			}
			return this;
		}
	
		this.on = function(arg){
			/*	
				All callbacks are passed the firing element and its index in the 
				bound selection, in that order.
	
				::argspec event, callback
				Bind `callback` to `event` for all selected elements.
	
				::argspec callbackMap
				Bind callbacks from a event, callback mapping.
			*/
			function setOne(event, func){
				self.iter(function(e, i){
					if (!tk.prop(e, '__listeners__')){
						e.__listeners__ = [];
					}
					var add = {
						event: tk.resolve(event, e, i),
						func: function(g){
							func(new ToolkitSelection(e), g, i);
						}
					}
					e.__listeners__.push(add)
					e.addEventListener(add.event, add.func);
				}, false);
			}
	
			switch (tk.typeCheck(arg, 'string', 'object')){
				case 0:
					//	Single set.
					setOne(arg, arguments[1]);
					break;
				case 1:
					//	Multi-set.
					for (var name in arg){
						setOne(name, arg[name]);
					}
					break;
			}
			return this;
		}
	
		this.off = function(event){
			/*
				Remove all listeners for on `event` from all selected elements.
			*/
			this.iter(function(e){
				var list = tk.prop(e, '__listeners__', []), remove = [];
				//	Find the callbacks to remove.
				tk.iter(list, function(o, i){
					if (o.event == event){
						e.removeEventListener(o.event, o.func);
						remove.push(i);
					}
				});
				//	Remove all found callbacks.
				tk.iter(remove, function(i){
					list = list.splice(i, 1);
				});
			}, false);
			return this;
		}
	
		this.classify = function(arg){
			/*
				Add, remove, or toggle a class.
	
				All flags can be a function to resolve.
	
				::argspec cls
				Add `cls` to all selected elements.
				
				::argspec cls, flag
				Add `cls` to all selected elements, or remove it if `flag` is 
				`false`.
	
				If `flag` is the string `'toggle'`, toggle the class.
	
				::argspec cls, flag, time
				Perform the operation above, then perform the inverse after `time` 
				milliseconds.
	
				::argspec clsMap
				Apply classes to all selected elements based on a class, flag 
				mapping.
			*/
			function classifyOne(cls, flag, time){
				var selector = '.' + cls;
				if (flag == 'toggle'){
					//	Special second parameter case.
					f = function(e, i){
						return !e.is(selector);
					}
				}
				self.iter(function(e, i){
					var actualFlag = tk.resolve(flag, e, i),
						classes = e.classes();
					if (actualFlag){
						//	Add.
						if (!e.is(selector)){
							classes.push(cls);
							e.set[0].className = classes.join(' ').trim();
						}
					}
					else {
						//	Remove.
						if (e.is(selector)){
							classes.splice(classes.indexOf(cls), 1);
							e.set[0].className = classes.join(' ').trim();
						}
					}
					var actualTime = tk.resolve(time, e, i);
					if (actualTime >= 0){
						//	Reverse the classification later.
						tk.timeout(function(){
							classifyOne(cls, !actualFlag, -1);
						}, actualTime);
					}
				});
			}
	
			switch (tk.typeCheck(arg, 'string', 'object')){
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
	
		this.remove = function(){
			/*
				Remove all currently selected elements from the DOM (they remain 
				selected).
			*/
			this.iter(function(e){
				if (e.parentNode != null){
					e.parentNode.removeChild(e);
				}
			}, false);
			return this;
		}
	
		this.append = function(arg){
			/*
				Append an element or array of elements to the first selected 
				element. If the parameter or any of the contents of an array are a
				`ToolkitSelection`, all of its selected elements are appended.
	
				Returns a new `ToolkitSelection` selecting all appended elements.
				
				::firstonly
			*/
			switch (tk.typeCheck(arg, Array, ToolkitSelection, 'string', Element)){
				case 0:
					var set = [];
					//	Collect.
					tk.iter(arg, function(e, i){
						if (e instanceof ToolkitSelection){
							e.remove();
							set = set.concat(e.set);
						}
						else {
							e.parentNode.removeChild(e);
							set.push(e);
						}
					});
					//	Insert.
					tk.iter(set, function(e){
						var selection = new ToolkitSelection(e, this);
						tk.iter(tk.inspectionFunctions, function(f){
							f(selection);
						});
						self.set[0].appendChild(e);
					});
					return new ToolkitSelection(set, this);
				case 1:
					arg.iter(function(g){
						g.remove();
						self.set[0].appendChild(g.set[0]);
						tk.iter(tk.inspectionFunctions, function(f){
							f(g);
						});
					});
					arg.backChain = this;
					return arg;
				case 2:
					arg = document.createElement(arg);
				case 3:
					self.set[0].appendChild(arg);
					var selection = new ToolkitSelection(arg, this)
					tk.iter(tk.inspectionFunctions, function(f){
						f(selection);
					});
					return selection;
			}
		}
	
		this.prepend = function(e){
			/*
				Prepend an element or array of elements to the first selected 
				element. If the parameter or any of the contents of an array are a
				`ToolkitSelection`, all of its selected elements are prepended.
	
				Returns a new `ToolkitSelection` selecting all prepended elements.
				
				::firstonly
			*/
			switch (tk.typeCheck(e, Array, ToolkitSelection, Element)){
				case 0:
					var set = [];
					//	Collect.
					tk.iter(arg, function(e, i){
						if (e instanceof ToolkitSelection){
							e.remove();
							set = set.concat(e.set);
						}
						else {
							e.parentNode.removeChild(e);
							set.push(e);
						}
					});
					//	Insert.
					tk.iter(set, function(e){
						var selection = new ToolkitSelection(e, this);
						tk.iter(tk.inspectionFunctions, function(f){
							f(selection);
						});
						self.set[0].insertBefore(e, self.set[0].firstChild);
					});
					return new ToolkitSelection(set, this);
				case 1:
					e.reversed().iter(function(g){
						g.remove();
						self.set[0].insertBefore(g.set[0], self.set[0].firstChild);
						tk.iter(tk.inspectionFunctions, function(f){
							f(g);
						});
					});
					e.backChain = this;
					return e;
				case 2:
					self.set[0].insertBefore(e, self.set[0].firstChild);
					var selection = new ToolkitSelection(e, this);
					tk.iter(tk.inspectionFunctions, function(f){
						f(selection);
					});
					return selection;
			}
		}
	
		this.tag = function(){
			/*
				Return the tag name of the first selected element.
	
				::firstonly
			*/
			return this.set[0].tagName;
		}
	
		this.next = function(){
			/*
				Return the next element sibling of the first selected element.
	
				::firstonly
			*/
			var next = this.set[0].nextElementSibling;
			if (next == null){
				next = [];
			}
			return new ToolkitSelection(next, this);
		}
	
		this.prev = function(){
			/*
				Return the previous element sibling of the first selected element.
	
				::firstonly
			*/
			var n = this.set[0].previousElementSibling;
			if (n == null){
				n = [];
			}
			return new ToolkitSelection(n, this);
		}
	
		this.html = function(){
			/*
				::argspec -
				Return the HTML content of the first selected element.
				
				::argspec html
				Set the HTML content of each selected element.
	
				::softfirstonly
			*/
			if (arguments.length > 0){
				var h = arguments[0];
				this.iter(function(e, i){
					e.innerHTML = tk.resolve(h, new ToolkitSelection(e), i);
				}, false);
				return this;
			}
			else {
				return this.set[0].innerHTML;
			}
		}
	
		this.text = function(){
			/*
				::argspec -
				Get the text content of the first selected element.
				
				::argspec text
				Set the text content of each selected element.
				
				::softfirstonly
			*/
			if (arguments.length > 0){
				var t = arguments[0];
				this.iter(function(e, i){
					e.textContent = tk.resolve(t, new ToolkitSelection(e), i);
				}, false);
				return this;
			}
			else {
				return this.set[0].textContent;
			}
		}
	
		this.select = function(){
			/*
				Select the first selected element if it's an input.
	
				::firstonly
			*/
			this.set[0].select();
			return this;
		}
		
		this.offset = function(){
			/*
				Return the (`x`, `y`) offset within the document of the first 
				selected element.
	
				::firstonly
			*/
			var x = 0, y = 0, e = this.set[0];
			while (e != null){
				x += e.offsetLeft;
				y += e.offsetTop;
				e = e.offsetParent;
			}
			return {x: x, y: y};
		}
		
		this.size = function(){
			/*
				Return the (`width`, `height`) size of the `content-box` of the 
				first selected element.
	
				If a first argument is `false`, return the outer size including
				margin and padding.
			*/
			var e = this.set[0],
				box = e.getBoundingClientRect(),
				size = {width: box.width, height: box.height};
			if (tk.varg(arguments, 0, false)){
				var style = window.getComputedStyle(e, null);
				//	Add margin.
				size.width 
					+= style.getPropertyValue('margin-left') 
					+ style.getPropertyValue('margin-right');
				size.height 
					+= style.getPropertyValue('margin-top') 
					+ style.getPropertyValue('margin-bottom');
				if (style.getPropertyValue('box-sizing') == 'border-box'){
					//	Add padding.
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
	
		this.snap = function(shorthand){
			var variables = [].slice.call(arguments);
			variables.splice(0, 1);
			return tk.snap.apply(tk, [shorthand, this].concat(variables));
		}
	
		this.binding = function(){
			return tk.binding.apply(tk, arguments)
				.onto(this);
		}
		this.binding.snap = function(){
			var args = [].slice.call(arguments);
			return tk.binding.snap.apply(tk, [self].concat(args));
		}
	}

	/* ---- Requests ---- */
	tk.requestProcessors = [];
	
	function Request(method, url){
		var self = this;
		this.fns = {
			success: tk.fn.eatCall,
			failure: tk.fn.eatCall
		};
		this.storage = {
			url: url,
			method: method,
			query: {},
			headers: {},
			body: null
		}
	
		this.success = function(success){
			/*
				Set the success callback.
			*/
			this.fns.success = success;
			return this;
		}
	
		this.failure = function(failure){
			/*
				Set the failure callback.
			*/
			this.fns.failure = failure;
			return this;
		}
	
		this.json = function(object){
			/*
				Provide an object to serialize as JSON for the body of this 
				request.
			*/
			this.storage.headers['Content-Type'] = 'application/json';
			this.storage.body = tk.unbound(object);
			return this;
		}
	
		this.text = function(object){
			/*
				Provide a text body.
			*/
			this.storage.headers['Content-Type'] = tk.varg(arguments, 1, 'text/plain');
			this.storage.body = object;
			return this;
		}
	
		this.header = function(key, value){
			/*
				Provide a header.
			*/
			this.storage.headers[key] = value;
			return this;
		}
	
		this.query = function(map){
			/*
				Set the key, value mapping for the query string.
			*/
			this.storage.query = map;
			return this;
		}
	
		this._processResponse = function(xhr){
			//	TODO: More;
			//	Parse response.
			var contentType = xhr.getResponseHeader('Content-Type'),
				status = xhr.status,
				responseData = xhr.responseText;;
			switch (contentType){
				case 'application/json':
					responseData = JSON.parse(xhr.responseText)
					break;				
			}
	
			//	Log.
			tk.log('Received ' + status + ' (' + this.storage.method + ', ' + this.storage.url + '):', responseData);
	
			//	Dispatch appropriate callback.
			var callback = status < 400 ? this.fns.success : this.fns.failure;
			callback(responseData, status);
		}
	
		this.send = function(object){
			var xhr = new XMLHttpRequest();
	
			tk.iter(tk.requestProcessors, function(f){
				f(self);
			});
	
			//	Create query string.
			var fullURL = this.storage.url;
			var queryItems = [];
			tk.iter(this.storage.query, function(k, v){
				queryItems.push(k + '=' + encodeURIComponent(v));
			});
			if (queryItems.length > 0){
				fullURL += '?' + queryItems.join('&');
			}
	
			xhr.onreadystatechange = function(){
				if (this.readyState == 4){
					self._processResponse(this);
				}
			}
	
			var processedBody = '';
			if (this.storage.body != null){
				//	Process body.
				//	TODO: More;
				var mimetype = this.storage.headers['Content-Type'];
				switch (mimetype){
					case 'text/plain':
						break;
					case 'application/json':
						processedBody = JSON.stringify(this.storage.body);
						break;
					default:
						throw 'Unknown request content type (' + mimetype + ')';
				}
			}
	
			xhr.open(this.storage.method, fullURL, true);
			tk.iter(this.storage.headers, function(k, v){
				xhr.setRequestHeader(k, v);
			});
	
			xhr.send(processedBody);
	
			tk.log('Sent (' + method + ': ' + url + ')', this.storage.body);
		}
	}
	
	tk.request = function(method, url){
		return new Request(method, url);
	}
	tk.request.processor = function(callback){
		tk.requestProcessors.push(callback);
	}

	/* ---- Binding ---- */
	function ElementPropertyBinding(parent, element){
		var self = this;
		this.parent = parent;
		this.element = element;
		this.started = false;
		this.fns = {
			reset: tk.fn.eatCall,
			transform: tk.fn.identity,
			placement: function(d, e){
				e.html(d);
			}
		}
	
		this._applyChange = function(newValue){
			if (!self.started){
				self.fns.reset(newValue, self.element);
				self.started = true;
			}
			self.fns.placement(self.fns.transform(newValue), self.element);
		}
	
		this.reset = function(callback){
			this.fns.reset = callback;
			return this;
		}
	
		this.transform = function(callback){
			this.fns.transform = callback;
			return this;
		}
	
		this.placement = function(callback){
			this.fns.placement = callback;
			return this;
		}
	
		this.and = function(){
			parent.changed(this._applyChange);
			return this.parent.and();
		}
	
		this.begin = function(){
			parent.changed(this._applyChange);
			return this.parent.begin();
		}
	}
	
	function PropertyBinding(host, property){
		var self = this;
		this.source = tk.varg(arguments, 2, null);
		this.host = host;
		this.property = property;
		this.fns = {
			callback: tk.fn.eatCall
		};
	
		this._processChange = function(newValue){
			self.fns.callback(newValue);
		}
	
		this._createListener = function(bindings, initialValue){
			var value = initialValue;
			return {
				get: function(){
					return value;
				},
				set: function(newValue){
					tk.iter(bindings, function(b){
						b(newValue);
					});
					value = newValue;
				}
			};
		}
	
		this.changed = function(callback){
			this.fns.callback = callback;
			return this;
		}
	
		this.onto = function(element){
			return new ElementPropertyBinding(this, element);
		}
	
		this.and = function(){
			return new PropertyBinding(this.host, this.property, this);
		}
	
		this.begin = function(){
			if (this.source != null){
				this.source.begin();
			}
			else {
				//  Ensure bindings map exists.
				if (!tk.prop(this.host, '__bindings__')){
					this.host.__bindings__ = {};
				}
				
				//  Ensure a list exists for this binding.
				if (!tk.prop(this.host.__bindings__, property)){
					//  Attach the listener.
					this.host.__bindings__[property] = [];
					var descriptor = this._createListener(this.host.__bindings__[property], this.host[property]);
					Object.defineProperty(this.host, property, descriptor);
				}
			}
	
			//	Add the binding.
			this.host.__bindings__[property].push(this._processChange);
			
			//	Apply initial.
			this._processChange(this.host[property]);
	
			return this;
		}
	}
	
	function ElementArrayBinding(parent, element){
		var self = this;
		this.parent = parent;
		this.element = element;
		this.consts = {
			tag: 'div'	//	TODO: Configure.
		};
		this.fns = {
			removal: function(d, e, i){
				e.remove();
			},
			transform: tk.fn.identity,
			reset: function(d, e, i){
				e.html('');
			},
			placement: function(d, e, i){
				e.html(d);
			}
		};
	
		this.tag = function(tag){
			this.consts.tag = tag;
			return this;
		}
	
		this._applyAdd = function(newValue, index){
			var toAdd = tk.tag(self.consts.tag);
			self.fns.placement(self.fns.transform(newValue), toAdd, index);
			self.element.append(toAdd);
		}
	
		this._applyRemove = function(value, index){
			//	TODO: Better.
			var toRemove = self.element.children(false).ith(index);
			self.fns.removal(value, toRemove, index);
		}
	
		this._applyChanged = function(value, index){
			//	TODO: Better.
			var target = self.element.children(false).ith(index);
			self.fns.reset(value, target, index);
			self.fns.placement(self.fns.transform(value), target, index);
		}
	
		this.removal = function(callback){
			this.fns.removal = callback;
			return this;
		}
	
		this.transform = function(callback){
			this.fns.transform = callback;
			return this;
		}
	
		this.placement = function(callback){
			this.fns.placement = callback;
			return this;
		}
	
		this.reset = function(callback){
			this.fns.placement = callback;
			return this;
		}
	
		this.and = function(){
			parent.changed(this._applyChanged);
			parent.removed(this._applyRemove);
			parent.added(this._applyAdd);
			return this.parent.and();
		}
	
		this.begin = function(){
			parent.changed(this._applyChanged);
			parent.removed(this._applyRemove);
			parent.added(this._applyAdd);
			return this.parent.begin();
		}
	}
	
	function ArrayBinding(ary){
		var self = this;
		this.source = tk.varg(arguments, 1, null);
		this.ary = ary;
		this.fns = {
			added: tk.fn.eatCall,
			removed: tk.fn.eatCall,
			changed: tk.fn.eatCall
		}
	
		this._createListener = function(index, initialValue){
			var value = initialValue;
			return {
				get: function(){
					return value;
				},
				set: function(newValue){
					self.fns.changed(newValue, index);
					value = newValue;
				},
				configurable: true
			};
		}
	
		this._wrapIndicies = function(){
			tk.iter(this.ary, function(v, i){
				var descriptor = self._createListener(i, v);
				Object.defineProperty(self.ary, i + '', descriptor);
			});
		}
	
		this.added = function(callback){
			this.fns.added = callback;
			return this;
		}
	
		this.removed = function(callback){
			this.fns.removed = callback;
			return this;
		}
	
		this.changed = function(callback){
			this.fns.changed = callback;
			return this;
		}
	
		this.onto = function(element){
			return new ElementArrayBinding(this, element);
		}
	
		this.and = function(element){
			return new ArrayBinding(this.ary, this);
		}
	
		this.begin = function(){
			if (this.source != null){
				this.source.begin();
			}
	
			//	Install listensers.
			var innerPush = this.ary.push;
			this.ary.push = function(){
				for (var i = 0; i < arguments.length; i++){
					self.fns.added(arguments[i], self.ary.length + i);
				}
				var returnValue = innerPush.apply(self.ary, arguments);
				self._wrapIndicies();
				return returnValue;
			}
	
			var innerPop = this.ary.push;
			this.ary.pop = function(){
				var index = self.ary.length - 1;
				self.fns.removed(self.ary[index], index);
				var returnValue = innerPop.apply(self.ary);
				self._wrapIndicies();
				return returnValue;
			}
	
			var innerSplice = this.ary.splice;
			this.ary.splice = function(start, count){
				for (var i = 0; i < count; i++){
					var index = i + start;
					self.fns.removed(self.ary[index], index);
				}
				var returnValue = innerSplice.apply(self.ary, [start, count]);
				self._wrapIndicies();
				return returnValue;
			}
	
			//	Apply initial.
			for (var i = 0; i < this.ary.length; i++){
				self.fns.added(this.ary[i], i);
			}
			self._wrapIndicies();
	
			return this;
		}
	}
	
	tk.binding = function(host){
		if (host instanceof Array){
			return new ArrayBinding(host);
		}
		else {
			var property = tk.varg(arguments, 1);
			return new PropertyBinding(host, property);
		}
	}
	tk.binding.on = function(host){
		return function(property){
			return tk.binding(host, property);
		}
	}
	tk.binding.snap = function(rootElement, host, bindings){
		switch (tk.typeCheck(host, Array, 'object')){
			case 0:
				if (typeof bindings == 'string'){
					bindings = {add: bindings};
				}
	
				var binding = tk.binding(host)
					.onto(rootElement);
				
				if (tk.prop(bindings, 'add')){
					binding.placement(function(d, e, i){
						tk.snap(bindings.add, e, d, {
							d: d,
							i: i
						});
					});
				}
				binding.begin();
	
			case 1:
				var binding = tk.binding.on(host);
	
				tk.iter(bindings, function(property, bound){
					switch (tk.typeCheck(bound, 'string', 'function')){
						case 0:
							binding(property)
								.onto(rootElement)
									.placement(function(d, e, i){
										tk.snap(bound, e, d, {
											d: d,
											i: i
										});
									})
								.begin();
							break;
						case 1:
							bound(binding(property)).begin();
							break;
					}
				});
				break;
		}
	}
	
	tk.unbound = function(arg){
		switch(tk.typeCheck(arg, Array, 'object', 'any')){
			case 0:
				return tk.comprehension(arg, tk.unbound);
			case 1:
				var copy = {};
				tk.iter(arg, function(key, value){
					if (key.startsWith('__')){
						return;
					}
					copy[key] = tk.unbound(value);
				});
				return copy;
			case 2:
				return arg;
		}
	}
	

	if (/complete|loaded|interactive/.test(document.readyState)){
		initCall();
	}
	else {
		if (window){
			window.addEventListener('DOMContentLoaded', initCall);
		}
	}

	return tk;
}
