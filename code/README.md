# CampusConnect — Web Application & Platform Guide

> **Course:** UCS503P — Software Engineering (2026-27 ODD)  
> **Institution:** Thapar Institute of Engineering & Technology (TIET), Patiala  
> **Project Repository:** [CampusConnect (UCS503P)](file:///f:/Work/SEM5/Software%20Eng/Project%20v2/ucs503p-202627odd-CampusConnect)  
> **Application Folder:** `code/`  
> **Documentation Backend:** [MkDocs Material & GitHub Pages](file:///f:/Work/SEM5/Software%20Eng/Project%20v2/ucs503p-202627odd-CampusConnect/mkdocs.yml)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Setting Up GitHub Pages (Documentation)](#setting-up-github-pages-documentation)
   - [How GitHub Pages Works in This Repo](#how-github-pages-works-in-this-repo)
   - [Step-by-Step GitHub Pages Configuration](#step-by-step-github-pages-configuration)
   - [Configuring `mkdocs.yml` for Your Repository](#configuring-mkdocsyml-for-your-repository)
   - [Local Documentation Preview & Build](#local-documentation-preview--build)
   - [Web App Hosting vs. GitHub Pages](#web-app-hosting-vs-github-pages)
3. [Technology Stack](#technology-stack)
4. [Getting Started (Local Development)](#getting-started-local-development)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Configuration](#environment-configuration)
   - [Database Setup & Migrations](#database-setup--migrations)
   - [Database Seeding](#database-seeding)
   - [Running the Development Server](#running-the-development-server)
5. [Default Pre-Seeded Accounts](#default-pre-seeded-accounts)
6. [Repository & Code Structure](#repository--code-structure)
7. [Useful Commands & Makefile](#useful-commands--makefile)
8. [Key Project References](#key-project-references)

---

## Project Overview

**CampusConnect** is a closed-community, role-aware academic and social networking platform engineered specifically for higher education institutions. It provides a centralized, authenticated, and institution-verified environment that consolidates student social interactions, academic group discussions, study material dissemination, calendar scheduling, and AI-governed moderation.

### Core Roles & Personas
- **Student:** Accesses campus feeds, joins subject/batch groups, accesses uploaded course slides/PDFs, tracks lecture/exam schedules, and chats 1-on-1 in real-time.
- **Teacher / Faculty:** Creates academic and lab groups, uploads syllabi and lecture materials, schedules classes/quizzes/events with automated member notifications, and interacts with batches.
- **Administrator:** Manages institution access policies, reviews the automated AI moderation queue, invites members via signed tokens, and oversees platform health and compliance.

---

## Setting Up GitHub Pages (Documentation)

This repository is configured to automatically build and publish project documentation, UML diagrams, DFDs, Gantt schedules, and member engineering journals to **GitHub Pages** using **MkDocs** and **GitHub Actions**.

### How GitHub Pages Works in This Repo

1. **Source Content:** Stored in the root [`docs/`](../docs/) directory, [`journals/`](../journals/), and configured via [`mkdocs.yml`](../mkdocs.yml).
2. **CI/CD Automation:** The GitHub Actions workflow defined in [`.github/workflows/mkdocs.yml`](../.github/workflows/mkdocs.yml) is triggered whenever changes are pushed to the `master` or `main` branches.
3. **Automated Publishing:** The workflow runs `mkdocs gh-deploy --force`, which compiles the static site and pushes the generated HTML/CSS/assets to the `gh-pages` branch.

---

### Step-by-Step GitHub Pages Configuration

Follow these steps in your GitHub repository to enable GitHub Pages deployment:

#### 1. Enable Read & Write Permissions for GitHub Actions (Critical)
By default, GitHub Actions workflows may only have read permissions, causing `mkdocs gh-deploy` to fail with a `403 Resource not accessible` error.
1. Open your GitHub repository in your browser.
2. Go to **Settings** (top navigation tab).
3. In the left sidebar, expand **Actions** and select **General**.
4. Scroll down to **Workflow permissions**.
5. Select **"Read and write permissions"**.
6. Check the box: **"Allow GitHub Actions to create and approve pull requests"**.
7. Click **Save**.

#### 2. Configure GitHub Pages Deployment Source
1. In repository **Settings**, select **Pages** from the left sidebar (under "Code and automation").
2. Under **Build and deployment**:
   - **Source:** Select **"Deploy from a branch"**.
   - **Branch:** Select **`gh-pages`** and folder **`/ (root)`**.
   *(Note: If the `gh-pages` branch does not exist yet, it will be automatically created upon the first successful run of the `mkdocs` GitHub Action).*
3. Click **Save**.

#### 3. Configure `mkdocs.yml` for Your Repository
Open [`mkdocs.yml`](../mkdocs.yml) in the root directory and customize your repository links and title:

```yaml
site_name: "CampusConnect — Software Engineering Documentation"
site_url: https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>/

repo_url: https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>
repo_name: <YOUR_REPO_NAME>
```

Replace `<YOUR_GITHUB_USERNAME>` and `<YOUR_REPO_NAME>` with your GitHub account name and repo name.

#### 4. Trigger the Build
- Commit and push any update to `master` (or `main`):
  ```bash
  git add mkdocs.yml
  git commit -m "docs: configure github pages metadata"
  git push origin master
  ```
- Alternatively, go to the **Actions** tab on GitHub -> click **mkdocs** -> click **Run workflow**.
- Once the workflow completes (marked with a green checkmark), your site is live at:
  ```
  https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>/
  ```

---

### Local Documentation Preview & Build

You can preview the documentation locally with instant live-reload before pushing to GitHub.

#### Prerequisites
Python 3.10 or higher.

#### Install Documentation Dependencies
Run the following command in your terminal (or activate your virtual environment/conda first):

```bash
pip install click numpy pandas scikit-learn mkdocs mkdocs-material mkdocs-material-extensions mkdocstrings mkdocstrings-python mkdocs-gen-files mkdocs-literate-nav mkdocs-section-index mkdocs-click mkdocs-git-revision-date-localized-plugin mkdocs-git-authors-plugin pymdown-extensions
```

#### Run the Local Docs Server
From the **root directory** of the repository:

```bash
# Using mkdocs directly
mkdocs serve

# Or using the root Makefile (Unix/WSL/macOS)
make docs
```

Open your browser and navigate to **`http://127.0.0.1:8000`** to view the live documentation.

---

### Web App Hosting vs. GitHub Pages

> [!IMPORTANT]
> **Important Note Regarding Next.js & GitHub Pages:**  
> GitHub Pages is a **static web hosting service** designed for static HTML, CSS, client-side JavaScript, and markdown documentation (such as MkDocs).  
> The **CampusConnect web application** inside `code/` is a **dynamic full-stack application** featuring:
> - Server-side authentication (NextAuth.js sessions & encrypted cookies)
> - Live PostgreSQL database connection via Prisma ORM
> - Real-time WebSockets with Socket.io (`server.ts`)
> - Dynamic REST API endpoints (`/api/*`)
> - Server Actions and Server Components
>
> Therefore, GitHub Pages serves the **Course Documentation & Sprint Journals**, while the **CampusConnect Full-Stack Application** is deployed to Node.js hosting environments such as **Vercel**, **Railway**, **Render**, or a custom Docker VPS.

---

## Technology Stack

The web application inside `code/` is engineered with the modern React / Node.js ecosystem:

| Layer | Technology | Purpose |
|:--|:--|:--|
| **Framework** | Next.js 16.3.4 (App Router, React 19) | Server Components, routing, dynamic server-side rendering, and API routes |
| **Language** | TypeScript 5.x | End-to-end type safety across client, server, and database models |
| **Styling** | Tailwind CSS v4 + Radix UI Primitives | Responsive block-based design system, modals, dropdowns, and toast alerts |
| **Icons & Motion** | Lucide React | High-performance scalable icons and micro-interactions |
| **Database** | Neon Cloud PostgreSQL | Distributed serverless PostgreSQL database with connection pooling |
| **ORM** | Prisma 7 (`@prisma/adapter-pg`) | Type-safe schema definition, automated migrations, and queries |
| **Authentication**| NextAuth.js v4 | Credentials provider, bcryptjs hashing, JWT sessions, and role guards |
| **Real-time** | Socket.io + Custom Node Server | Instant 1-on-1 direct messaging, notification bell pushes, and online presence |
| **File Storage** | Cloudinary CDN (`next-cloudinary`) | Cloud storage and image transformations for avatars, post media, and course PDFs |
| **AI Moderation** | Google Gemini API (`@google/genai`) | Agentic content moderation, hate speech detection, and summary assistance |

---

## Getting Started (Local Development)

All instructions below must be executed from inside the **`code/`** directory.

### Prerequisites
- **Node.js**: v20.x or later (LTS recommended)
- **npm**: v10.x or later
- **Git**

### Installation

1. Open your terminal and navigate into the `code/` directory:
   ```bash
   cd code
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

1. Copy the sample environment file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and verify the required configuration variables:
   ```ini
   # PostgreSQL database connection (Neon Cloud or local PostgreSQL)
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

   # NextAuth Configuration
   NEXTAUTH_SECRET="your-generated-base64-secret"
   NEXTAUTH_URL="http://localhost:3000"

   # Cloudinary Media Storage (Optional for offline preview, required for uploads)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # Google Gemini AI API (Required for automated post moderation)
   GEMINI_API_KEY="your-gemini-api-key"
   ```

> [!TIP]
> To generate a secure `NEXTAUTH_SECRET`, run:
> ```bash
> openssl rand -base64 32
> ```

### Database Setup & Migrations

CampusConnect uses Prisma 7 configured with `prisma.config.ts`. Run the following to generate the Prisma Client and sync your schema:

```bash
# Generate the Prisma client
npx prisma generate

# Apply migrations (or push schema to your database)
npx prisma migrate dev --name init
```

### Database Seeding

Populate the database with initial roles, sample users, batches, posts, and group memberships:

```bash
npx tsx prisma/seed.ts
```

### Running the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Pre-Seeded Accounts

The database seed script (`prisma/seed.ts`) provides pre-configured accounts representing all three primary user roles:

| Role | Name | Email | Password | Department & Details |
|:--|:--|:--|:--|:--|
| **ADMIN** | System Administrator | `admin@campus.edu` | `Password123!` | Department of Computer Science & Engineering |
| **TEACHER** | Prof. John Doe | `teacher@campus.edu` | `Password123!` | Computer Science Faculty, Batch Coordinator |
| **STUDENT** | Alex Morgan | `alex@campus.edu` | `Password123!` | CSE Batch 2024 (Sophomore) |
| **STUDENT** | Priya Sharma | `priya@campus.edu` | `Password123!` | CSE Batch 2024 (Junior) |

---

## Repository & Code Structure

```
code/
├── build.md                      # Master build plan & engineering instructions
├── progress.md                   # Real-time build state and deliverable tracker
├── campus_connect_proposal.md    # Detailed project requirements & design proposal
├── package.json                  # Node.js project manifest & dependencies
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration (Cloudinary remote patterns)
├── Makefile                      # Make targets for install, migrate, seed, and run
├── prisma.config.ts              # Prisma 7 configuration file
├── prisma/
│   ├── schema.prisma             # Relational data models and enums
│   ├── migrations/               # PostgreSQL schema migration history
│   └── seed.ts                   # Initial seed data (users, groups, posts)
├── public/                       # Static public assets (logos, illustrations)
└── src/
    ├── app/                      # Next.js 16 App Router pages and API routes
    │   ├── (auth)/               # Auth routes (login, register, verify, join)
    │   ├── (dashboard)/          # Authenticated routes (feed, groups, profile, admin)
    │   ├── api/                  # RESTful API endpoints (/api/auth, /api/posts, etc.)
    │   ├── globals.css           # Global Tailwind CSS styles and custom design tokens
    │   └── layout.tsx            # Root HTML layout with providers and fonts
    ├── components/               # Modular UI components
    │   ├── ui/                   # Reusable base components (buttons, inputs, cards)
    │   ├── layout/               # Shell components (Navbar, Sidebar, Notifications)
    │   ├── feed/                 # Social feed, Post cards, Comment sections
    │   ├── groups/               # Group listings, discovery cards, member tables
    │   ├── materials/            # File uploaders, PDF viewers, material cards
    │   ├── schedule/             # Calendar view and event modals
    │   ├── chat/                 # Real-time messaging window and conversation list
    │   └── admin/                # Moderation queue and user management tables
    ├── lib/                      # Shared core singletons and utilities
    │   ├── prisma.ts             # PrismaClient singleton with adapter connection pooling
    │   ├── auth.ts               # NextAuth options and credentials authentication logic
    │   ├── cloudinary.ts         # Cloudinary file upload helper
    │   ├── gemini.ts             # Google Gemini AI agentic moderation helper
    │   ├── socket.ts             # Socket.io browser client helper
    │   └── utils.ts              # Styling merge utility (cn) & date formatters
    ├── types/                    # TypeScript interfaces and module augmentations
    │   └── next-auth.d.ts        # NextAuth session and JWT role extensions
    └── middleware.ts             # Edge middleware for route guarding and RBAC
```

---

## Useful Commands & Makefile

The `Makefile` inside `code/` provides convenient shortcuts:

```bash
make install       # Install Node.js dependencies
make db-migrate    # Run Prisma migrations and generate client
make db-seed       # Seed database with sample users and groups
make dev           # Start Next.js local development server (port 3000)
make build         # Compile production Next.js application bundle
make start         # Launch production server
make clean         # Remove .next and build artifacts
```

---

## Key Project References

- [Master Build Plan (`code/build.md`)](file:///f:/Work/SEM5/Software%20Eng/Project%20v2/ucs503p-202627odd-CampusConnect/code/build.md)
- [Build Progress Tracker (`code/progress.md`)](file:///f:/Work/SEM5/Software%20Eng/Project%20v2/ucs503p-202627odd-CampusConnect/code/progress.md)
- [CampusConnect System Proposal (`code/campus_connect_proposal.md`)](file:///f:/Work/SEM5/Software%20Eng/Project%20v2/ucs503p-202627odd-CampusConnect/code/campus_connect_proposal.md)
- [Root MkDocs Configuration (`../mkdocs.yml`)](file:///f:/Work/SEM5/Software%20Eng/Project%20v2/ucs503p-202627odd-CampusConnect/mkdocs.yml)
- [GitHub Pages CI/CD Workflow (`../.github/workflows/mkdocs.yml`)](file:///f:/Work/SEM5/Software%20Eng/Project%20v2/ucs503p-202627odd-CampusConnect/.github/workflows/mkdocs.yml)
- [Documentation & UML/DFDs (`../docs/`)](file:///f:/Work/SEM5/Software%20Eng/Project%20v2/ucs503p-202627odd-CampusConnect/docs)
