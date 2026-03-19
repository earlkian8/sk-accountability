require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// --- Routes ---
app.use('/api', apiRouter);

// --- Health check ---
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'SKCheck' }));

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`SKCheck backend running on http://localhost:${PORT}`);
});