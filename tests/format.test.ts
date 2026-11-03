import test from 'node:test';
import assert from 'node:assert/strict';
import {number,percent} from '../lib/format';
test('Indian formatting preserves signed deltas and missing values',()=>{assert.equal(number(1234567),'12,34,567');assert.equal(percent(null),'—');assert.equal(percent(2),'↑ +2.0%');assert.equal(percent(-2),'↓ -2.0%')});
