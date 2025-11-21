class CS2CaseSimulator {
    constructor() {
        this.userData = this.loadUserData();
        this.selectedCase = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        
        // Инициализация Telegram Web App
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.tg.expand();
            this.tg.enableClosingConfirmation();
        }
    }

    loadUserData() {
        const saved = localStorage.getItem('cs2_user_data');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return {
            balance: 5000,
            inventory: [],
            stats: {
                casesOpened: 0,
                totalSpent: 0,
                itemsByRarity: {
                    common: 0,
                    rare: 0,
                    epic: 0,
                    legendary: 0,
                    mythical: 0
                }
            }
        };
    }

    saveUserData() {
        localStorage.setItem('cs2_user_data', JSON.stringify(this.userData));
    }

    setupEventListeners() {
        // Выбор кейса
        document.querySelectorAll('.case-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectCase(e.currentTarget.dataset.case);
            });
        });

        // Открытие кейса
        document.getElementById('openBtn').addEventListener('click', () => {
            this.openCase();
        });

        // Инвентарь
        document.getElementById('inventoryBtn').addEventListener('click', () => {
            this.showInventory();
        });

        document.getElementById('inventoryBack').addEventListener('click', () => {
            this.hideInventory();
        });

        // Статистика
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.showStats();
        });

        document.getElementById('statsBack').addEventListener('click', () => {
            this.hideStats();
        });

        // Продолжить после открытия кейса
        document.getElementById('continueBtn').addEventListener('click', () => {
            this.hideCaseOpening();
        });
    }

    selectCase(caseType) {
        this.selectedCase = caseType;
        
        // Снимаем выделение
        document.querySelectorAll('.case-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Выделяем выбранный
        document.querySelector(`[data-case="${caseType}"]`).classList.add('selected');
        
        // Обновляем кнопку
        const caseData = this.getCaseData(caseType);
        document.getElementById('openBtn').textContent = `🎁 Открыть ${caseData.name} (${caseData.price}₽)`;
        document.getElementById('openBtn').disabled = false;
    }

    getCaseData(caseType) {
        const cases = {
            weapon: {
                name: "🟡 Оружейный кейс",
                price: 500,
                items: [
                    { name: "Glock-18 | Groundwater", rarity: "common", probability: 0.20, price: 20 },
                    { name: "P250 | Sand Dune", rarity: "common", probability: 0.20, price: 15 },
                    { name: "MAC-10 | Palm", rarity: "common", probability: 0.15, price: 25 },
                    { name: "AK-47 | Elite Build", rarity: "rare", probability: 0.10, price: 120 },
                    { name: "AWP | Phobos", rarity: "rare", probability: 0.08, price: 180 },
                    { name: "M4A1-S | Hyper Beast", rarity: "epic", probability: 0.05, price: 600 },
                    { name: "Karambit | Rust Coat", rarity: "epic", probability: 0.02, price: 2000 }
                ]
            },
            premium: {
                name: "💎 Премиум кейс",
                price: 1000,
                items: [
                    { name: "AK-47 | Redline", rarity: "epic", probability: 0.15, price: 700 },
                    { name: "AWP | Electric Hive", rarity: "epic", probability: 0.12, price: 900 },
                    { name: "Desert Eagle | Kumicho Dragon", rarity: "epic", probability: 0.10, price: 1200 },
                    { name: "M4A4 | Howl", rarity: "legendary", probability: 0.03, price: 4000 },
                    { name: "AWP | Dragon Lore", rarity: "legendary", probability: 0.02, price: 6000 }
                ]
            },
            knife: {
                name: "🔪 Кейс с ножами",
                price: 2000,
                items: [
                    { name: "Karambit | Rust Coat", rarity: "epic", probability: 0.15, price: 2000 },
                    { name: "Bayonet | Night", rarity: "epic", probability: 0.10, price: 2500 },
                    { name: "M9 Bayonet | Forest DDPAT", rarity: "legendary", probability: 0.05, price: 4000 },
                    { name: "Karambit | Fade", rarity: "legendary", probability: 0.03, price: 8000 },
                    { name: "StatTrak™ Karambit | Crimson Web", rarity: "mythical", probability: 0.02, price: 12000 }
                ]
            }
        };
        
        return cases[caseType];
    }

    async openCase() {
        if (!this.selectedCase) {
            this.showNotification('Выберите кейс!', 'error');
            return;
        }
        
        const caseData = this.getCaseData(this.selectedCase);
        
        if (this.userData.balance < caseData.price) {
            this.showNotification('Недостаточно средств!', 'error');
            return;
        }
        
        // Списываем деньги
        this.userData.balance -= caseData.price;
        this.userData.stats.casesOpened++;
        this.userData.stats.totalSpent += caseData.price;
        
        // Показываем экран открытия
        this.showCaseOpening();
        
        // Анимация открытия
        await this.playOpeningAnimation(caseData);
        
        // Получаем предмет
        const item = this.getRandomItem(caseData.items);
        
        // Добавляем в инвентарь
        this.userData.inventory.push(item);
        this.userData.stats.itemsByRarity[item.rarity]++;
        
        // Сохраняем данные
        this.saveUserData();
        
        // Показываем результат
        this.showItemResult(item);
    }

    async playOpeningAnimation(caseData) {
        const openingText = document.getElementById('openingText');
        const steps = [
            `Открываем ${caseData.name}... 🎁`,
            `Ищем предметы... ✨`,
            `Определяем редкость... 🔥`,
            `Почти готово... 💫`
        ];
        
        for (const step of steps) {
            openingText.textContent = step;
            openingText.classList.add('pulse');
            await this.sleep(800);
            openingText.classList.remove('pulse');
        }
    }

    getRandomItem(items) {
        const totalProbability = items.reduce((sum, item) => sum + item.probability, 0);
        let random = Math.random() * totalProbability;
        
        for (const item of items) {
            random -= item.probability;
            if (random <= 0) {
                return {
                    ...item,
                    id: Date.now() + Math.random(),
                    wear: this.getRandomWear(),
                    unboxedAt: new Date().toISOString()
                };
            }
        }
        
        return items[items.length - 1];
    }

    getRandomWear() {
        const wears = [
            { name: 'Factory New', emoji: '✨' },
            { name: 'Minimal Wear', emoji: '⭐' },
            { name: 'Field-Tested', emoji: '🔸' },
            { name: 'Well-Worn', emoji: '🔻' },
            { name: 'Battle-Scarred', emoji: '💀' }
        ];
        return wears[Math.floor(Math.random() * wears.length)];
    }

    showItemResult(item) {
        const openingText = document.getElementById('openingText');
        const itemReveal = document.getElementById('itemReveal');
        
        if (item.rarity === 'mythical') {
            openingText.innerHTML = '🎊 <strong>ДЖЕКПОТ!</strong> 🎊';
            openingText.style.color = '#ffd700';
        } else {
            openingText.textContent = '🎉 Вы получили:';
        }
        
        document.getElementById('itemName').textContent = item.name;
        document.getElementById('itemRarity').textContent = this.getRarityText(item.rarity);
        document.getElementById('itemRarity').className = `rarity-${item.rarity}`;
        document.getElementById('itemWear').textContent = `${item.wear.emoji} ${item.wear.name}`;
        document.getElementById('itemPrice').textContent = `💵 Стоимость: ${item.price}₽`;
        
        itemReveal.style.display = 'block';
        itemReveal.classList.add('fade-in');
    }

    getRarityText(rarity) {
        const texts = {
            common: '⚪ Обычный',
            rare: '🔵 Редкий',
            epic: '🟣 Эпический',
            legendary: '🟡 Легендарный',
            mythical: '🔴 Мифический'
        };
        return texts[rarity];
    }

    showCaseOpening() {
        document.getElementById('caseOpening').style.display = 'flex';
        document.getElementById('itemReveal').style.display = 'none';
    }

    hideCaseOpening() {
        document.getElementById('caseOpening').style.display = 'none';
        this.updateUI();
    }

    showInventory() {
        const inventoryList = document.getElementById('inventoryList');
        
        if (this.userData.inventory.length === 0) {
            inventoryList.innerHTML = '<p style="text-align: center; opacity: 0.7;">Инвентарь пуст</p>';
        } else {
            // Группируем предметы
            const itemsMap = {};
            this.userData.inventory.forEach(item => {
                const key = `${item.name}-${item.wear.name}`;
                if (!itemsMap[key]) {
                    itemsMap[key] = { ...item, count: 0 };
                }
                itemsMap[key].count++;
            });
            
            const sortedItems = Object.values(itemsMap).sort((a, b) => {
                const rarityOrder = { mythical: 1, legendary: 2, epic: 3, rare: 4, common: 5 };
                return rarityOrder[a.rarity] - rarityOrder[b.rarity] || b.price - a.price;
            });
            
            inventoryList.innerHTML = sortedItems.map(item => `
                <div class="inventory-item ${item.rarity}">
                    <strong>${item.name}</strong>
                    <div>${this.getRarityText(item.rarity)} • ${item.wear.emoji} ${item.wear.name}</div>
                    <div>💰 ${item.price}₽ ${item.count > 1 ? `× ${item.count}` : ''}</div>
                </div>
            `).join('');
        }
        
        document.getElementById('inventoryScreen').style.display = 'block';
    }

    hideInventory() {
        document.getElementById('inventoryScreen').style.display = 'none';
    }

    showStats() {
        const stats = this.userData.stats;
        const totalValue = this.userData.inventory.reduce((sum, item) => sum + item.price, 0);
        
        document.getElementById('statsContent').innerHTML = `
            <div class="balance-card">
                <div>📈 Общая статистика</div>
                <div style="margin-top: 15px;">
                    <div>🎯 Открыто кейсов: <strong>${stats.casesOpened}</strong></div>
                    <div>💸 Потрачено всего: <strong>${stats.totalSpent}₽</strong></div>
                    <div>💵 Текущий баланс: <strong>${this.userData.balance}₽</strong></div>
                    <div>📊 Стоимость инвентаря: <strong>${totalValue}₽</strong></div>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <h3>🎯 Предметы по редкости:</h3>
                ${Object.entries(stats.itemsByRarity).map(([rarity, count]) => `
                    <div style="margin: 10px 0;">
                        ${this.getRarityText(rarity)}: <strong>${count} шт.</strong>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('statsScreen').style.display = 'block';
    }

    hideStats() {
        document.getElementById('statsScreen').style.display = 'none';
    }

    updateUI() {
        document.getElementById('balance').textContent = `${this.userData.balance}₽`;
        
        // Обновляем кнопку открытия
        const openBtn = document.getElementById('openBtn');
        if (!this.selectedCase) {
            openBtn.textContent = '🎁 Выберите кейс';
            openBtn.disabled = true;
        }
    }

    showNotification(message, type = 'info') {
        // Простое уведомление через alert
        alert(message);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Запуск приложения когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    window.cs2App = new CS2CaseSimulator();
});