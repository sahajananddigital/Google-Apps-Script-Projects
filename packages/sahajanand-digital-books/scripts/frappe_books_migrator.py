#!/usr/bin/env python3
"""
Frappe Books to Google Apps Script / Google Sheets Migrator
===========================================================
Universal migration tool for any Frappe Books SQLite database (*.books.db or *.db).
Extracts all 11 required double-entry accounting tables:
  1. Invoices
  2. InvoiceItems
  3. Payments
  4. Expenses (Full 100% extraction from General Ledger debits)
  5. JournalEntries
  6. JournalLedgers (Complete General Ledger entries matching Balance Sheet)
  7. ChartOfAccounts (Hierarchical tree)
  8. Customers (With live OutstandingAmount synchronization)
  9. Items (Services & Products catalog)
  10. CompanySettings
  11. NumberSeries

Usage:
  python3 scripts/frappe_books_migrator.py "/path/to/YourCompany.books.db"
"""

import sys
import os
import sqlite3
import json
import csv
import zipfile
import io

def col_letter(n):
    result = ""
    while n >= 0:
        result = chr(n % 26 + 65) + result
        n = n // 26 - 1
    return result

def escape_xml(s):
    if s is None:
        return ""
    clean = "".join(ch for ch in str(s) if ord(ch) >= 32 or ch in ('\t', '\n', '\r'))
    return (clean.replace("&", "&amp;")
                 .replace("<", "&lt;")
                 .replace(">", "&gt;")
                 .replace('"', "&quot;")
                 .replace("'", "&apos;"))

def build_worksheet_xml(rows):
    lines = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
        '<sheetData>'
    ]
    for r_idx, row in enumerate(rows, start=1):
        lines.append(f'  <row r="{r_idx}">')
        for c_idx, val in enumerate(row):
            cell_ref = f"{col_letter(c_idx)}{r_idx}"
            if val is None or val == "":
                continue
            if isinstance(val, (int, float)) and not isinstance(val, bool):
                lines.append(f'    <c r="{cell_ref}"><v>{val}</v></c>')
            else:
                s_val = escape_xml(str(val))
                lines.append(f'    <c r="{cell_ref}" t="inlineStr"><is><t>{s_val}</t></is></c>')
        lines.append('  </row>')
    lines.append('</sheetData>')
    lines.append('</worksheet>')
    return "\n".join(lines)

def create_excel_workbook(sheets_dict, output_path):
    sheet_names = list(sheets_dict.keys())
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        # [Content_Types].xml
        ct = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
              '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
              '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
              '<Default Extension="xml" ContentType="application/xml"/>',
              '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>']
        for i in range(1, len(sheet_names) + 1):
            ct.append(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
        ct.append('</Types>')
        zf.writestr('[Content_Types].xml', "\n".join(ct))

        # _rels/.rels
        zf.writestr('_rels/.rels', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>''')

        # xl/_rels/workbook.xml.rels
        wb_rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">']
        for i in range(1, len(sheet_names) + 1):
            wb_rels.append(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>')
        wb_rels.append('</Relationships>')
        zf.writestr('xl/_rels/workbook.xml.rels', "\n".join(wb_rels))

        # xl/workbook.xml
        wb = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
              '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
              '<sheets>']
        for i, name in enumerate(sheet_names, start=1):
            clean_name = escape_xml(name)[:31]
            wb.append(f'<sheet name="{clean_name}" sheetId="{i}" r:id="rId{i}"/>')
        wb.append('</sheets>')
        wb.append('</workbook>')
        zf.writestr('xl/workbook.xml', "\n".join(wb))

        # Worksheets
        for i, name in enumerate(sheet_names, start=1):
            data = sheets_dict[name]
            all_rows = [data['headers']] + data['rows']
            sheet_xml = build_worksheet_xml(all_rows)
            zf.writestr(f'xl/worksheets/sheet{i}.xml', sheet_xml)

    with open(output_path, 'wb') as f:
        f.write(buf.getvalue())

def migrate_database(db_path, output_dir=None):
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at: {db_path}")
        return False

    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(db_path))

    print(f"Opening Frappe Books database: {db_path}")
    con = sqlite3.connect(db_path)
    cur = con.cursor()

    sheets = {}

    # 1. Invoices (SalesInvoice)
    inv_headers = ['InvoiceNo', 'Date', 'CustomerName', 'Account', 'NetTotal', 'DiscountAmount', 'GrandTotal', 'OutstandingAmount', 'Status', 'Terms', 'CreatedAt']
    inv_rows = []
    try:
        cur.execute('''
            SELECT name, date, party, account, CAST(netTotal AS REAL), CAST(discountAmount AS REAL),
                   CAST(grandTotal AS REAL), CAST(outstandingAmount AS REAL), submitted, cancelled, terms, created
            FROM SalesInvoice
            ORDER BY date ASC, name ASC;
        ''')
        for r in cur.fetchall():
            status = 'Cancelled' if r[9] else ('Paid' if r[7] <= 0 else 'Submitted')
            date_str = r[1][:10] if r[1] else ''
            inv_rows.append([
                r[0], date_str, r[2] or '', r[3] or 'Debtors',
                r[4] or 0.0, r[5] or 0.0, r[6] or 0.0, r[7] or 0.0,
                status, r[10] or '', r[11] or ''
            ])
    except Exception as e:
        print(f"Warning extracting SalesInvoice: {e}")
    sheets['Invoices'] = {'headers': inv_headers, 'rows': inv_rows}
    print(f"✓ Extracted {len(inv_rows)} Invoices")

    # 2. InvoiceItems (SalesInvoiceItem)
    item_headers = ['ID', 'InvoiceNo', 'ItemName', 'Description', 'HSN_SAC', 'Quantity', 'Rate', 'Amount']
    item_rows = []
    try:
        cur.execute('''
            SELECT name, parent, item, description, hsnCode, CAST(quantity AS REAL), CAST(rate AS REAL), CAST(amount AS REAL)
            FROM SalesInvoiceItem
            ORDER BY parent ASC, idx ASC;
        ''')
        for r in cur.fetchall():
            item_rows.append([
                r[0], r[1], r[2] or 'Service', r[3] or '',
                r[4] or '998312', r[5] or 1.0, r[6] or 0.0, r[7] or 0.0
            ])
    except Exception as e:
        print(f"Warning extracting SalesInvoiceItem: {e}")
    sheets['InvoiceItems'] = {'headers': item_headers, 'rows': item_rows}
    print(f"✓ Extracted {len(item_rows)} Invoice Items")

    # 3. Payments (Payment)
    pay_headers = ['PaymentNo', 'Date', 'CustomerName', 'InvoiceNo', 'Amount', 'PaymentMethod', 'Account', 'ReferenceTxnId', 'CreatedAt']
    pay_rows = []
    try:
        cur.execute('''
            SELECT p.name, p.date, p.party, CAST(p.amount AS REAL), p.paymentMethod, p.paymentAccount, p.referenceId, p.created
            FROM Payment p
            WHERE p.cancelled = 0
            ORDER BY p.date ASC, p.name ASC;
        ''')
        for r in cur.fetchall():
            date_str = r[1][:10] if r[1] else ''
            # Find allocated invoice
            cur.execute('SELECT referenceName FROM PaymentFor WHERE parent = ? LIMIT 1;', (r[0],))
            alloc = cur.fetchone()
            inv_no = alloc[0] if alloc else ''
            pay_rows.append([
                r[0], date_str, r[2] or '', inv_no,
                r[3] or 0.0, r[4] or 'Transfer', r[5] or 'Primary Bank',
                r[6] or '', r[7] or ''
            ])
    except Exception as e:
        print(f"Warning extracting Payment: {e}")
    sheets['Payments'] = {'headers': pay_headers, 'rows': pay_rows}
    print(f"✓ Extracted {len(pay_rows)} Payments")

    # 4. ChartOfAccounts (Account)
    acc_headers = ['AccountName', 'RootType', 'ParentAccount', 'AccountType', 'IsGroup']
    acc_rows = []
    expense_account_names = set()
    try:
        cur.execute('''
            SELECT name, rootType, parentAccount, accountType, isGroup
            FROM Account
            ORDER BY rootType, parentAccount, name;
        ''')
        for r in cur.fetchall():
            if r[1] == 'Expense':
                expense_account_names.add(r[0])
            acc_rows.append([
                r[0], r[1] or 'Asset', r[2] or '', r[3] or '', int(r[4] or 0)
            ])
    except Exception as e:
        print(f"Warning extracting Account: {e}")
    sheets['ChartOfAccounts'] = {'headers': acc_headers, 'rows': acc_rows}
    print(f"✓ Extracted {len(acc_rows)} Accounts in Chart of Accounts")

    # 5. JournalLedgers (AccountingLedgerEntry - active general ledger)
    ledger_headers = ['ID', 'EntryNo', 'AccountName', 'Debit', 'Credit']
    ledger_rows = []
    try:
        cur.execute('''
            SELECT name, referenceName, account, CAST(debit AS REAL), CAST(credit AS REAL)
            FROM AccountingLedgerEntry
            WHERE reverted = 0
            ORDER BY date ASC, name ASC;
        ''')
        for r in cur.fetchall():
            ledger_rows.append([r[0], r[1], r[2], r[3] or 0.0, r[4] or 0.0])
    except Exception as e:
        print(f"Warning extracting AccountingLedgerEntry: {e}")
    sheets['JournalLedgers'] = {'headers': ledger_headers, 'rows': ledger_rows}
    print(f"✓ Extracted {len(ledger_rows)} General Ledger Entries (Active)")

    # 6. JournalEntries (JournalEntry)
    jv_headers = ['EntryNo', 'Date', 'EntryType', 'ReferenceNo', 'ReferenceDate', 'Narration', 'CreatedAt']
    jv_rows = []
    try:
        cur.execute('''
            SELECT name, date, entryType, referenceNumber, referenceDate, userRemark, created
            FROM JournalEntry
            ORDER BY date ASC, name ASC;
        ''')
        for r in cur.fetchall():
            date_str = r[1][:10] if r[1] else ''
            jv_rows.append([
                r[0], date_str, r[2] or 'Journal Entry', r[3] or '',
                r[4] or '', r[5] or '', r[6] or ''
            ])
    except Exception as e:
        print(f"Warning extracting JournalEntry: {e}")
    sheets['JournalEntries'] = {'headers': jv_headers, 'rows': jv_rows}
    print(f"✓ Extracted {len(jv_rows)} Journal Entries")

    # 7. Expenses (Extracted 100% from all Expense debits in General Ledger)
    exp_headers = ['ExpenseNo', 'Date', 'Category', 'PaidVia', 'Amount', 'Description', 'ReferenceTxnId', 'CreatedAt']
    exp_rows = []
    exp_idx = 1
    total_exp_amt = 0.0
    try:
        cur.execute('''
            SELECT ale.name, ale.date, ale.account, CAST(ale.debit AS REAL), ale.referenceName
            FROM AccountingLedgerEntry ale
            WHERE ale.reverted = 0 AND CAST(ale.debit AS REAL) > 0
            ORDER BY ale.date ASC;
        ''')
        for r in cur.fetchall():
            acc_name = r[2]
            deb_amt = r[3]
            if acc_name in expense_account_names:
                date_str = r[1][:10] if r[1] else ''
                ref_name = r[4]

                # Find metadata and paid-via account from corresponding credit split
                cur.execute('''
                    SELECT account FROM AccountingLedgerEntry
                    WHERE referenceName = ? AND reverted = 0 AND CAST(credit AS REAL) > 0
                    LIMIT 1;
                ''', (ref_name,))
                cred_match = cur.fetchone()
                paid_via = cred_match[0] if cred_match else 'Primary Bank'

                # Find user narration if JournalEntry
                cur.execute('SELECT userRemark, referenceNumber FROM JournalEntry WHERE name = ? LIMIT 1;', (ref_name,))
                jv_meta = cur.fetchone()
                narration = jv_meta[0] if jv_meta else ''
                ref_id = jv_meta[1] if (jv_meta and jv_meta[1]) else ref_name

                exp_rows.append([
                    f"EXP-{1000 + exp_idx}",
                    date_str,
                    acc_name,
                    paid_via,
                    deb_amt,
                    narration or f"Expense for {acc_name}",
                    ref_id or '',
                    date_str
                ])
                total_exp_amt += deb_amt
                exp_idx += 1
    except Exception as e:
        print(f"Warning extracting Expenses: {e}")
    sheets['Expenses'] = {'headers': exp_headers, 'rows': exp_rows}
    print(f"✓ Extracted {len(exp_rows)} Expenses totaling ₹{total_exp_amt:,.2f}")

    # 8. Customers (Party + Address)
    cust_due_map = {}
    for inv in inv_rows:
        if inv[8] != 'Cancelled' and inv[2]:
            cust_due_map[inv[2]] = cust_due_map.get(inv[2], 0.0) + float(inv[7] or 0.0)

    cust_headers = ['CustomerName', 'Email', 'Phone', 'AddressLine1', 'AddressLine2', 'City', 'State', 'Pincode', 'GSTIN', 'GSTType', 'Currency', 'OutstandingAmount']
    cust_rows = []
    seen_customers = set()
    try:
        cur.execute('''
            SELECT p.name, p.email, p.phone, a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode, p.gstin, p.gstType, p.currency
            FROM Party p
            LEFT JOIN Address a ON p.address = a.name
            ORDER BY p.name ASC;
        ''')
        for r in cur.fetchall():
            cname = r[0]
            seen_customers.add(cname)
            cust_rows.append([
                cname, r[1] or '', r[2] or '', r[3] or '', r[4] or '',
                r[5] or '', r[6] or '', r[7] or '', r[8] or '',
                r[9] or 'Unregistered', r[10] or 'INR',
                round(cust_due_map.get(cname, 0.0), 2)
            ])
    except Exception as e:
        print(f"Warning extracting Party: {e}")

    # Ensure any customer from Invoices is present
    for inv in inv_rows:
        cname = inv[2]
        if cname and cname not in seen_customers:
            cust_rows.append([cname, '', '', '', '', '', '', '', '', 'Unregistered', 'INR', round(cust_due_map.get(cname, 0.0), 2)])
            seen_customers.add(cname)

    sheets['Customers'] = {'headers': cust_headers, 'rows': cust_rows}
    print(f"✓ Extracted {len(cust_rows)} Customers with synced outstanding balances")

    # 9. Items (Item)
    cat_headers = ['ItemName', 'ItemCode', 'ItemGroup', 'ItemType', 'Unit', 'Rate', 'Description', 'IncomeAccount', 'ExpenseAccount', 'HSN_SAC']
    cat_rows = []
    try:
        cur.execute('''
            SELECT name, itemCode, itemGroup, itemType, unit, CAST(rate AS REAL), description, incomeAccount, expenseAccount, hsnCode
            FROM Item
            ORDER BY name ASC;
        ''')
        for r in cur.fetchall():
            cat_rows.append([
                r[0], r[1] or '', r[2] or 'Service', r[3] or 'Service',
                r[4] or 'Unit', r[5] or 0.0, r[6] or '', r[7] or 'Service',
                r[8] or 'Cost of Goods Sold', r[9] or '998312'
            ])
    except Exception as e:
        print(f"Warning extracting Item: {e}")
    sheets['Items'] = {'headers': cat_headers, 'rows': cat_rows}
    print(f"✓ Extracted {len(cat_rows)} Catalog Items")

    # 10. CompanySettings (SingleValue / Settings)
    set_headers = ['Key', 'Value']
    set_rows = []
    try:
        cur.execute('SELECT fieldName, fieldValue FROM SingleValue;')
        for r in cur.fetchall():
            set_rows.append([r[0], r[1] or ''])
    except Exception:
        pass
    if len(set_rows) == 0:
        set_rows = [
            ['companyName', 'My Organization'],
            ['currency', 'INR'],
            ['primaryBankName', 'Primary Bank'],
            ['secondaryBankName', 'Secondary Bank'],
        ]
    sheets['CompanySettings'] = {'headers': set_headers, 'rows': set_rows}

    # 11. NumberSeries
    num_headers = ['SeriesName', 'Prefix', 'CurrentCount', 'PadZeros']
    num_rows = []
    try:
        cur.execute('SELECT name, prefix, current, padZeros FROM NumberSeries;')
        for r in cur.fetchall():
            num_rows.append([r[0], r[1], int(r[2] or 0), int(r[3] or 4)])
    except Exception:
        pass
    if len(num_rows) == 0:
        num_rows = [
            ['Invoice', 'SINV-', len(inv_rows) + 1000, 4],
            ['Payment', 'PAY-', len(pay_rows) + 1000, 4],
            ['Expense', 'EXP-', len(exp_rows) + 1000, 4],
            ['JournalEntry', 'JV-', len(jv_rows) + 1000, 4],
        ]
    sheets['NumberSeries'] = {'headers': num_headers, 'rows': num_rows}

    con.close()

    # OUTPUT GENERATION
    os.makedirs(output_dir, exist_ok=True)

    # 1. Excel Workbook
    xlsx_path = os.path.join(output_dir, "Frappe_Books_Migration.xlsx")
    create_excel_workbook(sheets, xlsx_path)
    print(f"\n📦 Generated Excel Workbook: {xlsx_path} (Ready for Google Sheets upload)")

    # 2. JSON Payload (For 1-click in-app drag & drop migration)
    json_path = os.path.join(output_dir, "migration_payload.json")
    json_sheets = {}
    for s_name, s_data in sheets.items():
        json_sheets[s_name] = [s_data['headers']] + s_data['rows']
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_sheets, f, indent=2)
    print(f"📄 Generated In-App JSON: {json_path} (Drag & drop directly into Web App)")

    # 3. CSV Directory
    csv_dir = os.path.join(output_dir, "migration_csvs")
    os.makedirs(csv_dir, exist_ok=True)
    for s_name, s_data in sheets.items():
        file_path = os.path.join(csv_dir, f"{s_name}.csv")
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            w = csv.writer(f)
            w.writerow(s_data['headers'])
            for row in s_data['rows']:
                w.writerow(row)
    print(f"📁 Generated 11 CSV files: {csv_dir}")

    print("\n🎉 Migration Extraction Completed Successfully!")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/frappe_books_migrator.py <path_to_books_db> [output_dir]")
        sys.exit(1)
    else:
        out = sys.argv[2] if len(sys.argv) > 2 else None
        migrate_database(sys.argv[1], out)
