const A = require("./analyzer.js");
let pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; } else { fail++; console.log("FAIL: " + name); } }

const TOS = `TERMS OF SERVICE

1. AGREEMENT. By using the service you accept these terms. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of the changes.

2. SUBSCRIPTION. Your plan will automatically renew each month unless you cancel before the renewal date. All fees are non-refundable.

3. CONTENT. You grant us a perpetual, irrevocable, worldwide, royalty-free license to use your content, with the right to sublicense it to third parties.

4. PRIVACY. We may share your personal information with third parties for advertising. We retain backup copies of your data after account deletion.

5. DISCLAIMER. The service is provided "as is" without warranty of any kind. In no event shall we be liable for indirect or consequential damages, and our total liability is limited to the fees you paid in the last month.

6. INDEMNITY. You agree to indemnify and hold harmless the company from any claims arising from your use.

7. TERMINATION. We may terminate or suspend your account at any time, for any reason, without notice.

8. DISPUTES. Any dispute will be resolved by binding arbitration on an individual basis only. You waive any right to a jury trial and waive any right to participate in a class action. These terms are governed by the laws of Delaware, and the exclusive venue is the courts of Wilmington.`;

const r = A.analyze(TOS);
const ids = new Set(r.matches.map((m) => m.ruleId));

// 1-10: every expected risk family fires
ok(ids.has("binding-arbitration"), "arbitration flagged");
ok(ids.has("class-action-waiver"), "class waiver flagged");
ok(ids.has("jury-waiver"), "jury waiver flagged");
ok(ids.has("unilateral-modification"), "unilateral modification flagged");
ok(ids.has("auto-renewal"), "auto-renewal flagged");
ok(ids.has("non-refundable"), "non-refundable flagged");
ok(ids.has("content-license"), "content license flagged");
ok(ids.has("data-sharing"), "data sharing flagged");
ok(ids.has("data-retention"), "data retention flagged");
ok(ids.has("liability-cap") || ids.has("consequential-damages"), "liability flagged");
ok(ids.has("indemnification"), "indemnity flagged");
ok(ids.has("termination-at-will"), "termination flagged");
ok(ids.has("governing-law"), "governing law flagged");
ok(ids.has("warranty-disclaimer"), "warranty disclaimer flagged");

// 11: matched spans point at the real text
for (const m of r.matches) {
  const slice = TOS.replace(/\r\n?/g, "\n").slice(m.start, m.end);
  if (slice !== m.matched) { ok(false, "span mismatch for " + m.ruleId + " got [" + slice + "] want [" + m.matched + "]"); }
}
ok(true, "all spans verified");

// 12: determinism - identical report twice
const rep1 = A.toPlainReport(A.analyze(TOS));
const rep2 = A.toPlainReport(A.analyze(TOS));
ok(rep1 === rep2, "deterministic report");

// 13: benign text produces no HIGH severity flags
const BENIGN = `1. DELIVERY. We will ship your order within five business days.

2. RETURNS. You may return any item within thirty days for a full refund.

3. CONTACT. Email us any time with questions about your order.`;
const rb = A.analyze(BENIGN);
ok(rb.matches.filter((m) => m.severity === "high" && m.certainty === "flag").length === 0, "no high-severity flags on benign text");

// 14: segmentation splits numbered clauses
const segs = A.segment(TOS);
ok(segs.length >= 8, "segmentation finds >=8 clauses (got " + segs.length + ")");

// 15: notFound lists rules that did not fire, with honesty wording in report
ok(Array.isArray(r.notFound) && r.notFound.length > 0, "notFound populated");
ok(rep1.includes("may still exist in other phrasing"), "report carries honesty note");

// 16: every match carries why + look + category
ok(r.matches.every((m) => m.why && m.look && m.category && m.clauseHeading !== undefined), "match shape complete");


// 17-24: negation and role reversal must not become confident directional flags
function cert(text, ruleId) {
  const rr = A.analyze(text);
  const m = rr.matches.filter((x) => x.ruleId === ruleId);
  return m.length === 0 ? "absent" : m[0].certainty;
}
ok(cert("We do not share or sell your personal data.", "data-sharing") !== "flag", "negated data-sharing not confident");
ok(cert("You retain all IP; no assignment of intellectual property occurs.", "ip-assignment") !== "flag", "negated IP assignment not confident");
ok(cert("There is no mandatory arbitration for any dispute.", "binding-arbitration") !== "flag", "negated arbitration not confident");
ok(cert("We will not modify these terms at any time without telling you first.", "unilateral-modification") !== "flag", "negated modification not confident");
ok(cert("We indemnify you against any third-party claims.", "indemnification") !== "flag", "reversed indemnification not confident");
ok(cert("You agree to indemnify the company against claims arising from your content.", "indemnification") === "flag", "normal indemnification still confident");
ok(cert("You may terminate this agreement at any time.", "termination-at-will") !== "flag", "user-side termination not confident");
ok(cert("We may terminate your account at any time, for any reason, without notice.", "termination-at-will") === "flag", "provider-side termination still confident");

// 25: unclear matches carry the neutral note and no directional assertion
const ru = A.analyze("We do not share or sell your personal data.");
const um = ru.matches.find((m) => m.ruleId === "data-sharing");
ok(um && um.certainty === "unclear" && um.note && um.note.includes("no risk is asserted"), "unclear carries neutral note");

// 26: hostile TOS keeps every confident flag (no over-downgrade)
const rh = A.analyze(TOS);
ok(rh.matches.filter((m) => m.certainty === "flag").length >= 20, "hostile sample keeps confident flags (got " + rh.matches.filter((m) => m.certainty === "flag").length + ")");
ok(rh.matches.every((m) => m.certainty === "flag"), "hostile sample has zero unclear");

// 27: report marks UNCLEAR and flag counts separately
const rep3 = A.toPlainReport(ru);
ok(rep3.includes("[UNCLEAR]") && rep3.includes("Flags: 0") && rep3.includes("Unclear: 1"), "report separates flags from unclear");

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
