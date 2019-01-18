import http from 'http';

import {parse as parseQueryString} from 'querystring';

import surgeon, {
	cheerioEvaluator,
	//readSubroutine,
	removeSubroutine,
	selectSubroutine,
	subroutineAliasPreset
} from 'surgeon';
import {
	parse as parseUri,
	normalize,
	resolve,
	serialize
} from 'uri-js';
import {parse as parseYaml} from 'yaml';
import xPathToCss from 'xpath-to-css';


//──────────────────────────────────────────────────────────────────────────────
// Config
//──────────────────────────────────────────────────────────────────────────────
const yml = `title: select 'html head title' | rtc | trim
heading: x '//h1' | rtc | ws
link: so a | ra href | removeFragment | resolve http://www.example.com | normalize`;
const obj = parseYaml(yml);
const objJson = JSON.stringify(obj, null, 4);
const htmlStr = `<html>
	<head>
		<title> Title </title>
	</head>
	<body>
		<h1>Hello  world!</h1>
		<a href="relative#fragment">Relative link</a>
	</body>
</html>`;
const htmlAttr = htmlStr.replace('<', '&lt;').replace('>', '&gt;');

//const hostname = '127.0.0.1';
const hostname = '0.0.0.0';

//const port = 3000;
const port = 8080;


//──────────────────────────────────────────────────────────────────────────────
// Functions
//──────────────────────────────────────────────────────────────────────────────
function sortUniq(arr) {
	const sorted = arr.sort();
	const uniq = [];
	let prev = null;
	for (let i = 0; i < sorted.length; i += 1) {
		if (sorted[i] !== prev) { uniq.push(sorted[i]); }
		prev = sorted[i];
	}
	return uniq;
}


const operate = surgeon({
	evaluator: cheerioEvaluator(),
	subroutines: {
		...subroutineAliasPreset,
		normalize: s => normalize(s),
		resolve: (ss, [baseUri]) => Array.isArray(ss)
			? ss.map(s => resolve(baseUri, s))
			: resolve(baseUri, ss),
		removeFragment: (s) => {
			const uriObj = parseUri(s);
			delete uriObj.fragment;
			return serialize(uriObj);
		},
		reverse: s => s.reverse(),
		rm: (s, [firstValue], b) => removeSubroutine(s, [firstValue, '{0,}'], b),
		sort: s => s.sort(),
		sortUniq: s => sortUniq(s),
		trim: s => s.trim(),
		ws: s => s.replace(/\s{2,}/g, ' '),
		x: (s, vs, b) => selectSubroutine(s, vs.map(v => v.startsWith('{') ? v : xPathToCss(v)), b)
	}
});


//──────────────────────────────────────────────────────────────────────────────
// Main
//──────────────────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
	res.setHeader('Content-Type', 'text/html;charset=utf-8');
	if (req.method === 'POST') {
		let body = '';
		req.on('data', chunk => {
			body += chunk.toString();
		});
		req.on('end', () => {
			res.setHeader('Content-Type', 'text/json;charset=utf-8');
			try {
				const params = parseQueryString(body);
				const anObj = (params.yml && params.yml.length) ? parseYaml(params.yml) : JSON.parse(params.objJson);
				const result = operate(anObj, params.htmlStr);
				res.statusCode = 200;
				res.end(JSON.stringify(result));
			} catch (e) {
				res.statusCode = 500;
				res.end(JSON.stringify({error: e.message}));
			}
		});
	} else {
		res.statusCode = 200;
		res.end(`<!doctype html>
<html>
	<head>
		<title>Surgeon Service</title>
		<style type="text/css">
		label span {
			display: block;
			font-weight: bold;
		}
		</style>
	</head>
	<body>
		<h1>Surgeon Service</h1>
		<form action="/" method="post">
			<label>
				<span>Yaml or...</span>
				<textarea name="yml" rows="2" cols="80">${yml}</textarea><br />
			</label>
			<label>
				<span>...or ObjJson</span>
				<textarea name="objJson" rows="4" cols="80">${objJson}</textarea><br />
			</label>
			<label>
				<span>HTML string</span>
				<textarea name="htmlStr" rows="8" cols="80">${htmlAttr}</textarea><br />
			</label>
			<button>Operate</button>
		</form>

		<h2>Documentation</h2>
		See <a href="https://github.com/gajus/surgeon">Node module documentation</a>

		<h3>Subroutines</h3>
		See <a href="https://github.com/gajus/surgeon#subroutines">Built-in subroutines</a>

		<h4>Modify and select from document</h4>
		<table>
			<thead>
				<tr>
					<th>Subroutine</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>remove</td>
					<td>Remove elements from the document</td>
				</tr>
				<tr>
					<td>rm</td>
					<td>Short for remove subroutine</td>
				</tr>
				<tr>
					<td>sa</td>
					<td>Select any (sa). Selects multiple elements (0 or more). Returns array. Equivalent to select "..." {0,}</td>
				</tr>
				<tr>
					<td>saf</td>
					<td>Select any first (saf). Selects multiple elements (0 or more). Returns single result or null. Equivalent to select "..." {0,}[0]</td>
				</tr>
				<tr>
					<td>select</td>
					<td>Select the elements in the document</td>
				</tr>
				<tr>
					<td>sm</td>
					<td>Select many (sm). Selects multiple elements (1 or more). Returns array. Equivalent to select "..." {1,}</td>
				</tr>
				<tr>
					<td>so</td>
					<td>Select one (so). Selects a single element. Returns single result. Equivalent to select "..." {1}[0].</td>
				</tr>
				<tr>
					<td>x</td>
					<td>Select using xpath selector rather than css selector</td>
				</tr>
				<!--
				<tr>
					<td></td>
					<td></td>
				</tr>
				-->
			</tbody>
		</table>

		<h4>Read from matched element(s)</h4>
		<table>
			<thead>
				<tr>
					<th>Subroutine</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>ra</td>
					<td>Reads Element attribute value. Equivalent to read attribute ...</td>
				</tr>
				<tr>
					<td>read attribute</td>
					<td>Extract attribute value from the matching element</td>
				</tr>
				<tr>
					<td>read property</td>
					<td>Extract property value from the matching element</td>
				</tr>
				<tr>
					<td>rp</td>
					<td>Reads Element property value. Equivalent to read property ...</td>
				</tr>
				<tr>
					<td>rtc</td>
					<td>Reads textContent property of an element. Equivalent to read property ... textContent</td>
				</tr>
			</tbody>
		</table>

		<h4>Value(s) processing</h4>
		<table>
			<thead>
				<tr>
					<th>Subroutine</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>normalize</td>
					<td>Normalize an url</td>
				</tr>
				<tr>
					<td>resolve</td>
					<td>Resolve one or more urls</td>
				</tr>
				<tr>
					<td>removeFragment</td>
					<td>Remove the fragment from an url</td>
				</tr>
				<tr>
					<td>reverse</td>
					<td>Reverse sort an array</td>
				</tr>
				<tr>
					<td>sort</td>
					<td>Sort an array</td>
				</tr>
				<tr>
					<td>sortUniq</td>
					<td>Sort an array and remove duplicates</td>
				</tr>
				<tr>
					<td>trim</td>
					<td>Trim the subject string</td>
				</tr>
				<tr>
					<td>ws</td>
					<td>Replace multiple whitespace with a single space</td>
				</tr>
			</tbody>
		</table>
	</body>
</html>`);
	}
});

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`); //eslint-disable-line no-console
});
