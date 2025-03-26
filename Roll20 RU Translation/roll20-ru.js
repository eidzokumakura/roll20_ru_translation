function parseTitle(card, data) {
    let title = card.querySelector(".card-title a.item-link").innerText;
    console.log(title)
    let index = title.lastIndexOf('[');
    data.title_full = title;
    data.title_ru = title.substring(0, index - 1);
    //console.log(data.title_ru)
    data.title_en = title.substring(index + 1, title.length - 1);
    //console.log(data.title_en)
}

function parseCastingTime(card, data) {
    const element = Array.from(card.querySelectorAll('.params li')).find(li => 
        li.textContent.trim().startsWith('Время накладывания:')
    );
    if (element) {
        data.casting_time = element.textContent.split(':')[1].trim();
    }
}

function parseDistance(card, data) {
    const element = Array.from(card.querySelectorAll('.params li')).find(li => 
        li.textContent.trim().startsWith('Дистанция:')
    );
    if (element) {
        data.distance = element.textContent.split(':')[1].trim();
    }
}

function parseDuration(card, data) {
    const element = Array.from(card.querySelectorAll('.params li')).find(li => 
        li.textContent.trim().startsWith('Длительность:')
    );
    if (element) {
        data.duration = element.textContent.split(':')[1].trim();
    }
}

function parseDescription(card, data) {
    const higherLevelsPrefix = "На больших уровнях: ";
    let parts = card.querySelectorAll(".subsection.desc [itemprop=description] p");
    data.description = "";
    data.higher_levels = "";
    for (let part of parts)
    {
        let text = part.innerText.trim();
        if (text.startsWith(higherLevelsPrefix))
        {
            data.higher_levels = text.substring(higherLevelsPrefix.length);
            continue;
        }

        if (data.description)
            data.description += "\n\n";
        data.description += text;
    }
}

function parseSpell(card) {
    let data = {};
    parseTitle(card, data);
    parseCastingTime(card, data);
    parseDistance(card, data);
    parseDuration(card, data);
    parseDescription(card, data);
    return data;
}

function normalizeSpellName(spellName) {
    return spellName.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

function parseSpellsPage(html) {
    let dom = new DOMParser().parseFromString(html, "text/html");
    let spells = {};
    Array.from(dom.querySelectorAll(".card-wrapper")).map(parseSpell).forEach(spellData => {
        spells[normalizeSpellName(spellData.title_en)] = spellData;
    });
    return spells;
}

function fetchPage(pageNumber) {
    return new Promise((resolve) => {
        const url = `https://dnd.su/spells/?search=&source=102%7C107%7C108%7C109%7C112%7C114%7C115%7C116%7C117&page=${pageNumber}`;
        chrome.runtime.sendMessage({ url }, (html) => resolve(html));
    });
}

// Модифицируем функцию загрузки страниц
async function loadAllPages() {
    const totalPages = 20;
    let allSpells = {};
    
    for (let page = 1; page <= totalPages; page++) {
        try {
            const html = await fetchPage(page);
            const pageSpells = parseSpellsPage(html);
            Object.assign(allSpells, pageSpells);
            console.log(`Page ${page} loaded`);
        } catch (error) {
            console.error(`Error loading page ${page}:`, error);
        }
    }
    
    return allSpells;
}

// Обновляем функцию получения/загрузки данных
function getOrLoadSpells(callback) {
    chrome.storage.local.get(["spells"], async (result) => {
        // if (result.spells) {
        //     callback(result.spells);
        //     return;
        // }

        const spells = await loadAllPages();
        chrome.storage.local.set({ spells }, () => {
            console.log('All spells saved');
            callback(spells);
        });
    });
}

function translateSpells() {
    let spellBook = Array.from(document.querySelectorAll(".page.spells .spell .wrapper .options")).map(node => {
        let name = node.querySelector("[name=attr_spellname]");
        return name && name.value ? {node: node, name: name.value} : undefined;
    }).filter(item => item !== undefined && item.name.match(/^[A-Za-z0-9'"\-\/ ]+$/));
    if (spellBook.length > 0) {
        getOrLoadSpells(spells => {
            for (let spell of spellBook)
            {
                let spellTemplate = spells[normalizeSpellName(spell.name)];
                if (!spellTemplate) {
                    console.log("Can't find matching spell for " + spell.name + " (" + normalizeSpellName(spell.name) + ")");
                    continue;
                }
                setFieldValue(spell.node, "spellname", spellTemplate.title_ru);
                setFieldValue(spell.node, "spellcastingtime", spellTemplate.casting_time);
                setFieldValue(spell.node, "spellrange", spellTemplate.distance);
                setFieldValue(spell.node, "spellduration", spellTemplate.duration);
                setFieldValue(spell.node, "spelldescription", spellTemplate.description);
                setFieldValue(spell.node, "spellathigherlevels", spellTemplate.higher_levels);
                //console.log("Название заклинания: " + spellTemplate.title_ru)
            }
        });
    }
}

function setFieldValue(node, name, value) {
    let element = node.querySelector("[name=attr_" + name + "]")
    element.value = value;
    let evt = document.createEvent("HTMLEvents");
    evt.initEvent("blur", false, true);
    element.dispatchEvent(evt);
}

document.addEventListener("readystatechange", () => {
    console.log(document.readyState);
    if (document.readyState === "complete")
        translateSpells();
});

