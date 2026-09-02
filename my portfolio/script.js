/* ==========================================================================
   SABBANA SASIKUMAR - PORTFOLIO INTERACTIVE LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Project Details Data
    // ----------------------------------------------------------------------
    const projectsData = [
        {
            title: "AI-Based Healthcare Chatbot System",
            category: "AI / NLP + Web Development",
            image: "assets/images/project_chatbot.jpg",
            tags: ["HTML5", "CSS3", "JavaScript", "Python", "NLP", "AI"],
            overview: "An intelligent healthcare assistant designed to evaluate patient symptoms, present preliminary diagnostic suggestions, and calculate vitals metrics using NLP algorithms and intuitive web interfaces.",
            features: [
                "Real-time conversational chat interface for symptom input.",
                "Natural Language Processing (NLP) intent recognition engine.",
                "Interactive medical metrics dashboard (vitals, heart rate, temperature).",
                "Responsive mobile & desktop health summary UI."
            ],
            codeSnippet: `def analyze_symptoms(user_input):\n    intents = nlp_model.predict(user_input)\n    if "headache" in intents:\n        return "Recommended: Rest, hydration, monitor vitals."\n    return "Symptoms analyzed. Please consult Dr. Chen."`
        },
        {
            title: "INCOIS Ocean Service Management System",
            category: "Internship Showcase",
            image: "assets/images/project_incois.jpg",
            tags: ["Web UI", "REST API", "Python", "MySQL", "Ocean Systems"],
            overview: "A specialized web telemetry dashboard built during online internship experience with INCOIS. Visualizes ocean current dynamics, wave height forecasts, and marine alert notifications.",
            features: [
                "Interactive ocean current vector map overlays.",
                "Live ocean buoy telemetry charts & wave period statistics.",
                "Barometric pressure and marine weather warning feeds.",
                "Relational MySQL database schemas for ocean logging."
            ],
            codeSnippet: `async function fetchBuoyTelemetry(buoyId) {\n    const response = await fetch(\`/api/ocean/buoy/\${buoyId}\`);\n    const data = await response.json();\n    updateWaveChart(data.waveHeight, data.period);\n}`
        },
        {
            title: "Personal Full-Stack Portfolio",
            category: "Web Application",
            image: "assets/images/project_portfolio.jpg",
            tags: ["HTML5", "CSS3", "JavaScript", "Glassmorphism", "Responsive"],
            overview: "A modern, high-performance developer portfolio built with glassmorphism design tokens, glowing coral hero ring accents, interactive photo uploaders, and recruiter-friendly presentation.",
            features: [
                "Custom glowing circular avatar halo inspired by top developer aesthetics.",
                "Instant browser profile photo upload & persistence using LocalStorage.",
                "Filterable technical skills grid across 5 categories.",
                "Recruiter-focused interactive resume modal & contact system."
            ],
            codeSnippet: `// Dynamic LocalStorage photo persistence\nfunction saveCustomPhoto(dataUrl) {\n    localStorage.setItem('sasikumar_profile_photo', dataUrl);\n    document.getElementById('profileAvatarImg').src = dataUrl;\n}`
        },
        {
            title: "Task Management Web Application",
            category: "Full-Stack Web App",
            image: "assets/images/project_taskmanager.jpg",
            tags: ["JavaScript", "Firebase", "MySQL", "CRUD", "Kanban"],
            overview: "A productivity tool allowing users to manage project tasks through interactive Kanban boards, priority tagging, drag-and-drop column states, and full CRUD database operations.",
            features: [
                "Interactive Kanban layout (Backlog, In Progress, Testing, Done).",
                "Full CRUD database synchronization via Firebase / MySQL API.",
                "Custom priority badges (Critical, High, Medium, Low).",
                "Real-time task completion progress tracking."
            ],
            codeSnippet: `function updateTaskStatus(taskId, newStatus) {\n    db.collection('tasks').doc(taskId).update({\n        status: newStatus,\n        updatedAt: firebase.firestore.FieldValue.serverTimestamp()\n    });\n}`
        }
    ];

    // ----------------------------------------------------------------------
    // 2. Navigation Header & Scroll Behavior
    // ----------------------------------------------------------------------
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        highlightActiveSection();
    });

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    function highlightActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // ----------------------------------------------------------------------
    // 3. Profile Photo Upload & LocalStorage Persistence
    // ----------------------------------------------------------------------
    const photoUploadOverlay = document.getElementById('photoUploadOverlay');
    const photoFileInput = document.getElementById('photoFileInput');
    const profileAvatarImg = document.getElementById('profileAvatarImg');

    // Load saved photo if exists in localStorage
    const savedPhoto = localStorage.getItem('sasikumar_profile_photo');
    if (savedPhoto && profileAvatarImg) {
        profileAvatarImg.src = savedPhoto;
    }

    if (photoUploadOverlay && photoFileInput) {
        photoUploadOverlay.addEventListener('click', () => {
            photoFileInput.click();
        });

        photoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    showToast('Please select a valid image file (JPEG, PNG, etc.)');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    if (profileAvatarImg) {
                        profileAvatarImg.src = dataUrl;
                    }
                    try {
                        localStorage.setItem('sasikumar_profile_photo', dataUrl);
                        showToast('Profile photo updated and saved successfully! 🎉');
                    } catch (err) {
                        showToast('Profile photo updated for this session!');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ----------------------------------------------------------------------
    // 4. Skills Category Filtering
    // ----------------------------------------------------------------------
    const filterBtns = document.querySelectorAll('.skill-filter-btn');
    const skillCards = document.querySelectorAll('.skill-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            skillCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'flex';
                    card.style.animation = 'fadeIn 0.4s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ----------------------------------------------------------------------
    // 5. Project Details Modal
    // ----------------------------------------------------------------------
    const projectModal = document.getElementById('projectModal');
    const modalClose = document.getElementById('modalClose');
    const modalContent = document.getElementById('modalContent');
    const viewProjectBtns = document.querySelectorAll('.view-project-btn');

    viewProjectBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const projectIndex = parseInt(btn.getAttribute('data-project'));
            const project = projectsData[projectIndex];

            if (project) {
                modalContent.innerHTML = `
                    <div class="project-modal-details">
                        <span class="section-tag">${project.category}</span>
                        <h2 style="font-size: 1.8rem; margin: 0.4rem 0 1rem;">${project.title}</h2>
                        
                        <img src="${project.image}" alt="${project.title}" style="width: 100%; border-radius: 8px; margin-bottom: 1.25rem; border: 1px solid var(--border-color);">
                        
                        <div class="project-tags" style="margin-bottom: 1.25rem;">
                            ${project.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                        </div>

                        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.6;">
                            ${project.overview}
                        </p>

                        <h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.6rem;">Key Features & Architecture:</h4>
                        <ul style="margin-bottom: 1.5rem; padding-left: 1.25rem; color: var(--text-muted); font-size: 0.9rem;">
                            ${project.features.map(f => `<li style="margin-bottom: 0.4rem;">${f}</li>`).join('')}
                        </ul>

                        <h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.6rem;">Code Snippet Preview:</h4>
                        <pre style="background: #0B0F19; border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px; font-family: var(--font-code); font-size: 0.85rem; color: var(--accent-cyan); overflow-x: auto; margin-bottom: 1.5rem;"><code>${escapeHtml(project.codeSnippet)}</code></pre>

                        <div style="display: flex; gap: 1rem;">
                            <a href="https://github.com/sasikumarsabbana-svg" target="_blank" class="btn btn-coral btn-sm">
                                <i class="fa-brands fa-github"></i> Repository Link
                            </a>
                            <button class="btn btn-outline btn-sm" onclick="document.getElementById('projectModal').classList.remove('active')">
                                Close Window
                            </button>
                        </div>
                    </div>
                `;
                projectModal.classList.add('active');
            }
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            projectModal.classList.remove('active');
        });
    }

    // ----------------------------------------------------------------------
    // 6. Resume Modal & Action
    // ----------------------------------------------------------------------
    const resumeBtn = document.getElementById('resumeBtn');
    const resumeModal = document.getElementById('resumeModal');
    const resumeModalClose = document.getElementById('resumeModalClose');
    const downloadResumeAction = document.getElementById('downloadResumeAction');

    if (resumeBtn && resumeModal) {
        resumeBtn.addEventListener('click', () => {
            resumeModal.classList.add('active');
        });
    }

    if (resumeModalClose) {
        resumeModalClose.addEventListener('click', () => {
            resumeModal.classList.remove('active');
        });
    }

    if (downloadResumeAction) {
        downloadResumeAction.addEventListener('click', () => {
            window.print();
        });
    }

    // Close modals on background click
    window.addEventListener('click', (e) => {
        if (e.target === projectModal) projectModal.classList.remove('active');
        if (e.target === resumeModal) resumeModal.classList.remove('active');
    });

    // ----------------------------------------------------------------------
    // 7. Contact Form Simulation & Toast
    // ----------------------------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    const submitFormBtn = document.getElementById('submitFormBtn');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();

            if (!name || !email) {
                showToast('Please fill out all required form fields.');
                return;
            }

            submitFormBtn.disabled = true;
            submitFormBtn.innerHTML = `<span>Sending...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

            setTimeout(() => {
                contactForm.reset();
                submitFormBtn.disabled = false;
                submitFormBtn.innerHTML = `<span>Submit Message</span> <i class="fa-solid fa-paper-plane"></i>`;
                showToast(`Thank you ${name}! Your message has been sent successfully. 🚀`);
            }, 1200);
        });
    }

    // Toast Utility
    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMsg');
        if (toast && toastMsg) {
            toastMsg.textContent = message;
            toast.classList.add('active');
            setTimeout(() => {
                toast.classList.remove('active');
            }, 3500);
        }
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
