#   coding utf-8
'''
Build the source into development and minified versions. Build the 
documentation.
'''

import re
import sys

MINIFY_ENDPOINT = 'https://javascript-minifier.com/raw'

HEADER = '''/*
	toolkit.js

	Author: Robin Saxifrage
	License: Apache 2.0
*/
'''

def minify(source):
	try:
		import requests
	except ImportError:
		print('Run: pip install requests')
		return 1

	response = requests.post(MINIFY_ENDPOINT, data={
		'input': source
	})
	
	with open('toolkit.min.js', 'w') as f:
		f.write(f'{HEADER}{response.text}')
	
	print('Minified')
	return 0

def collect():
	def collect_file(filename):
		with open(f'./src/{filename}') as f:
			source = f.read()

		for match in re.finditer(r'(\t+)\/\*\s+::insertsource\s+(.*?)\s+\*\/', source):
			subsource = collect_file(match.group(2))
			subsource = subsource.replace('\n', f'\n{match.group(1)}')
			source = source.replace(match.group(0), f'{match.group(1)}{subsource}')

		return source

	toolkit_js = collect_file('root.js')
	with open('toolkit.js', 'w') as f:
		f.write(f'{HEADER}{toolkit_js}')
	
	print('Collected')
	return toolkit_js

def build():
	return minify(collect())

if __name__ == '__main__':
	sys.exit(build())
