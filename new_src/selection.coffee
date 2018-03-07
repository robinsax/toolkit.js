class ToolkitSelection
	@tk: null
	@clean: (set) ->
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
			@set = selection.set.splice()
		else if selection instanceof Element or selection instanceof Window
			@set = [selection]
		else if selection instanceof NodeList or selection instanceof Array
			@set = ToolkitSelection.clean selection
		else if typeof selection == 'string'
			@set = tk.config.root.querySelectorAll selection
		else
			throw 'Illegal exception'
	
		@length = @set.length
		@empty = @length == 0
	
	back: () ->
		if not @parent
			throw 'Illegal back'
		@parent

	ith: (i, wrap=true) ->
		if i < 0 or i > @length
			throw 'Out of bounds: ' + i
		new ToolkitSelection @set[i], @ if wrap else @set[i]
	
	first: (wrap=true) ->
		@ith(0, wrap)
	
	reversed: () ->
		set = @set.slice()
		set.reverse()
		new ToolkitSelection set, @

	reduce: (reducer) ->
		switch typeof reducer
			when 'string'
				set = @compr (el) ->
					el if el.is reducer
			when 'function'
				set = @compr reducer
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
	
	parents: (condition='*', high=true) ->
		conditionType = ['string', 'function'].indexOf typeof condition
		if conditionType < 0
			throw 'Illegal condition'

		checkElement = (element, index) ->
			if conditionType == 0 then e.is condition else condition element, index
		
		set = []
		@iter (el, i) ->
			parent = el.parentNode
			while parent != ToolkitSelection.tk.config.root
				set.push parent if checkElement parent, i
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
			el = el.first()
			set = []
			if conditionType == 0
				if deep 
					set = el.querySelectorAll condition
				else
					set = child for child in el.children when child.matches condition
			else
				check = if deep then el.querySelectorAll '*' else el.children
				set = child for child in check when condition (new ToolkitSelection check), i)
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

	compr: (callback) ->
		result = []
		for el, i in @set
			el = new ToolkitSelection el
			value = callback el, i
			result.push value if value != undefined
		
		result

	is: (check) ->
		checkType = ['string', 'function'].indexOf typeof check
		
		for el, i in @set
			if checkType == 0 and not e.matches check
				return false
			else if checkType == 1 and not check((new ToolkitSelection e), i)
				return false
		true

	classes: () ->
		all = []
		for el, i in @set
			mine = el.className.split /\s+/
			all.push cls for cls in mine when cls not in all
		all

	value: (value= _sentinel) ->
		if value == _sentinel
			#	Get.
			if @set[0].type == 'checkbox'
				return @set[0].checked
			
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
				return @first().attr nameOrMap
			else
				#	Set.
				for el in @set
					if value == null
						el.removeAttribute(nameOrMap)
					else
						el.setAttribute(nameOrMap, value)
		else if typeof nameOrMap == 'object'
			@iter (el) ->
				for key, value of @nameOrMap
					el.attr key, value
		else
			throw 'Illegal argument'
		@

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
		attachOne = (name, value) =>
			@iter (el, i) ->
				pure = el.first false
				if not pure.__listeners__
					pure.__listeners__ = []
				
				repr =
					event: ToolkitSelection.tk.resolve event, el, i
					callback: (g) -> callback el, g, i
				
				pure.__listeners__.push repr
				pure.addEventListener repr.event, repr.callback

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
			attachOne name, value for key, value of nameOrMap
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
		classifyOne = (name, flag, time) ->
			if flag == 'toggle'
				#	Special second parameter case.
				flag = (el, i) -> not e.is(selector)
			@iter (el, i) ->
				flagValue = ToolkitSelection.tk.resolve flag, el, i
				classes = el.classes()
				has = name in classes
				if flagValue and not has
					classes.push name
				else if not flagValue and has
					index = classes.indexOf name
					classes.splice index, 1
				el.set[0].className = classes.join(' ').trim()
					
				if time != _sentinel
					timeValue = ToolkitSelection.tk.resolve time, el, i
					ToolkitSelection.tk.timeout timeValue, (el) -> 
						classifyOne name, !actualFlag, _sentinel
		
		if typeof classOrMap == 'string'
			classifyOne classOrMap, value, time
		else
			classifyOne name, flag for name, flag of @classOrMap
		@

	remove: () ->
		for el in @set
			if el.parentNode != null
				el.parentNode.removeChild el
		@

	append: (children) ->
		children = new ToolkitSelection children, @
		children.remove()

		inspected = children.extend children.children()
		ToolkitSelection.tk.guts.inspect inspected

		@set[0].appendChild child for child in children.set
		children

	prepend: (children) ->
		children = new ToolkitSelection children, @
		children.remove()

		inspected = children.extend children.children()
		ToolkitSelection.tk.guts.inspect inspected

		@set[0].prepend child for child in children.set by -1
		children

	tag: () -> @set[0].tagName
	next: () -> new ToolkitSelection @set[0]?.nextElementSibling, @
	prev: () -> new ToolkitSelection @set[0]?.prevElementSibling, @

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
		while el
			o.x += el.offsetLeft
			o.y += el.offsetRight
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
				