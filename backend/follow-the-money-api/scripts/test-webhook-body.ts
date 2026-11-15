import { normalizeWebhookBody } from '../src/controllers/integration.controller';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log("Testing webhook body normalization...");

// Express 5 leaves req.body undefined when no parser matched the Content-Type
// (e.g. iOS Shortcuts sending a File body as application/octet-stream).
const fromUndefined = normalizeWebhookBody(undefined);
assert(typeof fromUndefined === "object" && fromUndefined !== null, "undefined body becomes an object");
assert(Object.keys(fromUndefined).length === 0, "undefined body becomes an empty object");

// text/plain body that contains JSON must be parsed into fields, not crash.
const fromJsonText = normalizeWebhookBody('{"amount":"£28.00","merchant":"De Holding","cardName":"Monzo"}');
assert(fromJsonText.amount === "£28.00", "JSON text body exposes amount");
assert(fromJsonText.merchant === "De Holding", "JSON text body exposes merchant");
assert(fromJsonText.text === undefined, "JSON text body is not also treated as raw text");

// text/plain body that is raw OCR/notification text becomes { text }.
const raw = "Monzo\nJalapeno\nALL 4,300";
const fromRawText = normalizeWebhookBody(`  ${raw}  `);
assert(fromRawText.text === raw, "raw text body is exposed as trimmed text field");

// JSON that is not an object (e.g. a bare string or number) is raw text, not fields.
const fromJsonScalar = normalizeWebhookBody('"ALL 900"');
assert(fromJsonScalar.text === '"ALL 900"', "JSON scalar text is kept as raw text");

// Already-parsed object bodies pass through unchanged.
const obj = { amount: 5, merchant: "Spar" };
assert(normalizeWebhookBody(obj) === obj, "object body is returned as-is");

console.log("All webhook body normalization tests passed successfully! 🎉");
