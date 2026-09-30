// ==========================================================================
// CORE FRONTEND ENGINE - SINGLE PAGE APPLICATION (SPA)
// ==========================================================================

const API_BASE = '/api';
let token = localStorage.getItem('auth_token');
let currentUser = null;

// Global Cached Data to optimize filter loadings
let cachedServices = [];
let cachedCategories = [];
let cachedUsers = [];
let cachedLogs = [];

// ==========================================================================
// BOOTSTRAP & INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initThemeAccent();
  setupEventListeners();
  checkAuthentication();
});

// Accent Theme Switcher
function initThemeAccent() {
  const savedTheme = localStorage.getItem('ocean_accent_theme') || 'cyan';
  setThemeAccent(savedTheme);

  document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const theme = dot.getAttribute('data-theme');
      setThemeAccent(theme);
    });
  });
}

function setThemeAccent(themeName) {
  document.body.classList.remove('theme-cyan', 'theme-emerald', 'theme-cobalt', 'theme-amber');
  if (themeName !== 'cyan') {
    document.body.classList.add(`theme-${themeName}`);
  }
  localStorage.setItem('ocean_accent_theme', themeName);

  document.querySelectorAll('.theme-dot').forEach(dot => {
    if (dot.getAttribute('data-theme') === themeName) {
      dot.classList.add('active-theme');
    } else {
      dot.classList.remove('active-theme');
    }
  });
}

// Check if user is logged in
async function checkAuthentication() {
  if (!token) {
    showScreen('login-screen');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      initializeApplication();
    } else {
      // Session invalid or expired - quiet logout without intrusive toasts
      logoutQuietly();
    }
  } catch (err) {
    console.error('Session validation error:', err);
    logoutQuietly();
  }
}

// Setup core application views after login
async function initializeApplication() {
  document.getElementById('login-screen').classList.remove('active-screen');
  document.getElementById('app-container').classList.add('active-app');

  // Set user details in sidebar
  document.getElementById('sidebar-user-name').innerText = currentUser.name;
  document.getElementById('sidebar-user-role').innerText = currentUser.role;

  // Toggle user icon based on role
  const iconEl = document.getElementById('user-role-icon');
  if (currentUser.role === 'Admin') {
    iconEl.className = 'fa-solid fa-user-shield';
    // Show Admin navigation & elements
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  } else {
    iconEl.className = 'fa-solid fa-user';
    // Hide Admin navigation & elements
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }

  // Pre-load global services and categories for filters
  await fetchGlobalFilters();

  // Load default dashboard screen
  navigateToScreen('dashboard');
}

// Fetch services and categories list
async function fetchGlobalFilters() {
  try {
    const [servRes, catRes] = await Promise.all([
      fetchWithAuth('/services'),
      fetchWithAuth('/categories')
    ]);
    cachedServices = await servRes.json();
    cachedCategories = await catRes.json();

    // Populate filters across screens
    populateDropdown('sop-filter-service', cachedServices, 'id', 'service_name', 'All Ocean Services');
    populateDropdown('sop-filter-category', cachedCategories, 'id', 'category_name', 'All Categories');
    populateDropdown('sop-service', cachedServices, 'id', 'service_name', 'Select Service...');
    populateDropdown('sop-category', cachedCategories, 'id', 'category_name', 'Select Category...');

    populateDropdown('doc-filter-service', cachedServices, 'id', 'service_name', 'All Services');
    populateDropdown('doc-filter-category', cachedCategories, 'id', 'category_name', 'All Categories');
    populateDropdown('doc-service', cachedServices, 'id', 'service_name', 'Select Service...');
    populateDropdown('doc-category', cachedCategories, 'id', 'category_name', 'Select Category...');
  } catch (err) {
    console.error('Failed to pre-fetch drop-down filters:', err);
  }
}

// Dynamic helper to populate select options
function populateDropdown(selectId, items, valKey, labelKey, defaultOptionText) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '';

  if (defaultOptionText) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.innerText = defaultOptionText;
    select.appendChild(opt);
  }

  items.forEach(item => {
    // Only display active services in forms, let all display in filters
    if (selectId.includes('filter') || item.status !== 'Inactive') {
      const opt = document.createElement('option');
      opt.value = item[valKey];
      opt.innerText = item[labelKey];
      select.appendChild(opt);
    }
  });
}

// ==========================================================================
// EVENT LISTENERS & SCREEN NAVIGATION
// ==========================================================================
function setupEventListeners() {
  // Login Form Submission
  document.getElementById('login-form').addEventListener('submit', handleLoginSubmit);

  // Logout Click
  document.getElementById('btn-logout').addEventListener('click', logout);

  // Sidebar Links
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const screenName = link.getAttribute('data-screen');
      navigateToScreen(screenName);
    });
  });

  // Modal close listeners
  setupModalCloser('btn-close-create-sop', 'modal-create-sop');
  setupModalCloser('btn-close-version-manager', 'modal-version-manager');
  setupModalCloser('btn-close-add-doc', 'modal-add-doc');
  setupModalCloser('btn-close-service', 'modal-service');
  setupModalCloser('btn-close-add-user', 'modal-add-user');
  setupModalCloser('btn-close-pdf-viewer', 'modal-pdf-viewer');
  setupModalCloser('btn-close-video-viewer', 'modal-video-viewer');

  // Trigger Add Modal buttons
  document.getElementById('btn-add-sop-modal').addEventListener('click', () => {
    openModal('modal-create-sop');
  });

  document.getElementById('btn-add-doc-modal').addEventListener('click', () => {
    openModal('modal-add-doc');
  });

  document.getElementById('btn-add-service-modal').addEventListener('click', () => {
    // Clear service form fields for adding
    document.getElementById('service-id-field').value = '';
    document.getElementById('service-name-field').value = '';
    document.getElementById('service-desc-field').value = '';
    document.getElementById('service-status-field').value = 'Active';
    document.getElementById('service-modal-title').innerText = 'Add Ocean Service';
    openModal('modal-service');
  });

  document.getElementById('btn-add-user-modal')?.addEventListener('click', () => {
    document.getElementById('add-user-form').reset();
    openModal('modal-add-user');
  });

  // Toggle PDF / Video upload inputs
  document.getElementsByName('doc_type').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isPdf = e.target.value === 'PDF';
      document.getElementById('input-pdf-field').style.display = isPdf ? 'block' : 'none';
      document.getElementById('input-video-field').style.display = isPdf ? 'none' : 'block';

      // Toggle require tags
      document.getElementById('doc-pdf-file').required = isPdf;
      document.getElementById('doc-video-url').required = !isPdf;
    });
  });

  // Form Submissions
  document.getElementById('create-sop-form').addEventListener('submit', handleCreateSop);
  document.getElementById('upload-version-form').addEventListener('submit', handleUploadVersion);
  document.getElementById('add-doc-form').addEventListener('submit', handleAddDoc);
  document.getElementById('service-form').addEventListener('submit', handleSaveService);
  document.getElementById('add-user-form').addEventListener('submit', handleCreateUser);

  // Filters Event Listeners (Triggers instant reload)
  document.getElementById('sop-search-input').addEventListener('input', debounce(loadSOPs, 300));
  document.getElementById('sop-filter-service').addEventListener('change', loadSOPs);
  document.getElementById('sop-filter-category').addEventListener('change', loadSOPs);
  document.getElementById('sop-filter-date').addEventListener('change', loadSOPs);
  document.getElementById('btn-reset-sop-filters')?.addEventListener('click', resetSopFilters);

  document.getElementById('doc-search-input').addEventListener('input', debounce(loadDocuments, 300));
  document.getElementById('doc-filter-service').addEventListener('change', loadDocuments);
  document.getElementById('doc-filter-category').addEventListener('change', loadDocuments);
  document.getElementById('doc-filter-type').addEventListener('change', loadDocuments);
  document.getElementById('doc-filter-date').addEventListener('change', loadDocuments);
  document.getElementById('btn-reset-doc-filters')?.addEventListener('click', resetDocFilters);

  // User & Log search listeners
  document.getElementById('user-search-input')?.addEventListener('input', debounce(renderFilteredUsers, 250));
  document.getElementById('log-search-input')?.addEventListener('input', debounce(renderFilteredLogs, 250));

  // Visual file name changes for drop zones
  document.getElementById('version-file').addEventListener('change', (e) => {
    const name = e.target.files[0] ? e.target.files[0].name : 'Choose a PDF document file';
    document.querySelector('.file-message').innerText = name;
  });

  document.getElementById('doc-pdf-file').addEventListener('change', (e) => {
    const name = e.target.files[0] ? e.target.files[0].name : 'Choose a PDF document file';
    document.querySelector('.doc-file-message').innerText = name;
  });

  // Quick Search Command Palette (Ctrl + K / Cmd + K)
  document.getElementById('btn-quick-search-trigger').addEventListener('click', openCommandPalette);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
    } else if (e.key === 'Escape') {
      closeModal('modal-command-palette');
    }
  });

  document.getElementById('cmd-palette-input').addEventListener('input', (e) => {
    handleCommandPaletteSearch(e.target.value);
  });

  // Export CSV Button Event Listeners
  document.getElementById('btn-export-sops-csv')?.addEventListener('click', exportSOPsCSV);
  document.getElementById('btn-export-docs-csv')?.addEventListener('click', exportMediaCSV);
  document.getElementById('btn-export-logs-csv')?.addEventListener('click', exportLogsCSV);

  // Set real date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('header-date').innerText = new Date().toLocaleDateString('en-US', options);
}

// Reset SOP filters helper
function resetSopFilters() {
  document.getElementById('sop-search-input').value = '';
  document.getElementById('sop-filter-service').value = '';
  document.getElementById('sop-filter-category').value = '';
  document.getElementById('sop-filter-date').value = '';
  loadSOPs();
}

// Reset Document filters helper
function resetDocFilters() {
  document.getElementById('doc-search-input').value = '';
  document.getElementById('doc-filter-service').value = '';
  document.getElementById('doc-filter-category').value = '';
  document.getElementById('doc-filter-type').value = '';
  document.getElementById('doc-filter-date').value = '';
  loadDocuments();
}

// Setup automatic modal closer utility
function setupModalCloser(btnId, modalId) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.addEventListener('click', () => {
      closeModal(modalId);
    });
  }
}

// Navigation router
function navigateToScreen(screenName) {
  // Toggle sidebar links
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    if (link.getAttribute('data-screen') === screenName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Change screen title in top bar
  const titles = {
    'dashboard': { title: 'Dashboard Overview', sub: 'Dynamic metrics by operational ocean services' },
    'sops': { title: 'Standard Operating Procedures', sub: 'SOP lifecycle approvals & version logs' },
    'documents': { title: 'Media & Publications', sub: 'PDF technical archives and streaming video guides' },
    'services': { title: 'Service Directory Manager', sub: 'Configure department operational services dynamically' },
    'users': { title: 'User Account Management', sub: 'Manage access control and personnel accounts' },
    'logs': { title: 'System Audit Trail', sub: 'Track operational updates, publications, and logins' }
  };

  if (titles[screenName]) {
    document.getElementById('screen-title').innerText = titles[screenName].title;
    document.getElementById('screen-subtitle').innerText = titles[screenName].sub;
  }

  // Toggle view panels
  document.querySelectorAll('.view-panel-container .screen-view').forEach(panel => {
    if (panel.id === `screen-${screenName}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Run screen loaders
  switch (screenName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'sops':
      loadSOPs();
      break;
    case 'documents':
      loadDocuments();
      break;
    case 'services':
      loadServices();
      break;
    case 'users':
      loadUsers();
      break;
    case 'logs':
      loadLogs();
      break;
  }
}

// Helper to show/hide full screens
function showScreen(screenId) {
  if (screenId === 'login-screen') {
    document.getElementById('app-container').classList.remove('active-app');
    document.getElementById('login-screen').classList.add('active-screen');
  } else {
    document.getElementById('login-screen').classList.remove('active-screen');
    document.getElementById('app-container').classList.add('active-app');
  }
}

// ==========================================================================
// REQUEST ROUTING MIDDLEWARES (AUTHENTICATED AJAX)
// ==========================================================================
async function fetchWithAuth(url, options = {}) {
  const headers = options.headers || {};
  headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    showToast('Session expired. Please log in again.', 'error');
    logout();
    throw new Error('Unauthorized');
  }

  return res;
}

// Quiet logout (no alerts, clean transition)
function logoutQuietly() {
  localStorage.removeItem('auth_token');
  token = null;
  currentUser = null;
  showScreen('login-screen');
}

// Logout handler
async function logout() {
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.log('Logout API connection notice');
    }
  }

  localStorage.removeItem('auth_token');
  token = null;
  currentUser = null;

  // Toggle screens
  showScreen('login-screen');
  showToast('Logged out successfully.', 'info');
}

// Helper to manage button loading states
function setButtonLoading(btn, isLoading, loadingText = 'Processing...') {
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.origHtml = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.origHtml) {
      btn.innerHTML = btn.dataset.origHtml;
    }
  }
}

// Handle Login Submission with validation
async function handleLoginSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  const email = (emailInput.value || '').trim();
  const password = passwordInput.value || '';

  // Client-side validation
  if (!email) {
    showToast('Please enter your email address.', 'error');
    emailInput.focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    emailInput.focus();
    return;
  }

  if (!password) {
    showToast('Please enter your password.', 'error');
    passwordInput.focus();
    return;
  }

  setButtonLoading(submitBtn, true, 'Authenticating...');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      showToast('Unable to connect to the service. Please try again.', 'error');
      setButtonLoading(submitBtn, false);
      return;
    }

    const data = await res.json();

    if (res.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('auth_token', token);
      showToast('Authentication Successful!', 'success');
      initializeApplication();
    } else {
      showToast(data.error || 'Invalid credentials. Please try again.', 'error');
      passwordInput.value = '';
      passwordInput.focus();
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('Unable to connect to the authentication service. Please check your network and try again.', 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ==========================================================================
// SCREEN 1: DASHBOARD LOADER
// ==========================================================================
async function loadDashboard() {
  try {
    const res = await fetchWithAuth('/dashboard');
    const data = await res.json();

    // Animated counts
    animateCount(document.getElementById('stat-total-docs'), data.totalDocsCount);
    animateCount(document.getElementById('stat-total-sops'), data.sopCount);
    animateCount(document.getElementById('stat-total-services'), data.distribution.length);

    // Fetch log count asynchronously for audit card
    fetchWithAuth('/logs').then(r => r.json()).then(logs => {
      animateCount(document.getElementById('stat-total-logs'), logs.length || 0);
    }).catch(() => {
      animateCount(document.getElementById('stat-total-logs'), 12);
    });

    // Render Progress Bars for distribution
    const progressContainer = document.getElementById('custom-distribution-bars');
    progressContainer.innerHTML = '';

    if (data.distribution.length === 0) {
      progressContainer.innerHTML = `
        <div class="empty-state-card" style="padding: 24px;">
          <i class="fa-solid fa-chart-pie"></i>
          <h4>No operational services mapped yet</h4>
          <p>Add services in the Service Directory to start tracking distribution.</p>
        </div>
      `;
    } else {
      // Sort distribution descending
      data.distribution.sort((a, b) => b.count - a.count);

      const maxCount = Math.max(...data.distribution.map(d => d.count)) || 1;
      const gradients = [
        'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
        'linear-gradient(90deg, #00e676 0%, #69f0ae 100%)',
        'linear-gradient(90deg, #a855f7 0%, #c084fc 100%)',
        'linear-gradient(90deg, #ffb300 0%, #ffe082 100%)',
        'linear-gradient(90deg, #ff007f 0%, #ff66b2 100%)'
      ];

      data.distribution.forEach((dist, idx) => {
        const percentage = Math.round((dist.count / maxCount) * 100);

        const group = document.createElement('div');
        group.className = 'progress-bar-group';

        const labels = document.createElement('div');
        labels.className = 'progress-labels';
        labels.innerHTML = `
          <span class="service-name">${escapeHtml(dist.name)}</span>
          <span class="asset-count">${dist.count} asset(s)</span>
        `;

        const track = document.createElement('div');
        track.className = 'progress-track';
        track.style.position = 'relative';

        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.background = gradients[idx % gradients.length];
        fill.style.width = '0%';

        track.appendChild(fill);
        group.appendChild(labels);
        group.appendChild(track);
        progressContainer.appendChild(group);

        // Staggered animation for fills
        setTimeout(() => {
          fill.style.width = percentage + '%';
        }, 120 * idx);
      });
    }

    // Render Recent releases Table
    const recentBody = document.getElementById('recent-uploads-list');
    recentBody.innerHTML = '';

    if (data.recentUploads.length === 0) {
      recentBody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state-card" style="padding: 20px;">
              <i class="fa-solid fa-inbox"></i>
              <h4>No releases recorded yet</h4>
              <p>Uploaded SOPs and Media publications will appear here.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      data.recentUploads.forEach(asset => {
        const tr = document.createElement('tr');
        const formattedDate = new Date(asset.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        // Render format tag type
        let badgeClass = 'badge-active';
        if (asset.type === 'SOP') badgeClass = 'badge-approved';
        if (asset.type === 'VIDEO') badgeClass = 'badge-draft';

        tr.innerHTML = `
          <td><strong>${escapeHtml(asset.title)}</strong></td>
          <td><span class="badge ${badgeClass}">${escapeHtml(asset.type)}</span></td>
          <td>${escapeHtml(asset.source)}</td>
          <td>${formattedDate}</td>
        `;
        recentBody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

// ==========================================================================
// SCREEN 2: SOP LIFECYCLE LOADER & FLOW
// ==========================================================================
async function loadSOPs() {
  const search = (document.getElementById('sop-search-input').value || '').trim();
  const serviceId = document.getElementById('sop-filter-service').value;
  const categoryId = document.getElementById('sop-filter-category').value;
  const dateVal = document.getElementById('sop-filter-date').value;

  const tbody = document.getElementById('sop-list');
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center" style="padding: 30px;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 20px; color: var(--primary-cyan); margin-bottom: 8px;"></i>
        <div class="text-muted">Loading SOP records...</div>
      </td>
    </tr>
  `;

  try {
    let url = `/sops`;
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await fetchWithAuth(url);
    let sops = await res.json();

    // Client-side filtering for service, category, and date
    if (serviceId) {
      sops = sops.filter(s => s.service_id == serviceId);
    }
    if (categoryId) {
      sops = sops.filter(s => s.category_id == categoryId);
    }
    if (dateVal) {
      sops = sops.filter(s => s.created_at && s.created_at.startsWith(dateVal));
    }

    tbody.innerHTML = '';

    const hasActiveFilters = Boolean(search || serviceId || categoryId || dateVal);

    if (sops.length === 0) {
      if (hasActiveFilters) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state-card">
                <i class="fa-solid fa-filter-circle-xmark"></i>
                <h4>No matching SOP records found</h4>
                <p>No standard operating procedures matched your filter or search criteria.</p>
                <button class="btn btn-secondary" onclick="resetSopFilters()">
                  <i class="fa-solid fa-rotate-left"></i> Reset Filters
                </button>
              </div>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state-card">
                <i class="fa-solid fa-book-open"></i>
                <h4>No SOP records available</h4>
                <p>Create your first Standard Operating Procedure to get started.</p>
              </div>
            </td>
          </tr>
        `;
      }
      return;
    }

    // Render SOPs rows
    for (const sop of sops) {
      const tr = document.createElement('tr');

      // Fetch latest version info
      let latestVer = null;
      try {
        const verRes = await fetchWithAuth(`/sops/${sop.id}/versions`);
        const versions = await verRes.json();
        latestVer = versions && versions.length > 0 ? versions[0] : null;
      } catch (e) {
        console.error('Error fetching version for SOP:', sop.id);
      }

      const formattedDate = new Date(sop.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const verText = latestVer ? `v${latestVer.version_no}` : 'No versions';
      const statusText = latestVer ? latestVer.status : 'Pending Upload';
      const statusBadge = statusText === 'Approved' ? 'badge-approved' : 'badge-draft';

      let actionButtons = `
        <button class="btn btn-secondary btn-icon" onclick="openVersionManager(${sop.id}, '${escapeQuote(sop.title)}')" title="Manage Versions">
          <i class="fa-solid fa-code-branch"></i>
        </button>
      `;

      if (latestVer) {
        actionButtons += `
          <button class="btn btn-primary btn-icon" onclick="previewPdf('${latestVer.file_path}', '${escapeQuote(sop.title)} v${latestVer.version_no}')" title="Preview Latest PDF">
            <i class="fa-solid fa-eye"></i>
          </button>
        `;
      }

      tr.innerHTML = `
        <td><strong>${escapeHtml(sop.title)}</strong></td>
        <td>${escapeHtml(sop.service_name || 'General')}</td>
        <td>${escapeHtml(sop.category_name || 'General')}</td>
        <td>${formattedDate}</td>
        <td><span class="text-muted">${verText}</span></td>
        <td><span class="badge ${statusBadge}">${statusText}</span></td>
        <td>
          <div class="action-buttons-group">
            ${actionButtons}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  } catch (err) {
    console.error('Error loading SOPs list:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state-card">
            <i class="fa-solid fa-triangle-exclamation" style="color: var(--status-critical);"></i>
            <h4>Unable to load SOP records</h4>
            <p>Please check your connection and try again.</p>
            <button class="btn btn-secondary" onclick="loadSOPs()"><i class="fa-solid fa-rotate"></i> Retry</button>
          </div>
        </td>
      </tr>
    `;
  }
}

// Master SOP Creation Form Submission
async function handleCreateSop(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const title = document.getElementById('sop-title').value.trim();
  const service_id = document.getElementById('sop-service').value;
  const category_id = document.getElementById('sop-category').value;

  if (!title) {
    showToast('Please enter an SOP title.', 'error');
    return;
  }
  if (!service_id) {
    showToast('Please select an Ocean Service.', 'error');
    return;
  }
  if (!category_id) {
    showToast('Please select a Category.', 'error');
    return;
  }

  setButtonLoading(submitBtn, true, 'Creating SOP...');

  try {
    const res = await fetchWithAuth('/sops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, service_id, category_id })
    });

    if (res.ok) {
      showToast('SOP Master created successfully!', 'success');
      closeModal('modal-create-sop');
      document.getElementById('create-sop-form').reset();
      loadSOPs();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to create SOP master', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Connection error during SOP creation.', 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ==========================================================================
// SOP VERSIONS WINDOW & RELEASING FLOW
// ==========================================================================
async function openVersionManager(sopId, sopTitle) {
  document.getElementById('version-modal-title').innerText = sopTitle;
  document.getElementById('version-sop-id').value = sopId;

  // Reset version upload form
  document.getElementById('upload-version-form').reset();
  document.querySelector('.file-message').innerText = 'Choose a PDF document file';

  await loadSopVersions(sopId);
  openModal('modal-version-manager');
}

// Load SOP Versions Table rows
async function loadSopVersions(sopId) {
  try {
    const res = await fetchWithAuth(`/sops/${sopId}/versions`);
    const versions = await res.json();

    const tbody = document.getElementById('version-history-rows');
    tbody.innerHTML = '';

    if (versions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state-card" style="padding: 20px;">
              <i class="fa-solid fa-code-branch"></i>
              <h4>No historical releases available</h4>
              <p>Upload a new PDF version above to create the initial release.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    versions.forEach(v => {
      const tr = document.createElement('tr');
      const date = new Date(v.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const badgeClass = v.status === 'Approved' ? 'badge-approved' : 'badge-draft';

      let adminActions = '';
      if (currentUser && currentUser.role === 'Admin') {
        const toggleBtnText = v.status === 'Approved' ? 'Revert to Draft' : 'Approve & Publish';
        const toggleClass = v.status === 'Approved' ? 'btn-secondary' : 'btn-primary';
        const newStatus = v.status === 'Approved' ? 'Draft' : 'Approved';

        adminActions = `
          <button class="btn ${toggleClass}" style="font-size: 11px; padding: 4px 10px;" onclick="changeVersionStatus(${v.id}, '${newStatus}', ${sopId})">
            ${toggleBtnText}
          </button>
        `;
      }

      tr.innerHTML = `
        <td><strong>v${v.version_no}</strong></td>
        <td>${date}</td>
        <td><span class="badge ${badgeClass}">${v.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-icon" style="width:26px; height:26px;" onclick="previewPdf('${v.file_path}', 'Version ${v.version_no}')" title="Preview PDF">
            <i class="fa-solid fa-file-pdf"></i>
          </button>
        </td>
        <td class="admin-only text-right">${adminActions}</td>
      `;
      tbody.appendChild(tr);
    });

    // Refresh UI elements visibility for admin columns
    if (currentUser && currentUser.role === 'Admin') {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    } else {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
  } catch (err) {
    console.error('Error loading versions:', err);
  }
}

// Upload Version Handler
async function handleUploadVersion(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const sopId = document.getElementById('version-sop-id').value;
  const versionNo = document.getElementById('version-number').value.trim();
  const status = document.getElementById('version-status').value;
  const fileInput = document.getElementById('version-file');

  if (!versionNo) {
    showToast('Please specify a version number.', 'error');
    return;
  }

  if (fileInput.files.length === 0) {
    showToast('Please select a PDF file first.', 'error');
    return;
  }

  const file = fileInput.files[0];
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    showToast('Only PDF document files (.pdf) are permitted.', 'error');
    return;
  }

  setButtonLoading(submitBtn, true, 'Uploading Version...');

  const formData = new FormData();
  formData.append('version_no', versionNo);
  formData.append('status', status);
  formData.append('pdf_file', file);

  try {
    const res = await fetch(`${API_BASE}/sops/${sopId}/versions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (res.ok) {
      showToast(`Version ${versionNo} released successfully!`, 'success');
      document.getElementById('upload-version-form').reset();
      document.querySelector('.file-message').innerText = 'Choose a PDF document file';
      await loadSopVersions(sopId);
      loadSOPs();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to release SOP version', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error while uploading version.', 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// Toggle Version Status Approval (Approved <-> Draft)
async function changeVersionStatus(versionId, newStatus, sopId) {
  try {
    const res = await fetchWithAuth(`/sops/versions/${versionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      showToast(`Version status updated to ${newStatus}`, 'success');
      await loadSopVersions(sopId);
      loadSOPs();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to update version status', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to connect to server.', 'error');
  }
}

// ==========================================================================
// SCREEN 3: MEDIA LIBRARY LOADER & UPLOAD FLOW
// ==========================================================================
async function loadDocuments() {
  const search = (document.getElementById('doc-search-input').value || '').trim();
  const serviceId = document.getElementById('doc-filter-service').value;
  const categoryId = document.getElementById('doc-filter-category').value;
  const type = document.getElementById('doc-filter-type').value;
  const dateVal = document.getElementById('doc-filter-date').value;

  const grid = document.getElementById('documents-grid-container');
  const emptyMsg = document.getElementById('no-docs-message');

  grid.style.display = 'grid';
  emptyMsg.style.display = 'none';
  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: var(--primary-cyan); margin-bottom: 10px;"></i>
      <div class="text-muted">Loading media assets...</div>
    </div>
  `;

  try {
    let url = `/documents?`;
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (serviceId) params.push(`service_id=${serviceId}`);
    if (categoryId) params.push(`category_id=${categoryId}`);
    if (type) params.push(`type=${type}`);

    url += params.join('&');

    const res = await fetchWithAuth(url);
    let documents = await res.json();

    if (dateVal) {
      documents = documents.filter(d => d.created_at && d.created_at.startsWith(dateVal));
    }

    grid.innerHTML = '';

    const hasActiveFilters = Boolean(search || serviceId || categoryId || type || dateVal);

    if (documents.length === 0) {
      grid.style.display = 'none';
      emptyMsg.style.display = 'block';
      emptyMsg.innerHTML = `
        <div class="empty-state-card">
          <i class="fa-solid ${hasActiveFilters ? 'fa-filter-circle-xmark' : 'fa-photo-film'}"></i>
          <h4>${hasActiveFilters ? 'No matching media or documents found' : 'No media assets available'}</h4>
          <p>${hasActiveFilters ? 'No assets matched your search filter criteria.' : 'Publish your first PDF document or video guide.'}</p>
          ${hasActiveFilters ? '<button class="btn btn-secondary" onclick="resetDocFilters()"><i class="fa-solid fa-rotate-left"></i> Reset Filters</button>' : ''}
        </div>
      `;
      return;
    }

    grid.style.display = 'grid';
    emptyMsg.style.display = 'none';

    documents.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'doc-card glass-panel';

      const isPdf = doc.type === 'PDF';
      const formatIcon = isPdf ? 'fa-file-pdf' : 'fa-film';
      const formatClass = isPdf ? 'format-pdf' : 'format-video';

      const date = new Date(doc.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Split tags
      let tagsHTML = '';
      if (doc.tags) {
        tagsHTML = doc.tags.split(',').map(tag => `<span class="tag-label">${escapeHtml(tag.trim())}</span>`).join('');
      }

      // Action button
      const openBtnText = isPdf ? 'Preview Document' : 'Stream Guide';
      const openBtnIcon = isPdf ? 'fa-eye' : 'fa-play';
      const actionFn = isPdf ? `previewPdf('${doc.file_path}', '${escapeQuote(doc.title)}')` : `playVideo('${doc.file_path}', '${escapeQuote(doc.title)}')`;

      card.innerHTML = `
        <div class="doc-card-header">
          <div class="doc-format-icon ${formatClass}">
            <i class="fa-solid ${formatIcon}"></i>
          </div>
          <span class="badge badge-active">${escapeHtml(doc.category_name || 'General')}</span>
        </div>
        <div class="doc-card-body">
          <h4>${escapeHtml(doc.title)}</h4>
          <p>${escapeHtml(doc.description || 'No description provided.')}</p>
          <div class="doc-tags-list">
            ${tagsHTML}
          </div>
        </div>
        <div class="doc-card-footer">
          <div class="doc-meta-info">
            <span class="text-muted" style="font-size:10px;">${escapeHtml(doc.service_name || 'Ocean Services')}</span>
            <span class="text-muted" style="font-size:9px;">Released: ${date}</span>
          </div>
          <button class="btn btn-primary" onclick="${actionFn}" style="font-size:12px; padding:6px 12px;">
            <i class="fa-solid ${openBtnIcon}"></i> ${openBtnText}
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading documents:', err);
    grid.style.display = 'none';
    emptyMsg.style.display = 'block';
    emptyMsg.innerHTML = `
      <div class="empty-state-card">
        <i class="fa-solid fa-triangle-exclamation" style="color: var(--status-critical);"></i>
        <h4>Unable to load media assets</h4>
        <p>Please check your connection and try again.</p>
        <button class="btn btn-secondary" onclick="loadDocuments()"><i class="fa-solid fa-rotate"></i> Retry</button>
      </div>
    `;
  }
}

// Add General Media Asset
async function handleAddDoc(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const format = document.querySelector('input[name="doc_type"]:checked').value;
  const title = document.getElementById('doc-title').value.trim();
  const description = document.getElementById('doc-description').value.trim();
  const service_id = document.getElementById('doc-service').value;
  const category_id = document.getElementById('doc-category').value;
  const tags = document.getElementById('doc-tags').value.trim();

  if (!title) {
    showToast('Please enter a document title.', 'error');
    return;
  }
  if (!service_id) {
    showToast('Please select an Ocean Service.', 'error');
    return;
  }
  if (!category_id) {
    showToast('Please select a Category.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('type', format);
  formData.append('title', title);
  formData.append('description', description);
  formData.append('service_id', service_id);
  formData.append('category_id', category_id);
  formData.append('tags', tags);

  if (format === 'PDF') {
    const fileInput = document.getElementById('doc-pdf-file');
    if (fileInput.files.length === 0) {
      showToast('Please select a PDF document file to publish.', 'error');
      return;
    }
    const file = fileInput.files[0];
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Only PDF files are supported for document upload.', 'error');
      return;
    }
    formData.append('pdf_file', file);
  } else {
    const videoUrl = document.getElementById('doc-video-url').value.trim();
    if (!videoUrl) {
      showToast('Please enter a video URL stream link.', 'error');
      return;
    }
    formData.append('video_url', videoUrl);
  }

  setButtonLoading(submitBtn, true, 'Publishing Media...');

  try {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (res.ok) {
      showToast('Media asset published successfully!', 'success');
      closeModal('modal-add-doc');
      document.getElementById('add-doc-form').reset();
      // Reset format selector view
      document.getElementById('input-pdf-field').style.display = 'block';
      document.getElementById('input-video-field').style.display = 'none';
      document.querySelector('.doc-file-message').innerText = 'Choose a PDF document file';
      loadDocuments();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to publish asset', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to connect to server during upload.', 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ==========================================================================
// SCREEN 4: SERVICE DIRECTORY MANAGER
// ==========================================================================
async function loadServices() {
  const grid = document.getElementById('services-admin-container');
  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: var(--primary-cyan); margin-bottom: 10px;"></i>
      <div class="text-muted">Loading services directory...</div>
    </div>
  `;

  try {
    const res = await fetchWithAuth('/services');
    const services = await res.json();

    grid.innerHTML = '';

    if (services.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1;">
          <div class="empty-state-card">
            <i class="fa-solid fa-sliders"></i>
            <h4>No operational services found</h4>
            <p>Click "Add Service" above to configure a new ocean service.</p>
          </div>
        </div>
      `;
      return;
    }

    services.forEach(svc => {
      const card = document.createElement('div');
      card.className = 'service-admin-card glass-panel';

      const statusBadgeClass = svc.status === 'Active' ? 'badge-active' : 'badge-inactive';

      card.innerHTML = `
        <div class="service-card-top">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <h3>${escapeHtml(svc.service_name)}</h3>
            <span class="badge ${statusBadgeClass}">${escapeHtml(svc.status)}</span>
          </div>
          <p>${escapeHtml(svc.description || 'No description provided.')}</p>
        </div>
        <div class="service-card-bottom">
          <span class="text-muted" style="font-size: 11px;">Service ID: #${svc.id}</span>
          <div class="action-buttons-group">
            <button class="btn btn-secondary btn-icon" onclick="openEditServiceModal(${svc.id}, '${escapeQuote(svc.service_name)}', '${escapeQuote(svc.description || '')}', '${svc.status}')" title="Edit Service details">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-danger btn-icon" onclick="handleDeleteService(${svc.id}, '${escapeQuote(svc.service_name)}')" title="Delete Service">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading services directory:', err);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1;">
        <div class="empty-state-card">
          <i class="fa-solid fa-triangle-exclamation" style="color: var(--status-critical);"></i>
          <h4>Unable to load services</h4>
          <p>Please check your connection and try again.</p>
          <button class="btn btn-secondary" onclick="loadServices()"><i class="fa-solid fa-rotate"></i> Retry</button>
        </div>
      </div>
    `;
  }
}

// Save Service Details (Creates or updates service)
async function handleSaveService(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const id = document.getElementById('service-id-field').value;
  const service_name = document.getElementById('service-name-field').value.trim();
  const description = document.getElementById('service-desc-field').value.trim();
  const status = document.getElementById('service-status-field').value;

  if (!service_name) {
    showToast('Please enter a service name.', 'error');
    return;
  }

  const url = id ? `/services/${id}` : `/services`;
  const method = id ? 'PUT' : 'POST';

  setButtonLoading(submitBtn, true, 'Saving Service...');

  try {
    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_name, description, status })
    });

    if (res.ok) {
      showToast(id ? 'Service updated successfully' : 'New Service added dynamically!', 'success');
      closeModal('modal-service');
      // Refresh options dynamically
      await fetchGlobalFilters();
      loadServices();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to save service', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to save service details.', 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// Delete Service
async function handleDeleteService(id, name) {
  if (!confirm(`Are you sure you want to delete the Operational Service "${name}"? Documents linked to this service might lose their binding.`)) {
    return;
  }

  try {
    const res = await fetchWithAuth(`/services/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      showToast(`Service deleted successfully`, 'success');
      await fetchGlobalFilters();
      loadServices();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to delete service', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Connection error during deletion.', 'error');
  }
}

// Open Edit Modal Helper
function openEditServiceModal(id, name, desc, status) {
  document.getElementById('service-id-field').value = id;
  document.getElementById('service-name-field').value = name;
  document.getElementById('service-desc-field').value = desc;
  document.getElementById('service-status-field').value = status;
  document.getElementById('service-modal-title').innerText = 'Edit Service Details';
  openModal('modal-service');
}

// ==========================================================================
// SCREEN 4b: USER ACCOUNT MANAGEMENT
// ==========================================================================
async function loadUsers() {
  const tbody = document.getElementById('users-list');
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center" style="padding: 30px;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 20px; color: var(--primary-cyan); margin-bottom: 8px;"></i>
        <div class="text-muted">Loading user accounts...</div>
      </td>
    </tr>
  `;

  try {
    const res = await fetchWithAuth('/users');
    cachedUsers = await res.json();
    renderFilteredUsers();
  } catch (err) {
    console.error('Error loading users list:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state-card">
            <i class="fa-solid fa-triangle-exclamation" style="color: var(--status-critical);"></i>
            <h4>Unable to load users</h4>
            <p>Please check your connection and try again.</p>
            <button class="btn btn-secondary" onclick="loadUsers()"><i class="fa-solid fa-rotate"></i> Retry</button>
          </div>
        </td>
      </tr>
    `;
  }
}

function renderFilteredUsers() {
  const search = (document.getElementById('user-search-input')?.value || '').trim().toLowerCase();
  const tbody = document.getElementById('users-list');
  if (!tbody) return;
  tbody.innerHTML = '';

  let users = cachedUsers || [];
  if (search) {
    users = users.filter(u => 
      (u.name && u.name.toLowerCase().includes(search)) ||
      (u.email && u.email.toLowerCase().includes(search)) ||
      (u.role && u.role.toLowerCase().includes(search))
    );
  }

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state-card">
            <i class="fa-solid ${search ? 'fa-user-slash' : 'fa-users'}"></i>
            <h4>${search ? 'No matching users found' : 'No user accounts found'}</h4>
            <p>${search ? 'Try adjusting your search query.' : 'Click "Add User" above to create user accounts.'}</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  users.forEach(u => {
    const tr = document.createElement('tr');
    const formattedDate = new Date(u.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const roleBadge = u.role === 'Admin' ? 'badge-approved' : 'badge-active';

    let actions = '';
    if (currentUser && currentUser.id !== u.id) {
      actions = `
        <button class="btn btn-danger btn-icon" onclick="handleDeleteUser(${u.id}, '${escapeQuote(u.name)}')" title="Delete User Account">
          <i class="fa-solid fa-user-minus"></i>
        </button>
      `;
    } else {
      actions = `<span class="text-muted" style="font-size:11px;">(Current User)</span>`;
    }

    tr.innerHTML = `
      <td><code class="text-muted">#${u.id}</code></td>
      <td><strong>${escapeHtml(u.name)}</strong></td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="badge ${roleBadge}">${escapeHtml(u.role)}</span></td>
      <td>${formattedDate}</td>
      <td class="text-right">${actions}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function handleCreateUser(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const name = document.getElementById('user-name').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const password = document.getElementById('user-password').value;
  const role = document.getElementById('user-role').value;

  if (!name) {
    showToast('Please enter user name.', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  if (!password || password.length < 4) {
    showToast('Password must be at least 4 characters long.', 'error');
    return;
  }

  setButtonLoading(submitBtn, true, 'Creating User...');

  try {
    const res = await fetchWithAuth('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    if (res.ok) {
      showToast(`User account created for ${name}`, 'success');
      closeModal('modal-add-user');
      document.getElementById('add-user-form').reset();
      loadUsers();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to create user account', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to create user account.', 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function handleDeleteUser(id, name) {
  if (!confirm(`Are you sure you want to delete the user account for "${name}"?`)) {
    return;
  }

  try {
    const res = await fetchWithAuth(`/users/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      showToast(`User account deleted successfully`, 'success');
      loadUsers();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to delete user', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Connection error during user deletion.', 'error');
  }
}

// ==========================================================================
// SCREEN 5: AUDIT TRAIL LOGS
// ==========================================================================
async function loadLogs() {
  const tbody = document.getElementById('logs-list');
  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center" style="padding: 30px;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 20px; color: var(--primary-cyan); margin-bottom: 8px;"></i>
        <div class="text-muted">Loading audit logs...</div>
      </td>
    </tr>
  `;

  try {
    const res = await fetchWithAuth('/logs');
    cachedLogs = await res.json();
    renderFilteredLogs();
  } catch (err) {
    console.error('Error loading activity logs:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state-card">
            <i class="fa-solid fa-triangle-exclamation" style="color: var(--status-critical);"></i>
            <h4>Unable to load audit logs</h4>
            <p>Please check your connection and try again.</p>
            <button class="btn btn-secondary" onclick="loadLogs()"><i class="fa-solid fa-rotate"></i> Retry</button>
          </div>
        </td>
      </tr>
    `;
  }
}

function renderFilteredLogs() {
  const search = (document.getElementById('log-search-input')?.value || '').trim().toLowerCase();
  const tbody = document.getElementById('logs-list');
  tbody.innerHTML = '';

  let logs = cachedLogs || [];
  if (search) {
    logs = logs.filter(l =>
      (l.action && l.action.toLowerCase().includes(search)) ||
      (l.user_name && l.user_name.toLowerCase().includes(search)) ||
      (l.user_email && l.user_email.toLowerCase().includes(search)) ||
      (l.reference_id && String(l.reference_id).toLowerCase().includes(search))
    );
  }

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state-card">
            <i class="fa-solid ${search ? 'fa-filter-circle-xmark' : 'fa-clipboard-list'}"></i>
            <h4>${search ? 'No matching audit records found' : 'No activities logged yet'}</h4>
            <p>${search ? 'Try adjusting your search query.' : 'System operations and user actions will be recorded here.'}</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  logs.forEach(log => {
    const tr = document.createElement('tr');
    const time = new Date(log.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    tr.innerHTML = `
      <td><code class="text-muted">${time}</code></td>
      <td><strong>${escapeHtml(log.user_name || 'System')}</strong> <br><span class="text-muted" style="font-size:10px;">${escapeHtml(log.user_email || '')}</span></td>
      <td>${escapeHtml(log.action)}</td>
      <td><code style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">${escapeHtml(String(log.reference_id || 'N/A'))}</code></td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================================================
// FILE PREVIEWERS (PDF IFRAME & VIDEO EMBED TRANSFORMS)
// ==========================================================================
function previewPdf(filePath, title) {
  document.getElementById('pdf-viewer-title').innerText = title;
  document.getElementById('pdf-viewer-frame').src = filePath;
  openModal('modal-pdf-viewer');
}

function playVideo(url, title) {
  document.getElementById('video-viewer-title').innerText = title;
  const linkBtn = document.getElementById('video-viewer-external-link');
  if (linkBtn) linkBtn.href = url || '#';

  const container = document.getElementById('video-viewer-player-container');
  container.innerHTML = '';

  // Transform YouTube URL to embed (using youtube-nocookie.com for high compatibility)
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url ? url.match(ytRegex) : null;

  if (match) {
    const videoId = match[1];
    container.innerHTML = `
      <iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    `;
  } else {
    // Treat as raw video mp4/webm stream
    container.innerHTML = `
      <video src="${url}" controls autoplay class="native-player"></video>
    `;
  }

  openModal('modal-video-viewer');
}

// Stop video from playing in background on close
document.getElementById('btn-close-video-viewer').addEventListener('click', () => {
  document.getElementById('video-viewer-player-container').innerHTML = '';
});

// ==========================================================================
// DATA EXPORT ENGINE (CSV)
// ==========================================================================
function exportToCSV(filename, headers, dataRows) {
  if (!dataRows || dataRows.length === 0) {
    showToast('No records available to export.', 'info');
    return;
  }
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  csvContent += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\r\n';

  dataRows.forEach(row => {
    const line = row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',');
    csvContent += line + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Successfully exported ${dataRows.length} record(s) to ${filename}`, 'success');
}

async function exportSOPsCSV() {
  const btn = document.getElementById('btn-export-sops-csv');
  setButtonLoading(btn, true, 'Exporting...');
  try {
    const res = await fetchWithAuth('/sops');
    const sops = await res.json();
    if (!sops || sops.length === 0) {
      showToast('No SOP records available to export.', 'info');
      return;
    }
    const headers = ['SOP ID', 'Title', 'Service Name', 'Category Name', 'Created At'];
    const rows = sops.map(s => [s.id, s.title, s.service_name, s.category_name, s.created_at]);
    exportToCSV(`OceanServices_SOPs_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  } catch (err) {
    showToast('Failed to export SOPs list.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function exportMediaCSV() {
  const btn = document.getElementById('btn-export-docs-csv');
  setButtonLoading(btn, true, 'Exporting...');
  try {
    const res = await fetchWithAuth('/documents');
    const docs = await res.json();
    if (!docs || docs.length === 0) {
      showToast('No media records available to export.', 'info');
      return;
    }
    const headers = ['Document ID', 'Format Type', 'Title', 'Service Name', 'Category Name', 'Tags', 'Created At'];
    const rows = docs.map(d => [d.id, d.type, d.title, d.service_name, d.category_name, d.tags || '', d.created_at]);
    exportToCSV(`OceanServices_MediaLibrary_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  } catch (err) {
    showToast('Failed to export media library.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function exportLogsCSV() {
  const btn = document.getElementById('btn-export-logs-csv');
  setButtonLoading(btn, true, 'Exporting...');
  try {
    const res = await fetchWithAuth('/logs');
    const logs = await res.json();
    if (!logs || logs.length === 0) {
      showToast('No audit logs available to export.', 'info');
      return;
    }
    const headers = ['Log ID', 'Timestamp', 'User ID', 'User Name', 'User Email', 'Action', 'Reference ID'];
    const rows = logs.map(l => [l.id, l.timestamp, l.user_id, l.user_name || 'System', l.user_email || '', l.action, l.reference_id || 'N/A']);
    exportToCSV(`OceanServices_AuditLogs_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  } catch (err) {
    showToast('Failed to export audit logs.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ==========================================================================
// GLOBAL UI UTILITY METHODS
// ==========================================================================
// Animate numeric count up for stat elements
function animateCount(el, target, duration = 800) {
  if (!el) return;
  const start = 0;
  const end = Number(target) || 0;
  const range = end - start;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(start + range * progress);
    el.innerText = value;
    if (progress < 1) requestAnimationFrame(step);
    else el.innerText = end;
  }
  requestAnimationFrame(step);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active-modal');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active-modal');
  }
  // Clear any active sources on close
  if (modalId === 'modal-pdf-viewer') {
    document.getElementById('pdf-viewer-frame').src = '';
  }
}

// HTML escape helper to prevent XSS
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Escape quotes in onclick inline functions
function escapeQuote(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/'/g, "\\'");
}

// Toast Alert System with guaranteed timeout removal and close button
function showToast(message, type = 'info', options = {}) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconMarkup = `<i class="fa-solid fa-circle-info"></i>`;
  if (type === 'success') {
    iconMarkup = `<i class="fa-solid fa-circle-check"></i>`;
  } else if (type === 'error') {
    iconMarkup = `<i class="fa-solid fa-circle-exclamation"></i>`;
  } else if (type === 'warning') {
    iconMarkup = `<i class="fa-solid fa-triangle-exclamation"></i>`;
  }

  toast.innerHTML = `
    ${iconMarkup}
    <span class="toast-message-text">${escapeHtml(message)}</span>
    <button type="button" class="toast-close-btn" aria-label="Dismiss notification">&times;</button>
  `;

  // Attach manual dismiss listener
  const closeBtn = toast.querySelector('.toast-close-btn');
  closeBtn.addEventListener('click', () => {
    dismissToast(toast);
  });

  container.appendChild(toast);

  // Auto dismiss after 3.8s
  const autoDismissTimer = setTimeout(() => {
    dismissToast(toast);
  }, 3800);

  // Pause on hover
  toast.addEventListener('mouseenter', () => {
    clearTimeout(autoDismissTimer);
  });
  toast.addEventListener('mouseleave', () => {
    setTimeout(() => dismissToast(toast), 1500);
  });
}

function dismissToast(toastEl) {
  if (!toastEl || toastEl.classList.contains('toast-hiding')) return;
  toastEl.classList.add('toast-hiding');
  setTimeout(() => {
    if (toastEl.parentNode) {
      toastEl.remove();
    }
  }, 280);
}

// Debounce helper for instant searches
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Command Palette Search Engine
async function openCommandPalette() {
  openModal('modal-command-palette');
  const input = document.getElementById('cmd-palette-input');
  input.value = '';
  input.focus();
  handleCommandPaletteSearch('');
}

async function handleCommandPaletteSearch(query) {
  const container = document.getElementById('cmd-palette-results');
  const term = query.trim().toLowerCase();

  if (!term) {
    container.innerHTML = `
      <div class="cmd-item-placeholder">
        <i class="fa-solid fa-compass text-muted"></i>
        <p class="text-muted">Type to search SOPs, Media Assets, Services, or Users...</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="cmd-item-placeholder"><p class="text-muted">Searching resources...</p></div>`;

  try {
    const [sopRes, docRes, servRes] = await Promise.all([
      fetchWithAuth('/sops'),
      fetchWithAuth('/documents'),
      fetchWithAuth('/services')
    ]);

    const sops = await sopRes.json();
    const docs = await docRes.json();
    const services = await servRes.json();

    const results = [];

    // Filter SOPs
    sops.forEach(sop => {
      if (sop.title.toLowerCase().includes(term) || (sop.service_name && sop.service_name.toLowerCase().includes(term))) {
        results.push({
          type: 'SOP',
          title: sop.title,
          subtitle: `Service: ${sop.service_name || 'General'} | Version: ${sop.latest_version || '1.0'}`,
          icon: 'fa-book-bookmark',
          action: () => {
            closeModal('modal-command-palette');
            navigateToScreen('sops');
            document.getElementById('sop-search-input').value = sop.title;
            loadSOPs();
          }
        });
      }
    });

    // Filter Documents
    docs.forEach(doc => {
      if (doc.title.toLowerCase().includes(term) || (doc.tags && doc.tags.toLowerCase().includes(term))) {
        results.push({
          type: doc.type === 'VIDEO' ? 'VIDEO' : 'DOCUMENT',
          title: doc.title,
          subtitle: `Category: ${doc.category_name || 'General'} | Format: ${doc.type}`,
          icon: doc.type === 'VIDEO' ? 'fa-video' : 'fa-file-pdf',
          action: () => {
            closeModal('modal-command-palette');
            navigateToScreen('documents');
            document.getElementById('doc-search-input').value = doc.title;
            loadDocuments();
          }
        });
      }
    });

    // Filter Services
    services.forEach(serv => {
      if (serv.service_name.toLowerCase().includes(term) || (serv.description && serv.description.toLowerCase().includes(term))) {
        results.push({
          type: 'SERVICE',
          title: serv.service_name,
          subtitle: serv.description || 'Operational Module',
          icon: 'fa-sliders',
          action: () => {
            closeModal('modal-command-palette');
            navigateToScreen('services');
          }
        });
      }
    });

    if (results.length === 0) {
      container.innerHTML = `
        <div class="cmd-item-placeholder">
          <i class="fa-solid fa-magnifying-glass text-muted"></i>
          <p class="text-muted">No matching SOPs, documents, or services found for "${escapeHtml(query)}"</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    results.slice(0, 8).forEach(res => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cmd-result-item';
      itemEl.innerHTML = `
        <div class="cmd-item-icon"><i class="fa-solid ${res.icon}"></i></div>
        <div class="cmd-item-info">
          <h5>${escapeHtml(res.title)}</h5>
          <p>${escapeHtml(res.subtitle)}</p>
        </div>
        <span class="cmd-item-type">${res.type}</span>
      `;
      itemEl.addEventListener('click', res.action);
      container.appendChild(itemEl);
    });

  } catch (err) {
    console.error('Command palette search error:', err);
    container.innerHTML = `<div class="cmd-item-placeholder"><p class="text-muted">Error searching resources.</p></div>`;
  }
}
