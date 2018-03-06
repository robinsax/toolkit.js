callable = (Class) ->
	() ->
		#	Create an instance.
		inst = new Class
		#	Create a function that invokes _call()
		func = () ->
			inst._call.apply @, arguments
		
		#	Copy the properties of the instance onto the function.
		obj = inst
		while true
			names = Object.getOwnPropertyNames obj
			func[name] = inst[name] for name in names
			if not (obj = Object.getPrototypeOf obj)
				break
		
		#	Return the function.
		func

#	The protected internals of the base Toolkit instance. Nothing within this
#	object should be considered exposed.
class ToolkitGuts
	contructor: () ->
		@initFunctions = []
		@inspectionFunctions = []
		@modules = []

	attach: (Module) ->
		@Modules.push module
		@

	onto: (tk) ->
		tk[Module.name] = new Module @ for Module in @Modules
		@

	init: () ->
		f() for f in @initFunctions
		@

	inspect: (check) ->
		f(check) for f in @inspectionFunctions
		@
#	Create the guts.	
guts = new ToolkitGuts

#	::include requests

Toolkit = callable class _Toolkit
	constructor: (config) ->
		#	Create guts.
		@guts = guts.onto @

		#	Read config.
		@debug = config.debug ? false

		#	Define the 'here' debug helper.
		Object.defineProperty @, 'here',
			get: () =>
				@log 'here'

		#	Prepare initialization.
		if /complete|loaded|interactive/.test document?.readyState
			@guts.init()
		else if window?
			window.addEventListender 'DOMContentLoaded', () =>
				@guts.init()

	_call: (selection) ->
		new ToolkitSelection selection

	#	Initialization callback registery.
	init: (callback) ->
		@guts.initFunctions.push callback
		@
	
	#	Element inspection registery.
	inspection: (callback) ->
		@guts.inspectionFunctions.push callback
		@

	#	Logging.
	log: (...args) ->
		if @debug
			console.log.apply null, args
		args[0]

	#	Function name retrieval.
	nameOf: (func) ->
		/^function\s+([\w\$]+)\s*\(/.exec func.toString() ? '<anonymous function>'
	
	#	Resolve a potentially functional parameter.
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
			callback item, i for item, i in interable
		else if typeof iterable == 'object'
			callback name, value for name, value of iterable
		else
			throw 'Not iterable: ' + iterable

	#	Comprehension.
	compr: (array, callback) ->
		result = []
		for item, i in array
			returned = callback item, i
			if returned?
				result.push returned
		returned

#	Export either to the window or as a module, depending on context.s
toolkit = 
	create: (config={}) ->
		new Toolkit config
if window?
	window.toolkit = toolkit
else
	module.exports = toolkit
