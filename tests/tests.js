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
    tk.arrayBinding(x)
        .add(function(d, i){ console.log('added ' + d + ' ' + i); })
        .remove(function(d, i){ console.log('removed ' + d + ' ' + i); })
        .modify(function(d, i){ console.log('modified ' + d + ' ' + i); })
        .begin();
});