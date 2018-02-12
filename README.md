# toolkit.js

toolkit.js is a JavaScript helper library which aims to make some of the 
most common tasks in modern front-end web development easier. Namely,
* DOM manipulation: toolkit.js allows you to easily and quickly create,
	manipulate, and interrogate DOM elements.
* AJAX: Chaining-based asynchronous requests improve the native XHR interface.
* Data relection: On-data callback bindings can be used to decrease the complexity
	of front-end data management logic and to generate *live* views which respond
	automatically to data being modified.

## What's it like?
Live data views are what make toolkit.js powerful. The following code sample
creates a data object and corresponding live view. The data object is then
modified, and implicitly the view is updated. Don't worry if you don't totally
understand it; it's just a demonstration.
```javascript
//  Create an instance of toolkit.js.
var tk = createToolkit({debug: true});

//  Create some data (in this case, a list of breakfasts).
window.breakfastList = [
	{
		name: 'The Classic',
		description: 'A classic homestyle breakfast',
		link: './the_classic'
	},
	{
		name: 'Just Toast',
		description: 'Literally just toast',
		link: './just_toast'
	}
];

//	Define an initialization function.
tk.init(function(){
	//	Create a live view of the data.

	tk.binding(breakfastList)
		//	Specify an element to bind the data onto.
		.onto(tk('body').append('div'))
			//	Specify the root tag to be created for each item in the array.
			.tag('aside')
			//	Specify how to represent each item within its element.
			.placement(function(breakfast, element){
				//	Bind the name property onto a header element.
				tk.binding(breakfast, 'name')
					.onto(element.append('h4'))
					.begin();
				
				//	Bind the description property onto a paragraph element.
				tk.binding(breakfast, 'description')
					.onto(element.append('p'))
					.begin();
				
				//	Bind the link property onto the href attribute of a link.
				tk.binding(breakfast, 'link')
					.onto(element.append('a').text('Learn more'))
						.placement(function(d, e){ e.attr('href', d); })
					.begin();
			})
	//	Actualize the binding.
	.begin();

	//	Create a button that modifies the list.
	tk('body').append('input')
		.attr({
			type: 'button',
			value: 'Modify'
		})
		.on('click', function(e){
			//	Update properties of the first data item.
			breakfastList[0].name = 'The Classic 2.0';
			breakfastList[0].link = '/the_classic_2';

			//	Add a new item to the list.
			breakfastList.push({
				name: 'The Next Morning',
				description: 'Coffee, pancakes, and fruit salad are the cure',
				link: '/the_next_morning'
			});
			
			//	Remove the button.
			e.remove();
		});
});
```

Try this example in your browser in `./examples/intro.html`.
