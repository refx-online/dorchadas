export function parseBBCodeToHtml(bbcode: string): string {
    if (typeof bbcode !== 'string') {
        return '';
    }

    bbcode = bbcode.replace(/[<>&"']/g, (c) => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
    }[c] || c));
    
    // skull
    // copied from our old frontend
    // maybe need a bb code page to explain what these means?
    const conversions: [RegExp, string | ((...args: string[]) => string)][] = [
        [/\[b\]([\s\S]*?)\[\/b\]/g, '<strong>$1</strong>'],
        [/\[i\]([\s\S]*?)\[\/i\]/g, '<em>$1</em>'],
        [/\[u\]([\s\S]*?)\[\/u\]/g, '<u>$1</u>'],
        [/\[s\]([\s\S]*?)\[\/s\]/g, '<s>$1</s>'],

        [/\[url=(.*?)\]([\s\S]*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>'],
        [/\[url\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'],

        [/\[img\](.*?)\[\/img\]/g, '<img src="$1" alt="User posted image" class="userpage-img">'],

        [/\[color=(.*?)\]([\s\S]*?)\[\/color\]/g, '<span style="color:$1;">$2</span>'],

        [/\[size=(\d{1,2}|80)\]([\s\S]*?)\[\/size\]/g, '<span style="font-size:$1px;">$2</span>'],

        [/\[list\]([\s\S]*?)\[\/list\]/g, '<ul>$1</ul>'],
        [/\[list=1\]([\s\S]*?)\[\/list\]/g, '<ol>$1</ol>'],
        [/\[\*\](.*?)(?=\[\*\]|\[\/list\]|$)/g, '<li>$1</li>'],

        [/\[code\]([\s\S]*?)\[\/code\]/g, '<pre><code>$1</code></pre>'],

        [/\[heading\]([\s\S]*?)\[\/heading\]/g, '<h2 class="userpage-heading">$1</h2>'],

        [/\[notice\]([\s\S]*?)\[\/notice\]/g, '<div class="userpage-notice">$1</div>'],

        [/\[spoiler\]([\s\S]*?)\[\/spoiler\]/g, '<div class="spoiler" onclick="this.classList.toggle(\'revealed\')">$1</div>'],

        [/\[quote="(.*?)"\]([\s\S]*?)\[\/quote\]/g, '<blockquote class="userpage-quote"><strong>$1 said:</strong><br>$2</blockquote>'],
        [/\[quote\]([\s\S]*?)\[\/quote\]/g, '<blockquote class="userpage-quote">$1</blockquote>'],

        [/\[box=(.*?)\]([\s\S]*?)\[\/box\]/g, '<div class="userpage-box" style="background-color:$1;">$2</div>'],

        [/\[profile\](.*?)\[\/profile\]/g, '<a href="/u/$1" class="userpage-profile-link">$1</a>'],

        // you can use it like this
        // [spotify][/spotify]
        //        width,height
        // [spotify=300,800][/spotify]
        [/\[spotify(?:=(\d+),(\d+))?\](https?:\/\/open\.spotify\.com\/[^\s\]]+)\[\/spotify\]/g, (match, width, height, url) => {
            const embedUrl = url.replace("open.spotify.com", "open.spotify.com/embed");
            const iframeWidth = width || "300";
            const iframeHeight = height || "380";

            return `<div style="display: inline-block; margin-right: 10px;">
                        <iframe src="${embedUrl}" width="${iframeWidth}" height="${iframeHeight}" frameborder="0" allow="encrypted-media"></iframe>
                    </div>`;
        }],

        [/\[audio\](https?:\/\/[^\s]+)\[\/audio\]/g, '<audio controls><source src="$1" type="audio/mpeg">Your browser does not support the audio element.</audio>'],

        [/\[centre\]([\s\S]*?)\[\/centre\]/g, '<div style="text-align:center;">$1</div>'],

        [/\n/g, '<br>']
    ];

    conversions.forEach(([pattern, replacement]) => {
        if (typeof replacement === "string") {
            bbcode = bbcode.replace(pattern, replacement);
        } else {
            bbcode = bbcode.replace(pattern, (...args) => replacement(...args));
        }
    });

    return bbcode;
}