(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SAMPLE = `TERMS OF SERVICE

1. AGREEMENT. By using the service you accept these terms. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of the changes.

2. SUBSCRIPTION. Your plan will automatically renew each month unless you cancel before the renewal date. All fees are non-refundable.

3. CONTENT. You grant us a perpetual, irrevocable, worldwide, royalty-free license to use your content, with the right to sublicense it to third parties.

4. PRIVACY. We may share your personal information with third parties for advertising. We retain backup copies of your data after account deletion.

5. DISCLAIMER. The service is provided "as is" without warranty of any kind. In no event shall we be liable for indirect or consequential damages, and our total liability is limited to the fees you paid in the last month.

6. INDEMNITY. You agree to indemnify and hold harmless the company from any claims arising from your use.

7. TERMINATION. We may terminate or suspend your account at any time, for any reason, without notice.

8. DISPUTES. Any dispute will be resolved by binding arbitration on an individual basis only. You waive any right to a jury trial and waive any right to participate in a class action. These terms are governed by the laws of Delaware, and the exclusive venue is the courts of Wilmington.`;

  let lastReport = "";

  function esc(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function render(result) {
    const sum = $("summary");
    sum.innerHTML =
      "<div><b>" + result.clauseCount + "</b><span>clauses reviewed</span></div>" +
      "<div><b>" + result.ruleSetSize + "</b><span>patterns applied</span></div>" +
      "<div><b>" + result.flagCount + "</b><span>flags raised</span></div>" +
      "<div><b>" + result.unclearCount + "</b><span>need a human read</span></div>";

    const catsEl = $("cats");
    catsEl.innerHTML = "";
    const cats = Object.keys(result.byCategory).sort();
    for (const cat of cats) {
      const div = document.createElement("div");
      div.className = "cat";
      const byRule = {};
      for (const m of result.byCategory[cat]) (byRule[m.ruleId] = byRule[m.ruleId] || []).push(m);
      let html = "<h2>" + esc(cat) + "</h2>";
      for (const rid of Object.keys(byRule)) {
        const msAll = byRule[rid];
        const confident = msAll.filter((m) => m.certainty === "flag");
        const unclear = msAll.filter((m) => m.certainty === "unclear");
        const ms = confident;
        if (ms.length > 0) {
        html += '<div class="rule">';
        html += '<span class="chip ' + ms[0].severity + '">' + ms[0].severity + "</span><h3>" + esc(ms[0].ruleName) + "</h3>";
        html += '<p class="why">' + esc(ms[0].why) + "</p>";
        html += '<p class="look">What to check: ' + esc(ms[0].look) + "</p>";
        for (const m of ms.slice(0, 3)) {
          const snip = m.matched.length > 140 ? m.matched.slice(0, 137) + "..." : m.matched;
          html += '<div class="snip">&ldquo;' + esc(snip.replace(/\s+/g, " ")) + "&rdquo;" +
            (m.clauseHeading ? '<span class="where">in: ' + esc(m.clauseHeading.slice(0, 80)) + "</span>" : "") + "</div>";
        }
        if (ms.length > 3) html += '<p class="muted">+ ' + (ms.length - 3) + " more match(es) in the full report</p>";
        html += "</div>";
        }
        for (const m of unclear.slice(0, 3)) {
          const snip2 = m.matched.length > 140 ? m.matched.slice(0, 137) + "..." : m.matched;
          html += '<div class="rule">';
          html += '<span class="chip unclear">unclear</span><h3>' + esc(m.ruleName) + "</h3>";
          html += '<p class="look">' + esc(m.note) + "</p>";
          html += '<div class="snip">&ldquo;' + esc(snip2.replace(/\s+/g, " ")) + "&rdquo;" +
            (m.clauseHeading ? '<span class="where">in: ' + esc(m.clauseHeading.slice(0, 80)) + "</span>" : "") + "</div>";
          html += "</div>";
        }
      }
      div.innerHTML = html;
      catsEl.appendChild(div);
    }

    const nf = $("notfound");
    nf.innerHTML = "";
    for (const n of result.notFound) {
      const li = document.createElement("li");
      li.textContent = n.name + " (" + n.category + ")";
      nf.appendChild(li);
    }
    $("results").hidden = false;
    lastReport = window.ClauseCiteAnalyzer.toPlainReport(result);
  }

  $("go").addEventListener("click", () => {
    const text = $("src").value;
    if (!text.trim()) { $("results").hidden = true; return; }
    render(window.ClauseCiteAnalyzer.analyze(text));
  });
  $("sample").addEventListener("click", () => { $("src").value = SAMPLE; $("go").click(); });
  $("clear").addEventListener("click", () => { $("src").value = ""; $("results").hidden = true; lastReport = ""; });
  $("copy").addEventListener("click", async () => {
    if (!lastReport) return;
    try { await navigator.clipboard.writeText(lastReport); $("copy").textContent = "Copied"; }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = lastReport; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove(); $("copy").textContent = "Copied";
    }
    setTimeout(() => { $("copy").textContent = "Copy full report"; }, 1500);
  });
})();
