# 🚀 Events-Activities-Server

Events-Activities-Server is a scalable and secure backend API built with  
**Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL**.  
It provides authentication, role-based access control, and event management features
for an event & activities platform.

---

## 📌 Features

- 🔐 JWT-based Authentication & Authorization
- 👥 Role-based Access Control (Admin, Host, User)
- 📅 Event & Activity Management (CRUD)
- 🎟️ Join & Manage Event Participation
- 🧩 Prisma ORM with PostgreSQL
- ✅ Request Validation using Zod
- 🌐 RESTful API Architecture
- ⚡ Production-ready Backend

---

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **TypeScript**
- **PostgreSQL**
- **Prisma ORM**
- **JWT (JSON Web Token)**
- **Zod**
- **dotenv**

---

## 📂 Project Structure

src/
├── app/
│ ├── errors/
│ ├── helper/
│ ├── middlewares/
│ ├── modules/
│ │ ├── auth/
│ │ ├── events/
│ │ ├── Meta/
│ │ ├── myEvent/
│ │ ├── payment/
│ │ ├── Profile/
│ │ ├── review/
│ │ └── user/
│ ├── routes/
│ └── type/
├── config/
├── app.ts
└── server.ts



---

## 📮 API Endpoints (Sample)

### 🔑 Authentication
- `POST /auth/register` – Register new user
- `POST /auth/login` – User login

### 👤 Users
- `GET /users` – Get all users (Admin only)
- `GET /users/me` – Get logged-in user profile

### 📅 Events
- `POST /events` – Create new event (Host)
- `GET /events` – Get all events
- `GET /events/:id` – Get event by ID
- `PATCH /events/:id` – Update event
- `DELETE /events/:id` – Delete event

### 🎟️ Event Participation
- `POST /participants/join` – Join an event
- `GET /participants/my-events` – Get joined events

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add:

```env
PORT=5000
DATABASE_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/eventsDB
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development


▶️ Installation & Run

1️⃣ Clone the Repository
git clone https://github.com/ahsanuilkrem/Events-Activities-Server.git
cd events-activities-server

2️⃣ Install Dependencies
npm install

3️⃣ Run Development Server
npm run dev

🧬 Prisma Setup
1️⃣ Initialize Prisma

npx prisma init

2️⃣ Run Prisma Migration
npx prisma migrate dev --name init

3️⃣ Generate Prisma Client
npx prisma generate