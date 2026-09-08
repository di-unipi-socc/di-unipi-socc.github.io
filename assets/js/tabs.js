function initTabs(tabSelector, panelSelector) {
  const tabs = document.querySelectorAll(tabSelector); const panels = document.querySelectorAll(panelSelector);
  if (!tabs.length || !panels.length) return;
  tabs.forEach((tab, index) => tab.addEventListener('click', () => select(index)));
  function select(index) { tabs.forEach((tab, i) => { const active = i === index; tab.classList.toggle('selected', active); tab.dataset.active = active; panels[i].classList.toggle('hidden', !active); }); }
  select(0);
}
