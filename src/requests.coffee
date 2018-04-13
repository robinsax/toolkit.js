class Request	
	constructor: (@tk, method, url) ->
		@info =
			method: method
			url: url
			success: () -> {}
			failure: () -> {}
			query: {}
			headers: {}
			body: null
	
	success: (callback) ->
		@info.success = callback
		@

	failure: (callback) ->
		@info.failure = callback
		@

	json: (data) ->
		@info.headers['Content-Type'] = 'application/json'
		@info.body = data
		@
	
	data: (data, mimetype='text/plain') ->
		@info.headers['Content-Type'] = mimetype
		@info.body = data
		@
	
	header: (key, value) ->
		@info.headers[key] = value
		@
	
	query: (map) ->
		@info.query = map
		@
	
	#	TODO: More mimetype support.
	send: () ->
		#	Declare response callback.
		processResponse = (xhr) =>
			status = xhr.status
			mimetype = xhr.getResponseHeader 'Content-Type'
			data = xhr.responseText
			switch mimetype
				when 'application/json'
					data = JSON.parse data
			
			@tk.log 'Received ' + status + ' (' + @info.method + ', ' + @info.url + ')'
			(if status < 400 then @info.success else @info.failure)(data, status)
		
		#	Prepare data.
		fullURL = @info.url
		serializedBody = ''
		queryKeys = Object.getOwnPropertyNames @info.query
		
		if queryKeys.length > 0
			queryStatements = ((key + '=' + encodeURIComponent @info.query[key]) for key in queryKeys)
			fullURL += '?' + queryStatements.join '&'
		
		if @info.body
			mimetypeOut = @info.headers['Content-Type']
			switch mimetypeOut
				when 'application/json'
					serializedBody = JSON.stringify @info.body
				else
					throw 'Unknown outgoing mimetype ' + mimetypeOut

		#	Prepare an XHR.
		xhr = new XMLHttpRequest			
		xhr.onreadystatechange = () ->
			if @readyState == 4
				processResponse @
		
		xhr.open @info.method, fullURL, true
		xhr.setRequestHeader key, value for key, value of @info.headers
		xhr.send serializedBody

		@tk.log 'Sent (' + @info.method + ', ' + @info.url + ')', @info.body

guts.attach callable class _RequestModule
	constructor: (@tk) ->
		@called = 'request'

	_call: (method, url) ->
		new Request @, method, url
