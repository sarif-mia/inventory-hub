# 🤝 Contributing to Inventory Hub

Thank you for your interest in contributing to Inventory Hub! This document provides guidelines and information for contributors.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## 🤟 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:
- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git
- A code editor (VS Code recommended)

### Local Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/inventory-hub.git
   cd inventory-hub
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start Development Environment**
   ```bash
   # Start all services
   docker-compose up --build

   # Or start frontend only for development
   npm run dev
   ```

5. **Verify Setup**
   - Frontend: http://localhost:3005
   - Backend API: http://localhost:3001

## 🔄 Development Workflow

### Branch Naming Convention
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

Examples:
```
feat(auth): add user login functionality
fix(api): resolve category creation error
docs(readme): update installation instructions
```

## 💻 Coding Standards

### TypeScript Guidelines
- Use TypeScript for all new code
- Avoid `any` type - use proper type definitions
- Use interfaces for object shapes
- Use union types for variant values
- Leverage utility types (`Partial`, `Pick`, `Omit`)

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Use custom hooks for shared logic
- Follow component composition patterns
- Implement proper loading states

### Code Style
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused
- Use early returns for better readability

### File Organization
```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── integrations/  # External service integrations
└── server/        # Backend API (if applicable)
```

## 🧪 Testing

### Testing Strategy
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Writing Tests
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Test both success and error scenarios
- Mock external dependencies
- Aim for high test coverage

## 📝 Submitting Changes

### Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, tested code
   - Update documentation if needed
   - Ensure all tests pass

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

5. **PR Requirements**
   - Clear, descriptive title
   - Detailed description of changes
   - Screenshots for UI changes
   - Tests pass
   - No linting errors
   - Documentation updated

### PR Review Process
- At least one maintainer review required
- CI/CD checks must pass
- Code follows project standards
- Tests cover new functionality
- No breaking changes without discussion

## 🐛 Reporting Issues

### Bug Reports
When reporting bugs, please include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable
- Console errors/logs

### Feature Requests
For new features, please provide:
- Clear description of the feature
- Use case and benefits
- Mockups or examples if applicable
- Acceptance criteria

### Issue Labels
- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Documentation updates
- `help wanted` - Good for newcomers
- `good first issue` - Beginner-friendly

## 🔧 Development Tools

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Docker
- GitLens

### Useful Commands
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Build for production
npm run build

# Start development server
npm run dev
```

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🙏 Recognition

Contributors will be recognized in:
- Repository contributors list
- Changelog for significant contributions
- Project documentation

Thank you for contributing to Inventory Hub! 🎉