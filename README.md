# AIM Possible - KISS Full-Stack Application

A lightweight full-stack web application built with React, Node.js, Express, and SQLite following the KISS (Keep It Simple, Stupid) principle.

## Project Overview

This project demonstrates a simple but complete web application architecture with:

- **React frontend**: Modern UI built with TypeScript and Vite
- **Node.js backend**: RESTful API with Express
- **SQLite database**: Persistent storage without complex setup
- **CRUD operations**: Complete item management functionality

Perfect for hackathons, learning, and rapid prototyping.

## Documentation

- [API Documentation](./docs-api.md)
- [Database Schema](./docs-database.md)
- [Development Workflow](./docs-workflow.md)

## Project Structure

```
aim_possible_repo/
├── frontend/                  # React frontend (Vite + TypeScript)
│   ├── src/                   # Source code
│   │   ├── assets/            # Static assets
│   │   ├── App.tsx            # Main application component
│   │   ├── App.css            # Application styles
│   │   └── main.tsx           # Entry point
│   ├── public/                # Public assets
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
│
├── backend/                   # Node.js backend (Express)
│   ├── index.js               # Server entry point
│   ├── database.sqlite        # SQLite database
│   └── package.json           # Backend dependencies
│
└── README.md                  # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm (v6+)

### Setup and Running

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

The server will run on http://localhost:5000

#### Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:5173

## Quick Start (Both Services)

For convenience, you can use the following command to start both services:

```bash
# In one terminal
cd backend && npm run dev

# In another terminal
cd frontend && npm run dev
```

## Deployment

The application can be deployed on any platform supporting Node.js:

1. Build the frontend: 
   ```bash
   cd frontend && npm run build
   ```

2. Move the build files to backend/public
3. Configure the backend to serve static files
4. Deploy the backend folder to your hosting service

## API Endpoints

This application provides a RESTful API for managing items. For detailed API documentation, see [API Documentation](./docs-api.md).

Basic endpoints:

- `GET /api/items` - Get all items
- `POST /api/items` - Create a new item

See the API documentation for implementation details and examples.

## Contributing

Please read the [Development Workflow](./docs-workflow.md) guidelines before contributing to this project. 