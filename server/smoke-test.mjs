const base = 'http://localhost:4000/api';
const j = (r) => r.json();

const login = await fetch(`${base}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
}).then(j);
const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` };
console.log('login:', login.user.email);

const { categories } = await fetch(`${base}/categories`, { headers: h }).then(j);
console.log('categories:', categories.length);
const expenseCat = categories.find((c) => c.type === 'expense');
const incomeCat = categories.find((c) => c.type === 'income');

const tx1 = await fetch(`${base}/transactions`, {
  method: 'POST', headers: h,
  body: JSON.stringify({ categoryId: expenseCat.id, amount: 42.5, type: 'expense', description: 'Lunch', date: '2026-07-22' }),
}).then(j);
console.log('created expense:', tx1.transaction?.amount, tx1.transaction?.category?.name);

const tx2 = await fetch(`${base}/transactions`, {
  method: 'POST', headers: h,
  body: JSON.stringify({ categoryId: incomeCat.id, amount: 3000, type: 'income', description: 'July salary', date: '2026-07-01' }),
}).then(j);
console.log('created income:', tx2.transaction?.amount);

const upd = await fetch(`${base}/transactions/${tx1.transaction.id}`, {
  method: 'PUT', headers: h,
  body: JSON.stringify({ categoryId: expenseCat.id, amount: 45, type: 'expense', description: 'Lunch updated', date: '2026-07-22' }),
}).then(j);
console.log('updated:', upd.transaction?.amount, upd.transaction?.description);

const list = await fetch(`${base}/transactions?from=2026-07-01&to=2026-07-31`, { headers: h }).then(j);
console.log('list:', list.total, 'items, page', list.page);

const sum = await fetch(`${base}/analytics/summary?month=2026-07`, { headers: h }).then(j);
console.log('summary:', JSON.stringify(sum));

const byCat = await fetch(`${base}/analytics/by-category?month=2026-07`, { headers: h }).then(j);
console.log('by-category:', byCat.categories.map((c) => `${c.name}=${c.total}`).join(', '));

const trend = await fetch(`${base}/analytics/trend?months=3`, { headers: h }).then(j);
console.log('trend:', JSON.stringify(trend.trend));

const bad = await fetch(`${base}/transactions`, {
  method: 'POST', headers: h,
  body: JSON.stringify({ categoryId: 'not-a-uuid', amount: -5, type: 'expense', date: 'bad' }),
});
console.log('validation status:', bad.status, JSON.stringify((await bad.json()).details?.length, null, 0), 'issues');

const noAuth = await fetch(`${base}/transactions`);
console.log('no-auth status:', noAuth.status);

const del = await fetch(`${base}/transactions/${tx1.transaction.id}`, { method: 'DELETE', headers: h });
console.log('delete status:', del.status);
