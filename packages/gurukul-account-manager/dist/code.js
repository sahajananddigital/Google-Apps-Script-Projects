var app = (function (l) {
  "use strict";
  const _ = () => {
      try {
        const { sendAs: e = [] } = Gmail.Users.Settings.SendAs.list("me");
        if (e.length) return e.map((t) => t.sendAsEmail);
      } catch (e) {
        Logger.log(e.message);
      }
      return [Session.getActiveUser().getEmail()];
    },
    D = "%[a-f0-9]{2}",
    R = new RegExp("(" + D + ")|([^%]+?)", "gi"),
    C = new RegExp("(" + D + ")+", "gi");
  function N(e, t) {
    try {
      return [decodeURIComponent(e.join(""))];
    } catch {}
    if (e.length === 1) return e;
    t = t || 1;
    const r = e.slice(0, t),
      n = e.slice(t);
    return Array.prototype.concat.call([], N(r), N(n));
  }
  function G(e) {
    try {
      return decodeURIComponent(e);
    } catch {
      let t = e.match(R) || [];
      for (let r = 1; r < t.length; r++)
        ((e = N(t, r).join("")), (t = e.match(R) || []));
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
        const s = G(r[0]);
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
    W = (e) =>
      encodeURIComponent(e).replaceAll(
        /[!'()*]/g,
        (t) => `%${t.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    b = Symbol("encodeFragmentIdentifier");
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
  function z(e) {
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
  function p(e, t) {
    return t.encode ? (t.strict ? W(e) : encodeURIComponent(e)) : e;
  }
  function A(e, t) {
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
  function T(e) {
    const t = e.indexOf("#");
    return (t !== -1 && (e = e.slice(0, t)), e);
  }
  function X(e) {
    let t = "";
    const r = e.indexOf("#");
    return (r !== -1 && (t = e.slice(r)), t);
  }
  function U(e) {
    const t = e.indexOf("?");
    return t === -1 ? e : e.slice(0, t);
  }
  function $(e, t, r) {
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
  function x(e) {
    e = T(e);
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
    const r = z(t),
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
      let [f, u] = E(a, "=");
      (f === void 0 && (f = a),
        (u =
          u === void 0
            ? null
            : ["comma", "separator", "bracket-separator"].includes(
                  t.arrayFormat,
                )
              ? u
              : A(u, t)),
        r(A(f, t), u, n));
    }
    for (const [i, o] of Object.entries(n))
      if (typeof o == "object" && o !== null && t.types[i] !== "string")
        for (const [a, f] of Object.entries(o)) {
          const u = t.types[i],
            c = typeof u == "function" ? u : u ? u.replace("[]", "") : void 0;
          o[a] = $(f, t, c);
        }
      else
        typeof o == "object" && o !== null && t.types[i] === "string"
          ? (n[i] = Object.values(o).join(t.arrayFormatSeparator))
          : (n[i] = $(o, t, t.types[i]));
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
  function V(e, t) {
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
          if (a === null) return p(o, t);
          if (Array.isArray(a)) {
            if (a.length === 0 && t.arrayFormat === "bracket-separator")
              return p(o, t) + "[]";
            let f = a;
            t.replacer &&
              (f = a
                .map((g, h) => t.replacer(`${o}[${h}]`, g))
                .filter((g) => g !== void 0));
            const u = f.reduce(n(o), []),
              c = ["comma", "separator", "bracket-separator"].includes(
                t.arrayFormat,
              )
                ? t.arrayFormatSeparator
                : "&";
            return u.join(c);
          }
          return p(o, t) + "=" + p(a, t);
        })
        .filter((o) => o.length > 0)
        .join("&")
    );
  }
  function M(e, t) {
    t = { decode: !0, ...t };
    let [r, n] = E(e, "#");
    return (
      r === void 0 && (r = e),
      {
        url: U(r ?? ""),
        query: w(x(e), t),
        ...(t && t.parseFragmentIdentifier && n
          ? { fragmentIdentifier: A(n, t) }
          : {}),
      }
    );
  }
  function B(e, t) {
    t = { encode: !0, strict: !0, [b]: !0, ...t };
    const r = U(T(e.url)) || "",
      n = x(e.url),
      s = { ...w(n, { sort: !1, ...t }), ...e.query };
    let i = V(s, t);
    i && (i = `?${i}`);
    let o = X(e.url);
    if (typeof e.fragmentIdentifier == "string") {
      const a = new URL(r);
      ((a.hash = e.fragmentIdentifier),
        (o = t[b] ? a.hash : `#${e.fragmentIdentifier}`));
    }
    return `${r}${i}${o}`;
  }
  function I(e, t, r) {
    r = { parseFragmentIdentifier: !0, [b]: !1, ...r };
    const { url: n, query: s, fragmentIdentifier: i } = M(e, r);
    return B({ url: n, query: Q(s, t), fragmentIdentifier: i }, r);
  }
  function Z(e, t, r) {
    if (Array.isArray(t)) {
      const n = new Set(t);
      return I(e, (s) => !n.has(s), r);
    }
    return I(e, (n, s) => !t(n, s), r);
  }
  const Y = Object.freeze(
      Object.defineProperty(
        {
          __proto__: null,
          exclude: Z,
          extract: x,
          parse: w,
          parseUrl: M,
          pick: I,
          stringify: V,
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
          const f = {};
          return (
            r.forEach((u, c) => {
              f[u] = o[c] !== void 0 && o[c] !== null ? o[c] : "";
            }),
            (f.ID = n.length - a),
            f
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
  function re(e, t) {
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
  function ne(e) {
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
  function se() {
    const e = re("FOOD_PASS_PRICE", 100);
    return parseInt(e, 10);
  }
  function oe(e) {
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
      u = i.indexOf("Purpose");
    if (o === -1) return null;
    for (let c = 1; c < s.length; c++)
      if (String(s[c][o]).trim() === String(e).trim())
        return {
          phone: String(s[c][o]).trim(),
          name: s[c][a] || "",
          ledger: s[c][f] || "",
          purpose: (u !== -1 && s[c][u]) || "",
        };
    return null;
  }
  function ie() {
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
    const u = [];
    for (let c = 1; c < n.length; c++)
      n[c][i] &&
        u.push({
          phone: String(n[c][i]).trim(),
          name: n[c][o] || "",
          ledger: n[c][a] || "",
          purpose: (f !== -1 && n[c][f]) || "",
        });
    return u;
  }
  function ae(e, t, r, n) {
    const s = "Donors",
      i = SpreadsheetApp.getActiveSpreadsheet();
    let o = i.getSheetByName(s);
    o ||
      ((o = i.insertSheet(s)),
      o.appendRow(["Phone", "Name", "Ledger", "Purpose"]),
      o.getRange(1, 1, 1, 4).setFontWeight("bold"));
    const a = o.getDataRange().getValues(),
      f = a[0],
      u = f.indexOf("Phone"),
      c = f.indexOf("Name"),
      g = f.indexOf("Ledger"),
      h = f.indexOf("Purpose");
    let m = -1;
    for (let d = 1; d < a.length; d++)
      if (String(a[d][u]).trim() === String(e).trim()) {
        m = d + 1;
        break;
      }
    m === -1
      ? o.appendRow([String(e).trim(), t, r, n])
      : (c !== -1 && o.getRange(m, c + 1).setValue(t),
        g !== -1 && o.getRange(m, g + 1).setValue(r),
        h !== -1 && o.getRange(m, h + 1).setValue(n));
  }
  function ce(e) {
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
      ae(e.phone, e.name, e.ledger, e.purpose || e.note || ""));
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
        u = [`+91${e.phone}`];
      o && u.push(`+91${o}`);
      const c = {
        message: `જય સ્વામિનારાયણ ${e.name}, આપ શ્રી ના તરફથી આજે ${e.date} તારીખે રૂપિયા ${e.amount} નો સહયોગ પ્રાપ્ત થયેલ છે. 
શ્રી સ્વામિનારાયણ ગુરુકુળ અમદાવાદ - નિકોલ`,
        phoneNumbers: u,
      };
      try {
        a = UrlFetchApp.fetch("https://api.sms-gate.app/3rdparty/v1/message", {
          method: "POST",
          contentType: "application/json",
          headers: f,
          payload: JSON.stringify(c),
          muteHttpExceptions: !0,
        }).getResponseCode();
      } catch (g) {
        a = "Error: " + g.message;
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
  function fe(e) {
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
  function de(e) {
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
        i = (g) =>
          g
            ? (g instanceof Date
                ? Utilities.formatDate(g, r, "dd/MM/yyyy")
                : String(g)
              ).includes(n)
            : !1,
        o = (g) => {
          if (!g) return "-";
          if (g instanceof Date)
            return Utilities.formatDate(g, r, "hh:mm a").toUpperCase();
          const h = String(g);
          if (h.match(/\d{1,2}:\d{2}/)) {
            const m = h.split(":");
            let d = parseInt(m[0]);
            const S = m[1].substring(0, 2),
              y = d >= 12 ? "PM" : "AM";
            return ((d = d % 12 || 12), d + ":" + S + " " + y);
          }
          return h.toUpperCase();
        },
        a = (g, h = 1e3) => {
          const m = t.getSheetByName(g);
          if (!m) return { headers: [], rows: [] };
          const d = m.getLastRow();
          if (d < 1) return { headers: [], rows: [] };
          const S = m.getLastColumn(),
            y = m.getRange(1, 1, Math.min(d, h + 1), S).getValues(),
            F = y[0].map((O) => String(O).trim().toLowerCase());
          let P = y.slice(1);
          return (
            d > h && (P = m.getRange(d - h + 1, 1, h, S).getValues()),
            { headers: F, rows: P }
          );
        },
        f = a("FoodPass");
      if (f.headers.length > 0) {
        const g = f.headers.indexOf("quantity"),
          h = f.headers.indexOf("totalamount");
        f.rows.forEach((m) => {
          if (i(m[0])) {
            const d = parseInt(m[g]) || 0,
              S = parseFloat(m[h]) || 0;
            let y = "dinner";
            const F = m.join(" ").toLowerCase();
            if (F.includes("lunch")) y = "lunch";
            else if (F.includes("dinner")) y = "dinner";
            else {
              const P = m
                .map((O) => String(O))
                .find((O) => O.match(/\d{1,2}:\d{2}/));
              P && (y = parseInt(P.split(":")[0]) < 17 ? "lunch" : "dinner");
            }
            (y === "lunch"
              ? ((s.foodPass.lunch += d), (s.foodPass.lunchAmount += S))
              : ((s.foodPass.dinner += d), (s.foodPass.dinnerAmount += S)),
              (s.foodPass.totalQuantity += d),
              (s.foodPass.totalAmount += S));
          }
        });
      }
      const u = a("GatePass", 500);
      if (u.headers.length > 0) {
        const g = u.headers.indexOf("name"),
          h = u.headers.indexOf("department"),
          m = u.headers.indexOf("outtime");
        u.rows.forEach((d) => {
          i(d[0]) &&
            (s.gatePass.count++,
            s.gatePass.entries.push({
              name: String(d[g] || "Unknown"),
              dept: String(d[h] || "-"),
              outTime: o(d[m]),
            }));
        });
      }
      const c = a("Donations", 500);
      if (c.headers.length > 0) {
        const g = c.headers.indexOf("name"),
          h = c.headers.indexOf("note");
        let m = c.headers.indexOf("amount");
        (m === -1 &&
          (m = c.headers.findIndex(
            (d) => d.includes("amt") || d.includes("rs"),
          )),
          c.rows.forEach((d) => {
            if (i(d[0])) {
              let S = 0;
              if (m !== -1)
                S = parseFloat(String(d[m]).replace(/[^\d.]/g, "")) || 0;
              else {
                const y = d.filter(
                  (F) => typeof F == "number" && F > 10 && F !== 202,
                );
                S = y.length > 0 ? y[y.length - 1] : 0;
              }
              (s.donations.count++,
                (s.donations.totalAmount += S),
                s.donations.entries.push({
                  name: String(d[g] || "Donor"),
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
    (l.addDonation = ce),
    (l.addFoodPass = ne),
    (l.addGatePass = fe),
    (l.addVoucher = te),
    (l.doGet = v),
    (l.getAllDonors = ie),
    (l.getDailyReport = de),
    (l.getDonorDetails = oe),
    (l.getFoodPassPrice = se),
    (l.getGmailAliases = _),
    (l.getVouchers = ee),
    (l.makeQueryString = k),
    Object.defineProperty(l, Symbol.toStringTag, { value: "Module" }),
    l
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
