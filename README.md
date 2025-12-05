# 🧾 Invoice & Inventory API

A simple **Express.js API** with JWT authentication that supports:

- User **registration** and **login**
- **Access & refresh token** authentication
- **Protected routes** for invoices and inventory
- **Invoice creation with validation**
- **In-memory storage** (no database; suitable for testing/demo)

---

## 📂 Table of Contents

1. [Installation](#installation)
2. [Running the Project](#running-the-project)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Preloaded Data](#preloaded-data)
6. [Invoice Creation Example](#invoice-creation-example)
7. [Notes](#notes)

---

## ⚙️ Installation

```powershell
# Clone the repository
git clone <your-repo-url>
cd <your-project-folder>

# Install dependencies
npm install
```

## ▶️ Running the Project

```powershell
node server.js
```

The server listens on port `3000` by default.

## 🔒 Authentication

This API uses JWT access and refresh tokens.

- **Access token**: expires in 15 minutes.
- **Refresh token**: expires in 7 days.

Store tokens securely on the frontend. For protected requests include the header:

`Authorization: Bearer <accessToken>`

## 🧭 API Endpoints

- **POST /register**
  - **Auth**: none
  - **Request body**: `{ "username": "string", "password": "string" }`
  - **Responses**:
    - `400` if missing fields
    - `400` if user already exists
    - `200` `{ message: "User registered successfully", user: { id, username } }`

- **POST /login**
  - **Auth**: none
  - **Request body**: `{ "username": "string", "password": "string" }`
  - **Responses**:
    - `400` if missing username/password
    - `401` if invalid credentials
    - `200` `{ "message": "Login successful", "accessToken": "<JWT>", "refreshToken": "<JWT>" }`
  - **Notes**: The server validates credentials against the in-memory `users` array.

- **POST /refresh**
  - **Auth**: none (send refresh token in body)
  - **Request body**: `{ "refreshToken": "<refresh-token>" }`
  - **Responses**:
    - `401` if no token provided
    - `403` if token not found or invalid
    - `200` `{ "accessToken": "<new-access-token>" }`

- **GET /invoices**
  - **Auth**: Bearer access token required
  - **Headers**: `Authorization: Bearer <accessToken>`
  - **Responses**:
    - `401` if no token provided
    - `403` if token invalid/expired
    - `200` `{ message: "Protected data", user: <token-payload>, invoices: [ ... ] }`

- **POST /invoices**
  - **Auth**: Bearer access token required
  - **Headers**: `Authorization: Bearer <accessToken>`
  - **Request body**:
    ```json
    {
      "customer": "string",
      "date": "YYYY-MM-DD",
      "dueDate": "YYYY-MM-DD",
      "description": "string (optional)",
      "items": [ { "item": "string", "qty": number, "price": number } ]
    }
    ```
  - **Validation rules**:
    - `customer`, `date`, `dueDate` required
    - `date` and `dueDate` must be valid dates
    - `dueDate` cannot be earlier than `date`
    - `items` must be a non-empty array
    - each `item` must have `item` (string), `qty` > 0, `price` > 0
  - **Behavior**:
    - `amount` is auto-calculated as sum(qty * price)
    - `invoiceNumber` auto-generated as `INV-<n>`
    - `status` defaults to `Unpaid`
  - **Responses**:
    - `400` for validation errors
    - `200` `{ message: "Invoice created successfully", invoice: { ... } }`

### Example requests (PowerShell)

Register:

```powershell
$body = '{"username":"alice","password":"pass123"}'
curl -Method POST -Uri http://localhost:3000/register -Body $body -Headers @{"Content-Type"="application/json"}
```

Login:

```powershell
$body = '{"username":"test","password":"12345"}'
curl -Method POST -Uri http://localhost:3000/login -Body $body -Headers @{"Content-Type"="application/json"}
```

Get invoices (use token):

```powershell
curl -Method GET -Uri http://localhost:3000/invoices -Headers @{"Authorization"="Bearer <accessToken>"}
```

Refresh access token:

```powershell
$body = '{"refreshToken":"<refreshToken>"}'
curl -Method POST -Uri http://localhost:3000/refresh -Body $body -Headers @{"Content-Type"="application/json"}
```

## 📦 Preloaded Data

- **User**: The project starts with an in-memory user for testing: `username: test`, `password: 12345`.
- **Invoices**: A handful of example invoices are preloaded in the `invoices` array in `server.js`.
- **In-memory store**: All data (users, refresh tokens, invoices) is stored in memory; restarting the server resets state.

## 🧾 Invoice Creation Example

Example payload to create an invoice:

```json
{
  "customer": "David Miller",
  "date": "2025-02-10",
  "dueDate": "2025-02-20",
  "description": "Graphic design services",
  "items": [
    { "item": "Logo design", "qty": 1, "price": 100 },
    { "item": "Brand kit", "qty": 1, "price": 150 }
  ]
}
```

## ⚠️ Notes

- This project is for frontend/demo usage. Do not use plaintext passwords, secrets in code, or the in-memory refresh store in production.
- If you want, I can add small frontend examples (fetch/Axios) showing login, storing tokens, calling protected endpoints, and refreshing tokens automatically.

---

Happy testing — tell me if you want example frontend code added.
# 🧾 Invoice & Inventory API

A simple **Express.js API** with JWT authentication that supports:

- User **registration** and **login**  
- **Access & refresh token** authentication  
- **Protected routes** for invoices and inventory  
- **Invoice creation with validation**  
- **In-memory storage** (no database; suitable for testing/demo)  

---

## 📂 Table of Contents

1. [Installation](#installation)  
2. [Running the Project](#running-the-project)  
3. [Authentication](#authentication)  
4. [API Endpoints](#api-endpoints)  
   - [Register User](#register-user)  
   - [Login](#login)  
   - [Refresh Token](#refresh-token)  
   - [List Items](#list-items)  
   - [Invoice Routes](#invoice-routes)  
   - [Inventory Routes](#inventory-routes)  
5. [Preloaded Data](#preloaded-data)  
6. [Invoice Creation Example](#invoice-creation-example)  
7. [Notes](#notes)  

---

## ⚙️ Installation


# Clone the repository
git clone <your-repo-url>
cd <your-project-folder>

# Install dependencies
npm install

# Invoice creation Payload
{
  "customer": "David Miller",
  "date": "2025-02-10",
  "dueDate": "2025-02-20",
  "description": "Graphic design services",
  "items": [
    { "item": "Logo design", "qty": 1, "price": 100 },
    { "item": "Brand kit", "qty": 1, "price": 150 }
  ]
}



## Frontend Implementation Guide (short)

Tech stack:
- ShadCN UI (components) + Tailwind CSS
- React + Next Js
- React Hook Form (forms & validation)
- React Query (@tanstack/react-query) for caching
- Axios (API client)
- Typescript

Primary frontend tasks (concise):
- Build **Login** and **Register** forms using `react-hook-form` and ShadCN input components.
- Implement **refresh-token handling**: keep access token in memory (or React context), store refresh token securely for demo (localStorage) and use an Axios interceptor to call `POST /refresh` and retry failed requests.
- Show **Invoice list** in a beautiful table (ShadCN/Table or headless table + Tailwind) with sorting, pagination (optional), and row actions.
- Build **Invoice create** form with dynamic `items` (add/remove rows) and validation via React Hook Form.
- Create **reusable components**: `Input`, `Button`, `Table`, `Modal`, `AuthForm`, `InvoiceForm`, and `ProtectedRoute`.

Recommended folder structure (simple, scalable):



Short notes / best practices:
- Prefer httpOnly cookies for refresh tokens in production; this guide uses localStorage for simplicity in demos.
- Keep access token in memory (React context) to reduce XSS exposure; refresh via interceptor on 401 errors.
- Use React Query for caching, optimistic updates, and automatic refetching.
- Keep UI small, build reusable primitives with ShadCN and Tailwind utility classes.


