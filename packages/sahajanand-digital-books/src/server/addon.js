import { initDatabase } from './db.js';
import { syncFullJournalLedgers } from './accounting.js';

const APP_LOGO_URL = 'https://sahajananddigital.github.io/Google-Apps-Script-Projects/sahajanand-digital-books/assets/app-logo-120x120.png';
const APP_DOCS_URL = 'https://sahajananddigital.github.io/Google-Apps-Script-Projects/sahajanand-digital-books/';
const DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxJtXVSWXBJzSvDRPbXk0e3B7O4EAg56fusm7ZnTERmBTaq2AUBrcR3d7Qt_ZH2tBWLvw/exec';

/**
 * Homepage trigger for Google Sheets Workspace Add-on.
 * Called automatically when the add-on sidebar is opened in Google Sheets.
 *
 * @param {Object} e - Event object passed by Google Workspace
 * @returns {CardService.Card} The constructed CardService Card
 */
export function onSheetsHomepage(e) {
  try {
    if (typeof CardService === 'undefined') {
      return null;
    }

    const card = CardService.newCardBuilder();

    // Card Header
    const header = CardService.newCardHeader()
      .setTitle('Gurukul Books ERP')
      .setSubtitle('Invoicing & Accounting ERP')
      .setImageUrl(APP_LOGO_URL)
      .setImageStyle(CardService.ImageStyle.SQUARE);
    card.setHeader(header);

    // Section 1: Web App Launcher
    const launchSection = CardService.newCardSection()
      .setHeader('ERP Web Application');

    launchSection.addWidget(
      CardService.newTextParagraph().setText(
        'Open the full Gurukul Books web application to create invoices, record customer payments, manage items, and monitor double-entry balance sheets.'
      )
    );

    let webAppUrl = DEFAULT_WEBAPP_URL;
    try {
      if (typeof ScriptApp !== 'undefined' && ScriptApp.getService && ScriptApp.getService().getUrl) {
        const deployedUrl = ScriptApp.getService().getUrl();
        if (deployedUrl) {
          webAppUrl = deployedUrl;
        }
      }
    } catch (urlErr) {
      // Use DEFAULT_WEBAPP_URL
    }

    const launchButton = CardService.newTextButton()
      .setText('🚀 Open Gurukul Books Web App')
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(webAppUrl)
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
          .setOnClose(CardService.OnClose.NOTHING)
      );
    launchSection.addWidget(launchButton);
    card.addSection(launchSection);

    // Section 2: Quick Database Actions
    const toolsSection = CardService.newCardSection()
      .setHeader('Spreadsheet Operations');

    toolsSection.addWidget(
      CardService.newTextParagraph().setText(
        'Verify or repair schema headers, and synchronize General Ledger balances with active transactions.'
      )
    );

    const initAction = CardService.newAction().setFunctionName('onCardInitDatabase');
    const initBtn = CardService.newTextButton()
      .setText('⚙️ Initialize Sheets & Headers')
      .setOnClickAction(initAction);
    toolsSection.addWidget(initBtn);

    const auditAction = CardService.newAction().setFunctionName('onCardAuditLedgers');
    const auditBtn = CardService.newTextButton()
      .setText('🔄 Audit & Sync Ledgers')
      .setOnClickAction(auditAction);
    toolsSection.addWidget(auditBtn);

    card.addSection(toolsSection);

    // Section 3: Documentation & Help
    const helpSection = CardService.newCardSection()
      .setHeader('Documentation & Support');

    const docsBtn = CardService.newTextButton()
      .setText('📖 User Manual & Docs')
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(APP_DOCS_URL)
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
      );
    helpSection.addWidget(docsBtn);
    card.addSection(helpSection);

    return card.build();
  } catch (err) {
    if (typeof CardService !== 'undefined') {
      return CardService.newCardBuilder()
        .setHeader(CardService.newCardHeader().setTitle('Gurukul Books ERP'))
        .addSection(
          CardService.newCardSection().addWidget(
            CardService.newTextParagraph().setText('Error loading homepage: ' + (err.message || String(err)))
          )
        )
        .build();
    }
    return null;
  }
}

/**
 * CardService action callback: Initialize database tables & headers
 */
export function onCardInitDatabase() {
  try {
    initDatabase();
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('✅ Database sheets & headers initialized successfully!'))
      .build();
  } catch (err) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('❌ Error: ' + (err.message || String(err))))
      .build();
  }
}

/**
 * CardService action callback: Audit & synchronize ledgers
 */
export function onCardAuditLedgers() {
  try {
    syncFullJournalLedgers();
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('✅ General Ledger audit and sync completed!'))
      .build();
  } catch (err) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('❌ Error: ' + (err.message || String(err))))
      .build();
  }
}
