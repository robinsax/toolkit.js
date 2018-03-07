class ToolkitVirtualFragment
	constructor: (@elementGenerator) ->
		@_data = null

	data: (data) ->
		@_data = data
		@
	
	render: () ->
		renderOne = (node) ->
			if typeof node == 'string'
				return tk document.createTextNode node
			tk.tag node.tag
				.attr node.properties
				.append ((renderOne child) for child in node.children)
				.back()
			
		return tk((renderOne @elementGenerator(item)) for item in @_data)

guts.attach callable class _VirtualDOM
	constructor: () ->
		@called = 'virtual'
	
	_call: (element) ->
		new ToolkitVirtualFragment element

	tag: (tag, properties, ...children) ->
		return 
			tag: tag
			properties: properties or {}
			children: children