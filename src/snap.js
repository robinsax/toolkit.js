tk.snap = function(shorthand, rootElement){
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

	function resolveVariable(variable){
		var expression;

		//	Resolve values.
		if (variable.length == 0){
			variable = '$0';
		}
		else if (expression = /([a-z]+)\((.*?)\)/.exec(variable)){
			//	Function call.
			switch(expression[1]){
				case 'null':
					variable = resolveVariable(expression[2]) === null;
					break;
				case 'notnull':
					variable = resolveVariable(expression[2]) !== null;
					break;
				default:
					throw 'No such function: ' + expression[1];
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
			//	Check special cases.
			var expression;
			if (expression = /^css\(([\w\-]+)((?:\s[$\w\-]+)|)\)$/.exec(left)){
				element.css(expression[1], resolveVariable(expression[2].trim()));
			}
			else if (expression = /^class\(([$\w\-]+)((?:\s[$()\w\-]+)|)((?:\s[0-9]+)|)\)$/.exec(left)){
				var time = expression[3].length == 0 ? -1 : parseInt(expression[3].trim());
				element.classify(
					resolveVariable(expression[1]),
					resolveVariable(expression[2].trim()),
					time
				);
			}
			else {
				switch (left){
					case 'html':
						element.html(right);
						break;
					case 'text':
						element.text(right);
						break;
					case 'wipe()':
						element.html('');
						break;
					default:
						throw 'Invalid left hand of expression: ' + left + ' (in ' + shorthand + ')';
				}
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
	var depthFinder = /(.*?)([>&])/g,
		element = rootElement,
		depth,
		last = element;
	while (depth = depthFinder.exec(shorthand)){
		var siblingMode = depth[2].length > 0 && depth[2] == '&',
			item = depth[1];

		//	Parse.
		var match = /^([+\-]|)(\*|)([$a-z0-9]+)((?:\([$a-z0-9]+\))|)((?:#\w+)|)((?:\.[\w\-]+)+|)((?:\:{1,2}[$\w\s\-()]+(?:=[$\w\s.]+){0,1})+|)$/.exec(item),
			resolve = function(){ return element; };

		if (match == null){
			throw 'Invalid element reference: ' + item + ' (in ' + shorthand + ')';
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
					throw 'No matched element for reference: ' + item + ' (in ' + shorthand + ')';
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
		if (siblingMode && element.backChain){
			last = element;
			element = element.back();
		}
	}

	return last;
}