#!/usr/bin/env python3
"""
Generate Excel (.xlsx) and CSV files from Frappe Books database data.
Fully compatible with Google Sheets (File -> Import -> Upload).
"""

import json
import os
import io
import csv
import zipfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SEED_PATH = os.path.join(SCRIPT_DIR, '../src/server/seedData.json')
OUTPUT_XLSX = os.path.join(SCRIPT_DIR, '../Sahajanand_Digital_Migration.xlsx')
OUTPUT_CSV_DIR = os.path.join(SCRIPT_DIR, '../migration_csvs')

def col_letter(n):
    result = ""
    while n >= 0:
        result = chr(n % 26 + 65) + result
        n = n // 26 - 1
    return result

def escape_xml(s):
    if s is None:
        return ""
    # Filter out ASCII control characters invalid in XML 1.0
    clean = "".join(ch for ch in str(s) if ord(ch) >= 32 or ch in ('\t', '\n', '\r'))
    return clean.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&apos;")

def is_number(val):
    if val is None or val == "":
        return False
    if isinstance(val, (int, float)):
        return True
    s = str(val).strip()
    # Don't treat phone numbers, dates, or codes starting with 0 as numbers
    if len(s) > 1 and s.startswith('0') and not s.startswith('0.'):
        return False
    if '-' in s or '+' in s or '/' in s:
        return False
    try:
        float(s)
        return True
    except ValueError:
        return False

def build_worksheet_xml(headers, rows):
    out = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
    out.append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">')
    out.append('<sheetData>')
    
    # Row 1: Headers
    out.append('<row r="1">')
    for c_idx, h in enumerate(headers):
        ref = f"{col_letter(c_idx)}1"
        out.append(f'<c r="{ref}" t="inlineStr"><is><t>{escape_xml(h)}</t></is></c>')
    out.append('</row>')

    # Data Rows
    for r_idx, row in enumerate(rows, start=2):
        out.append(f'<row r="{r_idx}">')
        for c_idx, val in enumerate(row):
            ref = f"{col_letter(c_idx)}{r_idx}"
            if is_number(val):
                num_val = float(val) if '.' in str(val) else int(val)
                out.append(f'<c r="{ref}"><v>{num_val}</v></c>')
            else:
                out.append(f'<c r="{ref}" t="inlineStr"><is><t>{escape_xml(val)}</t></is></c>')
        out.append('</row>')

    out.append('</sheetData>')
    out.append('</worksheet>')
    return "".join(out)

def create_multi_sheet_xlsx(sheets_dict, output_path):
    """
    sheets_dict: { 'SheetName': { 'headers': [...], 'rows': [[...], [...]] } }
    """
    sheet_names = list(sheets_dict.keys())

    # Build Content_Types.xml
    ct_parts = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
    ct_parts.append('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">')
    ct_parts.append('<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>')
    ct_parts.append('<Default Extension="xml" ContentType="application/xml"/>')
    ct_parts.append('<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>')
    for idx in range(1, len(sheet_names) + 1):
        ct_parts.append(f'<Override PartName="/xl/worksheets/sheet{idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
    ct_parts.append('</Types>')

    # Build _rels/.rels
    root_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

    # Build xl/workbook.xml and xl/_rels/workbook.xml.rels
    wb_parts = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
    wb_parts.append('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">')
    wb_parts.append('<sheets>')

    wb_rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
    wb_rels.append('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">')

    for idx, sname in enumerate(sheet_names, start=1):
        r_id = f"rId{idx}"
        wb_parts.append(f'<sheet name="{escape_xml(sname)}" sheetId="{idx}" r:id="{r_id}"/>')
        wb_rels.append(f'<Relationship Id="{r_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{idx}.xml"/>')

    wb_parts.append('</sheets></workbook>')
    wb_rels.append('</Relationships>')

    # Write ZIP
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('[Content_Types].xml', "".join(ct_parts))
        zf.writestr('_rels/.rels', root_rels)
        zf.writestr('xl/_rels/workbook.xml.rels', "".join(wb_rels))
        zf.writestr('xl/workbook.xml', "".join(wb_parts))

        for idx, sname in enumerate(sheet_names, start=1):
            sheet_info = sheets_dict[sname]
            ws_xml = build_worksheet_xml(sheet_info['headers'], sheet_info['rows'])
            zf.writestr(f'xl/worksheets/sheet{idx}.xml', ws_xml)

    print(f"Generated multi-sheet Excel file: {output_path}")

def main():
    if not os.path.exists(SEED_PATH):
        raise FileNotFoundError(f"Seed data not found at {SEED_PATH}")

    with open(SEED_PATH, 'r', encoding='utf-8') as f:
        seed = json.load(f)

    sheets = {}

    # 1. Invoices
    inv_headers = ['InvoiceNo', 'Date', 'CustomerName', 'Account', 'NetTotal', 'DiscountAmount', 'GrandTotal', 'OutstandingAmount', 'Status', 'Terms', 'CreatedAt']
    inv_rows = []
    for inv in seed.get('invoices', []):
        status = 'Cancelled' if inv.get('cancelled') else ('Paid' if float(inv.get('outstandingAmount', 0)) <= 0 else 'Submitted')
        inv_rows.append([
            inv.get('name', ''),
            inv.get('date', '')[:10] if inv.get('date') else '',
            inv.get('party', ''),
            inv.get('account', 'Debtors'),
            float(inv.get('netTotal', 0)),
            float(inv.get('discountAmount', 0)),
            float(inv.get('grandTotal', 0)),
            float(inv.get('outstandingAmount', 0)),
            status,
            inv.get('terms', ''),
            inv.get('date', '')
        ])
    sheets['Invoices'] = {'headers': inv_headers, 'rows': inv_rows}

    # 2. InvoiceItems
    itm_headers = ['ID', 'InvoiceNo', 'ItemName', 'Description', 'HSN_SAC', 'Quantity', 'Rate', 'Amount']
    itm_rows = []
    for itm in seed.get('invoice_items', []):
        itm_rows.append([
            itm.get('name', ''),
            itm.get('parent', ''),
            itm.get('item', ''),
            itm.get('description', ''),
            itm.get('hsnCode', '998312'),
            float(itm.get('quantity', 1)),
            float(itm.get('rate', 0)),
            float(itm.get('amount', 0))
        ])
    sheets['InvoiceItems'] = {'headers': itm_headers, 'rows': itm_rows}

    # 3. Payments
    pay_headers = ['PaymentNo', 'Date', 'CustomerName', 'InvoiceNo', 'Amount', 'PaymentMethod', 'Account', 'ReferenceTxnId', 'CreatedAt']
    pay_rows = []
    for p in seed.get('payments', []):
        inv_no = p.get('allocations', [{}])[0].get('referenceName', '') if p.get('allocations') else ''
        pay_rows.append([
            p.get('name', ''),
            p.get('date', '')[:10] if p.get('date') else '',
            p.get('party', ''),
            inv_no,
            float(p.get('amount', 0)),
            p.get('paymentMethod', 'Transfer'),
            p.get('paymentAccount', 'Federal Bank'),
            p.get('referenceId', ''),
            p.get('date', '')
        ])
    sheets['Payments'] = {'headers': pay_headers, 'rows': pay_rows}

    # 4. JournalEntries & JournalLedgers
    jv_headers = ['EntryNo', 'Date', 'EntryType', 'ReferenceNo', 'ReferenceDate', 'Narration', 'CreatedAt']
    jv_rows = []
    for jv in seed.get('journal_entries', []):
        jv_rows.append([
            jv.get('name', ''),
            jv.get('date', '')[:10] if jv.get('date') else '',
            jv.get('entryType', 'Journal Entry'),
            jv.get('referenceNumber', ''),
            jv.get('referenceDate', ''),
            jv.get('userRemark', ''),
            jv.get('date', '')
        ])
    sheets['JournalEntries'] = {'headers': jv_headers, 'rows': jv_rows}

    split_headers = ['ID', 'EntryNo', 'AccountName', 'Debit', 'Credit']
    split_rows = []
    for s in seed.get('journal_splits', []):
        split_rows.append([
            s.get('name', ''),
            s.get('parent', ''),
            s.get('account', ''),
            float(s.get('debit', 0)),
            float(s.get('credit', 0))
        ])
    sheets['JournalLedgers'] = {'headers': split_headers, 'rows': split_rows}

    # 5. Expenses (Extracted from Expense JVs)
    exp_headers = ['ExpenseNo', 'Date', 'Category', 'PaidVia', 'Amount', 'Description', 'ReferenceTxnId', 'CreatedAt']
    exp_rows = []
    exp_idx = 1
    for jv in seed.get('journal_entries', []):
        splits = jv.get('splits', [])
        for s in splits:
            deb = float(s.get('debit', 0))
            if deb > 0 and s.get('account') in ('Hetzner', 'Google Products', 'Administrative Expenses', 'Bank Charges', 'Cost of Goods Sold'):
                # Find credit account (paid via)
                paid_via = 'Federal Bank'
                for other in splits:
                    if float(other.get('credit', 0)) > 0:
                        paid_via = other.get('account', 'Federal Bank')
                        break
                exp_rows.append([
                    f"EXP-{1000 + exp_idx}",
                    jv.get('date', '')[:10] if jv.get('date') else '',
                    s.get('account', 'General Expense'),
                    paid_via,
                    deb,
                    jv.get('userRemark', ''),
                    jv.get('referenceNumber', ''),
                    jv.get('date', '')
                ])
                exp_idx += 1
    sheets['Expenses'] = {'headers': exp_headers, 'rows': exp_rows}

    # 6. ChartOfAccounts
    acc_headers = ['AccountName', 'RootType', 'ParentAccount', 'AccountType', 'IsGroup']
    acc_rows = []
    for a in seed.get('accounts', []):
        acc_rows.append([
            a.get('name', ''),
            a.get('rootType', ''),
            a.get('parentAccount', ''),
            a.get('accountType', ''),
            'TRUE' if a.get('isGroup') else 'FALSE'
        ])
    sheets['ChartOfAccounts'] = {'headers': acc_headers, 'rows': acc_rows}

    # 7. Customers
    cust_headers = ['CustomerName', 'Email', 'Phone', 'AddressLine1', 'AddressLine2', 'City', 'State', 'Pincode', 'GSTIN', 'GSTType', 'Currency', 'OutstandingAmount']
    cust_rows = []
    for c in seed.get('customers', []):
        cust_rows.append([
            c.get('name', ''),
            c.get('email', ''),
            c.get('phone', ''),
            c.get('addressLine1', ''),
            c.get('addressLine2', ''),
            c.get('city', ''),
            c.get('state', ''),
            c.get('postalCode', ''),
            c.get('gstin', ''),
            c.get('gstType', 'Unregistered'),
            c.get('currency', 'INR'),
            float(c.get('outstandingAmount', 0))
        ])
    sheets['Customers'] = {'headers': cust_headers, 'rows': cust_rows}

    # 8. Items
    itm_cat_headers = ['ItemName', 'ItemCode', 'ItemGroup', 'ItemType', 'Unit', 'Rate', 'Description', 'IncomeAccount', 'ExpenseAccount', 'HSN_SAC']
    itm_cat_rows = []
    for it in seed.get('items', []):
        itm_cat_rows.append([
            it.get('name', ''),
            it.get('itemCode', ''),
            it.get('itemGroup', 'Service'),
            it.get('itemType', 'Service'),
            it.get('unit', 'Unit'),
            float(it.get('rate', 0)),
            it.get('description', ''),
            it.get('incomeAccount', 'Service'),
            it.get('expenseAccount', 'Cost of Goods Sold'),
            it.get('hsnCode', '998312')
        ])
    sheets['Items'] = {'headers': itm_cat_headers, 'rows': itm_cat_rows}

    # 9. CompanySettings
    set_headers = ['Key', 'Value']
    set_rows = [
        ['companyName', 'Sahajanand Digital'],
        ['fullname', 'Vanpariya Ronakkumar Jagdishbhai'],
        ['address', '505, 3rd Floor, Blueberry Complex, Near Gurukul Circle, Nikol, Ahmedabad, Gujarat, India, 382350'],
        ['phone', '+91 8160535181'],
        ['email', 'sahajananddigital108@gmail.com'],
        ['website', 'https://sahajananddigital.in'],
        ['pan', 'BURPJ8082P'],
        ['udyam', 'UDYAM-GJ-01-0385616'],
        ['gstin', 'URP'],
        ['primaryBankName', 'Tamilnad Mercantile Bank'],
        ['primaryBankBranch', 'Nikol (Blueberry)'],
        ['primaryAccountType', 'Current'],
        ['primaryAccountNo', '60853 1837 108 915'],
        ['primaryIfsc', 'TMBL0000608'],
        ['primaryUpiId', 'sahajananddigitalnikol@tmb'],
        ['secondaryBankName', 'Federal Bank'],
        ['secondaryBankBranch', 'Neo Banking - Jupiter'],
        ['secondaryAccountType', 'Savings'],
        ['secondaryAccountNo', '77770117398715'],
        ['secondaryIfsc', 'FDRL0007777'],
        ['secondaryUpiId', '7574841101@jupiteraxis'],
        ['defaultPrintTemplate', 'IndianStyleTally'],
    ]
    sheets['CompanySettings'] = {'headers': set_headers, 'rows': set_rows}

    # 10. NumberSeries
    num_headers = ['SeriesName', 'Prefix', 'CurrentCount', 'PadZeros']
    num_rows = [
        ['SalesInvoice', 'SINV-', 1062, 4],
        ['Payment', 'PAY-', 1046, 4],
        ['JournalEntry', 'JV-', 1097, 4],
        ['Expense', 'EXP-', 1050, 4],
        ['Quote', 'SQUOT-', 1005, 4],
    ]
    sheets['NumberSeries'] = {'headers': num_headers, 'rows': num_rows}

    # Generate XLSX
    create_multi_sheet_xlsx(sheets, OUTPUT_XLSX)

    # Generate Individual CSVs
    os.makedirs(OUTPUT_CSV_DIR, exist_ok=True)
    for sname, sinfo in sheets.items():
        csv_file = os.path.join(OUTPUT_CSV_DIR, f"{sname}.csv")
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(sinfo['headers'])
            writer.writerows(sinfo['rows'])
    print(f"Generated CSV directory: {OUTPUT_CSV_DIR} ({len(sheets)} CSV files)")

if __name__ == '__main__':
    main()
