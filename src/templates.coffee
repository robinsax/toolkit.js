class ToolkitTemplate
	constructor: (@tk, @definition) ->
		@_data = null

	data: () ->
		@_data = arguments
		@

	_safeAppend: (target, toAppend) ->
		if toAppend instanceof Array
			(target.appendChild item) for item in toAppend
		else
			target.appendChild toAppend

	#	Realize a virtual node (as a DOM node).
	_realize: (virtual) ->
		if not virtual
			return document.createTextNode ''

		if typeof virtual == 'string' or typeof virtual == 'number'
			result = document.createTextNode virtual
		else if typeof virtual == 'function'
			result = @_realize virtual()
		else if virtual instanceof Array
			result = (@_realize item for item in virtual)
		else
			result = document.createElement virtual.tag
			(result.setAttribute name, value) for name, value of virtual.attributes

			if virtual._dataK?
				@tk.iter @tk._dataStore[virtual._dataK], (key, value) -> 
					result[key] = value

			(@_safeAppend result, (@_realize child)) for child in virtual.children

		result

	render: () ->
		return @tk @_realize (@definition.apply null, @_data)

guts.attach callable class _Templates
	constructor: () ->
		@called = 'template'

	_call: (definition) ->
		new ToolkitTemplate @, definition

	tag: (tag, attributes, ...children) ->
		return 
			tag: tag
			attributes: attributes or {}
			children: children
			__tkVirtual__: true
