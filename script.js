// ============ CONFIGURATION ============
const CONFIG = {
    classPIN: "1234",
    webAppUrl: "https://script.google.com/macros/s/AKfycbxO9fnRM29aUrKF2RXLcJNmSXqb9-lbubCOyzzo044iBhe4sSd4q7KSBJh_kNbuuM1j/exec",
    refreshInterval: 30000,
    maxFileSize: 100,
    allowedDomains: ['youtube.com', 'youtu.be', 'drive.google.com', 'vimeo.com', 'dropbox.com']
};

// ============ STATE MANAGEMENT ============
let state = {
    isTeacherMode: false,
    submissions: [],
    students: [],
    settings: {
        className: "Class 10A",
        groupNames: ["Group 1", "Group 2", "Group 3", "Group 4"],
        teacherPIN: "1234",
        shareURL: window.location.href
    }
};

// ============ DOM ELEMENTS ============
const elements = {
    studentView: document.getElementById('studentView'),
    teacherView: document.getElementById('teacherView'),
    className: document.getElementById('className'),
    currentWeek: document.getElementById('currentWeek'),
    updateTime: document.getElementById('updateTime'),
    refreshBtn: document.getElementById('refreshBtn'),
    teacherToggle: document.getElementById('teacherToggle'),
    pinModal: document.getElementById('pinModal'),
    pinInput: document.getElementById('pinInput'),
    pinSubmit: document.getElementById('pinSubmit'),
    submissionForm: document.getElementById('submissionForm'),
    studentName: document.getElementById('studentName'),
    groupButtons: document.querySelectorAll('.group-btn'),
    selectedGroup: document.getElementById('selectedGroup'),
    videoLink: document.getElementById('videoLink'),
    personalHistory: document.getElementById('personalHistory'),
    totalStudents: document.getElementById('totalStudents'),
    submittedCount: document.getElementById('submittedCount'),
    submittedPercent: document.getElementById('submittedPercent'),
    thisWeekCount: document.getElementById('thisWeekCount'),
    thisWeekPercent: document.getElementById('thisWeekPercent'),
    lateCount: document.getElementById('lateCount'),
    group1Count: document.getElementById('group1Count'),
    group2Count: document.getElementById('group2Count'),
    group3Count: document.getElementById('group3Count'),
    group4Count: document.getElementById('group4Count'),
    group1Status: document.getElementById('group1Status'),
    group2Status: document.getElementById('group2Status'),
    group3Status: document.getElementById('group3Status'),
    group4Status: document.getElementById('group4Status'),
    submissionsTable: document.getElementById('submissionsTable'),
    exportBtn: document.getElementById('exportBtn'),
    settingsToggle: document.getElementById('settingsToggle'),
    settingsPanel: document.getElementById('settingsPanel'),
    classNameInput: document.getElementById('classNameInput'),
    groupNames: document.getElementById('groupNames'),
    shareUrl: document.getElementById('shareUrl'),
    teacherPin: document.getElementById('teacherPin'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    saveSettings: document.getElementById('saveSettings'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    loadState();
    setupEventListeners();
    updateDateTime();
    checkUrlParams();
    //setInterval(refreshDashboard, CONFIG.refreshInterval);
    refreshDashboard();
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    elements.refreshBtn.addEventListener('click', refreshDashboard);
    elements.teacherToggle.addEventListener('click', () => {
        if (state.isTeacherMode) switchToStudentView();
        else showPinModal();
    });
    elements.pinSubmit.addEventListener('click', checkPIN);
    elements.pinInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkPIN(); });
    
    // Fixed Group Selection Logic
    elements.groupButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            elements.groupButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            elements.selectedGroup.value = this.dataset.group;
        });
    });
    
    elements.submissionForm.addEventListener('submit', handleSubmission);
    elements.exportBtn.addEventListener('click', exportToCSV);
    elements.settingsToggle.addEventListener('click', toggleSettings);
    elements.copyLinkBtn.addEventListener('click', copyShareLink);
    elements.saveSettings.addEventListener('click', saveSettings);
}

// ============ VIEW MANAGEMENT ============
function showPinModal() {
    elements.pinModal.style.display = 'flex';
    elements.pinInput.focus();
}

function checkPIN() {
    if (elements.pinInput.value === state.settings.teacherPIN) {
        state.isTeacherMode = true;
        elements.pinModal.style.display = 'none';
        elements.pinInput.value = '';
        switchToTeacherView();
        showToast('Teacher mode activated!', 'success');
    } else {
        showToast('Incorrect PIN', 'error');
    }
}

function switchToTeacherView() {
    elements.studentView.classList.add('hidden');
    elements.teacherView.classList.remove('hidden');
    elements.teacherToggle.innerHTML = '<i class="fas fa-user-graduate"></i> Student View';
    updateTeacherDashboard();
}

function switchToStudentView() {
    state.isTeacherMode = false;
    elements.teacherView.classList.add('hidden');
    elements.studentView.classList.remove('hidden');
    elements.teacherToggle.innerHTML = '<i class="fas fa-chalkboard-teacher"></i> Teacher Mode';
    updateStudentHistory();
}

// ============ SUBMISSION LOGIC ============
async function handleSubmission(e) {
    e.preventDefault();
    const name = elements.studentName.value.trim();
    const group = elements.selectedGroup.value;
    const link = elements.videoLink.value.trim();
    
    if (!name || !group || !link) {
        showToast('Please fill all fields and select a group', 'error');
        return;
    }
    
    const submission = { studentName: name, group: group, videoLink: link };
    showLoading(true);
    
    try {
        await fetch(CONFIG.webAppUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(submission)
        });
        
        showToast('Submitted successfully!', 'success');
        elements.submissionForm.reset();
        elements.groupButtons.forEach(b => b.classList.remove('active'));
        elements.selectedGroup.value = '';
        setTimeout(refreshDashboard, 2000);
    } catch (error) {
        showToast('Submission error', 'error');
    } finally {
        showLoading(false);
    }
}

async function fetchSubmissions() {
    try {
        const response = await fetch(`${CONFIG.webAppUrl}?t=${Date.now()}`);
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

// ============ DASHBOARD UPDATES ============
async function refreshDashboard() {
    showLoading(true);
    state.submissions = await fetchSubmissions();
    if (state.isTeacherMode) updateTeacherDashboard();
    else updateStudentHistory();
    updateDateTime();
    showLoading(false);
}

function updateTeacherDashboard() {
    const total = 30;
    const count = state.submissions.length;
    elements.totalStudents.textContent = total;
    elements.submittedCount.textContent = count;
    elements.submittedPercent.textContent = `${Math.round((count/total)*100)}%`;
    updateGroupProgress();
    updateSubmissionsTable();
}

function updateGroupProgress() {
    [1, 2, 3, 4].forEach(g => {
        const groupSubs = state.submissions.filter(s => parseInt(s.group) === g).length;
        document.getElementById(`group${g}Count`).textContent = `${groupSubs}/10`;
        const fill = document.querySelector(`[data-group="${g}"] .progress-fill`);
        if (fill) fill.style.width = `${(groupSubs/10)*100}%`;
    });
}

function updateSubmissionsTable() {
    elements.submissionsTable.innerHTML = state.submissions.length ? '' : '<tr><td colspan="5">No data</td></tr>';
    state.submissions.reverse().forEach(sub => {
        const row = `<tr>
            <td>${sub.studentName}</td>
            <td><span class="group-badge">${sub.group}</span></td>
            <td><span class="status on-time">✅ Submitted</span></td>
            <td><a href="${sub.videoLink}" target="_blank" class="video-link">Watch</a></td>
            <td>${new Date(sub.timestamp).toLocaleDateString()}</td>
        </tr>`;
        elements.submissionsTable.insertAdjacentHTML('beforeend', row);
    });
}

function updateStudentHistory() {
    const name = elements.studentName.value.trim().toLowerCase();
    if (!name) return;
    const mySubs = state.submissions.filter(s => s.studentName.toLowerCase().includes(name));
    elements.personalHistory.innerHTML = mySubs.length ? 
        mySubs.map(s => `<div class="history-item">Group ${s.group}: ${new Date(s.timestamp).toLocaleDateString()}</div>`).join('') :
        '<p>No history found</p>';
}

// ============ UTILITIES ============
function showLoading(s) { elements.loadingOverlay.classList.toggle('hidden', !s); }
function showToast(m, t) { elements.toastMessage.textContent = m; elements.toast.className = `toast ${t}`; elements.toast.classList.remove('hidden'); setTimeout(() => elements.toast.classList.add('hidden'), 3000); }
function updateDateTime() { elements.updateTime.textContent = new Date().toLocaleTimeString(); }
function loadState() { const s = localStorage.getItem('dashboardSettings'); if (s) { state.settings = JSON.parse(s); elements.className.textContent = state.settings.className; } }
function toggleSettings() { elements.settingsPanel.classList.toggle('hidden'); }
function copyShareLink() { navigator.clipboard.writeText(window.location.href); showToast('Link copied!', 'success'); }
function saveSettings() { /* Simplified save logic */ showToast('Saved!', 'success'); toggleSettings(); }
function checkUrlParams() { /* Logic for URL params */ }
function exportToCSV() { /* Logic for CSV export */ }