var app = (function (F) {
  "use strict";
  const q = () => {
      try {
        const { sendAs: e = [] } = Gmail.Users.Settings.SendAs.list("me");
        if (e.length) return e.map((t) => t.sendAsEmail);
      } catch (e) {
        Logger.log(e.message);
      }
      return [Session.getActiveUser().getEmail()];
    },
    D = "%[a-f0-9]{2}",
    C = new RegExp("(" + D + ")|([^%]+?)", "gi"),
    E = new RegExp("(" + D + ")+", "gi");
  function b(e, t) {
    try {
      return [decodeURIComponent(e.join(""))];
    } catch {}
    if (e.length === 1) return e;
    t = t || 1;
    const r = e.slice(0, t),
      n = e.slice(t);
    return Array.prototype.concat.call([], b(r), b(n));
  }
  function G(e) {
    try {
      return decodeURIComponent(e);
    } catch {
      let t = e.match(C) || [];
      for (let r = 1; r < t.length; r++)
        ((e = b(t, r).join("")), (t = e.match(C) || []));
      return e;
    }
  }
  function Q(e) {
    const t = { "%FE%FF": "��", "%FF%FE": "��" };
    let r = E.exec(e);
    for (; r; ) {
      try {
        t[r[0]] = decodeURIComponent(r[0]);
      } catch {
        const s = G(r[0]);
        s !== r[0] && (t[r[0]] = s);
      }
      r = E.exec(e);
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
      return Q(e);
    }
  }
  function J(e, t) {
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
  function T(e, t) {
    if (!(typeof e == "string" && typeof t == "string"))
      throw new TypeError("Expected the arguments to be of type `string`");
    if (e === "" || t === "") return [];
    const r = e.indexOf(t);
    return r === -1 ? [] : [e.slice(0, r), e.slice(r + t.length)];
  }
  const W = (e) => e == null,
    K = (e) =>
      encodeURIComponent(e).replaceAll(
        /[!'()*]/g,
        (t) => `%${t.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    x = Symbol("encodeFragmentIdentifier");
  function z(e) {
    switch (e.arrayFormat) {
      case "index":
        return (t) => (r, n) => {
          const s = r.length;
          return n === void 0 ||
            (e.skipNull && n === null) ||
            (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push([p(t, e), "[", s, "]"].join("")), r)
              : (r.push([p(t, e), "[", p(s, e), "]=", p(n, e)].join("")), r);
        };
      case "bracket":
        return (t) => (r, n) =>
          n === void 0 ||
          (e.skipNull && n === null) ||
          (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push([p(t, e), "[]"].join("")), r)
              : (r.push([p(t, e), "[]=", p(n, e)].join("")), r);
      case "colon-list-separator":
        return (t) => (r, n) =>
          n === void 0 ||
          (e.skipNull && n === null) ||
          (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push([p(t, e), ":list="].join("")), r)
              : (r.push([p(t, e), ":list=", p(n, e)].join("")), r);
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
                ? (n.push([p(r, e), t, p(s, e)].join("")), n)
                : (n.push(p(s, e)), n));
      }
      default:
        return (t) => (r, n) =>
          n === void 0 ||
          (e.skipNull && n === null) ||
          (e.skipEmptyString && n === "")
            ? r
            : n === null
              ? (r.push(p(t, e)), r)
              : (r.push([p(t, e), "=", p(n, e)].join("")), r);
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
              ? n.split(e.arrayFormatSeparator).map((a) => P(a, e))
              : n === null
                ? n
                : P(n, e);
          s[r] = o;
        };
      case "bracket-separator":
        return (r, n, s) => {
          const i = /(\[])$/.test(r);
          if (((r = r.replace(/\[]$/, "")), !i)) {
            s[r] = n && P(n, e);
            return;
          }
          const o = n === null ? [] : P(n, e).split(e.arrayFormatSeparator);
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
  function p(e, t) {
    return t.encode ? (t.strict ? K(e) : encodeURIComponent(e)) : e;
  }
  function P(e, t) {
    return t.decode ? H(e) : e;
  }
  function L(e) {
    return Array.isArray(e)
      ? e.sort()
      : typeof e == "object"
        ? L(Object.keys(e))
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
  function V(e, t, r) {
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
  function I(e) {
    e = U(e);
    const t = e.indexOf("?");
    return t === -1 ? "" : e.slice(t + 1);
  }
  function w(e, t) {
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
      let [f, g] = T(a, "=");
      (f === void 0 && (f = a),
        (g =
          g === void 0
            ? null
            : ["comma", "separator", "bracket-separator"].includes(
                  t.arrayFormat,
                )
              ? g
              : P(g, t)),
        r(P(f, t), g, n));
    }
    for (const [i, o] of Object.entries(n))
      if (typeof o == "object" && o !== null && t.types[i] !== "string")
        for (const [a, f] of Object.entries(o)) {
          const g = t.types[i],
            c = typeof g == "function" ? g : g ? g.replace("[]", "") : void 0;
          o[a] = V(f, t, c);
        }
      else
        typeof o == "object" && o !== null && t.types[i] === "string"
          ? (n[i] = Object.values(o).join(t.arrayFormatSeparator))
          : (n[i] = V(o, t, t.types[i]));
    return t.sort === !1
      ? n
      : (t.sort === !0
          ? Object.keys(n).sort()
          : Object.keys(n).sort(t.sort)
        ).reduce((i, o) => {
          const a = n[o];
          return (
            (i[o] = a && typeof a == "object" && !Array.isArray(a) ? L(a) : a),
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
        (t.skipNull && W(e[o])) || (t.skipEmptyString && e[o] === ""),
      n = z(t),
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
          if (a === null) return p(o, t);
          if (Array.isArray(a)) {
            if (a.length === 0 && t.arrayFormat === "bracket-separator")
              return p(o, t) + "[]";
            let f = a;
            t.replacer &&
              (f = a
                .map((m, l) => t.replacer(`${o}[${l}]`, m))
                .filter((m) => m !== void 0));
            const g = f.reduce(n(o), []),
              c = ["comma", "separator", "bracket-separator"].includes(
                t.arrayFormat,
              )
                ? t.arrayFormatSeparator
                : "&";
            return g.join(c);
          }
          return p(o, t) + "=" + p(a, t);
        })
        .filter((o) => o.length > 0)
        .join("&")
    );
  }
  function B(e, t) {
    t = { decode: !0, ...t };
    let [r, n] = T(e, "#");
    return (
      r === void 0 && (r = e),
      {
        url: $(r ?? ""),
        query: w(I(e), t),
        ...(t && t.parseFragmentIdentifier && n
          ? { fragmentIdentifier: P(n, t) }
          : {}),
      }
    );
  }
  function _(e, t) {
    t = { encode: !0, strict: !0, [x]: !0, ...t };
    const r = $(U(e.url)) || "",
      n = I(e.url),
      s = { ...w(n, { sort: !1, ...t }), ...e.query };
    let i = M(s, t);
    i && (i = `?${i}`);
    let o = Z(e.url);
    if (typeof e.fragmentIdentifier == "string") {
      const a = new URL(r);
      ((a.hash = e.fragmentIdentifier),
        (o = t[x] ? a.hash : `#${e.fragmentIdentifier}`));
    }
    return `${r}${i}${o}`;
  }
  function R(e, t, r) {
    r = { parseFragmentIdentifier: !0, [x]: !1, ...r };
    const { url: n, query: s, fragmentIdentifier: i } = B(e, r);
    return _({ url: n, query: J(s, t), fragmentIdentifier: i }, r);
  }
  function Y(e, t, r) {
    if (Array.isArray(t)) {
      const n = new Set(t);
      return R(e, (s) => !n.has(s), r);
    }
    return R(e, (n, s) => !t(n, s), r);
  }
  const k = Object.freeze(
      Object.defineProperty(
        {
          __proto__: null,
          exclude: Y,
          extract: I,
          parse: w,
          parseUrl: B,
          pick: R,
          stringify: M,
          stringifyUrl: _,
        },
        Symbol.toStringTag,
        { value: "Module" },
      ),
    ),
    v = () => {
      const e = "https://example.com",
        t = {
          name: "amit",
          location: "india",
          interests: ["workspace", "apps script"],
        },
        r = k.stringify(t, { sort: !1, arrayFormat: "bracket" }),
        n = `${e}?${r}`;
      Logger.log(`URL: ${n}`);
    },
    ee = () =>
      HtmlService.createHtmlOutputFromFile("index.html")
        .setTitle("Google Apps Script")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  function te() {
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
          const f = {};
          return (
            r.forEach((g, c) => {
              f[g] = o[c] !== void 0 && o[c] !== null ? o[c] : "";
            }),
            (f.ID = n.length - a),
            f
          );
        });
    return JSON.stringify(i);
  }
  function re(e) {
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
  function ne(e, t) {
    try {
      const r = "Settings",
        n = SpreadsheetApp.getActiveSpreadsheet();
      let s = n.getSheetByName(r);
      s ||
        ((s = n.insertSheet(r)),
        s.appendRow(["Key", "Value", "Description"]),
        s.getRange(1, 1, 1, 3).setFontWeight("bold"));
      const i = s.getDataRange().getValues();
      for (let a = 1; a < i.length; a++)
        if (i[a][0] && i[a][0].toString().trim() === e) {
          const f = i[a][1];
          return f !== void 0 && f !== "" ? f : t;
        }
      let o = "";
      return (
        e === "FOOD_PASS_PRICE" && (o = "Rate for a single food pass"),
        s.appendRow([e, t.toString(), o]),
        t
      );
    } catch (r) {
      return (console.error("Error reading setting from sheet:", r), t);
    }
  }
  function se(e) {
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
  function oe() {
    const e = ne("FOOD_PASS_PRICE", 100);
    return parseInt(e, 10);
  }
  function ie(e) {
    const t = "FreePass",
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
        e.freePassTime,
        e.quantity,
        0,
        e.tempId || "",
      ]),
      { success: !0, lastRow: n.getLastRow() }
    );
  }
  function ae(e) {
    const t = "Donors",
      r = SpreadsheetApp.getActiveSpreadsheet();
    let n = r.getSheetByName(t);
    if (!n)
      return (
        (n = r.insertSheet(t)),
        n.appendRow(["Phone", "Name", "Ledger", "Purpose"]),
        n.getRange(1, 1, 1, 4).setFontWeight("bold"),
        null
      );
    const s = n.getDataRange().getValues(),
      i = s[0],
      o = i.indexOf("Phone"),
      a = i.indexOf("Name"),
      f = i.indexOf("Ledger"),
      g = i.indexOf("Purpose");
    if (o === -1) return null;
    for (let c = 1; c < s.length; c++)
      if (String(s[c][o]).trim() === String(e).trim())
        return {
          phone: String(s[c][o]).trim(),
          name: s[c][a] || "",
          ledger: s[c][f] || "",
          purpose: (g !== -1 && s[c][g]) || "",
        };
    return null;
  }
  function ce() {
    const e = "Donors",
      t = SpreadsheetApp.getActiveSpreadsheet();
    let r = t.getSheetByName(e);
    if (!r)
      return (
        (r = t.insertSheet(e)),
        r.appendRow(["Phone", "Name", "Ledger", "Purpose"]),
        r.getRange(1, 1, 1, 4).setFontWeight("bold"),
        []
      );
    const n = r.getDataRange().getValues(),
      s = n[0],
      i = s.indexOf("Phone"),
      o = s.indexOf("Name"),
      a = s.indexOf("Ledger"),
      f = s.indexOf("Purpose");
    if (i === -1) return [];
    const g = [];
    for (let c = 1; c < n.length; c++)
      n[c][i] &&
        g.push({
          phone: String(n[c][i]).trim(),
          name: n[c][o] || "",
          ledger: n[c][a] || "",
          purpose: (f !== -1 && n[c][f]) || "",
        });
    return g;
  }
  function fe(e, t, r, n) {
    const s = "Donors",
      i = SpreadsheetApp.getActiveSpreadsheet();
    let o = i.getSheetByName(s);
    o ||
      ((o = i.insertSheet(s)),
      o.appendRow(["Phone", "Name", "Ledger", "Purpose"]),
      o.getRange(1, 1, 1, 4).setFontWeight("bold"));
    const a = o.getDataRange().getValues(),
      f = a[0],
      g = f.indexOf("Phone"),
      c = f.indexOf("Name"),
      m = f.indexOf("Ledger"),
      l = f.indexOf("Purpose");
    let h = -1;
    for (let u = 1; u < a.length; u++)
      if (String(a[u][g]).trim() === String(e).trim()) {
        h = u + 1;
        break;
      }
    h === -1
      ? o.appendRow([String(e).trim(), t, r, n])
      : (c !== -1 && o.getRange(h, c + 1).setValue(t),
        m !== -1 && o.getRange(h, m + 1).setValue(r),
        l !== -1 && o.getRange(h, l + 1).setValue(n));
  }
  function de(e) {
    const t = "Donations",
      r = SpreadsheetApp.getActiveSpreadsheet();
    let n = r.getSheetByName(t);
    (n ||
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
      ])),
      fe(e.phone, e.name, e.ledger, e.purpose || e.note || ""));
    const s = PropertiesService.getScriptProperties().getProperty("username"),
      i = PropertiesService.getScriptProperties().getProperty("password"),
      o =
        PropertiesService.getScriptProperties().getProperty("extraSmsPhone") ||
        PropertiesService.getScriptProperties().getProperty("swamiji_phone");
    let a = "N/A";
    if (s && i) {
      const f = {
          Authorization: "Basic " + Utilities.base64Encode(s + ":" + i),
        },
        g = [`+91${e.phone}`];
      o && g.push(`+91${o}`);
      const c = {
        message: `જય સ્વામિનારાયણ ${e.name}, આપ શ્રી ના તરફથી આજે ${e.date} તારીખે રૂપિયા ${e.amount} નો સહયોગ પ્રાપ્ત થયેલ છે. 
શ્રી સ્વામિનારાયણ ગુરુકુળ અમદાવાદ - નિકોલ`,
        phoneNumbers: g,
      };
      try {
        a = UrlFetchApp.fetch("https://api.sms-gate.app/3rdparty/v1/message", {
          method: "POST",
          contentType: "application/json",
          headers: f,
          payload: JSON.stringify(c),
          muteHttpExceptions: !0,
        }).getResponseCode();
      } catch (m) {
        a = "Error: " + m.message;
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
  function ue(e) {
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
  function ge(e) {
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
          freePass: { lunch: 0, dinner: 0, totalQuantity: 0 },
          gatePass: { count: 0, entries: [] },
          donations: { count: 0, totalAmount: 0, entries: [] },
        },
        i = (l) =>
          l
            ? (l instanceof Date
                ? Utilities.formatDate(l, r, "dd/MM/yyyy")
                : String(l)
              ).includes(n)
            : !1,
        o = (l) => {
          if (!l) return "-";
          if (l instanceof Date)
            return Utilities.formatDate(l, r, "hh:mm a").toUpperCase();
          const h = String(l);
          if (h.match(/\d{1,2}:\d{2}/)) {
            const u = h.split(":");
            let d = parseInt(u[0]);
            const S = u[1].substring(0, 2),
              y = d >= 12 ? "PM" : "AM";
            return ((d = d % 12 || 12), d + ":" + S + " " + y);
          }
          return h.toUpperCase();
        },
        a = (l, h = 1e3) => {
          const u = t.getSheetByName(l);
          if (!u) return { headers: [], rows: [] };
          const d = u.getLastRow();
          if (d < 1) return { headers: [], rows: [] };
          const S = u.getLastColumn(),
            y = u.getRange(1, 1, Math.min(d, h + 1), S).getValues(),
            A = y[0].map((O) => String(O).trim().toLowerCase());
          let N = y.slice(1);
          return (
            d > h && (N = u.getRange(d - h + 1, 1, h, S).getValues()),
            { headers: A, rows: N }
          );
        },
        f = a("FoodPass");
      if (f.headers.length > 0) {
        const l = f.headers.indexOf("quantity"),
          h = f.headers.indexOf("totalamount");
        f.rows.forEach((u) => {
          if (i(u[0])) {
            const d = parseInt(u[l]) || 0,
              S = parseFloat(u[h]) || 0;
            let y = "dinner";
            const A = u.join(" ").toLowerCase();
            if (A.includes("lunch")) y = "lunch";
            else if (A.includes("dinner")) y = "dinner";
            else {
              const N = u
                .map((O) => String(O))
                .find((O) => O.match(/\d{1,2}:\d{2}/));
              N && (y = parseInt(N.split(":")[0]) < 17 ? "lunch" : "dinner");
            }
            (y === "lunch"
              ? ((s.foodPass.lunch += d), (s.foodPass.lunchAmount += S))
              : ((s.foodPass.dinner += d), (s.foodPass.dinnerAmount += S)),
              (s.foodPass.totalQuantity += d),
              (s.foodPass.totalAmount += S));
          }
        });
      }
      const g = a("FreePass");
      if (g.headers.length > 0) {
        const l = g.headers.indexOf("quantity");
        g.rows.forEach((h) => {
          if (i(h[0])) {
            const u = parseInt(h[l]) || 0;
            let d = "dinner";
            const S = h.join(" ").toLowerCase();
            if (S.includes("lunch")) d = "lunch";
            else if (S.includes("dinner")) d = "dinner";
            else {
              const y = h
                .map((A) => String(A))
                .find((A) => A.match(/\d{1,2}:\d{2}/));
              y && (d = parseInt(y.split(":")[0]) < 17 ? "lunch" : "dinner");
            }
            (d === "lunch" ? (s.freePass.lunch += u) : (s.freePass.dinner += u),
              (s.freePass.totalQuantity += u));
          }
        });
      }
      const c = a("GatePass", 500);
      if (c.headers.length > 0) {
        const l = c.headers.indexOf("name"),
          h = c.headers.indexOf("department"),
          u = c.headers.indexOf("outtime");
        c.rows.forEach((d) => {
          i(d[0]) &&
            (s.gatePass.count++,
            s.gatePass.entries.push({
              name: String(d[l] || "Unknown"),
              dept: String(d[h] || "-"),
              outTime: o(d[u]),
            }));
        });
      }
      const m = a("Donations", 500);
      if (m.headers.length > 0) {
        const l = m.headers.indexOf("name"),
          h = m.headers.indexOf("note");
        let u = m.headers.indexOf("amount");
        (u === -1 &&
          (u = m.headers.findIndex(
            (d) => d.includes("amt") || d.includes("rs"),
          )),
          m.rows.forEach((d) => {
            if (i(d[0])) {
              let S = 0;
              if (u !== -1)
                S = parseFloat(String(d[u]).replace(/[^\d.]/g, "")) || 0;
              else {
                const y = d.filter(
                  (A) => typeof A == "number" && A > 10 && A !== 202,
                );
                S = y.length > 0 ? y[y.length - 1] : 0;
              }
              (s.donations.count++,
                (s.donations.totalAmount += S),
                s.donations.entries.push({
                  name: String(d[l] || "Donor"),
                  purpose: String(d[h] || "-"),
                  amount: S,
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
    (F.addDonation = de),
    (F.addFoodPass = se),
    (F.addFreePass = ie),
    (F.addGatePass = ue),
    (F.addVoucher = re),
    (F.doGet = ee),
    (F.getAllDonors = ce),
    (F.getDailyReport = ge),
    (F.getDonorDetails = ae),
    (F.getFoodPassPrice = oe),
    (F.getGmailAliases = q),
    (F.getVouchers = te),
    (F.makeQueryString = v),
    Object.defineProperty(F, Symbol.toStringTag, { value: "Module" }),
    F
  );
})({});

function addDonation() {
  return app.addDonation.apply(this, arguments);
}
function addFoodPass() {
  return app.addFoodPass.apply(this, arguments);
}
function addFreePass() {
  return app.addFreePass.apply(this, arguments);
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
function getAllDonors() {
  return app.getAllDonors.apply(this, arguments);
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
