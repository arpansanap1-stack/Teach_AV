# 🎓 Teach_AV — Teacher Availability System

> A web-based platform that helps students check teacher availability and makes it easier for teachers to manage their available time slots.

Teach_AV is a full-stack college utility application designed to solve a simple but common problem: **students often have to physically search for teachers just to find out whether they are available for submissions, queries, or meetings.**

The platform provides a centralized system where students can check teacher availability, teachers can manage their schedules, and administrators can manage the overall system.

---

## ✨ Features

### 👨‍🎓 Student

* Student registration and login
* Secure JWT-based authentication
* View available teachers
* Check teacher availability for today and upcoming dates
* View available time slots
* Submit complaints
* Access a simple student dashboard

### 👨‍🏫 Teacher

* Secure teacher login
* Manage personal availability
* Add available time slots
* Update existing availability
* Remove availability
* Add notes to availability slots
* Manage teacher profile information

### 🛡️ Admin

* Dedicated admin authentication
* Manage teachers and students
* Manage availability records
* Administrative controls for the platform

### 🔐 Security

* JWT authentication
* Password hashing using `bcryptjs`
* Role-based access control
* Environment-based configuration
* Protected teacher/admin operations
* Sensitive credentials kept outside the source code

---

## 🏗️ Tech Stack

| Technology     | Purpose                   |
| -------------- | ------------------------- |
| **Node.js**    | Backend runtime           |
| **Express.js** | REST API and server       |
| **MongoDB**    | Database                  |
| **Mongoose**   | MongoDB object modeling   |
| **HTML5**      | Frontend structure        |
| **CSS3**       | Frontend styling          |
| **JavaScript** | Frontend functionality    |
| **JWT**        | Authentication            |
| **bcryptjs**   | Password hashing          |
| **CORS**       | Cross-origin requests     |
| **dotenv**     | Environment configuration |
| **Nodemon**    | Development server        |

The repository uses Express 5, Mongoose 8, JWT, bcryptjs and Nodemon as its primary backend dependencies.

---

## 📂 Project Structure

```text
Teach_AV/
│
├── config/
│   └── db.js
│
├── middleware/
│   └── auth.js
│
├── models/
│   ├── Availability.js
│   ├── Complaint.js
│   ├── Student.js
│   └── Teacher.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── availabilityRoutes.js
│   ├── complaintRoutes.js
│   ├── studentRoutes.js
│   └── teacherRoutes.js
│
├── public/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── teacher.html
│   └── admin.html
│
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

The current repository follows this backend/frontend structure, with dedicated models and routes for teachers, students, availability, authentication, administration, and complaints.

---

## 🔄 How It Works

```text
                    ┌─────────────────┐
                    │     Student     │
                    └────────┬────────┘
                             │
                             ▼
                  Check Teacher Availability
                             │
                             ▼
                    ┌─────────────────┐
                    │  Express REST   │
                    │      API        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    MongoDB      │
                    └─────────────────┘
                             ▲
                             │
                    ┌────────┴────────┐
                    │     Teacher     │
                    └─────────────────┘
                             │
                       Manage Slots
```

Students can access currently available and future availability slots for a teacher, while authenticated teachers can create, update, and delete their own availability.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/arpansanap1-stack/Teach_AV.git
cd Teach_AV
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password

PORT=5000
```

**Never commit your `.env` file to GitHub.**

The server validates the required environment variables before starting and requires MongoDB, JWT, and admin credentials to be configured.

### 4. Start the development server

```bash
npm run dev
```

Or start normally:

```bash
npm start
```

The server runs on:

```text
http://localhost:5000
```

### 5. Health Check

Once the server is running, you can verify the API using:

```text
GET /api/health
```

Expected response:

```json
{
  "status": "OK",
  "message": "Teacher Availability API is running"
}
```

---

## 🔌 API Overview

### Authentication

```text
POST /api/auth/student/login
POST /api/auth/teacher/login
POST /api/auth/admin/login
```

### Teachers

```text
/api/teachers
```

### Students

```text
/api/students
```

### Availability

```text
GET    /api/availability/:teacherId
POST   /api/availability
PUT    /api/availability/:id
DELETE /api/availability/:id
```

### Complaints

```text
/api/complaints
```

### Admin

```text
/api/admin
```

The backend mounts dedicated Express routers for all of these major application areas.

---

## 🔐 Authentication & Authorization

Teach_AV uses **JSON Web Tokens (JWT)** for authentication.

Different roles are supported:

```text
Student
   │
   └── Student permissions

Teacher
   │
   └── Manage personal availability

Admin
   │
   └── Administrative permissions
```

Passwords are handled using `bcryptjs`, while JWT tokens are generated with role information and expire after seven days.

---

## 🗄️ Database Models

The application currently contains the following MongoDB models:

### Teacher

Stores teacher information such as:

* Name
* Email
* Department
* Room
* Password

### Student

Stores student account information and authentication details.

### Availability

Stores:

* Teacher
* Date
* Start time
* End time
* Status
* Notes

### Complaint

Stores student complaints and related information.

---

## 🎯 Problem Statement

In many colleges, students need to contact or physically locate teachers to ask whether they are available for:

* Assignment submission
* Doubt solving
* Project discussions
* Practical work
* Academic queries
* Meetings

This can result in wasted time for both students and teachers.

**Teach_AV provides a centralized availability system to make this process faster and more convenient.**

---

## 💡 Future Improvements

Some possible improvements for future versions:

* 📱 Responsive mobile-first UI
* 🔔 Email/notification alerts
* 📅 Calendar integration
* ⏰ Automatic availability expiration
* 🔎 Teacher search and filtering
* 📊 Admin analytics dashboard
* 🏫 Department-wise teacher filtering
* 📲 Progressive Web App (PWA)
* 🔔 Notifications when a teacher becomes available
* 📝 Appointment/request booking
* ☁️ Production deployment
* 📈 Usage analytics

---

## 🛠️ Development

Run the application in development mode with:

```bash
npm run dev
```

Nodemon automatically restarts the server whenever backend files are modified.

For production:

```bash
npm start
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

3. Make your changes
4. Commit your changes

```bash
git commit -m "Add your feature"
```

5. Push the branch

```bash
git push origin feature/your-feature
```

6. Open a Pull Request

---

## 📜 License

This project is currently intended as an educational/project implementation.

---

## 👨‍💻 Author

**Arpan Sanap**

Computer Science & Design Student

GitHub: [@arpansanap1-stack](https://github.com/arpansanap1-stack)

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub!

**Teach_AV — Making teacher availability simple, accessible, and efficient.**
