/* ==========================================================================
   DevinWu Personal Blog Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const postsGrid = document.getElementById('postsGrid');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const tagsContainer = document.getElementById('tagsContainer');
  const resultsCount = document.getElementById('resultsCount');
  const articleModal = document.getElementById('articleModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const articleDetailContent = document.getElementById('articleDetailContent');

  let allPosts = [];
  let currentTag = 'all';
  let searchQuery = '';

  // Theme Management
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.className = `${savedTheme}-theme`;

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    document.body.className = `${newTheme}-theme`;
    localStorage.setItem('theme', newTheme);
  });

  // Fetch Posts Metadata
  fetch('data/posts.json')
    .then(res => res.json())
    .then(data => {
      allPosts = data;
      renderTagPills();
      filterAndRenderPosts();
      checkUrlHash();
    })
    .catch(err => {
      console.error('Error loading posts data:', err);
      postsGrid.innerHTML = `
        <div class="loading-state">
          <p style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load articles.</p>
        </div>
      `;
    });

  // Render Unique Tags
  function renderTagPills() {
    const tagsSet = new Set();
    allPosts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(t => tagsSet.add(t));
      }
    });

    const tagsArray = Array.from(tagsSet).sort();
    
    let html = `<button class="tag-pill ${currentTag === 'all' ? 'active' : ''}" data-tag="all">All Topics</button>`;
    tagsArray.forEach(tag => {
      html += `<button class="tag-pill ${currentTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</button>`;
    });

    tagsContainer.innerHTML = html;

    // Attach Event Listeners to Tags
    tagsContainer.querySelectorAll('.tag-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        tagsContainer.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTag = btn.getAttribute('data-tag');
        filterAndRenderPosts();
      });
    });
  }

  // Filter & Render Posts
  function filterAndRenderPosts() {
    const filtered = allPosts.filter(post => {
      const matchesTag = currentTag === 'all' || (post.tags && post.tags.includes(currentTag));
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        post.title.toLowerCase().includes(q) || 
        post.summary.toLowerCase().includes(q) ||
        (post.tags && post.tags.some(t => t.toLowerCase().includes(q)));
      
      return matchesTag && matchesSearch;
    });

    resultsCount.textContent = `Showing ${filtered.length} article${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      postsGrid.innerHTML = `
        <div class="loading-state">
          <p><i class="fa-solid fa-folder-open"></i> No matching articles found.</p>
        </div>
      `;
      return;
    }

    postsGrid.innerHTML = filtered.map(post => `
      <div class="post-card" data-slug="${post.slug}" data-file="${post.file}">
        <div class="post-cover-wrapper">
          <img src="${post.cover}" alt="${post.title}" class="post-cover-img" loading="lazy">
        </div>
        <div class="post-card-body">
          <div class="post-meta-row">
            <span><i class="fa-regular fa-calendar"></i> ${formatDate(post.date)}</span>
            <span><i class="fa-regular fa-clock"></i> ${post.readTime || '5 min read'}</span>
          </div>
          <div class="post-tags" style="margin-bottom: 0.6rem;">
            ${(post.tags || []).map(t => `<span class="card-tag">${t}</span>`).join('')}
          </div>
          <h3 class="post-title">${post.title}</h3>
          <p class="post-summary">${post.summary}</p>
          <div class="post-card-footer">
            <span>By DevinWu</span>
            <span class="read-more-link">Read Article <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>
      </div>
    `).join('');

    // Attach Click Event to Cards
    postsGrid.querySelectorAll('.post-card').forEach(card => {
      card.addEventListener('click', () => {
        const file = card.getAttribute('data-file');
        const slug = card.getAttribute('data-slug');
        openArticleModal(file, slug);
      });
    });
  }

  // Search Input Handler
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    filterAndRenderPosts();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    filterAndRenderPosts();
  });

  // Open Article Detail Modal
  function openArticleModal(filePath, slug) {
    articleDetailContent.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading article content...</p>
      </div>
    `;
    articleModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    window.location.hash = slug;

    fetch(filePath)
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.text();
      })
      .then(mdText => {
        // Strip Frontmatter
        const cleanMd = mdText.replace(/^---[\s\S]*?---\n/, '');
        const postMeta = allPosts.find(p => p.slug === slug);
        
        let headerHtml = '';
        if (postMeta) {
          headerHtml = `
            <div class="article-header-meta">
              <span><i class="fa-regular fa-calendar"></i> ${formatDate(postMeta.date)}</span>
              <span><i class="fa-regular fa-clock"></i> ${postMeta.readTime}</span>
              <span><i class="fa-regular fa-user"></i> DevinWu</span>
            </div>
          `;
        }

        const parsedHtml = marked.parse(cleanMd);
        articleDetailContent.innerHTML = headerHtml + parsedHtml;

        // Apply syntax highlighting
        articleDetailContent.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      })
      .catch(err => {
        articleDetailContent.innerHTML = `
          <div style="text-align: center; padding: 3rem 0; color: #ef4444;">
            <h3>Failed to load article content.</h3>
            <p>${err.message}</p>
          </div>
        `;
      });
  }

  // Close Article Modal
  function closeModal() {
    articleModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }

  closeModalBtn.addEventListener('click', closeModal);
  articleModal.addEventListener('click', (e) => {
    if (e.target === articleModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && articleModal.classList.contains('active')) {
      closeModal();
    }
  });

  // URL Hash Navigation (#slug)
  function checkUrlHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
      const match = allPosts.find(p => p.slug === hash);
      if (match) {
        openArticleModal(match.file, match.slug);
      }
    }
  }

  // Helper Date Formatter
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
});
