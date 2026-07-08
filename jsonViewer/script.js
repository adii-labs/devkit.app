/**
 * ============================================================
 *  JSON VIEWER — Tool-Specific Logic Only
 *  ============================================================
 *  Common utilities (showToast, copyToClipboard, downloadFile, etc.)
 *  are in utils.js
 *  ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {

    // ============================================================
    //  DOM REFS
    // ============================================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = {
        editor: document.getElementById('tab-editor'),
        code: document.getElementById('tab-code'),
        tree: document.getElementById('tab-tree')
    };

    const jsonInput = document.getElementById('jsonInput');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const charCount = document.getElementById('charCount');
    const lineCount = document.getElementById('lineCount');
    const codeDisplay = document.getElementById('codeDisplay');
    const treeDisplay = document.getElementById('tree-display');
    const fileInput = document.getElementById('fileInput');

    // ============================================================
    //  STATE
    // ============================================================
    let formattedJSON = '';
    let parsedData = null;
    let isValidJSON = false;

    // ============================================================
    //  TAB SWITCHING
    // ============================================================
    tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tabName = btn.dataset.tab;
            Object.keys(tabContents).forEach(function (key) {
                tabContents[key].classList.toggle('active', key === tabName);
            });

            const raw = jsonInput.value.trim();
            if (tabName === 'code' && raw !== '') {
                try {
                    const data = JSON.parse(raw);
                    const formatted = JSON.stringify(data, null, 2);
                    renderCode(formatted);
                } catch (e) {
                    document.getElementById('codeDisplay').innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle" style="color:var(--accent-3);"></i>
                            <p><strong>Invalid JSON</strong><br>Please fix errors in the Editor tab.</p>
                        </div>
                    `;
                }
            }
            if (tabName === 'tree' && raw !== '') {
                try {
                    const data = JSON.parse(raw);
                    renderTree(data);
                } catch (e) {
                    document.getElementById('tree-display').innerHTML =
                        `<span style="color:var(--accent-3);">Invalid JSON: ${e.message}</span>`;
                }
            }
            if (tabName === 'code' && raw === '') {
                document.getElementById('codeDisplay').innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-code"></i>
                        <p>No JSON to display. Paste some JSON in the <strong>Editor</strong> tab.</p>
                    </div>
                `;
            }
            if (tabName === 'tree' && raw === '') {
                document.getElementById('tree-display').innerHTML =
                    `<span style="color:#6b768f;">Output will appear here…</span>`;
            }
        });
    });

    // ============================================================
    //  UPDATE STATUS
    // ============================================================
    function updateStatus() {
        const raw = jsonInput.value;
        charCount.textContent = raw.length;
        lineCount.textContent = raw.split('\n').length;

        if (raw.trim() === '') {
            statusDot.className = 'dot idle';
            statusText.textContent = 'Ready';
            isValidJSON = false;
            parsedData = null;
            formattedJSON = '';
            return;
        }

        try {
            parsedData = JSON.parse(raw);
            isValidJSON = true;
            formattedJSON = JSON.stringify(parsedData, null, 2);
            statusDot.className = 'dot valid';
            statusText.textContent = '✓ Valid JSON';
        } catch (e) {
            isValidJSON = false;
            parsedData = null;
            formattedJSON = '';
            statusDot.className = 'dot invalid';
            statusText.textContent = '✗ ' + e.message;
        }
    }

    jsonInput.addEventListener('input', function () {
        updateStatus();
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            const tabName = activeTab.dataset.tab;
            const raw = jsonInput.value.trim();
            if (tabName === 'code') {
                if (raw !== '' && isValidJSON) {
                    renderCode(formattedJSON);
                } else if (raw !== '' && !isValidJSON) {
                    document.getElementById('codeDisplay').innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle" style="color:var(--accent-3);"></i>
                            <p><strong>Invalid JSON</strong><br>Please fix errors in the Editor tab.</p>
                        </div>
                    `;
                } else {
                    document.getElementById('codeDisplay').innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-code"></i>
                            <p>No JSON to display. Paste some JSON in the <strong>Editor</strong> tab.</p>
                        </div>
                    `;
                }
            }
            if (tabName === 'tree') {
                if (raw !== '' && isValidJSON) {
                    renderTree(parsedData);
                } else if (raw !== '' && !isValidJSON) {
                    document.getElementById('tree-display').innerHTML =
                        `<span style="color:var(--accent-3);">Invalid JSON: ${statusText.textContent.replace('✗ ', '')}</span>`;
                } else {
                    document.getElementById('tree-display').innerHTML =
                        `<span style="color:#6b768f;">Output will appear here…</span>`;
                }
            }
        }
    });

    // ============================================================
    //  RENDER CODE (Syntax Highlighting)
    // ============================================================
    function renderCode(jsonStr) {
        if (!jsonStr || jsonStr.trim() === '') {
            codeDisplay.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <p>No JSON to display. Paste some JSON in the <strong>Editor</strong> tab.</p>
                </div>
            `;
            return;
        }
        const highlighted = syntaxHighlight(jsonStr);
        codeDisplay.innerHTML = highlighted;
    }

    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(
            /("(?:[^"\\]|\\.)*")(?=\s*:)|("(?:[^"\\]|\\.)*")|(\b\d+\.?\d*\b)|(\btrue\b|\bfalse\b|\bnull\b)|([{}\[\],:])/g,
            function (match, key, str, num, bool, punct) {
                if (key) return '<span class="json-key">' + key + '</span>';
                if (str) return '<span class="json-string">' + str + '</span>';
                if (num) return '<span class="json-number">' + num + '</span>';
                if (bool) return '<span class="json-boolean">' + bool + '</span>';
                if (punct) {
                    if (punct === ':' || punct === ',') return '<span class="json-comma">' + punct + '</span>';
                    return '<span class="json-bracket">' + punct + '</span>';
                }
                return match;
            }
        );
    }

    // ============================================================
    //  RENDER TREE
    // ============================================================
    function renderTree(data) {
        const container = document.getElementById('tree-display');
        container.innerHTML = '';
        const tree = renderTreeNode(data);
        container.appendChild(tree);
    }

    function renderTreeNode(data, key = null) {
        const node = document.createElement('div');
        node.className = 'tree-node';

        if (data !== null && typeof data === 'object') {
            const isArray = Array.isArray(data);
            const keys = Object.keys(data);
            const count = keys.length;

            const bracketText = isArray ? `[${count}]` : `{${count}}`;
            const typeLabel = isArray ? 'array' : 'object';

            const header = document.createElement('div');
            header.className = 'node-header';

            const arrow = document.createElement('span');
            arrow.className = 'toggle-arrow';
            arrow.textContent = '▼';

            let keyHTML = '';
            if (key !== null) {
                keyHTML = `<span class="key">${key}</span><span class="separator">: </span>`;
            }

            header.innerHTML = `
                <span class="bracket-info">${typeLabel}</span>
                ${keyHTML}
                <span class="bracket-info">${bracketText}</span>
            `;
            header.prepend(arrow);

            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children-container';

            keys.forEach(k => {
                childrenContainer.appendChild(renderTreeNode(data[k], k));
            });

            arrow.addEventListener('click', (e) => {
                e.stopPropagation();
                if (childrenContainer.classList.contains('hidden')) {
                    childrenContainer.classList.remove('hidden');
                    arrow.classList.remove('collapsed');
                } else {
                    childrenContainer.classList.add('hidden');
                    arrow.classList.add('collapsed');
                }
            });

            node.appendChild(header);
            node.appendChild(childrenContainer);

        } else {
            let valueType = typeof data;
            let className = 'string';
            let displayValue = data;

            if (data === null) {
                className = 'null';
                displayValue = 'null';
            } else if (valueType === 'number') {
                className = 'number';
            } else if (valueType === 'boolean') {
                className = 'boolean';
            } else if (valueType === 'string') {
                displayValue = `"${data}"`;
            }

            node.innerHTML = `
                ${key !== null ? `<span class="key">${key}</span><span class="separator">: </span>` : ''}
                <span class="${className}">${displayValue}</span>
            `;
        }

        return node;
    }

    // ============================================================
    //  UPLOAD
    // ============================================================
    document.getElementById('uploadBtn').addEventListener('click', function () {
        fileInput.click();
    });

    fileInput.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const content = await readFileAsText(file);
            const data = JSON.parse(content);
            const formatted = JSON.stringify(data, null, 2);
            jsonInput.value = formatted;
            updateStatus();
            renderCode(formatted);
            renderTree(data);
            showToast('File loaded: ' + file.name, 'success');

            tabBtns.forEach(function (b) {
                b.classList.remove('active');
                if (b.dataset.tab === 'code') b.classList.add('active');
            });
            Object.keys(tabContents).forEach(function (key) {
                tabContents[key].classList.toggle('active', key === 'code');
            });
        } catch (err) {
            showToast('Invalid JSON file: ' + err.message, 'error');
        }
        fileInput.value = '';
    });

    // ============================================================
    //  DOWNLOAD
    // ============================================================
    document.getElementById('downloadBtn').addEventListener('click', function () {
        if (!isValidJSON) {
            showToast('Invalid JSON. Please fix errors before downloading.', 'error');
            return;
        }
        const content = formattedJSON || jsonInput.value.trim();
        if (!content) {
            showToast('Nothing to download. Paste some JSON first.', 'warning');
            return;
        }
        downloadFile(content, 'formatted.json', 'application/json');
        showToast('File downloaded!', 'success');
    });

    // ============================================================
    //  COPY
    // ============================================================
    document.getElementById('copyBtn').addEventListener('click', function () {
        if (!isValidJSON) {
            showToast('Invalid JSON. Please fix errors before copying.', 'error');
            return;
        }
        const content = formattedJSON || jsonInput.value.trim();
        if (!content) {
            showToast('Nothing to copy. Paste some JSON first.', 'warning');
            return;
        }
        copyToClipboard(content, 'Copied to clipboard!');
    });

    // ============================================================
    //  CLEAR
    // ============================================================
    document.getElementById('clearBtn').addEventListener('click', function () {
        jsonInput.value = '';
        updateStatus();
        formattedJSON = '';
        parsedData = null;

        document.getElementById('codeDisplay').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-code"></i>
                <p>No JSON to display. Paste some JSON in the <strong>Editor</strong> tab.</p>
            </div>
        `;
        document.getElementById('tree-display').innerHTML =
            `<span style="color:#6b768f;">Output will appear here…</span>`;

        tabBtns.forEach(function (b) {
            b.classList.remove('active');
            if (b.dataset.tab === 'editor') b.classList.add('active');
        });
        Object.keys(tabContents).forEach(function (key) {
            tabContents[key].classList.toggle('active', key === 'editor');
        });

        showToast('Cleared!', 'info');
    });

    // ============================================================
    //  INIT
    // ============================================================
    updateStatus();
    renderCode(formattedJSON);
    renderTree(parsedData);

});