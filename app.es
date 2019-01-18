const http = require('http');

import {parse as parseQueryString} from 'querystring';

import surgeon, {
	cheerioEvaluator,
	readSubroutine,
	removeSubroutine,
	selectSubroutine,
	subroutineAliasPreset
} from 'surgeon';


const operate = surgeon({
	evaluator: cheerioEvaluator(),
	subroutines: {
		...subroutineAliasPreset
	}
});
import {parse as parseYaml} from 'yaml';

const yml = `title: "select 'html head title' | rtc"
heading: "select 'html body h1' | rtc"
`;
const obj = parseYaml(yml);
/*const obj = {
	title: "select 'html head title' | rtc",
	heading: "select 'html body h1' | rtc"
};*/
const objJson = JSON.stringify(obj, null, 4);
const htmlStr = `<html>
	<head>
		<title>Title</title>
	</head>
	<body>
		<h1>Hello world!</h1>
	</body>
</html>`;
const htmlAttr = htmlStr.replace('<', '&lt;').replace('>', '&gt;');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/html;charset=utf-8');
	if (req.method === 'POST') {
		let body = '';
		req.on('data', chunk => {
				body += chunk.toString();
		});
		req.on('end', () => {
				const params = parseQueryString(body);
				const anObj = (params.yml && params.yml.length) ? parseYaml(params.yml) : JSON.parse(params.objJson);
				const result = operate(anObj, params.htmlStr);
				res.setHeader('Content-Type', 'text/json;charset=utf-8');
				res.end(JSON.stringify(result));
		});
	} else {
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
			</body>
		</html>`);
	}
});

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});
