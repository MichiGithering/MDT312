// =============================================================================
// MDT312 Assignment 7  - Square Game
// Modern JavaScript: DOM, Event, Timer
// =============================================================================

window.onload = pageLoad;

// Global timer reference เพื่อให้สามารถควบคุมและเคลียร์สถานะได้ถูกต้อง
let timer = null;

function pageLoad(){
	// 1. ผูกเหตุการณ์คลิกปุ่ม Start ด้วย const
	const startBtn = document.getElementById("start");
	if (startBtn) startBtn.onclick = startGame

	// 2. ใช้ Event Delegation (สไลด์หน้า 50–52):
	// ผูก event ไว้ที่กล่องแม่ #layer เพียงจุดเดียว
	// เมื่อมีการคลิกเกิดขึ้น ให้ใช้ event.target ตรวจสอบว่าเป็นกล่อง .square หรือไม่
	const gameLayer = document.getElementById("layer");
}

function startGame(){
	alert("Ready");
	clearScreen(); // ล้างกล่องเก่าออกก่อนเริ่มรอบใหม่
	addBox();
	
	timeStart();
}

function timeStart(){
	const TIMER_TICK = 1000;
	// เคลียร์ timer เดิมก่อนเริ่มนับใหม่ เพื่อป้องกันการนับเวลาเร่งความเร็วเมื่อกด Start ซ้ำ
	if (timer !== null) {
		clearInterval(timer);
		timer = null;
	}

	const min = 0.1; // 0.5 minute = 30 seconds
	let second = min * 60; 
	const clockDisplay = document.getElementById('clock');
	clockDisplay.textContent = second;
	
	// setting timer using setInterval function (สไลด์หน้า 12)
	timer = setInterval(timeCount, TIMER_TICK);
	
	function timeCount(){
			clockDisplay.textContent = second;
		const allbox = document.querySelectorAll("#layer div");
		
		// จัดการเกี่ยวกับเวลาตามเงื่อนไขโจทย์:
		// 1. ถ้าไม่มีกล่องเหลือแล้ว และเวลายังเหลืออยู่จะขึ้นว่า You win!
		if(allbox.length === 0 && second > 0) {
			clearInterval(timer)
			alert("You win!");
			return;

		}

		// 2. ถ้าเวลาหมด แต่ยังมีกล่องเหลืออยู่ จะบอกว่า Game over และทำการ clear screen
		if(allbox.length > 0 && second <= 0)
		{
			clearInterval(timer)
			alert("Game Over!");
			return;
		}
		// 3. ถ้ายังมีกล่องเหลืออยู่ เวลาจะลดลงเรื่อยๆ
		if(allbox.length > 0)
		{
			second -= 1;
		}

		
	}
}

function addBox(){
	// สร้างกล่องตาม input ที่เราใส่
	const numbox = parseInt(document.getElementById("numbox").value) || 0;
	const gameLayer = document.createElement("gameLayer");

	const boxcolor = document.getElementById("color").value;
	const colorDrop = gameLayer.style.color = boxcolor;
	
	for (i=numbox; i>0; i--){
		const tempbox = document.createElement("div"); 
		
		tempbox.className = "square " + colorDrop;   
		tempbox.id = "box" + i;
		tempbox.style.left = Math.random() * (500 - 25) + "px";
		tempbox.style.top = Math.random() * (500 - 25) + "px";
		tempbox.onclick = handleRemoveBoxClick
		// add element to HTML node 
		document.getElementById("layer").appendChild(tempbox)
		
	}
}


function clearScreen(){
	// ทำการลบ node ของกล่องทั้งหมด ออกจากหน้าจอ
	const allbox = document.querySelectorAll("#layer div"); // สไลด์หน้า 29

	for (let i = 0; i < allbox.length; i++) {
        allbox[i].remove();
    }
}

// function removeBlock()
// {
// }
function handleRemoveBoxClick(event) {
	const item = event.target
	if(item.className = "square")
	{
		item.remove();
	}
    }
