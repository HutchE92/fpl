// Picks page functionality

const PicksManager = {
    // Initialize the picks page
    async init() {
        this.setupMobileMenu();
        this.setupTabs();
        await this.loadAllData();
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

    // Setup tab functionality
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;

                // Update active states
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(tabId)?.classList.add('active');
            });
        });
    },

    // Load all data sections
    async loadAllData() {
        try {
            // Show loading state
            this.showLoading();

            // Load gameweek info first
            await this.loadGameweekInfo();

            // Load all data sections in parallel
            await Promise.all([
                this.loadTopPicks(),
                this.loadValuePicks(),
                this.loadDifferentials(),
                this.loadCaptainPicks()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Unable to load FPL data. Please try again later.');
        }
    },

    // Show loading state
    showLoading() {
        const containers = ['top-picks', 'value-picks', 'differentials', 'captain-picks'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>Loading data...</p>
                    </div>
                `;
            }
        });
    },

    // Show error message
    showError(message) {
        const containers = ['top-picks', 'value-picks', 'differentials', 'captain-picks'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        ${message}
                    </div>
                `;
            }
        });
    },

    // Load gameweek info
    async loadGameweekInfo() {
        const gwInfo = document.getElementById('gameweek-info');
        if (!gwInfo) return;

        try {
            const { current, next } = await FPL_API.getCurrentGameweek();
            const activeGW = current || next;

            if (activeGW) {
                const deadline = new Date(activeGW.deadline_time);
                const deadlineStr = deadline.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                gwInfo.innerHTML = `
                    <div class="gameweek-number">
                        Gameweek <span>${activeGW.id}</span>
                    </div>
                    <div class="gameweek-deadline">
                        <div class="deadline-label">${activeGW.is_current ? 'Deadline passed' : 'Deadline'}</div>
                        <div class="deadline-time">${deadlineStr}</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading gameweek:', error);
        }
    },

    // Load top picks by position
    async loadTopPicks() {
        const container = document.getElementById('top-picks');
        if (!container) return;

        try {
            const positions = [
                { id: 1, name: 'Goalkeepers' },
                { id: 2, name: 'Defenders' },
                { id: 3, name: 'Midfielders' },
                { id: 4, name: 'Forwards' }
            ];

            let html = '';

            for (const pos of positions) {
                const players = await FPL_API.getTopPlayersByPosition(pos.id, 5);
                html += `
                    <div class="feature-card mb-3">
                        <div class="feature-card-header">
                            <h3>Top ${pos.name}</h3>
                        </div>
                        <div class="feature-card-body">
                            ${players.map(p => this.renderPlayerCard(p)).join('')}
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="error-message">Unable to load top picks.</div>';
        }
    },

    // Load value picks
    async loadValuePicks() {
        const container = document.getElementById('value-picks');
        if (!container) return;

        try {
            const players = await FPL_API.getBestValuePlayers(15);

            container.innerHTML = `
                <div class="card mb-2">
                    <p style="color: var(--gray-600);">Best value players ranked by points per million. Great options for building a balanced squad.</p>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Team</th>
                            <th>Pos</th>
                            <th>Price</th>
                            <th>Points</th>
                            <th>Pts/£M</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${players.map(p => `
                            <tr>
                                <td><strong>${p.web_name}</strong></td>
                                <td>${p.team?.short_name || 'N/A'}</td>
                                <td><span class="player-position ${p.positionInfo?.class}">${p.positionInfo?.short}</span></td>
                                <td>${FPL_API.formatPrice(p.now_cost)}</td>
                                <td>${p.total_points}</td>
                                <td><strong class="price-up">${p.pointsPerMillion}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            container.innerHTML = '<div class="error-message">Unable to load value picks.</div>';
        }
    },

    // Load differentials
    async loadDifferentials() {
        const container = document.getElementById('differentials');
        if (!container) return;

        try {
            const players = await FPL_API.getDifferentials(10, 15);

            container.innerHTML = `
                <div class="card mb-2">
                    <p style="color: var(--gray-600);">Low ownership players with good form. Perfect for climbing the ranks!</p>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Team</th>
                            <th>Pos</th>
                            <th>Price</th>
                            <th>Form</th>
                            <th>Selected</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${players.map(p => `
                            <tr>
                                <td><strong>${p.web_name}</strong></td>
                                <td>${p.team?.short_name || 'N/A'}</td>
                                <td><span class="player-position ${p.positionInfo?.class}">${p.positionInfo?.short}</span></td>
                                <td>${FPL_API.formatPrice(p.now_cost)}</td>
                                <td><strong class="price-up">${p.form}</strong></td>
                                <td>${p.selected_by_percent}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            container.innerHTML = '<div class="error-message">Unable to load differentials.</div>';
        }
    },

    // Load captain picks
    async loadCaptainPicks() {
        const container = document.getElementById('captain-picks');
        if (!container) return;

        try {
            const players = await FPL_API.getCaptainPicks(10);

            container.innerHTML = `
                <div class="card mb-2">
                    <p style="color: var(--gray-600);">Top captain choices based on form, ICT index, and total points. Consider fixtures when making your final decision!</p>
                </div>
                ${players.map((p, i) => `
                    <div class="player-card mb-2" style="${i === 0 ? 'border: 2px solid var(--pl-green);' : ''}">
                        <span class="player-position ${p.positionInfo?.class}">${p.positionInfo?.short}</span>
                        <div class="player-info">
                            <div class="player-name">
                                ${p.web_name}
                                ${i === 0 ? '<span class="captain-badge">C</span>' : ''}
                                ${i === 1 ? '<span class="captain-badge" style="background: var(--gray-600);">VC</span>' : ''}
                            </div>
                            <div class="player-team">${p.team?.name || 'N/A'}</div>
                        </div>
                        <div class="player-stats">
                            <div class="player-points">${p.total_points} pts</div>
                            <div class="player-price">Form: ${p.form}</div>
                        </div>
                    </div>
                `).join('')}
            `;
        } catch (error) {
            container.innerHTML = '<div class="error-message">Unable to load captain picks.</div>';
        }
    },

    // Render a player card
    renderPlayerCard(player) {
        return `
            <div class="player-card mb-2">
                <span class="player-position ${player.positionInfo?.class}">${player.positionInfo?.short}</span>
                <div class="player-info">
                    <div class="player-name">${player.web_name}</div>
                    <div class="player-team">${player.team?.name || 'N/A'}</div>
                </div>
                <div class="player-stats">
                    <div class="player-points">${player.total_points} pts</div>
                    <div class="player-price">${FPL_API.formatPrice(player.now_cost)}</div>
                </div>
            </div>
        `;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    PicksManager.init();
});
