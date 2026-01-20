// FPL API Utilities
// Base URL for FPL API (uses CORS proxy for client-side access)

const FPL_API = {
    // CORS proxies to try (in order of preference)
    CORS_PROXIES: [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest='
    ],
    BASE_URL: 'https://fantasy.premierleague.com/api/',

    // Cached data
    cache: {
        bootstrap: null,
        lastFetch: null
    },

    // Position mapping
    positions: {
        1: { short: 'GKP', full: 'Goalkeeper', class: 'position-gkp' },
        2: { short: 'DEF', full: 'Defender', class: 'position-def' },
        3: { short: 'MID', full: 'Midfielder', class: 'position-mid' },
        4: { short: 'FWD', full: 'Forward', class: 'position-fwd' }
    },

    // Fetch with proxy fallback
    async fetchWithProxy(url) {
        let lastError;

        for (const proxy of this.CORS_PROXIES) {
            try {
                const proxyUrl = proxy + encodeURIComponent(url);
                const response = await fetch(proxyUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data;
            } catch (error) {
                console.warn(`Proxy ${proxy} failed:`, error.message);
                lastError = error;
            }
        }

        throw lastError || new Error('All proxies failed');
    },

    // Fetch bootstrap-static data (contains all player, team, and gameweek data)
    async getBootstrapData() {
        // Return cached data if less than 5 minutes old
        if (this.cache.bootstrap && this.cache.lastFetch) {
            const fiveMinutes = 5 * 60 * 1000;
            if (Date.now() - this.cache.lastFetch < fiveMinutes) {
                return this.cache.bootstrap;
            }
        }

        try {
            const data = await this.fetchWithProxy(this.BASE_URL + 'bootstrap-static/');

            // Validate the data structure
            if (!data || !data.elements || !data.teams || !data.events) {
                throw new Error('Invalid data structure received from FPL API');
            }

            // Cache the data
            this.cache.bootstrap = data;
            this.cache.lastFetch = Date.now();

            return data;
        } catch (error) {
            console.error('Error fetching FPL data:', error);
            throw error;
        }
    },

    // Get current gameweek info
    async getCurrentGameweek() {
        const data = await this.getBootstrapData();
        const currentGW = data.events.find(event => event.is_current);
        const nextGW = data.events.find(event => event.is_next);
        return { current: currentGW, next: nextGW };
    },

    // Get all players with team info
    async getPlayers() {
        const data = await this.getBootstrapData();
        return data.elements.map(player => ({
            ...player,
            team: data.teams.find(t => t.id === player.team),
            positionInfo: this.positions[player.element_type]
        }));
    },

    // Get teams
    async getTeams() {
        const data = await this.getBootstrapData();
        return data.teams;
    },

    // Get top players by total points
    async getTopPlayers(limit = 10) {
        const players = await this.getPlayers();
        return players
            .sort((a, b) => b.total_points - a.total_points)
            .slice(0, limit);
    },

    // Get top players by position
    async getTopPlayersByPosition(positionId, limit = 5) {
        const players = await this.getPlayers();
        return players
            .filter(p => p.element_type === positionId)
            .sort((a, b) => b.total_points - a.total_points)
            .slice(0, limit);
    },

    // Get best value players (points per million)
    async getBestValuePlayers(limit = 10) {
        const players = await this.getPlayers();
        return players
            .filter(p => p.minutes > 0 && p.now_cost > 0)
            .map(p => ({
                ...p,
                pointsPerMillion: (p.total_points / (p.now_cost / 10)).toFixed(2)
            }))
            .sort((a, b) => b.pointsPerMillion - a.pointsPerMillion)
            .slice(0, limit);
    },

    // Get differential picks (low ownership, good form)
    async getDifferentials(maxOwnership = 10, limit = 10) {
        const players = await this.getPlayers();
        return players
            .filter(p =>
                p.selected_by_percent < maxOwnership &&
                parseFloat(p.form) > 4 &&
                p.minutes > 0
            )
            .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
            .slice(0, limit);
    },

    // Get players with injury/availability concerns
    async getInjuredPlayers() {
        const players = await this.getPlayers();
        return players
            .filter(p => p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 100)
            .sort((a, b) => a.chance_of_playing_next_round - b.chance_of_playing_next_round);
    },

    // Get price risers (high transfer activity)
    async getPriceRisers(limit = 10) {
        const players = await this.getPlayers();
        return players
            .filter(p => p.transfers_in_event > 0)
            .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
            .slice(0, limit);
    },

    // Get price fallers
    async getPriceFallers(limit = 10) {
        const players = await this.getPlayers();
        return players
            .filter(p => p.transfers_out_event > 0)
            .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
            .slice(0, limit);
    },

    // Get captain recommendations
    async getCaptainPicks(limit = 5) {
        const players = await this.getPlayers();
        // Score based on form, total points, and ICT index
        return players
            .map(p => ({
                ...p,
                captainScore: (
                    parseFloat(p.form) * 2 +
                    parseFloat(p.ict_index) / 10 +
                    p.total_points / 20
                ).toFixed(2)
            }))
            .sort((a, b) => b.captainScore - a.captainScore)
            .slice(0, limit);
    },

    // Format price (converts from 10ths to actual price)
    formatPrice(price) {
        return `£${(price / 10).toFixed(1)}m`;
    },

    // Format large numbers
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    // Get status class for injury chance
    getStatusClass(chance) {
        if (chance === null || chance === 100) return 'status-available';
        if (chance >= 75) return 'status-doubtful';
        return 'status-injured';
    },

    // Get status text
    getStatusText(chance, news) {
        if (chance === null || chance === 100) return 'Available';
        if (news) return news;
        if (chance >= 75) return `${chance}% chance`;
        if (chance > 0) return `${chance}% chance`;
        return 'Unavailable';
    }
};

// Export for use in other files
window.FPL_API = FPL_API;
