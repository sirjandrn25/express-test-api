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

```bash
# Clone the repository
git clone <your-repo-url>
cd <your-project-folder>

# Install dependencies
npm install
