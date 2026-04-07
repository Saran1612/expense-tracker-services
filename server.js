const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const connectDB = require('./src/config/db.connection');

connectDB();


// Route imports
const authRoutes = require('./src/routes/auth.routes');
const askaiRoutes = require('./src/routes/askai.routes');
const categoryRoutes = require('./src/routes/category.routes');
const expenseRoutes = require('./src/routes/expense.routes');
const budgetRoutes = require('./src/routes/budget.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', askaiRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((req, res, next) => {
  const error = new Error('Not Found');
console.log(error, "error")
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
}); 