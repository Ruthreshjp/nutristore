Nutri-Store
An e-commerce website for agricultural products built with the MERN stack.
Prerequisites

Node.js
MongoDB (local or Atlas)
npm

Setup Instructions
Backend

Navigate to the server directory:cd server


Install dependencies:npm install


Create a .env file in the server directory with:MONGODB_URI=mongodb://localhost:27017/nutri-store
JWT_SECRET=your_jwt_secret
PORT=5000


Start the server:npm start



Frontend

Navigate to the client directory:cd client


Install dependencies:npm install


Start the React app:npm start



MongoDB Setup

Ensure MongoDB is running locally or use MongoDB Atlas.
Seed the database with sample products (optional):use nutri-store
db.products.insertMany([
  {
    name: "Organic Rice",
    category: "Grains",
    price: 100,
    image: "https://example.com/rice.jpg",
    description: "Premium organic rice."
  },
  {
    name: "Fresh Spinach",
    category: "Greens",
    price: 50,
    image: "https://example.com/spinach.jpg",
    description: "Freshly harvested spinach."
  }
])



Features

Product listing and details
User authentication (signup/login)
Shopping cart
Responsive UI with Tailwind CSS

Folder Structure

client/: React frontend
server/: Node.js/Express backend

Running the App

Start the backend server (npm start in server).
Start the frontend app (npm start in client).
Open http://localhost:3000 in your browser.

