const fs = require('fs/promises');
const http = require('http');

const hostname = 'localhost';
const port = 3000;


// complete the code here
const server = http.createServer(async (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    const data = await main();
    res.write(`<pre >${JSON.stringify(data, null, 2)}</pre>`); 
    res.end();
  });

// complete the code here
const readJsonFile = async () => {
    const rawData = await fs.readFile('cloth1.json');
    return JSON.parse(rawData);
}

// complete the code here
// จำนวนเสื้อผ้าตามที่กำหนด
const editJsonFile = (data) => { 
    const n_stock = [12, 13, 50, 22, 55, 87, 12, 29, 10];
    return data.map((item, index) => ({
    brandname: item.brandname,
    price: item.price,
    pic: item.pic,
    stock: n_stock[index]
}));
}

// complete the code here
const writeJsonFile = async (data) =>{
    await fs.writeFile('new_cloth.json', JSON.stringify(data, null, 2));
    
}

// complete the code here
const main = async () => {
try {
        const originalData = await readJsonFile();
        const updatedData = editJsonFile(originalData);
        await writeJsonFile(updatedData);
        return updatedData;
    } catch (err) {
        throw err
    }
    
}



server.listen(port, hostname, () => {
    console.log(`Server running at   http://${hostname}:${port}/`);
});