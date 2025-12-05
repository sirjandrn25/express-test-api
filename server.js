import express from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// ---------------------------
// CONFIG
// ---------------------------
const ACCESS_TOKEN_SECRET = "access-secret-example";
const REFRESH_TOKEN_SECRET = "refresh-secret-example";

let refreshTokensStore = []; // In-memory store
let users = [
  {
    username:"test",
    password:"12345"
  }
]; // { id, username, password }

// ---------------------------
// Generate Tokens
// ---------------------------
function generateAccessToken(user) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken(user) {
  const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
  refreshTokensStore.push(refreshToken);
  return refreshToken;
}

// ---------------------------
// LOGIN (mock user, no DB)
// ---------------------------
const mockUser = {
  username: "testuser",
  password: "123456", // plain text for demo only
  id: 1
};

app.post("/login", (req, res) => {
    const { username, password } = req.body;

  // 1️⃣ Check if username or password missing
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

   // Validate user
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid username or password" });// 2️⃣ Validate credentials
 

  // 3️⃣ Create tokens
  const userPayload = { id: mockUser.id, username: mockUser.username };

  const accessToken = generateAccessToken(userPayload);
  const refreshToken = generateRefreshToken(userPayload);

  return res.json({
    message: "Login successful",
    accessToken,
    refreshToken
  });
});


app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  // Check if user exists
  const exists = users.find((u) => u.username === username);
  if (exists) return res.status(400).json({ message: "User already exists" });

  // Create user
  const newUser = {
    id: users.length + 1,
    username,
    password // plain text for demo
  };

  users.push(newUser);

  res.json({
    message: "User registered successfully",
    user: { id: newUser.id, username: newUser.username }
  });
});

// ---------------------------
// REFRESH TOKEN
// ---------------------------
app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "No token" });
  if (!refreshTokensStore.includes(refreshToken))
    return res.status(403).json({ message: "Invalid refresh token" });

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token failed" });

    const accessToken = generateAccessToken({ id: user.id, username: user.username });
    res.json({ accessToken });
  });
});

// ---------------------------
// MIDDLEWARE: PROTECT ROUTES
// ---------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // attach user to request
    next();
  });
}

const  invoices = [
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
    items: [
      { item: "Consultation Session", qty: 2, price: 60 }
    ]
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
// PROTECTED ROUTE
// ---------------------------
app.get("/invoices", authenticateToken, (req, res) => {
  res.json({
    message: "Protected data",
    user: req.user,
    invoices,
  });
});

// CREATE INVOICE (PROTECTED)
app.post("/invoices", authenticateToken, (req, res) => {
  const { customer, date, dueDate, description, items } = req.body;

  // ----------------------
  // VALIDATION
  // ----------------------

  if (!customer) return res.status(400).json({ message: "Customer is required" });
  if (!date) return res.status(400).json({ message: "Invoice date is required" });
  if (!dueDate) return res.status(400).json({ message: "Due date is required" });

  // Date validation
  const dateObj = new Date(date);
  const dueObj = new Date(dueDate);

  if (isNaN(dateObj)) return res.status(400).json({ message: "Invalid date format" });
  if (isNaN(dueObj)) return res.status(400).json({ message: "Invalid due date format" });

  if (dueObj < dateObj)
    return res.status(400).json({ message: "Due date cannot be earlier than invoice date" });

  // Items validation
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: "Items are required" });

  for (let item of items) {
    if (!item.item || typeof item.item !== "string")
      return res.status(400).json({ message: "Item name is required" });
    if (!item.qty || item.qty <= 0)
      return res.status(400).json({ message: "Item quantity must be > 0" });
    if (!item.price || item.price <= 0)
      return res.status(400).json({ message: "Item price must be > 0" });
  }

  // Auto-calc total amount
  const amount = items.reduce((sum, it) => sum + it.qty * it.price, 0);

  // Generate invoice
  const newInvoice = {
    id: invoices.length + 1,
    invoiceNumber: getNextInvoiceNumber(),
    customer,
    amount,
    date,
    dueDate,
    status: "Unpaid",
    description: description || "",
    items
  };

  invoices.push(newInvoice);

  res.json({
    message: "Invoice created successfully",
    invoice: newInvoice
  });
});
// ---------------------------
app.listen(3000, () => console.log("Server running on port 3000"));
