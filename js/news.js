// News page functionality

const NewsManager = {
    // CORS proxy for RSS feeds
    CORS_PROXY: 'https://api.allorigins.win/raw?url=',

    // RSS feed sources
    RSS_FEEDS: [
        {
            name: 'BBC Sport - Football',
            url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
            icon: '📺'
        },
        {
            name: 'Sky Sports - Football',
            url: 'https://www.skysports.com/rss/12040',
            icon: '🎯'
        },
        {
            name: 'Guardian - Football',
            url: 'https://www.theguardian.com/football/rss',
            icon: '📰'
        }
    ],

    // Initialize the news page
    async init() {
        this.setupMobileMenu();
        await this.loadNews();
    },

    // Setup mobile menu toggle
    setupMobileMenu() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (menuBtn && navLinks) {
            menuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
    },

    // Load news content
    async loadNews() {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return;

        // Show loading state
        newsContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading latest news...</p>
            </div>
        `;

        try {
            // Fetch all RSS feeds in parallel
            const feedPromises = this.RSS_FEEDS.map(feed => this.fetchRSSFeed(feed));
            const results = await Promise.allSettled(feedPromises);

            // Collect all articles from successful fetches
            let allArticles = [];
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    allArticles = allArticles.concat(result.value);
                }
            });

            // Sort by date (newest first) and limit to 20 articles
            allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            allArticles = allArticles.slice(0, 20);

            // Render the news
            if (allArticles.length > 0) {
                newsContainer.innerHTML = this.renderNews(allArticles);
            } else {
                // Fallback to static content if all feeds fail
                newsContainer.innerHTML = this.getStaticContent();
            }
        } catch (error) {
            console.error('Error loading news:', error);
            newsContainer.innerHTML = this.getStaticContent();
        }
    },

    // Fetch and parse a single RSS feed
    async fetchRSSFeed(feed) {
        try {
            const response = await fetch(this.CORS_PROXY + encodeURIComponent(feed.url));

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');

            // Check for parse errors
            const parseError = xml.querySelector('parsererror');
            if (parseError) {
                throw new Error('XML parse error');
            }

            // Extract articles
            const items = xml.querySelectorAll('item');
            const articles = [];

            items.forEach((item, index) => {
                if (index >= 10) return; // Limit per feed

                const title = item.querySelector('title')?.textContent || '';
                const link = item.querySelector('link')?.textContent || '';
                const description = item.querySelector('description')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent || '';

                // Filter for Premier League / football related content
                const text = (title + description).toLowerCase();
                const isPLRelated = text.includes('premier league') ||
                                   text.includes('liverpool') ||
                                   text.includes('manchester') ||
                                   text.includes('arsenal') ||
                                   text.includes('chelsea') ||
                                   text.includes('tottenham') ||
                                   text.includes('newcastle') ||
                                   text.includes('aston villa') ||
                                   text.includes('brighton') ||
                                   text.includes('west ham') ||
                                   text.includes('bournemouth') ||
                                   text.includes('fulham') ||
                                   text.includes('brentford') ||
                                   text.includes('crystal palace') ||
                                   text.includes('wolves') ||
                                   text.includes('everton') ||
                                   text.includes('nottingham') ||
                                   text.includes('leicester') ||
                                   text.includes('ipswich') ||
                                   text.includes('southampton') ||
                                   text.includes('fpl') ||
                                   text.includes('fantasy');

                if (isPLRelated || feed.name.includes('Football')) {
                    articles.push({
                        title: this.cleanText(title),
                        link,
                        description: this.cleanText(description).substring(0, 150) + '...',
                        pubDate,
                        source: feed.name,
                        icon: feed.icon
                    });
                }
            });

            return articles;
        } catch (error) {
            console.warn(`Failed to fetch ${feed.name}:`, error);
            return [];
        }
    },

    // Clean HTML entities and tags from text
    cleanText(text) {
        if (!text) return '';
        // Remove HTML tags
        text = text.replace(/<[^>]*>/g, '');
        // Decode HTML entities
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value.trim();
    },

    // Format date for display
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 60) {
                return `${diffMins} minutes ago`;
            } else if (diffHours < 24) {
                return `${diffHours} hours ago`;
            } else if (diffDays < 7) {
                return `${diffDays} days ago`;
            } else {
                return date.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            }
        } catch {
            return '';
        }
    },

    // Render news articles
    renderNews(articles) {
        const currentDate = new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="news-intro mb-3">
                <p>Latest football news from trusted sources. Auto-updated on every visit.</p>
                <p class="text-muted" style="font-size: 0.9rem; color: var(--gray-600);">Last updated: ${currentDate}</p>
            </div>

            <div class="card-grid">
                ${articles.map(article => `
                    <div class="news-card">
                        <div class="news-card-image">${article.icon}</div>
                        <div class="news-card-body">
                            <span class="news-card-category">${article.source}</span>
                            <h3>${article.title}</h3>
                            <p>${article.description}</p>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                                <span class="news-card-date">${this.formatDate(article.pubDate)}</span>
                                <a href="${article.link}" target="_blank" rel="noopener" class="card-link">Read more →</a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${this.getQuickLinksSection()}
        `;
    },

    // Quick links section
    getQuickLinksSection() {
        return `
            <div class="section-header mt-3">
                <h2>🔗 Quick Links</h2>
            </div>

            <div class="card-grid">
                <div class="card">
                    <div class="card-icon">📊</div>
                    <h3>Fixtures & Results</h3>
                    <p>View complete fixtures, results, and league standings.</p>
                    <a href="https://www.premierleague.com/fixtures" target="_blank" rel="noopener" class="card-link">View Fixtures →</a>
                </div>
                <div class="card">
                    <div class="card-icon">🏆</div>
                    <h3>League Table</h3>
                    <p>Current Premier League standings and form.</p>
                    <a href="https://www.premierleague.com/tables" target="_blank" rel="noopener" class="card-link">View Table →</a>
                </div>
                <div class="card">
                    <div class="card-icon">🔄</div>
                    <h3>Transfer Centre</h3>
                    <p>Latest transfer rumours and confirmed signings.</p>
                    <a href="https://www.premierleague.com/transfers" target="_blank" rel="noopener" class="card-link">Transfers →</a>
                </div>
            </div>
        `;
    },

    // Fallback static content if RSS fails
    getStaticContent() {
        const currentDate = new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="news-intro mb-3">
                <p>Stay up to date with the latest Premier League news from official sources.</p>
                <p class="text-muted" style="font-size: 0.9rem; color: var(--gray-600);">Date: ${currentDate}</p>
            </div>

            <div class="card mb-3" style="background: #fff3cd; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404;">
                    <strong>Note:</strong> Live news feed temporarily unavailable. Please use the links below to access the latest news.
                </p>
            </div>

            <div class="card-grid">
                <div class="news-card">
                    <div class="news-card-image">📺</div>
                    <div class="news-card-body">
                        <span class="news-card-category">BBC Sport</span>
                        <h3>BBC Sport Football</h3>
                        <p>Comprehensive coverage of Premier League football including match reports, analysis, and breaking news.</p>
                        <a href="https://www.bbc.co.uk/sport/football/premier-league" target="_blank" rel="noopener" class="card-link">Visit BBC Sport →</a>
                    </div>
                </div>

                <div class="news-card">
                    <div class="news-card-image">🎯</div>
                    <div class="news-card-body">
                        <span class="news-card-category">Sky Sports</span>
                        <h3>Sky Sports Football</h3>
                        <p>Breaking news, live scores, transfers, and in-depth Premier League coverage.</p>
                        <a href="https://www.skysports.com/premier-league" target="_blank" rel="noopener" class="card-link">Visit Sky Sports →</a>
                    </div>
                </div>

                <div class="news-card">
                    <div class="news-card-image">📰</div>
                    <div class="news-card-body">
                        <span class="news-card-category">Guardian</span>
                        <h3>The Guardian Football</h3>
                        <p>In-depth articles, opinion pieces, and comprehensive Premier League coverage.</p>
                        <a href="https://www.theguardian.com/football/premierleague" target="_blank" rel="noopener" class="card-link">Visit Guardian →</a>
                    </div>
                </div>

                <div class="news-card">
                    <div class="news-card-image">⚽</div>
                    <div class="news-card-body">
                        <span class="news-card-category">Official</span>
                        <h3>Premier League Official</h3>
                        <p>Official news, announcements, and updates from the Premier League.</p>
                        <a href="https://www.premierleague.com/news" target="_blank" rel="noopener" class="card-link">Visit PL News →</a>
                    </div>
                </div>
            </div>

            ${this.getQuickLinksSection()}
        `;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    NewsManager.init();
});
