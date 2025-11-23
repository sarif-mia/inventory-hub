# 🤝 Contributing to Inventory Hub

Thank you for contributing to Inventory Hub!

## 🤟 Code of Conduct
Be respectful, inclusive, constructive. Focus on positive community.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+, Docker, Docker Compose, Git, VS Code

### Setup
```bash
git clone https://github.com/your-username/inventory-hub.git
cd inventory-hub
npm install
cp .env.example .env
docker-compose up --build
```

Access: Frontend http://localhost:3005, Backend http://localhost:3001

## 🔄 Development Workflow

### Branch Naming
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation

### Commit Format
```
type(scope): description

[body]

[footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 💻 Coding Standards

### TypeScript
- Use TypeScript, proper types, avoid `any`
- Interfaces for objects, unions for variants
- Utility types: `Partial`, `Pick`, etc.

### React
- Functional components with hooks
- Error boundaries, custom hooks
- Component composition

### Code Style
- ESLint compliance
- Meaningful names, JSDoc for complex functions
- Small focused functions, early returns

## 🧪 Testing

### Strategy
- Unit tests for functions
- Integration for API
- Component tests for React
- E2E for flows

### Commands
```bash
npm test          # All tests
npm run test:watch # Watch mode
npm run test:coverage # With coverage
```

## 📝 Submitting Changes

### PR Process
1. Create branch: `git checkout -b feature/name`
2. Make changes, test, commit
3. Push and create PR
4. Await review

### PR Requirements
- Clear title/description
- Screenshots for UI
- Tests pass, no lint errors
- Docs updated

## 🐛 Reporting Issues

### Bug Reports
Include: Title, description, steps, expected/actual, browser/OS, screenshots, logs

### Feature Requests
Description, use case, benefits, examples, criteria

### Labels
`bug`, `enhancement`, `documentation`, `help wanted`, `good first issue`

## 🙏 Recognition

Contributors recognized in repo list, changelog, docs.

Thank you! 🎉