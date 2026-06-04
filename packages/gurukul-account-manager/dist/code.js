var app = (function (S) {
  "use strict";
  const G = () => {
      try {
        const { sendAs: e = [] } = Gmail.Users.Settings.SendAs.list("me");
        if (e.length) return e.map((t) => t.sendAsEmail);
      } catch (e) {
        Logger.log(e.message);
      }
      return [Session.getActiveUser().getEmail()];
    },
    I = "%[a-f0-9]{2}",
    R = new RegExp("(" + I + ")|([^%]+?)", "gi"),
    C = new RegExp("(" + I + ")+", "gi");
  function O(e, t) {
    try {
      return [decodeURIComponent(e.join(""))];
    } catch {}
    if (e.length === 1) return e;
    t = t || 1;
    const r = e.slice(0, t),
      n = e.slice(t);
    return Array.prototype.concat.call([], O(r), O(n));
  }
  function _(e) {
    try {
      return decodeURIComponent(e);
    } catch {
      let t = e.match(R) || [];
      for (let r = 1; r < t.length; r++)
        ((e = O(t, r).join("")), (t = e.match(R) || []));
      return e;
    }
  }
  function q(e) {
    const t = { "%FE%FF": "��", "%FF%FE": "��" };
    let r = C.exec(e);
    for (; r; ) {
      try {
        t[r[0]] = decodeURIComponent(r[0]);
      } catch {
        const s = _(r[0]);
        s !== r[0] && (t[r[0]] = s);
      }
      r = C.exec(e);
    }
    t["%C2"] = "�";
    const n = Object.keys(t);
    for (const s of n) e = e.replace(new RegExp(s, "g"), t[s]);
    return e;
  }
  function H(e) {
    if (typeof e != "string")
      throw new TypeError(
        "Expected `encodedURI` to be of type `string`, got `" + typeof e + "`",
      );
    try {
      return decodeURIComponent(e);
    } catch {
      return q(e);
    }
  }
  function Q(e, t) {
    const r = {};
    if (Array.isArray(t))
      for (const n of t) {
        const s = Object.getOwnPropertyDescriptor(e, n);
        s?.enumerable && Object.defineProperty(r, n, s);
      }
    else
      for (const n of Reflect.ownKeys(e)) {
        const s = Object.getOwnPropertyDescriptor(e, n);
        if (s.enumerable) {
          const o = e[n];
          t(n, o, e) && Object.defineProperty(r, n, s);
        }
      }
    return r;
  }
  function j(e, t) {
    if (!(typeof e == "string" && typeof t == "string"))
      throw new TypeError("Expected the arguments to be of type `string`");
    if (e === "" || t === "") return [];
    const r = e.indexOf(t);
    return r === -1 ? [] : [e.slice(0, r), e.slice(r + t.length)];
  }
  const J = (e) => e == null,
    z = (e) =>
      encodeURIComponent(e).replaceAll(
        /[!'()*]/g,
        (t) => `%${t.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    w = Symbol("encodeFragmentIdentifier");
  function K(e) {
    switch (e.arrayFormat) {
      case "index":
        return (t) => (r, n) => {
          const s = r.length;
          return n === void 0 ||
            (e.skipNull && n === null) ||
            (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push([h(t, e), "[", s, "]"].join("")), r)
              : (r.push([h(t, e), "[", h(s, e), "]=", h(n, e)].join("")), r);
        };
      case "bracket":
        return (t) => (r, n) =>
          n === void 0 ||
          (e.skipNull && n === null) ||
          (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push([h(t, e), "[]"].join("")), r)
              : (r.push([h(t, e), "[]=", h(n, e)].join("")), r);
      case "colon-list-separator":
        return (t) => (r, n) =>
          n === void 0 ||
          (e.skipNull && n === null) ||
          (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push([h(t, e), ":list="].join("")), r)
              : (r.push([h(t, e), ":list=", h(n, e)].join("")), r);
      case "comma":
      case "separator":
      case "bracket-separator": {
        const t = e.arrayFormat === "bracket-separator" ? "[]=" : "=";
        return (r) => (n, s) =>
          s === void 0 ||
          (e.skipNull && s === null) ||
          (e.skipEmptyString && s === "")
            ? n
            : ((s = s === null ? "" : s),
              n.length === 0
                ? (n.push([h(r, e), t, h(s, e)].join("")), n)
                : (n.push(h(s, e)), n));
      }
      default:
        return (t) => (r, n) =>
          n === void 0 ||
          (e.skipNull && n === null) ||
          (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push(h(t, e)), r)
              : (r.push([h(t, e), "=", h(n, e)].join("")), r);
    }
  }
  function X(e) {
    let t;
    switch (e.arrayFormat) {
      case "index":
        return (r, n, s) => {
          if (((t = /\[(\d*)]$/.exec(r)), (r = r.replace(/\[\d*]$/, "")), !t)) {
            s[r] = n;
            return;
          }
          (s[r] === void 0 && (s[r] = {}), (s[r][t[1]] = n));
        };
      case "bracket":
        return (r, n, s) => {
          if (((t = /(\[])$/.exec(r)), (r = r.replace(/\[]$/, "")), !t)) {
            s[r] = n;
            return;
          }
          if (s[r] === void 0) {
            s[r] = [n];
            return;
          }
          if (!Array.isArray(s[r])) {
            s[r] = [s[r], n];
            return;
          }
          s[r].push(n);
        };
      case "colon-list-separator":
        return (r, n, s) => {
          if (((t = /(:list)$/.exec(r)), (r = r.replace(/:list$/, "")), !t)) {
            s[r] = n;
            return;
          }
          if (s[r] === void 0) {
            s[r] = [n];
            return;
          }
          if (!Array.isArray(s[r])) {
            s[r] = [s[r], n];
            return;
          }
          s[r].push(n);
        };
      case "comma":
      case "separator":
        return (r, n, s) => {
          const a =
            typeof n == "string" && n.includes(e.arrayFormatSeparator)
              ? n.split(e.arrayFormatSeparator).map((i) => A(i, e))
              : n === null
                ? n
                : A(n, e);
          s[r] = a;
        };
      case "bracket-separator":
        return (r, n, s) => {
          const o = /(\[])$/.test(r);
          if (((r = r.replace(/\[]$/, "")), !o)) {
            s[r] = n && A(n, e);
            return;
          }
          const a = n === null ? [] : A(n, e).split(e.arrayFormatSeparator);
          if (s[r] === void 0) {
            s[r] = a;
            return;
          }
          Array.isArray(s[r]) || (s[r] = [s[r]]);
          for (const i of a) s[r].push(i);
        };
      default:
        return (r, n, s) => {
          if (s[r] === void 0) {
            s[r] = n;
            return;
          }
          if (Array.isArray(s[r])) {
            s[r].push(n);
            return;
          }
          s[r] = [s[r], n];
        };
    }
  }
  function E(e) {
    if (typeof e != "string" || e.length !== 1)
      throw new TypeError(
        "arrayFormatSeparator must be single character string",
      );
  }
  function h(e, t) {
    return t.encode ? (t.strict ? z(e) : encodeURIComponent(e)) : e;
  }
  function A(e, t) {
    return t.decode ? H(e) : e;
  }
  function T(e) {
    return Array.isArray(e)
      ? e.sort()
      : typeof e == "object"
        ? T(Object.keys(e))
            .sort((t, r) => Number(t) - Number(r))
            .map((t) => e[t])
        : e;
  }
  function U(e) {
    const t = e.indexOf("#");
    return (t !== -1 && (e = e.slice(0, t)), e);
  }
  function Z(e) {
    let t = "";
    const r = e.indexOf("#");
    return (r !== -1 && (t = e.slice(r)), t);
  }
  function $(e) {
    const t = e.indexOf("?");
    return t === -1 ? e : e.slice(0, t);
  }
  function L(e, t, r) {
    return r === "string" && typeof e == "string"
      ? e
      : typeof r == "function" && typeof e == "string"
        ? r(e)
        : r === "boolean" && e === null
          ? !0
          : r === "boolean" &&
              e !== null &&
              (e.toLowerCase() === "true" || e.toLowerCase() === "false")
            ? e.toLowerCase() === "true"
            : r === "boolean" &&
                e !== null &&
                (e.toLowerCase() === "1" || e.toLowerCase() === "0")
              ? e.toLowerCase() === "1"
              : r === "string[]" &&
                  t.arrayFormat !== "none" &&
                  typeof e == "string"
                ? [e]
                : r === "number[]" &&
                    t.arrayFormat !== "none" &&
                    !Number.isNaN(Number(e)) &&
                    typeof e == "string" &&
                    e.trim() !== ""
                  ? [Number(e)]
                  : r === "number" &&
                      !Number.isNaN(Number(e)) &&
                      typeof e == "string" &&
                      e.trim() !== ""
                    ? Number(e)
                    : t.parseBooleans &&
                        e !== null &&
                        (e.toLowerCase() === "true" ||
                          e.toLowerCase() === "false")
                      ? e.toLowerCase() === "true"
                      : t.parseNumbers &&
                          !Number.isNaN(Number(e)) &&
                          typeof e == "string" &&
                          e.trim() !== ""
                        ? Number(e)
                        : e;
  }
  function P(e) {
    e = U(e);
    const t = e.indexOf("?");
    return t === -1 ? "" : e.slice(t + 1);
  }
  function x(e, t) {
    ((t = {
      decode: !0,
      sort: !0,
      arrayFormat: "none",
      arrayFormatSeparator: ",",
      parseNumbers: !1,
      parseBooleans: !1,
      types: Object.create(null),
      ...t,
    }),
      E(t.arrayFormatSeparator));
    const r = X(t),
      n = Object.create(null);
    if (typeof e != "string" || ((e = e.trim().replace(/^[?#&]/, "")), !e))
      return n;
    let s = 0;
    for (let o = 0; o <= e.length; o++) {
      if (o < e.length && e[o] !== "&") continue;
      if (o === s) {
        s = o + 1;
        continue;
      }
      const a = e.slice(s, o);
      s = o + 1;
      const i = t.decode ? a.replaceAll("+", " ") : a;
      let [m, f] = j(i, "=");
      (m === void 0 && (m = i),
        (f =
          f === void 0
            ? null
            : ["comma", "separator", "bracket-separator"].includes(
                  t.arrayFormat,
                )
              ? f
              : A(f, t)),
        r(A(m, t), f, n));
    }
    for (const [o, a] of Object.entries(n))
      if (typeof a == "object" && a !== null && t.types[o] !== "string")
        for (const [i, m] of Object.entries(a)) {
          const f = t.types[o],
            u = typeof f == "function" ? f : f ? f.replace("[]", "") : void 0;
          a[i] = L(m, t, u);
        }
      else
        typeof a == "object" && a !== null && t.types[o] === "string"
          ? (n[o] = Object.values(a).join(t.arrayFormatSeparator))
          : (n[o] = L(a, t, t.types[o]));
    return t.sort === !1
      ? n
      : (t.sort === !0
          ? Object.keys(n).sort()
          : Object.keys(n).sort(t.sort)
        ).reduce((o, a) => {
          const i = n[a];
          return (
            (o[a] = i && typeof i == "object" && !Array.isArray(i) ? T(i) : i),
            o
          );
        }, Object.create(null));
  }
  function M(e, t) {
    if (!e) return "";
    ((t = {
      encode: !0,
      strict: !0,
      arrayFormat: "none",
      arrayFormatSeparator: ",",
      ...t,
    }),
      E(t.arrayFormatSeparator));
    const r = (a) =>
        (t.skipNull && J(e[a])) || (t.skipEmptyString && e[a] === ""),
      n = K(t),
      s = {};
    for (const [a, i] of Object.entries(e)) r(a) || (s[a] = i);
    const o = Object.keys(s);
    return (
      t.sort !== !1 && o.sort(t.sort),
      o
        .map((a) => {
          let i = e[a];
          if (
            (t.replacer && ((i = t.replacer(a, i)), i === void 0)) ||
            i === void 0
          )
            return "";
          if (i === null) return h(a, t);
          if (Array.isArray(i)) {
            if (i.length === 0 && t.arrayFormat === "bracket-separator")
              return h(a, t) + "[]";
            let m = i;
            t.replacer &&
              (m = i
                .map((d, g) => t.replacer(`${a}[${g}]`, d))
                .filter((d) => d !== void 0));
            const f = m.reduce(n(a), []),
              u = ["comma", "separator", "bracket-separator"].includes(
                t.arrayFormat,
              )
                ? t.arrayFormatSeparator
                : "&";
            return f.join(u);
          }
          return h(a, t) + "=" + h(i, t);
        })
        .filter((a) => a.length > 0)
        .join("&")
    );
  }
  function V(e, t) {
    t = { decode: !0, ...t };
    let [r, n] = j(e, "#");
    return (
      r === void 0 && (r = e),
      {
        url: $(r ?? ""),
        query: x(P(e), t),
        ...(t && t.parseFragmentIdentifier && n
          ? { fragmentIdentifier: A(n, t) }
          : {}),
      }
    );
  }
  function B(e, t) {
    t = { encode: !0, strict: !0, [w]: !0, ...t };
    const r = $(U(e.url)) || "",
      n = P(e.url),
      s = { ...x(n, { sort: !1, ...t }), ...e.query };
    let o = M(s, t);
    o && (o = `?${o}`);
    let a = Z(e.url);
    if (typeof e.fragmentIdentifier == "string") {
      const i = new URL(r);
      ((i.hash = e.fragmentIdentifier),
        (a = t[w] ? i.hash : `#${e.fragmentIdentifier}`));
    }
    return `${r}${o}${a}`;
  }
  function D(e, t, r) {
    r = { parseFragmentIdentifier: !0, [w]: !1, ...r };
    const { url: n, query: s, fragmentIdentifier: o } = V(e, r);
    return B({ url: n, query: Q(s, t), fragmentIdentifier: o }, r);
  }
  function W(e, t, r) {
    if (Array.isArray(t)) {
      const n = new Set(t);
      return D(e, (s) => !n.has(s), r);
    }
    return D(e, (n, s) => !t(n, s), r);
  }
  const Y = Object.freeze(
      Object.defineProperty(
        {
          __proto__: null,
          exclude: W,
          extract: P,
          parse: x,
          parseUrl: V,
          pick: D,
          stringify: M,
          stringifyUrl: B,
        },
        Symbol.toStringTag,
        { value: "Module" },
      ),
    ),
    k = () => {
      const e = "https://example.com",
        t = {
          name: "amit",
          location: "india",
          interests: ["workspace", "apps script"],
        },
        r = Y.stringify(t, { sort: !1, arrayFormat: "bracket" }),
        n = `${e}?${r}`;
      Logger.log(`URL: ${n}`);
    },
    v = () =>
      HtmlService.createHtmlOutputFromFile("index.html")
        .setTitle("Google Apps Script")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  function ee() {
    const t = SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName("Vouchers")
        .getDataRange()
        .getValues(),
      r = t[0],
      n = t.slice(1),
      o = n
        .slice(-15)
        .reverse()
        .map((a, i) => {
          const m = {};
          return (
            r.forEach((f, u) => {
              m[f] = a[u] !== void 0 && a[u] !== null ? a[u] : "";
            }),
            (m.ID = n.length - i),
            m
          );
        });
    return JSON.stringify(o);
  }
  function te(e) {
    const t = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Vouchers"),
      r = new Date().getTime();
    return (
      t.appendRow([
        r,
        e.date,
        e.type,
        e.amount,
        e.description,
        e.ledger,
        e.department,
        e.personname,
        e.txnId || "",
      ]),
      { success: !0, id: r }
    );
  }
  function re(e) {
    const t = "FoodPass",
      r = SpreadsheetApp.getActiveSpreadsheet();
    let n = r.getSheetByName(t);
    return (
      n ||
        ((n = r.insertSheet(t)),
        n.appendRow([
          "Date",
          "Time",
          "Type",
          "Quantity",
          "TotalAmount",
          "TxnID",
        ])),
      n.appendRow([
        e.date,
        e.time,
        e.foodPassTime,
        e.quantity,
        e.totalAmount,
        e.tempId || "",
      ]),
      { success: !0, lastRow: n.getLastRow() }
    );
  }
  function ne(e) {
    const n = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Donations");
    if (!n) return null;
    const s = n.getDataRange().getValues(),
      o = s[0],
      a = o.indexOf("Phone"),
      i = o.indexOf("Name"),
      m = o.indexOf("Ledger"),
      f = o.indexOf("Note");
    if (a === -1) return null;
    for (let u = s.length - 1; u > 0; u--)
      if (String(s[u][a]).includes(e))
        return {
          name: s[u][i] || "",
          ledger: s[u][m] || "",
          purpose: (f !== -1 && s[u][f]) || "",
        };
    return null;
  }
  function se(e) {
    const t = "Donations",
      r = SpreadsheetApp.getActiveSpreadsheet();
    let n = r.getSheetByName(t);
    n ||
      ((n = r.insertSheet(t)),
      n.appendRow([
        "Date",
        "Name",
        "Ledger",
        "Note",
        "Phone",
        "Amount",
        "SMS_Status",
        "TxnID",
      ]));
    const s = PropertiesService.getScriptProperties().getProperty("username"),
      o = PropertiesService.getScriptProperties().getProperty("password"),
      a =
        PropertiesService.getScriptProperties().getProperty("extraSmsPhone") ||
        PropertiesService.getScriptProperties().getProperty("swamiji_phone");
    let i = "N/A";
    if (s && o) {
      const m = {
          Authorization: "Basic " + Utilities.base64Encode(s + ":" + o),
        },
        f = [`+91${e.phone}`];
      a && f.push(`+91${a}`);
      const u = {
        message: `જય સ્વામિનારાયણ ${e.name}, આપ શ્રી ના તરફથી આજે ${e.date} તારીખે રૂપિયા ${e.amount} નો સહયોગ પ્રાપ્ત થયેલ છે. 
શ્રી સ્વામિનારાયણ ગુરુકુળ અમદાવાદ - નિકોલ`,
        phoneNumbers: f,
      };
      try {
        i = UrlFetchApp.fetch("https://api.sms-gate.app/3rdparty/v1/message", {
          method: "POST",
          contentType: "application/json",
          headers: m,
          payload: JSON.stringify(u),
          muteHttpExceptions: !0,
        }).getResponseCode();
      } catch (d) {
        i = "Error: " + d.message;
      }
    }
    return (
      n.appendRow([
        e.date,
        e.name,
        e.ledger,
        e.purpose || e.note || "",
        e.phone,
        e.amount,
        i,
        e.tempId || "",
      ]),
      { success: !0, lastRow: n.getLastRow() }
    );
  }
  function ae(e) {
    const t = "GatePass",
      r = SpreadsheetApp.getActiveSpreadsheet();
    let n = r.getSheetByName(t);
    return (
      n ||
        ((n = r.insertSheet(t)),
        n.appendRow([
          "Date",
          "Name",
          "Department",
          "Purpose",
          "OutTime",
          "EstimatedInTime",
          "TimeIn",
          "TxnID",
        ])),
      n.appendRow([
        e.today || new Date(),
        e.name,
        e.dept,
        e.purpose,
        e.outTime,
        e.inTime || "",
        "",
        e.tempId || "",
      ]),
      { success: !0, lastRow: n.getLastRow() }
    );
  }
  function oe(e) {
    try {
      const t = SpreadsheetApp.getActiveSpreadsheet(),
        r = t.getSpreadsheetTimeZone(),
        n = e || Utilities.formatDate(new Date(), r, "dd/MM/yyyy"),
        s = {
          date: n,
          foodPass: {
            lunch: 0,
            dinner: 0,
            lunchAmount: 0,
            dinnerAmount: 0,
            totalAmount: 0,
            totalQuantity: 0,
          },
          gatePass: { count: 0, entries: [] },
          donations: { count: 0, totalAmount: 0, entries: [] },
        },
        o = (d) =>
          d
            ? (d instanceof Date
                ? Utilities.formatDate(d, r, "dd/MM/yyyy")
                : String(d)
              ).includes(n)
            : !1,
        a = (d) => {
          if (!d) return "-";
          if (d instanceof Date)
            return Utilities.formatDate(d, r, "hh:mm a").toUpperCase();
          const g = String(d);
          if (g.match(/\d{1,2}:\d{2}/)) {
            const l = g.split(":");
            let c = parseInt(l[0]);
            const p = l[1].substring(0, 2),
              y = c >= 12 ? "PM" : "AM";
            return ((c = c % 12 || 12), c + ":" + p + " " + y);
          }
          return g.toUpperCase();
        },
        i = (d, g = 1e3) => {
          const l = t.getSheetByName(d);
          if (!l) return { headers: [], rows: [] };
          const c = l.getLastRow();
          if (c < 1) return { headers: [], rows: [] };
          const p = l.getLastColumn(),
            y = l.getRange(1, 1, Math.min(c, g + 1), p).getValues(),
            F = y[0].map((b) => String(b).trim().toLowerCase());
          let N = y.slice(1);
          return (
            c > g && (N = l.getRange(c - g + 1, 1, g, p).getValues()),
            { headers: F, rows: N }
          );
        },
        m = i("FoodPass");
      if (m.headers.length > 0) {
        const d = m.headers.indexOf("quantity"),
          g = m.headers.indexOf("totalamount");
        m.rows.forEach((l) => {
          if (o(l[0])) {
            const c = parseInt(l[d]) || 0,
              p = parseFloat(l[g]) || 0;
            let y = "dinner";
            const F = l.join(" ").toLowerCase();
            if (F.includes("lunch")) y = "lunch";
            else if (F.includes("dinner")) y = "dinner";
            else {
              const N = l
                .map((b) => String(b))
                .find((b) => b.match(/\d{1,2}:\d{2}/));
              N && (y = parseInt(N.split(":")[0]) < 17 ? "lunch" : "dinner");
            }
            (y === "lunch"
              ? ((s.foodPass.lunch += c), (s.foodPass.lunchAmount += p))
              : ((s.foodPass.dinner += c), (s.foodPass.dinnerAmount += p)),
              (s.foodPass.totalQuantity += c),
              (s.foodPass.totalAmount += p));
          }
        });
      }
      const f = i("GatePass", 500);
      if (f.headers.length > 0) {
        const d = f.headers.indexOf("name"),
          g = f.headers.indexOf("department"),
          l = f.headers.indexOf("outtime");
        f.rows.forEach((c) => {
          o(c[0]) &&
            (s.gatePass.count++,
            s.gatePass.entries.push({
              name: String(c[d] || "Unknown"),
              dept: String(c[g] || "-"),
              outTime: a(c[l]),
            }));
        });
      }
      const u = i("Donations", 500);
      if (u.headers.length > 0) {
        const d = u.headers.indexOf("name"),
          g = u.headers.indexOf("note");
        let l = u.headers.indexOf("amount");
        (l === -1 &&
          (l = u.headers.findIndex(
            (c) => c.includes("amt") || c.includes("rs"),
          )),
          u.rows.forEach((c) => {
            if (o(c[0])) {
              let p = 0;
              if (l !== -1)
                p = parseFloat(String(c[l]).replace(/[^\d.]/g, "")) || 0;
              else {
                const y = c.filter(
                  (F) => typeof F == "number" && F > 10 && F !== 202,
                );
                p = y.length > 0 ? y[y.length - 1] : 0;
              }
              (s.donations.count++,
                (s.donations.totalAmount += p),
                s.donations.entries.push({
                  name: String(c[d] || "Donor"),
                  purpose: String(c[g] || "-"),
                  amount: p,
                }));
            }
          }));
      }
      return JSON.stringify(s);
    } catch (t) {
      return JSON.stringify({ error: t.toString() });
    }
  }
  return (
    (S.addDonation = se),
    (S.addFoodPass = re),
    (S.addGatePass = ae),
    (S.addVoucher = te),
    (S.doGet = v),
    (S.getDailyReport = oe),
    (S.getDonorDetails = ne),
    (S.getGmailAliases = G),
    (S.getVouchers = ee),
    (S.makeQueryString = k),
    Object.defineProperty(S, Symbol.toStringTag, { value: "Module" }),
    S
  );
})({});

function addDonation() {
  return app.addDonation.apply(this, arguments);
}
function addFoodPass() {
  return app.addFoodPass.apply(this, arguments);
}
function addGatePass() {
  return app.addGatePass.apply(this, arguments);
}
function addVoucher() {
  return app.addVoucher.apply(this, arguments);
}
function doGet() {
  return app.doGet.apply(this, arguments);
}
function getDailyReport() {
  return app.getDailyReport.apply(this, arguments);
}
function getDonorDetails() {
  return app.getDonorDetails.apply(this, arguments);
}
function getGmailAliases() {
  return app.getGmailAliases.apply(this, arguments);
}
function getVouchers() {
  return app.getVouchers.apply(this, arguments);
}
function makeQueryString() {
  return app.makeQueryString.apply(this, arguments);
}
