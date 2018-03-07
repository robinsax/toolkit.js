window.tk = toolkit.create
	debug: true

data = [
	{
		name: 'thing 1',
		content: 'thing 2'
	},
	{
		name: 'thing n',
		content: 'blah blah blah'
	}
]

tk.init () ->
	createDOM = (item) ->
		<article class="thing">
			<h1>{ item.name }</h1>
			<p>{ item.content.toUpperCase() }</p>
		</article>

	el = tk.virtual createDOM
		.data data
		.render()

	tk 'body'
		.append el