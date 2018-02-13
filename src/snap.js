tk.snap = function(shorthand, rootElement){

	//	Collect variables.
	var variables = {
		'$e': rootElement
	};
	for (var i = 2; i < arguments.length; i++){
		var arg = arguments[i];
		if (typeof arg == 'object'){
			for (var name in arg){
				variables['$' + name] = arg[name];
			}
		}
		else {
			variables['$' + (i - 2)] = arg;
		}
	}

	function resolveVariable(variable){
		//	Resolve values.
		if (variable.length == 0){
			variable = '$0';
		}
		
		if (variable[0] == '$'){
			return variables[variable];
		}
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
			if (expression = /^css\(([$\w\-]+)((?:\s[$\w\-]+)|)\)$/.exec(left)){
				element.css(expression[1], resolveVariable(expression[2].trim()));
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
			created.classify(classMod.substring(1));
		}
		return created;
	}

	shorthand += '&';
	var depthFinder = /(.*?)([>&])/g,
		element = rootElement,
		depth;
	while (depth = depthFinder.exec(shorthand)){
		var siblingMode = depth[2].length > 0 && depth[2] == '&',
			item = depth[1];

		//	Parse.
		var match = /^([+\-]|)(\*|)([$a-z0-9]+)((?:\([$a-z0-9]+\))|)((?:#\w+)|)((?:\.\w+)|)((?:\:{1,2}[$\w\s\-()]+(?:=[$\w\s.]+){0,1})+|)$/.exec(item),
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
			element = element.back();
		}
	}

	return element;
}