// News page functionality

const NewsManager = {
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

        // Since we can't reliably fetch RSS feeds client-side due to CORS,
        // we'll display curated news sections with links to official sources
        const newsContent = this.getNewsContent();
        newsContainer.innerHTML = newsContent;
    },

    // Get curated news content
    getNewsContent() {
        const currentDate = new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="news-intro mb-3">
                <p>Stay up to date with the latest Premier League news. Updated regularly from official sources.</p>
                <p class="text-muted" style="font-size: 0.9rem; color: var(--gray-600);">Last checked: ${currentDate}</p>
            </div>

            <div class="card-grid">
                <div class="news-card">
                    <div class="news-card-image">⚽</div>
                    <div class="news-card-body">
                        <span class="news-card-category">Official</span>
                        <h3>Premier League Official News</h3>
                        <p>Get the latest match reports, transfer news, and official announcements from the Premier League.</p>
                        <a href="https://www.premierleague.com/news" target="_blank" rel="noopener" class="card-link">Visit PL News →</a>
                    </div>
                </div>

                <div class="news-card">
                    <div class="news-card-image">📊</div>
                    <div class="news-card-body">
                        <span class="news-card-category">Stats</span>
                        <h3>Match Results & Fixtures</h3>
                        <p>View complete fixtures, results, and league standings for the current Premier League season.</p>
                        <a href="https://www.premierleague.com/fixtures" target="_blank" rel="noopener" class="card-link">View Fixtures →</a>
                    </div>
                </div>

                <div class="news-card">
                    <div class="news-card-image">🏆</div>
                    <div class="news-card-body">
                        <span class="news-card-category">Standings</span>
                        <h3>League Table</h3>
                        <p>Check the current Premier League standings, including points, goal difference, and form.</p>
                        <a href="https://www.premierleague.com/tables" target="_blank" rel="noopener" class="card-link">View Table →</a>
                    </div>
                </div>

                <div class="news-card">
                    <div class="news-card-image">🔄</div>
                    <div class="news-card-body">
                        <span class="news-card-category">Transfers</span>
                        <h3>Transfer News</h3>
                        <p>Stay informed about the latest transfer rumours, confirmed signings, and player movements.</p>
                        <a href="https://www.premierleague.com/transfers" target="_blank" rel="noopener" class="card-link">Transfer Centre →</a>
                    </div>
                </div>
            </div>

            <div class="section-header mt-3">
                <h2>📰 News Sources</h2>
            </div>

            <div class="card">
                <h3>Recommended News Sources</h3>
                <p class="mb-2">For the latest Premier League coverage, we recommend these trusted sources:</p>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--gray-200);">
                        <a href="https://www.bbc.co.uk/sport/football/premier-league" target="_blank" rel="noopener" style="color: var(--pl-purple); text-decoration: none; font-weight: 500;">BBC Sport - Premier League</a>
                        <span style="color: var(--gray-600); font-size: 0.9rem;"> - Comprehensive coverage and analysis</span>
                    </li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--gray-200);">
                        <a href="https://www.skysports.com/premier-league" target="_blank" rel="noopener" style="color: var(--pl-purple); text-decoration: none; font-weight: 500;">Sky Sports - Premier League</a>
                        <span style="color: var(--gray-600); font-size: 0.9rem;"> - Breaking news and live updates</span>
                    </li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--gray-200);">
                        <a href="https://www.theguardian.com/football/premierleague" target="_blank" rel="noopener" style="color: var(--pl-purple); text-decoration: none; font-weight: 500;">The Guardian - Premier League</a>
                        <span style="color: var(--gray-600); font-size: 0.9rem;"> - In-depth articles and opinion</span>
                    </li>
                    <li style="padding: 0.5rem 0;">
                        <a href="https://www.telegraph.co.uk/football/premier-league/" target="_blank" rel="noopener" style="color: var(--pl-purple); text-decoration: none; font-weight: 500;">The Telegraph - Premier League</a>
                        <span style="color: var(--gray-600); font-size: 0.9rem;"> - Expert analysis and features</span>
                    </li>
                </ul>
            </div>
        `;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    NewsManager.init();
});
