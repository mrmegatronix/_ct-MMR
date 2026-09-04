
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

let html = fs.readFileSync('admin.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

// 1. Create Tab Bar
const tabBar = document.createElement('div');
tabBar.className = 'tab-bar';
tabBar.innerHTML = `
    <button id="btn-tab-config" class="tab-btn active" onclick="switchAdminTab('tab-config')">⚙️ Draw Config</button>
    <button id="btn-tab-financials" class="tab-btn" onclick="switchAdminTab('tab-financials')">💰 Financials</button>
    <button id="btn-tab-actions" class="tab-btn" onclick="switchAdminTab('tab-actions')">🛠️ Admin Actions</button>
`;

// 2. Create Tab Contents
const tabConfig = document.createElement('div');
tabConfig.id = 'tab-config';
tabConfig.className = 'tab-content active';

const tabFinancials = document.createElement('div');
tabFinancials.id = 'tab-financials';
tabFinancials.className = 'tab-content';

const tabActions = document.createElement('div');
tabActions.id = 'tab-actions';
tabActions.className = 'tab-content';

// 3. Move cards into appropriate tabs based on text content
const cards = Array.from(document.querySelectorAll('.card'));
cards.forEach(card => {
    const text = card.textContent || '';
    if (text.includes('Active Pages') || text.includes('Draw Configuration & Prizes') || text.includes('Manual Slide Control') || text.includes('Display View Mode')) {
        tabConfig.appendChild(card);
    } else if (text.includes('Financial Entry') || text.includes('Host Summary & Breakdown') || text.includes('Expected Starting Float')) {
        tabFinancials.appendChild(card);
    } else {
        tabActions.appendChild(card);
    }
});

// 4. Insert tab bar and contents after the header
const header = document.querySelector('.header');
header.parentNode.insertBefore(tabBar, header.nextSibling);

// Create a container for the tabs to keep it clean
const tabsContainer = document.createElement('div');
tabsContainer.id = 'tabs-container';
tabsContainer.appendChild(tabConfig);
tabsContainer.appendChild(tabFinancials);
tabsContainer.appendChild(tabActions);

tabBar.parentNode.insertBefore(tabsContainer, tabBar.nextSibling);

// Remove the global status bar if it's there and put it before the tabs container
const globalStatus = document.getElementById('global-status-bar');
if (globalStatus) {
    globalStatus.parentNode.removeChild(globalStatus);
    tabsContainer.parentNode.insertBefore(globalStatus, tabsContainer);
}

fs.writeFileSync('admin.html', dom.serialize());
