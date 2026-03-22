fetch('http://localhost:5000/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ buyerId: 12345, buyerName: "Automated Test", totalAmount: 50.00, status: "Pending", items: [{ id: 1, quantity: 2 }] })
}).then(r=>r.json().then(d=>console.log(r.status, d))).catch(console.error)
