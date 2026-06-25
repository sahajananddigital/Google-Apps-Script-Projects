import { initDatabase } from './todos.js';

export const doGet = () => {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Todo Reminder')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
};

export const showTodoDialog = () => {
  initDatabase();

  const html = HtmlService.createHtmlOutputFromFile('index')
    .setWidth(520)
    .setHeight(640);

  SpreadsheetApp.getUi().showModalDialog(html, 'Todo Reminder');
};
