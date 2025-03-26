async function executeWebRequest(url) {
    let webRequest = new Request(url);
    let response = await fetch(webRequest);
    if (!response.ok) throw response;
    return await response.text();
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if(request.action === 'reloadSpells') {
//         loadAllPages().then(spells => {
//             chrome.storage.local.set({ spells });
//             sendResponse({ success: true });
//         });
//         return true; // Для асинхронного ответа
//     }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    executeWebRequest(request.url).then(sendResponse);
    return true;
});
