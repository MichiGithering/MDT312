// หน้าลูกค้า: สั่งอาหารและติดตามสถานะ
const state = {
  menu: [],
  orders: [],
  clearing: false,
  selected: null,
  quantity: 1,
  table: 1,
  sending: false,
};
const labels = {
  preparing: 'Preparing · รับออเดอร์แล้ว',
  cooking: 'Cooking · กำลังปรุง',
  done: 'Done · พร้อมเสิร์ฟ',
};
const money = (value) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
    Number(value)
  );
function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function foodIcon(name = '') {
  return /ต้ม|แกง|ซุป/.test(name)
    ? '🍲'
    : /ผัด|กะเพรา/.test(name)
      ? '🍛'
      : /น้ำ/.test(name)
        ? '🥤'
        : '🍽️';
}
function notify(text, error = false) {
  const el = document.getElementById('message');
  el.hidden = false;
  el.className = 'notice' + (error ? ' error' : '');
  el.textContent = text;
}

let socket;
let refreshVersion = 0;
let clearTarget = null;
function normalized(order) {
  return order.status === 'pending' ? 'preparing' : order.status;
}

function badge(status) {
  return node('span', 'badge ' + status, labels[status] || status);
}

function empty(target, text) {
  const el = node('div', 'empty');
  el.append(node('b', '', '♨'), node('span', '', text));
  target.append(el);
}


function selectedMenu() {
  return state.menu.find((item) => item.id === state.selected);
}

function renderSummary() {
  const item = selectedMenu();
  document.getElementById('selected-name').textContent = item
    ? item.name
    : 'เลือกอาหารจากเมนูด้านบน';
  document.getElementById('selected-price').textContent = item
    ? `${money(item.price)} / จาน`
    : 'คลิกเมนูที่อยากทานเพื่อเริ่มสั่ง';
  document.getElementById('quantity').textContent = state.quantity;
  document.getElementById('total').textContent = money(
    item ? (Math.round(Number(item.price) * 100) * state.quantity) / 100 : 0
  );
  document.getElementById('summary-table').textContent =
    `โต๊ะ ${String(state.table).padStart(2, '0')}`;
  document.getElementById('submit').disabled = !item || state.sending || state.clearing;
  document.getElementById('minus').disabled = state.quantity <= 1;
  document.getElementById('plus').disabled = state.quantity >= 20;
}

function renderMenu() {
  const grid = document.getElementById('menu');
  grid.replaceChildren();
  document.getElementById('menu-count').textContent = `${state.menu.length} เมนู`;
  for (const item of state.menu) {
    const button = node(
      'button',
      'menu-card' + (state.selected === item.id ? ' selected' : '')
    );
    button.type = 'button';
    button.setAttribute('aria-pressed', String(state.selected === item.id));
    button.setAttribute('aria-label', `เลือก ${item.name} ${money(item.price)}`);
    button.append(
      node('span', 'food-art', foodIcon(item.name)),
      node('strong', '', item.name)
    );
    const bottom = node('span', 'menu-bottom');
    bottom.append(
      node('span', '', money(item.price)),
      node('b', '', state.selected === item.id ? '✓' : '+')
    );
    button.append(bottom);
    button.onclick = () => {
      state.selected = item.id;
      renderMenu();
      renderSummary();
    };
    grid.append(button);
  }
  if (!state.menu.length) grid.append(node('p', 'empty', 'ยังไม่มีเมนูในขณะนี้'));
  renderSummary();
}

function renderCustomerOrders() {
  const mine = document.getElementById('customer-orders');
  mine.replaceChildren();
  const tableOrders = state.orders.filter((order) => order.table_no === state.table);
  document.getElementById('clear-table').textContent =
    `⌫ Clear โต๊ะ ${String(state.table).padStart(2, '0')}`;
  document.getElementById('clear-table').disabled =
    !tableOrders.length || state.clearing || state.sending;
  for (const order of tableOrders) {
    const status = normalized(order),
      card = node('article', 'customer-order'),
      head = node('div', 'customer-order-top');
    head.append(
      node('strong', '', `#${String(order.id).padStart(3, '0')} · ${order.menu_name}`),
      badge(status)
    );
    card.append(
      head,
      node(
        'p',
        '',
        `${order.quantity} จาน · ${money(order.total)} · ${status === 'done' ? 'อาหารพร้อมแล้ว รอรับความอร่อยได้เลย' : status === 'cooking' ? 'ครัวกำลังปรุงอาหารให้คุณ' : 'ครัวได้รับออเดอร์ของคุณแล้ว'}`
      )
    );
    const progress = node('div', 'progress');
    for (let i = 0; i < 3; i++)
      progress.append(
        node(
          'span',
          i <= ['preparing', 'cooking', 'done'].indexOf(status) ? 'filled' : ''
        )
      );
    card.append(progress);
    mine.append(card);
  }
  if (!tableOrders.length) empty(mine, 'ยังไม่มีออเดอร์สำหรับโต๊ะนี้ เลือกจานโปรดกันเลย');
}

function showClearDialog() {
  clearTarget = state.table;
  const orders = state.orders.filter((order) => order.table_no === clearTarget);
  if (!orders.length || state.clearing || state.sending) return;

  const unfinished = orders.filter((order) => normalized(order) !== 'done').length;
  document.getElementById('clear-title').textContent =
    `Clear โต๊ะ ${String(clearTarget).padStart(2, '0')}?`;
  document.getElementById('clear-description').textContent =
    `ล้าง ${orders.length} รายการออกจากหน้าลูกค้าของโต๊ะนี้ โดยรายการที่เสร็จแล้วยังอยู่ใน Done` +
    (unfinished
      ? ` (มี ${unfinished} รายการที่ยังไม่เสร็จ ซึ่งจะถูกลบโดยไม่เก็บประวัติ)`
      : '');
  document.getElementById('clear-dialog').showModal();
}

// -----------เริ่มต้น----------------
// แสดงเมนู
async function getMenu() {
  // complete this
  
  const response = await fetch('/api/menu');
  const content = await response.json();
  

  if (!response.ok) throw new Error(content.message || 'โหลดเมนูไม่สำเร็จ');
  return content;
}

// แสดงออเดอร์ทั้งหมดของทุกโต๊ะ
async function getOrders() {
  // complete this
    const response = await fetch('/api/orders');
  const content = await response.json();

  if (!response.ok) throw new Error(content.message || 'โหลดออเดอร์ไม่สำเร็จ');
  return content;
}

// ส่งออเดอร์ใหม่ไปยัง server
async function sendOrder(event) {
  event.preventDefault();
  if (!selectedMenu() || state.sending || state.clearing) return;
  state.sending = true;
  renderSummary();
  renderCustomerOrders();

  try {
    // ส่งข้อมูล state.table, state.selected, state.quntity ไปยัง server
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    table_no: state.table,
    menu_item_id: state.selected,
    quantity: state.quantity
  })
});
const content = await response.json();

    if (!response.ok) throw new Error(content.message || 'ส่งออเดอร์ไม่สำเร็จ');

    notify(
      `รับออเดอร์ #${String(content.id).padStart(3, '0')} แล้ว ติดตามสถานะได้ที่ออเดอร์ของโต๊ะคุณ`
    );
    await refresh();
  } catch (err) {
    notify(err.message, true);
  } finally {
    state.sending = false;
    renderSummary();
    renderCustomerOrders();
  }
}

// กด clear โต๊ะแล้วส่งสัญญาณไปยัง server เพื่อเคลียร์ออเดอร์ของโต๊ะนั้น
async function clearTable() {
  if (state.clearing || clearTarget === null) return;
  const table = clearTarget;
  state.clearing = true;
  document.getElementById('clear-dialog').close();
  renderSummary();
  renderCustomerOrders();

  try {
    // ส่งข้อมูล table number ไปยัง server เพื่อเคลียร์ออเดอร์ของโต๊ะนั้น
    const response = await fetch('/api/tables/clear', {
      method: 'POST',
      // complete this
headers: {
  'Content-Type': 'application/json'
},
body: JSON.stringify({
  tablenumber: table
})
});

const content = await response.json();


    if (!response.ok) throw new Error(content.message || 'Clear โต๊ะไม่สำเร็จ');

    notify(
      `Clear โต๊ะ ${String(table).padStart(2, '0')} แล้ว ${content.cleared_count} รายการ`
    );
    await refresh();
  } catch (err) {
    notify(err.message, true);
  } finally {
    state.clearing = false;
    clearTarget = null;
    renderSummary();
    renderCustomerOrders();
  }
}

// เชื่อมต่อกับ server ผ่าน socket.io เพื่อรับสัญญาณเมื่อมีการเปลี่ยนแปลงข้อมูล 
// เมื่อ server ส่งสัญญาณ data:changed ให้เรียก refresh() เพื่อโหลดข้อมูลล่าสุด
function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    // document.getElementById('connection').textContent = 'เชื่อมต่อสด';
    // ส่งสัญญาณไปยัง socket.on('request_update') ที่ server
    socket.emit('request_update');
  });

  socket.on('your_id', (data) => {
    console.log('Socket ID:', data.id);
  });

  // เมื่อ server ส่งสัญญาณ data:changed ให้เรียก refresh() เพื่อโหลดข้อมูลล่าสุด
  socket.on('data:changed', (data) => {
    console.log('Data changed:', data.entity);
    refresh();
  });

  socket.on('disconnect', () => {
    document.getElementById('connection').textContent = 'กำลังเชื่อมต่อใหม่';
  });
}

// เมื่อมีการเปลี่ยนแปลงข้อมูล ให้ส่งสัญญาณไปยัง server เพื่อขอโหลดข้อมูลล่าสุด
async function refresh() {
  refreshVersion++;
  const version = refreshVersion;
  try {
    // โหลดเมนูและออเดอร์ล่าสุดจาก server
    // complete this

const [menu, orders] = await Promise.all([
  getMenu(),
  getOrders()
]);

    // หากมี event ใหม่เข้ามาระหว่างโหลด ให้ใช้ผลของรอบล่าสุด
    if (version !== refreshVersion) return;

    state.menu = menu;
    state.orders = orders;
    if (!selectedMenu()) state.selected = null;
    renderMenu();
    renderCustomerOrders();
  } catch (err) {
    notify(err.message, true);
  }
}

function pageLoad() {
  for (let i = 1; i <= 5; i++) {
    const option = node('option', '', `โต๊ะ ${String(i).padStart(2, '0')}`);
    option.value = i;
    document.getElementById('table-select').append(option);
  }

  document.getElementById('table-select').onchange = (event) => {
    state.table = Number(event.target.value);
    renderSummary();
    renderCustomerOrders();
  };

  document.getElementById('minus').onclick = () => {
    state.quantity = Math.max(1, state.quantity - 1);
    renderSummary();
  };

  document.getElementById('plus').onclick = () => {
    state.quantity = Math.min(20, state.quantity + 1);
    renderSummary();
  };

  document.getElementById('order-form').onsubmit = sendOrder;
  document.getElementById('clear-table').onclick = showClearDialog;
  document.getElementById('confirm-clear').onclick = clearTable;
  document.getElementById('cancel-clear').onclick = () => {
    document.getElementById('clear-dialog').close();
  };

  renderSummary();
  refresh();
  connectSocket();
}

window.onload = pageLoad;
