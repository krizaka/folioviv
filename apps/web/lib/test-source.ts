/**
 * Source text with every layout choice removed, for the tests that check a call or a prop is present.
 * Prettier decides line breaks, spaces, trailing commas and the parentheses around a JSX branch: none of it is behaviour,
 * so the text is compared without whitespace, trailing commas and `(` `)` around a JSX element.
 * Write the expected snippet through `compact` too, so both sides are in the same form.
 */
export const compact = (source: string): string =>
  source
    .replace(/\s+/g, "")
    .replace(/,([)}\]])/g, "$1")
    .replace(/\(</g, "<")
    .replace(/>\)/g, ">");
