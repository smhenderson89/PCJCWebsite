const express = require('express');
const router = express.Router();
const db = require('../testDB');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, user) => {
      if (err) {
        console.error('DB error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({ message: 'Login successful', user });
    }
  );
});

module.exports = router;