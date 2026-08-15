# Real-Time Collaborative Editor

A full-stack real-time collaborative document editing platform built with Next.js, NestJS, PostgreSQL, TipTap, Yjs, and Socket.IO.

The application allows multiple users to create, edit, share, and collaborate on documents in real time while supporting user presence, collaborative cursors, role-based permissions, and document version management.

> **Current release:** Phase 1 MVP

---

## Project Status

This project is actively under development.

The current repository contains the completed Phase 1 collaborative-document foundation. It provides the core of a real-time collaborative document workspace, including authentication, document creation and editing, rich-text editing, automatic synchronization, real-time multi-user collaboration, presence and collaborative cursors, sharing permissions, and initial document version management.

The long-term goal is to evolve the project into an advanced collaborative document + diagram + structured knowledge workspace.

Currently Implemented

User registration and authentication

Document creation and editing

Rich-text editor

Automatic document synchronization

Real-time multi-user collaboration

Online user presence

Collaborative cursors

Document sharing

Owner, Editor, and Viewer permissions

Permission-aware collaboration

Document dashboard

Saved document version checkpoints

Branch-based document versioning

Dark-mode workspace interface

Planned Features

Document Workspace

Document rename and duplication

Favorites

Shared-document organization

Trash, restore, and permanent deletion

Advanced search and filtering

Improved document metadata

Improved autosave, session, and error states

Collaboration and permission edge-case handling

Advanced Diagram Editor

Infinite canvas

Shapes and connectors

Selection and multi-selection

Pan and zoom

Resize and rotation

Snapping and alignment guides

Grouping and locking

Layer ordering

Clipboard operations

Keyboard shortcuts

Undo and redo

Shape and connector styling

Persistent diagrams

Multiple pages

Layers

Connector routing and waypoints

Custom connection points

Reusable components

Templates

Rulers and grids

Tables

Advanced alignment and distribution tools

Real-time collaborative diagram editing

Software Engineering and Architecture Diagrams

All 14 UML diagram types

Entity-Relationship Diagrams (ERD)

Database and schema modeling

Data Flow Diagrams (DFD)

Flowcharts

Swimlane diagrams

C4 architecture diagrams

System architecture diagrams

Network diagrams

Cloud architecture diagrams

API architecture and flow diagrams

Microservices diagrams

Event-driven architecture diagrams

CQRS and event-sourcing diagrams

Cache and load-balancing diagrams

Failover architecture diagrams

Infrastructure-as-Code diagrams

Data pipeline diagrams

Extended Diagram Libraries

BPMN

SIPOC

Value Stream Maps

SWOT

PESTEL

Porter's Five Forces

Business Model Canvas

Lean Canvas

BCG Matrix

Ansoff Matrix

RACI

Stakeholder maps

Customer journey maps

Sales and marketing funnels

Service blueprints

Consulting-style matrices and frameworks

Electrical and electronics engineering diagrams

Mechanical engineering diagrams

Civil and structural engineering diagrams

Biology, chemistry, and physics diagrams

Earth and environmental science diagrams

Healthcare and education diagrams

Data science and machine-learning diagrams

Advanced Collaboration and Knowledge Features

Semantic Git-style document diffing

Advanced document branching and version history

Version restoration and branch comparison

Citation management

Citation and source relationship graphs

Evidence links

True multi-cursor editing

Document-wide consistency tools

Readability analysis

Validation

Outline and argument maps

Content blocks

Cross-references

Structured knowledge relationships

Comments and mentions

Notifications

Document-to-diagram relationships

Backlinks

Reusable content

Advanced collaborative review workflows

Note: Features listed under Planned Features describe the intended direction of the project and are not necessarily available in the current release.

Overview**

Real-Time Collaborative Editor is a software engineering project focused on building a modern collaborative workspace similar to the core document-editing experience provided by applications such as Google Docs.

The project explores real-world engineering challenges including:

- Real-time synchronization
- Conflict-free collaborative editing
- Authentication and authorization
- WebSocket communication
- Rich-text editing
- Document persistence
- Multi-user presence
- Permission management
- Document versioning
- Full-stack TypeScript architecture

Phase 1 establishes the collaborative document foundation. Future phases will expand the platform into an advanced document, diagram, and structured knowledge workspace.

---

## Phase 1 MVP

### Implemented

- User registration
- User authentication
- Create documents
- Open and edit documents
- Rich-text editing
- Automatic document synchronization
- Real-time multi-user editing
- Online user presence
- Collaborative cursors
- Document sharing
- Owner, Editor, and Viewer permissions
- Permission-aware collaboration
- Saved document versions
- Document branches
- Dark-mode workspace interface

### Planned

Several areas of the interface are reserved for future phases and are not presented as completed Phase 1 functionality.

These include:

- Outline tools
- Argument maps
- Content blocks
- Cross-references
- Consistency review
- Readability analysis
- Semantic document comparison
- Validation
- Citation management
- Source graphs
- Evidence links
- Advanced version comparison
- Integrated diagram creation

---

## Screenshots

### Authentication

Users can securely sign in to access their collaborative workspace.

![Authentication](docs/screenshots/sign-in.png)

### Document Workspace

The document dashboard provides centralized access to documents owned by the user and documents shared by collaborators.

![Document Workspace](docs/screenshots/documents-dashboard.png)

### Rich-Text Editor

Documents can be edited through a focused rich-text workspace with formatting controls and collaboration support.

![Rich Text Editor](docs/screenshots/document-editor.png)

### Sharing and Permissions

Document owners can invite collaborators and assign editing or viewing access.

![Sharing and Permissions](docs/screenshots/share-permissions.png)

### Document Versioning

Documents support saved checkpoints and branches for managing different states of the content.

![Document Versioning](docs/screenshots/version-control.png)

---

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- TipTap
- ProseMirror
- Yjs
- Socket.IO Client
- Lucide React

### Backend

- NestJS
- TypeScript
- Socket.IO
- Yjs
- Passport
- JWT authentication
- bcrypt
- Class Validator

### Database

- PostgreSQL
- Prisma ORM
- Prisma PostgreSQL adapter

### Development

- pnpm
- Turborepo
- ESLint
- Prettier
- Jest
- Git
- GitHub

---

## Project Architecture

The application is maintained as a monorepo:

```text
collab-docs/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── server/              # NestJS backend
├── docs/
│   └── screenshots/         # Project screenshots
├── design/
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── turbo.json
```

### Frontend

The Next.js application provides:

- Authentication interface
- Document dashboard
- Rich-text editor
- Sharing interface
- Collaboration UI
- Presence indicators
- Version management interface

### Backend

The NestJS application handles:

- Authentication
- Authorization
- Document management
- Sharing permissions
- Database persistence
- WebSocket connections
- Real-time collaboration
- Version management

### Database

PostgreSQL provides persistent application storage through Prisma ORM.

### Collaboration Layer

Yjs provides the collaborative document model while Socket.IO handles real-time communication between clients and the NestJS server.

---

## Real-Time Collaboration

Each collaborative document acts as a shared real-time workspace.

A simplified collaboration flow is:

```text
User A
   │
   ▼
Next.js + TipTap
   │
   ▼
Yjs Collaborative Document
   │
   ▼
Socket.IO
   │
   ▼
NestJS Collaboration Gateway
   │
   ├──────────────┐
   ▼              ▼
User B          User C
```

When multiple users open the same document, changes can be synchronized between connected clients.

The collaboration layer also supports user presence and collaborative cursor information.

---

## Authentication and Authorization

Authentication uses JWT-based sessions.

Passwords are hashed before storage using bcrypt.

Protected backend operations require authentication, while document-level authorization determines what an authenticated user can do with a particular document.

### Document Roles

| Role | Access |
| --- | --- |
| **Owner** | Full document access and sharing management |
| **Editor** | View and collaboratively edit the document |
| **Viewer** | Read-only access |

Permission checks are enforced by the backend rather than relying exclusively on frontend controls.

---

## Rich-Text Editing

The document editor is built using TipTap and ProseMirror.

The editing interface supports formatting functionality such as:

- Headings
- Bold
- Italic
- Underline
- Text alignment
- Lists
- Links
- Rich-text document content

The editor is connected to the real-time collaboration layer through Yjs.

---

## Document Sharing

Document owners can share documents with other users.

The sharing system supports different access levels so collaborators can be granted editing or viewing permission.

This provides the foundation for team-based collaborative document workflows.

---

## Document Versioning

The project includes an early version-management system.

Users can create saved document checkpoints and maintain branches representing different document states.

This establishes the foundation for future functionality such as:

- Version comparison
- Semantic diffing
- Version restoration
- Branch comparison
- Change visualization
- Detailed document history

---

## Future Diagram Workspace

A major future phase of the project is an integrated professional diagramming environment.

The objective is to allow users to create and collaboratively edit diagrams directly inside the same workspace as their documents.

Frequently used diagram types will be available directly from a dedicated **Diagrams** toolbar section, while the complete diagram catalog will be accessible through search and categorized libraries.

### Software Engineering and IT

Planned support includes:

- All 14 UML diagram types
- Entity-Relationship Diagrams
- Database schema diagrams
- Data Flow Diagrams
- Flowcharts
- Swimlane diagrams
- C4 diagrams
- System architecture diagrams
- Network diagrams
- Cloud architecture diagrams
- Deployment diagrams
- API flow diagrams
- Microservice interaction diagrams
- Event-driven architecture diagrams
- CQRS and event-sourcing diagrams
- Infrastructure diagrams
- Data pipeline diagrams

### Business and Management

Planned libraries include:

- BPMN
- SIPOC
- Value Stream Maps
- SWOT
- PESTEL
- Porter's Five Forces
- Business Model Canvas
- Lean Canvas
- BCG Matrix
- Ansoff Matrix
- RACI
- Stakeholder maps
- Customer journey maps
- Sales and marketing funnels
- Service blueprints
- Consulting-style matrices and frameworks

### Engineering and Science

The long-term diagram catalog is also intended to support specialized diagram families for:

- Electrical and electronics engineering
- Mechanical engineering
- Civil and structural engineering
- Biology
- Chemistry
- Physics
- Earth and environmental science
- Healthcare
- Education
- Data science and machine learning

### Diagram Engine

Rather than implementing a separate editor for every diagram type, the platform is planned around a reusable diagram engine providing capabilities such as:

- Infinite canvas
- Pan and zoom
- Shapes and connectors
- Drag and drop
- Resize and rotation
- Grid and snapping
- Alignment guides
- Multi-selection
- Grouping
- Layers
- Locking
- Copy and paste
- Undo and redo
- Keyboard shortcuts
- Templates
- Searchable shape libraries
- Reusable components
- Multiple pages
- Advanced connector routing
- Export
- Real-time collaborative diagram editing

The diagram platform is planned future functionality and is **not part of the completed Phase 1 MVP**.

---

## Future Document Intelligence

The existing Structure, Review, and Sources areas are planned to evolve into functional document-analysis and knowledge-management tools.

### Structure

Planned capabilities:

- Outline
- Argument Map
- Content Blocks
- Cross-references

### Review

Planned capabilities:

- Consistency checking
- Readability analysis
- Semantic diff
- Validation

### Sources

Planned capabilities:

- Citation management
- Source graph
- Evidence links

Future versions are intended to connect these capabilities with both documents and diagrams.

---

## Local Development

### Prerequisites

Install:

- Node.js
- pnpm
- PostgreSQL
- Git

### Install Dependencies

From the project root:

```bash
pnpm install
```

---

## Environment Configuration

Create the required local environment configuration for the backend.

Environment files are intentionally excluded from Git.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
JWT_SECRET="your-local-secret"
```

Never commit real database credentials or authentication secrets.

---

## Database

Generate the Prisma client:

```bash
pnpm --filter server exec prisma generate
```

Apply the database schema using the appropriate Prisma development command for your environment.

---

## Run the Backend

From the project root:

```bash
pnpm --filter server start:dev
```

The NestJS backend will start in development mode.

---

## Run the Frontend

Open another terminal and run:

```bash
pnpm --filter web dev
```

Then open:

```text
http://localhost:3000
```

---

## Testing

Run backend tests:

```bash
pnpm --filter server test
```

Run backend end-to-end tests:

```bash
pnpm --filter server test:e2e
```

Run test coverage:

```bash
pnpm --filter server test:cov
```

Build the backend:

```bash
pnpm --filter server build
```

Build the frontend:

```bash
pnpm --filter web build
```

---

## Security

The repository excludes local and development-sensitive files such as:

- Environment variables
- Credentials
- Local IDE configuration
- Temporary collaboration test scripts
- Build output
- Local backup files

Authentication secrets and database credentials should never be committed to the repository.

---

## Development Roadmap

Phase 1 — Collaborative Document MVP
Authentication, document editing, real-time collaboration, sharing, permissions, presence/cursors, and initial version management.

Phase 2 — Complete Document Management
Rename, duplicate, favorites, Shared, trash/restore/permanent delete, search, metadata, session/error states, and permission edge cases.

Phase 3 — Diagram Engine
Infinite canvas, shapes, connectors, transforms, snapping, guides, grouping, layers, persistence, shortcuts, undo/redo, and collaboration architecture.

Phase 4 — Software & IT Diagram Libraries
UML, ERD, DFD, flowcharts, swimlanes, C4, system/network/cloud/API/microservices/event-driven/CQRS and infrastructure diagrams.

Phase 5 — Advanced Diagram Editing
Pages, layers, advanced routing and waypoints, connection points, reusable components, templates, rulers, grids, tables, export, and real-time diagram collaboration.

Phase 6 — Extended Diagram Libraries
Business, management, engineering, science, healthcare, education, and data-science diagram families.

Phase 7 — Structure, Review, Sources & Advanced Versions
Outline, argument maps, content blocks, cross-references, consistency/readability tools, validation, citations, source graphs, evidence links, semantic diffing, and expanded version management.

Phase 8 — Advanced Collaboration & Knowledge Relationships
Comments, mentions, notifications, true multi-cursor workflows, backlinks, document-to-diagram relationships, reusable content, and collaborative review workflows.

Phase 9 — Workspace Productivity
Global search, organization, templates, command palette, filtering, keyboard navigation, and workspace improvements.

Phase 10 — Production Hardening
Import/export, security, WebSocket scaling, performance optimization, recovery, database optimization, and production infrastructure.

Phase 11 — Production Release
Comprehensive testing, CI/CD, deployment, monitoring, accessibility, performance validation, documentation, and final release preparation.

Project Status**

The current repository represents the completed **Phase 1 collaborative-document foundation** and the starting point for the larger platform.

The project is under active development.

---

## What I Learned

Building the Phase 1 MVP provided hands-on experience with:

- Full-stack TypeScript development
- Next.js application development
- NestJS backend architecture
- REST API design
- Authentication and authorization
- PostgreSQL database design
- Prisma ORM
- WebSocket communication
- CRDT-based collaborative editing with Yjs
- Rich-text editing with TipTap
- Real-time user presence
- Collaborative cursor synchronization
- Role-based permissions
- Document version management
- Monorepo development
- pnpm workspaces
- Turborepo
- Testing and debugging real-time application behavior
- Git and GitHub workflows

---

## License

This project is currently intended for portfolio and educational purposes.