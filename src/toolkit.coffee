_sentinel = {}

callable = (Class) ->
	() ->
		#	Create an instance.
		inst = new Class
		#	Create a function that invokes _call()
		func = (...args) ->
			inst._call.apply @, args
		
		#	Copy the properties of the instance onto the function.
		obj = inst
		while true
			names = Object.getOwnPropertyNames obj
			for name in names
				if typeof obj[name] == 'function'
					func[name] = obj[name]
				else
					Object.defineProperty func, name, Object.getOwnPropertyDescriptor obj, name 
			if not (obj = Object.getPrototypeOf obj)
				break
		
		#	Return the function.
		func

#	The protected internals of the base Toolkit instance. Nothing within this
#	object should be considered exposed.
class ToolkitGuts
	constructor: () ->
		@initFunctions = []
		@inspectionFunctions = []
		@modules = []
		return

	attach: (Module) ->
		@modules.push Module
		@

	onto: (tk) ->
		for Module in @modules
			inst = new Module tk
			if inst.called
				tk[inst.called] = inst
		@

	init: () ->
		f() for f in @initFunctions
		@

	inspect: (check) ->
		if @inspectionFunctions.length > 0
			check = check.extend check.children()
			f(check) for f in @inspectionFunctions
		@

#	Create the guts.
guts = new ToolkitGuts

#	::include requests
#	::include selection
#	::include listeners
#	::include templates

Toolkit = callable class _Toolkit
	constructor: () ->
		@initialized = false
		#	Define the 'here' debug helper.
		first = true
		Object.defineProperty @, 'here',
			get: () => 
				if first
					first = false
					return
				console.log 'here'
				'here'

	_call: (selection) ->
		new ToolkitSelection selection

	_finalize: (config) ->
		#	Read config.
		@config =
			root: config.root ? (document ? null)
			debug: config.debug ? false
		
		#	Create guts.
		@guts = guts.onto @

		#	Prepare initialization.
		if /complete|loaded|interactive/.test document?.readyState
			@initialized = true
			@guts.init()
		else if window?
			window.addEventListener 'DOMContentLoaded', () =>
				@initialized = true
				@guts.init()
		return

	#	Initialization callback registery.
	init: (callback) ->
		if @initialized
			callback()
		@guts.initFunctions.push callback
		@
	
	#	Element inspection registery.
	inspection: (callback) ->
		@guts.inspectionFunctions.push callback
		@

	#	Logging.
	log: (...args) ->
		if @config?.debug
			console.log.apply null, args
		args[0]

	warn: (...args) ->
		if @config?.debug
			console.warn.apply null, args
		args[0]
	
	#	Resolve a potentially functional parameter.
	#	DEPRICATED
	resolve: (thing, ...args) ->
		if typeof thing != 'function' then thing else thing.apply null, args

	#	Current time in milliseconds.
	time: () -> (new Date).getTime()

	#	Numerical range generation.
	range: (max, realMax=null) ->
		#	Parse var-args.
		min = 0
		if realMax
			min = max
			max = realMax
		
		(i for i in [min...max])

	#	Iteration.
	iter: (iterable, callback) ->
		if iterable instanceof Array
			for item, i in iterable
				if (callback item, i) == false
					break
		else if typeof iterable == 'object'
			for name, value of iterable
				if (callback name, value) == false
					break
		else
			throw 'Not iterable: ' + iterable
		return

	#	Comprehension.
	comp: (array, callback) ->
		result = []
		for item, i in array
			returned = callback item, i
			if returned?
				result.push returned
		result
	compr: (array, callback) ->
		console.warn 'compr() is deprecated! Use comp() instead.'
		@comp array, callback

	timeout: (time, callback) ->
		setTimeout callback, time
	
	tag: (tagName, attributes={}, ...children) ->
		el = document.createElement(tagName)
		(el.setAttribute key, value) for key, value of attributes
		for child in children
			if typeof child == 'string'
				el.appendChild document.createTextNode child
			else
				el.appendChild @tag child
		new ToolkitSelection el

#	Export either to the window or as a module, depending on context.
toolkit = 
	create: (config={}) ->
		tk = new Toolkit
		tk._finalize config
		tk
if window?
	window.toolkit = toolkit
else
	module.exports = toolkit
