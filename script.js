let cart = [];
let total = 0;

let productPrices = {
"8901030865363": 14, // Maggi
"8901063161559": 40, // Dairy Milk
"8906007285935": 35  // Bread
};

function getPrice(barcode) {
    return productPrices[barcode] || 0;
}

function startScanner(){

Quagga.init({

inputStream:{
name:"Live",
type:"LiveStream",
target:document.querySelector('#cameraFeed')
},

decoder:{
readers:["ean_reader"]
}

},function(err){

if(err){
console.log(err);
return;
}

Quagga.start();

});

}

Quagga.onDetected(function(result){

let barcode=result.codeResult.code;

addProduct(barcode);

});

function addProduct(barcode){

fetch(`http://localhost:3000/scan/${barcode}`)
.then(response => response.json())
.then(data => {
    if(data.name){
        let product = {
            name: data.name,
            price: getPrice(barcode) // You can implement getPrice based on barcode or add price to backend
        };
        cart.push(product);
        let li=document.createElement("li");
        li.innerText=product.name+" ₹"+product.price;
        document.getElementById("cart").appendChild(li);
        total+=product.price;
        document.getElementById("total").innerText=total;
    } else {
        alert("Product not found");
    }
})
.catch(error => {
    console.error('Error:', error);
    alert("Error fetching product");
});

}

function finishShopping(){

document.querySelector(".main").style.display="none";

document.getElementById("paymentScreen").style.display="block";

document.getElementById("payTotal").innerText=total;

}

function makePayment(){

document.getElementById("paymentScreen").style.display="none";

document.getElementById("billScreen").style.display="block";

let billHTML="<h3>SmartMart Receipt</h3>";

cart.forEach((item)=>{
billHTML+=item.name+" - ₹"+item.price+"<br>";
});

billHTML+="<hr>";
billHTML+="Total Paid: ₹"+total+"<br>";
billHTML+="Payment Method: UPI<br>";
billHTML+="Status: Success";

document.getElementById("bill").innerHTML=billHTML;

}