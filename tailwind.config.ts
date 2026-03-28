import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import { skeleton } from '@skeletonlabs/tw-plugin';

const config: Config = {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/@skeletonlabs/skeleton/**/*.{html,js,svelte,ts}'
	],
	theme: {
		container: {
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1280px'
			}
		},
		extend: {
			fontSize: {
				'2xs': ['0.6rem', '0.85rem']
			}
		}
	},
	plugins: [
		forms,
		typography,
		skeleton({
			themes: {
				custom: [
					{
						name: 'theme',
						properties: {
							'--theme-font-family-base': `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
							'--theme-font-family-heading': `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
							'--theme-font-color-base': '0 0 0',
							'--theme-font-color-dark': '255 255 255',
							'--theme-rounded-base': '9999px',
							'--theme-rounded-container': '8px',
							'--theme-border-base': '1px',
							'--on-primary': '255 255 255',
							'--on-secondary': '255 255 255',
							'--on-tertiary': '255 255 255',
							'--on-success': '255 255 255',
							'--on-warning': '255 255 255',
							'--on-error': '255 255 255',
							'--on-surface': '255 255 255',
							'--color-primary-50': '245 245 245',
							'--color-primary-100': '241 241 241',
							'--color-primary-200': '238 238 238',
							'--color-primary-300': '227 227 227',
							'--color-primary-400': '207 207 207',
							'--color-primary-500': '186 186 186',
							'--color-primary-600': '167 167 167',
							'--color-primary-700': '140 140 140',
							'--color-primary-800': '112 112 112',
							'--color-primary-900': '91 91 91',
							'--color-secondary-50': '237 237 237',
							'--color-secondary-100': '231 231 231',
							'--color-secondary-200': '225 225 225',
							'--color-secondary-300': '207 207 207',
							'--color-secondary-400': '171 171 171',
							'--color-secondary-500': '135 135 135',
							'--color-secondary-600': '122 122 122',
							'--color-secondary-700': '101 101 101',
							'--color-secondary-800': '81 81 81',
							'--color-secondary-900': '66 66 66',
							'--color-tertiary-50': '232 232 232',
							'--color-tertiary-100': '224 224 224',
							'--color-tertiary-200': '216 216 216',
							'--color-tertiary-300': '193 193 193',
							'--color-tertiary-400': '146 146 146',
							'--color-tertiary-500': '99 99 99',
							'--color-tertiary-600': '89 89 89',
							'--color-tertiary-700': '74 74 74',
							'--color-tertiary-800': '59 59 59',
							'--color-tertiary-900': '49 49 49',
							'--color-success-50': '234 238 235',
							'--color-success-100': '226 233 228',
							'--color-success-200': '219 227 221',
							'--color-success-300': '198 210 201',
							'--color-success-400': '155 177 160',
							'--color-success-500': '112 143 119',
							'--color-success-600': '101 129 107',
							'--color-success-700': '84 107 89',
							'--color-success-800': '67 86 71',
							'--color-success-900': '55 70 58',
							'--color-warning-50': '236 234 227',
							'--color-warning-100': '229 228 218',
							'--color-warning-200': '223 221 209',
							'--color-warning-300': '203 200 181',
							'--color-warning-400': '164 159 125',
							'--color-warning-500': '125 118 69',
							'--color-warning-600': '113 106 62',
							'--color-warning-700': '94 89 52',
							'--color-warning-800': '75 71 41',
							'--color-warning-900': '61 58 34',
							'--color-error-50': '242 233 233',
							'--color-error-100': '237 226 226',
							'--color-error-200': '233 218 218',
							'--color-error-300': '220 196 196',
							'--color-error-400': '193 152 152',
							'--color-error-500': '167 108 108',
							'--color-error-600': '150 97 97',
							'--color-error-700': '125 81 81',
							'--color-error-800': '100 65 65',
							'--color-error-900': '82 53 53',
							'--color-surface-50': '223 223 223',
							'--color-surface-100': '213 213 213',
							'--color-surface-200': '202 202 202',
							'--color-surface-300': '170 170 170',
							'--color-surface-400': '107 107 107',
							'--color-surface-500': '43 43 43',
							'--color-surface-600': '39 39 39',
							'--color-surface-700': '32 32 32',
							'--color-surface-800': '26 26 26',
							'--color-surface-900': '21 21 21'
						}
					}
				]
			}
		})
	]
};

export default config;
