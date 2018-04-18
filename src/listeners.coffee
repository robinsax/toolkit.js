class ToolkitPListener
	constructor: (@object, @property) ->
		#	Ensure tracking and property existance.
		if not @object.__listeners__
			Object.defineProperty @object, '__listeners__',
				value: {},
				enumerable: false,
				writable: true
		
		if not @object.__listeners__[@property]
			@object.__listeners__[@property] = []
			
			descriptor = @_descriptor(@object[@property], @object.__listeners__[@property])
			Object.defineProperty @object, @property, descriptor
		
		#	Add this listener.
		@object.__listeners__[@property].push @

		@_changed = () -> ;
		@_accessed = () -> ;

	_descriptor: (initialValue, listeners) ->
		value = initialValue
		return
			get: () ->
				(listener._accessed value) for listener in listeners
				value
			set: (newValue) ->
				if value == newValue
					return value
				value = newValue
				(listener._changed newValue) for listener in listeners
				value

	changed: (callback, initial=true) ->
		@_changed = callback
		#	Fire.
		callback @object[@property] if initial
		@

	accessed: (callback) ->
		@_accessed = callback
		@

	remove: () ->
		index = @object.__listeners__[@property].indexOf @
		@object.__listeners__[@property].splice index, 1
		@

class ToolkitAListener
	constructor: (@array) ->
		#	Ensure tracking.
		if not @array.__listeners__
			@_mixinListeners()

		@array.__listeners__.push @

		@_added = () -> ;
		@_removed = () -> ;
		@_accessed = () -> ;

	_mixinListeners: () ->
		listeners = @array.__listeners__ = []

		updateIndicies = () =>
			for i in [0...@array.length]
				descriptor = @_indexDescriptor(@array[i], i, listeners)
				Object.defineProperty @array, i + '', descriptor
		
		innerPush = @array.push
		@array.push = (...items) =>
			start = @array.length
			innerPush.apply @array, items
			updateIndicies()
			
			for item, i in items
				(listener._added item, start + i) for listener in listeners
			@array.length

		innerPop = @array.pop
		@array.pop = () =>
			removed = @array[index = @array.length - 1]
			innerPop.apply @array
			updateIndicies()

			(listener._removed removed, index) for listener in listeners
			removed

		innerSplice = @array.splice
		@array.splice = (start, count, ...items) =>
			removed = (@array[i] for i in [start...start + count])
			result = innerSplice.apply @array, ([start, count].concat items)
			updateIndicies()

			for i in [0...count]
				(listener._removed removed[i], start + i) for listener in listeners
			for i in [0...items.length]
				(listener._added @array[start + i], i) for listener in listeners
			result

	_indexDescriptor: (initialValue, index, listeners) ->
		value = initialValue
		return
			get: () ->
				(listener._accessed value for listener in listeners) 
				value
			set: (newValue) ->
				if value == newValue
					return value
				value = newValue
				(listener._removed value, index) for listener in listeners
				(listener._added newValue, index) for listener in listeners
				value
			configurable: yes

	added: (callback) ->
		@_added = callback
		for item, index in @array
			callback item, index
		@
	
	removed: (callback) ->
		@_removed = callback
		@

	accessed: (callback) ->
		@_accessed = callback
		@

guts.attach callable class _Listeners
	constructor: () ->
		@called = 'listener'

	_call: (objectOrArray, property=_sentinel) ->
		if objectOrArray instanceof Array
			return new ToolkitAListener objectOrArray
		else if typeof objectOrArray == 'object'
			return new ToolkitPListener objectOrArray, property
		throw 'Invalid parameter'
