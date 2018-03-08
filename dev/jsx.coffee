window.tk = toolkit.create
	debug: true

window.posts = [
	{
		title: 'Wikid sweet templates',
		content: 'pretty average actually',
		comments: [
			'yes.'
		]
	},
	{
		title: 'foobar',
		content: 'the is the content I suppose',
		comments: []
	}
]

tk.init () ->
	template = (item) ->
		<article class="post">
			<h1>{ 'A post: ' + item.title.toUpperCase() }</h1>
			{ if -1 != item.content.indexOf 'darn' 
				<em style="color: red">This post contains swears!</em> }
			<p>{ item.content.replace 'darn', 'd***' }</p>
			{ if item.comments.length == 0 
				<em style="font-size: 9pt">No comments yet</em> 
			else 
				<ul>
					{<li>{ comment }</li> for comment in item.comments }
				</ul>
			}
		</article>

	el = tk.template template
		.source posts
		.render()

	tk 'body'
		.append el
