import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000"
  })
);
app.use(express.json());

// ---------------------------
// CONFIG
// ---------------------------
const ACCESS_TOKEN_SECRET = "access-secret-example";
const REFRESH_TOKEN_SECRET = "refresh-secret-example";

function generateAccessToken(user) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken(user) {
  const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
  refreshTokensStore.push(refreshToken);
  return refreshToken;
}

let refreshTokensStore = []; // In-memory store
let users = [
  {
    id: 1,
    username: "test",
    password: "12345"
  }
];

const invoices = [
  {
    id: 1,
    invoiceNumber: "INV-1001",
    customer: "John Doe",
    amount: 250,
    date: "2025-01-05",
    dueDate: "2025-01-15",
    status: "Paid",
    description: "Web design services",
    items: [
      { item: "Website mockup", qty: 1, price: 150 },
      { item: "Revisions", qty: 2, price: 50 }
    ]
  },
  {
    id: 2,
    invoiceNumber: "INV-1002",
    customer: "Alice Smith",
    amount: 120,
    date: "2025-01-08",
    dueDate: "2025-01-18",
    status: "Unpaid",
    description: "Consultation session",
    items: [{ item: "Consultation Session", qty: 2, price: 60 }]
  },
  {
    id: 3,
    invoiceNumber: "INV-1003",
    customer: "Bob Johnson",
    amount: 430,
    date: "2025-01-12",
    dueDate: "2025-01-22",
    status: "Overdue",
    description: "Office hardware supply",
    items: [
      { item: "Laptop", qty: 1, price: 300 },
      { item: "Keyboard", qty: 2, price: 40 },
      { item: "Mouse", qty: 2, price: 25 }
    ]
  },
  {
    id: 4,
    invoiceNumber: "INV-1004",
    customer: "Emily Carter",
    amount: 680,
    date: "2025-02-01",
    dueDate: "2025-02-11",
    status: "Paid",
    description: "Mobile app UI/UX Design",
    items: [
      { item: "Initial UI Concepts", qty: 1, price: 300 },
      { item: "Prototype", qty: 1, price: 250 },
      { item: "Final Deliverables", qty: 1, price: 130 }
    ]
  },
  {
    id: 5,
    invoiceNumber: "INV-1005",
    customer: "Michael Green",
    amount: 95,
    date: "2025-02-03",
    dueDate: "2025-02-13",
    status: "Unpaid",
    description: "Computer repair service",
    items: [
      { item: "Diagnostics", qty: 1, price: 20 },
      { item: "SSD Replacement", qty: 1, price: 75 }
    ]
  }
];

// ---------------------------
// HELPERS
// ---------------------------
function fieldError(field, message) {
  return { field, message };
}

function sendValidationError(res, errors, message = "Validation failed") {
  return res.status(400).json({
    message,
    errors
  });
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseIsoDate(input) {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeItems(items) {
  return items.map((item) => ({
    item: String(item.item).trim(),
    qty: Number(item.qty),
    price: Number(item.price)
  }));
}

function calculateAmount(items) {
  return items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

function validateInvoicePayload(payload) {
  const errors = [];

  if (!payload.customer || typeof payload.customer !== "string" || !payload.customer.trim()) {
    errors.push(fieldError("customer", "Customer is required"));
  }

  if (!payload.date) {
    errors.push(fieldError("date", "Invoice date is required"));
  }

  if (!payload.dueDate) {
    errors.push(fieldError("dueDate", "Due date is required"));
  }

  const invoiceDate = payload.date ? parseIsoDate(payload.date) : null;
  const dueDate = payload.dueDate ? parseIsoDate(payload.dueDate) : null;

  if (payload.date && !invoiceDate) {
    errors.push(fieldError("date", "Invalid date format. Use YYYY-MM-DD"));
  }

  if (payload.dueDate && !dueDate) {
    errors.push(fieldError("dueDate", "Invalid due date format. Use YYYY-MM-DD"));
  }

  if (invoiceDate && dueDate && dueDate < invoiceDate) {
    errors.push(fieldError("dueDate", "Due date cannot be earlier than invoice date"));
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push(fieldError("items", "Items are required and must be a non-empty array"));
  } else {
    payload.items.forEach((item, index) => {
      if (!item.item || typeof item.item !== "string" || !item.item.trim()) {
        errors.push(fieldError(`items.${index}.item`, "Item name is required"));
      }
      if (!Number.isFinite(Number(item.qty)) || Number(item.qty) <= 0) {
        errors.push(fieldError(`items.${index}.qty`, "Item quantity must be greater than 0"));
      }
      if (!Number.isFinite(Number(item.price)) || Number(item.price) <= 0) {
        errors.push(fieldError(`items.${index}.price`, "Item price must be greater than 0"));
      }
    });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    normalized: {
      customer: payload.customer.trim(),
      date: payload.date,
      dueDate: payload.dueDate,
      description: payload.description ? String(payload.description) : "",
      items: normalizeItems(payload.items)
    }
  };
}

function getNextInvoiceNumber() {
  if (invoices.length === 0) return "INV-1001";
  const last = invoices[invoices.length - 1].invoiceNumber;
  const num = Number.parseInt(last.split("-")[1], 10) + 1;
  return `INV-${num}`;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
      errors: [fieldError("authorization", "Missing Bearer token")]
    });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Forbidden",
        errors: [fieldError("authorization", "Invalid or expired token")]
      });
    }
    req.user = user;
    next();
  });
}

// ---------------------------
// AUTH ROUTES
// ---------------------------
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || !String(username).trim()) {
    errors.push(fieldError("username", "Username is required"));
  }

  if (!password || !String(password).trim()) {
    errors.push(fieldError("password", "Password is required"));
  }

  if (errors.length) {
    return sendValidationError(res, errors);
  }

  const exists = users.find((user) => user.username === String(username).trim());
  if (exists) {
    return sendValidationError(res, [fieldError("username", "User already exists")]);
  }

  const newUser = {
    id: users.length + 1,
    username: String(username).trim(),
    password: String(password)
  };

  users.push(newUser);

  return res.json({
    message: "User registered successfully",
    user: { id: newUser.id, username: newUser.username }
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || !String(username).trim()) {
    errors.push(fieldError("username", "Username is required"));
  }

  if (!password || !String(password).trim()) {
    errors.push(fieldError("password", "Password is required"));
  }

  if (errors.length) {
    return sendValidationError(res, errors);
  }

  const user = users.find(
    (entry) => entry.username === String(username).trim() && entry.password === String(password)
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid username or password",
      errors: [fieldError("credentials", "Invalid username or password")]
    });
  }

  const userPayload = { id: user.id, username: user.username };

  const accessToken = generateAccessToken(userPayload);
  const refreshToken = generateRefreshToken(userPayload);

  return res.json({
    message: "Login successful",
    accessToken,
    refreshToken
  });
});

app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Unauthorized",
      errors: [fieldError("refreshToken", "Refresh token is required")]
    });
  }

  if (!refreshTokensStore.includes(refreshToken)) {
    return res.status(403).json({
      message: "Invalid refresh token",
      errors: [fieldError("refreshToken", "Refresh token not found")]
    });
  }

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Token failed",
        errors: [fieldError("refreshToken", "Invalid or expired refresh token")]
      });
    }

    const accessToken = generateAccessToken({ id: user.id, username: user.username });
    return res.json({ accessToken });
  });
});

// ---------------------------
// INVOICE ROUTES (PROTECTED)
// ---------------------------
app.get("/invoices", authenticateToken, (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(toPositiveInt(req.query.limit, 10), 100);
  const status = req.query.status ? String(req.query.status).trim().toLowerCase() : "";
  const q = req.query.q ? String(req.query.q).trim().toLowerCase() : "";
  const sortBy = req.query.sortBy ? String(req.query.sortBy) : "id";
  const order = req.query.order === "desc" ? "desc" : "asc";

  const allowedSortBy = ["id", "invoiceNumber", "customer", "amount", "date", "dueDate", "status"];
  if (!allowedSortBy.includes(sortBy)) {
    return sendValidationError(res, [
      fieldError("sortBy", "Invalid sortBy value. Use id, invoiceNumber, customer, amount, date, dueDate, or status")
    ]);
  }

  let filtered = [...invoices];

  if (status) {
    filtered = filtered.filter((inv) => inv.status.toLowerCase() === status);
  }

  if (q) {
    filtered = filtered.filter(
      (inv) =>
        inv.customer.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.description || "").toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return order === "asc" ? aValue - bValue : bValue - aValue;
    }

    const compare = String(aValue).localeCompare(String(bValue));
    return order === "asc" ? compare : -compare;
  });

  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * limit;
  const pagedData = filtered.slice(startIndex, startIndex + limit);

  return res.json({
    message: "Invoices fetched successfully",
    data: pagedData,
    meta: {
      page: safePage,
      limit,
      total,
      totalPages
    }
  });
});

app.post("/invoices", authenticateToken, (req, res) => {
  const { errors, normalized } = validateInvoicePayload(req.body);
  if (errors.length) {
    return sendValidationError(res, errors);
  }

  const amount = calculateAmount(normalized.items);

  const newInvoice = {
    id: invoices.length + 1,
    invoiceNumber: getNextInvoiceNumber(),
    customer: normalized.customer,
    amount,
    date: normalized.date,
    dueDate: normalized.dueDate,
    status: "Unpaid",
    description: normalized.description,
    items: normalized.items
  };

  invoices.push(newInvoice);

  return res.json({
    message: "Invoice created successfully",
    invoice: newInvoice
  });
});

app.patch("/invoices/:id", authenticateToken, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const index = invoices.findIndex((invoice) => invoice.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Invoice not found",
      errors: [fieldError("id", "Invoice not found")]
    });
  }

  const mergedPayload = {
    ...invoices[index],
    ...req.body
  };

  const { errors, normalized } = validateInvoicePayload(mergedPayload);
  if (errors.length) {
    return sendValidationError(res, errors);
  }

  const updatedInvoice = {
    ...invoices[index],
    customer: normalized.customer,
    date: normalized.date,
    dueDate: normalized.dueDate,
    description: normalized.description,
    items: normalized.items,
    amount: calculateAmount(normalized.items)
  };

  invoices[index] = updatedInvoice;

  return res.json({
    message: "Invoice updated successfully",
    invoice: updatedInvoice
  });
});

app.post("/invoices/:id", authenticateToken, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const index = invoices.findIndex((invoice) => invoice.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Invoice not found",
      errors: [fieldError("id", "Invoice not found")]
    });
  }

  const { errors, normalized } = validateInvoicePayload(req.body);
  if (errors.length) {
    return sendValidationError(res, errors);
  }

  const updatedInvoice = {
    ...invoices[index],
    customer: normalized.customer,
    date: normalized.date,
    dueDate: normalized.dueDate,
    description: normalized.description,
    items: normalized.items,
    amount: calculateAmount(normalized.items)
  };

  invoices[index] = updatedInvoice;

  return res.json({
    message: "Invoice updated successfully",
    invoice: updatedInvoice
  });
});

app.put("/invoices/:id", authenticateToken, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const index = invoices.findIndex((invoice) => invoice.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Invoice not found",
      errors: [fieldError("id", "Invoice not found")]
    });
  }

  const { errors, normalized } = validateInvoicePayload(req.body);
  if (errors.length) {
    return sendValidationError(res, errors);
  }

  const updatedInvoice = {
    ...invoices[index],
    customer: normalized.customer,
    date: normalized.date,
    dueDate: normalized.dueDate,
    description: normalized.description,
    items: normalized.items,
    amount: calculateAmount(normalized.items)
  };

  invoices[index] = updatedInvoice;

  return res.json({
    message: "Invoice updated successfully",
    invoice: updatedInvoice
  });
});

app.delete("/invoices/:id", authenticateToken, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const index = invoices.findIndex((invoice) => invoice.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Invoice not found",
      errors: [fieldError("id", "Invoice not found")]
    });
  }

  const deletedInvoice = invoices[index];
  invoices.splice(index, 1);

  return res.json({
    message: "Invoice deleted successfully",
    invoice: deletedInvoice
  });
});

// ---------------------------
app.listen(4000, () => console.log("Server running on port 4000"));
