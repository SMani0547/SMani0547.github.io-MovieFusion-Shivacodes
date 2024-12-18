const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let users = [];
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',      // Replace with your database host
    user: 'root',           // Replace with your database username
    password: 'heu4moje',   // Replace with your database password
    database: 'items',      // Replace with your database name
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL database');

  });


const admin = { email: "admin@admin.admin", password: "admin" };

// Endpoint to add a new item
app.post('/add-item', (req, res) => {
    const { name, description, link, poster, rating, length, audience_age, category } = req.body;

    if (!link) {
        return res.status(400).send('No video link provided.');
    }

    const query = 'INSERT INTO items (name, description, link, poster, rating, length, audience_age, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [name, description, link, poster, rating, length, audience_age, category], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err.message);
            res.status(500).send('Error inserting data');
        } else {
            res.status(200).send('Item added successfully');
        }
    });
});

// Endpoint to fetch all items from the database
app.get('/get-items', (req, res) => {
    const query = 'SELECT * FROM items';  // SQL query to fetch all items
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err.message);
            res.status(500).send('Error fetching data');
        } else {
            res.status(200).json(results);  // Send the fetched data as a JSON response
        }
    });
});

// Fetch a single item by ID
app.get('/get-item/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM items WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching item:', err.message);
            res.status(500).send('Error fetching item');
        } else {
            res.status(200).json(results[0]);
        }
    });
});



// DELETE endpoint to delete an item by ID
app.delete('/delete-item/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM items WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error deleting item:', err);  // Log the error
            return res.status(500).json({ error: 'Failed to delete item' });
        }

        if (results.affectedRows > 0) {
            console.log(`Item with ID ${id} deleted successfully`);
            res.json({ success: true });
        } else {
            console.log(`Item with ID ${id} not found`);
            res.status(404).json({ error: 'Item not found' });
        }
    });
});

app.get('/get-items', (req, res) => {
    db.getItems((err, items) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch items' });
        }
        res.json(items);  // Respond with an array of items
    });
});
app.get('/items', (req, res) => {
    const query = 'SELECT * FROM items';  // Adjust the query to match your table name
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ error: 'Failed to fetch items' });
        }
        res.json(results);  // Send the results back as a JSON array
    });
});

// Update an item
app.put('/item/:id', (req, res) => {
    const id = req.params.id;
    const { name, description, link, poster, category, audience_age, length } = req.body;
    const query = `
        UPDATE items
        SET name = ?, description = ?, link = ?, poster = ?, category = ?, audience_age = ?, length = ?
        WHERE id = ?`;
    const values = [name, description, link, poster, category, audience_age, length, id];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error updating item:', err);
            return res.status(500).json({ error: 'Failed to update item' });
        }
        res.json({ success: true, message: 'Item updated successfully' });
    });
});
// Route for Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));  // Correct path
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile('login.html', { root: __dirname + '/public' });

});
// Server-side logout route (optional)
app.post('/logout', (req, res) => {
    // Perform server-side cleanup (if needed)
    res.json({ success: true });
});


// Route for user dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile('user.html', { root: __dirname + '/public' });
});
const bcrypt = require('bcryptjs'); // Use bcryptjs
const saltRounds = 10; // Define the number of salt rounds for hashing

app.post('/register', async (req, res) => {
    const { email, username, fname, lname, password } = req.body;

    console.log("Received data from front-end:", req.body);

    try {
        // Check if email already exists
        const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (results.length > 0) {
            return res.json({ success: false, message: "Email is already registered" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user with hashed password
        const query = `INSERT INTO users (email, username, first_name, last_name, password, created_at)
                       VALUES (?, ?, ?, ?, ?, NOW())`;

        await db.promise().query(query, [email, username, fname, lname, hashedPassword]);

        console.log("User registered successfully:", { email, username, fname, lname });
        res.json({ success: true });
    } catch (err) {
        console.error("Error during registration:", err);
        res.json({ success: false, message: "Server error during registration" });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Admin login check (hardcoded credentials)
    if (email === admin.email && password === admin.password) {
        return res.json({ success: true, role: "admin", username: "admin" });
    }

    try {
        // Query database for user by email
        const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        // If user is found
        if (results.length > 0) {
            const user = results[0]; // First result in case of multiple matches (shouldn't happen)

            // Compare hashed password using bcryptjs
            const isPasswordValid = await bcrypt.compare(password, user.password);

            // If password is valid, return user role and username
            if (isPasswordValid) {
                res.json({
                    success: true,
                    role: "user",
                    username: user.username,
                   email: user.email// Include username in response
                });
            } else {
                res.json({ success: false, message: "Invalid email or password" });

            }
        } else {
            res.json({ success: false, message: "Invalid email or password" });
        }
    } catch (err) {
        console.error("Error during login:", err);
        res.json({ success: false, message: "Server error during login" });
    }
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
