/**
 * ============================================================
 *  NAV.JS — Common Navigation for all DevKit pages
 *  ============================================================
 *  Features:
 *  - Hamburger menu toggle (mobile)
 *  - Sliding panel open/close
 *  - Active state highlight (Nav buttons + Panel links)
 *  - Escape key to close panel
 *  - Click outside to close panel
 *  ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('hamburgerBtn');
    const panel = document.getElementById('slidePanel');
    const closeBtn = document.getElementById('panelCloseBtn');

    // ---- Open Panel ----
    function openPanel() {
        panel.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    // ---- Close Panel ----
    function closePanel() {
        panel.classList.remove('open');
        document.body.style.overflow = '';
    }

    // ---- Hamburger Click ----
    if (hamburger) {
        hamburger.addEventListener('click', function (e) {
            e.stopPropagation();
            if (panel.classList.contains('open')) {
                closePanel();
            } else {
                openPanel();
            }
        });
    }

    // ---- Close Button Click ----
    if (closeBtn) {
        closeBtn.addEventListener('click', closePanel);
    }

    // ============================================================
    //  ACTIVE STATE — Desktop Nav Buttons + Panel Links
    // ============================================================
    const currentPath = window.location.pathname;

    // ---- Desktop Nav Buttons ----
    document.querySelectorAll('.nav-btn').forEach(function (link) {
        link.classList.remove('active');
        const href = link.getAttribute('href');

        // Exact match
        if (href === currentPath) {
            link.classList.add('active');
        }
        // Home page (root)
        else if (href === '/' && (currentPath === '/' || currentPath === '')) {
            link.classList.add('active');
        }
        // 🆕 Tool pages → "Home" ko active rakho
        else if (href === '/' && currentPath !== '/' && currentPath !== '') {
            link.classList.add('active');
        }
        // Substring match (for nested paths like /support, /contact)
        else if (currentPath.includes(href) && href !== '/') {
            link.classList.add('active');
        }
    });

    // ---- Panel Links ----
    document.querySelectorAll('.panel-link').forEach(function (link) {
        link.classList.remove('active');
        const href = link.getAttribute('href');

        if (href === currentPath) {
            link.classList.add('active');
        } else if (href === '/' && (currentPath === '/' || currentPath === '')) {
            link.classList.add('active');
        } else if (href === '/' && currentPath !== '/' && currentPath !== '') {
            link.classList.add('active');
        } else if (currentPath.includes(href) && href !== '/') {
            link.classList.add('active');
        }

        // Click on panel link → make it active
        link.addEventListener('click', function (e) {
            document.querySelectorAll('.panel-link').forEach(function (l) {
                l.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // ============================================================
    //  KEYBOARD SHORTCUTS
    // ============================================================
    document.addEventListener('keydown', function (e) {
        // Escape key → close panel
        if (e.key === 'Escape' && panel && panel.classList.contains('open')) {
            closePanel();
        }
    });

    // ============================================================
    //  CLICK OUTSIDE → CLOSE PANEL
    // ============================================================
    document.addEventListener('click', function (e) {
        if (panel && panel.classList.contains('open')) {
            if (!panel.contains(e.target) && !hamburger.contains(e.target)) {
                closePanel();
            }
        }
    });

    // Prevent panel clicks from bubbling up
    if (panel) {
        panel.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }
});