import test from 'node:test';
import assert from 'node:assert/strict';
import {number,percent} from '../lib/format';
test('Indian formatting preserves signed deltas and missing values',()=>{assert.equal(number(1234567),'12,34,567');assert.equal(percent(null),'—');assert.equal(percent(2),'↑ +2.0%');assert.equal(percent(-2),'↓ -2.0%')});
import {gapScale} from '../lib/view/gap';
test('gap visualization preserves negative ranges and excludes missing actuals',()=>{const s=gapScale('-2–1%','-1%');assert.ok(s);assert.equal(s.value,-1);assert.ok(s.actual>s.start);assert.equal(gapScale('2–3%','not_disclosed'),null);assert.equal(gapScale('3–2%','1%'),null)});
