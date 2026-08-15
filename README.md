# Real-Time Collaborative Editor

A full-stack collaborative document editing application that allows multiple users to create, edit, and share documents in real time.

This project was built as a practical exploration of modern full-stack development, real-time communication, collaborative editing, authentication, and document permissions.

## Phase 1 MVP

The current version implements the core collaboration workflow:

- User registration and authentication
- Create and manage documents
- Rich-text document editing
- Automatic document saving
- Real-time multi-user editing
- Online user presence
- Collaborative cursor awareness
- Document sharing
- Owner, editor, and viewer permissions
- Permission-aware collaboration sessions

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- TipTap
- Yjs
- Socket.IO Client

### Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- Passport
- Socket.IO
- Yjs

### Development

- pnpm
- Turborepo
- ESLint
- Jest
- Git

## Architecture

The project uses a monorepo structure:

```text
collab-docs/
├── apps/
│   ├── web/        # Next.js frontend
│   └── server/     # NestJS backend
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

The Next.js application provides the user interface and rich-text editing experience.

The NestJS server handles authentication, document management, permissions, persistence, and real-time collaboration.

Yjs manages collaborative document state while Socket.IO provides real-time communication between connected clients and the server.

PostgreSQL is used for persistent application data through Prisma ORM.

## Real-Time Collaboration

When multiple users open the same document, changes are synchronized between connected clients.

The collaboration system supports:

- Shared document state
- Real-time content synchronization
- User presence
- Collaborative cursor awareness
- Room-based document sessions
- Permission validation for collaboration connections

## Document Permissions

Documents can be shared with different access levels:

### Owner

- Full document access
- Edit document
- Manage sharing and permissions

### Editor

- View document
- Edit document collaboratively

### Viewer

- View document
- Cannot modify document content

Permission checks are enforced by the backend rather than relying only on frontend controls.

## Local Development

### Prerequisites

- Node.js
- pnpm
- PostgreSQL

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Create the required local environment configuration for the server.

Environment files are intentionally excluded from Git.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
JWT_SECRET="your-local-secret"
```

Use your own local database credentials and secret values.

### Database

Generate the Prisma client:

```bash
pnpm --filter server exec prisma generate
```

Apply the database schema using the appropriate Prisma development command for your environment.

### Start the Backend

```bash
pnpm --filter server start:dev
```

### Start the Frontend

In another terminal:

```bash
pnpm --filter web dev
```

Then open `http://localhost:3000`.

## Testing

Run backend tests:

```bash
pnpm --filter server test
```

Build the frontend:

```bash
pnpm --filter web build
```

## Project Status

**Phase 1 — MVP: Completed**

The first phase focuses on delivering the essential collaborative editing experience before introducing more advanced functionality.

Future development can expand the platform with features such as version history, advanced document comparison, richer collaboration tools, and additional document management capabilities.

## What I Learned

Building this project provided hands-on experience with:

- Full-stack TypeScript development
- REST API development with NestJS
- Authentication and authorization
- PostgreSQL database design
- Prisma ORM
- WebSocket communication
- Conflict-free collaborative editing with Yjs
- Rich-text editing with TipTap
- Real-time presence and cursor synchronization
- Role-based document permissions
- Monorepo development with pnpm and Turborepo
- Testing and debugging real-time application behavior

## License

This project is currently intended for portfolio and educational purposes.
