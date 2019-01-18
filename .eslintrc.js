module.exports = {
	extends: 'airbnb-base',
	globals: {},
	rules: {
		'arrow-parens': ['off'],
		'comma-dangle': ['error', {
			arrays: 'ignore',
			objects: 'never',
			imports: 'never',
			exports: 'never',
			functions: 'ignore'
		}],
		indent: ['warn', 'tab'],
		'max-len': ['error', 160, 2, {
			ignoreUrls: true,
			ignoreComments: true,
			ignoreRegExpLiterals: true,
			ignoreStrings: true,
			ignoreTemplateLiterals: true,
		}],
		'no-confusing-arrow': ['off'],
		'no-tabs': ['off'],
		'object-curly-spacing': ['off'],
		'spaced-comment': ['off']
	} // rules
} // module.exports
