function ElementPropertyBinding(parent, element){
	var self = this;
	this.parent = parent;
	this.element = element;
	this.started = false;
	this.fns = {
		reset: tk.fn.eatCall,
		transform: tk.fn.identity,
		placement: function(d, e){
			e.html(d);
		}
	}

	this._applyChange = function(newValue){
		if (!self.started){
			self.fns.reset(newValue, self.element);
			self.started = true;
		}
		self.fns.placement(self.fns.transform(newValue), self.element);
	}

	this.reset = function(callback){
		this.fns.reset = callback;
		return this;
	}

	this.transform = function(callback){
		this.fns.transform = callback;
		return this;
	}

	this.placement = function(callback){
		this.fns.placement = callback;
		return this;
	}

	this.and = function(){
		parent.changed(this._applyChange);
		return this.parent;
	}
}

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

	this.changed = function(callback){
		this.fns.callback = callback;
		return this;
	}

	this.onto = function(element){
		return new ElementPropertyBinding(this, element);
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
			Object.defineProperty(host, property, descriptor);
		}

		//	Add the binding.
		host.__bindings__[property].push(this._processChange);
		
		//	Apply initial.
		this._processChange(host[property]);

		return this;
	}
}

function ElementArrayBinding(parent, element){
	var self = this;
	this.parent = parent;
	this.element = element;
	this.consts = {
		tag: 'div'	//	TODO: Configure.
	};
	this.fns = {
		removal: function(d, e, i){
			e.remove();
		},
		transform: tk.fn.identity,
		placement: function(d, e, i){
			e.html(d);
		}
	};

	this.tag = function(tag){
		this.consts.tag = tag;
		return this;
	}

	this._applyAdd = function(newValue, index){
		var toAdd = tk.tag(self.consts.tag);
		self.fns.placement(self.fns.transform(newValue), toAdd, index);
		self.element.append(toAdd);
	}

	this._applyRemove = function(value, index){
		//	TODO: Better.
		var toRemove = self.element.children(false).ith(index);
		self.fns.removal(value, toRemove, index);
	}

	this._applyChanged = function(value, index){
		//	TODO: Better.
		var target = self.element.children(false).ith(index);
		self.fns.placement(self.fns.transform(value), target, index);
	}

	this.removal = function(callback){
		this.fns.removal = callback;
		return this;
	}

	this.transform = function(callback){
		this.fns.transform = callback;
		return this;
	}

	this.placement = function(callback){
		this.fns.placement = callback;
		return this;
	}

	this.and = function(){
		parent.changed(this._applyChanged);
		parent.removed(this._applyRemove);
		parent.added(this._applyAdd);
		return this.parent;
	}
}

function ArrayBinding(ary){
	var self = this;
	this.ary = ary;
	this.fns = {
		added: tk.fn.eatCall,
		removed: tk.fn.eatCall,
		changed: tk.fn.eatCall
	}

	this._createListener = function(index, initialValue){
		var value = initialValue;
		return {
			get: function(){
				return value;
			},
			set: function(newValue){
				self.fns.changed(newValue, index);
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

	this.added = function(callback){
		this.fns.added = callback;
		return this;
	}

	this.removed = function(callback){
		this.fns.removed = callback;
		return this;
	}

	this.changed = function(callback){
		this.fns.changed = callback;
		return this;
	}

	this.onto = function(element){
		return new ElementArrayBinding(this, element);
	}

	this.begin = function(){
		//	Install listensers.
		var innerPush = this.ary.push;
		this.ary.push = function(){
			for (var i = 0; i < arguments.length; i++){
				self.fns.added(arguments[i], self.ary.length + i);
			}
			var returnValue = innerPush.apply(self.ary, arguments);
			self._wrapIndicies();
			return returnValue;
		}

		var innerPop = this.ary.push;
		this.ary.pop = function(){
			var index = self.ary.length - 1;
			self.fns.removed(self.ary[index], index);
			var returnValue = innerPop.apply(self.ary);
			self._wrapIndicies();
			return returnValue;
		}

		var innerSplice = this.ary.splice;
		this.ary.splice = function(start, count){
			for (var i = 0; i < count; i++){
				var index = i + start;
				self.fns.removed(self.ary[index], index);
			}
			var returnValue = innerSplice.apply(self.ary, [start, count]);
			self._wrapIndicies();
			return returnValue;
		}

		//	Apply initial.
		for (var i = 0; i < this.ary.length; i++){
			self.fns.added(this.ary[i], i);
		}
		self._wrapIndicies();

		return this;
	}
}

tk.binding = function(host){
	if (host instanceof Array){
		return new ArrayBinding(host);
	}
	else {
		var property = tk.varg(arguments, 1);
		return new PropertyBinding(host, property);
	}
}

tk.arrayBinding = function(ary){
	return new ArrayBinding(ary);
}
