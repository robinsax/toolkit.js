fs = require 'fs'
http = require 'http'
coffee = require 'coffeescript'
babel = require 'babel-core'

compileWithIncludes = (filename) ->
	contents = fs.readFileSync 'new_src/' + filename + '.coffee', 'utf-8'

	contents = contents.replace /#\s+::include\s+(.+)\s*?\n/g, (match, includeFilename) ->
		fs.readFileSync 'new_src/' + includeFilename + '.coffee', 'utf-8'

	transpileOpts = 
		presets: ['es2015']
	compiled = coffee.compile contents
	result = babel.transform compiled, transpileOpts
	result.code

fs.writeFileSync 'toolkit.new.js', compileWithIncludes 'toolkit'
console.log 'Compiled'
