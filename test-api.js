fetch('http://localhost:5000/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
      name: "Test API Apple",
      quantityAvailable: 100,
      unit: "kg",
      price: 5.00,
      sellerId: 1,
      sellerName: "Agent Test Auto",
      categoryId: 1,
      categoryName: "Vegetables",
      description: "Test description",
      productionType: "Traditional"
  })
}).then(r => r.json().then(data => ({status: r.status, data}))).then(console.log).catch(console.error);
