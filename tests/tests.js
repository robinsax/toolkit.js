/*
    Crash tests.
*/
var tk = createToolkit();

tk.init(function(){
    tk('body')
        .append([
            tk.tag('div'),
            tk.tag('p'),
            tk.tag('div', 'suppy-boi')
        ])
        .classify('red', function(e){ return e.is('p'); })
        .html(function(e){ return 'I am a ' + e.tag()});

    window.x = [1, 2, 3];
    tk.binding(x)
        .added(function(d, i){ console.log('added ' + d + ' ' + i); })
        .removed(function(d, i){ console.log('removed ' + d + ' ' + i); })
        .changed(function(d, i){ console.log('modified ' + d + ' ' + i); })
		.begin();
		
	window.y = {
		a: 'b'
	};
	tk.binding(y, 'a')
		.onto(tk('body').append(tk.tag('div')))
		.and().begin();

	window.z = [1, 2, 3];
	tk.binding(z)
		.onto(tk('body').append(tk.tag('ul')))
			.tag('li')
		.and().begin();
});