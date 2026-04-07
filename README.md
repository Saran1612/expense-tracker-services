# Expense Tracker Service

A Node.js Express backend service for the Expense Tracker application.

## Setup

1. Install dependencies:
```
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
PORT=5000
NODE_ENV=development
```

## Running the server

### Development mode
```
npm run dev
```

### Production mode
```
npm start
```

## API Endpoints

- `GET /`: Welcome message
- `GET /api`: API status check

## Project Structure

```
services/
├── config/         # Configuration files
├── controllers/    # Route controllers (future use)
├── middlewares/    # Custom middlewares
├── models/         # Data models (future use)
├── routes/         # API routes
├── utils/          # Utility functions
├── .env            # Environment variables
├── package.json    # Project dependencies
├── server.js       # Main server file
└── README.md       # Project documentation
``` 