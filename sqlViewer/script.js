/**
 * ============================================================
 *  SQL VIEWER — Tool-Specific Logic Only
 *  ============================================================
 *  Common utilities (showToast, copyToClipboard, downloadFile, etc.)
 *  are in utils.js
 *  ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ============================================================
    //  DOM REFS
    // ============================================================
    const fileSelect = document.getElementById('fileSelect');
    const tableSelect = document.getElementById('tableSelect');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const deleteFileBtn = document.getElementById('deleteFileBtn');
    const deleteDropdown = document.getElementById('deleteDropdown');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const tableWrapper = document.getElementById('tableWrapper');
    const emptyState = document.getElementById('emptyState');
    const dropZone = document.getElementById('dropZone');
    const tableContainer = document.getElementById('tableContainer');
    const tableScrollWrapper = document.getElementById('tableScrollWrapper');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const rowCount = document.getElementById('rowCount');
    const colCount = document.getElementById('colCount');

    // ============================================================
    //  STATE
    // ============================================================
    let SQL = null;
    let dbFiles = [];
    let fileIdCounter = 0;
    let selectedFileId = null;
    let selectedTable = null;
    let isSqlJsReady = false;
    let allLoadedRows = [];
    let filteredRows = [];
    let currentColumns = [];
    let pkColumns = new Set();
    let currentOffset = 0;
    let hasMoreData = true;
    let isLoadingMore = false;
    let searchState = null;
    let sortState = null;
    let popupElement = null;
    const PAGE_SIZE = 1000;

    // ============================================================
    //  SQL.JS LOADER
    // ============================================================
    function loadSqlJs() {
        return new Promise((resolve, reject) => {
            function init() {
                if (!window.initSqlJs) {
                    reject(new Error('window.initSqlJs not available'));
                    return;
                }
                window.initSqlJs({
                    locateFile: function (filename) {
                        return 'https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/' + filename;
                    }
                }).then(resolve).catch(reject);
            }
            if (window.initSqlJs) {
                init();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.js';
            script.onload = function () {
                if (window.initSqlJs) init();
                else reject(new Error('window.initSqlJs not available after load'));
            };
            script.onerror = () => reject(new Error('Failed to load sql.js script'));
            document.head.appendChild(script);
        });
    }

    // ============================================================
    //  HELPERS
    // ============================================================
    function getFileById(id) {
        return dbFiles.find(f => f.id === id);
    }

    function getSelectedFile() {
        return getFileById(selectedFileId);
    }

    function isNumeric(val) {
        return !isNaN(parseFloat(val)) && isFinite(val);
    }

    // ============================================================
    //  UPDATE DELETE DROPDOWN
    // ============================================================
    function updateDeleteDropdown() {
        deleteDropdown.innerHTML = '';
        if (dbFiles.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'dropdown-empty';
            empty.textContent = 'No files to delete';
            deleteDropdown.appendChild(empty);
            return;
        }
        dbFiles.forEach(f => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                <i class="fas fa-file"></i>
                <span>${escapeHtml(f.name)}</span>
                <span class="file-size">${formatFileSize(f.size)}</span>
            `;
            item.addEventListener('click', function (e) {
                e.stopPropagation();
                deleteSpecificFile(f.id);
                deleteDropdown.classList.remove('open');
            });
            deleteDropdown.appendChild(item);
        });
    }

    // ============================================================
    //  DELETE FUNCTIONS
    // ============================================================
    function deleteSpecificFile(fileId) {
        const file = getFileById(fileId);
        if (!file) {
            showToast('File not found.', 'warning');
            return;
        }

        const idx = dbFiles.findIndex(f => f.id === file.id);
        if (idx !== -1) {
            dbFiles.splice(idx, 1);
            try { file.dbInstance.close(); } catch (e) { }
        }

        if (dbFiles.length > 0) {
            const latest = dbFiles[dbFiles.length - 1];
            selectedFileId = latest.id;
            selectedTable = latest.tables[0] || null;
        } else {
            selectedFileId = null;
            selectedTable = null;
        }

        updateSelects();
        updateDeleteDropdown();
        showToast('Deleted: ' + file.name, 'info');
    }

    function deleteSelectedFileDirect() {
        if (dbFiles.length === 0) {
            showToast('No file to delete.', 'warning');
            return;
        }
        const file = getSelectedFile();
        if (!file) {
            showToast('No file selected.', 'warning');
            return;
        }

        const doDelete = function () {
            const idx = dbFiles.findIndex(f => f.id === file.id);
            if (idx !== -1) {
                dbFiles.splice(idx, 1);
                try { file.dbInstance.close(); } catch (e) { }
            }
            if (dbFiles.length > 0) {
                const latest = dbFiles[dbFiles.length - 1];
                selectedFileId = latest.id;
                selectedTable = latest.tables[0] || null;
            } else {
                selectedFileId = null;
                selectedTable = null;
            }
            updateSelects();
            updateDeleteDropdown();
            showToast('Deleted: ' + file.name, 'info');
        };

        if (dbFiles.length === 1) {
            doDelete();
        } else {
            if (confirm('Delete "' + file.name + '"? This action cannot be undone.')) {
                doDelete();
            }
        }
    }

    // ============================================================
    //  UPDATE UI
    // ============================================================
    function updateSelects() {
        // File dropdown
        fileSelect.innerHTML = '';
        dbFiles.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name + ' (' + formatFileSize(f.size) + ')';
            fileSelect.appendChild(opt);
        });
        if (selectedFileId && getFileById(selectedFileId)) {
            fileSelect.value = selectedFileId;
        } else if (dbFiles.length > 0) {
            const latest = dbFiles[dbFiles.length - 1];
            fileSelect.value = latest.id;
            selectedFileId = latest.id;
        } else {
            selectedFileId = null;
        }

        const file = getSelectedFile();
        tableSelect.innerHTML = '';
        if (file && file.tables && file.tables.length > 0) {
            file.tables.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                tableSelect.appendChild(opt);
            });
            tableSelect.value = file.tables[0];
            selectedTable = file.tables[0];
        } else {
            selectedTable = null;
        }

        const hasFiles = dbFiles.length > 0;
        emptyState.style.display = hasFiles ? 'none' : 'flex';
        tableContainer.classList.toggle('active', hasFiles);

        if (selectedFileId && selectedTable) {
            loadTableData(selectedFileId, selectedTable);
        } else {
            clearTable();
        }

        updateStatus('idle', '');
        updateDeleteDropdown();
    }

    // ============================================================
    //  LOAD TABLE DATA
    // ============================================================
    function loadTableData(fileId, tableName) {
        const file = getFileById(fileId);
        if (!file || !file.dbInstance) {
            showToast('Database not found.', 'error');
            return;
        }

        // Reset state
        allLoadedRows = [];
        filteredRows = [];
        currentColumns = [];
        pkColumns = new Set();
        currentOffset = 0;
        hasMoreData = true;
        searchState = null;
        sortState = null;
        closePopup();

        // Get PK info
        try {
            const pkStmt = file.dbInstance.prepare(`PRAGMA table_info("${tableName}")`);
            while (pkStmt.step()) {
                const row = pkStmt.getAsObject();
                if (row.pk === 1) pkColumns.add(row.name);
            }
            pkStmt.free();
        } catch (e) { }

        // Load first page
        loadMoreData(fileId, tableName, true);
    }

    // ============================================================
    //  LOAD MORE DATA (Pagination)
    // ============================================================
    function loadMoreData(fileId, tableName, reset = false) {
        if (isLoadingMore) return;
        const file = getFileById(fileId);
        if (!file || !file.dbInstance) return;
        if (!hasMoreData && !reset) return;

        isLoadingMore = true;
        loadMoreBtn.disabled = true;
        updateStatus('idle', 'Loading...');

        try {
            const offset = reset ? 0 : currentOffset;
            const stmt = file.dbInstance.prepare(
                `SELECT * FROM "${tableName}" LIMIT ${PAGE_SIZE} OFFSET ${offset}`
            );
            const columns = stmt.getColumnNames();
            const rows = [];
            while (stmt.step()) rows.push(stmt.getAsObject());
            stmt.free();

            if (reset) {
                currentColumns = columns;
                allLoadedRows = rows;
                currentOffset = rows.length;
            } else {
                allLoadedRows = allLoadedRows.concat(rows);
                currentOffset += rows.length;
            }

            hasMoreData = rows.length === PAGE_SIZE;

            // Apply filters
            applyFilters();

            if (reset) colCount.textContent = columns.length;

            if (rows.length === 0 && reset) {
                showToast('Table is empty.', 'warning');
                clearTable();
                updateStatus('idle', 'Table is empty');
            } else {
                const total = allLoadedRows.length;
                const showing = filteredRows.length;
                updateStatus('valid', `Loaded ${total} rows${hasMoreData ? ' (showing ' + showing + ' filtered)' : ''}`);
            }

        } catch (err) {
            showToast('Error loading data: ' + err.message, 'error');
            updateStatus('invalid', 'Error: ' + err.message);
        } finally {
            isLoadingMore = false;
            loadMoreBtn.disabled = false;
            updateLoadMoreBtn();
        }
    }

    // ============================================================
    //  APPLY FILTERS (Search + Sort)
    // ============================================================
    function applyFilters() {
        let data = [...allLoadedRows];

        // Search
        if (searchState && searchState.searchText.trim() !== '') {
            const col = searchState.column;
            const text = searchState.searchText.trim().toLowerCase();
            data = data.filter(row => {
                const val = row[col];
                if (val === null || val === undefined) return false;
                return String(val).toLowerCase().includes(text);
            });
        }

        // Sort
        if (sortState) {
            const col = sortState.column;
            const dir = sortState.direction;
            data.sort((a, b) => {
                let va = a[col];
                let vb = b[col];

                if (va === null || va === undefined) return 1;
                if (vb === null || vb === undefined) return -1;

                const na = parseFloat(va);
                const nb = parseFloat(vb);
                if (!isNaN(na) && !isNaN(nb)) {
                    return dir === 'asc' ? na - nb : nb - na;
                }

                const sa = String(va);
                const sb = String(vb);
                return dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
            });
        }

        filteredRows = data;
        renderTable(filteredRows, currentColumns);
        rowCount.textContent = filteredRows.length + (hasMoreData ? '+' : '');

        updateLoadMoreBtn();
    }

    // ============================================================
    //  UPDATE LOAD MORE BUTTON
    // ============================================================
    function updateLoadMoreBtn() {
        if (hasMoreData && allLoadedRows.length > 0) {
            loadMoreBtn.textContent = 'Load Next ' + PAGE_SIZE + ' Rows';
            loadMoreBtn.disabled = isLoadingMore;
            loadMoreBtn.classList.remove('hidden');
            loadMoreContainer.style.display = 'flex';
        } else {
            loadMoreBtn.classList.add('hidden');
            loadMoreContainer.style.display = 'none';
        }
    }

    // ============================================================
    //  RENDER TABLE
    // ============================================================
    function renderTable(rows, columns) {
        if (!columns || columns.length === 0) {
            tableScrollWrapper.innerHTML =
                `<div style="padding:2rem;text-align:center;color:var(--text-muted);">
                    <i class="fas fa-table" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>
                    No columns found
                </div>`;
            return;
        }

        let html = '<table class="result-table"><thead><tr>';
        columns.forEach(col => {
            const isPk = pkColumns.has(col);
            const pkClass = isPk ? 'pk-column' : '';
            const pkIcon = isPk ? '<i class="fas fa-key" style="font-size:0.65rem;color:var(--pk-color);margin-left:0.2rem;"></i>' : '';
            html += `<th class="${pkClass}" data-column="${escapeHtml(col)}" title="${escapeHtml(col)}">
                        ${escapeHtml(col)}${pkIcon}
                    </th>`;
        });
        html += '</tr></thead><tbody>';

        if (!rows || rows.length === 0) {
            html += `<tr><td colspan="${columns.length}" style="text-align:center;padding:2rem;color:var(--text-muted);">
                        <div style="font-size:1.2rem;margin-bottom:0.3rem;"><i class="fas fa-search"></i></div>
                        ${allLoadedRows.length === 0 ? 'Table is empty' : 'No matching rows found'}
                        ${allLoadedRows.length > 0 ? '<div style="font-size:0.7rem;margin-top:0.3rem;color:var(--text-muted);">Try clearing the search or resetting the filter</div>' : ''}
                    </td></tr>`;
        } else {
            rows.forEach((row, idx) => {
                html += '<tr data-row-idx="' + idx + '">';
                columns.forEach(col => {
                    const val = row[col];
                    let display = (val === null || val === undefined) ? 'null' : String(val);
                    const cls = (val === null || val === undefined) ? 'null' : '';
                    const isPk = pkColumns.has(col);
                    const pkClass = isPk ? 'pk-column' : '';
                    const escaped = escapeHtml(display);
                    html += `<td class="${cls} ${pkClass}">
                                <div class="cell-content" title="${escaped}">${escaped}</div>
                            </td>`;
                });
                html += '</tr>';
            });
        }

        html += '</tbody></table>';
        tableScrollWrapper.innerHTML = html;

        // Column click events for popup
        document.querySelectorAll('.result-table th').forEach(th => {
            th.addEventListener('click', function (e) {
                const column = this.dataset.column;
                if (column) {
                    openPopupForColumn(this, column, e);
                }
            });
        });

        // Copy cell on click
        document.querySelectorAll('.result-table td .cell-content').forEach(cell => {
            cell.addEventListener('click', function (e) {
                e.stopPropagation();
                const text = this.textContent;
                if (text && text !== 'null') {
                    copyToClipboard(text, 'Copied: ' + text.substring(0, 50) + (text.length > 50 ? '...' : ''));
                }
            });
        });

        // Copy row on double-click
        document.querySelectorAll('.result-table tbody tr').forEach(tr => {
            tr.addEventListener('dblclick', function (e) {
                const cells = this.querySelectorAll('td .cell-content');
                const values = [];
                cells.forEach(cell => {
                    const text = cell.textContent;
                    if (text !== 'null') {
                        values.push(text);
                    } else {
                        values.push('');
                    }
                });
                const rowText = values.join('\t');
                copyToClipboard(rowText, 'Row copied (' + values.length + ' columns)');
            });
        });

        updateLoadMoreBtn();
    }

    // ============================================================
    //  CLEAR TABLE
    // ============================================================
    function clearTable() {
        tableScrollWrapper.innerHTML =
            `<div style="padding:2rem;text-align:center;color:var(--text-muted);">Select a table to view data</div>`;
        rowCount.textContent = '0';
        colCount.textContent = '0';
        allLoadedRows = [];
        filteredRows = [];
        currentColumns = [];
        pkColumns = new Set();
        hasMoreData = true;
        searchState = null;
        sortState = null;
        closePopup();
        loadMoreBtn.classList.add('hidden');
        loadMoreContainer.style.display = 'none';
        tableContainer.classList.remove('active');
        updateStatus('idle', '');
    }

    // ============================================================
    //  UPDATE STATUS
    // ============================================================
    function updateStatus(state, msg) {
        statusDot.className = 'dot ' + state;
        statusText.textContent = msg || '';
    }

    // ============================================================
    //  COLUMN POPUP
    // ============================================================
    function openPopupForColumn(thElement, columnName, event) {
        closePopup();

        const rect = thElement.getBoundingClientRect();
        const popup = document.createElement('div');
        popup.className = 'column-popup open';
        popup.id = 'columnPopup';

        let left = rect.left;
        let top = rect.bottom + 6;
        const popupWidth = 280;
        const popupHeight = 220;
        if (left + popupWidth > window.innerWidth - 10) {
            left = window.innerWidth - popupWidth - 10;
        }
        if (left < 10) left = 10;
        if (top + popupHeight > window.innerHeight - 10) {
            top = rect.top - popupHeight - 6;
        }
        if (top < 10) top = 10;

        popup.style.left = left + 'px';
        popup.style.top = top + 'px';

        const currentSearch = searchState && searchState.column === columnName ? searchState.searchText : '';
        const currentSort = sortState && sortState.column === columnName ? sortState.direction : null;

        popup.innerHTML = `
            <div class="popup-title">
                <i class="fas fa-filter"></i> 
                <span class="col-name">${escapeHtml(columnName)}</span>
                ${pkColumns.has(columnName) ? ' <span style="color:var(--pk-color);font-size:0.6rem;">🔑</span>' : ''}
            </div>
            <div class="popup-search">
                <input type="text" id="popupSearchInput" placeholder="Search in this column..." value="${escapeHtml(currentSearch)}" />
                <button class="apply-btn" id="popupApplyBtn"><i class="fas fa-check"></i> Apply</button>
            </div>
            <div class="popup-sort">
                <button class="sort-btn ${currentSort === 'asc' ? 'active' : ''}" data-direction="asc">
                    <i class="fas fa-sort-up"></i> A → Z
                </button>
                <button class="sort-btn ${currentSort === 'desc' ? 'active' : ''}" data-direction="desc">
                    <i class="fas fa-sort-down"></i> Z → A
                </button>
                <button class="sort-btn" data-direction="none" style="border-color:var(--border-color-light);color:var(--text-muted);">
                    <i class="fas fa-undo"></i> Clear Sort
                </button>
            </div>
            <div class="popup-actions">
                <button class="reset-btn" id="popupResetBtn"><i class="fas fa-undo-alt"></i> Reset All</button>
                <span class="info-text"><i class="fas fa-info-circle"></i> Apply or Enter</span>
            </div>
        `;

        document.body.appendChild(popup);
        popupElement = popup;

        const input = document.getElementById('popupSearchInput');
        const applyBtn = document.getElementById('popupApplyBtn');
        const resetBtn = document.getElementById('popupResetBtn');

        setTimeout(() => input.focus(), 50);

        function applySearch() {
            const searchText = input.value.trim();
            if (searchText === '') {
                if (searchState && searchState.column === columnName) {
                    searchState = null;
                }
            } else {
                searchState = {
                    column: columnName,
                    searchText: searchText
                };
            }
            applyFilters();
            closePopup();
            showToast('Search applied: "' + (searchText || 'cleared') + '" on ' + columnName, 'info');
        }

        function applySort(direction) {
            if (direction === 'none') {
                if (sortState && sortState.column === columnName) {
                    sortState = null;
                }
            } else {
                sortState = {
                    column: columnName,
                    direction: direction
                };
            }
            applyFilters();
            closePopup();
            const dirText = direction === 'asc' ? 'A→Z' : direction === 'desc' ? 'Z→A' : 'cleared';
            showToast('Sorted: ' + columnName + ' (' + dirText + ')', 'info');
        }

        applyBtn.addEventListener('click', applySearch);

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applySearch();
            }
        });

        popup.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const dir = this.dataset.direction;
                applySort(dir);
            });
        });

        resetBtn.addEventListener('click', function () {
            if (searchState && searchState.column === columnName) {
                searchState = null;
            }
            if (sortState && sortState.column === columnName) {
                sortState = null;
            }
            input.value = '';
            applyFilters();
            closePopup();
            showToast('Reset for column: ' + columnName, 'info');
        });

        setTimeout(() => {
            document.addEventListener('click', closePopupOutside);
        }, 10);

        document.addEventListener('keydown', popupEscHandler);

        popup.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

    function closePopup() {
        if (popupElement) {
            popupElement.remove();
            popupElement = null;
        }
        document.removeEventListener('click', closePopupOutside);
        document.removeEventListener('keydown', popupEscHandler);
    }

    function closePopupOutside(e) {
        if (popupElement && !popupElement.contains(e.target)) {
            closePopup();
        }
    }

    function popupEscHandler(e) {
        if (e.key === 'Escape') {
            closePopup();
        }
    }

    // ============================================================
    //  ADD DATABASE FILE
    // ============================================================
    async function addDatabaseFile(arrayBuffer, fileName) {
        try {
            if (!isSqlJsReady) {
                showToast('SQL engine not ready. Please wait.', 'warning');
                return false;
            }

            const uint8Array = new Uint8Array(arrayBuffer);
            const db = new SQL.Database(uint8Array);

            const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view') ORDER BY name");
            const tables = [];
            while (stmt.step()) {
                const row = stmt.getAsObject();
                tables.push(row.name);
            }
            stmt.free();

            if (tables.length === 0) {
                showToast('No tables found in this database.', 'warning');
                return false;
            }

            const fileObj = {
                id: ++fileIdCounter,
                name: fileName,
                size: arrayBuffer.byteLength,
                dbInstance: db,
                tables: tables
            };

            dbFiles.push(fileObj);
            selectedFileId = fileObj.id;
            selectedTable = tables[0];

            updateSelects();
            showToast('Database loaded: ' + fileName + ' (' + tables.length + ' tables)', 'success');

            if (arrayBuffer.byteLength > 50 * 1048576) {
                showToast('Large file (>50 MB). Performance may be slow.', 'warning');
            }

            return true;

        } catch (err) {
            showToast('Failed to load database: ' + err.message, 'error');
            console.error(err);
            return false;
        }
    }

    // ============================================================
    //  EXPORT CSV
    // ============================================================
    function exportCsv() {
        const file = getSelectedFile();
        if (!file) {
            showToast('No database loaded.', 'warning');
            return;
        }
        if (!selectedTable) {
            showToast('No table selected.', 'warning');
            return;
        }

        try {
            const stmt = file.dbInstance.prepare(`SELECT * FROM "${selectedTable}"`);
            const cols = stmt.getColumnNames();
            const rows = [];
            while (stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            stmt.free();

            if (rows.length === 0) {
                showToast('Table is empty.', 'warning');
                return;
            }

            let csv = cols.join(',') + '\n';
            rows.forEach(row => {
                const vals = cols.map(col => {
                    let val = row[col];
                    if (val === null || val === undefined) return '';
                    if (typeof val === 'string') {
                        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                            return '"' + val.replace(/"/g, '""') + '"';
                        }
                        return val;
                    }
                    if (typeof val === 'object') {
                        return '"' + JSON.stringify(val).replace(/"/g, '""') + '"';
                    }
                    return String(val);
                });
                csv += vals.join(',') + '\n';
            });

            downloadFile(csv, selectedTable + '.csv', 'text/csv');
            showToast('CSV exported! (' + rows.length + ' rows)', 'success');

        } catch (err) {
            showToast('Export failed: ' + err.message, 'error');
        }
    }

    // ============================================================
    //  EXPORT JSON
    // ============================================================
    function exportJson() {
        const file = getSelectedFile();
        if (!file) {
            showToast('No database loaded.', 'warning');
            return;
        }
        if (!selectedTable) {
            showToast('No table selected.', 'warning');
            return;
        }

        try {
            const stmt = file.dbInstance.prepare(`SELECT * FROM "${selectedTable}"`);
            const rows = [];
            while (stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            stmt.free();

            if (rows.length === 0) {
                showToast('Table is empty.', 'warning');
                return;
            }

            const json = JSON.stringify(rows, null, 2);
            downloadFile(json, selectedTable + '.json', 'application/json');
            showToast('JSON exported! (' + rows.length + ' rows)', 'success');

        } catch (err) {
            showToast('Export failed: ' + err.message, 'error');
        }
    }

    // ============================================================
    //  DRAG & DROP
    // ============================================================
    let dragCounter = 0;

    function handleDragEnter(e) {
        e.preventDefault();
        dragCounter++;
        if (dragCounter === 1) tableWrapper.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) tableWrapper.classList.remove('dragover');
    }

    function handleDragOver(e) { e.preventDefault(); }

    function handleDrop(e) {
        e.preventDefault();
        dragCounter = 0;
        tableWrapper.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        (async function processFiles() {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const ext = file.name.split('.').pop().toLowerCase();
                if (!['db', 'sqlite', 'sqlite3'].includes(ext)) {
                    showToast('Unsupported file: ' + file.name + '. Please upload .db, .sqlite, or .sqlite3', 'warning');
                    continue;
                }
                const data = await readFileAsArrayBuffer(file);
                await addDatabaseFile(data, file.name);
            }
        })();
    }

    // ============================================================
    //  EVENT LISTENERS
    // ============================================================
    deleteFileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (dbFiles.length === 0) {
            showToast('No files to delete.', 'warning');
            return;
        }
        deleteDropdown.classList.toggle('open');
        updateDeleteDropdown();
    });

    document.addEventListener('click', function () {
        deleteDropdown.classList.remove('open');
    });

    deleteSelectedBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteSelectedFileDirect();
    });

    fileSelect.addEventListener('change', function () {
        const id = parseInt(this.value);
        if (id && getFileById(id)) {
            selectedFileId = id;
            const file = getSelectedFile();
            selectedTable = file.tables[0] || null;
            updateSelects();
        }
    });

    tableSelect.addEventListener('change', function () {
        selectedTable = this.value;
        if (selectedFileId && selectedTable) {
            loadTableData(selectedFileId, selectedTable);
        }
    });

    uploadBtn.addEventListener('click', function () {
        fileInput.click();
    });

    dropZone.addEventListener('click', function () {
        fileInput.click();
    });

    fileInput.addEventListener('change', async function (e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const data = await readFileAsArrayBuffer(file);
            await addDatabaseFile(data, file.name);
        }
        fileInput.value = '';
    });

    exportCsvBtn.addEventListener('click', exportCsv);
    exportJsonBtn.addEventListener('click', exportJson);

    loadMoreBtn.addEventListener('click', function () {
        const file = getSelectedFile();
        if (file && selectedTable) {
            loadMoreData(file.id, selectedTable, false);
        }
    });

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    // ============================================================
    //  INIT
    // ============================================================
    (async function init() {
        try {
            const sqlModule = await loadSqlJs();
            SQL = sqlModule;
            isSqlJsReady = true;
            console.log('✅ SQL.js initialized successfully.');
            updateStatus('idle', '');
        } catch (err) {
            console.error('❌ SQL.js init failed:', err);
            updateStatus('invalid', 'SQL.js load failed');
            showToast('Failed to load SQL engine. Please refresh.', 'error');
        }
        updateSelects();
        updateDeleteDropdown();
    })();

});