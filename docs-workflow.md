# Development Workflow Guidelines

## Getting Started

1. Clone the repository
2. Set up both frontend and backend as described in the README.md
3. Make sure both servers are running simultaneously during development

## Git Workflow

### Branching Strategy

We recommend a simplified Git Flow approach:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - For new features
- `bugfix/bug-description` - For bug fixes

### Commit Messages

Use clear, descriptive commit messages following this format:
```
<type>: <short description>

<longer description if needed>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example: `feat: add user authentication to API`

## Code Style

### Frontend

- Use functional components with hooks
- Follow TypeScript best practices
- Use CSS modules or styled components for styling
- Implement responsive design principles

### Backend

- Use async/await for asynchronous operations
- Implement proper error handling
- Use descriptive variable and function names
- Follow RESTful API design principles

## Testing

Currently, the project doesn't have automated tests. To add testing:

### Frontend Testing

```bash
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Backend Testing

```bash
cd backend
npm install --save-dev jest supertest
```

## Deployment

### Development Environment

The application runs locally with:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Production Build

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Move the build files to the backend:
```bash
# Create a public directory if it doesn't exist
mkdir -p ../backend/public
# Copy the build files
cp -r dist/* ../backend/public/
```

3. Update the backend to serve static files:
```javascript
// Add to backend/index.js
app.use(express.static('public'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

## Contribution Guidelines

### Pull Request Process

1. Create a branch from `develop`
2. Implement your changes
3. Ensure the application runs without errors
4. Submit a pull request to `develop`
5. Get at least one code review approval
6. Merge into `develop`

### Code Review Checklist

- Does the code follow our style guidelines?
- Does it implement the feature or fix the bug as intended?
- Is there appropriate error handling?
- Is the code clear and maintainable?

## Hackathon Handoff

For hackathon projects, ensure:

1. All documentation is up to date
2. Setup instructions are clear and work
3. Main features are documented with examples
4. Known issues are listed in the README.md
5. Future enhancement ideas are documented 