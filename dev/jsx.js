'use strict';

(function () {
  var data;

  window.tk = toolkit.create({
    debug: true
  });

  data = [{
    name: 'thing 1',
    content: 'thing 2'
  }, {
    name: 'thing n',
    content: 'blah blah blah'
  }];

  tk.init(function () {
    var createDOM, el;
    createDOM = function createDOM(item) {
      return tk.virtual.tag(
        'article',
        { 'class': 'thing' },
        tk.virtual.tag(
          'h1',
          null,
          item.name
        ),
        tk.virtual.tag(
          'p',
          null,
          item.content.toUpperCase()
        )
      );
    };
    el = tk.virtual(createDOM).data(data).render();
    return tk('body').append(el);
  });
}).call(undefined);