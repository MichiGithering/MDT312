// ========================================================
// Assignment 5: JavaScript Post and Reply
// ให้นักศึกษาเขียนโค้ด JavaScript เพื่อจัดการการ Post และ Clear ข้อความ
// ========================================================

window.onload = setupFunction;

function setupFunction() {
   var top = document.getElementById("top");
   top.textContent = "Welcome to the Forum!";
}

var postCount = 0;

function postFunction() {
    var topic = document.getElementById("topic");
    var reply1 = document.getElementById("reply1");
    var reply2 = document.getElementById("reply2");
    var textmessage = document.getElementById("message");

    if (topic.textContent == "") {
        topic.textContent = "Topic: " + textmessage.value;
        postCount++;
    }
    else if (reply1.textContent == "") {
        reply1.textContent = "Reply1: " + textmessage.value;
        postCount++;
    }
    else if (reply2.textContent == "") {
        reply2.textContent = "Reply2: " + textmessage.value;
        postCount++;
    }
    console.log(topic.textContent);
    console.log(reply1.textContent);
    console.log(reply2.textContent);
    textmessage.value = "";
}


function clearFunction() {
    var topic = document.getElementById("topic");
    var reply1 = document.getElementById("reply1");
    var reply2 = document.getElementById("reply2");
    var texttobeclear = document.getElementById("message");
    topic.textContent = "";
    reply1.textContent = "";
    reply2.textContent = "";
    texttobeclear.value = "";

    postCount = 0;
}
