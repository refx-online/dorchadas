import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
	js.configs.recommended,

	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2020
			},
			globals: {
				// Node.js globals
				Buffer: 'readonly',
				process: 'readonly',
				console: 'readonly',
				require: 'readonly',
				NodeJS: 'readonly',
				// Browser globals
				window: 'readonly',
				document: 'readonly',
				navigator: 'readonly',
				fetch: 'readonly',
				Response: 'readonly',
				Request: 'readonly',
				FormData: 'readonly',
				File: 'readonly',
				FileList: 'readonly',
				Blob: 'readonly',
				URL: 'readonly',
				URLSearchParams: 'readonly',
				HTMLElement: 'readonly',
				HTMLCanvasElement: 'readonly',
				HTMLVideoElement: 'readonly',
				Element: 'readonly',
				Node: 'readonly',
				CustomEvent: 'readonly',
				MouseEvent: 'readonly',
				Event: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				requestAnimationFrame: 'readonly',
				cancelAnimationFrame: 'readonly',
				performance: 'readonly',
				location: 'readonly',
				confirm: 'readonly',
				alert: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tseslint
		},
		rules: {
			...tseslint.configs.recommended.rules
		}
	},

	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			},
			globals: {
				// Node.js globals
				Buffer: 'readonly',
				process: 'readonly',
				console: 'readonly',
				require: 'readonly',
				NodeJS: 'readonly',
				// Browser globals
				window: 'readonly',
				document: 'readonly',
				navigator: 'readonly',
				fetch: 'readonly',
				Response: 'readonly',
				Request: 'readonly',
				FormData: 'readonly',
				File: 'readonly',
				FileList: 'readonly',
				Blob: 'readonly',
				URL: 'readonly',
				URLSearchParams: 'readonly',
				HTMLElement: 'readonly',
				HTMLCanvasElement: 'readonly',
				HTMLVideoElement: 'readonly',
				Element: 'readonly',
				Node: 'readonly',
				CustomEvent: 'readonly',
				MouseEvent: 'readonly',
				Event: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				requestAnimationFrame: 'readonly',
				cancelAnimationFrame: 'readonly',
				performance: 'readonly',
				location: 'readonly',
				confirm: 'readonly',
				alert: 'readonly'
			}
		},
		plugins: {
			svelte
		},
		rules: {
			...svelte.configs.recommended.rules
		}
	}
];
