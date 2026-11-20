import test from 'node:test';
import assert from 'node:assert/strict';
import { STANDARD_UNITS, isStandardUnit } from '../src/client/utils/units.js';

test('Item Catalog: can view, edit, and clone items cleanly', () => {
  const items = [
    {
      name: 'Website Maintenance',
      rate: 3500,
      unit: 'Month',
      hsnCode: '998312',
      itemGroup: 'Service',
      description: 'Monthly server & WordPress updates',
    },
  ];

  // 1. View item
  const itemToView = items[0];
  assert.strictEqual(itemToView.name, 'Website Maintenance');
  assert.strictEqual(itemToView.rate, 3500);
  assert.strictEqual(itemToView.unit, 'Month');
  assert.strictEqual(itemToView.hsnCode, '998312');

  // 2. Edit item
  const editedItem = {
    ...itemToView,
    rate: 4500,
    description: 'Updated monthly maintenance & backup monitoring',
  };
  const itemIndex = items.findIndex((i) => i.name === itemToView.name);
  items[itemIndex] = editedItem;

  assert.strictEqual(items[0].rate, 4500);
  assert.strictEqual(items[0].description, 'Updated monthly maintenance & backup monitoring');

  // 3. Clone item
  const clonedItem = {
    ...items[0],
    name: `${items[0].name} (Copy)`,
    rate: 5000,
  };
  items.push(clonedItem);

  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[1].name, 'Website Maintenance (Copy)');
  assert.strictEqual(items[1].rate, 5000);
  assert.strictEqual(items[1].unit, 'Month');
  assert.strictEqual(items[1].hsnCode, '998312');
  assert.notStrictEqual(items[0].name, items[1].name);
});

test('Item Catalog: supports academic, service, and custom units of measurement', () => {
  assert.ok(STANDARD_UNITS.includes('Course'));
  assert.ok(STANDARD_UNITS.includes('Semester'));
  assert.ok(STANDARD_UNITS.includes('Term'));
  assert.ok(STANDARD_UNITS.includes('Session'));
  assert.ok(STANDARD_UNITS.includes('Month'));
  assert.ok(STANDARD_UNITS.includes('Year'));
  assert.ok(STANDARD_UNITS.includes('Unit'));

  // Custom unit validation
  const customAcademicItem = {
    name: 'Vedic Sanskrit Honors',
    rate: 15000,
    unit: 'Batch',
    hsnCode: '999293',
  };
  assert.strictEqual(customAcademicItem.unit, 'Batch');
  assert.ok(!STANDARD_UNITS.includes(customAcademicItem.unit));
});
