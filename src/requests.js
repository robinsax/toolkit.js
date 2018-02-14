tk.requestProcessors = [];

function Request(method, url){
	var self = this;
	this.fns = {
		success: tk.fn.eatCall,
		failure: tk.fn.eatCall
	};
	this.storage = {
		url: url,
		method: method,
		query: {},
		headers: {},
		body: null
	}

	this.success = function(success){
		/*
			Set the success callback.
		*/
		this.fns.success = success;
		return this;
	}

	this.failure = function(failure){
		/*
			Set the failure callback.
		*/
		this.fns.failure = failure;
		return this;
	}

	this.json = function(object){
		/*
			Provide an object to serialize as JSON for the body of this 
			request.
		*/
		this.storage.headers['Content-Type'] = 'application/json';
		this.storage.body = tk.unbound(object);
		return this;
	}

	this.text = function(object){
		/*
			Provide a text body.
		*/
		this.storage.headers['Content-Type'] = tk.varg(arguments, 1, 'text/plain');
		this.storage.body = object;
		return this;
	}

	this.header = function(key, value){
		/*
			Provide a header.
		*/
		this.storage.headers[key] = value;
		return this;
	}

	this.query = function(map){
		/*
			Set the key, value mapping for the query string.
		*/
		this.storage.query = map;
		return this;
	}

	this._processResponse = function(xhr){
		//	TODO: More;
		//	Parse response.
		var contentType = xhr.getResponseHeader('Content-Type'),
			status = xhr.status,
			responseData = xhr.responseText;;
		switch (contentType){
			case 'application/json':
				responseData = JSON.parse(xhr.responseText)
				break;				
		}

		//	Log.
		tk.log('Received ' + status + ' (' + this.storage.method + ', ' + this.storage.url + '):', responseData);

		//	Dispatch appropriate callback.
		var callback = status < 400 ? this.fns.success : this.fns.failure;
		callback(responseData, status);
	}

	this.send = function(object){
		var xhr = new XMLHttpRequest();

		tk.iter(tk.requestProcessors, function(f){
			f(self);
		});

		//	Create query string.
		var fullURL = this.storage.url;
		var queryItems = [];
		tk.iter(this.storage.query, function(k, v){
			queryItems.push(k + '=' + encodeURIComponent(v));
		});
		if (queryItems.length > 0){
			fullURL += '?' + queryItems.join('&');
		}

		xhr.onreadystatechange = function(){
			if (this.readyState == 4){
				self._processResponse(this);
			}
		}

		var processedBody = '';
		if (this.storage.body != null){
			//	Process body.
			//	TODO: More;
			var mimetype = this.storage.headers['Content-Type'];
			switch (mimetype){
				case 'text/plain':
					break;
				case 'application/json':
					processedBody = JSON.stringify(this.storage.body);
					break;
				default:
					throw 'Unknown request content type (' + mimetype + ')';
			}
		}

		xhr.open(this.storage.method, fullURL, true);
		tk.iter(this.storage.headers, function(k, v){
			xhr.setRequestHeader(k, v);
		});

		xhr.send(processedBody);

		tk.log('Sent (' + method + ': ' + url + ')', this.storage.body);
	}
}

tk.request = function(method, url){
	return new Request(method, url);
}
tk.request.processor = function(callback){
	tk.requestProcessors.push(callback);
}