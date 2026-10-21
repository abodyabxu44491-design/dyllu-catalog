// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Fallbacks for older browsers (iOS 14, Chrome < 88). Each fallback sits inside
// "@supports not (...)", so browsers that understand the modern property ignore it.
//   aspect-ratio          -> padding-top box via ::before/::after
//   inset                 -> top/right/bottom/left
//   inset-inline-*        -> left/right for both [dir=rtl] and [dir=ltr]
//   svh/dvh/lvh units     -> vh declared first
const LOGICAL = {
  "inset-inline-start": { rtl: ["right"], ltr: ["left"] },
  "inset-inline-end": { rtl: ["left"], ltr: ["right"] },
  "inset-inline": { rtl: ["left", "right"], ltr: ["left", "right"] },
};
const inKeyframes = (node) => {
  for (let p = node.parent; p; p = p.parent) if (p.type === "atrule" && /keyframes$/i.test(p.name)) return true;
  return false;
};
module.exports = () => ({
  postcssPlugin: "dyllu-legacy",
  OnceExit(root, { AtRule, Rule, Declaration: Decl }) {
    const jobs = [];
    root.walkRules((rule) => {
      if (inKeyframes(rule)) return;
      const inset = [],
        logical = [],
        aspect = [];
      rule.each((d) => {
        if (d.type !== "decl") return;
        if (/\b\d*\.?\d+(s|d|l)vh\b/.test(d.value) && !/^--/.test(d.prop)) {
          const prev = d.prev();
          const vh = d.value.replace(/(\d*\.?\d+)(s|d|l)vh\b/g, "$1vh");
          if (!(prev && prev.type === "decl" && prev.prop === d.prop && prev.value === vh)) d.cloneBefore({ value: vh });
        }
        if (d.prop === "inset" && !/\s/.test(d.value.trim())) inset.push(d.value);
        if (LOGICAL[d.prop]) logical.push([d.prop, d.value, d.important]);
        if (d.prop === "aspect-ratio") {
          const m = d.value.match(/^\s*([\d.]+)\s*(?:\/\s*([\d.]+))?\s*$/);
          if (m) aspect.push((Number(m[2] ?? 1) / Number(m[1])) * 100);
        }
      });
      if (inset.length || logical.length || aspect.length) jobs.push({ rule, inset, logical, aspect });
    });
    for (const { rule, inset, logical, aspect } of jobs) {
      const out = [];
      if (inset.length) {
        const s = new AtRule({ name: "supports", params: "not (inset: 0)" }),
          r = new Rule({ selectors: rule.selectors });
        for (const p of ["top", "right", "bottom", "left"]) r.append(new Decl({ prop: p, value: inset[inset.length - 1] }));
        s.append(r);
        out.push(s);
      }
      if (logical.length) {
        const s = new AtRule({ name: "supports", params: "not (inset-inline-start: 0)" });
        for (const dir of ["ltr", "rtl"]) {
          const r = new Rule({ selectors: rule.selectors.map((sel) => `[dir=${dir}] ${sel}`) });
          for (const [prop, value, important] of logical)
            for (const phys of LOGICAL[prop][dir]) r.append(new Decl({ prop: phys, value, important }));
          s.append(r);
        }
        out.push(s);
      }
      if (aspect.length) {
        const s = new AtRule({ name: "supports", params: "not (aspect-ratio: 1 / 1)" });
        const before = new Rule({ selectors: rule.selectors.map((sel) => `${sel}::before`) });
        before.append(
          new Decl({ prop: "content", value: '""' }),
          new Decl({ prop: "float", value: "left" }),
          new Decl({ prop: "padding-top", value: `${+aspect[aspect.length - 1].toFixed(4)}%` }),
        );
        const after = new Rule({ selectors: rule.selectors.map((sel) => `${sel}::after`) });
        after.append(
          new Decl({ prop: "content", value: '""' }),
          new Decl({ prop: "display", value: "block" }),
          new Decl({ prop: "clear", value: "both" }),
        );
        s.append(before, after);
        out.push(s);
      }
      let at = rule;
      for (const n of out) {
        at.after(n);
        at = n;
      }
    }
  },
});
module.exports.postcss = true;
