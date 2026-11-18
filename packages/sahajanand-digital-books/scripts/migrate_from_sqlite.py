#!/usr/bin/env python3
"""
Frappe Books SQLite -> Google Apps Script Seed Data Exporter
Extracts accounts, parties, items, invoices, payments, journal entries, print templates, and settings.
"""

import json
import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../sahajanand_digital.books.db'))
OUTPUT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/server/seedData.json'))

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def main():
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    cur = conn.cursor()

    seed = {}

    # 1. Accounts (Chart of Accounts)
    cur.execute("SELECT name, rootType, parentAccount, accountType, isGroup FROM Account ORDER BY lft ASC")
    seed['accounts'] = cur.fetchall()

    # 2. Addresses
    cur.execute("SELECT name, addressLine1, addressLine2, city, state, country, postalCode, emailAddress, phone, addressDisplay FROM Address")
    addresses = {a['name']: a for a in cur.fetchall()}
    seed['addresses'] = addresses

    # 3. Parties (Customers / Suppliers)
    cur.execute("SELECT name, role, email, phone, address, defaultAccount, currency, outstandingAmount, gstType, gstin FROM Party")
    parties = cur.fetchall()
    for p in parties:
        addr = addresses.get(p.get('address'), {})
        p['addressLine1'] = addr.get('addressLine1', '')
        p['addressLine2'] = addr.get('addressLine2', '')
        p['city'] = addr.get('city', '')
        p['state'] = addr.get('state', '')
        p['country'] = addr.get('country', '')
        p['postalCode'] = addr.get('postalCode', '')
        p['addressDisplay'] = addr.get('addressDisplay', '')
    seed['customers'] = parties

    # 4. Items (Services & Products)
    cur.execute("SELECT name, itemCode, itemGroup, itemType, unit, rate, description, incomeAccount, expenseAccount, hsnCode FROM Item")
    seed['items'] = cur.fetchall()

    # 5. Sales Invoices
    cur.execute("""
        SELECT name, numberSeries, party, account, date, netTotal, discountAmount, discountPercent, 
               grandTotal, outstandingAmount, terms, submitted, cancelled 
        FROM SalesInvoice 
        ORDER BY date ASC
    """)
    invoices = cur.fetchall()

    # 6. Sales Invoice Items
    cur.execute("""
        SELECT name, item, description, rate, unit, quantity, amount, hsnCode, idx, parent 
        FROM SalesInvoiceItem 
        ORDER BY parent ASC, idx ASC
    """)
    invoice_items = cur.fetchall()
    
    # Map line items to invoices
    items_by_invoice = {}
    for itm in invoice_items:
        parent = itm['parent']
        if parent not in items_by_invoice:
            items_by_invoice[parent] = []
        items_by_invoice[parent].append(itm)

    for inv in invoices:
        inv['items'] = items_by_invoice.get(inv['name'], [])
    seed['invoices'] = invoices
    seed['invoice_items'] = invoice_items

    # 7. Payments & Allocations
    cur.execute("""
        SELECT name, numberSeries, party, date, paymentType, account, paymentAccount, paymentMethod, 
               referenceId, referenceDate, amount, submitted, cancelled 
        FROM Payment 
        ORDER BY date ASC
    """)
    payments = cur.fetchall()

    cur.execute("""
        SELECT name, referenceType, referenceName, amount, idx, parent 
        FROM PaymentFor 
        ORDER BY parent ASC, idx ASC
    """)
    allocations = cur.fetchall()
    alloc_by_payment = {}
    for alc in allocations:
        p_name = alc['parent']
        if p_name not in alloc_by_payment:
            alloc_by_payment[p_name] = []
        alloc_by_payment[p_name].append(alc)

    for pay in payments:
        pay['allocations'] = alloc_by_payment.get(pay['name'], [])
    seed['payments'] = payments

    # 8. Journal Entries & Splits
    cur.execute("""
        SELECT name, numberSeries, entryType, date, referenceNumber, referenceDate, userRemark, submitted, cancelled 
        FROM JournalEntry 
        ORDER BY date ASC
    """)
    journal_entries = cur.fetchall()

    cur.execute("""
        SELECT name, account, debit, credit, idx, parent 
        FROM JournalEntryAccount 
        ORDER BY parent ASC, idx ASC
    """)
    journal_splits = cur.fetchall()
    splits_by_jv = {}
    for split in journal_splits:
        p_name = split['parent']
        if p_name not in splits_by_jv:
            splits_by_jv[p_name] = []
        splits_by_jv[p_name].append(split)

    for jv in journal_entries:
        jv['splits'] = splits_by_jv.get(jv['name'], [])
    seed['journal_entries'] = journal_entries
    seed['journal_splits'] = journal_splits

    # 9. Print Templates
    cur.execute("SELECT name, type, template, height, width, isCustom FROM PrintTemplate")
    seed['print_templates'] = cur.fetchall()

    # 10. SingleValue Settings
    cur.execute("SELECT parent, fieldname, value FROM SingleValue")
    settings = {}
    for row in cur.fetchall():
        key = f"{row['parent']}_{row['fieldname']}"
        settings[key] = row['value']
    seed['settings'] = settings

    # 11. Number Series
    cur.execute("SELECT name, start, padZeros, referenceType, current FROM NumberSeries")
    seed['number_series'] = cur.fetchall()

    conn.close()

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(seed, f, indent=2, ensure_ascii=False)

    print(f"Successfully generated seed data at: {OUTPUT_PATH}")
    print(f"- Accounts: {len(seed['accounts'])}")
    print(f"- Customers: {len(seed['customers'])}")
    print(f"- Items: {len(seed['items'])}")
    print(f"- Invoices: {len(seed['invoices'])}")
    print(f"- Invoice Items: {len(seed['invoice_items'])}")
    print(f"- Payments: {len(seed['payments'])}")
    print(f"- Journal Entries: {len(seed['journal_entries'])}")
    print(f"- Journal Splits: {len(seed['journal_splits'])}")
    print(f"- Print Templates: {len(seed['print_templates'])}")
    print(f"- Settings: {len(seed['settings'])}")

if __name__ == '__main__':
    main()
