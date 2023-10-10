import { describe, test, expect } from "vitest";
import { getSubstringBetween, conformsToHTMLTags, DEFAULT_ALLOWED_TAGS, stringBeginsWith, changeExtension, squishArray, stringToBoolean } from "./stringParser";

describe("getSubstringBetween", () => {
    test("should return 'cool' when given 'this is {something{cool}}, right?', 'thing{', '}'", () => {
        const str = "this is {something{cool}}, right?";
        const start = "thing{";
        const end = "}";
        const result = getSubstringBetween(str, start, end);
        expect(result).toBe("cool");
    });

    test("should return an empty string when the 'start' string is not found in the input", () => {
        const str = "this is {something{cool}}, right?";
        const start = "missing{";
        const end = "}";
        const result = getSubstringBetween(str, start, end);
        expect(result).toBe("");
    });

    test("should return an empty string when the 'end' string is not found in the input", () => {
        const str = "this is {something{cool}}, right?";
        const start = "thing{";
        const end = "missing}";
        const result = getSubstringBetween(str, start, end);
        expect(result).toBe("");
    });

    test("should return the information between the first and second occurance when 'start' and 'end' strings are the same", () => {
        const str = "this is {something{cool}}, right?";
        const start = "{";
        const end = "{";
        const result = getSubstringBetween(str, start, end);
        expect(result).toBe("something");
    });

    test("should return an empty string when 'start' string comes after 'end' string in the input", () => {
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

        test(`Validates HTML tags for input: ${input}`, () => {
            const isValid = conformsToHTMLTags(input, DEFAULT_ALLOWED_TAGS);
            expect(isValid).toBe(expected);
        });
    }
});

describe("stringBeginsWith", () => {
    test("should return true when the string begins with", () => {
        expect(stringBeginsWith("this is a string", "t")).toBe(true);
        expect(stringBeginsWith("this is a string", "th")).toBe(true);
        expect(stringBeginsWith("this is a string", "thi")).toBe(true);
        expect(stringBeginsWith("this is a string", "this")).toBe(true);
        expect(stringBeginsWith("this is a string", "this ")).toBe(true);
        expect(stringBeginsWith("this is a string", "this is")).toBe(true);
        expect(stringBeginsWith("this is a string", "this is a")).toBe(true);
    });
    test("should work when the string to match is the length of the string to test", () => {
        expect(stringBeginsWith("this is a string", "this is a string")).toBe(true);
    });
    /*
    // true but out of spec
    test("should work with an empty string to test (since everything starts with nothing)", () => {
        expect(stringBeginsWith("this is a string", "")).toBe(true);
    });
    */
    test("should return false when the string does not begins with", () => {
        expect(stringBeginsWith("this is a string", "h")).toBe(false);
        expect(stringBeginsWith("this is a string", "i")).toBe(false);
        expect(stringBeginsWith("this is a string", "s")).toBe(false);
        expect(stringBeginsWith("this is a string", " ")).toBe(false);
        expect(stringBeginsWith("this is a string", "a")).toBe(false);
        expect(stringBeginsWith("this is a string", ".")).toBe(false);
        expect(stringBeginsWith("this is a string", "hifdsjfkds")).toBe(false);
        expect(stringBeginsWith("this is a string", "this is q")).toBe(false);
        expect(stringBeginsWith("this is a string", "this isn't")).toBe(false);
        expect(stringBeginsWith("this is a string", "2this is a")).toBe(false);
    });
    test("should not error when the string to match is longer than the length of the string to test", () => {
        expect(stringBeginsWith("this is a string", "this is a string2")).toBe(false);
        expect(stringBeginsWith("this is a string", "this is not a string")).toBe(false);
    });
});

describe("changeExtension", () => {
    test("changes the extension when it exists", () => {
        expect(changeExtension("path/to/file.txt", "ts")).toBe("path/to/file.ts");
        expect(changeExtension("path/to/file.txt", "js")).toBe("path/to/file.js");
        expect(changeExtension("path/to/file.txt", "jsx")).toBe("path/to/file.jsx");
        expect(changeExtension("another/path/to/file.js", "ts")).toBe("another/path/to/file.ts");
        expect(changeExtension("plainFile.txt", "q")).toBe("plainFile.q");
    });
    test("adds an extension when there is no extension", () => {
        expect(changeExtension("path/to/file", "json")).toBe("path/to/file.json");
        expect(changeExtension("path/to/file", "js")).toBe("path/to/file.js");
        expect(changeExtension("another/path/to/file", "html")).toBe("another/path/to/file.html");
    });
    test("removes the extension when newExtension is empty", () => {
        expect(changeExtension("path/to/file.txt", "")).toBe("path/to/file");
        expect(changeExtension("no/one/likes/.DS_STORE", "")).toBe("no/one/likes/"); // tricky
        expect(changeExtension("path/to/file", "")).toBe("path/to/file");
    });
});
describe("squishArray", () => {
    test("converts the string into comma separated values with no trailing spaces", () => {
        expect(squishArray(["these", "are", "some", "words"])).toBe("these, are, some, words");
        expect(squishArray(["a"])).toBe("a");
        expect(squishArray(["a", "b"])).toBe("a, b");
        expect(squishArray(["a", "b, c"])).toBe("a, b, c");
        expect(squishArray(["a", "b", "c"])).toBe("a, b, c");
        expect(squishArray(["a", "b", "c", "f", "f", "f"])).toBe("a, b, c, f, f, f");
    });
});

describe("stringToBoolean", () => {
    test("converts true and false", () => {
        expect(stringToBoolean("true")).toBe(true);
        expect(stringToBoolean("false")).toBe(false);
    });
    test("converts everything else to null", () => {
        expect(stringToBoolean("cow")).toBeNull();
        expect(stringToBoolean("t")).toBeNull();
        expect(stringToBoolean("f")).toBeNull();
        expect(stringToBoolean("")).toBeNull();
        expect(stringToBoolean(" ")).toBeNull();
        expect(stringToBoolean("moo")).toBeNull();
    });
});