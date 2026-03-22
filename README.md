# 🌱 Agrilink: Direct Farmer-to-Buyer Marketplace

Welcome to **Agrilink**—a modern, full-stack marketplace designed to fundamentally disrupt traditional agricultural supply chains. By directly connecting hardworking farmers with household buyers and commercial consumers, Agrilink **eliminates the middleman**, ensuring farmers receive the true value of their crops while buyers enjoy fresher produce at fairer prices.

---

## 🚀 The Vision

For decades, agricultural middlemen and brokers have monopolized the space between the farm and the table. Farmers often sell their produce at historically low margins, while end-consumers pay heavily inflated prices at the grocery store. 

**Agrilink changes the game.**
Our platform provides farmers with an intuitive, digital storefront to list their inventory in real-time. Buyers can search, filter, and purchase directly from the growers themselves. When an order is placed, our backend inventory systems automatically deduct the stock, ensuring complete transparency and real-time reliability.

---

## 🛠️ Tech Stack

This project was engineered to be production-ready and highly scalable, utilizing a modern JavaScript/TypeScript ecosystem.

### **Frontend (Client)**
* **React 18** - Component-driven UI architecture.
* **Vite** - Lightning-fast compilation and Hot Module Replacement (HMR).
* **TypeScript** - Strict typings for robust data modeling and crash prevention.
* **Tailwind CSS & Shadcn UI** - For sleek, responsive, and gorgeous dynamic styling.
* **TanStack React Query** - Powerful asynchronous state management and data fetching.

### **Backend (Server)**
* **Node.js & Express** - A secure, fast integration API handling business logic and transaction safety.
* **Firebase Authentication** - Enterprise-grade, token-based user authentication separating "Farmer" and "Buyer" identities.
* **Supabase (PostgreSQL)** - An incredibly powerful relational database hosting Categories, dynamic Product Inventories, and transactional Order Histories.

---

## 💻 Core Features

### 🧑‍🌾 Farmer Dashboard
* **Dynamic Inventory Listings:** Farmers can easily list new crops with pictures, production types (Organic, Conventional), and set custom unit pricing.
* **Live Stock Management:** Update available stock at the click of a button. When buyers purchase items, the Postgres database auto-decrements the stock locally and globally.

### 🛒 Buyer Dashboard
* **Seamless Marketplace Browsing:** Search and dynamically filter through hundreds of crops by category, price, or specific seller.
* **Persistent Cart Sessions:** Built-in `localStorage` mapping ensures buyers never lose their cart if they log out or switch devices.
* **Live Order Progression:** Checkout securely passes payloads through the Express backend, finalizing transactions cleanly into the database.

---

## ⚙️ Getting Started (Local Development)

To run this full-stack application locally on your machine:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anshul1734/Agrilinkupdated.git
   cd agrilink-harvest-hub-18-main
   ```

2. **Install all dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Set up Environment Variables**
   Ensure you place your `.env` connecting to Supabase and Firebase in the root folder, and `.env` in the `backend/` folder connecting strictly to your Supabase PostgreSQL.

4. **Run the Full Architecture**
   ```bash
   npm run dev:all
   ```
   This `concurrently` spins up both the Vite React dev server on `http://localhost:8080` AND the Node HTTP server on `http://localhost:5000`.

---
*Built with ❤️ to empower farmers worldwide.*
