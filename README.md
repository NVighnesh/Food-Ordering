# 🍽️ Food Ordering – Full-Stack Food Ordering Application

A full-stack food ordering web application built using **React** and **Spring Boot**, with **MySQL/TiDB Cloud** for data persistence, **JWT-based authentication**, **Stripe Checkout** for online payments, and **Cloudinary** for food and restaurant images.

The application supports both **customers** and **restaurant owners**, providing a complete flow from browsing restaurants and food items to cart management, order placement, payment, and restaurant-side management.

---

## 🔗 Project Links

- 🌐 **Live Application:** https://frontend-tau-swart-44.vercel.app/
- 💻 **GitHub Repository:** https://github.com/NVighnesh/Food-Ordering
- ⚙️ **Backend API:** https://food-ordering-0cus.onrender.com

---

# 📖 Introduction

The **Food Ordering Application** is a full-stack web application developed to demonstrate the implementation of a real-world food ordering platform.

The project follows a **React frontend + Spring Boot REST API + relational database** architecture.

Customers can:

- Create an account and sign in
- Browse restaurants
- Browse food items
- View food details
- Add items to the cart
- Manage their cart
- Place orders
- Make online payments using Stripe
- View their orders
- Manage their profile and addresses

Restaurant owners can:

- Manage their restaurant
- Manage food items
- Manage categories
- View and manage restaurant-related data

The application is deployed using **Vercel**, **Render**, and **TiDB Cloud**.

---

# ✨ Features

## 👤 Customer Features

- User registration and login
- JWT-based authentication
- Browse restaurants
- Browse restaurant food items
- View food details
- Food categories
- Add food items to cart
- Update cart
- Remove cart items
- Place orders
- Stripe Checkout integration
- Payment success/failure handling
- View order history
- Manage profile
- Manage addresses
- Favorite-related functionality

---

## 👨‍🍳 Restaurant Owner Features

- Restaurant owner authentication
- Restaurant management
- Food management
- Category management
- Restaurant-related administration
- Protected owner/admin APIs

---

## 🔐 Security

The backend implements:

- JWT authentication
- BCrypt password hashing
- Role-based authorization
- Stateless Spring Security sessions
- Protected REST APIs
- CORS configuration
- CSRF disabled for the stateless REST API
- Environment-variable based secrets
- Stripe secret key stored outside source code
- JWT secret stored outside source code

---

# 🛠️ Functionalities

| Functionality | Description |
|---|---|
| Authentication | User signup and signin |
| Authorization | Role-based access for protected APIs |
| Restaurants | Browse and manage restaurants |
| Food | Browse and manage food items |
| Categories | Food category management |
| Cart | Add, update and remove cart items |
| Orders | Create and view orders |
| Payments | Stripe Checkout integration |
| Addresses | Customer address management |
| Favorites | Favorite-related functionality |
| Notifications | User notification management |
| Images | Cloudinary-hosted food and restaurant images |
| Database | MySQL-compatible relational database |
| Deployment | Vercel + Render + TiDB Cloud |

---

# 💻 Tech Stack

## Frontend

- React 19
- JavaScript
- React Router
- Redux
- Redux Thunk
- Axios
- Material UI
- Formik
- Yup
- HTML
- CSS

## Backend

- Java 21
- Spring Boot 3.5.5
- Spring Web
- Spring Data JPA
- Hibernate
- Spring Security
- JWT
- BCrypt
- Maven

## Database

- MySQL 8
- TiDB Cloud
- SQL
- JPA/Hibernate

## Payment

- Stripe Checkout

## Image Storage

- Cloudinary

## Deployment

- Vercel – Frontend
- Render – Backend
- TiDB Cloud – Database

---

# 🏗️ Architecture

```text
                         ┌──────────────────────────┐
                         │        Customer          │
                         │       / Restaurant       │
                         │          Owner           │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │      React Frontend      │
                         │        Vercel             │
                         └────────────┬─────────────┘
                                      │
                              REST API / HTTPS
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │     Spring Boot API      │
                         │          Render          │
                         ├──────────────────────────┤
                         │ Controllers              │
                         │ Services                 │
                         │ Repositories             │
                         │ Spring Security          │
                         │ JWT Authentication       │
                         └───────┬───────────┬──────┘
                                 │           │
                       JDBC / JPA │           │ Stripe API
                                 │           │
                                 ▼           ▼
                    ┌──────────────────┐   ┌──────────────┐
                    │   TiDB Cloud     │   │    Stripe    │
                    │   MySQL-compatible│   │   Checkout   │
                    │    Database      │   └──────────────┘
                    └──────────────────┘
                                 
                         ┌──────────────────┐
                         │    Cloudinary    │
                         │  Image Storage   │
                         └──────────────────┘
```

---

# 🔄 Food Ordering Flow

```text
Customer
   │
   ▼
Register / Login
   │
   ▼
JWT Authentication
   │
   ▼
Browse Restaurants
   │
   ▼
Select Restaurant
   │
   ▼
Browse Food
   │
   ▼
Add Food to Cart
   │
   ▼
Review Cart
   │
   ▼
Place Order
   │
   ▼
Create Stripe Checkout Session
   │
   ▼
Stripe Payment
   │
   ├───────────────┐
   │               │
   ▼               ▼
Success          Failure
   │               │
   ▼               ▼
Order Success    Payment Failed
```

---

# 💳 Stripe Payment Flow

The application uses **Stripe Checkout** for online payments.

```text
React Frontend
      │
      │ Request checkout
      ▼
Spring Boot Backend
      │
      │ Create Stripe Checkout Session
      ▼
Stripe
      │
      ▼
Customer Payment
      │
      ├───────────────┐
      │               │
      ▼               ▼
   Success          Failure
      │               │
      ▼               ▼
/payment/success   /payment/fail
```

# 🗄️ Database

The application uses a **MySQL-compatible relational database**.

### Local Development

```text
MySQL 8
      │
      ▼
vighnesh_foodorder
```

### Production

```text
Spring Boot
     │
     ▼
TiDB Cloud
     │
     ▼
vighnesh_foodorder
```

The production database is hosted on **TiDB Cloud** and uses TLS.

Food and restaurant images are stored using **Cloudinary**, while their URLs are stored in the database.

---

# 📁 Project Structure

```text
Food-Ordering/
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── vighnesh/
│   │   │   │           ├── config/
│   │   │   │           ├── controller/
│   │   │   │           ├── dto/
│   │   │   │           ├── model/
│   │   │   │           ├── repository/
│   │   │   │           ├── request/
│   │   │   │           ├── response/
│   │   │   │           └── service/
│   │   │   │
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       ├── application-h2.properties
│   │   │       ├── application-mysql.properties
│   │   │       └── schema.sql
│   │   │
│   │   └── test/
│   │
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   └── component/
│   │       └── config/
│   │           └── api.js
│   ├── package.json
│   └── ...
│
├── View-Outputs/
│   ├── Screenshot (124).png
│   ├── Screenshot (125).png
│   ├── ...
│   └── Screenshot (148).png
│
├── .gitignore
└── README.md
```

---

# 🖼️ Application Screenshots

The `View-Outputs` folder contains screenshots of the application's actual outputs and UI.

## Authentication

- Login
- Signup

## Customer Application

- Home page
- Restaurant listing
- Restaurant details
- Food details
- Cart
- Checkout
- Payment success
- Payment failure
- Profile
- Orders

## Restaurant Owner

- Owner dashboard
- Restaurant management
- Food management
- Category management

All screenshots are available directly inside the repository:

```text
View-Outputs/
```

---

# 🧪 Testing & Build

## Backend

The backend can be built using Maven:

```bash
mvn clean package
```

To skip tests:

```bash
mvn -DskipTests package
```

The application uses Spring Boot's testing support and H2 is included for testing.

---

## Frontend

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm start
```

Create a production build:

```bash
npm run build
```

---

# 🐳 Docker

The backend includes a multi-stage Docker build.

```text
Maven Build Stage
       │
       ▼
Spring Boot JAR
       │
       ▼
Java 21 Runtime Image
       │
       ▼
Docker Container
```

The Dockerfile uses:

- Maven 3.9.11
- Eclipse Temurin Java 21
- Multi-stage build

---

# ☁️ Deployment

The application is deployed using three main services.

```text
                 INTERNET
                    │
                    ▼
        ┌─────────────────────┐
        │       Vercel        │
        │   React Frontend    │
        └──────────┬──────────┘
                   │
                   │ HTTPS
                   ▼
        ┌─────────────────────┐
        │       Render        │
        │ Spring Boot Backend │
        └──────────┬──────────┘
                   │
                   │ TLS / JDBC
                   ▼
        ┌─────────────────────┐
        │     TiDB Cloud      │
        │ Production Database │
        └─────────────────────┘

                   │
                   ▼
        ┌─────────────────────┐
        │       Stripe        │
        │     Payments        │
        └─────────────────────┘

                   │
                   ▼
        ┌─────────────────────┐
        │     Cloudinary      │
        │       Images        │
        └─────────────────────┘
```

### Production URLs

**Frontend**

https://frontend-tau-swart-44.vercel.app/

**Backend**

https://food-ordering-0cus.onrender.com

---

# 🔀 Git & GitHub

The project is maintained using Git and GitHub.

Repository:

https://github.com/NVighnesh/Food-Ordering

The project uses the `main` branch for deployment.

The deployment configuration is connected to GitHub so that changes pushed to the repository can trigger deployments.

---

# 🎯 Project Goals

This project was developed to demonstrate practical full-stack software engineering concepts including:

- Java backend development
- Spring Boot
- REST API development
- Spring Security
- JWT authentication
- Role-based authorization
- JPA/Hibernate
- Relational database design
- React development
- Redux state management
- Payment gateway integration
- Cloud image storage
- Docker
- Git/GitHub
- Cloud deployment
- Production environment configuration

---

## 📸 Screenshots

**Final Outputs**
[Click Here](View_Outputs/)

---

## 👤 Author

**NEDULLA VIGHNESH**  
- GitHub: [2200032267](https://github.com/NVighnesh)  
- LinkedIn: [N VIGHNESH](https://www.linkedin.com/in/n-vighnesh-5b74aa24a)  
- Email:vighneshnv2@gmail.com
---
## ⭐ Star This Repository

If you find this project useful or interesting, please ⭐ star this repository to support and encourage further development!  
Your support means a lot! 🙏

---

## 📜 License

This project is developed for learning, portfolio, and demonstration purposes.
