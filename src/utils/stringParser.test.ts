import { describe, it, expect } from "vitest";
import { getSubstringBetween, conformsToHTMLTags, DEFAULT_ALLOWED_TAGS } from "./stringParser";

describe("getSubstringBetween", () => {
    it("should return 'cool' when given 'this is {something{cool}}, right?', 'thing{', '}'", () => {
        const str = "this is {something{cool}}, right?";
        const start = "thing{";
        const end = "}";
        const result = getSubstringBetween(str, start, end);
        expect(result).toBe("cool");
    });

    it("should return an empty string when the 'start' string is not found in the input", () => {
        const str = "this is {something{cool}}, right?";
        const start = "missing{";
        const end = "}";
        const result = getSubstringBetween(str, start, end);
        expect(result).toBe("");
    });

    it("should return an empty string when the 'end' string is not found in the input", () => {
        const str = "this is {something{cool}}, right?";
        const start = "thing{";
        const end = "missing}";
        const result = getSubstringBetween(str, start, end);
        expect(result).toBe("");
    });

    it("should return the information between the first and second occurance when 'start' and 'end' strings are the same", () => {
        const str = "this is {something{cool}}, right?";
        const start = "{";
        const end = "{";
        const result = getSubstringBetween(str, start, end);
        expect(result).toBe("something");
    });

    it("should return an empty string when 'start' string comes after 'end' string in the input", () => {
        const str = "this is {something{cool}}, right?";
        const start = "}";
        const end = "{";
        const result = getSubstringBetween(str, start, end);
        expect(result).toBe("");
    });
});

describe("HTML tag validator", () => {
    const testCases = [
        {
            input: "<h1>Hello</h1><p>This is a paragraph.</p><div><strong>Important</strong> content</div><span>More text</span><article>Invalid tag</article>",
            expected: false,
        },
        {
            input: "<h2>Title</h2><ul><li>Item 1</li><li>Item 2</li></ul><p>Paragraph</p>",
            expected: true,
        },
        {
            input: "<div><p>Valid</p></div><h1>Valid</h1><span>Valid</span><h2>Valid</h2>",
            expected: true,
        },
        {
            input: "<a href='#'>Link</a><img src='image.png' alt='Image'>",
            expected: true,
        },
        {
            input: "<table><thead><tr><th>Header 1</th><th>Header 2</th></tr></thead><tbody><tr><td>Data 1</td><td>Data 2</td></tr></tbody></table>",
            expected: true,
        }
    ];

    for (const testCase of testCases) {
        const { input, expected } = testCase;

        it(`Validates HTML tags for input: ${input}`, () => {
            const isValid = conformsToHTMLTags(input, DEFAULT_ALLOWED_TAGS);
            expect(isValid).toBe(expected);
        });
    }
});
