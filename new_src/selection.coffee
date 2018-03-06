class ToolkitSelection
	@tk: null
	@cleanSet: (set) ->
		cleanSet = []
		for item in set
			if item instanceof ToolkitSelection
				cleanSet = cleanSet.concat item.set
			else
				cleanSet.push item
		cleanSet
	
	constructor: (selection, @parent) ->
		#	Resolve the selection set.
		if selection instanceof ToolkitSelection
			@set = selection.set.splice()
		else if selection instanceof Element or selection instanceof Window
			@set = [selection]
		else if selection instanceof NodeList or selection instanceof Array
			@set = ToolkitSelection.cleanSet selection
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
			set = ToolkitSelection.cleanSet extension
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
		new ToolkitSelection (@set[0].cloneNode true), @
	
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

	value: () ->
		
