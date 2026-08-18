/* ==========================================================================
   DevinWu Personal Blog Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const articleModal = document.getElementById('articleModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const articleDetailContent = document.getElementById('articleDetailContent');
  const readingProgressBar = document.getElementById('readingProgressBar');

  // Section Management
  const articlesSection = document.getElementById('articlesSection');
  const papersSection = document.getElementById('papersSection');
  const navArticles = document.getElementById('navArticles');
  const navPapers = document.getElementById('navPapers');
  const navHome = document.getElementById('navHome');

  // Articles Elements
  const postsGrid = document.getElementById('postsGrid');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const tagsContainer = document.getElementById('tagsContainer');
  const resultsCount = document.getElementById('resultsCount');

  // Papers Elements
  const papersGrid = document.getElementById('papersGrid');
  const paperSearchInput = document.getElementById('paperSearchInput');
  const clearPaperSearchBtn = document.getElementById('clearPaperSearchBtn');
  const paperTagsContainer = document.getElementById('paperTagsContainer');
  const paperResultsCount = document.getElementById('paperResultsCount');

  let allPosts = [];
  let allPapers = [];
  let currentSection = 'articles';
  let currentArticleTag = 'all';
  let currentPaperTag = 'all';
  let searchQuery = '';
  let paperSearchQuery = '';

  // Theme Management
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.className = `${savedTheme}-theme`;

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    document.body.className = `${newTheme}-theme`;
    localStorage.setItem('theme', newTheme);
  });

  // Section Navigation
  const sidebarHome = document.getElementById('sidebarHome');
  const sidebarArticles = document.getElementById('sidebarArticles');
  const sidebarPapers = document.getElementById('sidebarPapers');
  const sidebarThemeBtn = document.getElementById('sidebarThemeBtn');

  navHome.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('home');
  });

  navArticles.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('articles');
  });

  navPapers.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('papers');
  });

  // Sidebar navigation
  if (sidebarHome) {
    sidebarHome.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('home');
    });
  }

  if (sidebarArticles) {
    sidebarArticles.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('articles');
    });
  }

  if (sidebarPapers) {
    sidebarPapers.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('papers');
    });
  }

  if (sidebarThemeBtn) {
    sidebarThemeBtn.addEventListener('click', () => {
      themeToggleBtn.click();
    });
  }

  function showSection(section) {
    currentSection = section;

    // Update top nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));

    if (section === 'home') {
      navHome.classList.add('active');
      if (sidebarHome) sidebarHome.classList.add('active');
      articlesSection.style.display = 'none';
      papersSection.style.display = 'none';
    } else if (section === 'articles') {
      navArticles.classList.add('active');
      if (sidebarArticles) sidebarArticles.classList.add('active');
      articlesSection.style.display = 'block';
      papersSection.style.display = 'none';
    } else if (section === 'papers') {
      navPapers.classList.add('active');
      if (sidebarPapers) sidebarPapers.classList.add('active');
      articlesSection.style.display = 'none';
      papersSection.style.display = 'block';
    }
  }

  // Fetch Posts Metadata
  Promise.all([
    fetch('data/posts.json').then(res => res.json()).catch(() => []),
    fetch('data/papers.json').then(res => res.json()).catch(() => [])
  ]).then(([posts, papers]) => {
    allPosts = posts;
    allPapers = papers;

    renderArticles();
    renderPapers();
    checkUrlHash();
  }).catch(err => {
    console.error('Error loading data:', err);
    postsGrid.innerHTML = `
      <div class="loading-state">
        <p style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load articles.</p>
      </div>
    `;
  });

  // ============ ARTICLES SECTION ============

  function renderArticles() {
    renderArticleTagPills();
    filterAndRenderArticles();
  }

  function renderArticleTagPills() {
    const tagsSet = new Set();
    allPosts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(t => tagsSet.add(t));
      }
    });

    const tagsArray = Array.from(tagsSet).sort();

    let html = `<button class="tag-pill ${currentArticleTag === 'all' ? 'active' : ''}" data-tag="all">All Topics</button>`;
    tagsArray.forEach(tag => {
      html += `<button class="tag-pill ${currentArticleTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</button>`;
    });

    tagsContainer.innerHTML = html;

    tagsContainer.querySelectorAll('.tag-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        tagsContainer.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentArticleTag = btn.getAttribute('data-tag');
        filterAndRenderArticles();
      });
    });
  }

  function filterAndRenderArticles() {
    const filtered = allPosts.filter(post => {
      const matchesTag = currentArticleTag === 'all' || (post.tags && post.tags.includes(currentArticleTag));
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

    postsGrid.querySelectorAll('.post-card').forEach(card => {
      card.addEventListener('click', () => {
        const file = card.getAttribute('data-file');
        const slug = card.getAttribute('data-slug');
        openArticleModal(file, slug);
      });
    });
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    filterAndRenderArticles();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    filterAndRenderArticles();
  });

  // ============ PAPERS SECTION ============

  function renderPapers() {
    renderPaperTagPills();
    filterAndRenderPapers();
  }

  function renderPaperTagPills() {
    const tagsSet = new Set();
    allPapers.forEach(paper => {
      if (paper.tags) {
        paper.tags.forEach(t => tagsSet.add(t));
      }
    });

    const tagsArray = Array.from(tagsSet).sort();

    let html = `<button class="tag-pill ${currentPaperTag === 'all' ? 'active' : ''}" data-tag="all">All Topics</button>`;
    tagsArray.forEach(tag => {
      html += `<button class="tag-pill ${currentPaperTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</button>`;
    });

    paperTagsContainer.innerHTML = html;

    paperTagsContainer.querySelectorAll('.tag-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        paperTagsContainer.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPaperTag = btn.getAttribute('data-tag');
        filterAndRenderPapers();
      });
    });
  }

  function filterAndRenderPapers() {
    const filtered = allPapers.filter(paper => {
      const matchesTag = currentPaperTag === 'all' || (paper.tags && paper.tags.includes(currentPaperTag));
      const q = paperSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        paper.title.toLowerCase().includes(q) ||
        paper.summary.toLowerCase().includes(q) ||
        (paper.tags && paper.tags.some(t => t.toLowerCase().includes(q)));

      return matchesTag && matchesSearch;
    });

    paperResultsCount.textContent = `Showing ${filtered.length} paper${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      papersGrid.innerHTML = `
        <div class="loading-state">
          <p><i class="fa-solid fa-folder-open"></i> No matching papers found.</p>
        </div>
      `;
      return;
    }

    papersGrid.innerHTML = filtered.map(paper => `
      <div class="post-card" data-slug="${paper.slug}" data-file="${paper.file}">
        <div class="post-cover-wrapper">
          <img src="${paper.cover}" alt="${paper.title}" class="post-cover-img" loading="lazy">
        </div>
        <div class="post-card-body">
          <div class="post-meta-row">
            <span><i class="fa-solid fa-file"></i> ${paper.arxivId || 'Paper'}</span>
            <span><i class="fa-regular fa-clock"></i> ${paper.readTime || '10 min read'}</span>
          </div>
          <div class="post-tags" style="margin-bottom: 0.6rem;">
            ${(paper.tags || []).map(t => `<span class="card-tag">${t}</span>`).join('')}
          </div>
          <h3 class="post-title">${paper.title}</h3>
          <p class="post-summary">${paper.summary}</p>
          <div class="post-card-footer">
            <span>By DevinWu</span>
            <span class="read-more-link">Read Paper <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>
      </div>
    `).join('');

    papersGrid.querySelectorAll('.post-card').forEach(card => {
      card.addEventListener('click', () => {
        const file = card.getAttribute('data-file');
        const slug = card.getAttribute('data-slug');
        openArticleModal(file, slug);
      });
    });
  }

  paperSearchInput.addEventListener('input', (e) => {
    paperSearchQuery = e.target.value;
    clearPaperSearchBtn.style.display = paperSearchQuery ? 'block' : 'none';
    filterAndRenderPapers();
  });

  clearPaperSearchBtn.addEventListener('click', () => {
    paperSearchInput.value = '';
    paperSearchQuery = '';
    clearPaperSearchBtn.style.display = 'none';
    filterAndRenderPapers();
  });

  // ============ MODAL & NAVIGATION ============

  function openArticleModal(filePath, slug) {
    articleDetailContent.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading article content...</p>
      </div>
    `;
    articleModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    articleModal.scrollTop = 0;
    readingProgressBar.style.width = '0%';
    articleModal.addEventListener('scroll', updateReadingProgress);
    window.location.hash = slug;

    fetch(filePath)
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.text();
      })
      .then(mdText => {
        const cleanMd = mdText.replace(/^---[\s\S]*?---\n/, '');
        const postMeta = allPosts.find(p => p.slug === slug) || allPapers.find(p => p.slug === slug);

        let tagsHtml = '';
        if (postMeta && postMeta.tags && postMeta.tags.length > 0) {
          const tagsSection = document.getElementById('articleTagsSection');
          if (tagsSection) {
            tagsSection.style.display = 'flex';
            tagsSection.innerHTML = postMeta.tags.map(tag =>
              `<span class="article-tag">${tag}</span>`
            ).join('');
          }
        } else {
          const tagsSection = document.getElementById('articleTagsSection');
          if (tagsSection) {
            tagsSection.style.display = 'none';
          }
        }

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

        // Generate Table of Contents
        const headings = articleDetailContent.querySelectorAll('h2, h3');
        const tocNav = document.getElementById('tocNav');
        tocNav.innerHTML = '';

        if (headings.length > 0) {
          headings.forEach((heading, index) => {
            const id = `heading-${index}`;
            heading.id = id;

            const level = heading.tagName.toLowerCase() === 'h2' ? 0 : 1;
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = heading.textContent;
            link.style.marginLeft = `${level * 1}rem`;

            link.addEventListener('click', (e) => {
              e.preventDefault();
              heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            tocNav.appendChild(link);
          });
        }

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

  function updateReadingProgress() {
    const scrollTop = articleModal.scrollTop;
    const scrollHeight = articleModal.scrollHeight - articleModal.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    readingProgressBar.style.width = progress + '%';
  }

  function closeModal() {
    articleModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    readingProgressBar.style.width = '0%';
    articleModal.removeEventListener('scroll', updateReadingProgress);
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

  // Article action buttons
  const likeBtn = document.getElementById('likeBtn');
  const shareBtn = document.getElementById('shareBtn');
  const bookmarkBtn = document.getElementById('bookmarkBtn');

  likeBtn.addEventListener('click', () => {
    likeBtn.classList.toggle('active');
    const icon = likeBtn.querySelector('i');
    if (likeBtn.classList.contains('active')) {
      icon.classList.remove('fa-regular');
      icon.classList.add('fa-solid');
    } else {
      icon.classList.remove('fa-solid');
      icon.classList.add('fa-regular');
    }
  });

  bookmarkBtn.addEventListener('click', () => {
    bookmarkBtn.classList.toggle('active');
    const icon = bookmarkBtn.querySelector('i');
    if (bookmarkBtn.classList.contains('active')) {
      icon.classList.remove('fa-regular');
      icon.classList.add('fa-solid');
    } else {
      icon.classList.remove('fa-solid');
      icon.classList.add('fa-regular');
    }
  });

  shareBtn.addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: document.querySelector('.article-detail h1')?.textContent || 'Article',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  });

  function checkUrlHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
      if (hash === 'papersSection') {
        showSection('papers');
      } else if (hash === 'articlesSection') {
        showSection('articles');
      } else {
        const match = allPosts.find(p => p.slug === hash) || allPapers.find(p => p.slug === hash);
        if (match) {
          openArticleModal(match.file, match.slug);
        }
      }
    }
  }

  window.addEventListener('hashchange', checkUrlHash);

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
});
