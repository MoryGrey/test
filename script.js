const TariffBase = {
  economy: 150,
  comfort: 200,
};

const ExtraPointPrice = 100;

const state = {
  selectedTariff: 'comfort',
  extraPoints: 0,
};

const els = {
  tariffCards: () => document.querySelectorAll('.tariff-card:not(.disabled)'),
  priceEconomy: () => document.querySelector('[data-price="economy"]'),
  priceComfort: () => document.querySelector('[data-price="comfort"]'),
  pointCount: () => document.getElementById('pointCount'),
  addPointBtn: () => document.getElementById('addPointBtn'),
  waypointsContainer: () => document.getElementById('waypointsContainer'),
  selectButtons: () => document.querySelectorAll('.select-btn[data-select]'),
  tariffBtn: () => document.getElementById('tariffBtn'),
  tariffSheet: () => document.getElementById('tariffSheet'),
  tariffBackdrop: () => document.getElementById('tariffBackdrop'),
  closeTariff: () => document.getElementById('closeTariff'),
  totalPrice: () => document.getElementById('totalPrice'),
  breakdown: () => document.getElementById('breakdown'),
  orderBtn: () => document.getElementById('orderBtn'),
  toast: () => document.getElementById('toast'),
  // search / boost
  searchSheet: () => document.getElementById('searchSheet'),
  openBoost: () => document.getElementById('openBoost'),
  boostSheet: () => document.getElementById('boostSheet'),
  closeBoost: () => document.getElementById('closeBoost'),
  boostRange: () => document.getElementById('boostRange'),
  boostMinus: () => document.getElementById('boostMinus'),
  boostPlus: () => document.getElementById('boostPlus'),
  boostChips: () => document.getElementById('boostChips'),
  confirmBoost: () => document.getElementById('confirmBoost'),
  boostBasePrice: () => document.getElementById('boostBasePrice'),
};

function formatPrice(value) {
  return `${value}₽`;
}

function calcPrice() {
  const base = TariffBase[state.selectedTariff] ?? 0;
  const extra = state.extraPoints * ExtraPointPrice;
  return base + extra;
}

function updateSummary() {
  const total = calcPrice();
  els.totalPrice().textContent = formatPrice(total);
  const tariffTitle = state.selectedTariff === 'economy' ? 'Эконом' : 'Комфорт';
  const extraText = state.extraPoints > 0 ? ` + ${state.extraPoints}×${ExtraPointPrice}₽` : '';
  els.breakdown().textContent = `${tariffTitle} ${TariffBase[state.selectedTariff]}₽${extraText}`;
  if (els.tariffBtn()) {
    els.tariffBtn().textContent = `${tariffTitle} • ${formatPrice(TariffBase[state.selectedTariff])}`;
  }
}

function setTariff(tariff) {
  state.selectedTariff = tariff;
  els.tariffCards().forEach((card) => {
    const isActive = card.dataset.tariff === tariff;
    card.classList.toggle('active', isActive);
    card.setAttribute('aria-pressed', String(isActive));
    const btn = card.querySelector('.select-btn');
    if (btn) btn.textContent = isActive ? 'Выбрано' : 'Выбрать';
  });
  updateSummary();
}

function setPoints(value) {
  state.extraPoints = Math.max(0, Math.min(6, value));
  els.pointCount().textContent = String(state.extraPoints);
  updateSummary();
}

function attachEvents() {
  els.tariffCards().forEach((card) => {
    card.addEventListener('click', () => setTariff(card.dataset.tariff));
  });
  els.selectButtons().forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tariff = btn.getAttribute('data-select');
      setTariff(tariff);
      closeTariffSheet();
    });
  });
  if (els.addPointBtn()) els.addPointBtn().addEventListener('click', addWaypointField);
  if (els.tariffBtn()) els.tariffBtn().addEventListener('click', openTariffSheet);
  if (els.closeTariff()) els.closeTariff().addEventListener('click', closeTariffSheet);
  if (els.tariffBackdrop()) els.tariffBackdrop().addEventListener('click', closeTariffSheet);
  els.orderBtn().addEventListener('click', () => {
    openSearchSheet();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize base prices explicitly in UI (in case we ever change constants)
  els.priceEconomy() && (els.priceEconomy().textContent = formatPrice(TariffBase.economy));
  els.priceComfort() && (els.priceComfort().textContent = formatPrice(TariffBase.comfort));
  setTariff(state.selectedTariff);
  setPoints(0); // нет доп. точек
  attachEvents();
  if (els.boostBasePrice()) els.boostBasePrice().textContent = formatPrice(TariffBase[state.selectedTariff]);
});

function addWaypointField() {
  if (state.extraPoints >= 6) return;
  state.extraPoints += 1;
  els.pointCount().textContent = String(state.extraPoints);
  const wrapper = document.createElement('div');
  wrapper.className = 'field addr';
  wrapper.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; flex:1;">
      <div class="dot dot-extra"></div>
      <input type="text" placeholder="Доп. точка адреса" autocomplete="off" />
    </div>
    <button type="button" class="remove-point" aria-label="Удалить точку">Удалить</button>
  `;
  const removeBtn = wrapper.querySelector('.remove-point');
  removeBtn.addEventListener('click', () => {
    wrapper.remove();
    state.extraPoints = Math.max(0, state.extraPoints - 1);
    els.pointCount().textContent = String(state.extraPoints);
    updateSummary();
  });
  els.waypointsContainer().appendChild(wrapper);
  updateSummary();
}

function openTariffSheet() {
  els.tariffBackdrop().classList.remove('hidden');
  els.tariffBackdrop().classList.add('visible');
  els.tariffSheet().classList.remove('hidden');
  requestAnimationFrame(() => els.tariffSheet().classList.add('open'));
}
function closeTariffSheet() {
  els.tariffBackdrop().classList.remove('visible');
  els.tariffSheet().classList.remove('open');
  setTimeout(() => {
    els.tariffBackdrop().classList.add('hidden');
    els.tariffSheet().classList.add('hidden');
  }, 250);
}

// Search + Boost logic
function openSearchSheet() {
  // validate addresses first
  const fromInput = document.getElementById('fromInput');
  const toInput = document.getElementById('toInput');
  
  if (!fromInput.value.trim() || !toInput.value.trim()) {
    const toast = els.toast();
    toast.textContent = 'Заполните поля "Откуда" и "Куда"';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
    return;
  }
  
  // open search sheet and backdrop
  els.tariffBackdrop().classList.remove('hidden');
  els.tariffBackdrop().classList.add('visible');
  els.searchSheet().classList.remove('hidden');
  requestAnimationFrame(() => els.searchSheet().classList.add('open'));
  
  // remove old listeners and add new ones
  const openBoostBtn = els.openBoost();
  if (openBoostBtn) {
    openBoostBtn.removeEventListener('click', openBoostSheet);
    openBoostBtn.addEventListener('click', openBoostSheet, { once: true });
  }
}
function closeSearchSheet() {
  els.searchSheet().classList.remove('open');
  setTimeout(() => els.searchSheet().classList.add('hidden'), 250);
  els.tariffBackdrop().classList.remove('visible');
  setTimeout(() => els.tariffBackdrop().classList.add('hidden'), 250);
}
function openBoostSheet() {
  // replace search sheet with boost sheet
  els.searchSheet().classList.remove('open');
  setTimeout(() => {
    els.searchSheet().classList.add('hidden');
    els.boostSheet().classList.remove('hidden');
    requestAnimationFrame(() => els.boostSheet().classList.add('open'));
  }, 200);
  
  // bind controls
  const closeBoostBtn = els.closeBoost();
  if (closeBoostBtn) {
    closeBoostBtn.removeEventListener('click', closeBoostSheet);
    closeBoostBtn.addEventListener('click', closeBoostSheet);
  }
  
  if (els.boostMinus()) els.boostMinus().addEventListener('click', () => adjustBoost(-10));
  if (els.boostPlus()) els.boostPlus().addEventListener('click', () => adjustBoost(10));
  if (els.boostRange()) els.boostRange().addEventListener('input', () => syncBoost(parseInt(els.boostRange().value, 10)));
  if (els.boostChips()) els.boostChips().addEventListener('click', (e) => {
    const target = e.target.closest('[data-boost]');
    if (!target) return;
    const value = parseInt(target.getAttribute('data-boost'), 10);
    syncBoost(value);
    highlightChip(value);
  });
  
  const confirmBoostBtn = els.confirmBoost();
  if (confirmBoostBtn) {
    confirmBoostBtn.removeEventListener('click', confirmBoostAndContinue);
    confirmBoostBtn.addEventListener('click', confirmBoostAndContinue, { once: true });
  }
  
  // init
  syncBoost(parseInt(els.boostRange().value, 10));
}
function closeBoostSheet() {
  els.boostSheet().classList.remove('open');
  setTimeout(() => els.boostSheet().classList.add('hidden'), 250);
  els.tariffBackdrop().classList.remove('visible');
  setTimeout(() => els.tariffBackdrop().classList.add('hidden'), 250);
}
function adjustBoost(delta) {
  const next = Math.max(0, Math.min(200, parseInt(els.boostRange().value, 10) + delta));
  syncBoost(next);
}
function syncBoost(value) {
  els.boostRange().value = String(value);
  // update total with boost
  const base = TariffBase[state.selectedTariff] + state.extraPoints * ExtraPointPrice;
  els.totalPrice().textContent = formatPrice(base + value);
  els.breakdown().textContent = `Приоритет +${value}₽`;
}
function highlightChip(value) {
  document.querySelectorAll('.chip-btn').forEach((c) => c.classList.toggle('active', parseInt(c.dataset.boost, 10) === value));
}

function confirmBoostAndContinue() {
  closeBoostSheet();
  // return to search sheet with applied boost
  setTimeout(() => {
    els.searchSheet().classList.remove('hidden');
    requestAnimationFrame(() => els.searchSheet().classList.add('open'));
    
    // update search title to show boost applied
    const searchTitle = els.searchSheet().querySelector('h2');
    if (searchTitle) {
      const boostValue = parseInt(els.boostRange().value, 10);
      searchTitle.textContent = `Ищу машины... +${boostValue}₽`;
    }
    
    // show toast
    const toast = els.toast();
    toast.textContent = 'Доплата применена. Ищем быстрее!';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }, 300);
}


