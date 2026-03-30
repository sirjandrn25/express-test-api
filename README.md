# Invoice API (Frontend Interview Ready)

A simple Express API with JWT authentication, invoice CRUD, pagination, and structured field-level validation errors.

## Features

- Register, login, and refresh token flow
- Protected invoice endpoints
- Invoice create and update (both PATCH and POST)
- Pagination, filtering, sorting, and search on invoice list
- Validation responses with `field` and `message`
- In-memory data storage for quick demo/testing

## Installation

```bash
git clone <your-repo-url>
cd <your-project-folder>
npm install
```

## Run

```bash
npm run dev
```

Server runs on `http://localhost:4000`.

## Authentication

Use bearer token for protected endpoints:

```http
Authorization: Bearer <accessToken>
```

Access token expires in 15 minutes, refresh token in 7 days.

## Standard Error Shape

For validation failures:

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "customer", "message": "Customer is required" },
    { "field": "items.0.qty", "message": "Item quantity must be greater than 0" }
  ]
}
```

## Endpoints

### 1) Register

- `POST /register`
- Auth: none
- Body:

```json
{
  "username": "alice",
  "password": "pass123"
}
```

- Responses:
  - `200` success
  - `400` field validation errors

### 2) Login

- `POST /login`
- Auth: none
- Body:

```json
{
  "username": "alice",
  "password": "pass123"
}
```

- Responses:
  - `200` returns access and refresh token
  - `400` field validation errors
  - `401` invalid credentials

### 3) Refresh Access Token

- `POST /refresh`
- Auth: none
- Body:

```json
{
  "refreshToken": "<refreshToken>"
}
```

- Responses:
  - `200` new access token
  - `401` missing refresh token
  - `403` invalid/expired refresh token

### 4) List Invoices (Paginated)

- `GET /invoices`
- Auth: required
- Query params:
  - `page` default `1`
  - `limit` default `10`, max `100`
  - `status` (e.g. `Paid`, `Unpaid`, `Overdue`)
  - `q` search text (customer, invoiceNumber, description)
  - `sortBy` one of: `id`, `invoiceNumber`, `customer`, `amount`, `date`, `dueDate`, `status`
  - `order` `asc` or `desc`

Example:

```http
GET /invoices?page=1&limit=5&status=Unpaid&sortBy=date&order=desc&q=alice
```

Response:

```json
{
  "message": "Invoices fetched successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 0,
    "totalPages": 1
  }
}
```

### 5) Create Invoice

- `POST /invoices`
- Auth: required
- Body:

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

- Responses:
  - `200` created invoice
  - `400` field validation errors

### 6) Update Invoice (PATCH)

- `PATCH /invoices/:id`
- Auth: required
- Partial update accepted, but final invoice remains fully validated.
- Example body:

```json
{
  "customer": "Updated Customer",
  "items": [
    { "item": "Updated item", "qty": 2, "price": 90 }
  ]
}
```

- Responses:
  - `200` updated invoice
  - `400` field validation errors
  - `404` invoice not found

### 7) Update Invoice (POST)

- `POST /invoices/:id`
- Auth: required
- Full update behavior using same validation as create.
- Example body:

```json
{
  "customer": "Client Name",
  "date": "2025-03-01",
  "dueDate": "2025-03-10",
  "description": "Updated invoice",
  "items": [
    { "item": "Service", "qty": 1, "price": 300 }
  ]
}
```

- Responses:
  - `200` updated invoice
  - `400` field validation errors
  - `404` invoice not found

### 8) Update Invoice (PUT)

- `PUT /invoices/:id`
- Auth: required
- Full update behavior using same validation as create.
- Example body:

```json
{
  "customer": "Client Name",
  "date": "2025-03-01",
  "dueDate": "2025-03-10",
  "description": "Updated invoice with put",
  "items": [
    { "item": "Service", "qty": 1, "price": 300 }
  ]
}
```

- Responses:
  - `200` updated invoice
  - `400` field validation errors
  - `404` invoice not found

### 9) Delete Invoice

- `DELETE /invoices/:id`
- Auth: required
- Responses:
  - `200` deleted invoice payload
  - `404` invoice not found

## Notes

- `amount` is always recalculated from `items` on create and update.
- Data is stored in memory, so restarting server resets users, tokens, and invoices.
- This project is demo-ready for frontend interviews, not production-ready.
