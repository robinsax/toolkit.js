class ToolkitTemplate
	constructor: (@tk, @definition) ->
		@_data = null

	data: (data) ->
		@_data = data
		@

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
			result = @tk.tag virtual.tag
				.attr virtual.attributes
			result.append @_realize child for child in virtual.children

		result
	
	render: () ->
		return @tk @_realize @definition @_data

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
			_virtual: true
