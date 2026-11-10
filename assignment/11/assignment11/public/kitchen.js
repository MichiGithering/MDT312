// หน้าครัว: ดูคิวและเปลี่ยนสถานะอาหาร
const state = { orders: [], history: [], filter: 'all' };
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


function kitchenOrders() {
  const orders = new Map(state.orders.map((order) => [order.id, order]));
  for (const order of state.history) {
    if (normalized(order) === 'done' && !orders.has(order.id)) {
      orders.set(order.id, order);
    }
  }
  return [...orders.values()].sort((a, b) => b.id - a.id);
}

function renderKitchenOrders() {
  const kitchen = kitchenOrders();
  const stats = document.getElementById('stats');
  stats.replaceChildren();
  for (const [status, icon] of [
    ['preparing', '📋'],
    ['cooking', '🔥'],
    ['done', '✓'],
  ]) {
    const card = node('div', 'stat ' + status);
    card.append(
      node('span', '', `${icon} ${status[0].toUpperCase() + status.slice(1)}`),
      node('strong', '', kitchen.filter((o) => normalized(o) === status).length)
    );
    stats.append(card);
  }
  const queue = document.getElementById('orders');
  queue.replaceChildren();
  const orders = kitchen.filter(
    (o) => state.filter === 'all' || normalized(o) === state.filter
  );
  for (const order of orders) {
    const status = normalized(order),
      card = node('article', 'ticket'),
      head = node('div', 'ticket-header'),
      title = node('div', 'ticket-id', `โต๊ะ ${String(order.table_no).padStart(2, '0')}`);
    title.append(node('small', '', `#${String(order.id).padStart(3, '0')}`));
    head.append(title, badge(status));
    const food = node('div', 'ticket-food'),
      description = node('div');
    description.append(
      node('strong', '', order.menu_name),
      node('small', '', `${order.quantity} จาน · ${money(order.total)}`)
    );
    food.append(node('span', 'mini-icon', foodIcon(order.menu_name)), description);
    const foot = node('div', 'ticket-footer');
    const time = new Date(order.created_at);
    foot.append(
      node(
        'span',
        '',
        `◷ ${Number.isNaN(time.getTime()) ? '' : time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`
      )
    );
    if (status !== 'done') {
      const button = node(
        'button',
        'action',
        status === 'preparing' ? '🔥 เริ่มปรุง · Cooking' : '✓ พร้อมเสิร์ฟ · Done'
      );
      button.onclick = async () => {
        button.disabled = true;
        try {
          const nextStatus = status === 'preparing' ? 'cooking' : 'done';
          await updateOrderStatus(order.id, nextStatus);
          await refresh();
        } catch (err) {
          notify(err.message, true);
          button.disabled = false;
        }
      };
      foot.append(button);
    } else foot.append(node('span', 'done-note', '✓ ส่งความอร่อยแล้ว'));
    card.append(head, food, foot);
    queue.append(card);
  }
  if (!orders.length)
    empty(
      queue,
      state.filter === 'all'
        ? 'ครัวพร้อมแล้ว รอรับออเดอร์แรกของคุณ'
        : 'ยังไม่มีออเดอร์ในสถานะนี้'
    );
}

function renderHistory() {
  const list = document.getElementById('order-history');
  list.replaceChildren();
  document.getElementById('history-count').textContent = `${state.history.length} รายการ`;
  for (const order of state.history) {
    const card = node('article', 'history-item');
    const head = node('div', 'customer-order-top');
    head.append(
      node(
        'strong',
        '',
        `#${String(order.id).padStart(3, '0')} · โต๊ะ ${String(order.table_no).padStart(2, '0')}`
      ),
      badge(normalized(order))
    );
    card.append(
      head,
      node('p', '', `${order.menu_name} · ${order.quantity} จาน · ${money(order.total)}`)
    );
    const created = new Date(order.created_at).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    const completed = order.done_at
      ? new Date(order.done_at).toLocaleString('th-TH', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'ไม่ทราบเวลา (ข้อมูลเดิม)';
    card.append(node('small', '', `สั่ง ${created} · Done ${completed}`));
    list.append(card);
  }
  if (!state.history.length) empty(list, 'ยังไม่มีประวัติการสั่ง');
}

// -----------เริ่มต้น----------------
// โหลดออเดอร์ทั้งหมดของทุกโต๊ะ
async function getOrders() {
  // complete this
      const response = await fetch('/api/orders');
      const content = await response.json();

  if (!response.ok) throw new Error(content.message || 'โหลดออเดอร์ไม่สำเร็จ');
  return content;
}

// เชื่อมต่อกับ server ผ่าน socket.io เพื่อรับสัญญาณเมื่อมีการเปลี่ยนแปลงข้อมูล
function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    document.getElementById('connection').textContent = 'เชื่อมต่อสด';
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

// โหลดประวัติออเดอร์ Done จากตาราง order_history โดยตรง
async function getOrderHistory() {
  // complete this
  const response = await fetch('/api/orders-history')
      const content = await response.json();

  if (!response.ok) throw new Error(content.message || 'โหลดประวัติไม่สำเร็จ');
  return content;
}

// ส่งคำสั่งเปลี่ยนสถานะออเดอร์ไปยัง server เช่น จาก preparing → cooking หรือ cooking → done
async function updateOrderStatus(id, status) {
  const response = await fetch('/api/orders/status', {
    method: 'POST',
    // ส่ง id และ status ไปยัง server
    // complete this
    header:{'Content-Type':'application/json'}, body:JSON.stringify({id: id,status: status})});
  
    const content = await response.json();

  if (!response.ok) throw new Error(content.message || 'เปลี่ยนสถานะไม่สำเร็จ');
  return content;
}

function requestUpdate() {
  if (socket && socket.connected) {
    socket.emit('request_update');
  } else {
    refresh();
  }
}

// โหลดออเดอร์และประวัติออเดอร์ล่าสุดจาก server และแสดงผลในหน้าครัว
async function refresh() {
  refreshVersion++;
  const version = refreshVersion;
  try {
    // โหลดออเดอร์และประวัติออเดอร์ล่าสุดจาก server
    // complete this
const [orders, history] = await Promise.all([
  getOrders(),
  getOrderHistory()
]);
    
    // หากมี event ใหม่เข้ามาระหว่างโหลด ให้ใช้ผลของรอบล่าสุด
    if (version !== refreshVersion) return;

    state.orders = orders;
    state.history = history;
    renderKitchenOrders();
    renderHistory();
  } catch (err) {
    notify(err.message, true);
  }
}

function pageLoad() {
  document.getElementById('filters').onclick = (event) => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter;
    for (const el of document.getElementById('filters').querySelectorAll('button')) {
      el.classList.toggle('active', el === button);
    }
    renderKitchenOrders();
  };

  document.getElementById('refresh').onclick = requestUpdate;
  refresh();
  connectSocket();
}

window.onload = pageLoad;
