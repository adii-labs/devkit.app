/**
 * ============================================================
 *  QR CODE GENERATOR — Tool-Specific Logic Only
 *  ============================================================
 *  Common utilities (showToast, copyToClipboard, downloadFile,
 *  readFileAsArrayBuffer, etc.) are in utils.js
 *  ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    if (typeof QRCodeStyling === 'undefined') {
        alert('QRCodeStyling library failed to load. Please check your internet connection and refresh.');
        return;
    }

    // ============================================================
    //  DOM REFS
    // ============================================================
    const qrType = document.getElementById('qrType');
    const dynamicFields = document.getElementById('dynamicFields');
    const resultCanvas = document.getElementById('resultCanvas');
    const resultPlaceholder = document.getElementById('resultPlaceholder');

    const fgColor = document.getElementById('fgColor');
    const bgColor = document.getElementById('bgColor');
    const dotsType = document.getElementById('dotsType');
    const cornersDotsType = document.getElementById('cornersDotsType');
    const borderColor = document.getElementById('borderColor');
    const borderWidth = document.getElementById('borderWidth');
    const borderRadius = document.getElementById('borderRadius');
    const bordergap = document.getElementById('bordergap');
    const logoSize = document.getElementById('logoSize');
    const logoSizeVal = document.getElementById('logoSizeVal');
    const iconGrid = document.getElementById('iconGrid');

    const defaultResetBtn = document.getElementById('defaultResetBtn');
    const presetsBtn = document.getElementById('presetsBtn');
    const generateBtn = document.querySelector('.generate-btn');

    const presetModal = document.getElementById('presetModal');
    const presetGrid = document.getElementById('presetGrid');
    const closePresetBtn = document.getElementById('closePresetBtn');

    const downloadOptions = document.getElementById('downloadOptions');
    const downloadBtns = document.querySelectorAll('.download-options .action-btn[data-format]');
    const copyResultBtn = document.getElementById('copyResultBtn');

    // ============================================================
    //  STATE
    // ============================================================
    let currentLogoData = null;
    let selectedIcon = 'none';
    let isLogoUploaded = false;
    let isGenerated = false;
    let lastRawQR = null;
    let lastFullImage = null;
    let generateTimer = null;

    const dummyData = 'https://devkit.app';

    // ============================================================
    //  FIELD CONFIGS
    // ============================================================
    const fieldConfigs = {
        url: {
            icon: 'link',
            inputs: [{ id: 'urlInput', label: 'Website URL', type: 'text', placeholder: 'https://example.com' }]
        },
        text: {
            icon: 'none',
            inputs: [{ id: 'textInput', label: 'Plain Text', type: 'text', placeholder: 'Enter your text…' }]
        },
        wifi: {
            icon: 'wifi',
            inputs: [
                { id: 'wifiSSID', label: 'WiFi Name (SSID)', type: 'text', placeholder: 'MyWiFi' },
                { id: 'wifiPassword', label: 'Password', type: 'password', placeholder: '********' },
                { id: 'wifiEncryption', label: 'Encryption', type: 'select', options: ['WPA3', 'WPA/WPA2', 'WEP', 'None'] }
            ]
        },
        upi: {
            icon: 'credit-card',
            inputs: [
                { id: 'upiId', label: 'UPI ID', type: 'text', placeholder: 'merchant@bank' },
                { id: 'upiName', label: 'Payee Name (optional)', type: 'text', placeholder: 'Mr. Sharma' },
                { id: 'upiAmount', label: 'Amount (optional)', type: 'number', placeholder: '100.00' }
            ]
        },
        email: {
            icon: 'envelope',
            inputs: [
                { id: 'emailAddr', label: 'Email Address', type: 'email', placeholder: 'user@example.com' },
                { id: 'emailSubject', label: 'Subject (optional)', type: 'text', placeholder: 'Hello' },
                { id: 'emailBody', label: 'Body (optional)', type: 'text', placeholder: 'Your message…' }
            ]
        },
        phone: {
            icon: 'phone',
            inputs: [{ id: 'phoneInput', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210' }]
        },
        sms: {
            icon: 'comment',
            inputs: [
                { id: 'smsNumber', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210' },
                { id: 'smsMessage', label: 'Message (optional)', type: 'text', placeholder: 'Hello!' }
            ]
        },
        vcard: {
            icon: 'user',
            inputs: [
                { id: 'vcardName', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                { id: 'vcardPhone', label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' },
                { id: 'vcardEmail', label: 'Email', type: 'email', placeholder: 'john@example.com' },
                { id: 'vcardCompany', label: 'Company (optional)', type: 'text', placeholder: 'Acme Inc.' },
                { id: 'vcardAddress', label: 'Address (optional)', type: 'text', placeholder: '123 Main St' }
            ]
        },
        geo: {
            icon: 'map',
            inputs: [
                { id: 'geoLat', label: 'Latitude', type: 'number', placeholder: '28.6139' },
                { id: 'geoLng', label: 'Longitude', type: 'number', placeholder: '77.2090' }
            ]
        },
        calendar: {
            icon: 'calendar',
            inputs: [
                { id: 'calTitle', label: 'Event Title', type: 'text', placeholder: 'Meeting' },
                { id: 'calDate', label: 'Date', type: 'date' },
                { id: 'calTime', label: 'Time', type: 'time' },
                { id: 'calLocation', label: 'Location (optional)', type: 'text', placeholder: 'Conference Room' }
            ]
        }
    };

    // ============================================================
    //  PRESETS
    // ============================================================
    const presets = {
        'Default': { fg: '#000000', bg: '#ffffff', dotsType: 'rounded', cornersDotsType: 'extra-rounded', borderColor: '#000000', borderWidth: '0', borderRadius: '0', bordergap: '4' },
        'Cyberpunk': { fg: '#ff00ff', bg: '#0a0a1a', dotsType: 'dots', cornersDotsType: 'extra-rounded', borderColor: '#ff00ff', borderWidth: '2', borderRadius: '8', bordergap: '6' },
        'Minimal': { fg: '#222222', bg: '#f5f5f5', dotsType: 'square', cornersDotsType: 'square', borderColor: '#cccccc', borderWidth: '1', borderRadius: '0', bordergap: '8' },
        'Nature': { fg: '#2e7d32', bg: '#e8f5e9', dotsType: 'rounded', cornersDotsType: 'extra-rounded', borderColor: '#2e7d32', borderWidth: '2', borderRadius: '10', bordergap: '6' },
        'Vintage': { fg: '#5d4037', bg: '#efebe9', dotsType: 'classy', cornersDotsType: 'rounded', borderColor: '#8d6e63', borderWidth: '2', borderRadius: '6', bordergap: '6' },
        'Dark Mode': { fg: '#e0e0e0', bg: '#1a1a2e', dotsType: 'rounded', cornersDotsType: 'extra-rounded', borderColor: '#6c5ce7', borderWidth: '2', borderRadius: '8', bordergap: '4' },
        'Neon': { fg: '#00ffcc', bg: '#0d0d1a', dotsType: 'dots', cornersDotsType: 'extra-rounded', borderColor: '#00ffcc', borderWidth: '2', borderRadius: '12', bordergap: '4' },
        'Paper': { fg: '#3e2723', bg: '#fff8e1', dotsType: 'square', cornersDotsType: 'square', borderColor: '#d7ccc8', borderWidth: '1', borderRadius: '4', bordergap: '6' }
    };

    // ============================================================
    //  ICONS
    // ============================================================
    const uiIcons = {
        "none": "fa-solid fa-ban",
        "link": "fas fa-link",
        "envelope": "fas fa-envelope",
        "wifi": "fas fa-wifi",
        "user": "fas fa-user",
        "credit-card": "fas fa-credit-card",
        "location": "fas fa-location-dot",
        "building": "fas fa-building",
        "instagram": "fab fa-instagram",
        "whatsapp": "fab fa-whatsapp",
        "youtube": "fab fa-youtube",
        "x-twitter": "fa-brands fa-x-twitter",
        "facebook": "fab fa-facebook",
        "store": "fas fa-store",
        "bank": "fa-solid fa-building-columns",
        "G pay": "fa-brands fa-google-pay",
        "comment": "fa-solid fa-message",
        "visa": "fa-brands fa-cc-visa",
        "phone": "fa-solid fa-phone-volume",
        "calendar": "fa-regular fa-calendar-days",
        "map": "fa-solid fa-location-dot"
    };

    const unicodeMap = {
        'link': '\uf0c1', 'envelope': '\uf0e0', 'wifi': '\uf1eb', 'user': '\uf007',
        'credit-card': '\uf09d', 'location': '\uf3c5', 'building': '\uf1ad',
        'instagram': '\uf16d', 'whatsapp': '\uf232', 'youtube': '\uf167',
        'x-twitter': '\uf099', 'facebook': '\uf09a', 'store': '\uf54e',
        'bank': '\uf19c', 'G pay': '\uf2f6', 'comment': '\uf075',
        'visa': '\uf1f0', 'phone': '\uf095', 'calendar': '\uf073',
        'map': '\uf3c5'
    };

    // ============================================================
    //  RENDER ICONS
    // ============================================================
    function selecteIcon(btn) {
        iconGrid.querySelectorAll('.qr-icon-btn').forEach(i => i.classList.remove('active'));
        if (typeof btn === 'object') {
            btn.classList.add('active');
            selectedIcon = btn.dataset.value;
            if (isLogoUploaded) {
                isLogoUploaded = false;
                currentLogoData = null;
                showToast('Switched to icon', 'info');
            }
            scheduleGenerate();
        } else {
            const Btn = (v) => iconGrid.querySelector(`button[data-value="${v}"]`);
            const b = Btn(btn);
            if (b) {
                b.classList.add('active');
                selectedIcon = btn;
            } else {
                Btn('none').classList.add('active');
                selectedIcon = 'none';
            }
        }
    }

    function renderIcons() {
        let html = '';
        Object.entries(uiIcons).forEach(([value, Class]) => {
            html += `<button class="qr-icon-btn" data-value="${value}"><i class="${Class}"></i></button>`;
        });
        html += `<button class="qr-icon-btn" id="uploadLogoBtn" data-value="upload"><i class="fas fa-plus"></i></button>`;
        iconGrid.innerHTML = html;

        iconGrid.querySelectorAll('.qr-icon-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                selecteIcon(btn);
                if (btn.id == 'uploadLogoBtn') handleLogoUpload();
            });
        });
    }

    // ============================================================
    //  RENDER FIELDS
    // ============================================================
    function renderFields(type = 'url') {
        const config = fieldConfigs[type]['inputs'] || [];
        let html = '';
        config.forEach(field => {
            if (field.type === 'select') {
                html += `<div class="qr-control-group">
                            <label for="${field.id}">${field.label}</label>
                            <select id="${field.id}">`;
                field.options.forEach(opt => html += `<option value="${opt}">${opt}</option>`);
                html += `</select></div>`;
            } else {
                html += `<div class="qr-control-group">
                            <label for="${field.id}">${field.label}</label>
                            <input type="${field.type}" id="${field.id}" placeholder="${field.placeholder || ''}" />
                        </div>`;
            }
        });
        dynamicFields.innerHTML = html;
        dynamicFields.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', scheduleGenerate);
            el.addEventListener('change', scheduleGenerate);
        });
        selecteIcon(fieldConfigs[type]['icon'] || 'none');
        setTimeout(scheduleGenerate, 100);
    }

    // ============================================================
    //  DEBOUNCE (using common debounce from utils)
    // ============================================================
    const scheduleGenerate = debounce(function () {
        generateQR();
    }, 500);

    // ============================================================
    //  APPLY PRESET
    // ============================================================
    function applyPreset(name = 'Default') {
        const preset = presets[name];
        if (!preset) return;

        fgColor.value = preset.fg;
        bgColor.value = preset.bg;
        dotsType.value = preset.dotsType;
        cornersDotsType.value = preset.cornersDotsType;
        borderColor.value = preset.borderColor;
        borderWidth.value = preset.borderWidth;
        borderRadius.value = preset.borderRadius;
        bordergap.value = preset.bordergap;
        if (logoSize) logoSize.value = '22';
        if (logoSizeVal) logoSizeVal.textContent = '22%';

        closePresetBtn.click();
        scheduleGenerate();
        showToast('Preset applied: ' + name, 'success');
    }

    // ============================================================
    //  BUILD DATA
    // ============================================================
    function buildData() {
        const type = qrType.value;
        let data = '';
        const get = (id) => document.getElementById(id)?.value || '';

        switch (type) {
            case 'url':
                data = get('urlInput');
                break;
            case 'text':
                data = get('textInput');
                break;
            case 'email': {
                const addr = get('emailAddr');
                data = addr ? `mailto:${addr}?subject=${encodeURIComponent(get('emailSubject'))}&body=${encodeURIComponent(get('emailBody'))}` : '';
                break;
            }
            case 'phone': {
                const num = get('phoneInput');
                data = num ? `tel:${num.replace(/\s/g, '')}` : '';
                break;
            }
            case 'sms': {
                const num = get('smsNumber');
                const msg = get('smsMessage');
                data = num ? `sms:${num.replace(/\s/g, '')}${msg ? '?body=' + encodeURIComponent(msg) : ''}` : '';
                break;
            }
            case 'vcard': {
                const name = get('vcardName');
                const phone = get('vcardPhone');
                const email = get('vcardEmail');
                if (!name && !phone && !email) return '';
                data = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${get('vcardCompany')}\nADR:${get('vcardAddress')}\nEND:VCARD`;
                break;
            }
            case 'wifi': {
                const ssid = get('wifiSSID');
                const enc = get('wifiEncryption') || 'WPA/WPA2';
                if (!ssid) return '';
                const map = { 'WPA3': 'WPA3', 'WPA/WPA2': 'WPA', 'WEP': 'WEP', 'None': 'nopass' };
                data = `WIFI:T:${map[enc] || 'WPA'};S:${ssid};P:${get('wifiPassword')};;`;
                break;
            }
            case 'geo': {
                const lat = get('geoLat');
                const lng = get('geoLng');
                data = (lat && lng) ? `geo:${lat},${lng}` : '';
                break;
            }
            case 'calendar': {
                const title = get('calTitle');
                const date = get('calDate');
                const time = get('calTime');
                const loc = get('calLocation');
                if (!title || !date) return '';
                const dt = `${date}T${time || '00:00'}:00`;
                data = `BEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${dt}\nDTEND:${dt}\nLOCATION:${loc}\nEND:VEVENT`;
                break;
            }
            case 'upi': {
                const id = get('upiId');
                const name = get('upiName');
                const amt = get('upiAmount');
                if (!id) return '';
                data = `upi://pay?pa=${id}&pn=${encodeURIComponent(name)}${amt ? '&am=' + amt : ''}&cu=INR`;
                break;
            }
            default:
                data = '';
        }
        return data.trim();
    }

    // ============================================================
    //  GET LOGO
    // ============================================================
    function getLogoData() {
        if (isLogoUploaded && currentLogoData) return currentLogoData;
        if (selectedIcon === 'none' || !unicodeMap[selectedIcon]) return null;
        const char = unicodeMap[selectedIcon] || '';
        if (!char) return null;
        const c = document.createElement('canvas');
        c.width = 120;
        c.height = 120;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 120, 120);
        ctx.font = '80px "Font Awesome 6 Free", "Font Awesome 6 Brands", "FontAwesome"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.fillText(char, 60, 65);
        return c.toDataURL('image/png');
    }

    // ============================================================
    //  QR GENERATE (Promise)
    // ============================================================
    function qrGen(data) {
        return new Promise((resolve) => {
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'width:280px;height:280px;position:absolute;left:-9999px;top:-9999px;';
            document.body.appendChild(tempDiv);

            try {
                const QR = new QRCodeStyling(data);
                QR.append(tempDiv);
                setTimeout(() => {
                    const canvasEl = tempDiv.querySelector('canvas');
                    if (canvasEl) {
                        const imgURL = canvasEl.toDataURL('image/png');
                        document.body.removeChild(tempDiv);
                        resolve(imgURL);
                    } else {
                        document.body.removeChild(tempDiv);
                        resolve(null);
                    }
                }, 250);
            } catch (e) {
                document.body.removeChild(tempDiv);
                resolve(null);
            }
        });
    }

    // ============================================================
    //  ADD BORDER TO QR IMAGE
    // ============================================================
    function addBorderToImage(imgDataURL, borderWidth, borderColor, borderRadiusVal, transparent = false) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function () {
                const w = img.width;
                const h = img.height;
                const bw = parseInt(borderWidth) || 0;
                const br = parseInt(borderRadiusVal) || 0;

                const totalW = w + 2 * bw;
                const totalH = h + 2 * bw;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = totalW;
                canvas.height = totalH;

                if (!transparent) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, totalW, totalH);
                }

                const qrX = bw;
                const qrY = bw;

                if (bw > 0) {
                    const radius = Math.min(br, totalW / 2, totalH / 2);
                    ctx.beginPath();
                    ctx.moveTo(radius, 0);
                    ctx.lineTo(totalW - radius, 0);
                    ctx.quadraticCurveTo(totalW, 0, totalW, radius);
                    ctx.lineTo(totalW, totalH - radius);
                    ctx.quadraticCurveTo(totalW, totalH, totalW - radius, totalH);
                    ctx.lineTo(radius, totalH);
                    ctx.quadraticCurveTo(0, totalH, 0, totalH - radius);
                    ctx.lineTo(0, radius);
                    ctx.quadraticCurveTo(0, 0, radius, 0);
                    ctx.closePath();
                    ctx.fillStyle = borderColor;
                    ctx.fill();

                    if (!transparent) {
                        const innerX = bw;
                        const innerY = bw;
                        const innerW = totalW - 2 * bw;
                        const innerH = totalH - 2 * bw;
                        const innerRadius = Math.min(Math.max(0, radius - bw), innerW / 2, innerH / 2);

                        ctx.beginPath();
                        ctx.moveTo(innerX + innerRadius, innerY);
                        ctx.lineTo(innerX + innerW - innerRadius, innerY);
                        ctx.quadraticCurveTo(innerX + innerW, innerY, innerX + innerW, innerY + innerRadius);
                        ctx.lineTo(innerX + innerW, innerY + innerH - innerRadius);
                        ctx.quadraticCurveTo(innerX + innerW, innerY + innerH, innerX + innerW - innerRadius, innerY + innerH);
                        ctx.lineTo(innerX + innerRadius, innerY + innerH);
                        ctx.quadraticCurveTo(innerX, innerY + innerH, innerX, innerY + innerH - innerRadius);
                        ctx.lineTo(innerX, innerY + innerRadius);
                        ctx.quadraticCurveTo(innerX, innerY, innerX + innerRadius, innerY);
                        ctx.closePath();
                        ctx.fillStyle = '#ffffff';
                        ctx.fill();
                    }

                    const clipRadius = transparent ? Math.max(0, radius - bw) : Math.min(Math.max(0, radius - bw), w / 2, h / 2);
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(qrX + clipRadius, qrY);
                    ctx.lineTo(qrX + w - clipRadius, qrY);
                    ctx.quadraticCurveTo(qrX + w, qrY, qrX + w, qrY + clipRadius);
                    ctx.lineTo(qrX + w, qrY + h - clipRadius);
                    ctx.quadraticCurveTo(qrX + w, qrY + h, qrX + w - clipRadius, qrY + h);
                    ctx.lineTo(qrX + clipRadius, qrY + h);
                    ctx.quadraticCurveTo(qrX, qrY + h, qrX, qrY + h - clipRadius);
                    ctx.lineTo(qrX, qrY + clipRadius);
                    ctx.quadraticCurveTo(qrX, qrY, qrX + clipRadius, qrY);
                    ctx.closePath();
                    ctx.clip();

                    ctx.drawImage(img, qrX, qrY, w, h);
                    ctx.restore();
                } else {
                    ctx.drawImage(img, 0, 0, w, h);
                }

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = function () {
                resolve(null);
            };
            img.src = imgDataURL;
        });
    }

    // ============================================================
    //  MAIN GENERATE
    // ============================================================
    async function generateQR() {
        const data = buildData();

        if (!data) {
            resultPlaceholder.style.display = 'flex';
            resultCanvas.style.display = 'none';
            downloadOptions.classList.remove('visible');
            isGenerated = false;
            lastRawQR = null;
            lastFullImage = null;
            return;
        }

        resultPlaceholder.style.display = 'none';
        resultCanvas.style.display = 'flex';

        const fg = fgColor.value || '#000000';
        const bg = bgColor.value || '#ffffff';
        const dots = dotsType.value || 'rounded';
        const corners = cornersDotsType.value || 'extra-rounded';
        const gap = parseInt(bordergap.value) || 4;
        const bColor = borderColor.value || '#000000';
        const bWidth = parseInt(borderWidth.value) || 0;
        const bRadius = parseInt(borderRadius.value) || 0;
        const logo = getLogoData();
        const logoScale = parseFloat(logoSize?.value || 22) / 100;

        const rawQR = await qrGen({
            width: 280,
            height: 280,
            type: 'canvas',
            data: data,
            margin: gap,
            dotsOptions: { type: dots, color: fg },
            backgroundOptions: { color: bg },
            cornersSquareOptions: { type: corners, color: fg },
            cornersDotOptions: { type: 'dot', color: fg },
            qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' },
            image: logo,
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: logoScale,
                crossOrigin: 'anonymous',
                margin: 2
            }
        });

        if (!rawQR) {
            showToast('Failed to generate QR code.', 'error');
            return;
        }

        lastRawQR = rawQR;

        const fullImage = await addBorderToImage(rawQR, bWidth, bColor, bRadius);
        if (fullImage) {
            lastFullImage = fullImage;
            resultCanvas.innerHTML = `<img src="${fullImage}" style="display:block; width:100%; height:100%; object-fit:contain;" />`;
            resultCanvas.style.border = 'none';
            resultCanvas.style.padding = '0';
        } else {
            resultCanvas.innerHTML = `<img src="${rawQR}" style="display:block; width:100%; height:100%; object-fit:contain;" />`;
            lastFullImage = rawQR;
        }

        downloadOptions.classList.add('visible');
        isGenerated = true;
    }

    // ============================================================
    //  PRESETS MODAL
    // ============================================================
    function renderPresets() {
        presetGrid.innerHTML = '';
        Object.entries(presets).forEach(async ([name, data]) => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            const imgURL = await qrGen({
                width: 80,
                height: 80,
                type: 'canvas',
                data: dummyData,
                dotsOptions: { type: data.dotsType, color: data.fg },
                backgroundOptions: { color: data.bg },
                cornersSquareOptions: { type: data.cornersDotsType, color: data.fg },
                cornersDotOptions: { type: 'dot', color: data.fg },
                margin: 2
            });
            card.innerHTML = `<img src="${imgURL}" /><div class="pname">${name}</div>`;
            card.addEventListener('click', () => applyPreset(name));
            presetGrid.appendChild(card);
        });
        presetModal.classList.add('open');
    }

    // ============================================================
    //  DOWNLOAD QR
    // ============================================================
    function downloadQR(format) {
        if (!isGenerated || !lastRawQR) {
            showToast('Generate a QR code first!', 'warning');
            return;
        }

        const bColor = borderColor.value || '#000000';
        const bWidth = parseInt(borderWidth.value) || 0;
        const bRadius = parseInt(borderRadius.value) || 0;
        const transparent = format === 'png';

        addBorderToImage(lastRawQR, bWidth, bColor, bRadius, transparent)
            .then(function (imgDataURL) {
                if (!imgDataURL) {
                    showToast('Error generating image.', 'error');
                    return;
                }

                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');

                    if (!transparent) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.drawImage(img, 0, 0);

                    const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
                    const quality = format === 'jpeg' ? 0.92 : 1.0;
                    const dataURL = canvas.toDataURL(mimeType, quality);

                    const link = document.createElement('a');
                    link.href = dataURL;
                    link.download = `qrcode.${format}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast(`Downloaded as ${format.toUpperCase()}`, 'success');
                };
                img.onerror = function () {
                    showToast('Error downloading.', 'error');
                };
                img.src = imgDataURL;
            });
    }

    // ============================================================
    //  COPY QR IMAGE
    // ============================================================
    function copyQR() {
        if (!isGenerated || !lastFullImage) {
            showToast('Generate a QR code first!', 'warning');
            return;
        }
        fetch(lastFullImage)
            .then(res => res.blob())
            .then(blob => {
                navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
                    .then(() => showToast('QR copied to clipboard!', 'success'))
                    .catch(() => showToast('Failed to copy.', 'error'));
            })
            .catch(() => showToast('Failed to copy.', 'error'));
    }

    // ============================================================
    //  LOGO UPLOAD
    // ============================================================
    function handleLogoUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png, image/jpeg, image/svg+xml';
        input.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast('Please upload an image.', 'error');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                showToast('Image must be under 2MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = function (ev) {
                currentLogoData = ev.target.result;
                isLogoUploaded = true;
                iconGrid.querySelectorAll('.qr-icon-btn').forEach(b => b.classList.remove('active'));
                showToast('Logo uploaded!', 'success');
                scheduleGenerate();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    // ============================================================
    //  EVENT LISTENERS
    // ============================================================
    qrType.addEventListener('change', function () {
        renderFields(this.value);
    });

    [fgColor, bgColor, dotsType, cornersDotsType, borderColor, borderWidth, borderRadius, bordergap, logoSize].forEach(el => {
        if (el) {
            el.addEventListener('input', scheduleGenerate);
            el.addEventListener('change', scheduleGenerate);
        }
    });

    if (logoSize && logoSizeVal) {
        logoSize.addEventListener('input', function () {
            logoSizeVal.textContent = this.value + '%';
        });
    }

    generateBtn.addEventListener('click', function () {
        if (generateTimer) clearTimeout(generateTimer);
        generateQR();
    });

    closePresetBtn.addEventListener('click', () => {
        presetModal.classList.remove('open');
        presetGrid.innerHTML = '';
    });

    presetsBtn.addEventListener('click', renderPresets);

    presetModal.addEventListener('click', function (e) {
        if (e.target === this) closePresetBtn.click();
    });

    defaultResetBtn.addEventListener('click', () => applyPreset('Default'));

    downloadBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            downloadQR(this.dataset.format);
        });
    });

    copyResultBtn.addEventListener('click', copyQR);

    // ============================================================
    //  INIT
    // ============================================================
    renderIcons();
    renderFields('url');
    setTimeout(() => {
        applyPreset('Default');
        const urlInput = document.getElementById('urlInput');
        if (urlInput && !urlInput.value) {
            urlInput.value = dummyData;
            scheduleGenerate();
        }
    }, 200);

    console.log('✅ QR Code Generator: border fixed, gap added.');
});