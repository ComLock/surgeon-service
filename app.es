const http = require('http');

import {parse} from 'querystring';

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


const obj = {
	title: "select 'html head title' | rtc",
	heading: "select 'html body h1' | rtc"
};
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
				const params = parse(body);
				const anObj = JSON.parse(params.objJson);
				const result=operate(anObj, params.htmlStr);
				res.setHeader('Content-Type', 'text/json;charset=utf-8');
				res.end(JSON.stringify(result));
		});
	} else {
		res.end(`<!doctype html>
			<html>
				<body>
					<form action="/" method="post">
					<textarea name="objJson" rows="4" cols="80">${objJson}</textarea><br />
					<textarea name="htmlStr" rows="8" cols="80">${htmlAttr}</textarea><br />
					<button>Operate</button>
				</form>
			</body>
		</html>`);
	}
});

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});
