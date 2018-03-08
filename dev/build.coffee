fs = require 'fs'
ugly = require 'uglify-js'
coffee = require 'coffeescript'
babel = require 'babel-core'

compileWithIncludes = (filename) ->
	contents = fs.readFileSync 'src/' + filename + '.coffee', 'utf-8'

	contents = contents.replace /#\s+::include\s+(.+)\s*?\n/g, (match, includeFilename) ->
		fs.readFileSync 'src/' + includeFilename + '.coffee', 'utf-8'

	transpileOpts = 
		presets: ['es2015']
	compiled = coffee.compile contents
	result = babel.transform compiled, transpileOpts
	result.code

header = '''/*
	toolkit.js

	Author: Robin Saxifrage
	License: Apache 2.0
*/

'''

es5 = compileWithIncludes 'toolkit'

fs.writeFileSync 'toolkit.js', header + es5

fs.writeFileSync 'toolkit.min.js', header + (ugly.minify es5).code 
console.log 'Minified'