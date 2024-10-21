const express = require('express');
const mysql = require('mysql2');
const app = express();
const cors = require('cors');

app.use(cors());

// Підключення до бази даних з використанням mysql2
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123123123',
  database: 'RealEstateOperations',
});

// Підключення до БД
db.connect((err) => {
  if (err) {
    console.log('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

app.get('/data', (req, res) => {
  const { table, email, sort } = req.query;

  // Перевірка, яку таблицю потрібно вибрати
  const validTables = ['Owners', 'Properties', 'Transactions'];
  if (!validTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table selected' });
  }

  // Базовий запит
  let query = `SELECT * FROM ${mysql.escapeId(table)}`;

  // Фільтрація за email для таблиці Owners
  if (table === 'Owners' && email) {
    query += ` WHERE Email LIKE '%${email}%'`;
  }

  // Сортування за стовпцем
  if (sort) {
    query += ` ORDER BY ${mysql.escapeId(sort)}`;
  }

  // Виконання запиту
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Запит на отримання даних за діапазоном значень
app.get('/range', (req, res) => {
  const { table, field, min, max } = req.query;

  // Перевірка, яку таблицю і поле потрібно обробити
  if (!table || !field || !min || !max) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const query = `SELECT * FROM ${mysql.escapeId(table)} WHERE ${mysql.escapeId(
    field
  )} BETWEEN ? AND ?`;

  // Виконання запиту з діапазоном
  db.query(query, [min, max], (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Запит для внутрішнього з'єднання
app.get('/join', (req, res) => {
  const query = `
      SELECT Owners.FullName, Properties.Address, Properties.Price
      FROM Owners
      INNER JOIN Properties ON Owners.OwnerID = Properties.PropertyID`;

  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

// Запит для отримання середнього, максимального і мінімального значень
app.get('/stats', (req, res) => {
  const { table, field } = req.query;

  if (!table || !field) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const query = `
      SELECT AVG(${mysql.escapeId(field)}) AS AverageValue,
             MAX(${mysql.escapeId(field)}) AS 'MaxValue',
             MIN(${mysql.escapeId(field)}) AS MinValue
      FROM ${mysql.escapeId(table)}`;

  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results[0]);
  });
});

// Запит для групування з GROUP BY
app.get('/group', (req, res) => {
  const { table, field, groupBy } = req.query;

  if (!table || !field || !groupBy) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const query = `
      SELECT ${mysql.escapeId(groupBy)}, COUNT(${mysql.escapeId(
    field
  )}) AS Count
      FROM ${mysql.escapeId(table)}
      GROUP BY ${mysql.escapeId(groupBy)}`;

  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(results);
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
