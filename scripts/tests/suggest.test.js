// Unit-tests the quick-add suggestion engine. The functions are pure, so they're
// sliced straight out of project/store.jsx and evaluated on their own.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const src = fs.readFileSync(path.join(ROOT, 'project/store.jsx'), 'utf8');

const slice = (from, to) => {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error('could not slice ' + from + ' .. ' + to);
  return src.slice(a, b);
};
const code = slice('function parseKey(k) {', '\nfunction addDays')
           + slice('function daysApart(', 'const StoreContext');
const ctx = { Math, Object, Map, Set, Number, Date, Array, String };
vm.createContext(ctx);
vm.runInContext(code, ctx);
const { suggestTasks, medianOf, daysApart } = ctx;

const task = (title, extra) => Object.assign({ id: title + Math.random(), title, totalBoxes: 1 }, extra);

module.exports = async function run(t) {
  t.eq(daysApart('2026-09-01', '2026-09-08'), 7, 'daysApart counts calendar days');
  t.eq(medianOf([5, 7, 9]), 7, 'medianOf picks the middle gap');
  t.eq(medianOf([6, 8]), 7, 'medianOf averages an even count');

  // laundry every 7 days, last done 7 days ago -> due
  const data = {
    days: {
      '2026-08-18': [task('Laundry', { category: 'personal', totalBoxes: 2 })],
      '2026-08-25': [task('Laundry', { category: 'personal', totalBoxes: 2 })],
      '2026-09-01': [task('Laundry', { category: 'personal', totalBoxes: 2 }),
                     task('Pay rent', { category: 'personal' })],
      '2026-09-02': [task('One-off thing')],
      '2026-09-03': [task('Standup', { category: 'work' })],
      '2026-09-04': [task('Standup', { category: 'work' })],
      '2026-09-05': [task('Standup', { category: 'work' })],
      '2026-09-06': [task('Water plants')],
      '2026-08-23': [task('Water plants')],
      '2026-09-07': [task('From a group', { fromGroupId: 'g1' })],
      // added twice in a row last spring and never again: a one-day cadence, but
      // long abandoned — it must not sit at the top of the list forever
      '2026-03-01': [task('Old habit')],
      '2026-03-02': [task('Old habit')],
    },
  };

  const s = suggestTasks(data, '2026-09-08', 8);
  const byTitle = Object.fromEntries(s.map(x => [x.title, x]));

  t.ok(byTitle['Laundry'], 'a repeating task is suggested');
  t.eq(byTitle['Laundry'].cadence, 7, 'its cadence is the median gap');
  t.eq(byTitle['Laundry'].due, true, 'it is due again 7 days later');
  t.eq(byTitle['Laundry'].category, 'personal', 'category comes from its history');
  t.eq(byTitle['Laundry'].totalBoxes, 2, 'box count comes from its history');

  t.ok(!byTitle['One-off thing'], 'a task seen once is not suggested');
  t.ok(!byTitle['Pay rent'], 'a task seen once is not suggested even beside repeats');
  t.ok(!byTitle['From a group'], 'group-applied tasks are left to "Apply a group"');

  t.eq(byTitle['Standup'].due, true, 'a daily task missed for 3 days is due again');
  t.ok(byTitle['Water plants'] && !byTitle['Water plants'].due,
       'a fortnightly task done 2 days ago is offered but not due');
  t.ok(s.indexOf(byTitle['Water plants']) > s.indexOf(byTitle['Laundry']),
       'due items rank above merely frequent ones');
  t.ok(!byTitle['Old habit'], 'a habit abandoned months ago is dropped');

  // already on the target day -> not offered again
  const dup = JSON.parse(JSON.stringify(data));
  dup.days['2026-09-08'] = [task('laundry')];
  t.ok(!suggestTasks(dup, '2026-09-08', 8).some(x => x.id === 'laundry'),
       'a task already on the day is not suggested (case-insensitive)');

  // no history at all
  t.eq(suggestTasks({ days: {} }, '2026-09-08', 8).length, 0, 'empty history suggests nothing');
  t.eq(suggestTasks({}, '2026-09-08', 8).length, 0, 'missing days object is handled');
};
