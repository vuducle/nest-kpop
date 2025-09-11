# K-Pop Music App Setup Guide

This guide will help you set up both the backend (NestJS) and frontend (Next.js) applications.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Backend Setup (NestJS)

1. **Install dependencies:**

   ```bash
   cd nest-kpop
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Update the `.env.local` file with your actual values:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/nest_kpop"
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_EXPIRES_IN="7d"
   PORT=3001
   FRONTEND_URL="http://localhost:3000"
   ```

3. **Set up the database:**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the backend:**

   ```bash
   npm run start:dev
   ```

   The backend will be available at `http://localhost:3001`

## Frontend Setup (Next.js)

1. **Install dependencies:**

   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.local .env.local
   ```

   The `.env.local` file should contain:

   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   NODE_ENV="development"
   ```

3. **Start the frontend:**

   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Features Implemented

### Authentication

- ✅ User signup with email, password, first name, last name, and username
- ✅ User login with email and password
- ✅ JWT-based authentication
- ✅ Protected routes
- ✅ User logout functionality

### Frontend

- ✅ Modern UI with shadcn/ui components
- ✅ Responsive design with Tailwind CSS
- ✅ Server-side rendering (SSR) with Next.js
- ✅ Authentication context and hooks
- ✅ API client for backend communication
- ✅ Environment configuration for dev and prod

### Backend

- ✅ NestJS REST API
- ✅ PostgreSQL database with Prisma ORM
- ✅ JWT authentication
- ✅ CORS configuration
- ✅ User management
- ✅ Password hashing with bcrypt

## API Endpoints

### Authentication

- `POST /auth/signup` - Create a new user account
- `POST /auth/login` - Login with email and password
- `POST /auth/logout` - Logout (client-side token removal)
- `GET /auth/profile` - Get current user profile (protected)
- `GET /auth/status` - Check authentication status (protected)

### Users

- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create a new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Development

### Running in Development Mode

1. Start the backend:

   ```bash
   cd nest-kpop
   npm run start:dev
   ```

2. Start the frontend (in a new terminal):
   ```bash
   cd nest-kpop/frontend
   npm run dev
   ```

### Building for Production

1. Build the backend:

   ```bash
   cd nest-kpop
   npm run build
   npm run start:prod
   ```

2. Build the frontend:
   ```bash
   cd nest-kpop/frontend
   npm run build
   npm run start
   ```

## Environment Variables

### Backend (.env.local)

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration time
- `PORT` - Backend server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NODE_ENV` - Environment (development/production)

## Database Schema

The application uses the following main entities:

- **Users** - User accounts with authentication
- **Songs** - Music tracks with Spotify integration
- **Playlists** - User-created playlists
- **PlaylistSongs** - Many-to-many relationship between playlists and songs

## Next Steps

1. Set up your PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Start both applications
5. Test the authentication flow
6. Customize the UI and add more features

## Troubleshooting

- Make sure PostgreSQL is running and accessible
- Check that all environment variables are set correctly
- Ensure ports 3000 and 3001 are available
- Check browser console for any CORS errors
- Verify database connection in the backend logs
