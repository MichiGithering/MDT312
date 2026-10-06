var express = require('express');
var app = express();
let http = require('http');
var hostname = 'localhost';
var port = 3001;
var fs = require('fs/promises');
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('your id', socket.id);


  socket.on('send_to_all', (data) => {
    console.log(`[All] จาก ${socket.id}:`, data);
    // Complete this
    // บันทึกข้อความลงไฟล์ log.json


    // Complete this
    // ส่งข้อความไปยังทุกคน รวมถึงตัวเองด้วย โดยใช้ io.emit และ event name เป็น 'message_received' พร้อมกับส่งข้อมูลเป็น object ที่มี time, user, text
    

  });
})

app.get('/readlog', async (req, res) => {
  // Complete this
  // ใช้ fs.readFile เพื่ออ่านไฟล์ log.json และส่งผลลัพธ์กลับไปยัง client ในรูปแบบ JSON
  

});

const readFile = async () => {
  // Complete this 
  // ใช้ fs.readFile เพื่ออ่านไฟล์ log.json 
  
};

const writeFile = async (data) => {
  // Complete this
  // ใช้ fs.writeFile เพื่อเขียนข้อมูลลงไฟล์ log.json 
  // โดยแปลง object เป็น JSON string ด้วย JSON.stringify(data, null, 2) เพื่อให้มีการจัดรูปแบบที่อ่านง่าย
  

};

const readandWriteFile = async (new_msg) => {
  // Complete this
  // ใช้ readFile() เพื่ออ่านไฟล์ log.json และเก็บผลลัพธ์ไว้ในตัวแปร logs
  // เพิ่ม new_msg ลงใน logs
  // ใช้ writeFile(logs) เพื่อเขียนข้อมูลกลับไปยังไฟล์ log.json
  // update log.json with new message
  
  
};


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});