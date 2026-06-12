// ==========================================================================
// CORE FRONTEND ENGINE - SINGLE PAGE APPLICATION (SPA)
// ==========================================================================

const API_BASE = '/api';
let token = localStorage.getItem('auth_token');
let currentUser = null;

// Global Cached Data to optimize filter loadings
let cachedServices = [];
let cachedCategories = [];

// ==========================================================================
// BOOTSTRAP & INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuthentication();
});

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
      // Session invalid or expired
      logout();
    }
  } catch (err) {
    console.error('Session validation error:', err);
    showToast('Failed to connect to authentication server. Operating in offline/cached view.', 'error');
    // Clear token as fallback
    logout();
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

  // Filters Event Listeners (Triggers instant reload)
  document.getElementById('sop-search-input').addEventListener('input', debounce(loadSOPs, 300));
  document.getElementById('sop-filter-service').addEventListener('change', loadSOPs);
  document.getElementById('sop-filter-category').addEventListener('change', loadSOPs);

  document.getElementById('doc-search-input').addEventListener('input', debounce(loadDocuments, 300));
  document.getElementById('doc-filter-service').addEventListener('change', loadDocuments);
  document.getElementById('doc-filter-category').addEventListener('change', loadDocuments);
  document.getElementById('doc-filter-type').addEventListener('change', loadDocuments);

  // Visual file name changes for drop zones
  document.getElementById('version-file').addEventListener('change', (e) => {
    const name = e.target.files[0] ? e.target.files[0].name : 'Choose a PDF document file';
    document.querySelector('.file-message').innerText = name;
  });
  
  document.getElementById('doc-pdf-file').addEventListener('change', (e) => {
    const name = e.target.files[0] ? e.target.files[0].name : 'Choose a PDF document file';
    document.querySelector('.doc-file-message').innerText = name;
  });

  // Set real date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('header-date').innerText = new Date().toLocaleDateString('en-US', options);
}

// Setup automatic modal closer utility
function setupModalCloser(btnId, modalId) {
  document.getElementById(btnId).addEventListener('click', () => {
    closeModal(modalId);
  });
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
    case 'logs':
      loadLogs();
      break;
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

// Logout handler
async function logout() {
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.log('Logout API connection error');
    }
  }

  localStorage.removeItem('auth_token');
  token = null;
  currentUser = null;
  
  // Toggle screens
  document.getElementById('app-container').classList.remove('active-app');
  document.getElementById('login-screen').classList.add('active-screen');
}

// Handle Login Submission
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('auth_token', token);
      showToast('Authentication Successful!', 'success');
      initializeApplication();
    } else {
      showToast(data.error || 'Authentication Failed', 'error');
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('Failed to connect to authentication server.', 'error');
  }
}

// ==========================================================================
// SCREEN 1: DASHBOARD LOADER
// ==========================================================================
async function loadDashboard() {
  try {
    const res = await fetchWithAuth('/dashboard');
    const data = await res.json();

    // Set counts
    document.getElementById('stat-total-docs').innerText = data.totalDocsCount;
    document.getElementById('stat-total-sops').innerText = data.sopCount;
    document.getElementById('stat-total-services').innerText = data.distribution.length;

    // Render Progress Bars for distribution
    const progressContainer = document.getElementById('custom-distribution-bars');
    progressContainer.innerHTML = '';

    if (data.distribution.length === 0) {
      progressContainer.innerHTML = `<p class="text-center text-muted">No operational services mapped yet.</p>`;
    } else {
      // Sort distribution descending
      data.distribution.sort((a, b) => b.count - a.count);
      
      const maxCount = Math.max(...data.distribution.map(d => d.count)) || 1;

      data.distribution.forEach(dist => {
        const percentage = (dist.count / maxCount) * 100;
        
        const group = document.createElement('div');
        group.className = 'progress-bar-group';
        group.innerHTML = `
          <div class="progress-labels">
            <span class="service-name">${dist.name}</span>
            <span class="asset-count">${dist.count} asset(s)</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
        `;
        progressContainer.appendChild(group);
      });
    }

    // Render Recent releases Table
    const recentBody = document.getElementById('recent-uploads-list');
    recentBody.innerHTML = '';

    if (data.recentUploads.length === 0) {
      recentBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No releases recorded yet.</td></tr>`;
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
          <td><span class="badge ${badgeClass}">${asset.type}</span></td>
          <td>${asset.source}</td>
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
  const search = document.getElementById('sop-search-input').value;
  const serviceId = document.getElementById('sop-filter-service').value;
  const categoryId = document.getElementById('sop-filter-category').value;

  try {
    let url = `/sops`;
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await fetchWithAuth(url);
    let sops = await res.json();

    // Client-side filtering for service and category to keep query simple
    if (serviceId) {
      sops = sops.filter(s => s.service_id == serviceId);
    }
    if (categoryId) {
      sops = sops.filter(s => s.category_id == categoryId);
    }

    const tbody = document.getElementById('sop-list');
    tbody.innerHTML = '';

    if (sops.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No SOP records found. Try adjusting filters or create a new SOP.</td></tr>`;
      return;
    }

    // Render SOPs rows
    for (const sop of sops) {
      const tr = document.createElement('tr');
      
      // Fetch latest version info
      const verRes = await fetchWithAuth(`/sops/${sop.id}/versions`);
      const versions = await verRes.json();
      const latestVer = versions[0]; // ordered desc, so first is latest

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
        <td>${sop.service_name}</td>
        <td>${sop.category_name}</td>
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
  }
}

// Master SOP Creation Form Submission
async function handleCreateSop(e) {
  e.preventDefault();
  const title = document.getElementById('sop-title').value;
  const service_id = document.getElementById('sop-service').value;
  const category_id = document.getElementById('sop-category').value;

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
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No historical releases available.</td></tr>`;
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
      if (currentUser.role === 'Admin') {
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
          <button class="btn btn-secondary btn-icon" style="width:26px; height:26px;" onclick="previewPdf('${v.file_path}', 'Version ${v.version_no}')">
            <i class="fa-solid fa-file-pdf"></i>
          </button>
        </td>
        <td class="admin-only text-right">${adminActions}</td>
      `;
      tbody.appendChild(tr);
    });

    // Refresh UI elements visibility for admin columns
    if (currentUser.role === 'Admin') {
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
  const sopId = document.getElementById('version-sop-id').value;
  const versionNo = document.getElementById('version-number').value;
  const status = document.getElementById('version-status').value;
  const fileInput = document.getElementById('version-file');

  if (fileInput.files.length === 0) {
    showToast('Please select a PDF file first.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('version_no', versionNo);
  formData.append('status', status);
  formData.append('pdf_file', fileInput.files[0]);

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
  const search = document.getElementById('doc-search-input').value;
  const serviceId = document.getElementById('doc-filter-service').value;
  const categoryId = document.getElementById('doc-filter-category').value;
  const type = document.getElementById('doc-filter-type').value;

  try {
    let url = `/documents?`;
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (serviceId) params.push(`service_id=${serviceId}`);
    if (categoryId) params.push(`category_id=${categoryId}`);
    if (type) params.push(`type=${type}`);

    url += params.join('&');

    const res = await fetchWithAuth(url);
    const documents = await res.json();

    const grid = document.getElementById('documents-grid-container');
    const emptyMsg = document.getElementById('no-docs-message');
    grid.innerHTML = '';

    if (documents.length === 0) {
      grid.style.display = 'none';
      emptyMsg.style.display = 'block';
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
          <span class="badge badge-active">${escapeHtml(doc.category_name)}</span>
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
            <span class="text-muted" style="font-size:10px;">${escapeHtml(doc.service_name)}</span>
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
  }
}

// Add General Media Asset
async function handleAddDoc(e) {
  e.preventDefault();
  const format = document.querySelector('input[name="doc_type"]:checked').value;
  const title = document.getElementById('doc-title').value;
  const description = document.getElementById('doc-description').value;
  const service_id = document.getElementById('doc-service').value;
  const category_id = document.getElementById('doc-category').value;
  const tags = document.getElementById('doc-tags').value;
  
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
    formData.append('pdf_file', fileInput.files[0]);
  } else {
    const videoUrl = document.getElementById('doc-video-url').value;
    if (!videoUrl) {
      showToast('Please enter a video URL stream link.', 'error');
      return;
    }
    formData.append('video_url', videoUrl);
  }

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
  }
}

// ==========================================================================
// SCREEN 4: SERVICE DIRECTORY MANAGER
// ==========================================================================
async function loadServices() {
  try {
    const res = await fetchWithAuth('/services');
    const services = await res.json();

    const grid = document.getElementById('services-admin-container');
    grid.innerHTML = '';

    services.forEach(svc => {
      const card = document.createElement('div');
      card.className = 'service-admin-card glass-panel';

      const statusBadgeClass = svc.status === 'Active' ? 'badge-active' : 'badge-inactive';

      card.innerHTML = `
        <div class="service-card-top">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <h3>${escapeHtml(svc.service_name)}</h3>
            <span class="badge ${statusBadgeClass}">${svc.status}</span>
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
  }
}

// Save Service Details (Creates or updates service)
async function handleSaveService(e) {
  e.preventDefault();
  const id = document.getElementById('service-id-field').value;
  const service_name = document.getElementById('service-name-field').value;
  const description = document.getElementById('service-desc-field').value;
  const status = document.getElementById('service-status-field').value;

  const url = id ? `/services/${id}` : `/services`;
  const method = id ? 'PUT' : 'POST';

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
// SCREEN 5: AUDIT TRAIL LOGS
// ==========================================================================
async function loadLogs() {
  try {
    const res = await fetchWithAuth('/logs');
    const logs = await res.json();

    const tbody = document.getElementById('logs-list');
    tbody.innerHTML = '';

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No activities logged yet.</td></tr>`;
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
        <td><code style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">${log.reference_id || 'N/A'}</code></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading activity logs:', err);
  }
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
  const container = document.getElementById('video-viewer-player-container');
  container.innerHTML = '';

  // Transform YouTube URL to embed
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(ytRegex);

  if (match) {
    const videoId = match[1];
    container.innerHTML = `
      <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
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
// GLOBAL UI UTILITY METHODS
// ==========================================================================
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active-modal');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active-modal');
  // Clear any active sources on close
  if (modalId === 'modal-pdf-viewer') {
    document.getElementById('pdf-viewer-frame').src = '';
  }
}

// HTML escape helper to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Escape quotes in onclick inline functions
function escapeQuote(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'");
}

// Toast Alert System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-info-circle';
  if (type === 'success') iconClass = 'fa-check-circle';
  if (type === 'error') iconClass = 'fa-times-circle';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Automatically fade out and remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
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
