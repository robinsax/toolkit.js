var tk = toolkit.create({debug: true});

let x = d =>
	<ul>
		<li>L I S T</li>
		{ tk.comp(d, k => {
			if (typeof k == 'string') {
				return <li>
					{ tk.comp(Array.prototype.slice.call(k), l =>
						<div><em>{ l }</em></div>
					)}
				</li>
			}
			if (k instanceof Array) {
				return <li class={ "len-" + k.length }>
					{ tk.comp(k, l => <h1>{ l + '' }</h1>) }
				</li>
			}
			return <li>{ k + '' }</li>
		})}
	</ul>

let t = tk.template(x).data([]).live();

tk('body').append(t.render());

window.f = (d) => t.data(d).render();
