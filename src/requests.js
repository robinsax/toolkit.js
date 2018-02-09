function Request(method, url){
	this.fns = {
		success: tk.fn.eatCall,
		failure: tk.fn.eatCall
	};
	this.url = url;
	this.method = method;
	this.query = {};
	this.body = null;
	this.mimetype = 'text/plain';

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
		this.mimetype = 'application/json';
		this.body = object;
		return this;
	}

	this.query = function(map){
		/*
			Set the key, value mapping for the query string.
		*/
		this.query = map;
		return this;
	}

	this._processResponse = function(xhr){
		//	TODO: More;
		//	Parse response.
		var contentType = xhr.getResponseHeader('Content-Type'),
			status = xhr.status,
			responseData = null;
		switch (contentType){
			case 'application/json':
				responseData = JSON.parse(xhr.responseText)
			default:
				throw 'Unknown response content type (' + contentType + ')';
		}

		//	Log.
		tk.log('Received ' + status + ' (' + this.method + ', ' + this.url + '):', responseData);

		//	Dispatch appropriate callback.
		var callback = status < 400 ? this.fns.success : this.fns.failure;
		callback(responseData, status);
	}

	this.send = function(object){
		var xhr = new XMLHttpRequest();

		tk.config.callbacks.preRequest(this, xhr);

		//	Create query string.
		var fullURL = this.url;
		var queryItems = [];
		tk.iter(this.query, function(k, v){
			queryItems.push(k + '=' + encodeURIComponent(v));
		});
		if (queryItems.length > 0){
			fullURL += '?' + queryItems.join('&');
		}

		var self = this;
		xhr.onreadystatechange = function(){
			self._processResponse(this);
		}

		var processedBody = '';
		if (this.body != null){
			//	Process body.
			//	TODO: More;
			switch (this.mimetype){
				case 'application/json':
					processedBody = JSON.stringify(this.body);
				default:
					throw 'Unknown request content type (' + this.mimetype + ')';
			}

			xhr.setRequestHeader('Content-Type', this.mimetype);
		}

		xhr.open(this.method, fullURL, true);
		xhr.send(processedBody);

		tk.log('Sent (' + method + ': ' + url + ')', this.body);
	}
}

tk.request = function(method, url){
	return new Request(method, url);
}
