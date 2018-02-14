function Timeout(callback, milliseconds){
	this.handle = null;

	this.start = function(){
		this.handle = setTimeout(callback, milliseconds);
		return this;
	}

	this.cancel = function(){
		clearTimeout(this.handle);
		this.handle = null;
		return this;
	}
}

tk.timeout = function(func, milliseconds){
	var t = new Timeout(func, milliseconds);
	t.start();
	return t;
}

function Interval(callback, milliseconds){
	this.milliseconds = milliseconds;
	this.handle = null;

	this.time = function(milliseconds){
		var pausedHere = this.handle != null;
		if (pausedHere){
			this.stop();
		}
		this.milliseconds = milliseconds;
		if (pausedHere){
			this.start();
		}
		return this;
	}

	this.start = function(){
		if (this.handle != null){
			throw 'Already started';
		}
		this.handle = setInterval(callback, this.milliseconds);
		return this;
	}

	this.stop = function(){
		if (this.handle == null){
			throw 'Not running';
		}
		clearInterval(this.handle);
		this.handle = null;
		return this;
	}
}

tk.interval = function(callback, milliseconds){
	var i = new Interval(callback, milliseconds);
	i.start();
	return i;
}
