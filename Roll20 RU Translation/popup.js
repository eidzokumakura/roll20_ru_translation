document.addEventListener('DOMContentLoaded', function() {
    const container = document.body;
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const translateSpells = document.getElementById('translateSpells');
    const translateBestiary = document.getElementById('translateBestiary');

    // Загрузка сохраненных настроек
    chrome.storage.local.get(['spells', 'translateSpells', 'translateBestiary'], (result) => {
        // Обновление статуса
        if(result.spells && Object.keys(result.spells).length > 0) {
            container.classList.add('status-loaded');
            statusText.textContent = 'Заклинания загружены';
        } else {
            container.classList.add('status-empty');
            statusText.textContent = 'Заклинания отсутствуют';
        }
        
        // Установка значений переключателей
        translateSpells.checked = result.translateSpells ?? true;
        translateBestiary.checked = result.translateBestiary ?? true;
    });

    // Сохранение настроек при изменении
    translateSpells.addEventListener('change', () => {
        chrome.storage.local.set({ translateSpells: translateSpells.checked });
    });
    
    translateBestiary.addEventListener('change', () => {
        chrome.storage.local.set({ translateBestiary: translateBestiary.checked });
    });
});