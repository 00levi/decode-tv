// Renderer logic: loads channels and handles keyboard / remote control
const CHANNELS_URL = 'https://raw.githubusercontent.com/00levi/lista/refs/heads/main/channel.json';

let channels = [];
let currentIndex = 0;
const iframe = document.getElementById('playerFrame');
const overlay = document.getElementById('overlay');
const menu = document.getElementById('menu');
let overlayTimer = null;
let menuTimer = null;

async function loadChannels() {
  try {
    const res = await fetch(CHANNELS_URL);
    channels = await res.json();
    if (!Array.isArray(channels) || channels.length === 0) {
      overlayText('No se encontraron canales');
      return;
    }
    buildMenu();
    currentIndex = 0;
    playChannel(currentIndex);
  } catch (err) {
    console.error('Error al cargar canales:', err);
    overlayText('Error cargando canales');
  }
}

function buildMenu() {
  menu.innerHTML = '';
  channels.forEach((ch, idx) => {
    const el = document.createElement('div');
    el.className = 'channel-item' + (idx === currentIndex ? ' selected' : '');
    el.dataset.index = idx;
    el.textContent = (ch.id !== undefined ? ch.id + ' - ' : '') + ch.title;
    el.addEventListener('click', () => selectIndex(idx));
    menu.appendChild(el);
  });
}

function updateMenuSelection(scrollIntoView = true) {
  const items = menu.querySelectorAll('.channel-item');
  items.forEach(it => it.classList.remove('selected'));
  const sel = menu.querySelector(`.channel-item[data-index="${currentIndex}"]`);
  if (sel) {
    sel.classList.add('selected');
    // Mantener visible el canal seleccionado
    if (scrollIntoView) sel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function showMenu(timeout = 5000) {
  menu.classList.add('show');
  menu.setAttribute('aria-hidden', 'false');
  updateMenuSelection(false);
  resetMenuTimer(timeout);
}

function hideMenu() {
  menu.classList.remove('show');
  menu.setAttribute('aria-hidden', 'true');
  clearMenuTimer();
}

function resetMenuTimer(timeout = 5000) {
  clearMenuTimer();
  menuTimer = setTimeout(hideMenu, timeout);
}

function clearMenuTimer() {
  if (menuTimer) {
    clearTimeout(menuTimer);
    menuTimer = null;
  }
}

function overlayText(text, timeout = 4000) {
  overlay.textContent = text;
  overlay.classList.add('show');
  if (overlayTimer) clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => {
    overlay.classList.remove('show');
  }, timeout);
}

function playChannel(index) {
  if (!channels || channels.length === 0) return;
  index = ((index % channels.length) + channels.length) % channels.length;
  currentIndex = index;
  const ch = channels[currentIndex];
  const src = ch.iframe + (ch.iframe.includes('?') ? '&' : '?') + 't=' + Date.now();
  iframe.src = src;
  overlayText((ch.id !== undefined ? ch.id + ' - ' : '') + ch.title);
  updateMenuSelection(false);
}

function selectIndex(idx) {
  playChannel(idx);
  hideMenu();
}

function nextChannel() {
  playChannel(currentIndex + 1);
}

function prevChannel() {
  playChannel(currentIndex - 1);
}

// ----------- CONTROL DE TECLAS / REMOTO -------------
window.addEventListener('keydown', (e) => {
  // Si el menú está visible, las flechas solo mueven la selección
  if (menu.classList.contains('show')) {
    const items = menu.querySelectorAll('.channel-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown' || e.keyCode === 233) {
      currentIndex = (currentIndex + 1) % items.length;
      updateMenuSelection();
      resetMenuTimer(); // 🔁 reinicia el contador de 5s
      e.preventDefault();
      return;
    } else if (e.key === 'ArrowUp' || e.keyCode === 234) {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateMenuSelection();
      resetMenuTimer(); // 🔁 reinicia el contador de 5s
      e.preventDefault();
      return;
    } else if (e.key === 'Enter') {
      selectIndex(currentIndex);
      e.preventDefault();
      return;
    } else if (e.key === 'ArrowLeft' || e.keyCode === 36) {
      hideMenu();
      e.preventDefault();
      return;
    }
  }

  // Si el menú está oculto, las flechas cambian de canal
  switch (e.key) {
    case 'ArrowDown':
      nextChannel();
      break;
    case 'ArrowUp':
      prevChannel();
      break;
    case 'ArrowRight':
      showMenu();
      break;
    default:
      // Mapeo para control Noga
      switch (e.keyCode) {
        case 233: // Volumen +
          nextChannel();
          break;
        case 234: // Volumen -
          prevChannel();
          break;
        case 36: // Botón volver
          if (menu.classList.contains('show')) hideMenu();
          else showMenu();
          break;
      }
      break;
  }
});

// Cargar canales al inicio
loadChannels();
