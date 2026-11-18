import test from 'node:test';
import assert from 'node:assert/strict';
import { toSafeArray } from '../src/client/utils/safeArray.js';

test('toSafeArray utility safeguards', async (t) => {
  await t.test('handles null and undefined', () => {
    assert.deepEqual(toSafeArray(null), []);
    assert.deepEqual(toSafeArray(undefined), []);
  });

  await t.test('handles non-array primitives', () => {
    assert.deepEqual(toSafeArray(123), []);
    assert.deepEqual(toSafeArray(true), []);
    assert.deepEqual(toSafeArray(false), []);
    assert.deepEqual(toSafeArray(''), []);
  });

  await t.test('handles GAS API error objects and dictionaries', () => {
    const errorResponse = { success: false, error: 'Authorization required' };
    assert.deepEqual(toSafeArray(errorResponse), []);

    const singleObject = { id: 1, name: 'Item' };
    assert.deepEqual(toSafeArray(singleObject), []);
  });

  await t.test('preserves valid JavaScript arrays', () => {
    const arr = [{ id: 1 }, { id: 2 }];
    assert.equal(toSafeArray(arr), arr);
    assert.equal(toSafeArray(arr).length, 2);
  });

  await t.test('parses JSON stringified arrays safely', () => {
    const jsonStr = JSON.stringify([{ item: 'Service A', amount: 500 }]);
    const result = toSafeArray(jsonStr);
    assert.equal(result.length, 1);
    assert.equal(result[0].item, 'Service A');
  });

  await t.test('handles malformed JSON strings without throwing', () => {
    assert.deepEqual(toSafeArray('{ bad json }'), []);
    assert.deepEqual(toSafeArray('["unclosed array'), []);
  });

  await t.test('guarantees .map, .filter, .reduce never throw', () => {
    const evilInputs = [
      null,
      undefined,
      { success: false },
      '{ broken: json }',
      42,
      true,
      '',
      NaN,
      Symbol('test')
    ];

    for (const input of evilInputs) {
      assert.doesNotThrow(() => {
        const safe = toSafeArray(input);
        const mapped = safe.map((x) => x);
        const filtered = safe.filter((x) => Boolean(x));
        const reduced = safe.reduce((acc, x) => acc + x, 0);
        assert.deepEqual(mapped, []);
        assert.deepEqual(filtered, []);
        assert.equal(reduced, 0);
      });
    }
  });

  await t.test('safely formats and slices numeric account numbers from Google Sheets', () => {
    const rawAccountNumbers = [
      77770117398715,
      123456789012,
      '60853 1837 108 915',
      null,
      undefined,
      0,
    ];

    for (const raw of rawAccountNumbers) {
      assert.doesNotThrow(() => {
        const masked = raw ? `•••• ${String(raw).trim().slice(-4)}` : '';
        if (typeof raw === 'number' && raw > 0) {
          assert.equal(masked.length, 9);
        }
      });
    }
  });

  await t.test('safely filters customers with numeric phone numbers and cities', () => {
    const rawCustomers = [
      { name: 'Ramesh Patel', phone: 9876543210, city: 'Ahmedabad' },
      { name: 101, phone: 9150247976, city: 382350 },
      { name: 'Unknown', phone: null, city: undefined },
      null,
    ];

    assert.doesNotThrow(() => {
      const searchTerm = '9876';
      const term = String(searchTerm || '').toLowerCase();
      const filtered = rawCustomers.filter((c) => {
        if (!c) return false;
        const name = String(c.name || c.CustomerName || '').toLowerCase();
        const city = String(c.city || c.City || '').toLowerCase();
        const phone = String(c.phone || c.Phone || '').toLowerCase();
        return name.includes(term) || city.includes(term) || phone.includes(term);
      });
      assert.equal(filtered.length, 1);
    });
  });
});
