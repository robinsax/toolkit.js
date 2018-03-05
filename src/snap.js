tk.snap = function(shorthand, rootElement){
	if (rootElement === undefined){
		//	HOTFIX for behaviour improvement
		return tk.snap(shorthand, tk('body'));
	}

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