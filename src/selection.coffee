if Element
	Element.prototype.matches = Element.prototype.matches or Element.prototype.msMatchesSelector or Element.prototype.webkitMatchesSelector

class ToolkitSelection
	@tk: null
	#	TODO: Clean efficiency.
	@clean: (set) ->
		if set instanceof Node
			return [set]
		else if set instanceof ToolkitSelection
			set = set.set
		clean = []
		for item in set
			if item instanceof ToolkitSelection
				clean = clean.concat item.set
			else
				clean.push item
		clean
	
	constructor: (selection, @parent) ->
		#	Resolve the selection set.
		if selection instanceof ToolkitSelection
			@set = selection.set.slice()
		else if selection instanceof Element or selection instanceof Node or selection instanceof Window
			@set = [selection]
		else if selection instanceof NodeList or selection instanceof Array
			@set = []
			for item in selection
				@set = @set.concat ToolkitSelection.clean item
		else if typeof selection == 'string'
			@set = ToolkitSelection.tk.config.root.querySelectorAll selection
		else
			throw 'Illegal selection: ' + selection

		@length = @set.length
		@empty = @length == 0
	
	back: () ->
		if not @parent
			throw 'Illegal back'
		@parent

	ith: (i, wrap=true) ->
		if i < 0 or i > @length
			throw 'Out of bounds: ' + i
		if wrap then new ToolkitSelection @set[i], @ else @set[i]
	
	first: (wrap=true) ->
		@ith(0, wrap)
	
	reversed: () ->
		set = @set.slice()
		set.reverse()
		new ToolkitSelection set, @

	reduce: (reducer) ->
		switch typeof reducer
			when 'string'
				set = @comp (el) ->
					el if el.is reducer
			when 'function'
				set = @comp reducer
			else
				throw 'Illegal reducer'
		new ToolkitSelection set, @

	extend: (extension) ->
		if extension instanceof ToolkitSelection
			set = extension.set
		else if extension instanceof Array or extension instanceof NodeList
			set = ToolkitSelection.clean extension
		else
			throw 'Illegal extension'
		new ToolkitSelection @set.concat set, @
	
	parent: () ->
		@set[0].parentNode or null

	parents: (condition='*', high=true) ->
		conditionType = ['string', 'function', 'boolean'].indexOf typeof condition
		if conditionType < 0
			throw 'Illegal condition'
		else if conditionType == 2
			conditionType = 0
			condition = '*'
			high = false

		checkElement = (element, index) ->
			if conditionType == 0 then element.is condition else condition element, index
		
		set = []
		@iter (el, i) ->
			parent = el.first(false).parentNode
			while parent != ToolkitSelection.tk.config.root and parent != null
				(set.push parent) if checkElement tk parent, i
				if not high
					return
				parent = parent.parentNode
		new ToolkitSelection set, @

	children: (condition='*', deep=true) ->
		conditionType = ['string', 'function'].indexOf typeof condition
		if conditionType < 0
			throw 'Illegal condition'

		fullSet = []
		@iter (el, i) ->
			el = el.first false
			if el.nodeType == Node.TEXT_NODE
				return
			set = []
			if conditionType == 0
				if deep 
					set = el.querySelectorAll condition
				else
					set = child for child in el.children when child.matches condition
			else
				check = if deep then el.querySelectorAll '*' else el.children
				wrapped = new ToolkitSelection check
				set = child for child in check when condition wrap, i
			fullSet = fullSet.concat(set)
		
		new ToolkitSelection fullSet, @
	
	copy: () ->
		copy = @set[0].cloneNode true
		new ToolkitSelection copy, @
	
	#	---- Iteration and comprehension ----
	iter: (callback) ->
		for el, i in @set
			el = new ToolkitSelection el
			if (callback el, i) == false
				break
		@

	comp: (callback) ->
		result = []
		for el, i in @set
			el = new ToolkitSelection el
			value = callback el, i
			result.push value if value != undefined
		
		result

	is: (check) ->
		checkType = ['string', 'function'].indexOf typeof check
		
		for el, i in @set
			if checkType == 0 and (el.nodeType == Node.TEXT_NODE or not el.matches check)
				return false
			else if checkType == 1 and not check((new ToolkitSelection el), i)
				return false
		true

	classes: () ->
		all = []
		for el, i in @set
			mine = el.className.split /\s+/
			all.push cls for cls in mine when cls not in all
		all

	focus: () ->
		@set[0].focus()
		@

	value: (value= _sentinel) ->
		if value == _sentinel
			#	Get.
			if @set[0].type == 'checkbox'
				return @set[0].checked
			else if @set[0].type == 'file'
				return @set[0].files
			
			value = @set[0].value
			if not value
				return null
			else if @set[0].type == 'number'
				return +value
			else
				return value
		else
			#	Set.
			@iter (el) ->
				if el.tag().toLowerCase() == 'select'
					el.children 'option'
						.attr 'selected', (gl) ->
							if gl.attr 'value' == value then true else null
				else
					el.first false
						.value = value
		@
			
	attr: (nameOrMap, value=_sentinel) ->
		if typeof nameOrMap == 'string'
			if value == _sentinel
				#	Get.
				return @set[0].getAttribute nameOrMap
			else
				#	Set.
				for el in @set
					realValue = value
					if typeof realValue == 'function'
						realValue = realValue new ToolkitSelection el, @
					if realValue == null
						el.removeAttribute nameOrMap
					else
						el.setAttribute nameOrMap, realValue
				@
		else if typeof nameOrMap == 'object'
			@iter (el) ->
				for key, value of nameOrMap
					el.attr key, value
				return
			@
		else
			throw 'Illegal argument: ' + nameOrMap

	css: (propertyOrMap, value=_sentinel) ->
		applyOne = (name, value) =>
			name = name.replace /-([a-z])/g, (g) -> g[1].toUpperCase()
			@iter (el, i) ->
				resolved = ToolkitSelection.tk.resolve value, el, i
				if typeof resolved == 'number'
					resolved += 'px'
				el.set[0].style[name] = resolved
			
		if typeof propertyOrMap == 'string'
			if value == _sentinel
				#	Get.
				return window.getComputedStyle @set[0]
					.getPropertyValue propertyOrMap
			else
				applyOne propertyOrMap, value
		else if typeof propertyOrMap == 'object'
			applyOne name, value for name, value of propertyOrMap
		else
			throw 'Illegal argument'
		@
	
	on: (nameOrMap, callback=_sentinel) ->
		attachOne = (name, callback) =>
			@iter (el, i) ->
				pure = el.first false
				if not pure.__listeners__
					pure.__listeners__ = []

				if typeof name == 'function'
					name = name el, i
					
				repr =
					event: name
					callback: callback
				
				pure.__listeners__.push repr
				pure.addEventListener repr.event, (g) -> callback el, g

		if typeof nameOrMap == 'string'
			if callback == _sentinel
				#	Get.
				if pure.__listeners__? 
					return repr.callback for repr in pure.__listeners__
				else
					return []
			else
				attachOne nameOrMap, callback
		else if typeof nameOrMap == 'object'
			(attachOne name, value) for name, value of nameOrMap
		else
			throw 'Illegal argument'
		@

	off: (name) ->
		for el in @set
			list = el.__listeners__? or []
			for repr in list
				if repr.event == name
					el.removeEventListener repr.event, repr.callback
					
			el.__listeners__ = (repr for repr in list when repr.event != name)
		@

	classify: (classOrMap, value=true, time=_sentinel) ->
		classifyOne = (name, flag, time) =>
			if flag == 'toggle'
				#	Special second parameter case.
				flag = (el, i) -> name not in el.classes()
			@iter (el, i) ->
				flagValue = flag
				if typeof flagValue == 'function'
					flagValue = flagValue el, i
				
				classes = el.classes()
				has = name in classes
				if flagValue and not has
					classes.push name
				else if not flagValue and has
					index = classes.indexOf name
					classes.splice index, 1
				el.set[0].className = classes.join(' ').trim()
					
				if time != _sentinel
					timeValue = time
					if typeof timeValue == 'function'
						timeValue = timeValue el, i
					ToolkitSelection.tk.timeout timeValue, (el) -> 
						classifyOne name, !flagValue, _sentinel
		
		if typeof classOrMap == 'string'
			classifyOne classOrMap, value, time
		else
			(classifyOne name, flag, _sentinel) for name, flag of classOrMap
		@

	remove: () ->
		for el in @set
			if el.parentNode != null
				el.parentNode.removeChild el
		@

	append: (children) ->
		children = new ToolkitSelection children, @
		children.remove()
	
		if not @first().parents('body').empty
			ToolkitSelection.tk.guts.inspect children

		@set[0].appendChild child for child in children.set
		children

	prepend: (children) ->
		children = new ToolkitSelection children, @
		children.remove()

		if not @first().parents('body').empty
			ToolkitSelection.tk.guts.inspect children

		(@set[0].insertBefore child, @set[0].firstChild) for child in children.set by -1
		children

	replace: (newNode) ->
		if not @first().parents('body').empty
			newNodeI = newNode
			if not (newNodeI instanceof ToolkitSelection)
				newNodeI = new ToolkitSelection newNodeI, @
			ToolkitSelection.tk.guts.inspect newNodeI

		if newNode instanceof ToolkitSelection
			newNode = newNode.first false

		@set[0].parentNode.replaceChild newNode, @set[0]
		new ToolkitSelection newNode, @parent

	tag: () -> @set[0].tagName

	next: (node=_sentinel) ->
		if node == _sentinel
			if @empty or @set[0].nextSibling == null
				new ToolkitSelection []
			else
				new ToolkitSelection @set[0].nextSibling, @
		else
			if not node instanceof ToolkitSelection
				node = tk node
			for el in node.set
				@set[0].parentNode.insertBefore el, @set[0].nextSibling
			node.parent = @
			node

	prev: (node=_sentinel) -> 
		if node == _sentinel
			if @empty or @set[0].previousSibling == null
				new ToolkitSelection []
			else
				new ToolkitSelection @set[0].previousSibling, @
		else
			if not node instanceof ToolkitSelection
				node = tk node
			for el in node.set by -1
				@set[0].parentNode.insertBefore el, @set[0]
			node.parent = @
			node

	html: (value=_sentinel) ->
		if value == _sentinel
			#	Get.
			return @set[0].innerHTML
		else
			@iter (el, i) ->
				el.set[0].innerHTML = ToolkitSelection.tk.resolve value, el, i
		@

	text: (value=_sentinel) ->
		if value == _sentinel
			#	Get.
			return @set[0].textContent
		else
			@iter (el, i) ->
				el.set[0].textContent = ToolkitSelection.tk.resolve value, el, i
		@

	select: () ->
		@set[0].select()
		@

	offset: (toParent=false) ->
		o = 
			x: 0
			y: 0
		
		el = @set[0]
		while el != null
			o.x += el.offsetLeft or 0
			o.y += el.offsetTop or 0
			if toParent
				break
			el = el.offsetParent
		o

	size: (includeInner=false) ->
		el = @set[0]
		box = el.getBoundingClientRect()
		size =
			width: box.width
			height: box.height
		
		if includeInner
			style = window.getComputedStyle el, null

			size.width += style.getPropertyValue 'margin-left'
			size.width += style.getPropertyValue 'margin-right'

			size.height += style.getPropertyValue 'margin-top'
			size.height += style.getPropertyValue 'margin-bottom'

			if 'border-box' == style.getPropertyValue 'box-sizing'
				size.width += style.getPropertyValue 'padding-left'
				size.width += style.getPropertyValue 'padding-right'

				size.height += style.getPropertyValue 'padding-top'
				size.height += style.getPropertyValue 'padding-bottom'
		
		size

	data: () ->
		if @set[0]._tkData?
			return @set[0]._tkData
		throw 'No data.'

	key: () ->
		if @set[0]._tkKey?
			return @set[0]._tkKey
		throw 'No key.'
	
	index: () ->
		if @set[0]._tkIndex?
			return @set[0]._tkIndex
		throw 'No index.'

guts.attach class _SelectionModule
	constructor: (tk) ->
		tk.ToolkitSelection = ToolkitSelection
		ToolkitSelection.tk = tk
