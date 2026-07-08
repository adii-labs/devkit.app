document.addEventListener('DOMContentLoaded', function () {

    // ============================================================
    //  TOOLS DATABASE (exactly matching the homepage)
    // ============================================================
    const tools = [
        // Data & Format
        { name: 'JSON Viewer', category: 'Data & Format', icon: 'fa-code', path: '/jsonViewer' },
        { name: 'SQL Viewer', category: 'Data & Format', icon: 'fa-database', path: '/sqlViewer' },
        { name: 'XML to JSON', category: 'Data & Format', icon: 'fa-file-code', path: '#' },
        { name: 'CSV Viewer', category: 'Data & Format', icon: 'fa-table', path: '#' },
        { name: 'YAML Converter', category: 'Data & Format', icon: 'fa-arrow-right-arrow-left', path: '#' },

        // Security & Crypto
        { name: 'Hash Generator', category: 'Security & Crypto', icon: 'fa-shield-alt', path: '#' },
        { name: 'JWT Debugger', category: 'Security & Crypto', icon: 'fa-key', path: '#' },
        { name: 'UUID v4', category: 'Security & Crypto', icon: 'fa-fingerprint', path: '#' },
        { name: 'QR Code Gen', category: 'Security & Crypto', icon: 'fa-qrcode', path: '/qrCode' },
        { name: 'Base64 Encode', category: 'Security & Crypto', icon: 'fa-unlock-alt', path: '#' },

        // Design & Color
        { name: 'Color Picker', category: 'Design & Color', icon: 'fa-palette', path: '#' },
        { name: 'CSS Gradient', category: 'Design & Color', icon: 'fa-stroopwafel', path: '#' },
        { name: 'Hex to RGB', category: 'Design & Color', icon: 'fa-eye-dropper', path: '#' },
        { name: 'Color Contrast', category: 'Design & Color', icon: 'fa-palette', path: '#' },
        { name: 'Font Preview', category: 'Design & Color', icon: 'fa-font', path: '#' },

        // Network & URL
        { name: 'URL Encoder', category: 'Network & URL', icon: 'fa-link', path: '#' },
        { name: 'IP Info', category: 'Network & URL', icon: 'fa-earth-asia', path: '#' },
        { name: 'Proxy Check', category: 'Network & URL', icon: 'fa-user-secret', path: '#' },
        { name: 'QR Scanner', category: 'Network & URL', icon: 'fa-qrcode', path: '#' },
        { name: 'Short URL', category: 'Network & URL', icon: 'fa-share-alt', path: '#' },

        // Time & Date
        { name: 'Unix Timestamp', category: 'Time & Date', icon: 'fa-clock', path: '#' },
        { name: 'Date Diff', category: 'Time & Date', icon: 'fa-calendar-alt', path: '#' },
        { name: 'Countdown Timer', category: 'Time & Date', icon: 'fa-hourglass-half', path: '#' },
        { name: 'World Clock', category: 'Time & Date', icon: 'fa-globe', path: '#' },
        { name: 'Stopwatch', category: 'Time & Date', icon: 'fa-stopwatch', path: '#' },

        // Utilities
        { name: 'Unit Converter', category: 'Utilities', icon: 'fa-calculator', path: '#' },
        { name: 'Minify CSS/JS', category: 'Utilities', icon: 'fa-compress-alt', path: '#' },
        { name: 'Lorem Ipsum', category: 'Utilities', icon: 'fa-i-cursor', path: '#' },
        { name: 'Percentage Calc', category: 'Utilities', icon: 'fa-percent', path: '#' },
        { name: 'Random Generator', category: 'Utilities', icon: 'fa-random', path: '#' },
    ];

    // ============================================================
    //  DOM REFS
    // ============================================================
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('searchResults');

    // ============================================================
    //  UTILITY: Escape HTML
    // ============================================================
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ============================================================
    //  RENDER SEARCH RESULTS (using existing .popular-card)
    // ============================================================
    function renderResults(query) {
        const trimmed = query.trim().toLowerCase();
        let matched = [];

        if (trimmed === '') {
            resultsContainer.style.display = 'none';
            return;
        }

        matched = tools.filter(tool => {
            const nameMatch = tool.name.toLowerCase().includes(trimmed);
            const catMatch = tool.category.toLowerCase().includes(trimmed);
            return nameMatch || catMatch;
        });

        if (matched.length === 0) {
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `
                <div class="search-empty">
                    <i class="fas fa-search"></i>
                    <p>No tools found for "<strong>${escapeHtml(query)}</strong>"</p>
                    <span>Try adjusting your search term.</span>
                </div>
            `;
            return;
        }

        // === USING EXISTING .popular-card CLASS ===
        let html = `<div class="search-grid">`;
        matched.forEach(tool => {
            const iconClass = tool.icon || 'fa-cube';
            const path = tool.path || '#';
            html += `
                <div class="popular-card" onclick="window.open('${path}')">
                    <div class="icon-wrap"><i class="fas ${iconClass}"></i></div>
                    <div class="tool-label">${escapeHtml(tool.name)}</div>
                    <div class="tool-sub">${escapeHtml(tool.category)}</div>
                </div>
            `;
        });
        html += `</div>`;
        html += `<div class="search-footer-text">${matched.length} tool${matched.length > 1 ? 's' : ''} found</div>`;

        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = html;
    }

    // ============================================================
    //  EVENT LISTENERS
    // ============================================================
    function handleSearch() {
        const query = searchInput.value;
        renderResults(query);
    }

    searchInput.addEventListener('input', handleSearch);
    searchBtn.addEventListener('click', handleSearch);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            resultsContainer.style.display = 'none';
            searchInput.blur();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    document.addEventListener('click', function (e) {
        if (resultsContainer.style.display === 'block') {
            const searchSection = document.querySelector('.search-section');
            if (!searchSection.contains(e.target)) {
                resultsContainer.style.display = 'none';
            }
        }
    });

});