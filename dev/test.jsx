var tk = toolkit.create({debug: true});

let x = d =>
	<ul>
		<li>Always</li>
		{ tk.comp(d, k => 
			typeof k == 'string' ? 
				<li>
					{ tk.comp(Array.prototype.slice.call(k), l =>
						<div><em>{ l }</em></div>
					)}
				</li>
				: (
			k instanceof Array ?
				<li class={ "len-" + k.length }>
					{ tk.comp(k, l => <h1>{ l }</h1>) }
				</li>
				:
				<li id={ "x " + Math.random() }>{ k + '' }</li>
				)
		)}
	</ul>

let t = tk.template(x).inspection((el) => {
	el.css({
		color: el.is('em') ? 'blue' : 'red'
	})
}).data([1, 2, 3]).live();

tk('div').append(t.render());

window.f = (d) => t.data(d).render();
