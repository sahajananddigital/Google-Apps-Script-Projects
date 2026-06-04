var app = (function (m) {
  "use strict";
  const L = () => {
      try {
        const { sendAs: r = [] } = Gmail.Users.Settings.SendAs.list("me");
        if (r.length) return r.map((e) => e.sendAsEmail);
      } catch (r) {
        Logger.log(r.message);
      }
      return [Session.getActiveUser().getEmail()];
    },
    b = "%[a-f0-9]{2}",
    A = new RegExp("(" + b + ")|([^%]+?)", "gi"),
    O = new RegExp("(" + b + ")+", "gi");
  function l(r, e) {
    try {
      return [decodeURIComponent(r.join(""))];
    } catch {}
    if (r.length === 1) return r;
    e = e || 1;
    const t = r.slice(0, e),
      n = r.slice(e);
    return Array.prototype.concat.call([], l(t), l(n));
  }
  function R(r) {
    try {
      return decodeURIComponent(r);
    } catch {
      let e = r.match(A) || [];
      for (let t = 1; t < e.length; t++)
        ((r = l(e, t).join("")), (e = r.match(A) || []));
      return r;
    }
  }
  function D(r) {
    const e = { "%FE%FF": "��", "%FF%FE": "��" };
    let t = O.exec(r);
    for (; t; ) {
      try {
        e[t[0]] = decodeURIComponent(t[0]);
      } catch {
        const a = R(t[0]);
        a !== t[0] && (e[t[0]] = a);
      }
      t = O.exec(r);
    }
    e["%C2"] = "�";
    const n = Object.keys(e);
    for (const a of n) r = r.replace(new RegExp(a, "g"), e[a]);
    return r;
  }
  function T(r) {
    if (typeof r != "string")
      throw new TypeError(
        "Expected `encodedURI` to be of type `string`, got `" + typeof r + "`",
      );
    try {
      return decodeURIComponent(r);
    } catch {
      return D(r);
    }
  }
  function M(r, e) {
    const t = {};
    if (Array.isArray(e))
      for (const n of e) {
        const a = Object.getOwnPropertyDescriptor(r, n);
        a != null && a.enumerable && Object.defineProperty(t, n, a);
      }
    else
      for (const n of Reflect.ownKeys(r)) {
        const a = Object.getOwnPropertyDescriptor(r, n);
        if (a.enumerable) {
          const f = r[n];
          e(n, f, r) && Object.defineProperty(t, n, a);
        }
      }
    return t;
  }
  function w(r, e) {
    if (!(typeof r == "string" && typeof e == "string"))
      throw new TypeError("Expected the arguments to be of type `string`");
    if (r === "" || e === "") return [];
    const t = r.indexOf(e);
    return t === -1 ? [] : [r.slice(0, t), r.slice(t + e.length)];
  }
  const P = (r) => r == null,
    G = (r) =>
      encodeURIComponent(r).replaceAll(
        /[!'()*]/g,
        (e) => `%${e.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    g = Symbol("encodeFragmentIdentifier");
  function _(r) {
    switch (r.arrayFormat) {
      case "index":
        return (e) => (t, n) => {
          const a = t.length;
          return n === void 0 ||
            (r.skipNull && n === null) ||
            (r.skipEmptyString && n === "")
            ? t
            : n === null
              ? (t.push([c(e, r), "[", a, "]"].join("")), t)
              : (t.push([c(e, r), "[", c(a, r), "]=", c(n, r)].join("")), t);
        };
      case "bracket":
        return (e) => (t, n) =>
          n === void 0 ||
          (r.skipNull && n === null) ||
          (r.skipEmptyString && n === "")
            ? t
            : n === null
              ? (t.push([c(e, r), "[]"].join("")), t)
              : (t.push([c(e, r), "[]=", c(n, r)].join("")), t);
      case "colon-list-separator":
        return (e) => (t, n) =>
          n === void 0 ||
          (r.skipNull && n === null) ||
          (r.skipEmptyString && n === "")
            ? t
            : n === null
              ? (t.push([c(e, r), ":list="].join("")), t)
              : (t.push([c(e, r), ":list=", c(n, r)].join("")), t);
      case "comma":
      case "separator":
      case "bracket-separator": {
        const e = r.arrayFormat === "bracket-separator" ? "[]=" : "=";
        return (t) => (n, a) =>
          a === void 0 ||
          (r.skipNull && a === null) ||
          (r.skipEmptyString && a === "")
            ? n
            : ((a = a === null ? "" : a),
              n.length === 0
                ? (n.push([c(t, r), e, c(a, r)].join("")), n)
                : (n.push(c(a, r)), n));
      }
      default:
        return (e) => (t, n) =>
          n === void 0 ||
          (r.skipNull && n === null) ||
          (r.skipEmptyString && n === "")
            ? t
            : n === null
              ? (t.push(c(e, r)), t)
              : (t.push([c(e, r), "=", c(n, r)].join("")), t);
    }
  }
  function H(r) {
    let e;
    switch (r.arrayFormat) {
      case "index":
        return (t, n, a) => {
          if (((e = /\[(\d*)]$/.exec(t)), (t = t.replace(/\[\d*]$/, "")), !e)) {
            a[t] = n;
            return;
          }
          (a[t] === void 0 && (a[t] = {}), (a[t][e[1]] = n));
        };
      case "bracket":
        return (t, n, a) => {
          if (((e = /(\[])$/.exec(t)), (t = t.replace(/\[]$/, "")), !e)) {
            a[t] = n;
            return;
          }
          if (a[t] === void 0) {
            a[t] = [n];
            return;
          }
          if (!Array.isArray(a[t])) {
            a[t] = [a[t], n];
            return;
          }
          a[t].push(n);
        };
      case "colon-list-separator":
        return (t, n, a) => {
          if (((e = /(:list)$/.exec(t)), (t = t.replace(/:list$/, "")), !e)) {
            a[t] = n;
            return;
          }
          if (a[t] === void 0) {
            a[t] = [n];
            return;
          }
          if (!Array.isArray(a[t])) {
            a[t] = [a[t], n];
            return;
          }
          a[t].push(n);
        };
      case "comma":
      case "separator":
        return (t, n, a) => {
          const i =
            typeof n == "string" && n.includes(r.arrayFormatSeparator)
              ? n.split(r.arrayFormatSeparator).map((s) => u(s, r))
              : n === null
                ? n
                : u(n, r);
          a[t] = i;
        };
      case "bracket-separator":
        return (t, n, a) => {
          const f = /(\[])$/.test(t);
          if (((t = t.replace(/\[]$/, "")), !f)) {
            a[t] = n && u(n, r);
            return;
          }
          const i = n === null ? [] : u(n, r).split(r.arrayFormatSeparator);
          if (a[t] === void 0) {
            a[t] = i;
            return;
          }
          Array.isArray(a[t]) || (a[t] = [a[t]]);
          for (const s of i) a[t].push(s);
        };
      default:
        return (t, n, a) => {
          if (a[t] === void 0) {
            a[t] = n;
            return;
          }
          if (Array.isArray(a[t])) {
            a[t].push(n);
            return;
          }
          a[t] = [a[t], n];
        };
    }
  }
  function N(r) {
    if (typeof r != "string" || r.length !== 1)
      throw new TypeError(
        "arrayFormatSeparator must be single character string",
      );
  }
  function c(r, e) {
    return e.encode ? (e.strict ? G(r) : encodeURIComponent(r)) : r;
  }
  function u(r, e) {
    return e.decode ? T(r) : r;
  }
  function j(r) {
    return Array.isArray(r)
      ? r.sort()
      : typeof r == "object"
        ? j(Object.keys(r))
            .sort((e, t) => Number(e) - Number(t))
            .map((e) => r[e])
        : r;
  }
  function C(r) {
    const e = r.indexOf("#");
    return (e !== -1 && (r = r.slice(0, e)), r);
  }
  function V(r) {
    let e = "";
    const t = r.indexOf("#");
    return (t !== -1 && (e = r.slice(t)), e);
  }
  function E(r) {
    const e = r.indexOf("?");
    return e === -1 ? r : r.slice(0, e);
  }
  function x(r, e, t) {
    return t === "string" && typeof r == "string"
      ? r
      : typeof t == "function" && typeof r == "string"
        ? t(r)
        : t === "boolean" && r === null
          ? !0
          : t === "boolean" &&
              r !== null &&
              (r.toLowerCase() === "true" || r.toLowerCase() === "false")
            ? r.toLowerCase() === "true"
            : t === "boolean" &&
                r !== null &&
                (r.toLowerCase() === "1" || r.toLowerCase() === "0")
              ? r.toLowerCase() === "1"
              : t === "string[]" &&
                  e.arrayFormat !== "none" &&
                  typeof r == "string"
                ? [r]
                : t === "number[]" &&
                    e.arrayFormat !== "none" &&
                    !Number.isNaN(Number(r)) &&
                    typeof r == "string" &&
                    r.trim() !== ""
                  ? [Number(r)]
                  : t === "number" &&
                      !Number.isNaN(Number(r)) &&
                      typeof r == "string" &&
                      r.trim() !== ""
                    ? Number(r)
                    : e.parseBooleans &&
                        r !== null &&
                        (r.toLowerCase() === "true" ||
                          r.toLowerCase() === "false")
                      ? r.toLowerCase() === "true"
                      : e.parseNumbers &&
                          !Number.isNaN(Number(r)) &&
                          typeof r == "string" &&
                          r.trim() !== ""
                        ? Number(r)
                        : r;
  }
  function h(r) {
    r = C(r);
    const e = r.indexOf("?");
    return e === -1 ? "" : r.slice(e + 1);
  }
  function y(r, e) {
    ((e = {
      decode: !0,
      sort: !0,
      arrayFormat: "none",
      arrayFormatSeparator: ",",
      parseNumbers: !1,
      parseBooleans: !1,
      types: Object.create(null),
      ...e,
    }),
      N(e.arrayFormatSeparator));
    const t = H(e),
      n = Object.create(null);
    if (typeof r != "string" || ((r = r.trim().replace(/^[?#&]/, "")), !r))
      return n;
    let a = 0;
    for (let f = 0; f <= r.length; f++) {
      if (f < r.length && r[f] !== "&") continue;
      if (f === a) {
        a = f + 1;
        continue;
      }
      const i = r.slice(a, f);
      a = f + 1;
      const s = e.decode ? i.replaceAll("+", " ") : i;
      let [d, o] = w(s, "=");
      (d === void 0 && (d = s),
        (o =
          o === void 0
            ? null
            : ["comma", "separator", "bracket-separator"].includes(
                  e.arrayFormat,
                )
              ? o
              : u(o, e)),
        t(u(d, e), o, n));
    }
    for (const [f, i] of Object.entries(n))
      if (typeof i == "object" && i !== null && e.types[f] !== "string")
        for (const [s, d] of Object.entries(i)) {
          const o = e.types[f],
            p = typeof o == "function" ? o : o ? o.replace("[]", "") : void 0;
          i[s] = x(d, e, p);
        }
      else
        typeof i == "object" && i !== null && e.types[f] === "string"
          ? (n[f] = Object.values(i).join(e.arrayFormatSeparator))
          : (n[f] = x(i, e, e.types[f]));
    return e.sort === !1
      ? n
      : (e.sort === !0
          ? Object.keys(n).sort()
          : Object.keys(n).sort(e.sort)
        ).reduce((f, i) => {
          const s = n[i];
          return (
            (f[i] = s && typeof s == "object" && !Array.isArray(s) ? j(s) : s),
            f
          );
        }, Object.create(null));
  }
  function $(r, e) {
    if (!r) return "";
    ((e = {
      encode: !0,
      strict: !0,
      arrayFormat: "none",
      arrayFormatSeparator: ",",
      ...e,
    }),
      N(e.arrayFormatSeparator));
    const t = (i) =>
        (e.skipNull && P(r[i])) || (e.skipEmptyString && r[i] === ""),
      n = _(e),
      a = {};
    for (const [i, s] of Object.entries(r)) t(i) || (a[i] = s);
    const f = Object.keys(a);
    return (
      e.sort !== !1 && f.sort(e.sort),
      f
        .map((i) => {
          let s = r[i];
          if (
            (e.replacer && ((s = e.replacer(i, s)), s === void 0)) ||
            s === void 0
          )
            return "";
          if (s === null) return c(i, e);
          if (Array.isArray(s)) {
            if (s.length === 0 && e.arrayFormat === "bracket-separator")
              return c(i, e) + "[]";
            let d = s;
            e.replacer &&
              (d = s
                .map((S, X) => e.replacer(`${i}[${X}]`, S))
                .filter((S) => S !== void 0));
            const o = d.reduce(n(i), []),
              p = ["comma", "separator", "bracket-separator"].includes(
                e.arrayFormat,
              )
                ? e.arrayFormatSeparator
                : "&";
            return o.join(p);
          }
          return c(i, e) + "=" + c(s, e);
        })
        .filter((i) => i.length > 0)
        .join("&")
    );
  }
  function U(r, e) {
    e = { decode: !0, ...e };
    let [t, n] = w(r, "#");
    return (
      t === void 0 && (t = r),
      {
        url: E(t ?? ""),
        query: y(h(r), e),
        ...(e && e.parseFragmentIdentifier && n
          ? { fragmentIdentifier: u(n, e) }
          : {}),
      }
    );
  }
  function I(r, e) {
    e = { encode: !0, strict: !0, [g]: !0, ...e };
    const t = E(C(r.url)) || "",
      n = h(r.url),
      a = { ...y(n, { sort: !1, ...e }), ...r.query };
    let f = $(a, e);
    f && (f = `?${f}`);
    let i = V(r.url);
    if (typeof r.fragmentIdentifier == "string") {
      const s = new URL(t);
      ((s.hash = r.fragmentIdentifier),
        (i = e[g] ? s.hash : `#${r.fragmentIdentifier}`));
    }
    return `${t}${f}${i}`;
  }
  function F(r, e, t) {
    t = { parseFragmentIdentifier: !0, [g]: !1, ...t };
    const { url: n, query: a, fragmentIdentifier: f } = U(r, t);
    return I({ url: n, query: M(a, e), fragmentIdentifier: f }, t);
  }
  function q(r, e, t) {
    if (Array.isArray(e)) {
      const n = new Set(e);
      return F(r, (a) => !n.has(a), t);
    }
    return F(r, (n, a) => !e(n, a), t);
  }
  const B = Object.freeze(
      Object.defineProperty(
        {
          __proto__: null,
          exclude: q,
          extract: h,
          parse: y,
          parseUrl: U,
          pick: F,
          stringify: $,
          stringifyUrl: I,
        },
        Symbol.toStringTag,
        { value: "Module" },
      ),
    ),
    Q = () => {
      const r = "https://example.com",
        e = {
          name: "amit",
          location: "india",
          interests: ["workspace", "apps script"],
        },
        t = B.stringify(e, { sort: !1, arrayFormat: "bracket" }),
        n = `${r}?${t}`;
      Logger.log(`URL: ${n}`);
    },
    J = () =>
      HtmlService.createHtmlOutputFromFile("index.html")
        .setTitle("Google Apps Script")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  function K(r) {
    const e = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet(),
      t = JSON.parse(r.postData.contents);
    e.appendRow([new Date(), t.name || "", t.date || "", t.chintamani || ""]);
    var n = {
      ok: !0,
      message: "Thank You... Your Message has been recorded..",
    };
    return ContentService.createTextOutput(JSON.stringify(n));
  }
  return (
    (m.doGet = J),
    (m.doPost = K),
    (m.getGmailAliases = L),
    (m.makeQueryString = Q),
    Object.defineProperty(m, Symbol.toStringTag, { value: "Module" }),
    m
  );
})({});

const doGet = (...args) => app.doGet(...args);
const doPost = (...args) => app.doPost(...args);
const getGmailAliases = (...args) => app.getGmailAliases(...args);
const makeQueryString = (...args) => app.makeQueryString(...args);
