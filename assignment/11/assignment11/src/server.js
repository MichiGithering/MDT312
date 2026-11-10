// 1. Import modules: Week 9 (Node.js) และ Week 10 (Express / Socket.IO)
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const hostname = '127.0.0.1';
const port = 3000;

// 2. Middleware: Week 10 ใช้ express.static และ bodyParser ก่อน route
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 3. เชื่อมต่อ MySQL: Week 11 ใช้ createConnection และ connect
// ใช้ mysql2 เพื่อรองรับ MySQL 8.4 แต่ใช้ callback แบบเดียวกับสไลด์
// config: host, port, user, password, database ให้เป็นข้อมูลของ MySQL ที่ติดตั้งในเครื่องของแต่ละคน
const databaseConfig = {
  host: '127.0.0.1',
  port: 3306,
  // complete this
  user: "root",
  password:"",
  database: 'mydb'
};

// complete this
const con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password:"",
  database:"mydb"
})

// Week 12: con.query(sql, callback) ครอบด้วย Promise ตาม Week 9
// ใช้ mysql.format() ใส่ค่าแทน ? ก่อนส่ง SQL เข้า queryDB
// ทุกคำสั่งใช้ con ตัวเดียว สำหรับ lab เบื้องต้น
const queryDB = (sql) => {
  // complete this
  return new Promise((resolve,reject) => {
    con.query(sql, (err,result, fields) => {
      if(err) reject(err);
      else
        resolve(result)
    })
  })
};

// 4. Socket.IO: Week 10 ใช้ connection, socket.on, socket.emit และ io.emit
io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  // ส่งกลับเฉพาะ browser ที่เพิ่งเชื่อมต่อ เหมือนตัวอย่าง your_id ในสไลด์
  socket.emit('your_id', { id: socket.id });

  // Browser ส่ง request_update เมื่อต้องการโหลดข้อมูลล่าสุด
  socket.on('request_update', () => {
    socket.emit('data:changed', { entity: 'all' });
  });

  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
  });
});

// ฟังก์ชันตรวจข้อมูล
function positiveInteger(value, max = 2147483647) {
  return (
    typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= max
  );
}

// สร้างตารางที่ยังไม่มี โดยไม่ลบข้อมูลเดิม
async function initializeTables() {
  await queryDB(
    `CREATE TABLE IF NOT EXISTS menu_items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, price DECIMAL(8,2) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  await queryDB(`CREATE TABLE IF NOT EXISTS current_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_no INT NOT NULL,
  menu_item_id INT NOT NULL,
  menu_name VARCHAR(100) NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL,
  quantity INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'preparing',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX current_table_no (table_no),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // ใช้ id เดียวกับ current_orders แต่ไม่ผูก FK เพื่อให้ Clear โต๊ะได้
  await queryDB(`CREATE TABLE IF NOT EXISTS order_history (
  id INT PRIMARY KEY,
  table_no INT NOT NULL,
  menu_item_id INT NOT NULL,
  menu_name VARCHAR(100) NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL,
  quantity INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'done',
  created_at TIMESTAMP NOT NULL,
  done_at TIMESTAMP NULL DEFAULT NULL,
  INDEX history_table_no (table_no),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  const rows = await queryDB('SELECT COUNT(*) AS count FROM menu_items');
  if (rows[0].count === 0) {
    await queryDB(
      mysql.format('INSERT INTO menu_items (name, price) VALUES (?, ?), (?, ?), (?, ?)', [
        'ข้าวผัด',
        50,
        'ผัดกะเพรา',
        60,
        'ต้มยำ',
        80,
      ])
    );
  }
}

// เริ่ม server หลังเชื่อมต่อ MySQL และสร้างตารางสำเร็จ
con.on('error', (err) => {
  console.error('MySQL:', err.message);
});

con.connect(async (err) => {
  if (err) {
    console.error('เชื่อมต่อ MySQL ไม่สำเร็จ:', err.message);
    con.destroy();
    process.exitCode = 1;
    return;
  }
  try {
    await initializeTables();
    console.log('MySQL connected; tables ready');
    // Express และ Socket.IO ใช้ HTTP server ตัวเดียวกัน
    server.listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}/`);
    });
  } catch (error) {
    console.error('สร้างตารางไม่สำเร็จ:', error.message);
    con.end();
    process.exitCode = 1;
  }
});

// HTTP API: ใช้ GET อ่านข้อมูล และ POST ส่งคำสั่งเพิ่ม/แก้ไข/ลบ
// SQL ภายใน route ยังใช้ SELECT, INSERT, UPDATE และ DELETE ตามหน้าที่

// SELECT: เมนูทั้งหมดจากตาราง menu_items และเรียงตาม id
app.get('/api/menu', async (req, res) => {
  try {
  //  complete this
    let sql = 'SELECT id, name, price FROM menu_items ORDER BY id DESC'
    let result = await queryDB(sql);
    console.log(result);
    res.json(result);


  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'ทำรายการไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// SELECT: ออเดอร์ที่ยังอยู่บนโต๊ะ จากตาราง current_orders และเรียงตาม id จากมากไปน้อย
app.get('/api/orders', async (req, res) => {
  try {
  //  complete this

    let sql = 'SELECT id, table_no, menu_name, quantity, status, created_at, (unit_price * quantity) AS total FROM current_orders ORDER BY id DESC'
    let result = await queryDB(sql);
    console.log(result);
    res.json(result);


  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'ทำรายการไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// SELECT: ประวัติออเดอร์ Done จากตาราง order_history และเรียงตาม id จากมากไปน้อย
app.get('/api/order-history', async (req, res) => {
  try {
  //  complete this
    let sql = 'SELECT id, table_no, menu_name, quantity, status, created_at, done_at, (unit_price * quantity) AS total FROM order_history ORDER BY id DESC'
    let result = await queryDB(sql);
    console.log(result);
    res.json(result);



  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'ทำรายการไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// INSERT: รับออเดอร์จาก fetch POST ของลูกค้า
app.post('/api/orders', async (req, res) => {
  try {
    const { table_no, menu_item_id, quantity } = req.body || {};
    if (
      !positiveInteger(table_no, 5) ||
      !positiveInteger(menu_item_id) ||
      !positiveInteger(quantity, 20)
    ) {
      return res.status(400).json({
        message:
          'โต๊ะต้องอยู่ระหว่าง 1–5 จำนวนต้องอยู่ระหว่าง 1–20 และ menu_item_id เป็นจำนวนเต็มบวก',
      });
    }

    // เลือกเมนูจาก menu_items โดยใช้ menu_item_id ที่ส่งมาเพื่อดึงชื่อและราคามาใช้บันทึกใน current_orders
    // complete this
    const menu = await queryDB(
      mysql.format('SELECT * FROM menu_items WHERE id = ?', [menu_item_id])
    );

    if (menu.length === 0) {
      return res.status(404).json({ message: 'ไม่พบเมนู' });
    }

    // บันทึกออเดอร์ลง current_orders โดยใช้เลขโต๊ะ menu_item_id ชื่ออาหาร ราคา ปริมาณ และสถานะเริ่มต้นเป็น preparing
    // complete this
    const result = await queryDB(
      mysql.format('INSERT INTO current_orders (table_no, menu_item_id, menu_name, unit_price, quantity, status) VALUES (?, ?, ?, ?, ?, ?)',
        [table_no, menu_item_id, menu[0].name, menu[0].price, quantity, 'preparing'])
    );

    // ส่งสัญญาณ data:changed ให้ทุก browser โหลดข้อมูลล่าสุด
    io.emit('data:changed', { entity: 'orders' });
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'ทำรายการไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// UPDATE current_orders: เปลี่ยนสถานะออเดอร์ เช่น จาก preparing → cooking หรือ cooking → done
app.post('/api/orders/status', async (req, res) => {
  try {
    const id = req.body.id;
    const status = req.body && req.body.status;
    if (!positiveInteger(id) || !['preparing', 'cooking', 'done'].includes(status)) {
      return res.status(400).json({ message: 'รหัสออเดอร์หรือสถานะไม่ถูกต้อง' });
    }
    const orders = await queryDB(
      mysql.format('SELECT * FROM current_orders WHERE id = ?', [id])
    );
    if (!orders.length) {
      return res.status(404).json({ message: 'ไม่พบออเดอร์' });
    }
    if (orders[0].status === 'done' && status !== 'done') {
      return res.status(409).json({ message: 'ออเดอร์ Done แล้ว ไม่สามารถย้อนสถานะได้' });
    }

    // อัปเดตสถานะใน current_orders และถ้าเปลี่ยนเป็น done ให้บันทึกลง order_history ด้วย
    // complete this
        const result = await queryDB(
      mysql.format('UPDATE current_orders SET status = ? WHERE id = ?',[status, id])
    );



    // ถ้าเปลี่ยนสถานะเป็น done ให้บันทึกลง order_history ด้วย
    if (status === 'done') {
      // 1. ตรวจว่ามีประวัติของออเดอร์นี้แล้วหรือยัง
      // complete this
const history = await queryDB(
  mysql.format('SELECT * FROM order_history WHERE id = ?', [id])
);




      // 2. ถ้ายังไม่มี ให้ใช้ข้อมูลออเดอร์ที่ SELECT ไว้ด้านบน
      if (history.length === 0) {
        const order = orders[0];

        // 3. เตรียมคำสั่ง INSERT และค่าที่จะบันทึก
        // complete this
      const historySql = mysql.format(
  'INSERT INTO order_history (id, table_no, menu_item_id, menu_name, unit_price, quantity, status, created_at, done_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
  [
    order.id,
    order.table_no,
    order.menu_item_id,
    order.menu_name,
    order.unit_price,
    order.quantity,
    'done',
    order.created_at
  ]
);

// 4. บันทึกประวัติ (id เป็น primary key จึงไม่เก็บรายการซ้ำ)
try {
  // complete this
  await queryDB(historySql);

} catch (error) {
  if (error.code !== 'ER_DUP_ENTRY') throw error;
}
      }
    }
    // ส่งสัญญาณ data:changed ให้ทุก browser โหลดข้อมูลล่าสุด
    io.emit('data:changed', { entity: 'orders' });
    res.json({ message: 'เปลี่ยนสถานะแล้ว' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'ทำรายการไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// DELETE: Clear โต๊ะ ลบเฉพาะข้อมูลในตาราง current_orders และเก็บข้อมูลในตาราง order_history ไว้
app.post('/api/tables/clear', async (req, res) => {
  try {
    const tableNo = req.body.tablenumber;
    if (!positiveInteger(tableNo, 5)) {
      return res.status(400).json({ message: 'หมายเลขโต๊ะต้องอยู่ระหว่าง 1–5' });
    }

    // ลบออเดอร์ทั้งหมดของโต๊ะนั้นจาก current_orders โดยไม่ลบ order_history
  //  complete this
const result = await queryDB(
  mysql.format('DELETE FROM current_orders WHERE table_no = ?', [tableNo])
);


    // ส่งสัญญาณ data:changed ให้ทุก browser โหลดข้อมูลล่าสุด
    io.emit('data:changed', { entity: 'orders' });
    res.json({
      table_no: tableNo,
      cleared_count: result.affectedRows,
      message: `Clear โต๊ะ ${tableNo} แล้ว`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'ทำรายการไม่สำเร็จ กรุณาลองใหม่' });
  }
});


