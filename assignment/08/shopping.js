window.onload = pageLoad;

function pageLoad(){
	let xhr = new XMLHttpRequest(); 
    xhr.open("GET", "cloth.json"); 
    xhr.onload = function() { 
        var jsdata = JSON.parse(xhr.responseText)
        console.log(jsdata)
        showData(jsdata)

    }; 
    xhr.onerror = function() { 
        alert("ERROR!"); 
    }; 
    xhr.send();
}

function showData(data){
    let showdiv = document.getElementById("layer");
    let boxes = showdiv.getElementsByTagName("div");
    for(let i = 0; i< data.length;i++)
    {
        let item = data[i];
        
        boxes[i].innerHTML = "<img src='" + item.img + "'<br>" + item.brand + "<br>" + item.price + " baht"; 
    }
}
