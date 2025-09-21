const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["https://qwipo-customer-management-frontend.vercel.app/"],
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Database initialization
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // Create tables if they don't exist
    db.run(`CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone_number TEXT NOT NULL UNIQUE
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      address_details TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pin_code TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    )`);
  }
});

// Customer Routes

// Create a new customer
app.post('/api/customers', (req, res) => {
  const { first_name, last_name, phone_number } = req.body;
  
  // Validation
  if (!first_name || !last_name || !phone_number) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const sql = `INSERT INTO customers (first_name, last_name, phone_number) 
               VALUES (?, ?, ?)`;
  const params = [first_name, last_name, phone_number];
  
  db.run(sql, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Phone number already exists' });
      }
      return res.status(400).json({ error: err.message });
    }
    res.json({
      message: 'Customer created successfully',
      data: { id: this.lastID, first_name, last_name, phone_number }
    });
  });
});

// Get all customers with search, sort, and pagination
app.get('/api/customers', (req, res) => {
  const { search, sortBy = 'last_name', sortOrder = 'ASC', page = 1, limit = 10 } = req.query;
  
  let sql = `SELECT * FROM customers`;
  let countSql = `SELECT COUNT(*) as total FROM customers`;
  let params = [];
  
  // Add search filter if provided
  if (search) {
    const searchCondition = ` WHERE first_name LIKE ? OR last_name LIKE ? OR phone_number LIKE ?`;
    sql += searchCondition;
    countSql += searchCondition;
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }
  
  // Add sorting
  sql += ` ORDER BY ${sortBy} ${sortOrder}`;
  
  // Add pagination
  const offset = (page - 1) * limit;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  // Get total count
  db.get(countSql, params.slice(0, -2), (err, countResult) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    // Get paginated data
    db.all(sql, params, (err, rows) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({
        message: 'Success',
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Get a single customer
app.get('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM customers WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Success', data: row });
  });
});

// Update a customer
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone_number } = req.body;
  
  // Validation
  if (!first_name || !last_name || !phone_number) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const sql = `UPDATE customers SET first_name = ?, last_name = ?, phone_number = ? 
               WHERE id = ?`;
  const params = [first_name, last_name, phone_number, id];
  
  db.run(sql, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Phone number already exists' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer updated successfully' });
  });
});

// Delete a customer
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(`DELETE FROM customers WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

// Address Routes

// Get all addresses for a customer
app.get('/api/customers/:id/addresses', (req, res) => {
  const { id } = req.params;
  
  db.all(`SELECT * FROM addresses WHERE customer_id = ?`, [id], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Success', data: rows });
  });
});

// Add a new address for a customer
app.post('/api/customers/:id/addresses', (req, res) => {
  const { id } = req.params;
  const { address_details, city, state, pin_code } = req.body;
  
  // Validation
  if (!address_details || !city || !state || !pin_code) {
    return res.status(400).json({ error: 'All address fields are required' });
  }
  
  const sql = `INSERT INTO addresses (customer_id, address_details, city, state, pin_code) 
               VALUES (?, ?, ?, ?, ?)`;
  const params = [id, address_details, city, state, pin_code];
  
  db.run(sql, params, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({
      message: 'Address added successfully',
      data: { 
        id: this.lastID, 
        customer_id: id, 
        address_details, 
        city, 
        state, 
        pin_code 
      }
    });
  });
});

// Update an address
app.put('/api/addresses/:addressId', (req, res) => {
  const { addressId } = req.params;
  const { address_details, city, state, pin_code } = req.body;
  
  // Validation
  if (!address_details || !city || !state || !pin_code) {
    return res.status(400).json({ error: 'All address fields are required' });
  }
  
  const sql = `UPDATE addresses SET address_details = ?, city = ?, state = ?, pin_code = ? 
               WHERE id = ?`;
  const params = [address_details, city, state, pin_code, addressId];
  
  db.run(sql, params, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json({ message: 'Address updated successfully' });
  });
});

// Delete an address
app.delete('/api/addresses/:addressId', (req, res) => {
  const { addressId } = req.params;
  
  db.run(`DELETE FROM addresses WHERE id = ?`, [addressId], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json({ message: 'Address deleted successfully' });
  });
});

// Search by city, state, or pincode
app.get('/api/addresses/search', (req, res) => {
  const { city, state, pin_code } = req.query;
  
  let sql = `
    SELECT c.id as customer_id, c.first_name, c.last_name, a.* 
    FROM addresses a
    JOIN customers c ON a.customer_id = c.id
    WHERE 1=1
  `;
  let params = [];
  
  if (city) {
    sql += ` AND a.city LIKE ?`;
    params.push(`%${city}%`);
  }
  
  if (state) {
    sql += ` AND a.state LIKE ?`;
    params.push(`%${state}%`);
  }
  
  if (pin_code) {
    sql += ` AND a.pin_code LIKE ?`;
    params.push(`%${pin_code}%`);
  }
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Success', data: rows });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
