#
#	YO! fuck dataK. Make data()/index()/key() update a part of updateNode
#

class ToolkitTemplate
	constructor: (@tk, @definition) ->
		@_data = null
		@_live = false
		@_reference = null
		@_result = null
		@_listeners = false
		@_inspection = null

	inspection: (callback) ->
		@_inspection = callback
		@

	data: () ->
		@_data = arguments
		@
	
	live: () ->
		@_live = true
		@

	copyListeners: () ->
		@_listeners = true
		@

	_diffNodes: (node1, node2) ->
		(
			(typeof node1 != typeof node2) or 
			(typeof node1 == 'string' and node1 != node2) or 
			node1.tag != node2.tag
		)

	_updateAttrs: (target, newAttrs, oldAttrs) ->
		for attr of newAttrs
			if not oldAttrs[attr] or oldAttrs[attr] != newAttrs[attr]
				target.setAttribute attr, newAttrs[attr]
		for attr of oldAttrs
			if not newAttrs[attr]
				target.removeAttribute attr

	_update: (parent, newNode, oldNode, index=0) ->
		if not oldNode
			parent.appendChild @_create newNode
		else if not newNode
			if parent.childNodes[index]
				parent.removeChild parent.childNodes[index]
				throw 'x'
		else if @_diffNodes newNode, oldNode
			created = @_create newNode

			if @_listeners
				if parent.childNodes[index].__listeners__?
					for listener in parent.childNodes[index].__listeners__
						created.addEventListener listener.event, (g) => listener.callback (@tk created), g
					created.__listeners__ = parent.childNodes[index].__listeners__
			
			parent.replaceChild created, parent.childNodes[index]
		else if newNode.tag
			@_updateAttrs parent.childNodes[index], newNode.attributes, oldNode.attributes
			
			if newNode.__data__
				@tk.iter newNode.__data__, (key, value) ->
					parent.childNodes[index][key] = value

			to = Math.max newNode.children.length, oldNode.children.length
			i = 0

			while i < to
				try
					@_update parent.childNodes[index], newNode.children[i], oldNode.children[i], i
				catch ex
					if ex == 'x'
						i--
					else
						throw ex
				i++
			
	#	Realize a virtual node (as a DOM node).
	_create: (virtual) ->
		if not virtual
			return document.createTextNode ''

		if typeof virtual == 'string' or typeof virtual == 'number'
			result = document.createTextNode virtual
		else if typeof virtual == 'function'
			result = @_create virtual()
		else if virtual instanceof Array
			result = (@_create item for item in virtual)
		else
			result = document.createElement virtual.tag

			for name, value of virtual.attributes
				if name == 'markup'
					result.innerHTML = value
				else
					result.setAttribute name, value

			if virtual.__data__?
				@tk.iter virtual.__data__, (key, value) -> 
					result[key] = value
			
			if virtual.children?
				for child in virtual.children
					make = @_create child
					if make instanceof Array
						result.appendChild m for m in make
					else
						result.appendChild make 
			
			virtual.result = result
			
			if @_inspection
				@_inspection @tk result
		result

	render: () ->
		virtual = @definition.apply null, @_data
		if @_live
			if @_reference
				parent = @_result.parentNode
				thisIndex = Array.prototype.indexOf.call parent.childNodes, @_result
				@_update parent, virtual, @_reference, thisIndex

				#	In the case that the root node changed, we need to re-reference.
				@_result = parent.childNodes[thisIndex]
			else
				@_result = @_create virtual
			@_reference = virtual
			@tk @_result
		else
			@tk @_create virtual

guts.attach callable class _Templates
	constructor: () ->
		@called = 'template'

	_call: (definition) ->
		new ToolkitTemplate @, definition

	_flatten: (list) ->
		flat = false
		while not flat
			pass = []
			flat = true

			for item in list
				if item instanceof Array
					pass = pass.concat item
					flat = false
				else
					pass.push item

			list = pass
		return pass

	tag: (tag, attributes, ...children) ->
		return 
			tag: tag
			attributes: attributes or {}
			children: @_flatten children
