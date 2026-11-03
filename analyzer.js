// ClauseCite analyzer: deterministic segmentation + rule matching.
// Input is raw pasted text. Output lists every (clause, rule) match with the exact
// character span and matched substring, plus per-category coverage. Pure functions,
// no I/O, no randomness: same text -> byte-identical report every time.
(function (root, factory) {
  const api = factory(typeof module !== "undefined" && module.exports ? require("./rules.js") : root.CLAUSECITE_RULES);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ClauseCiteAnalyzer = api;
})(typeof self !== "undefined" ? self : this, function (RULES) {
  "use strict";

  // Split pasted text into clauses. Numbered/lettered headings, ALL-CAPS headings,
  // and blank-line paragraph breaks all start new clauses. Deterministic.
  function segment(text) {
    const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
    const clauses = [];
    let cur = null;
    let offset = 0; // char offset of current line start in normalized text
    const headingRe = /^\s*((\d+([.\)]|\.\d+)*[\.\)]?)|([A-Z][\.\)]?)|([ivxl]+[\.\)]))\s+/i;
    const capsRe = /^\s*[A-Z][A-Z0-9 ,&'()\-\/:;]{3,}\s*$/;
    function push() { if (cur && cur.text.trim().length > 0) clauses.push(cur); cur = null; }
    for (const raw of lines) {
      const line = raw;
      const isBlank = line.trim().length === 0;
      const isHeading = !isBlank && (headingRe.test(line) || (capsRe.test(line) && line.trim().length < 90));
      if (isBlank) { push(); offset += line.length + 1; continue; }
      if (isHeading) {
        push();
        cur = { heading: line.trim(), text: line.trim(), start: offset, end: offset + line.length };
      } else if (cur) {
        cur.text += "\n" + line;
        cur.end = offset + line.length;
      } else {
        cur = { heading: null, text: line, start: offset, end: offset + line.length };
      }
      offset += line.length + 1;
    }
    push();
    return clauses;
  }

  // Negation cues: a modal + "not", "never", or a bare "no" (minus measurement idioms)
  // shortly BEFORE the matched span means the sentence may say the opposite.
  const NEG_MODAL = /\b(do|does|did|will|would|shall|should|may|might|must|can|could)\s+not\b|\bnever\b|\bcannot\b/i;
  const NEG_NO = /\bno\b(?!\s+(later|more|less|longer|sooner|fewer|greater|higher))/i;
  const NEUTRAL_NOTE = "Negation or reversed wording appears near this match, so the sentence may mean the opposite of what this pattern usually signals. Read the clause yourself - no risk is asserted.";

  // Returns "negation" | "reversal" | null for one match inside its clause text.
  function guardKind(rule, clauseText, matchStart, matchEnd) {
    const pre60 = clauseText.slice(Math.max(0, matchStart - 60), matchStart);
    const pre30 = clauseText.slice(Math.max(0, matchStart - 30), matchStart);
    if (NEG_MODAL.test(pre60)) return "negation";
    if (NEG_NO.test(pre30)) return "negation";
    if (rule.reversals) {
      const ctx = clauseText.slice(Math.max(0, matchStart - 90), matchEnd + 30);
      for (const r of rule.reversals) if (r.test(ctx)) return "reversal";
    }
    return null;
  }

  // Find every rule match inside one clause. Returns matches with exact spans and a
  // certainty field: "flag" (pattern fires on wording that supports the assertion) or
  // "unclear" (negation/role reversal nearby - no directional risk is asserted).
  function matchClause(clause, clauseIndex) {
    const out = [];
    for (const rule of RULES) {
      for (const pat of rule.patterns) {
        const re = new RegExp(pat.source, pat.flags.includes("g") ? pat.flags : pat.flags + "g");
        let m;
        let guard = 0;
        while ((m = re.exec(clause.text)) !== null && guard++ < 200) {
          const g = guardKind(rule, clause.text, m.index, m.index + m[0].length);
          out.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            severity: rule.severity,
            why: rule.why,
            look: rule.look,
            certainty: g ? "unclear" : "flag",
            guard: g,
            note: g ? NEUTRAL_NOTE : null,
            clauseIndex,
            clauseHeading: clause.heading,
            start: clause.start + m.index,
            end: clause.start + m.index + m[0].length,
            matched: m[0]
          });
          if (m.index === re.lastIndex) re.lastIndex++; // never loop on empty match
        }
      }
    }
    return out;
  }

  // Full analysis. Deterministic: no dates, no randomness, stable ordering.
  function analyze(text) {
    const normalized = String(text).replace(/\r\n?/g, "\n");
    const clauses = segment(normalized);
    const matches = [];
    clauses.forEach((c, i) => matches.push(...matchClause(c, i)));
    matches.sort((a, b) => a.start - b.start || a.ruleId.localeCompare(b.ruleId));
    // dedupe identical (ruleId,start,end)
    const seen = new Set();
    const unique = matches.filter((m) => {
      const k = m.ruleId + "|" + m.start + "|" + m.end;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const byCategory = {};
    for (const m of unique) {
      (byCategory[m.category] = byCategory[m.category] || []).push(m);
    }
    const flaggedRuleIds = new Set(unique.map((m) => m.ruleId));
    const notFound = RULES.filter((r) => !flaggedRuleIds.has(r.id)).map((r) => ({ ruleId: r.id, name: r.name, category: r.category }));
    return {
      ruleSetSize: RULES.length,
      clauseCount: clauses.length,
      charCount: normalized.length,
      matchCount: unique.length,
      flagCount: unique.filter((m) => m.certainty === "flag").length,
      unclearCount: unique.filter((m) => m.certainty === "unclear").length,
      matches: unique,
      byCategory,
      notFound
    };
  }

  // Plain-text report, deterministic, for copy/export.
  function toPlainReport(result) {
    const L = [];
    L.push("CLAUSECITE REPORT - deterministic pattern scan, not legal advice");
    L.push("Clauses reviewed: " + result.clauseCount + " | Rules applied: " + result.ruleSetSize + " | Flags: " + result.flagCount + " | Unclear: " + result.unclearCount);
    L.push("");
    const cats = Object.keys(result.byCategory).sort();
    for (const cat of cats) {
      L.push("== " + cat + " ==");
      const byRule = {};
      for (const m of result.byCategory[cat]) (byRule[m.ruleId] = byRule[m.ruleId] || []).push(m);
      for (const rid of Object.keys(byRule)) {
        const ms = byRule[rid];
        const confident = ms.filter((m) => m.certainty === "flag");
        const unclear = ms.filter((m) => m.certainty === "unclear");
        if (confident.length > 0) {
          L.push("- [" + confident[0].severity.toUpperCase() + "] " + confident[0].ruleName + " (" + confident.length + " match" + (confident.length > 1 ? "es" : "") + ")");
          L.push("  Why it matters: " + confident[0].why);
          L.push("  What to check: " + confident[0].look);
          for (const m of confident.slice(0, 3)) {
            const snip = m.matched.length > 90 ? m.matched.slice(0, 87) + "..." : m.matched;
            L.push("  Matched text: \"" + snip.replace(/\s+/g, " ") + "\"" + (m.clauseHeading ? "  [in: " + m.clauseHeading.slice(0, 60) + "]" : ""));
          }
        }
        for (const m of unclear.slice(0, 3)) {
          const snip = m.matched.length > 90 ? m.matched.slice(0, 87) + "..." : m.matched;
          L.push("- [UNCLEAR] " + m.ruleName + " - " + m.note);
          L.push("  Matched text: \"" + snip.replace(/\s+/g, " ") + "\"" + (m.clauseHeading ? "  [in: " + m.clauseHeading.slice(0, 60) + "]" : ""));
        }
      }
      L.push("");
    }
    L.push("== No matching wording found (may still exist in other phrasing) ==");
    for (const n of result.notFound) L.push("- " + n.name + " (" + n.category + ")");
    L.push("");
    L.push("Honesty note: ClauseCite runs fixed patterns only. A flag means wording worth reading,");
    L.push("not a legal conclusion. Missing flags do not prove a clause is absent. UNCLEAR means");
    L.push("negation or reversed wording nearby may flip the meaning - read those clauses yourself.");
    L.push("The negation check knows common phrasings it was tested on; it can miss negations in");
    L.push("other words, so treat any single flag as a pointer to read, not a settled finding.");
    return L.join("\n");
  }

  return { segment, matchClause, analyze, toPlainReport };
});
