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
  const articlesWrapper = document.getElementById('articlesWrapper');
  const papersWrapper = document.getElementById('papersWrapper');
  const articlesSection = document.getElementById('articlesSection');
  const papersSection = document.getElementById('papersSection');
  const trendingSection = document.getElementById('trendingSection');
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

  // Trending Elements
  const trendingGrid = document.getElementById('trendingGrid');
  const trendingResultsCount = document.getElementById('trendingResultsCount');

  let allPosts = [];
  let allPapers = [];
  let currentSection = 'home';
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
  const sidebarTrending = document.getElementById('sidebarTrending');
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

  if (sidebarTrending) {
    sidebarTrending.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('trending');
    });
  }

  if (sidebarThemeBtn) {
    sidebarThemeBtn.addEventListener('click', () => {
      themeToggleBtn.click();
    });
  }

  function showSection(section) {
    currentSection = section;

    // Close article modal when switching sections
    articleModal.classList.remove('active');

    // Update top nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));

    const homeSection = document.getElementById('homeSection');

    if (section === 'home') {
      navHome.classList.add('active');
      if (sidebarHome) sidebarHome.classList.add('active');
      homeSection.style.display = 'flex';
      articlesWrapper.style.display = 'none';
      papersWrapper.style.display = 'none';
      trendingSection.style.display = 'none';
    } else if (section === 'articles') {
      navArticles.classList.add('active');
      if (sidebarArticles) sidebarArticles.classList.add('active');
      homeSection.style.display = 'none';
      articlesWrapper.style.display = 'flex';
      papersWrapper.style.display = 'none';
      trendingSection.style.display = 'none';
    } else if (section === 'papers') {
      navPapers.classList.add('active');
      if (sidebarPapers) sidebarPapers.classList.add('active');
      homeSection.style.display = 'none';
      articlesWrapper.style.display = 'none';
      papersWrapper.style.display = 'flex';
      trendingSection.style.display = 'none';
    } else if (section === 'trending') {
      if (sidebarTrending) sidebarTrending.classList.add('active');
      homeSection.style.display = 'none';
      articlesWrapper.style.display = 'none';
      papersWrapper.style.display = 'none';
      trendingSection.style.display = 'flex';
      renderTrendingArticles();
    }
  }

  // Fetch Posts Metadata
  function renderRecommendations() {
    const recommendationsList = document.getElementById('recommendationsList');
    if (!recommendationsList) return;

    // Get top 5 most recent articles
    const topPosts = allPosts.slice(0, 5);

    recommendationsList.innerHTML = topPosts.map(post => `
      <a href="#${post.slug}" class="recommendation-item">
        <div class="recommendation-item-title">${post.title}</div>
        <div class="recommendation-item-meta">${formatDate(post.date)}</div>
      </a>
    `).join('');

    // Add click handlers
    recommendationsList.querySelectorAll('.recommendation-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = item.getAttribute('href').substring(1);
        const post = allPosts.find(p => p.slug === slug);
        if (post) openArticleModal(post.file, post.slug);
      });
    });
  }

  function renderHome() {
    // Render featured articles (first 3)
    const homeFeaturedPosts = document.getElementById('homeFeaturedPosts');
    if (homeFeaturedPosts) {
      const featuredPosts = allPosts.slice(0, 3);
      homeFeaturedPosts.innerHTML = featuredPosts.map(post => `
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
              <a href="#${post.slug}" class="read-more-link">Read more <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          </div>
        </div>
      `).join('');

      // Add click handlers for cards
      homeFeaturedPosts.querySelectorAll('.post-card').forEach(card => {
        card.addEventListener('click', () => {
          const slug = card.getAttribute('data-slug');
          const file = card.getAttribute('data-file');
          openArticleModal(file, slug);
        });
      });
    }

    // Render featured papers (first 3)
    const homeFeaturedPapers = document.getElementById('homeFeaturedPapers');
    if (homeFeaturedPapers) {
      const featuredPapers = allPapers.slice(0, 3);
      if (featuredPapers.length > 0) {
        homeFeaturedPapers.innerHTML = featuredPapers.map(paper => `
          <div class="post-card" data-slug="${paper.slug}" data-file="${paper.file}">
            <div class="post-cover-wrapper">
              <img src="${paper.cover}" alt="${paper.title}" class="post-cover-img" loading="lazy">
            </div>
            <div class="post-card-body">
              <div class="post-meta-row">
                <span><i class="fa-regular fa-calendar"></i> ${formatDate(paper.date)}</span>
              </div>
              <div class="post-tags" style="margin-bottom: 0.6rem;">
                ${(paper.tags || []).map(t => `<span class="card-tag">${t}</span>`).join('')}
              </div>
              <h3 class="post-title">${paper.title}</h3>
              <p class="post-summary">${paper.summary}</p>
              <div class="post-card-footer">
                <a href="#${paper.slug}" class="read-more-link">Read more <i class="fa-solid fa-arrow-right"></i></a>
              </div>
            </div>
          </div>
        `).join('');

        // Add click handlers for cards
        homeFeaturedPapers.querySelectorAll('.post-card').forEach(card => {
          card.addEventListener('click', () => {
            const slug = card.getAttribute('data-slug');
            const file = card.getAttribute('data-file');
            openArticleModal(file, slug);
          });
        });
      }
    }

    // Render featured trending (3 most recent from both articles and papers)
    const homeFeaturedTrending = document.getElementById('homeFeaturedTrending');
    if (homeFeaturedTrending) {
      const allContent = [
        ...allPosts.map(p => ({...p, type: 'article'})),
        ...allPapers.map(p => ({...p, type: 'paper'}))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

      if (allContent.length > 0) {
        homeFeaturedTrending.innerHTML = allContent.map(item => `
          <div class="post-card" data-slug="${item.slug}" data-file="${item.file}">
            <div class="post-cover-wrapper">
              <img src="${item.cover}" alt="${item.title}" class="post-cover-img" loading="lazy">
            </div>
            <div class="post-card-body">
              <div class="post-meta-row">
                <span><i class="fa-solid fa-${item.type === 'article' ? 'file-lines' : 'book'}"></i> ${item.type === 'article' ? 'Article' : 'Paper'}</span>
                <span><i class="fa-regular fa-clock"></i> ${item.readTime || '10 min read'}</span>
              </div>
              <div class="post-tags" style="margin-bottom: 0.6rem;">
                ${(item.tags || []).map(t => `<span class="card-tag">${t}</span>`).join('')}
              </div>
              <h3 class="post-title">${item.title}</h3>
              <p class="post-summary">${item.summary}</p>
              <div class="post-card-footer">
                <a href="#${item.slug}" class="read-more-link">Read more <i class="fa-solid fa-arrow-right"></i></a>
              </div>
            </div>
          </div>
        `).join('');

        homeFeaturedTrending.querySelectorAll('.post-card').forEach(card => {
          card.addEventListener('click', () => {
            const slug = card.getAttribute('data-slug');
            const file = card.getAttribute('data-file');
            openArticleModal(file, slug);
          });
        });
      }
    }

    // Update stats
    const tagsSet = new Set();
    allPosts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(t => tagsSet.add(t));
      }
    });
    allPapers.forEach(paper => {
      if (paper.tags) {
        paper.tags.forEach(t => tagsSet.add(t));
      }
    });

    document.getElementById('totalArticles').textContent = allPosts.length;
    document.getElementById('totalPapers').textContent = allPapers.length;
    document.getElementById('totalTags').textContent = tagsSet.size;

    // Add click handlers for "View More" links
    const viewMoreArticles = document.getElementById('viewMoreArticles');
    const viewMorePapers = document.getElementById('viewMorePapers');

    if (viewMoreArticles) {
      viewMoreArticles.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('articles');
      });
    }

    if (viewMorePapers) {
      viewMorePapers.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('papers');
      });
    }
  }

  Promise.all([
    fetch('data/posts.json').then(res => res.json()).catch(() => []),
    fetch('data/papers.json').then(res => res.json()).catch(() => [])
  ]).then(([posts, papers]) => {
    allPosts = posts;
    allPapers = papers;

    renderArticles();
    renderPapers();
    renderHome();
    renderRecommendations();
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

  // ============ TRENDING SECTION ============
  function renderTrendingArticles() {
    const trendingArticles = allPosts.slice(0, 6); // Show top 6 most recent articles

    trendingResultsCount.textContent = `Showing ${trendingArticles.length} article${trendingArticles.length === 1 ? '' : 's'}`;

    if (trendingArticles.length === 0) {
      trendingGrid.innerHTML = `
        <div class="loading-state">
          <p><i class="fa-solid fa-folder-open"></i> No trending articles found.</p>
        </div>
      `;
      return;
    }

    trendingGrid.innerHTML = trendingArticles.map(post => `
      <div class="post-card" data-slug="${post.slug}" data-file="${post.file}">
        <div class="post-cover-wrapper">
          <img src="${post.cover}" alt="${post.title}" class="post-cover-img" loading="lazy">
        </div>
        <div class="post-card-body">
          <div class="post-meta-row">
            <span><i class="fa-solid fa-calendar"></i> ${formatDate(post.date)}</span>
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

    trendingGrid.querySelectorAll('.post-card').forEach(card => {
      card.addEventListener('click', () => {
        const file = card.getAttribute('data-file');
        const slug = card.getAttribute('data-slug');
        openArticleModal(file, slug);
      });
    });
  }

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
            <div class="article-author-card">
              <div class="author-info">
                <img src="assets/avatar.jpg" alt="DevinWu" class="author-avatar">
                <div class="author-details">
                  <div class="author-name">DevinWu</div>
                  <div class="author-meta">
                    <span>${formatDate(postMeta.date)}</span>
                    <span>•</span>
                    <span>${postMeta.readTime}</span>
                  </div>
                </div>
              </div>
              <button class="follow-btn">Follow</button>
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
