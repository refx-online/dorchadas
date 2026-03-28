import sanitizeHtmlLib from 'sanitize-html';

export const sanitizeHtml = (html: string): string => {
	return sanitizeHtmlLib(html, {
		allowedTags: [
			'b',
			'i',
			'em',
			'strong',
			'u',
			's',
			'a',
			'img',
			'span',
			'ul',
			'ol',
			'li',
			'pre',
			'code',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'div',
			'blockquote',
			'br',
			'iframe',
			'details',
			'summary'
		],
		allowedAttributes: {
			a: ['href', 'target', 'rel'],
			img: ['src', 'alt', 'class'],
			span: ['style'],
			div: ['style', 'class'],
			blockquote: ['class'],
			iframe: ['src', 'width', 'height', 'frameborder', 'allow'],
			details: ['class'],
			summary: []
		},
		allowedClasses: {
			img: ['userpage-img'],
			div: ['userpage-notice', 'userpage-box', 'spoiler'],
			blockquote: ['userpage-quote'],
			a: ['userpage-profile-link'],
			h2: ['userpage-heading'],
			details: ['spoiler']
		},
		allowedStyles: {
			'*': {
				color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i],
				'text-align': [/^left$/i, /^right$/i, /^center$/i, /^justify$/i],
				'font-size': [/^\d+(?:px|em|%)$/i],
				'background-color': [
					/^#(0x)?[0-9a-f]+$/i,
					/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i
				]
			}
		},
		allowedIframeHostnames: ['open.spotify.com']
	});
};
