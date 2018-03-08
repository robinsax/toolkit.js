class ToolkitTemplate
	constructor: (@tk, @definition) ->
		@_source = null

	source: (source) ->
		@_source = source
		@

	#	Realize a virtual node (as a DOM node).
	_realize: (virtual) ->
		if not virtual
			return document.createTextNode ''

		if typeof virtual == 'string'
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
		if @_source instanceof Array
			inserts = no
			nodes = []
			@tk.listener @_source
				.added (item, index) =>
					#	Create DOM.
					dom = @_realize @definition item
					changed = () =>
						if not inserts
							return
						newDom = @_realize @definition item
						nodes[nodes.indexOf dom] = newDom
						dom = dom.replace newDom 

					for property, value of item
						if value instanceof Array
							@tk.listener value
								.added changed
								.removed changed
						@tk.listener item, property
							.changed changed, false

					#	Insert.
					nodes.splice index, 0, dom
					if inserts
						if index == 0
							nodes[1].prev dom
						else
							nodes[index - 1].next dom
				
				.removed (item, index) =>
					nodes[index].remove()
					nodes.splice index, 1

			inserts = yes
			return @tk nodes
		else
			return (realizeOne @_source).node

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
