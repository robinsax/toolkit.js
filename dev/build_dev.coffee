#	Builds test.jsx

babel = require 'babel-core'
fs = require 'fs'

transformed = babel.transform (fs.readFileSync './dev/test.jsx'),
	presets: [
		['es2015',
			modules: false
		]
	],
	plugins: [
		['transform-react-jsx',
			pragma: 'tk.template.tag'
		]
	]

fs.writeFileSync './dev/test.js', transformed.code