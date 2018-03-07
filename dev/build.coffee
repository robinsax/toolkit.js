fs = require 'fs'
http = require 'http'
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

fs.writeFileSync 'toolkit.js', compileWithIncludes 'toolkit'
console.log 'Compiled'

minifyOpts =
	host: 'https://javascript-minifier.com'
	path: '/raw'
	method: 'POST'
#	TODO: Minify req.