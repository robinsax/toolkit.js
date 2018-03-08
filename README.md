# toolkit.js

toolkit.js is an experimental JavaScript library tooled to support DOM manipulation and inspection,
AJAX, object and array reflection, and JSX-compatable DOM templating.

It is best enjoyed with CoffeeScript, but is equally suitable to pure JavaScript development.

##	Building from source

Install node and npm. Then, run
```bash
cat required_packages | xargs npm install 
```
to install its package dependencies.

You can then build toolkit with
```bash
coffee build.coffee
```

##	Running the tests

To run the tests, run
```
coffee ./tests/run.coffee
```

*To be continued...*
