#!/usr/bin/env python3
"""
Generate Gurukul_Books_Sample_Template.xlsx
Pre-formatted multi-sheet Excel template for users to fill out for migration.
"""

import os
import zipfile
import io
import json

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
            rows = sheets_dict[name]
            sheet_xml = build_worksheet_xml(rows)
            zf.writestr(f'xl/worksheets/sheet{i}.xml', sheet_xml)

    with open(output_path, 'wb') as f:
        f.write(buf.getvalue())
    return buf.getvalue()

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pkg_dir = os.path.dirname(script_dir)

    sheets = {
        "Invoices": [
            ["InvoiceNo", "Date", "CustomerName", "DebitAccount", "NetTotal", "DiscountAmount", "GrandTotal", "OutstandingAmount", "Status", "Terms", "DueDate"],
            ["SINV-1001", "2026-04-01", "Rahul Sharma", "Debtors", 25000, 0, 25000, 0, "Paid", "Full course fee received on registration", "2026-04-01"],
            ["SINV-1002", "2026-04-05", "Priya Patel", "Debtors", 40000, 2000, 38000, 18000, "Submitted", "Installment 1 paid, Installment 2 due in 30 days", "2026-05-05"],
            ["SINV-1003", "2026-04-10", "Amit Verma", "Debtors", 15000, 0, 15000, 15000, "Submitted", "Payment due on batch commencement", "2026-04-15"],
        ],
        "InvoiceItems": [
            ["ID", "InvoiceNo", "ItemName", "Description", "HSNCode", "Quantity", "Rate", "Amount"],
            ["ITM-001", "SINV-1001", "Full Stack Web Development", "6-Month Diploma Program", "998312", 1, 25000, 25000],
            ["ITM-002", "SINV-1002", "Data Science & AI Bootcamp", "1-Year Master Certification", "999293", 1, 40000, 40000],
            ["ITM-003", "SINV-1003", "UI/UX Design Essentials", "3-Month Intensive Course", "998312", 1, 15000, 15000],
        ],
        "Payments": [
            ["PaymentNo", "Date", "CustomerName", "InvoiceNo", "Amount", "PaymentMethod", "Account", "ReferenceTxnId", "CreatedAt"],
            ["PAY-1001", "2026-04-01", "Rahul Sharma", "SINV-1001", 25000, "UPI", "Primary Bank", "UPI8374829104", "2026-04-01T10:00:00Z"],
            ["PAY-1002", "2026-04-05", "Priya Patel", "SINV-1002", 20000, "Transfer", "Secondary Bank", "NEFT982736182", "2026-04-05T14:30:00Z"],
        ],
        "Expenses": [
            ["ExpenseNo", "Date", "Category", "PaidVia", "Amount", "Description", "ReferenceTxnId", "CreatedAt"],
            ["EXP-1001", "2026-04-02", "Office Rent", "Primary Bank", 25000, "Campus facility rental for April", "RENT-APR-2026", "2026-04-02T11:00:00Z"],
            ["EXP-1002", "2026-04-05", "Software Expenses", "Primary Bank", 16331.53, "Annual LMS and Theme Licenses", "S51398671", "2026-04-05T12:00:00Z"],
            ["EXP-1003", "2026-04-10", "Salary", "Primary Bank", 42000, "Faculty monthly remuneration", "SAL-APR-01", "2026-04-10T16:00:00Z"],
            ["EXP-1004", "2026-04-12", "Cloud Server Infrastructure", "Primary Bank", 3500, "Cloud compute server hosting", "INV-HOST-9821", "2026-04-12T09:00:00Z"],
        ],
        "Customers": [
            ["CustomerName", "Email", "Phone", "AddressLine1", "AddressLine2", "City", "State", "PostalCode", "GSTIN", "GSTType", "Currency", "OutstandingDue"],
            ["Rahul Sharma", "rahul.sharma@example.com", "+91 9876543210", "402 Shivalik Heights", "Drive-In Road", "Ahmedabad", "Gujarat", "380054", "", "Unregistered", "INR", 0],
            ["Priya Patel", "priya.p@example.com", "+91 9824012345", "B-12 Science City Road", "Sola", "Ahmedabad", "Gujarat", "380060", "", "Unregistered", "INR", 18000],
            ["Amit Verma", "amit.v@example.com", "+91 9712398765", "Flat 101, Green Acres", "Vastrapur", "Ahmedabad", "Gujarat", "380015", "", "Unregistered", "INR", 15000],
        ],
        "Items": [
            ["ItemName", "ItemCode", "ItemGroup", "ItemType", "Unit", "Rate", "Description", "IncomeAccount", "ExpenseAccount", "HSNCode"],
            ["Full Stack Web Development", "COURSE-FSWD", "Education", "Service", "Course", 25000, "6-Month Full Stack Web Development Diploma", "Service", "Cost of Goods Sold", "998312"],
            ["Data Science & AI Bootcamp", "COURSE-DSAI", "Education", "Service", "Course", 40000, "1-Year Data Science and AI Master Program", "Service", "Cost of Goods Sold", "999293"],
            ["UI/UX Design Essentials", "COURSE-UIUX", "Education", "Service", "Course", 15000, "3-Month Figma & Product Design Certification", "Service", "Cost of Goods Sold", "998312"],
            ["Cloud Server Hosting", "SRV-HOST", "Technology", "Service", "Year", 4500, "Managed Dedicated VPS Cloud Hosting", "Service", "Cost of Goods Sold", "998312"],
        ],
        "ChartOfAccounts": [
            ["AccountName", "RootType", "ParentAccount", "AccountType", "IsGroup"],
            ["Application of Funds (Assets)", "Asset", "", "", 1],
            ["Current Assets", "Asset", "Application of Funds (Assets)", "", 1],
            ["Bank Accounts", "Asset", "Current Assets", "Bank", 1],
            ["Primary Bank", "Asset", "Bank Accounts", "Bank", 0],
            ["Secondary Bank", "Asset", "Bank Accounts", "Bank", 0],
            ["Operational Bank", "Asset", "Bank Accounts", "Bank", 0],
            ["Cash In Hand", "Asset", "Current Assets", "Cash", 1],
            ["Cash", "Asset", "Cash In Hand", "Cash", 0],
            ["Accounts Receivable", "Asset", "Current Assets", "Receivable", 1],
            ["Debtors", "Asset", "Accounts Receivable", "Receivable", 0],
            ["Fixed Assets", "Asset", "Application of Funds (Assets)", "", 1],
            ["Computers", "Asset", "Fixed Assets", "Fixed Asset", 0],
            ["Furnitures and Fixtures", "Asset", "Fixed Assets", "Fixed Asset", 0],
            ["Source of Funds (Liabilities)", "Liability", "", "", 1],
            ["Current Liabilities", "Liability", "Source of Funds (Liabilities)", "", 1],
            ["Accounts Payable", "Liability", "Current Liabilities", "Payable", 1],
            ["Creditors", "Liability", "Accounts Payable", "Payable", 0],
            ["Equity", "Equity", "", "", 1],
            ["Capital Account", "Equity", "Equity", "", 0],
            ["Income", "Income", "", "", 1],
            ["Direct Income", "Income", "Income", "", 1],
            ["Service", "Income", "Direct Income", "Service", 0],
            ["Expenses", "Expense", "", "", 1],
            ["Direct Expenses", "Expense", "Expenses", "", 1],
            ["Software Expenses", "Expense", "Direct Expenses", "Expense", 0],
            ["Office Rent", "Expense", "Direct Expenses", "Expense", 0],
            ["Salary", "Expense", "Direct Expenses", "Expense", 0],
            ["Cloud Server Infrastructure", "Expense", "Direct Expenses", "Expense", 0],
        ],
        "JournalEntries": [
            ["EntryNo", "Date", "EntryType", "ReferenceNumber", "ReferenceDate", "UserRemark", "CreatedAt"],
            ["JV-1001", "2026-04-01", "Journal Entry", "OPENING-01", "2026-04-01", "Initial capital and opening cash", "2026-04-01T09:00:00Z"],
        ],
        "JournalLedgers": [
            ["ID", "EntryNo", "AccountName", "Debit", "Credit"],
            ["JL-001", "JV-1001", "Primary Bank", 50000, 0],
            ["JL-002", "JV-1001", "Capital Account", 0, 50000],
        ],
        "CompanySettings": [
            ["Key", "Value"],
            ["companyName", "Sample Educational Academy"],
            ["organizationType", "institute"],
            ["primaryBankName", "Primary Bank"],
            ["secondaryBankName", "Secondary Bank"],
            ["currency", "INR"],
        ],
        "NumberSeries": [
            ["SeriesName", "Prefix", "CurrentCount", "PadZeros"],
            ["Invoice", "REC-", 1004, 4],
            ["Payment", "PAY-", 1003, 4],
            ["Expense", "EXP-", 1005, 4],
            ["JournalEntry", "JV-", 1002, 4],
        ]
    }

    out_xlsx = os.path.join(pkg_dir, "Sample_Migration_Template.xlsx")
    bytes_data = create_excel_workbook(sheets, out_xlsx)
    print(f"Generated Excel Template: {out_xlsx} ({len(bytes_data)} bytes)")

    # Also output as json template for client embedding
    json_path = os.path.join(pkg_dir, "src", "client", "utils", "sampleTemplateData.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(sheets, f, indent=2)
    print(f"Generated JSON Schema: {json_path}")

    # Generate sampleExcelBase64.js
    import base64
    b64_str = base64.b64encode(bytes_data).decode('ascii')
    js_b64_path = os.path.join(pkg_dir, "src", "client", "utils", "sampleExcelBase64.js")
    with open(js_b64_path, 'w', encoding='utf-8') as f:
        f.write(f"// Auto-generated generic sample Excel migration workbook in Base64\nexport const SAMPLE_EXCEL_B64 = '{b64_str}';\n")
    print(f"Updated Base64 Excel asset: {js_b64_path}")

    # Clean up temporary disk xlsx
    if os.path.exists(out_xlsx):
        os.remove(out_xlsx)
        print("Cleaned up temporary Sample_Migration_Template.xlsx")

if __name__ == '__main__':
    main()
