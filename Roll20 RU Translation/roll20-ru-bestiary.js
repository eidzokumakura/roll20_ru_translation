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

// 1. Размер, тип и мировоззрение
function parseSizeTypeAlignment(card, data) {
    const element = card.querySelector('li.size-type-alignment');
    if (element) {
        data.size_type_alignment = element.innerText
            .replace(/\s+/g, ' ')
            .replace(/\?/g, '') // Удаление знаков вопроса
            .trim();
    } else {
        data.size_type_alignment = '';
    }
}

// 2. Примечание к классу доспеха
function parseArmorClassNote(card, data) {
    const element = Array.from(card.querySelectorAll('li')).find(li => {
        const strong = li.querySelector('strong');
        return strong && strong.textContent.includes('Класс Доспеха');
    });
    
    if (element) {
        const match = element.textContent.match(/\((.*?)\)/);
        data.armor_class_note = match ? match[1].trim() : '';
    } else {
        data.armor_class_note = '';
    }
}

// 3. Скорость
function parseSpeed(card, data) {
    const element = Array.from(card.querySelectorAll('li')).find(li => {
        const strong = li.querySelector('strong');
        return strong && strong.textContent.trim() === 'Скорость';
    });
    
    data.speed = element 
        ? element.textContent.replace('Скорость', '').trim().replace(/\s+/g, ' ')
        : '';
}

// 4. Уязвимость к урону
function parseDamageVulnerability(card, data) {
    const element = Array.from(card.querySelectorAll('li')).find(li => {
        const strong = li.querySelector('strong');
        return strong && strong.textContent.trim() === 'Уязвимость к урону';
    });
    
    data.damage_vulnerability = element 
        ? element.textContent.split('Уязвимость к урону')[1].trim().replace(/\s+/g, ' ')
        : '';
}

// 5. Сопротивление урону
function parseDamageResistance(card, data) {
    const element = Array.from(card.querySelectorAll('li')).find(li => {
        const strong = li.querySelector('strong');
        return strong && strong.textContent.trim() === 'Сопротивление урону';
    });
    
    data.damage_resistance = element 
        ? element.textContent.split('Сопротивление урону')[1].trim().replace(/\s+/g, ' ')
        : '';
}

// 6. Иммунитет к урону
function parseDamageImmunity(card, data) {
    const element = Array.from(card.querySelectorAll('li')).find(li => {
        const strong = li.querySelector('strong');
        return strong && strong.textContent.trim() === 'Иммунитет к урону';
    });
    
    data.damage_immunity = element 
        ? element.textContent.split('Иммунитет к урону')[1].trim().replace(/\s+/g, ' ')
        : '';
}

// 7. Иммунитет к состоянию
function parseConditionImmunity(card, data) {
    const element = Array.from(card.querySelectorAll('li')).find(li => {
        const strong = li.querySelector('strong');
        return strong && strong.textContent.trim() === 'Иммунитет к состоянию';
    });

    data.condition_immunity = element
        ? element.textContent
            .split('Иммунитет к состоянию')[1]
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\?/g, '')  // Удаляем знаки вопроса
        : '';
}

// 8. Чувства
function parseSenses(card, data) {
    const element = Array.from(card.querySelectorAll('li')).find(li => {
        const strong = li.querySelector('strong');
        return strong && strong.textContent.trim() === 'Чувства';
    });
    
    data.senses = element 
        ? element.textContent.split('Чувства')[1]
            .replace(/\s+/g, ' ')
            .replace(/\?/g, '') // Удаление знаков вопроса
            .trim()
        : '';
}

// 9. Языки
function parseLanguages(card, data) {
    const element = Array.from(card.querySelectorAll('li')).find(li => {
        const strong = li.querySelector('strong');
        return strong && strong.textContent.trim() === 'Языки';
    });
    
    data.languages = element 
        ? element.textContent.split('Языки')[1].trim().replace(/\s+/g, ' ')
        : '';
}

// 10. Парсинг специальных способностей
function parseSpecialAbilities(card, data) {
    data.special_abilities = [];

    // Находим первый блок subsection desc
    const firstSubsection = card.querySelector('li.subsection.desc');
    if (!firstSubsection) return;

    // Проверяем наличие заголовка h3 в первом блоке
    if (firstSubsection.querySelector('h3.subsection-title')) {
        return;
    }

    // Обрабатываем только первый блок
    const contentDiv = firstSubsection.querySelector('div');
    if (!contentDiv) return;

    let currentElement = contentDiv.firstElementChild;
    let currentAbility = null;

    while (currentElement) {
        if (currentElement.tagName === 'P') {
            // Обработка параграфа с заголовком
            const titleElement = currentElement.querySelector('strong > em, em > strong');
            if (titleElement) {
                // Сохраняем предыдущую способность
                if (currentAbility) {
                    data.special_abilities.push(currentAbility);
                }

                // Создаем новую способность
                currentAbility = {
                    title: titleElement.textContent
                        //.replace(/\(.*?\)/g, '') // Удаляем скобки с перезарядкой
                        .replace(/[.:]$/, '')     // Удаляем конечные . и :
                        .trim(),
                    desc: ''
                };

                // Извлекаем основной текст
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = currentElement.innerHTML;
                tempDiv.querySelectorAll('strong, em, .dice').forEach(el => el.remove());

                currentAbility.desc = tempDiv.textContent
                    .replace(/\s+/g, ' ')
                    .trim();
            } else if (currentAbility) {
                // Добавляем текст к существующему описанию
                const additionalText = processParagraphWithoutTitle(currentElement);
                currentAbility.desc += '\n' + additionalText;
            }
        }
        else if (currentElement.tagName === 'UL' && currentAbility) {
            // Обрабатываем списки
            const listItems = Array.from(currentElement.querySelectorAll('li'))
                .map(li => li.textContent.trim())
                .join('\n');

            currentAbility.desc += '\n' + listItems;
        }

        currentElement = currentElement.nextElementSibling;
    }

    // Добавляем последнюю обработанную способность
    if (currentAbility) {
        data.special_abilities.push(currentAbility);
    }
}

function parseActions(card, data) {
    data.actions = [];
    
    const actionSection = Array.from(card.querySelectorAll('.subsection.desc')).find(section => {
        const title = section.querySelector('.subsection-title');
        return title && title.textContent.trim() === 'Действия';
    });

    if (!actionSection) return;

    const contentDiv = actionSection.querySelector('div');
    if (!contentDiv) return;

    let currentElement = contentDiv.firstElementChild;
    let lastValidAction = null; // Для отслеживания последнего действия с заголовком

    while (currentElement) {
        if (currentElement.tagName === 'P') {
            const action = processActionParagraph(currentElement);
            
            if (action.title) {
                // Новое действие с заголовком
                data.actions.push(action);
                lastValidAction = action;
            } else if (lastValidAction) {
                // Текст без заголовка - добавляем к последнему действию
                const additionalText = processParagraphWithoutTitle(currentElement);
                lastValidAction.description += '\n' + additionalText;
            }
        }
        
        // Обработка списков после параграфов
        if (currentElement.tagName === 'UL' && lastValidAction) {
            const listText = processList(currentElement);
            lastValidAction.description += '\n' + listText;
        }

        currentElement = currentElement.nextElementSibling;
    }
}

function parseLegendaryActions(card, data) {
    data.legendary_actions = [];
    
    const actionSection = Array.from(card.querySelectorAll('.subsection.desc')).find(section => {
        const title = section.querySelector('.subsection-title');
        return title && title.textContent.trim() === 'Легендарные действия';
    });

    if (!actionSection) return;

    const contentDiv = actionSection.querySelector('div');
    if (!contentDiv) return;

    let currentElement = contentDiv.firstElementChild;
    let lastValidAction = null; // Для отслеживания последнего действия с заголовком

    while (currentElement) {
        if (currentElement.tagName === 'P') {
            const action = processActionParagraph(currentElement);
            
            if (action.title) {
                // Новое действие с заголовком
                data.legendary_actions.push(action);
                lastValidAction = action;
            } else if (lastValidAction) {
                // Текст без заголовка - добавляем к последнему действию
                const additionalText = processParagraphWithoutTitle(currentElement);
                lastValidAction.description += '\n' + additionalText;
            }
        }
        
        // Обработка списков после параграфов
        if (currentElement.tagName === 'UL' && lastValidAction) {
            const listText = processList(currentElement);
            lastValidAction.description += '\n' + listText;
        }

        currentElement = currentElement.nextElementSibling;
    }
}

function parseReactionActions(card, data) {
    data.reaction_actions = [];
    
    const actionSection = Array.from(card.querySelectorAll('.subsection.desc')).find(section => {
        const title = section.querySelector('.subsection-title');
        //console.log("Заголовок:", title);
        return title && title.textContent.trim() === 'Реакции';
    });

    if (!actionSection) return;
    //console.log(actionSection);
    const contentDiv = actionSection.querySelector('div');
    if (!contentDiv) return;

    let currentElement = contentDiv.firstElementChild;
    let lastValidAction = null; // Для отслеживания последнего действия с заголовком

    while (currentElement) {
        if (currentElement.tagName === 'P') {
            const action = processActionParagraph(currentElement);
            //console.log(action);
            if (action.title) {
                // Новое действие с заголовком
                //console.log(action.title);
                data.reaction_actions.push(action);
                lastValidAction = action;
            } else if (lastValidAction) {
                // Текст без заголовка - добавляем к последнему действию
                const additionalText = processParagraphWithoutTitle(currentElement);
                lastValidAction.description += '\n' + additionalText;
            }
        }
        
        // Обработка списков после параграфов
        if (currentElement.tagName === 'UL' && lastValidAction) {
            const listText = processList(currentElement);
            lastValidAction.description += '\n' + listText;
        }

        currentElement = currentElement.nextElementSibling;
    }
}

// Обработка параграфов без заголовка
function processParagraphWithoutTitle(paragraph) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = paragraph.innerHTML;
    
    tempDiv.querySelectorAll('.dice').forEach(dice => dice.remove());
    
    return tempDiv.textContent
        .replace(/\s+/g, ' ')
        .replace(/([,.]) /g, '$1 ')
        .replace(/\.{2,}/g, '.')
        .trim();
}

// Обработка списков
function processList(listElement) {
    return Array.from(listElement.querySelectorAll('li'))
        .map(li => {
            return li.textContent
                .replace(/\s+/g, ' ')
                .trim();
        })
        .join('\n');
}

// Модифицированная функция обработки параграфа
function processActionParagraph(paragraph) {
    const result = {
        title: '',
        description: '',
        type: 'generic',
        details: {}
    };

    // Поиск элемента заголовка
    let titleElement = paragraph.querySelector('strong > em, em > strong');
    if (!titleElement) titleElement = paragraph.querySelector('strong');
    if (!titleElement) return result;

    // Обработка заголовка
    const rawTitle = titleElement.textContent
        .replace(/\(перезарядка\s+(\d+–\d+)\)/gi, '(перезарядка $1)')
        .replace(/\s+/g, ' ')
        .trim();
    
    result.title = rawTitle.replace(/\.$/, '').trim();

    // Извлечение данных из оригинального HTML
    const originalHTML = paragraph.innerHTML;

    // Подготовка текста
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalHTML;
    tempDiv.querySelectorAll('.dice').forEach(dice => dice.remove());
    
    let fullText = tempDiv.textContent
        .replace(/\s+/g, ' ')
        .replace(/([,.]) /g, '$1 ')
        .trim();

    // Удаление заголовка из текста
    const titlePattern = new RegExp(`^${escapeRegExp(rawTitle)}[\\.\\s]*`, 'i');
    fullText = fullText.replace(titlePattern, '').replace(/\.{2,}/g, '.').trim();

    // Определение типа действия
    const attackPattern = /^(?:Рукопашная|Дальнобойная)(?:\s+или\s+(?:Рукопашная|Дальнобойная))?\s+атака\s+(?:оружием|заклинанием)/i;
    const isAttack = attackPattern.test(fullText);
    result.type = isAttack ? 'attack' : 'generic';

    if (isAttack) {
        // Разделение на предложения
        const sentences = fullText.split(/(?<=[.!?])\s+/);
        const attackPart = sentences.slice(0, 2).join(' ');
        const descriptionPart = sentences.slice(2).join(' ');

        // Обработка параметров атаки
        const rangeRegex = /(досягаемость|дистанция)\s+([\d/]+)\s+футов/gi;
        let ranges = [];
        let match;
        
        let targetText = attackPart.replace(rangeRegex, '').trim();
        while ((match = rangeRegex.exec(attackPart)) !== null) {
            ranges.push(match[2]);
        }
        
        if (ranges.length > 0) {
            result.details.range = ranges.join(' или ');
            const targetMatch = targetText.match(/(?:,|^)\s*([^.,]+?)\s*(?:\.|$)/i);
            result.details.target = targetMatch ? 
                targetMatch[1].replace(/^,\s*/, '').trim() : 
                'одна цель';
        }

        // Извлечение бонуса атаки
        const attackBonusMatch = originalHTML.match(/\+(\d+)\s*к попаданию/i);
        if (attackBonusMatch) {
            result.details.attack_bonus = parseInt(attackBonusMatch[1], 10);
        }

        // Извлечение типа урона
        const damageMatch = attackPart.match(/Попадание[:]?\s+(?:Урон\s+)?([^\d()]+)/i);
        if (damageMatch) {
            result.details.damageType = damageMatch[1]
                .replace(/урон/gi, '')
                .trim()
                .toLowerCase()
                .replace(/[:.]/g, '');
        }

        // Извлечение Сл
        const dcMatch = attackPart.match(/Сл (\d+)/i);
        if (dcMatch) result.details.dc = dcMatch[1];

        // Извлечение первой формулы урона
        const damageFormulaMatch = fullText.match(
            /Попадание[:]?.*?\((\d+\s*к\s*\d+\s*(?:[+-]\s*\d+)?)\)/i
        );

        console.log(damageFormulaMatch);
        
        if (damageFormulaMatch) {
            result.details.damage = damageFormulaMatch[1]
                .replace(/\s+/g, '')
                .replace(/(к)/gi, 'd')
                .toLowerCase();
        }

        // Формирование описания
        result.description = sentences.length > 2 ? 
            descriptionPart.replace(/\.$/, '') : 
            '';
    } else {
        result.description = fullText;
    }

    return result;
}

// Вспомогательная функция для экранирования спецсимволов
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseCreature(card) {
    let data = {};
    parseTitle(card, data);
    parseSizeTypeAlignment(card, data);
    parseArmorClassNote(card, data);
    parseSpeed(card, data);
    parseDamageVulnerability(card, data);
    parseDamageResistance(card, data);
    parseDamageImmunity(card, data);
    parseConditionImmunity(card, data);
    parseSenses(card, data);
    parseLanguages(card, data);
    parseActions(card, data); // Добавляем парсинг действий
    parseReactionActions(card, data);
    parseLegendaryActions(card, data);
    parseSpecialAbilities(card, data);
    return data;
}

function parseDocumentTitle() {
    const titleElement = document.querySelector('title');
    return titleElement 
        ? titleElement.textContent.trim() 
        : '';
}

function searchCreature(searchQuery) {
    return new Promise((resolve) => {
        const encodedQuery = encodeURIComponent(searchQuery);
        const url = `https://dnd.su/bestiary/?search=${encodedQuery}`;
        chrome.runtime.sendMessage({ url }, (html) => resolve(html));
    });
}

async function searchAndParseCreature(searchQuery) {
    try {
        // Получаем HTML страницы поиска
        const html = await searchCreature(searchQuery);
        
        // Парсим HTML в DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Парсим заголовок документа
        const docTitle = parseDocumentTitle(doc);
        console.log('Document Title:', docTitle);

        // Ищем карточку существа
        const cardWrapper = doc.querySelector('.card-wrapper');
        
        if (!cardWrapper) {
            console.log("Существо не найдено");
            return null;
        }

        // Парсим данные существа
        const creatureData = parseCreature(cardWrapper);
        console.log('Parsed Data:', creatureData);
        return creatureData;

    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        return null;
    }
}

async function translateCreatureToCard() {
    try {
        const cardNode = document.querySelector('.container.npc');
        
        // Получаем данные асинхронно
        const data = await searchAndParseCreature(parseDocumentTitle());
        
        // Проверяем что данные получены
        if(!data) {
            console.error("Данные не получены");
            return;
        }

        // Основные характеристики
        setFieldValue(cardNode, "npc_name", data.title_ru);
        setFieldValue(cardNode, "npc_type", data.size_type_alignment);
        setFieldValue(cardNode, "npc_actype", data.armor_class_note);
        setFieldValue(cardNode, "npc_speed", data.speed);
        
        // Уязвимости/сопротивления/иммунитеты
        setFieldValue(cardNode, "npc_vulnerabilities", data.damage_vulnerability);
        setFieldValue(cardNode, "npc_resistances", data.damage_resistance);
        setFieldValue(cardNode, "npc_immunities", data.damage_immunity);
        setFieldValue(cardNode, "npc_condition_immunities", data.condition_immunity);
        
        // Чувства и языки
        setFieldValue(cardNode, "npc_senses", data.senses);
        setFieldValue(cardNode, "npc_languages", data.languages);

        const actionBlocks = document.querySelectorAll('div.row.actions');
        // Фильтруем элементы, чтобы найти тот, у которого ровно два класса
        const actionsContainer = Array.from(actionBlocks).find(element => element.classList.length === 2);
        
        if (actionsContainer) {
          console.log('Элемент найден и имеет только два класса: row и actions');
          processActionsContainer(actionsContainer, data.actions);
        } else {
          console.log('Элемент не найден или все элементы имеют дополнительные классы');
        }

        const traits = document.querySelector("div.row.traits");
        if (traits) {
            console.log(traits);
            processTraitsContainer(traits, data);
        } else {
            console.log('Элемент не найден');
        }

        const legendaryActionsContainer = document.querySelector("div.row.actions.legendary");
        if (legendaryActionsContainer) {
            processActionsContainer(legendaryActionsContainer, data.legendary_actions);
        }
        else {
            console.log('Элемент не найден');
        }

        const reactionActionContainer = document.querySelector("div.row.actions.reaction");
        if (reactionActionContainer) {
            processActionsContainer(reactionActionContainer, data.reaction_actions);
        }
        else {
            console.log("Элемент не найден");
        }

    } catch(error) {
        console.error("Ошибка при переводе существа:", error);
    }
}

function processActionsContainer(actionsContainer, actions) {
    if (actionsContainer && actions.length) {
        // Находим контейнер повторяющихся элементов
        const repContainer = actionsContainer.querySelector('.repcontainer');
        const add_button = actionsContainer.querySelector('button.btn.repcontrol_add');

        if (repContainer) {
            // Получаем все элементы repitem
            let repItems = repContainer.querySelectorAll('.repitem');
            console.log('Найдено элементов действий:', repItems.length);

            // Заполняем данные для каждого действия
            actions.forEach((action, index) => {
                if (repItems[index]) {
                    const npcOptions = repItems[index].querySelector('.npc_options');
                    if (npcOptions) {
                        // Основные поля
                        setFieldValue(npcOptions, "name", action.title);
                        setFieldValue(npcOptions, "description", action.description);

                        // Поля для атак
                        if (action.type === 'attack') {
                            // Тип атаки (ближний/дальний)
                            const attackType = action.details.range?.includes('/')
                                ? 'Ranged'
                                : 'Melee';
                            setFieldValue(npcOptions, "attack_type", attackType);

                            // Дистанция и цель
                            setFieldValue(npcOptions, "attack_range",
                                `${action.details.range} футов`);
                            setFieldValue(npcOptions, "attack_target",
                                action.details.target);

                            // Тип урона
                            setFieldValue(npcOptions, "attack_damagetype",
                                action.details.damageType || '');
                        }
                    }
                }
                else {
                    add_button.click();
                    repItems = repContainer.querySelectorAll('.repitem');
                    console.log("Длина repItems после нажатия кнопки:", repItems.length);
                    const npcOptions = repItems[index].querySelector('.npc_options');
                    const attackCheckbox = npcOptions.querySelector('input[name="attr_attack_flag"]');
                    console.log(attackCheckbox);
                    //attackCheckbox.checked = true;
                    if (npcOptions) {
                        // Основные поля
                        setFieldValue(npcOptions, "name", action.title);
                        setFieldValue(npcOptions, "description", action.description);

                        // Поля для атак
                        if (action.type === 'attack') {
                            attackCheckbox.click();
                            // Тип атаки (ближний/дальний)
                            const attackType = action.details.range?.includes('/')
                                ? 'Ranged'
                                : 'Melee';
                            setFieldValue(npcOptions, "attack_type", attackType);
                            
                            setFieldValue(npcOptions, "attack_tohit", action.details.attack_bonus);
                            setFieldValue(npcOptions, "attack_damage", action.details.damage);
                            
                            // Дистанция и цель
                            setFieldValue(npcOptions, "attack_range",
                                `${action.details.range} футов`);
                            setFieldValue(npcOptions, "attack_target",
                                action.details.target);

                            // Тип урона
                            setFieldValue(npcOptions, "attack_damagetype",
                                action.details.damageType || '');

                        }
                    }
                }
            });
        }
    }
}

function processTraitsContainer(traitsContainer, data) {
    if (data.special_abilities?.length) {
        const repContainer = traitsContainer.querySelector('.repcontainer');
        const add_button = traitsContainer.querySelector('button.btn.repcontrol_add');
        console.log(repContainer);
        if (repContainer) {
            // Получаем все элементы repitem
            let repItems = repContainer.querySelectorAll('.repitem');
            console.log('Найдено элементов действий:', repItems.length);
            // Заполняем данные для каждого действия
            data.special_abilities.forEach((special_ability, index) => {
                if (repItems[index]) {
                    const npcOptions = repItems[index].querySelector('.npc_options');
                    if (npcOptions) {
                        // Основные поля
                        setFieldValue(npcOptions, "name", special_ability.title);
                        setFieldValue(npcOptions, "description", special_ability.desc);
                    }
                }
                else {
                    add_button.click();
                    repItems = repContainer.querySelectorAll(".repitem");
                    console.log("Длина repItems после нажатия кнопки:", repItems.length);
                    const npcOptions = repItems[index].querySelector('.npc_options');
                    if (npcOptions) {
                        // Основные поля
                        setFieldValue(npcOptions, "name", special_ability.title);
                        setFieldValue(npcOptions, "description", special_ability.desc);
                    }
                }
            });
        }
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
    if (document.readyState === "complete") {
        // Проверяем состояние переключателя бестиария
        chrome.storage.local.get(['translateBestiary'], (result) => {
            const shouldTranslate = result.translateBestiary ?? true; // true по умолчанию
            if (shouldTranslate) {
                translateCreatureToCard();
            } else {
                console.log('Перевод бестиария отключен в настройках');
            }
        });
    }
});