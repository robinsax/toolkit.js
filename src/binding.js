function PropertyBinding(host, property){
	var self = this;
	this.host = host;
	this.property = property;
	this.fns = {
		callback: tk.fn.eatCall
	};

	this._processChange = function(newValue){
		self.fns.callback(newValue);
	}

	this._createListener = function(bindings, initialValue){
		var value = initialValue;
		return {
			get: function(){
				return value;
			},
			set: function(newValue){
				tk.iter(bindings, function(b){
					b(newValue);
				});
				value = newValue;
			}
		};
	}

	this.change = function(callback){
		this.fns.callback = callback;
		return this;
	}

	this.begin = function(){
		//  Ensure bindings map exists.
		if (!tk.prop(host, '__bindings__')){
			host.__bindings__ = {};
		}
		
		//  Ensure a list exists for this binding.
		if (!tk.prop(host.__bindings__, property)){
			//  Attach the listener.
			host.__bindings__[property] = [];
			var descriptor = this._createListener(host.__bindings__[property], host[property]);
			console.log(descriptor);
			Object.defineProperty(host, property, descriptor);
		}

		//	Add the binding.
		host.__bindings__[property].push(this._processChange);

		return this;
	}
}

function ArrayBinding(ary){
	var self = this;
	this.ary = ary;
	this.fns = {
		add: tk.fn.eatCall,
		remove: tk.fn.eatCall,
		modify: tk.fn.eatCall
	}

	this._createListener = function(index, initialValue){
		var value = initialValue;
		return {
			get: function(){
				return value;
			},
			set: function(newValue){
				self.fns.modify(newValue, index);
				value = newValue;
			},
			configurable: true
		};
	}

	this._wrapIndicies = function(){
		tk.iter(this.ary, function(v, i){
			var descriptor = self._createListener(i, v);
			Object.defineProperty(self.ary, i + '', descriptor);
		});
	}

	this.add = function(callback){
		this.fns.add = callback;
		return this;
	}

	this.remove = function(callback){
		this.fns.remove = callback;
		return this;
	}

	this.modify = function(callback){
		this.fns.modify = callback;
		return this;
	}

	this.begin = function(){
		//	Install listensers.
		var innerPush = this.ary.push;
		this.ary.push = function(){
			for (var i = 0; i < arguments.length; i++){
				self.fns.add(arguments[i], self.ary.length + i);
			}
			var returnValue = innerPush.apply(self.ary, arguments);
			self._wrapIndicies();
			return returnValue;
		}

		var innerPop = this.ary.push;
		this.ary.pop = function(){
			var index = self.ary.length - 1;
			self.fns.remove(self.ary[index], index);
			var returnValue = innerPop();
			self._wrapIndicies();
			return returnValue;
		}

		var innerSplice = this.ary.splice;
		this.ary.splice = function(start, count){
			for (var i = 0; i < count; i++){
				var index = i + start;
				self.fns.remove(this.ary[index], index);
			}
			var returnValue = innerSplice(start, count);
			self._wrapIndicies();
			return returnValue;
		}

		//	Apply initial.
		for (var i = 0; i < this.ary.length; i++){
			self.fns.add(this.ary[i], i);
		}
		self._wrapIndicies();

		return this;
	}
}

tk.binding = function(host, property){
	return new PropertyBinding(host, property);
}

tk.arrayBinding = function(ary){
	return new ArrayBinding(ary);
}
