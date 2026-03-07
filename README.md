# Restaurant Management Platform

A robust, full-stack monorepo application designed to manage restaurant operations. This platform includes a dedicated Admin dashboard for management and a User web interface for customers, powered by a central API using Node.js and MongoDB.

## 🚀 Features

- **Centralized API (`apps/api`)**: Built with Express and MongoDB to handle all backend logic, user administration, orders, and products.
- **Admin Dashboard (`apps/admin-web`)**: A web interface tailored for restaurant staff to manage inventory, track orders, and oversee operations.
- **User Portal (`apps/user-web`)**: A customer-facing web application for browsing the menu and placing orders.
- **Monorepo Architecture**: Efficiently shares code and assets between applications using a `packages/` workspace structure.
- **Modern Stack**: Node.js, Express, MongoDB (Atlas), React/Vite (Frontend).

## 🛠️ Project Structure

This project is a monorepo that utilizes npm workspaces.

```text
├── apps/
│   ├── admin-web/       # Frontend for restaurant management
│   ├── api/             # Backend Express API server
│   └── user-web/        # Frontend for customer ordering
├── packages/            # Shared libraries and assets
│   ├── assets/          
│   └── shared/          
├── docker-compose.yml   # For optional local MongoDB setup
└── package.json         # Root configuration for workspaces
```

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) cluster or a local MongoDB instance.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Amplaytro/restaurant-management.git
   cd restaurant-management
   ```

2. Install dependencies for all apps (from the root directory):
   ```bash
   npm install
   ```

3. Setup Environment Variables:
   - Create a `.env` file in the root directory (you can copy `.env.example`).
   - Create identical `.env` files in `apps/api`, `apps/admin-web`, and `apps/user-web`.
   - Update `MONGODB_URI` in your backend `.env` to point to your cluster.

### Running Locally

To run the entire stack concurrently (API, Admin Web, and User Web):

```bash
npm run dev
```

- API Server runs at `http://localhost:4000`
- Admin Web is accessible via its designated Vite port
- User Web is accessible via its designated Vite port

## 📦 Deployment Guides

- **API**: Deploy `apps/api` on platforms like Render or Railway. Set your root directory to `apps/api` during deployment.
- **Frontends**: Deploy `apps/admin-web` and `apps/user-web` on Vercel or Netlify. Link your GitHub repository and change the framework preset to Vite, selecting the respective app directory as the root.

## 📄 License

This project is open-source.
