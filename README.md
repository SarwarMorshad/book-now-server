# 🎫 Book Now Server

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**A robust and secure backend API for online ticket booking platform**

[Features](#-features) • [Getting Started](#-getting-started) • [API Documentation](#-api-documentation) • [Environment Variables](#-environment-variables)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 About

Book Now Server is a powerful and scalable RESTful API backend for an online ticket booking platform. Built with modern technologies and best practices, it provides a complete solution for managing tickets, bookings, payments, and user authentication.

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication with secure token management
- Cookie-based session handling
- Role-based access control (User/Admin)
- Password hashing with bcrypt

### 🎟️ Ticket Management

- Create, read, update, and delete tickets
- Ticket availability tracking
- Category-based filtering
- Real-time inventory management

### 📅 Booking System

- Seamless booking creation and management
- Booking history and status tracking
- Quantity validation and availability checks
- User booking dashboard

### 💳 Payment Processing

- Stripe payment integration
- Secure payment intent creation
- Payment status tracking
- Webhook support for payment events

### 👥 User Management

- User registration and profile management
- Admin user management panel
- User activity tracking
- Secure password reset functionality

### 🛡️ Security Features

- Helmet.js for HTTP header security
- CORS configuration
- Rate limiting
- Input validation and sanitization
- XSS protection
- Error handling middleware

### 🚀 Performance Optimizations

- Response compression
- Database query optimization
- Request logging (Morgan)
- Environment-based configurations

## 🛠️ Tech Stack

| Technology             | Purpose                   |
| ---------------------- | ------------------------- |
| **Node.js**            | Runtime environment       |
| **Express.js**         | Web application framework |
| **MongoDB**            | NoSQL database            |
| **JWT**                | Authentication tokens     |
| **Stripe**             | Payment processing        |
| **Bcrypt**             | Password hashing          |
| **Helmet**             | Security headers          |
| **Morgan**             | HTTP request logger       |
| **Compression**        | Response compression      |
| **Express Validator**  | Input validation          |
| **Express Rate Limit** | API rate limiting         |

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**
- **Stripe Account** (for payment processing)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/book-now-server.git
   cd book-now-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGO_URI=mongodb://localhost:27017/book-now

   # JWT
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=7d

   # Client URL
   CLIENT_URL=http://localhost:5173

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Start the production server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
book-now-server/
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── adminController.js    # Admin operations
│   ├── authController.js     # Authentication logic
│   ├── bookingController.js  # Booking management
│   ├── paymentController.js  # Payment processing
│   ├── ticketController.js   # Ticket operations
│   └── userController.js     # User management
├── middleware/
│   ├── auth.js               # Authentication middleware
│   ├── authMiddleware.js     # Additional auth checks
│   └── errorHandler.js       # Global error handling
├── routes/
│   ├── adminRoutes.js        # Admin endpoints
│   ├── authRoutes.js         # Auth endpoints
│   ├── bookingRoutes.js      # Booking endpoints
│   ├── paymentRoutes.js      # Payment endpoints
│   ├── ticketRoutes.js       # Ticket endpoints
│   └── userRoutes.js         # User endpoints
├── utils/
│   └── generateToken.js      # JWT token generation
├── .env                      # Environment variables
├── index.js                  # Application entry point
├── package.json              # Dependencies and scripts
└── README.md                 # Documentation
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint         | Description       | Auth Required |
| ------ | ---------------- | ----------------- | ------------- |
| POST   | `/auth/register` | Register new user | ❌            |
| POST   | `/auth/login`    | User login        | ❌            |
| POST   | `/auth/logout`   | User logout       | ✅            |
| GET    | `/auth/me`       | Get current user  | ✅            |

### Ticket Endpoints

| Method | Endpoint       | Description      | Auth Required |
| ------ | -------------- | ---------------- | ------------- |
| GET    | `/tickets`     | Get all tickets  | ❌            |
| GET    | `/tickets/:id` | Get ticket by ID | ❌            |
| POST   | `/tickets`     | Create ticket    | ✅ (Admin)    |
| PUT    | `/tickets/:id` | Update ticket    | ✅ (Admin)    |
| DELETE | `/tickets/:id` | Delete ticket    | ✅ (Admin)    |

### Booking Endpoints

| Method | Endpoint        | Description       | Auth Required |
| ------ | --------------- | ----------------- | ------------- |
| GET    | `/bookings`     | Get user bookings | ✅            |
| GET    | `/bookings/:id` | Get booking by ID | ✅            |
| POST   | `/bookings`     | Create booking    | ✅            |
| PUT    | `/bookings/:id` | Update booking    | ✅            |
| DELETE | `/bookings/:id` | Cancel booking    | ✅            |

### Payment Endpoints

| Method | Endpoint                  | Description           | Auth Required |
| ------ | ------------------------- | --------------------- | ------------- |
| POST   | `/payments/create-intent` | Create payment intent | ✅            |
| POST   | `/payments/confirm`       | Confirm payment       | ✅            |
| GET    | `/payments/:id`           | Get payment details   | ✅            |

### User Endpoints

| Method | Endpoint          | Description      | Auth Required |
| ------ | ----------------- | ---------------- | ------------- |
| GET    | `/users/profile`  | Get user profile | ✅            |
| PUT    | `/users/profile`  | Update profile   | ✅            |
| PUT    | `/users/password` | Change password  | ✅            |

### Admin Endpoints

| Method | Endpoint           | Description      | Auth Required |
| ------ | ------------------ | ---------------- | ------------- |
| GET    | `/admin/users`     | Get all users    | ✅ (Admin)    |
| GET    | `/admin/bookings`  | Get all bookings | ✅ (Admin)    |
| GET    | `/admin/stats`     | Get statistics   | ✅ (Admin)    |
| DELETE | `/admin/users/:id` | Delete user      | ✅ (Admin)    |

### Response Format

#### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## 🔐 Environment Variables

| Variable                 | Description               | Required | Default               |
| ------------------------ | ------------------------- | -------- | --------------------- |
| `PORT`                   | Server port               | No       | 5000                  |
| `NODE_ENV`               | Environment mode          | No       | development           |
| `MONGO_URI`              | MongoDB connection string | Yes      | -                     |
| `JWT_SECRET`             | JWT signing secret        | Yes      | -                     |
| `JWT_EXPIRE`             | JWT expiration time       | No       | 7d                    |
| `CLIENT_URL`             | Frontend URL for CORS     | No       | http://localhost:5173 |
| `STRIPE_SECRET_KEY`      | Stripe secret key         | Yes      | -                     |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key    | Yes      | -                     |

## 🛡️ Security

This project implements multiple security layers:

- **Helmet.js**: Sets secure HTTP headers
- **CORS**: Configured to allow only trusted origins
- **Rate Limiting**: Prevents brute force attacks
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Express-validator for request validation
- **XSS Protection**: Sanitization of user inputs
- **Error Handling**: Global error handler prevents information leakage

## 🧪 Testing

```bash
# Run tests (to be implemented)
npm test
```

## 📦 Deployment

### Vercel (Recommended) ✨

This project is optimized for deployment on Vercel.

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy to production**

   ```bash
   vercel --prod
   ```

4. **Set environment variables**
   - Go to your Vercel dashboard
   - Navigate to Settings → Environment Variables
   - Add all required environment variables from `.env`

**Configuration**: The project includes a `vercel.json` file with optimized settings for Express.js deployment.

### Heroku

```bash
heroku create book-now-server
git push heroku main
heroku config:set NODE_ENV=production
```

### Railway

```bash
railway login
railway init
railway up
```

### Docker

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Sarwar**

- GitHub: [@SarwarMorshad](https://github.com/SarwarMorshad)
- Email: dev.sarwarmorshad@gmail.com

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Fast, unopinionated web framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Stripe](https://stripe.com/) - Payment processing platform
- [JWT](https://jwt.io/) - JSON Web Token standard

## 📞 Support

For support, email dev.sarwarmorshad@gmail.com or open an issue in the repository.

---

<div align="center">

**⭐ Star this repository if you find it helpful! ⭐**

Made with ❤️ by Sarwar

</div>
