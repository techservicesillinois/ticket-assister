export function getSubstringBetween(str: string, start: string, end: string): string {
    const startIndex = str.indexOf(start);
    if (startIndex === -1) {
        return ""; // Start string not found in the input
    }

    const endIndex = str.indexOf(end, startIndex + start.length);
    if (endIndex === -1) {
        return ""; // End string not found in the input
    }

    return str.substring(startIndex + start.length, endIndex);
}
export const DEFAULT_ALLOWED_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "div", "p", "hr", "blockquote", "pre", "center", "span", "br", "wbr", "a", "img", "b", "i", "u", "s", "em", "strong", "mark", "ins", "del", "sup", "sub", "small", "q", "code", "kbd", "samp", "var", "font", "table", "thead", "tfoot", "tbody", "tr", "th", "td", "colgroup", "col", "caption"];
export function conformsToHTMLTags(input: string, allowedTags: Array<string>) {
    const regex = /<([a-z][\w-]*)\b/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(input)) !== null) {
        const tag = match[1];
        if (!allowedTags.includes(tag)) {
            return false;
        }
    }
    return true;
}