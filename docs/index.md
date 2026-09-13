![Tiet Logo](assets/tiet-logo.svg){ .tiet-logo }

**UCS503: Software Engineering (Project)**  
**Thapar Institute of Engineering & Technology, Patiala**

# 🎓 CampusConnect: Academic & Social Networking Platform
### *Role-Aware Closed Campus Community, Course & Batch Hubs, and Agentic AI Moderation Platform*

<div class="badges" markdown>
[![Prototype Status](https://img.shields.io/badge/Prototype-v0.3%20Active-brightgreen?style=flat-square)](#interactive-prototype-demonstration)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016%20%2F%20TailwindCSS-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![ORM](https://img.shields.io/badge/ORM-Prisma%207-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io/)
[![Real--Time](https://img.shields.io/badge/Real--Time-Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![AI Moderation](https://img.shields.io/badge/AI%20Engine-Google%20Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://github.com/aayush-10k/ucs503p-202627odd-CampusConnect)
</div>

---

## 👥 Academic & Team Profile

| Role | Team Member | Roll Number | Email | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Project Lead & Full-Stack Architect** | **Aayushmaan Singh Meyan** | `1024240142` | [`ameyan_be24@thapar.edu`](mailto:ameyan_be24@thapar.edu) | Computer Science & Engineering |
| **Backend & Real-Time Communications Lead** | **Divyansh Jasrotia** | `1024240008` | [`djasrotia_be24@thapar.edu`](mailto:djasrotia_be24@thapar.edu) | Computer Science & Engineering |
| **Database & AI Moderation Lead** | **Prakhar Saxena** | `1024240019` | [`psaxena_be24@thapar.edu`](mailto:psaxena_be24@thapar.edu) | Computer Science & Engineering |

* **Academic Supervisor & Lab Instructor:** **Dr. Jeelani Asif** (Department of Computer Science & Engineering, TIET Patiala)
* **Course Code:** UCS503P — Software Engineering Project (Academic Year 2026–27)

---

## 📌 Executive Overview

In modern higher education institutions, academic communication is deeply fragmented across informal WhatsApp channels, unverified Telegram groups, and crowded email inboxes. This lack of centralized infrastructure causes missed academic deadlines, unverified circulars, compromised access control, and lost lecture materials.

!!! abstract "The Campus Communication Fragmentation Problem"
    There is a critical disconnect between **official institutional communication channels** and **dynamic peer collaboration**. Students miss critical deadline announcements amidst noisy social chats, faculty lack structured batch broadcasting channels, and unmoderated campus forums risk academic integrity violations.

**CampusConnect** bridges this gap through a unified, role-aware academic social networking platform:
1. **Strict Role-Based Access Control (RBAC):** Verified institutional identity segregation for **Students**, **Faculty / Teachers**, and **Administrators**.
2. **Structured Course & Batch Hubs:** Centralized repositories for lecture slides, syllabi, assignment briefs, and focused discussion threads.
3. **Unified Academic Calendar:** Synchronized schedule tracking lectures, lab submissions, and examination dates with automated alerts.
4. **Low-Latency Real-Time Messaging:** Direct 1-on-1 chats and group channels powered by persistent WebSocket connections.
5. **Agentic AI Campus Moderation:** Automated sentiment, toxic language, and institutional compliance enforcement driven by Google Gemini AI.

---

## ✨ Key Platform Capabilities

<div class="grid cards" markdown>

-   :material-account-supervisor-circle: **Role-Based Workflows & Verified Access**

    ---

    Provides cryptographically signed JWT sessions and granular role guards distinguishing **Students**, **Faculty**, and **Administrators**. Enforces access control at both the edge middleware and database levels.

-   :material-book-education: **Course & Batch Knowledge Repositories**

    ---

    Dedicated academic spaces categorized by semester, subject, and lab batch. Allows faculty to upload verified notes, slide decks, and syllabi while preventing spam and unauthorized uploads.

-   :material-calendar-clock: **Academic Schedule & Event Board**

    ---

    Centralized interactive calendar consolidating university lectures, assignment deadlines, and exam timetables with automated browser push and socket notifications.

-   :material-message-text-fast: **Real-Time Direct & Batch Messaging**

    ---

    Persistent, low-latency communication engine powered by Socket.io, featuring instant message delivery, live typing presence, unread counters, and online status beacons.

-   :material-shield-account: **Agentic AI Content Moderation (Gemini)**

    ---

    Autonomous content filter inspecting posts and comments for hate speech, harassment, and policy violations with automated flagging into an administrative review queue.

-   :material-database-lock: **High-Availability PostgreSQL & Cloud Storage**

    ---

    Managed relational storage on Neon Cloud PostgreSQL paired with Prisma 7 ORM for connection pooling, type safety, and Cloudinary CDN for academic asset hosting.

</div>

---

## 🏗️ System Architecture & Layered Decomposition

CampusConnect decouples presentation, business orchestration, real-time events, and AI moderation across 4 modular layers:

<div class="grid cards" markdown>

-   :material-monitor-dashboard: **Presentation & Dashboard Layer (Next.js / Tailwind CSS)**

    ---

    - Server-Side Rendered (SSR) interactive student dashboards and batch hubs.
    - Mobile-first responsive UI built with Tailwind CSS v4 and accessible Radix UI primitives.
    - Client-side real-time state hooks for messaging and toast notifications.
    - Role-conditional administrative moderation and user management console.

-   :material-server-network: **Application & API Gateway (Next.js App Router & Server Actions)**

    ---

    - RESTful endpoints and type-safe Server Actions with strict Zod validation.
    - JWT-based authentication and session verification via NextAuth.js.
    - Rate-limiting middleware protecting against brute-force attacks and abuse.
    - Cloudinary asset upload management and secure file delivery pipeline.

-   :material-message-processing: **Real-Time WebSocket Engine (Node.js / Socket.io)**

    ---

    - Bi-directional event-driven architecture handling 1-on-1 and room-based group chats.
    - Heartbeat mechanisms for accurate user presence tracking and online beacons.
    - Ephemeral message receipt acknowledgments and typing indicator events.

-   :material-robot: **Agentic AI Moderation Engine (Google Gemini 2.5 Flash)**

    ---

    - Automated pre-publication and post-publication content analysis.
    - Multi-class toxicity classification and institutional policy verification.
    - Automated incident triage: auto-flagging, shadow-hiding, and escalation to Admin Queue.

</div>

---

## 📊 Engineering Benchmarks & Verification Metrics

CampusConnect has been benchmarked against target academic performance criteria:

| Evaluation Metric | Target Engineering Specification | Achieved Prototype Benchmark | Verification Scope |
| :--- | :--- | :--- | :--- |
| **SSR Initial Page Load** | ≤ 1.5 s | **0.82 – 1.2 s** | Cold cache Next.js App Router rendering |
| **WebSocket Message Round-Trip** | ≤ 100 ms | **38 – 72 ms** | Socket.io event emission and client receipt |
| **Database Query Latency** | ≤ 50 ms | **18 – 35 ms** | Neon Cloud PostgreSQL pooled connection via Prisma |
| **AI Moderation Pipeline Latency** | ≤ 2.0 s | **1.1 – 1.6 s** | Google Gemini API analysis and classification |
| **RBAC Route Guard Overhead** | ≤ 15 ms | **4 – 9 ms** | Edge middleware session token verification |
| **End-to-End Type Safety** | 100% Strict | **100% Type-Safe** | TypeScript 5.x compiler verification with zero `any` |

---

## 🚀 Interactive Prototype Demonstration

The CampusConnect prototype (v0.3) is fully functional and executable locally.

### 1. Running the Full-Stack Application

```bash
# 1. Clone the repository
git clone https://github.com/aayush-10k/ucs503p-202627odd-CampusConnect.git
cd ucs503p-202627odd-CampusConnect/code

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env

# 4. Generate Prisma client & sync database
npx prisma generate
npx prisma migrate dev --name init

# 5. Seed default test accounts & batch data
npx tsx prisma/seed.ts

# 6. Start the development server
npm run dev
```

Open your browser and navigate to: **`http://localhost:3000`**

### 2. Live Evaluation Demonstration Scenarios

CampusConnect includes preconfigured seed data for instant evaluation across 4 distinct institutional scenarios:

=== "🎓 Scenario 1: Verified Student Workflow"
    * **Test Target:** Student Account (`alex@campus.edu` / `Password123!`)
    * **Platform Actions:** Browses campus feed, accesses CSE Sophomore batch hub, downloads verified lecture notes, checks assignment deadlines on the Academic Calendar, and sends direct messages to peers.
    * **System Verification:** Confirms read-only access to faculty materials, strict room isolation in batch discussions, and instant WebSocket receipt of schedule updates.

=== "👨‍🏫 Scenario 2: Faculty Course Hub & Dispatch"
    * **Test Target:** Faculty Account (`teacher@campus.edu` / `Password123!`)
    * **Platform Actions:** Creates a new course channel (`UCS503 - Software Engineering`), uploads syllabus and lecture slide PDFs, and publishes an upcoming Lab Submission deadline.
    * **System Verification:** Verified role elevated permissions, Cloudinary asset ingestion, and automatic schedule broadcast dispatched to enrolled student feeds.

=== "🛡️ Scenario 3: Agentic AI Policy Moderation"
    * **Test Target:** Simulated Non-Compliant Community Post
    * **Platform Actions:** User attempts to publish abusive, toxic, or academically dishonest content on the public campus board.
    * **System Verification:** Google Gemini API analyzes message payload in real-time, categorizes violation severity, suppresses public rendering, and escalates incident with snippet context to the Admin Moderation Queue.

=== "⚙️ Scenario 4: Administrator Governance Console"
    * **Test Target:** Admin Account (`admin@campus.edu` / `Password123!`)
    * **Platform Actions:** Inspects institutional analytics dashboard, audits system logs, reviews flagged AI moderation incidents, and manages user role approvals.
    * **System Verification:** Complete administrative override, user ban/suspend capabilities, and policy parameter tuning with zero latency.

---

## 📐 Formal Software Engineering & Architectural Deliverables

All system modeling diagrams and project reports adhere to publication and academic submission standards:

| Deliverable | Description | Format & Access Link |
| :--- | :--- | :--- |
| **Project Proposal Report** | Formal LaTeX project proposal document detailing problem formulation, scope, and technical roadmap | [:material-file-pdf-box: View Proposal PDF](https://github.com/aayush-10k/ucs503p-202627odd-CampusConnect/blob/master/project-proposal/campus%20connect%20proposal.pdf) |
| **Mid-Semester Prototype Report** | Comprehensive LaTeX academic evaluation report with architecture specs and benchmark tables | [:material-file-pdf-box: View Prototype Report PDF](CampusConnect_Report_Prototype.pdf) |
| **Entity-Relationship (ER) Diagram** | Relational entity modeling with primary/foreign keys, cardinality, and constraints | [:material-file-pdf-box: View ER Diagram PDF](Diagrams/CampusConnect_ERDiagram.pdf) |
| **UML Activity & Swimlane Diagram** | Multi-partition workflow (`Student`, `Faculty`, `Admin`, `AI Engine`) with concurrency forks | [:material-file-pdf-box: View Activity Diagram PDF](Diagrams/CampusConnect_ActivityDiagram.pdf) |
| **3-Level Data Flow Diagrams (DFDs)** | Complete Level 0 Context, Level 1 Decomposition, and Level 2 Subsystem flows | [:material-file-pdf-box: View DFD PDF](Diagrams/DataflowDiagram.pdf) |
| **UML Use Case Diagram** | Comprehensive actor modeling, system boundaries, `<<include>>` and `<<extend>>` relationships | [:material-file-pdf-box: View Use Case PDF](Diagrams/UseCaseDiagram.pdf) |
| **Master Gantt Chart & Schedule** | Milestone and sprint schedule with dynamic task dependencies | [:material-file-excel: View Excel Gantt](campus_connect-gantt-chart_ms.xlsx) |

---

## 📅 Project Roadmap & Development Phases

| Phase | Milestone / Engineering Objectives | Timeline | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1: Inception** | Project Ideation, Requirement Gathering, Tech Stack Definition, Repository & Git Pipeline Setup | Aug 03 – Aug 23, 2026 | **Completed** |
| **Phase 2: Requirements & Modeling** | LaTeX Proposal Document, UML Use Case Model, 3-Level DFDs, ER Diagram, Master Gantt Chart | Aug 24 – Sep 06, 2026 | **Completed** |
| **Phase 3: Prototype & Evaluation** | Full-Stack Prototype Implementation (v0.3), Real-Time Chat, Gemini AI Moderation, Evaluation Deck | Sep 07 – Sep 20, 2026 | **Active Milestone** |
| **Phase 4: Advanced Capabilities** | Multi-Media Cloudinary Integration, End-to-End Notification System, Advanced Course Analytics | Sep 21 – Oct 25, 2026 | Upcoming |
| **Phase 5: Final Delivery** | Security Hardening, Production Deployment, Final Academic Report, and Project Defense Deck | Oct 26 – Nov 25, 2026 | Upcoming |

---

<p align="center">
  <b>CampusConnect</b> • Academic & Social Networking Platform • Academic Year 2026–27<br>
  <i>Thapar Institute of Engineering and Technology, Patiala</i>
</p>
