var app = (function (p) {
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
    x = "%[a-f0-9]{2}",
    R = new RegExp("(" + x + ")|([^%]+?)", "gi"),
    C = new RegExp("(" + x + ")+", "gi");
  function P(e, t) {
    try {
      return [decodeURIComponent(e.join(""))];
    } catch {}
    if (e.length === 1) return e;
    t = t || 1;
    const r = e.slice(0, t),
      n = e.slice(t);
    return Array.prototype.concat.call([], P(r), P(n));
  }
  function _(e) {
    try {
      return decodeURIComponent(e);
    } catch {
      let t = e.match(R) || [];
      for (let r = 1; r < t.length; r++)
        ((e = P(t, r).join("")), (t = e.match(R) || []));
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
          const i = e[n];
          t(n, i, e) && Object.defineProperty(r, n, s);
        }
      }
    return r;
  }
  function E(e, t) {
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
    N = Symbol("encodeFragmentIdentifier");
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
              ? (r.push([g(t, e), "[", s, "]"].join("")), r)
              : (r.push([g(t, e), "[", g(s, e), "]=", g(n, e)].join("")), r);
        };
      case "bracket":
        return (t) => (r, n) =>
          n === void 0 ||
          (e.skipNull && n === null) ||
          (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push([g(t, e), "[]"].join("")), r)
              : (r.push([g(t, e), "[]=", g(n, e)].join("")), r);
      case "colon-list-separator":
        return (t) => (r, n) =>
          n === void 0 ||
          (e.skipNull && n === null) ||
          (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push([g(t, e), ":list="].join("")), r)
              : (r.push([g(t, e), ":list=", g(n, e)].join("")), r);
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
                ? (n.push([g(r, e), t, g(s, e)].join("")), n)
                : (n.push(g(s, e)), n));
      }
      default:
        return (t) => (r, n) =>
          n === void 0 ||
          (e.skipNull && n === null) ||
          (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push(g(t, e)), r)
              : (r.push([g(t, e), "=", g(n, e)].join("")), r);
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
          const o =
            typeof n == "string" && n.includes(e.arrayFormatSeparator)
              ? n.split(e.arrayFormatSeparator).map((a) => A(a, e))
              : n === null
                ? n
                : A(n, e);
          s[r] = o;
        };
      case "bracket-separator":
        return (r, n, s) => {
          const i = /(\[])$/.test(r);
          if (((r = r.replace(/\[]$/, "")), !i)) {
            s[r] = n && A(n, e);
            return;
          }
          const o = n === null ? [] : A(n, e).split(e.arrayFormatSeparator);
          if (s[r] === void 0) {
            s[r] = o;
            return;
          }
          Array.isArray(s[r]) || (s[r] = [s[r]]);
          for (const a of o) s[r].push(a);
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
  function j(e) {
    if (typeof e != "string" || e.length !== 1)
      throw new TypeError(
        "arrayFormatSeparator must be single character string",
      );
  }
  function g(e, t) {
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
  function w(e) {
    e = U(e);
    const t = e.indexOf("?");
    return t === -1 ? "" : e.slice(t + 1);
  }
  function I(e, t) {
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
      j(t.arrayFormatSeparator));
    const r = X(t),
      n = Object.create(null);
    if (typeof e != "string" || ((e = e.trim().replace(/^[?#&]/, "")), !e))
      return n;
    let s = 0;
    for (let i = 0; i <= e.length; i++) {
      if (i < e.length && e[i] !== "&") continue;
      if (i === s) {
        s = i + 1;
        continue;
      }
      const o = e.slice(s, i);
      s = i + 1;
      const a = t.decode ? o.replaceAll("+", " ") : o;
      let [m, f] = E(a, "=");
      (m === void 0 && (m = a),
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
    for (const [i, o] of Object.entries(n))
      if (typeof o == "object" && o !== null && t.types[i] !== "string")
        for (const [a, m] of Object.entries(o)) {
          const f = t.types[i],
            u = typeof f == "function" ? f : f ? f.replace("[]", "") : void 0;
          o[a] = L(m, t, u);
        }
      else
        typeof o == "object" && o !== null && t.types[i] === "string"
          ? (n[i] = Object.values(o).join(t.arrayFormatSeparator))
          : (n[i] = L(o, t, t.types[i]));
    return t.sort === !1
      ? n
      : (t.sort === !0
          ? Object.keys(n).sort()
          : Object.keys(n).sort(t.sort)
        ).reduce((i, o) => {
          const a = n[o];
          return (
            (i[o] = a && typeof a == "object" && !Array.isArray(a) ? T(a) : a),
            i
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
      j(t.arrayFormatSeparator));
    const r = (o) =>
        (t.skipNull && J(e[o])) || (t.skipEmptyString && e[o] === ""),
      n = K(t),
      s = {};
    for (const [o, a] of Object.entries(e)) r(o) || (s[o] = a);
    const i = Object.keys(s);
    return (
      t.sort !== !1 && i.sort(t.sort),
      i
        .map((o) => {
          let a = e[o];
          if (
            (t.replacer && ((a = t.replacer(o, a)), a === void 0)) ||
            a === void 0
          )
            return "";
          if (a === null) return g(o, t);
          if (Array.isArray(a)) {
            if (a.length === 0 && t.arrayFormat === "bracket-separator")
              return g(o, t) + "[]";
            let m = a;
            t.replacer &&
              (m = a
                .map((d, h) => t.replacer(`${o}[${h}]`, d))
                .filter((d) => d !== void 0));
            const f = m.reduce(n(o), []),
              u = ["comma", "separator", "bracket-separator"].includes(
                t.arrayFormat,
              )
                ? t.arrayFormatSeparator
                : "&";
            return f.join(u);
          }
          return g(o, t) + "=" + g(a, t);
        })
        .filter((o) => o.length > 0)
        .join("&")
    );
  }
  function V(e, t) {
    t = { decode: !0, ...t };
    let [r, n] = E(e, "#");
    return (
      r === void 0 && (r = e),
      {
        url: $(r ?? ""),
        query: I(w(e), t),
        ...(t && t.parseFragmentIdentifier && n
          ? { fragmentIdentifier: A(n, t) }
          : {}),
      }
    );
  }
  function B(e, t) {
    t = { encode: !0, strict: !0, [N]: !0, ...t };
    const r = $(U(e.url)) || "",
      n = w(e.url),
      s = { ...I(n, { sort: !1, ...t }), ...e.query };
    let i = M(s, t);
    i && (i = `?${i}`);
    let o = Z(e.url);
    if (typeof e.fragmentIdentifier == "string") {
      const a = new URL(r);
      ((a.hash = e.fragmentIdentifier),
        (o = t[N] ? a.hash : `#${e.fragmentIdentifier}`));
    }
    return `${r}${i}${o}`;
  }
  function D(e, t, r) {
    r = { parseFragmentIdentifier: !0, [N]: !1, ...r };
    const { url: n, query: s, fragmentIdentifier: i } = V(e, r);
    return B({ url: n, query: Q(s, t), fragmentIdentifier: i }, r);
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
          extract: w,
          parse: I,
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
      i = n
        .slice(-15)
        .reverse()
        .map((o, a) => {
          const m = {};
          return (
            r.forEach((f, u) => {
              m[f] = o[u] !== void 0 && o[u] !== null ? o[u] : "";
            }),
            (m.ID = n.length - a),
            m
          );
        });
    return JSON.stringify(i);
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
  function ne() {
    const e =
      PropertiesService.getScriptProperties().getProperty("FOOD_PASS_PRICE");
    return e ? parseInt(e, 10) : 100;
  }
  function se(e) {
    const n = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Donations");
    if (!n) return null;
    const s = n.getDataRange().getValues(),
      i = s[0],
      o = i.indexOf("Phone"),
      a = i.indexOf("Name"),
      m = i.indexOf("Ledger"),
      f = i.indexOf("Note");
    if (o === -1) return null;
    for (let u = s.length - 1; u > 0; u--)
      if (String(s[u][o]).includes(e))
        return {
          name: s[u][a] || "",
          ledger: s[u][m] || "",
          purpose: (f !== -1 && s[u][f]) || "",
        };
    return null;
  }
  function oe(e) {
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
      i = PropertiesService.getScriptProperties().getProperty("password"),
      o =
        PropertiesService.getScriptProperties().getProperty("extraSmsPhone") ||
        PropertiesService.getScriptProperties().getProperty("swamiji_phone");
    let a = "N/A";
    if (s && i) {
      const m = {
          Authorization: "Basic " + Utilities.base64Encode(s + ":" + i),
        },
        f = [`+91${e.phone}`];
      o && f.push(`+91${o}`);
      const u = {
        message: `જય સ્વામિનારાયણ ${e.name}, આપ શ્રી ના તરફથી આજે ${e.date} તારીખે રૂપિયા ${e.amount} નો સહયોગ પ્રાપ્ત થયેલ છે. 
શ્રી સ્વામિનારાયણ ગુરુકુળ અમદાવાદ - નિકોલ`,
        phoneNumbers: f,
      };
      try {
        a = UrlFetchApp.fetch("https://api.sms-gate.app/3rdparty/v1/message", {
          method: "POST",
          contentType: "application/json",
          headers: m,
          payload: JSON.stringify(u),
          muteHttpExceptions: !0,
        }).getResponseCode();
      } catch (d) {
        a = "Error: " + d.message;
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
        a,
        e.tempId || "",
      ]),
      { success: !0, lastRow: n.getLastRow() }
    );
  }
  function ie(e) {
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
  function ae(e) {
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
        i = (d) =>
          d
            ? (d instanceof Date
                ? Utilities.formatDate(d, r, "dd/MM/yyyy")
                : String(d)
              ).includes(n)
            : !1,
        o = (d) => {
          if (!d) return "-";
          if (d instanceof Date)
            return Utilities.formatDate(d, r, "hh:mm a").toUpperCase();
          const h = String(d);
          if (h.match(/\d{1,2}:\d{2}/)) {
            const l = h.split(":");
            let c = parseInt(l[0]);
            const y = l[1].substring(0, 2),
              S = c >= 12 ? "PM" : "AM";
            return ((c = c % 12 || 12), c + ":" + y + " " + S);
          }
          return h.toUpperCase();
        },
        a = (d, h = 1e3) => {
          const l = t.getSheetByName(d);
          if (!l) return { headers: [], rows: [] };
          const c = l.getLastRow();
          if (c < 1) return { headers: [], rows: [] };
          const y = l.getLastColumn(),
            S = l.getRange(1, 1, Math.min(c, h + 1), y).getValues(),
            F = S[0].map((b) => String(b).trim().toLowerCase());
          let O = S.slice(1);
          return (
            c > h && (O = l.getRange(c - h + 1, 1, h, y).getValues()),
            { headers: F, rows: O }
          );
        },
        m = a("FoodPass");
      if (m.headers.length > 0) {
        const d = m.headers.indexOf("quantity"),
          h = m.headers.indexOf("totalamount");
        m.rows.forEach((l) => {
          if (i(l[0])) {
            const c = parseInt(l[d]) || 0,
              y = parseFloat(l[h]) || 0;
            let S = "dinner";
            const F = l.join(" ").toLowerCase();
            if (F.includes("lunch")) S = "lunch";
            else if (F.includes("dinner")) S = "dinner";
            else {
              const O = l
                .map((b) => String(b))
                .find((b) => b.match(/\d{1,2}:\d{2}/));
              O && (S = parseInt(O.split(":")[0]) < 17 ? "lunch" : "dinner");
            }
            (S === "lunch"
              ? ((s.foodPass.lunch += c), (s.foodPass.lunchAmount += y))
              : ((s.foodPass.dinner += c), (s.foodPass.dinnerAmount += y)),
              (s.foodPass.totalQuantity += c),
              (s.foodPass.totalAmount += y));
          }
        });
      }
      const f = a("GatePass", 500);
      if (f.headers.length > 0) {
        const d = f.headers.indexOf("name"),
          h = f.headers.indexOf("department"),
          l = f.headers.indexOf("outtime");
        f.rows.forEach((c) => {
          i(c[0]) &&
            (s.gatePass.count++,
            s.gatePass.entries.push({
              name: String(c[d] || "Unknown"),
              dept: String(c[h] || "-"),
              outTime: o(c[l]),
            }));
        });
      }
      const u = a("Donations", 500);
      if (u.headers.length > 0) {
        const d = u.headers.indexOf("name"),
          h = u.headers.indexOf("note");
        let l = u.headers.indexOf("amount");
        (l === -1 &&
          (l = u.headers.findIndex(
            (c) => c.includes("amt") || c.includes("rs"),
          )),
          u.rows.forEach((c) => {
            if (i(c[0])) {
              let y = 0;
              if (l !== -1)
                y = parseFloat(String(c[l]).replace(/[^\d.]/g, "")) || 0;
              else {
                const S = c.filter(
                  (F) => typeof F == "number" && F > 10 && F !== 202,
                );
                y = S.length > 0 ? S[S.length - 1] : 0;
              }
              (s.donations.count++,
                (s.donations.totalAmount += y),
                s.donations.entries.push({
                  name: String(c[d] || "Donor"),
                  purpose: String(c[h] || "-"),
                  amount: y,
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
    (p.addDonation = oe),
    (p.addFoodPass = re),
    (p.addGatePass = ie),
    (p.addVoucher = te),
    (p.doGet = v),
    (p.getDailyReport = ae),
    (p.getDonorDetails = se),
    (p.getFoodPassPrice = ne),
    (p.getGmailAliases = G),
    (p.getVouchers = ee),
    (p.makeQueryString = k),
    Object.defineProperty(p, Symbol.toStringTag, { value: "Module" }),
    p
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
function getFoodPassPrice() {
  return app.getFoodPassPrice.apply(this, arguments);
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
