# Implementation Plan - Modern Developer Portfolio for Sabbana Sasikumar

Build a high-performance, dark-themed, vibrant, recruiter-friendly personal portfolio website for **Sabbana Sasikumar** (Aspiring Full-Stack Developer), matching the sleek aesthetic of the reference image with glowing accent rings, code card previews, responsive design, and easy profile photo uploading.

---

## User Review Required

> [!IMPORTANT]
> - **Theme & Color Palette**: Dark charcoal background (`#0B0F19` / `#111827`) paired with vibrant glowing coral/orange accents (`#FF6B50` / `#FF5A36`) matching the provided reference screenshot.
> - **Profile Photo Upload Feature**: Included an interactive drag-and-drop / file picker photo upload tool right on the site so you can upload your actual professional headshot without touching any code!
> - **Recruiter-Friendly Resume & Contact Options**: Includes a downloadable Resume modal/button and a live interactive contact form.

---

## Proposed Portfolio Architecture & Content Structure

### 1. Navigation Header
- Brand logo: `Sasikumar .` with glowing accent dot.
- Navigation links: `Home`, `About`, `Skills`, `Experience`, `Projects`, `Contact`.
- Action CTA: "Hire Me" / "Resume" quick button.
- Mobile drawer / responsive hamburger navigation.

### 2. Hero Section
- **Greeting**: "Hello 👋 I'm **Sabbana Sasikumar**"
- **Title**: "Aspiring Full-Stack Developer"
- **Tagline**: *"Building Ideas. Creating Solutions. Growing as a Full-Stack Developer." 🚀*
- **Interactive Profile Halo (Right Side)**:
  - Custom SVG/CSS circular glowing ring matching reference design.
  - Avatar placeholder with an easy **"Upload Profile Photo"** button overlay.
- **CTA Buttons**: `Get In Touch` (Coral solid button) & `Download Resume` (Glass outline button).
- **Tech Marquee Banner**: Infinite scrolling ticker displaying badges for HTML5, CSS3, JavaScript, Python, MySQL, Firebase, AI/NLP, Git, GitHub.

### 3. About & Impact Highlights
- **Bio Summary**: Detailed, engaging introduction highlighting focus on web applications, backend APIs, and AI/NLP integration.
- **Service & Focus Cards**:
  1. *Web Development*: Modern, responsive, performance-driven web apps.
  2. *Backend & APIs*: Python REST API fundamentals and database design.
  3. *AI & NLP Systems*: Healthcare chatbots and smart conversational AI.
- **Impact Stat Counters**:
  - `4+` Featured Projects
  - `2026` MCA Batch
  - `1+` Specialized Internship (INCOIS)
  - `100%` Problem-Solving Focus

### 4. Technical Skills & Core Competencies
- Filterable categories: **All**, **Frontend**, **Backend & DB**, **AI/Tools**, **Core**.
- Visual skill cards with proficiency indicators & badges:
  - *Frontend*: HTML5, CSS3, JavaScript, Responsive Web Design
  - *Backend*: Python, REST API Fundamentals
  - *Database*: MySQL, Firebase
  - *AI & Data*: Artificial Intelligence, NLP, Chatbot Development
  - *Tools & Platforms*: Antigravity, Claude, VS Code, Cursor, Git, GitHub, API Integration
  - *Core Skills*: Problem Solving, Debugging, Logical Thinking, Quick Learning

### 5. Experience & Education (Dual Timeline)
- **Work Experience**:
  - *Online Intern* — **INCOIS Ocean Service Management System**
  - Key achievements & responsibilities in ocean data service UI/backend workflows.
- **Education**:
  - *Master of Computer Applications (MCA)* — **Vignan Degree & PG College** (Expected 2026)
  - Core coursework & foundational focus in Computer Science.

### 6. Featured Projects Showcase
Interactive card grid matching the code-editor / preview style from the reference design:
1. **AI-Based Healthcare Chatbot System** (AI/NLP + Web Development)
   - Code snippet preview, feature list, stack tags (`Python`, `NLP`, `JS`, `API`).
2. **INCOIS Ocean Service Management System** (Internship Experience)
   - Data visualizer preview, service dashboard highlights, stack tags (`Web UI`, `REST API`, `MySQL`).
3. **Personal Full-Stack Portfolio** (Responsive Modern Web Application)
   - UI showcase, modular design, theme features, stack tags (`HTML5`, `CSS3`, `JavaScript`).
4. **Task Management Web Application** (CRUD + Database Integration)
   - Interactive Kanban preview, task management highlights, stack tags (`JS`, `Firebase`, `CRUD`).
- Direct live demo modal popup & GitHub links for each project.

### 7. Languages, Hobbies & Personal Interests
- **Languages**: English, Telugu (with proficiency pills).
- **Hobbies & Interests**: 
  - Web Development & Tech
  - Exploring AI & Emerging Tech
  - Playing Volleyball 🏐
  - Playing Cricket 🏏
  - Listening to Podcasts 🎧
  - Continuous Learning 💡

### 8. Contact & Connect Section
- **Left Column**: "Have a project or job opportunity? Let's talk!"
  - Contact email, location, social links (GitHub, LinkedIn, Email).
- **Right Column**: Sleek dark contact form with real-time form validation and floating toast notification on submit.

---

## File Structure

- `index.html` — Semantic, SEO-optimized HTML structure with Meta tags & OpenGraph data.
- `styles.css` — Modern CSS variable design system, glassmorphism, coral glowing accents, animations, responsive grid/flexbox layouts.
- `script.js` — Smooth scrolling, mobile menu toggle, skill category filter, photo upload live preview handler, project modal modal, and contact form simulator.
- `assets/images/` — AI-generated project thumbnails, SVG icons, background glow vectors, avatar placeholder.

---

## Verification Plan

### Automated & Static Verification
- Lint HTML/CSS/JS syntax.
- Verify web app locally using `npx serve` or local dev server.

### Manual Verification & Visual Polish
- Test profile photo uploader to ensure user can upload and persist their photo in the browser (`localStorage`).
- Check responsive behavior across Mobile (375px), Tablet (768px), and Desktop (1440px).
- Verify smooth scrolling, interactive filters, modal popups, and dark glassmorphic styling match the reference image aesthetics.
