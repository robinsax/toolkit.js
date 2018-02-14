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