# toolkit.js

toolkit.js is a Javascript helper library which aims to reduce boilerplate
and improve code maintainability. It features DOM manipulation utilities,
an AJAX interface, and live data to DOM binding.

## What's it like?
The following code sample is a demonstration of two of toolkit's most powerful
features: data to DOM binding and "snap" syntax.
```javascript
//  Create an instance of toolkit.
var tk = createToolkit();

//  Create an object defining the page contents.
var pageData = {
	title: 'Hello toolkit',
	content: 'This is a demonstration of the toolkit.js library',
	color: 'red'
}

//	Define an initialization function.
tk.init(function(){
	//	Actualize the page contents.
	tk('body').binding.snap(pageData, {
		title: '+*h1.title:text',
		content: '+*p.content:text',
		color: '$e:css(color)'
	});

	//	Slowly modify the page.
	var modifications = [
		function(){ pageData.title = 'A new title'; },
		function(){ pageData.content = 'Set dynamically!'; },
		function(){ pageData.color = 'blue'; }
	];
	tk.iter(modifications, function(f, i){
		tk.timeout(f, (i + 1)*2500);
	});
});
```

This example lives at `./examples/intro.html`. Try modifying `pageData` in the console!
