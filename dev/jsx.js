'use strict';

(function () {
  window.tk = toolkit.create({
    debug: true
  });

  window.posts = [{
    title: 'Wikid sweet templates',
    content: 'pretty average actually',
    comments: ['yes.']
  }, {
    title: 'foobar',
    content: 'the is the content I suppose',
    comments: []
  }];

  tk.init(function () {
    var el;
    el = tk.template(function (item) {
      var comment;
      return tk.template.tag(
        'article',
        { 'class': 'post' },
        tk.template.tag(
          'h1',
          null,
          'A post: ' + item.title.toUpperCase()
        ),
        -1 !== item.content.indexOf('darn') ? tk.template.tag(
          'em',
          { style: 'color: red' },
          'This post contains swears!'
        ) : void 0,
        tk.template.tag(
          'p',
          null,
          item.content.replace('darn', 'd***')
        ),
        item.comments.length === 0 ? tk.template.tag(
          'em',
          { style: 'font-size: 9pt' },
          'No comments yet'
        ) : tk.template.tag(
          'ul',
          null,
          function () {
            var i, len, ref, results;
            ref = item.comments;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              comment = ref[i];
              results.push(tk.template.tag(
                'li',
                null,
                comment
              ));
            }
            return results;
          }()
        )
      );
    }).source(posts).render();
    return tk('body').append(el);
  });
}).call(undefined);