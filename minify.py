#	coding utf-8
'''
Minification thanks to https://javascript-minifier.com/
'''
import sys

ENDPOINT = 'https://javascript-minifier.com/raw'

def main():
	try:
		import requests
	except ImportError:
		print('Run: pip install requests')
		return 1

	with open('toolkit.js', 'rb') as f:
		src = f.read()

	response = requests.post(ENDPOINT, data={
		'input': src
	})

	with open('README.md', 'r') as f:
		readme = f.read().replace('\n', '\n\t')
	header = f'/*\n\t{readme}\n*/'
	
	with open('tk.min.js', 'w') as f:
		f.write(f'{header}\n{response.text}')
	
	print('Done')
	return 0

if __name__ == '__main__':
	sys.exit(main())
