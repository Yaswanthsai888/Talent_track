# Talent Track - Phase 1 Documentation

## System Architecture

### Database Structure
- **Users Collection**
  - Basic user information (name, email, password)
  - Job seeker specific fields (experience, skills, etc.)
  - Stored in `users` collection

- **Admins Collection**
  - Admin information (name, email, password)
  - Company-specific fields (companyName, verifiedCompany)
  - Job posting references
  - Stored in `admins` collection

### Authentication System
- JWT-based authentication
- Token expiration: 24 hours
- Role-based access control (user/admin)
- Secure password hashing with bcrypt

### API Routes

#### Authentication Routes (`/api/auth`)
```javascript
POST /register
- Purpose: Register new users/admins
- Body: { name, email, password, role, ...roleSpecificFields }
- Returns: { token, role, message }

POST /login
- Purpose: Authenticate users
- Body: { email, password }
- Returns: { token, role, user }
```

#### User Routes (`/api/user`)
```javascript
GET /profile
- Purpose: Fetch user profile
- Auth: Required
- Returns: User data (excluding password)
```

#### Admin Routes (`/api/admin`)
```javascript
GET /profile
- Purpose: Fetch admin profile
- Auth: Required (admin only)
- Returns: Admin data (excluding password)
```

### Frontend Structure

#### Pages
1. **Public Pages**
   - `LandingPage` (`/`)
   - `LoginPage` (`/login`)
   - `RegisterPage` (`/register`)

2. **Protected Pages**
   - `UserDashboard` (`/dashboard/user`)
   - `AdminDashboard` (`/dashboard/admin`)

#### Components
1. **Shared Components**
   - `DashboardLayout`: Common layout for both dashboards
   
2. **User Components**
   - `ProfileCard`: Display user profile information
   - `JobMatchesCard`: Display job recommendations

3. **Admin Components**
   - `CandidateManagement`: Manage job applicants
   - `JobPostings`: Manage job listings
   - `Analytics`: View recruitment metrics

### State Management
- Local state using React useState
- Token stored in localStorage
- Axios instance with interceptors for auth

### Security Features
1. **Frontend**
   - Protected routes
   - Token expiration handling
   - Automatic logout on auth errors

2. **Backend**
   - Password hashing
   - JWT verification
   - Role-based access control
   - Request validation

### Environment Configuration
```env
MONGODB_URI=mongodb://127.0.0.1:27017/talent-track
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
ADMIN_KEY=secret_admin_key_123
```

### Tech Stack
- Frontend: React, TailwindCSS
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT
- API: RESTful

### Current Features
1. **Authentication**
   - User/Admin registration
   - Login with role-based routing
   - Protected routes and API endpoints

2. **User Dashboard**
   - Profile display
   - Skills and experience information
   - Placeholder for job matches

3. **Admin Dashboard**
   - Company profile
   - Job posting management interface
   - Candidate tracking system placeholder

### Styling
- Consistent color scheme using Tailwind
- Responsive design
- Custom component classes
- Animated transitions

### Future Considerations for Phase 2
1. **Features to Add**
   - Job posting functionality
   - Search and filtering
   - Application system
   - Real-time notifications

2. **Technical Improvements**
   - State management solution
   - Caching strategy
   - Error boundary implementation
   - Test coverage

3. **Security Enhancements**
   - Rate limiting
   - Input sanitization
   - Enhanced validation
   - Session management

### Known Limitations
1. Basic error handling
2. Limited form validation
3. No persistent state management
4. Basic security implementation

### Development Setup
```bash
# Frontend
cd talent-track-frontend
npm install
npm start

# Backend
cd server
npm install
npm run dev
```

### Project Structure
