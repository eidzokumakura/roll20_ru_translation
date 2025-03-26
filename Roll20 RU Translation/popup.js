document.addEventListener('DOMContentLoaded', function() {
    const container = document.body;
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');

    chrome.storage.local.get('spells', ({ spells }) => {
        if(spells && Object.keys(spells).length > 0) {
            container.classList.add('status-loaded');
            statusText.textContent = 'Данные загружены';
        } else {
            container.classList.add('status-empty');
            statusText.textContent = 'Данные отсутствуют';
        }
    });
});