/**
 * ============================================================
 *  UTILS.JS — Common utility functions for all DevKit tools
 *  ============================================================
 *  Contains:
 *  - Toast notifications
 *  - Copy to clipboard
 *  - Download file
 *  - File reader (text + array buffer)
 *  - Escape HTML (XSS protection)
 *  - Format file size
 *  - Debounce
 *  - Tab switching (optional generic)
 *  ============================================================
 */

// ============================================================
//  1. TOAST NOTIFICATION
// ============================================================
function showToast(msg, type) {
    const old = document.querySelector('.custom-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'custom-toast';

    const colors = {
        success: '#00cec9',
        error: '#fd79a8',
        warning: '#fdcb6e',
        info: '#6c5ce7'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    toast.style.borderColor = colors[type] || '#2a3142';
    toast.innerHTML = `
        <i class="fas ${icons[type] || 'fa-circle-info'}" style="color:${colors[type] || '#6b768f'};"></i>
        <span>${msg}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(function () { toast.remove(); }, 400);
    }, 3000);
}

// ============================================================
//  2. COPY TO CLIPBOARD (Text)
// ============================================================
function copyToClipboard(text, successMsg) {
    if (!text || text.trim() === '') {
        showToast('Nothing to copy.', 'warning');
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
            showToast(successMsg || 'Copied to clipboard!', 'success');
        }).catch(function () {
            fallbackCopy(text, successMsg);
        });
    } else {
        fallbackCopy(text, successMsg);
    }
}

function fallbackCopy(text, successMsg) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        showToast(successMsg || 'Copied to clipboard!', 'success');
    } catch (e) {
        showToast('Failed to copy.', 'error');
    }

    document.body.removeChild(textarea);
}

// ============================================================
//  3. DOWNLOAD FILE
// ============================================================
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================
//  4. FILE READER (Promise based)
// ============================================================
function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function (e) { resolve(e.target.result); };
        reader.onerror = function (e) { reject(e.target.error); };
        reader.readAsText(file);
    });
}

function readFileAsArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function (e) { resolve(e.target.result); };
        reader.onerror = function (e) { reject(e.target.error); };
        reader.readAsArrayBuffer(file);
    });
}

// ============================================================
//  5. ESCAPE HTML (XSS protection)
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ============================================================
//  6. FORMAT FILE SIZE
// ============================================================
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
}

// ============================================================
//  7. DEBOUNCE
// ============================================================
function debounce(fn, delay) {
    let timer = null;
    return function () {
        var args = arguments;
        var context = this;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
            timer = null;
        }, delay);
    };
}

// ============================================================
//  8. GENERIC TAB SWITCHER (Optional)
//  - containerSelector: parent of all tabs
//  - tabSelector: button selector (e.g. '.tab-btn')
//  - contentSelector: content panel selector (e.g. '.tab-content')
//  - onTabChange: optional callback when tab changes
// ============================================================
function initTabs(containerSelector, tabSelector, contentSelector, onTabChange) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const tabs = container.querySelectorAll(tabSelector);
    const contents = container.querySelectorAll(contentSelector);

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            // Remove active from all tabs
            tabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');

            // Hide all contents
            contents.forEach(function (c) { c.classList.remove('active'); });

            // Show target content
            const target = this.dataset.tab;
            contents.forEach(function (c) {
                if (c.id === 'tab-' + target) {
                    c.classList.add('active');
                }
            });

            // Callback
            if (typeof onTabChange === 'function') {
                onTabChange(target);
            }
        });
    });
}

// ============================================================
//  9. UPDATE STATUS DOT (Optional)
// ============================================================
function updateStatus(dotElement, textElement, state, msg) {
    const dot = typeof dotElement === 'string' ? document.querySelector(dotElement) : dotElement;
    const text = typeof textElement === 'string' ? document.querySelector(textElement) : textElement;

    if (dot) {
        dot.className = 'dot ' + state;
    }
    if (text) {
        text.textContent = msg || '';
    }
}

// ============================================================
//  10. RANGE SLIDER SYNC (Optional)
// ============================================================
function syncRangeSlider(rangeInput, displayElement, suffix) {
    const range = typeof rangeInput === 'string' ? document.querySelector(rangeInput) : rangeInput;
    const display = typeof displayElement === 'string' ? document.querySelector(displayElement) : displayElement;

    if (!range || !display) return;

    range.addEventListener('input', function () {
        display.textContent = this.value + (suffix || '');
    });

    // Initial sync
    display.textContent = range.value + (suffix || '');
}

// ============================================================
//  11. KEYBOARD SHORTCUT (Ctrl+K / Cmd+K)
// ============================================================
function registerShortcut(key, callback) {
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === key) {
            e.preventDefault();
            if (typeof callback === 'function') callback();
        }
        if (e.key === 'Escape') {
            if (typeof callback === 'function') callback('escape');
        }
    });
}

// ============================================================
//  12. GENERIC MODAL TOGGLE (Optional)
// ============================================================
function toggleModal(modalId, action) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (action === 'open' || (action === undefined && !modal.classList.contains('open'))) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// ============================================================
//  EXPOSE TO GLOBAL SCOPE (So all tools can use)
// ============================================================
window.showToast = showToast;
window.copyToClipboard = copyToClipboard;
window.downloadFile = downloadFile;
window.readFileAsText = readFileAsText;
window.readFileAsArrayBuffer = readFileAsArrayBuffer;
window.escapeHtml = escapeHtml;
window.formatFileSize = formatFileSize;
window.debounce = debounce;
window.initTabs = initTabs;
window.updateStatus = updateStatus;
window.syncRangeSlider = syncRangeSlider;
window.registerShortcut = registerShortcut;
window.toggleModal = toggleModal;