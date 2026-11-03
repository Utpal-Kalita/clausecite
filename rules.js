// ClauseCite deterministic clause-risk rules.
// Every rule is a set of literal regex patterns. A flag means "this wording matches a
// pattern a reader may want to look at" - never a legal verdict. Patterns only catch
// the phrasings they know; absence of a flag never proves absence of a clause.
(function (root, factory) {
  const rules = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = rules;
  else root.CLAUSECITE_RULES = rules;
})(typeof self !== "undefined" ? self : this, function () {
  return [
    {
      id: "binding-arbitration",
      category: "Disputes",
      severity: "high",
      name: "Binding arbitration",
      patterns: [/\barbitrat/i],
      why: "Disputes may have to go to a private arbitrator instead of a court.",
      look: "Check whether arbitration is mandatory, who pays, and whether small-claims court is excluded."
    },
    {
      id: "class-action-waiver",
      category: "Disputes",
      severity: "high",
      name: "Class-action / collective-action waiver",
      patterns: [/waiv\w{0,4}[^.]{0,120}class[\s-]action/i, /class[\s-]action[^.]{0,120}waiv/i, /no[^.]{0,60}(class|representative|collective)[^.]{0,40}(action|proceeding)/i, /individual basis[^.]{0,80}(only|basis)/i],
      why: "You may give up the ability to join with others in one case.",
      look: "Often sits inside the arbitration clause. Look for an opt-out window and its deadline."
    },
    {
      id: "jury-waiver",
      category: "Disputes",
      severity: "high",
      name: "Jury-trial waiver",
      patterns: [/waiv\w{0,4}[^.]{0,100}jury/i, /jury[^.]{0,40}waiv/i],
      why: "You may give up the right to a jury trial.",
      look: "Confirm whether it applies to all claims or only some."
    },
    {
      id: "unilateral-modification",
      category: "Changes",
      severity: "high",
      name: "Provider can change the terms one-sidedly",
      patterns: [/reserve[s]? the right to (modify|change|amend|update|revise)/i, /(modify|change|amend|update|revise)[^.]{0,80}(at any time|sole discretion|without (prior )?notice)/i, /(at any time|from time to time)[^.]{0,80}(modify|change|amend|update|revise)/i, /continued use[^.]{0,100}(accept|agree|consent)/i],
      why: "The deal can change after you agree, sometimes with continued use counting as consent.",
      look: "Check whether you get advance notice and a way to reject changes."
    },
    {
      id: "auto-renewal",
      category: "Billing",
      severity: "medium",
      name: "Automatic renewal",
      patterns: [/auto(matically)?[\s-]?renew/i, /renewal term/i, /unless you cancel[^.]{0,80}(renew|before)/i],
      why: "A subscription may renew and charge you unless you cancel in time.",
      look: "Find the cancel deadline, how to cancel, and whether renewal prices can rise."
    },
    {
      id: "non-refundable",
      category: "Billing",
      severity: "medium",
      name: "Non-refundable payments",
      patterns: [/non[\s-]?refundable/i, /no refunds?/i, /fees[^.]{0,60}not refundable/i],
      why: "Money already paid may not come back even if you leave early.",
      look: "Check for exceptions (trial periods, statutory rights)."
    },
    {
      id: "liability-cap",
      category: "Liability",
      severity: "high",
      name: "Limitation of liability",
      patterns: [/limitation of liability/i, /liabilit\w+[^.]{0,120}(limited to|not exceed|maximum aggregate|cap)/i, /in no event[^.]{0,100}liabl/i, /shall not be liable/i],
      why: "The provider caps what it would ever owe you, sometimes to a small amount.",
      look: "Find the cap amount and which harms are excluded entirely."
    },
    {
      id: "consequential-damages",
      category: "Liability",
      severity: "medium",
      name: "Exclusion of indirect / consequential damages",
      patterns: [/consequential|incidental|indirect[^.]{0,60}damages|lost profits|loss of data/i],
      why: "Whole categories of harm (lost profits, lost data) may be excluded from any claim.",
      look: "See whether the exclusion is mutual and what law says about it in your jurisdiction."
    },
    {
      id: "indemnification",
      category: "Liability",
      severity: "high",
      name: "You indemnify the provider",
      reversals: [/\b(we|us|our|the company|the provider|provider|licensor)\b[^.;]{0,60}\b(indemnif|hold you harmless|defend you)/i],
      patterns: [/indemnif/i, /hold harmless/i, /defend[^.]{0,60}(against|from)[^.]{0,60}claim/i],
      why: "You may have to pay the provider's legal costs if someone sues it over something you did.",
      look: "Check whether the duty is mutual and whether it is capped."
    },
    {
      id: "termination-at-will",
      category: "Account",
      severity: "medium",
      reversals: [/\byou (may|can|shall have the right to) (terminate|cancel)\b/i, /\byour? (right|option) to (terminate|cancel)\b/i],
      name: "Termination or suspension at the provider's discretion",
      patterns: [/(terminate|suspend)[^.]{0,100}(at any time|sole discretion|without (prior )?(notice|cause)|for any reason)/i, /(at any time|sole discretion)[^.]{0,100}(terminate|suspend)/i],
      why: "Your access can end without warning or a stated reason.",
      look: "Check whether you can export your data before or after termination."
    },
    {
      id: "governing-law",
      category: "Disputes",
      severity: "review",
      name: "Governing law / venue",
      patterns: [/governing law|governed by the laws/i, /exclusive (jurisdiction|venue)/i, /courts? (of|in|located in)/i],
      why: "Disputes may be decided under a far-away jurisdiction's law and courts.",
      look: "Note the named state/country and whether consumer-protection law still applies to you."
    },
    {
      id: "content-license",
      category: "Your content",
      severity: "high",
      reversals: [/\b(we|the provider|provider)\s+(grant|give|license)\s+you\b/i],
      name: "Broad license over your content",
      patterns: [/(grant|give)[^.]{0,120}(license|right)[^.]{0,120}(your )?(content|materials|works?)/i, /(perpetual|irrevocable|royalty[\s-]?free|sublicens\w+|worldwide)[^.]{0,120}(license|right)/i, /license[^.]{0,120}(perpetual|irrevocable|sublicens)/i],
      why: "You may give the provider wide, sometimes permanent, rights to things you upload or create.",
      look: "Check whether the license survives account deletion and whether it allows sublicensing."
    },
    {
      id: "ip-assignment",
      category: "Your content",
      severity: "high",
      name: "IP assignment / work-for-hire",
      patterns: [/assign\w{0,4}[^.]{0,120}(intellectual property|all right|invention)/i, /work[\s-]?for[\s-]?hire/i, /invention[^.]{0,80}(assign|belong)/i],
      why: "Ownership of things you make may transfer to the other party.",
      look: "Critical in employment and freelance terms; check the scope and any carve-outs."
    },
    {
      id: "data-sharing",
      category: "Privacy",
      severity: "medium",
      name: "Sharing or selling personal data",
      patterns: [/(sell|sale of|rent|share|disclose)[^.]{0,80}(personal )?(data|information)/i, /(personal )?(data|information)[^.]{0,80}(sold|shared|disclosed)[^.]{0,80}third/i, /third[\s-]?parties[^.]{0,80}(personal )?(data|information)/i],
      why: "Your personal information may go to third parties, sometimes for money.",
      look: "Look for an opt-out (e.g. 'do not sell') and which law grants it."
    },
    {
      id: "warranty-disclaimer",
      category: "Liability",
      severity: "review",
      name: "Warranty disclaimer (as-is)",
      patterns: [/as is|as available|with all faults/i, /disclaim\w{0,4}[^.]{0,100}warrant/i, /no warranty|without warranty/i],
      why: "The service or product comes with no promised quality or fitness.",
      look: "Some jurisdictions limit how much can be disclaimed for consumers."
    },
    {
      id: "non-compete",
      category: "Restrictions",
      severity: "high",
      name: "Non-compete / exclusivity",
      patterns: [/non[\s-]?compet/i, /exclusiv\w+[^.]{0,80}(services?|work|engagement)/i, /shall not[^.]{0,80}compete/i],
      why: "Limits what other work or business you can do, sometimes after the relationship ends.",
      look: "Check duration, geography, and scope; enforceability varies widely."
    },
    {
      id: "auto-renewal-price",
      category: "Billing",
      severity: "review",
      name: "Price changes",
      patterns: [/(fees?|prices?|charges?)[^.]{0,100}(change|increase|adjust)/i, /(change|increase|adjust)[^.]{0,60}(fees?|prices?)/i],
      why: "What you pay can go up, sometimes with only posted notice.",
      look: "Check the notice period and whether you can cancel before a rise applies."
    },
    {
      id: "data-retention",
      category: "Privacy",
      severity: "review",
      name: "Data retention after deletion",
      patterns: [/retain[^.]{0,100}(data|information|copies)/i, /(data|information)[^.]{0,60}retained/i, /backup[^.]{0,60}(retain|remain|copies)/i],
      why: "Your information may persist after you delete your account.",
      look: "Check how long backups keep data and what law says in your jurisdiction."
    }
  ];
});
