const socket = io();
let username= "";

window.onload = pageLoad;

function pageLoad(){
	let submitmsg = document.getElementById("submitmsg");
	let clickok = document.getElementById("clickok")
	// Complete this
	submitmsg.onclick = sendToAll;
	clickok.onclick = setUsername;
	document.getElementById("connection").textContent = socket.connected
	document.getElementById("your_id").textContent = socket.id

}

socket.on('your id', function(id){
	console.log('Your socket ID is: ' + id);
	//  Complete this
	document.getElementById("your_id").textContent = id;


});

// รับข้อความทั่วไป (ที่ส่งมาจาก socket.emit, socket.broadcast.emit, io.emit, io.to.emit)
socket.on('message_received', (data) => {
  postMsg(data);
});


// ส่งหาทุกคน รวมฉันด้วย (To All)
function sendToAll() {
    let d = new Date();
    
    // Ensure the ID matches your HTML (e.g., "usermsg" or "userInput")
    const input = document.getElementById("userMsg"); 
    const text = input.value;
    
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    
    // Send as { time, user, text } to match what postMsg expects
    socket.emit("send_to_all", { time: time, user: username, text: text });
    
    input.value = "";
}

function postMsg(msg){
	let x = document.getElementById("chatbox");
	console.log(msg);
	let div_d = document.createElement("div");
	div_d.className = "message";
	let timemsg = document.createTextNode("("+ msg.time+") ");
	let boldmsg = document.createElement("b");
	boldmsg.innerHTML = msg.user;
	let textmsg = document.createTextNode(": "+msg.text);
	
	div_d.append(timemsg,boldmsg,textmsg);
	div_d.appendChild(document.createElement("br"));
	x.appendChild(div_d);

	checkScroll();
}

function setUsername(){
	let userInput = document.getElementById("userInput");
	username = userInput.value;
	// Complete this

	document.getElementById("submitmsg").disabled = false;
	document.getElementById("clickok").disabled = true;
	readLog();
}

const readLog = (async () => {
	// Complete this
	// ใช้ fetch เพื่อดึงข้อมูลจาก endpoint "/readlog" และแปลงผลลัพธ์เป็น JSON
	// จากนั้นวนลูปผ่านแต่ละข้อความใน JSON และเรียกใช้ฟังก์ชัน postMsg(msg) เพื่อแสดงข้อความใน chatbox
	
	const response = await fetch("/readlog")    
	if (!response.ok) throw new Error("HTTP " + response.status);
    const logs = await response.json();
    for (const msg of logs) {
        postMsg(msg);
    }
});


function checkScroll(){
	let chatbox = document.getElementById('chatbox');
	let scroll = chatbox.scrollTop+chatbox.clientHeight === chatbox.scrollHeight;
	if (!scroll) {
    	chatbox.scrollTop = chatbox.scrollHeight;
  	}
}
