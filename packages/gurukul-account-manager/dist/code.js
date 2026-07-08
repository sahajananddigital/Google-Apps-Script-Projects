var app = (function (y) {
  "use strict";
  const Q = () => {
      try {
        const { sendAs: e = [] } = Gmail.Users.Settings.SendAs.list("me");
        if (e.length) return e.map((t) => t.sendAsEmail);
      } catch (e) {
        Logger.log(e.message);
      }
      return [Session.getActiveUser().getEmail()];
    },
    T = "%[a-f0-9]{2}",
    C = new RegExp("(" + T + ")|([^%]+?)", "gi"),
    E = new RegExp("(" + T + ")+", "gi");
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
  function H(e) {
    try {
      return decodeURIComponent(e);
    } catch {
      let t = e.match(C) || [];
      for (let r = 1; r < t.length; r++)
        ((e = N(t, r).join("")), (t = e.match(C) || []));
      return e;
    }
  }
  function J(e) {
    const t = { "%FE%FF": "��", "%FF%FE": "��" };
    let r = E.exec(e);
    for (; r; ) {
      try {
        t[r[0]] = decodeURIComponent(r[0]);
      } catch {
        const s = H(r[0]);
        s !== r[0] && (t[r[0]] = s);
      }
      r = E.exec(e);
    }
    t["%C2"] = "�";
    const n = Object.keys(t);
    for (const s of n) e = e.replace(new RegExp(s, "g"), t[s]);
    return e;
  }
  function W(e) {
    if (typeof e != "string")
      throw new TypeError(
        "Expected `encodedURI` to be of type `string`, got `" + typeof e + "`",
      );
    try {
      return decodeURIComponent(e);
    } catch {
      return J(e);
    }
  }
  function K(e, t) {
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
          const a = e[n];
          t(n, a, e) && Object.defineProperty(r, n, s);
        }
      }
    return r;
  }
  function L(e, t) {
    if (!(typeof e == "string" && typeof t == "string"))
      throw new TypeError("Expected the arguments to be of type `string`");
    if (e === "" || t === "") return [];
    const r = e.indexOf(t);
    return r === -1 ? [] : [e.slice(0, r), e.slice(r + t.length)];
  }
  const z = (e) => e == null,
    X = (e) =>
      encodeURIComponent(e).replaceAll(
        /[!'()*]/g,
        (t) => `%${t.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    I = Symbol("encodeFragmentIdentifier");
  function Y(e) {
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
  function Z(e) {
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
              ? n.split(e.arrayFormatSeparator).map((i) => x(i, e))
              : n === null
                ? n
                : x(n, e);
          s[r] = o;
        };
      case "bracket-separator":
        return (r, n, s) => {
          const a = /(\[])$/.test(r);
          if (((r = r.replace(/\[]$/, "")), !a)) {
            s[r] = n && x(n, e);
            return;
          }
          const o = n === null ? [] : x(n, e).split(e.arrayFormatSeparator);
          if (s[r] === void 0) {
            s[r] = o;
            return;
          }
          Array.isArray(s[r]) || (s[r] = [s[r]]);
          for (const i of o) s[r].push(i);
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
  function h(e, t) {
    return t.encode ? (t.strict ? X(e) : encodeURIComponent(e)) : e;
  }
  function x(e, t) {
    return t.decode ? W(e) : e;
  }
  function U(e) {
    return Array.isArray(e)
      ? e.sort()
      : typeof e == "object"
        ? U(Object.keys(e))
            .sort((t, r) => Number(t) - Number(r))
            .map((t) => e[t])
        : e;
  }
  function $(e) {
    const t = e.indexOf("#");
    return (t !== -1 && (e = e.slice(0, t)), e);
  }
  function k(e) {
    let t = "";
    const r = e.indexOf("#");
    return (r !== -1 && (t = e.slice(r)), t);
  }
  function V(e) {
    const t = e.indexOf("?");
    return t === -1 ? e : e.slice(0, t);
  }
  function M(e, t, r) {
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
  function R(e) {
    e = $(e);
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
    const r = Z(t),
      n = Object.create(null);
    if (typeof e != "string" || ((e = e.trim().replace(/^[?#&]/, "")), !e))
      return n;
    let s = 0;
    for (let a = 0; a <= e.length; a++) {
      if (a < e.length && e[a] !== "&") continue;
      if (a === s) {
        s = a + 1;
        continue;
      }
      const o = e.slice(s, a);
      s = a + 1;
      const i = t.decode ? o.replaceAll("+", " ") : o;
      let [d, u] = L(i, "=");
      (d === void 0 && (d = i),
        (u =
          u === void 0
            ? null
            : ["comma", "separator", "bracket-separator"].includes(
                  t.arrayFormat,
                )
              ? u
              : x(u, t)),
        r(x(d, t), u, n));
    }
    for (const [a, o] of Object.entries(n))
      if (typeof o == "object" && o !== null && t.types[a] !== "string")
        for (const [i, d] of Object.entries(o)) {
          const u = t.types[a],
            c = typeof u == "function" ? u : u ? u.replace("[]", "") : void 0;
          o[i] = M(d, t, c);
        }
      else
        typeof o == "object" && o !== null && t.types[a] === "string"
          ? (n[a] = Object.values(o).join(t.arrayFormatSeparator))
          : (n[a] = M(o, t, t.types[a]));
    return t.sort === !1
      ? n
      : (t.sort === !0
          ? Object.keys(n).sort()
          : Object.keys(n).sort(t.sort)
        ).reduce((a, o) => {
          const i = n[o];
          return (
            (a[o] = i && typeof i == "object" && !Array.isArray(i) ? U(i) : i),
            a
          );
        }, Object.create(null));
  }
  function B(e, t) {
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
        (t.skipNull && z(e[o])) || (t.skipEmptyString && e[o] === ""),
      n = Y(t),
      s = {};
    for (const [o, i] of Object.entries(e)) r(o) || (s[o] = i);
    const a = Object.keys(s);
    return (
      t.sort !== !1 && a.sort(t.sort),
      a
        .map((o) => {
          let i = e[o];
          if (
            (t.replacer && ((i = t.replacer(o, i)), i === void 0)) ||
            i === void 0
          )
            return "";
          if (i === null) return h(o, t);
          if (Array.isArray(i)) {
            if (i.length === 0 && t.arrayFormat === "bracket-separator")
              return h(o, t) + "[]";
            let d = i;
            t.replacer &&
              (d = i
                .map((F, l) => t.replacer(`${o}[${l}]`, F))
                .filter((F) => F !== void 0));
            const u = d.reduce(n(o), []),
              c = ["comma", "separator", "bracket-separator"].includes(
                t.arrayFormat,
              )
                ? t.arrayFormatSeparator
                : "&";
            return u.join(c);
          }
          return h(o, t) + "=" + h(i, t);
        })
        .filter((o) => o.length > 0)
        .join("&")
    );
  }
  function _(e, t) {
    t = { decode: !0, ...t };
    let [r, n] = L(e, "#");
    return (
      r === void 0 && (r = e),
      {
        url: V(r ?? ""),
        query: w(R(e), t),
        ...(t && t.parseFragmentIdentifier && n
          ? { fragmentIdentifier: x(n, t) }
          : {}),
      }
    );
  }
  function q(e, t) {
    t = { encode: !0, strict: !0, [I]: !0, ...t };
    const r = V($(e.url)) || "",
      n = R(e.url),
      s = { ...w(n, { sort: !1, ...t }), ...e.query };
    let a = B(s, t);
    a && (a = `?${a}`);
    let o = k(e.url);
    if (typeof e.fragmentIdentifier == "string") {
      const i = new URL(r);
      ((i.hash = e.fragmentIdentifier),
        (o = t[I] ? i.hash : `#${e.fragmentIdentifier}`));
    }
    return `${r}${a}${o}`;
  }
  function D(e, t, r) {
    r = { parseFragmentIdentifier: !0, [I]: !1, ...r };
    const { url: n, query: s, fragmentIdentifier: a } = _(e, r);
    return q({ url: n, query: K(s, t), fragmentIdentifier: a }, r);
  }
  function v(e, t, r) {
    if (Array.isArray(t)) {
      const n = new Set(t);
      return D(e, (s) => !n.has(s), r);
    }
    return D(e, (n, s) => !t(n, s), r);
  }
  const ee = Object.freeze(
      Object.defineProperty(
        {
          __proto__: null,
          exclude: v,
          extract: R,
          parse: w,
          parseUrl: _,
          pick: D,
          stringify: B,
          stringifyUrl: q,
        },
        Symbol.toStringTag,
        { value: "Module" },
      ),
    ),
    te = () => {
      const e = "https://example.com",
        t = {
          name: "amit",
          location: "india",
          interests: ["workspace", "apps script"],
        },
        r = ee.stringify(t, { sort: !1, arrayFormat: "bracket" }),
        n = `${e}?${r}`;
      Logger.log(`URL: ${n}`);
    },
    re = () =>
      HtmlService.createHtmlOutputFromFile("index.html")
        .setTitle("Google Apps Script")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  function ne() {
    const t = SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName("Vouchers")
        .getDataRange()
        .getValues(),
      r = t[0],
      n = t.slice(1),
      a = n
        .slice(-15)
        .reverse()
        .map((o, i) => {
          const d = {};
          return (
            r.forEach((u, c) => {
              d[u] = o[c] !== void 0 && o[c] !== null ? o[c] : "";
            }),
            (d.ID = n.length - i),
            d
          );
        });
    return JSON.stringify(a);
  }
  function se(e) {
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
  function G(e, t) {
    try {
      const r = "Settings",
        n = SpreadsheetApp.getActiveSpreadsheet();
      let s = n.getSheetByName(r);
      s ||
        ((s = n.insertSheet(r)),
        s.appendRow(["Key", "Value", "Description"]),
        s.getRange(1, 1, 1, 3).setFontWeight("bold"));
      const a = s.getDataRange().getValues();
      for (let i = 1; i < a.length; i++)
        if (a[i][0] && a[i][0].toString().trim() === e) {
          const d = a[i][1];
          return d !== void 0 && d !== "" ? d : t;
        }
      let o = "";
      return (
        e === "FOOD_PASS_PRICE"
          ? (o = "Rate for a single food pass")
          : e === "FREE_PASS_TYPES" &&
            (o =
              "Comma-separated list of free pass types (e.g. hostel,student,teacher,staff)"),
        s.appendRow([e, t.toString(), o]),
        t
      );
    } catch (r) {
      return (console.error("Error reading setting from sheet:", r), t);
    }
  }
  function oe(e) {
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
  function ae() {
    const e = G("FOOD_PASS_PRICE", 100);
    return parseInt(e, 10);
  }
  function ie() {
    return G("FREE_PASS_TYPES", "hostel,student,teacher,staff")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  function ce(e) {
    const t = "FreePass",
      r = SpreadsheetApp.getActiveSpreadsheet();
    let n = r.getSheetByName(t);
    if (!n)
      ((n = r.insertSheet(t)),
        n.appendRow(["Date", "Time", "Type", "Quantity", "PassType", "TxnID"]));
    else {
      const a = n
        .getRange(1, 1, 1, Math.max(1, n.getLastColumn()))
        .getValues()[0]
        .findIndex((o) => String(o).trim().toLowerCase() === "totalamount");
      a !== -1 && n.getRange(1, a + 1).setValue("PassType");
    }
    return (
      n.appendRow([
        e.date,
        e.time,
        e.freePassTime,
        e.quantity,
        e.passType || "",
        e.tempId || "",
      ]),
      { success: !0, lastRow: n.getLastRow() }
    );
  }
  function fe(e) {
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
      a = s[0],
      o = a.indexOf("Phone"),
      i = a.indexOf("Name"),
      d = a.indexOf("Ledger"),
      u = a.indexOf("Purpose");
    if (o === -1) return null;
    for (let c = 1; c < s.length; c++)
      if (String(s[c][o]).trim() === String(e).trim())
        return {
          phone: String(s[c][o]).trim(),
          name: s[c][i] || "",
          ledger: s[c][d] || "",
          purpose: (u !== -1 && s[c][u]) || "",
        };
    return null;
  }
  function de() {
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
      a = s.indexOf("Phone"),
      o = s.indexOf("Name"),
      i = s.indexOf("Ledger"),
      d = s.indexOf("Purpose");
    if (a === -1) return [];
    const u = [];
    for (let c = 1; c < n.length; c++)
      n[c][a] &&
        u.push({
          phone: String(n[c][a]).trim(),
          name: n[c][o] || "",
          ledger: n[c][i] || "",
          purpose: (d !== -1 && n[c][d]) || "",
        });
    return u;
  }
  function ue(e, t, r, n) {
    const s = "Donors",
      a = SpreadsheetApp.getActiveSpreadsheet();
    let o = a.getSheetByName(s);
    o ||
      ((o = a.insertSheet(s)),
      o.appendRow(["Phone", "Name", "Ledger", "Purpose"]),
      o.getRange(1, 1, 1, 4).setFontWeight("bold"));
    const i = o.getDataRange().getValues(),
      d = i[0],
      u = d.indexOf("Phone"),
      c = d.indexOf("Name"),
      F = d.indexOf("Ledger"),
      l = d.indexOf("Purpose");
    let g = -1;
    for (let p = 1; p < i.length; p++)
      if (String(i[p][u]).trim() === String(e).trim()) {
        g = p + 1;
        break;
      }
    g === -1
      ? o.appendRow([String(e).trim(), t, r, n])
      : (c !== -1 && o.getRange(g, c + 1).setValue(t),
        F !== -1 && o.getRange(g, F + 1).setValue(r),
        l !== -1 && o.getRange(g, l + 1).setValue(n));
  }
  function pe(e) {
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
      ue(e.phone, e.name, e.ledger, e.purpose || e.note || ""));
    const s = PropertiesService.getScriptProperties().getProperty("username"),
      a = PropertiesService.getScriptProperties().getProperty("password"),
      o =
        PropertiesService.getScriptProperties().getProperty("extraSmsPhone") ||
        PropertiesService.getScriptProperties().getProperty("swamiji_phone");
    let i = "N/A";
    if (s && a) {
      const d = {
          Authorization: "Basic " + Utilities.base64Encode(s + ":" + a),
        },
        u = [`+91${e.phone}`];
      o && u.push(`+91${o}`);
      const c = {
        message: `જય સ્વામિનારાયણ ${e.name}, આપ શ્રી ના તરફથી આજે ${e.date} તારીખે રૂપિયા ${e.amount} નો સહયોગ પ્રાપ્ત થયેલ છે. 
શ્રી સ્વામિનારાયણ ગુરુકુળ અમદાવાદ - નિકોલ`,
        phoneNumbers: u,
      };
      try {
        i = UrlFetchApp.fetch("https://api.sms-gate.app/3rdparty/v1/message", {
          method: "POST",
          contentType: "application/json",
          headers: d,
          payload: JSON.stringify(c),
          muteHttpExceptions: !0,
        }).getResponseCode();
      } catch (F) {
        i = "Error: " + F.message;
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
  function ge(e) {
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
  function le(e) {
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
          freePass: {
            lunch: 0,
            dinner: 0,
            totalQuantity: 0,
            byType: {},
            entries: [],
          },
          gatePass: { count: 0, entries: [] },
          donations: { count: 0, totalAmount: 0, entries: [] },
        },
        a = (l) =>
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
          const g = String(l);
          if (g.match(/\d{1,2}:\d{2}/)) {
            const p = g.split(":");
            let f = parseInt(p[0]);
            const S = p[1].substring(0, 2),
              m = f >= 12 ? "PM" : "AM";
            return ((f = f % 12 || 12), f + ":" + S + " " + m);
          }
          return g.toUpperCase();
        },
        i = (l, g = 1e3) => {
          const p = t.getSheetByName(l);
          if (!p) return { headers: [], rows: [] };
          const f = p.getLastRow();
          if (f < 1) return { headers: [], rows: [] };
          const S = p.getLastColumn(),
            m = p.getRange(1, 1, Math.min(f, g + 1), S).getValues(),
            P = m[0].map((O) => String(O).trim().toLowerCase());
          let A = m.slice(1);
          return (
            f > g && (A = p.getRange(f - g + 1, 1, g, S).getValues()),
            { headers: P, rows: A }
          );
        },
        d = i("FoodPass");
      if (d.headers.length > 0) {
        const l = d.headers.indexOf("quantity"),
          g = d.headers.indexOf("totalamount");
        d.rows.forEach((p) => {
          if (a(p[0])) {
            const f = parseInt(p[l]) || 0,
              S = parseFloat(p[g]) || 0;
            let m = "dinner";
            const P = p.join(" ").toLowerCase();
            if (P.includes("lunch")) m = "lunch";
            else if (P.includes("dinner")) m = "dinner";
            else {
              const A = p
                .map((O) => String(O))
                .find((O) => O.match(/\d{1,2}:\d{2}/));
              A && (m = parseInt(A.split(":")[0]) < 17 ? "lunch" : "dinner");
            }
            (m === "lunch"
              ? ((s.foodPass.lunch += f), (s.foodPass.lunchAmount += S))
              : ((s.foodPass.dinner += f), (s.foodPass.dinnerAmount += S)),
              (s.foodPass.totalQuantity += f),
              (s.foodPass.totalAmount += S));
          }
        });
      }
      const u = i("FreePass");
      if (u.headers.length > 0) {
        const l = u.headers.indexOf("quantity");
        let g = u.headers.indexOf("passtype");
        g === -1 && (g = u.headers.indexOf("totalamount"));
        const p = u.headers.indexOf("time");
        u.rows.forEach((f) => {
          if (a(f[0])) {
            const S = parseInt(f[l]) || 0;
            let m = "dinner";
            const P = f.join(" ").toLowerCase();
            if (P.includes("lunch")) m = "lunch";
            else if (P.includes("dinner")) m = "dinner";
            else {
              const O = f
                .map((b) => String(b))
                .find((b) => b.match(/\d{1,2}:\d{2}/));
              O && (m = parseInt(O.split(":")[0]) < 17 ? "lunch" : "dinner");
            }
            (m === "lunch" ? (s.freePass.lunch += S) : (s.freePass.dinner += S),
              (s.freePass.totalQuantity += S));
            let A = g !== -1 ? String(f[g]).trim() : "";
            ((A === "0" || !A) && (A = "Standard"),
              (A = A.charAt(0).toUpperCase() + A.slice(1).toLowerCase()),
              (s.freePass.byType[A] = (s.freePass.byType[A] || 0) + S),
              s.freePass.entries.push({
                time: p !== -1 ? o(f[p]) : "-",
                mealType: m.charAt(0).toUpperCase() + m.slice(1),
                passType: A,
                quantity: S,
              }));
          }
        });
      }
      const c = i("GatePass", 500);
      if (c.headers.length > 0) {
        const l = c.headers.indexOf("name"),
          g = c.headers.indexOf("department"),
          p = c.headers.indexOf("outtime");
        c.rows.forEach((f) => {
          a(f[0]) &&
            (s.gatePass.count++,
            s.gatePass.entries.push({
              name: String(f[l] || "Unknown"),
              dept: String(f[g] || "-"),
              outTime: o(f[p]),
            }));
        });
      }
      const F = i("Donations", 500);
      if (F.headers.length > 0) {
        const l = F.headers.indexOf("name"),
          g = F.headers.indexOf("note");
        let p = F.headers.indexOf("amount");
        (p === -1 &&
          (p = F.headers.findIndex(
            (f) => f.includes("amt") || f.includes("rs"),
          )),
          F.rows.forEach((f) => {
            if (a(f[0])) {
              let S = 0;
              if (p !== -1)
                S = parseFloat(String(f[p]).replace(/[^\d.]/g, "")) || 0;
              else {
                const m = f.filter(
                  (P) => typeof P == "number" && P > 10 && P !== 202,
                );
                S = m.length > 0 ? m[m.length - 1] : 0;
              }
              (s.donations.count++,
                (s.donations.totalAmount += S),
                s.donations.entries.push({
                  name: String(f[l] || "Donor"),
                  purpose: String(f[g] || "-"),
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
    (y.addDonation = pe),
    (y.addFoodPass = oe),
    (y.addFreePass = ce),
    (y.addGatePass = ge),
    (y.addVoucher = se),
    (y.doGet = re),
    (y.getAllDonors = de),
    (y.getDailyReport = le),
    (y.getDonorDetails = fe),
    (y.getFoodPassPrice = ae),
    (y.getFreePassTypes = ie),
    (y.getGmailAliases = Q),
    (y.getVouchers = ne),
    (y.makeQueryString = te),
    Object.defineProperty(y, Symbol.toStringTag, { value: "Module" }),
    y
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
function getFreePassTypes() {
  return app.getFreePassTypes.apply(this, arguments);
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
