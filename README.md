# Movie Management API

A RESTful API for managing movie data, including user authentication and authorization. This project is built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization with JWT
- Secure password management with bcrypt
- User roles and permissions
- CRUD operations for user accounts
- Error handling and data validation

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT
- **Data Validation:** Validator
- **Password Encryption:** Bcrypt.js
- **Utilities:** Crypto

## Getting Started

### Prerequisites

- Node.js installed on your machine
- MongoDB server or MongoDB Atlas account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/D-4-DIBAKAR/Movie-Management-API.git
   cd Movie-Management-API
   ```

2. Install dependencies:

```bash
  npm install
```

3. Create a .env file in the root directory and add your environment variables:

```env
  NODE_ENV=production
  PORT=<Your Port>
  CONN_STR=<Your mongodb URI>
  SECRET_STR=<SECRET_STR>
  LOGIN_EXPIRES=10000000000

  # EMAIL CREDENTIALS
  EMAIL_USER=<Your email user>
  EMAIL_PASSWORD=<Your email password>
  EMAIL_HOST=<Your email host>
  EMAIL_PORT=<Email port> # Available ports: 25, 465, 587, or 2525
```

4. Start the server:

- For development mode:
  ```bash
    npm start
  ```
- For production mode:
  ```bash
    npm run start_prod
  ```

## API Endpoints

**User Routes**

- Register a new user: POST `/api/v1/users/register`
- Login a user: POST `/api/v1/users/login`
- Update user password: PATCH `/api/v1/users/updatePassword`
- Forgot password: POST `/api/v1/users/forgotPassword`
- Reset password: PATCH `/api/v1/users/resetPassword/:token`
- Get user profile: GET `/api/v1/users/profile`
- Deactivate a user: PATCH `/api/v1/users/deactivate`

**Movie Routes**
  - Get all movies: GET `/api/v1/movies`
  - Get a movie by ID: GET `/api/v1/movies/:id`
  - Create a new movie: POST `/api/v1/movies`
  - Update a movie: PATCH `/api/v1/movies/:id`
  - Delete a movie: DELETE `/api/v1/movies/:id`

## Models

- **User Model**

  - **name:** String, required
  - **email:** String, required, unique, validated
  - **photo:** String
  - **role:** String, enum ['user', 'admin'], default: 'user'
  - **password:** String, required, minLength: 8, select: false
  - **confirmPassword:** String, required, validate: function that matches password
  - **active:** Boolean, default: true, select: false
  - **passwordChangedAt:** Date
  - **passwordResetToken:** String
  - **passwordResetTokenExpires:** Date

- **Methods**
  - **comparePasswordIndb:** Compares the provided password with the stored password.
  - **isPasswordChanged:** Checks if the password was changed after the JWT was issued.
  - **createdResetPasswordToken:** Creates a password reset token.
- **Movie Model**

    - **name:** String, required, unique, maxLength: 100, minLength: 4, trim
    - **description:** String, required, trim
    - **duration:** Number, required
    - **ratings:** Number, validate: function that checks if the rating is between 1.0 and 10.0
    - **totalRatings:** Number
    - **releaseYear:** Number, required
    - **releaseDate:** Date
    - **createdAt:** Date, default: Date.now(), select: false
    - **genres:** [String], required
    - **directors:** [String], required
    - **coverImage:** String, required
    - **actors:** [String], required
    - **price:** Number, required
    - **createdBy:** String, default: "DIBAKAR"
- **Virtual Properties**

  - **durationInHours:** Converts duration from minutes to hours.
- **Middleware (Hooks)**

  - **Pre-save Hook:** Sets the createdBy field to "DIBAKAR" before saving a document.
  - Post-save Hook: Logs the creation of a new movie document with its name and creator.
  - **Pre-find Hook:** Filters movies to only include those released on or before the current date and logs the start time of the query.
  - **Post-find Hook:** Logs the duration it took to execute the query.
  - **Pre-aggregate Hook:** Adds a match stage to the aggregation pipeline to include only movies released on or before the current date.
