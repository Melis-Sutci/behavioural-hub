# behavioural-hub
Behavioral Analytics Platform

## Prerequisites

- Node.js 22.x (LTS)
- npm or yarn

**Important:** This project requires Node.js 22.x due to native module dependencies. Node.js 24+ is not yet supported by `better-sqlite3`.

## Setup

### 1. Install Node.js 22

If you're using nvm (Node Version Manager):

```bash
nvm install 22
nvm use 22
```

The project includes `.nvmrc` files, so you can also run:

```bash
nvm use
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Start the Backend Server

```bash
npm run dev
```

The backend API will be available at `http://localhost:3001`.

## Troubleshooting

### Build Errors with better-sqlite3

If you encounter compilation errors like "C++20 or later required", ensure you're using Node.js 22.x:

```bash
node --version  # Should show v22.x.x
```

If you're on Node.js 24+, downgrade to Node.js 22 using nvm or your preferred Node.js version manager.
