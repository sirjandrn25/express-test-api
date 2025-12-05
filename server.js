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

  // 2️⃣ Validate credentials
  if (username !== mockUser.username || password !== mockUser.password) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

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

// ---------------------------
// PROTECTED ROUTE
// ---------------------------
app.get("/list", authenticateToken, (req, res) => {
  res.json({
    message: "Protected data",
    user: req.user,
    items: ["Item 1", "Item 2", "Item 3"],
  });
});

// ---------------------------
app.listen(3000, () => console.log("Server running on port 3000"));
