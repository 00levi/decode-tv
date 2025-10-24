// ---------------- CONFIG ----------------
const LOCAL_URL = './channel.json';
const REMOTE_URL = 'https://raw.githubusercontent.com/00levi/lista/refs/heads/main/channel.json';
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 1 día en milisegundos

let channels = [];
let currentIndex = 0;
const iframe = document.getElementById('playerFrame');
const overlay = document.getElementById('overlay');
const menu = document.getElementById('menu');
let overlayTimer = null;
let menuTimer = null;

// ---------------- FUNCIONES PRINCIPALES ----------------
async function loadChannels() {
  // 1️⃣ Intentar cargar desde localStorage si existe
  const cached = localStorage.getItem('channelsCache');
  const lastUpdate = localStorage.getItem('channelsCacheTime');
  const now = Date.now();

  if (cached) {
    try {
      channels = JSON.parse(cached);
      console.log('✅ Canales cargados desde caché');
      buildMenu();
      playChannel(0);
    } catch (e) {
      console.warn('⚠️ Caché corrupto, se usará archivo local');
    }
  }

  // 2️⃣ Cargar canal local si aún no hay datos válidos
  if (!Array.isArray(channels) || channels.length === 0) {
    try {
      const localRes = await fetch(LOCAL_URL);
      channels = await localRes.json();
      console.log('📁 Canales cargados desde archivo local');
      buildMenu();
      playChannel(0);
    } catch (err) {
      console.error('Error al cargar archivo local:', err);
      overlayText('No se pudieron cargar los canales');
    }
  }

  // 3️⃣ Verificar si ya pasó un día desde la última actualización
  if (!lastUpdate || now - lastUpdate > UPDATE_INTERVAL) {
    console.log('🌐 Intentando actualizar desde GitHub...');
    try {
      const remoteRes = await fetch(REMOTE_URL);
      if (!remoteRes.ok) throw new Error('Respuesta inválida de GitHub');
      const remoteData = await remoteRes.json();

      if (Array.isArray(remoteData) && remoteData.length > 0) {
        channels = remoteData;
        localStorage.setItem('channelsCache', JSON.stringify(remoteData));
        localStorage.setItem('channelsCacheTime', now);
        console.log('🔄 Canales actualizados desde GitHub');
        buildMenu();
      }
    } catch (err) {
      console.warn('⚠️ No se pudo actualizar desde GitHub:', err);
    }
  }
}

// ---------------- MENÚ Y REPRODUCTOR ----------------
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

// ---------------- MENÚ Y OVERLAY ----------------
function updateMenuSelection(scrollIntoView = true) {
  const items = menu.querySelectorAll('.channel-item');
  items.forEach(it => it.classList.remove('selected'));
  const sel = menu.querySelector(`.channel-item[data-index="${currentIndex}"]`);
  if (sel) {
    sel.classList.add('selected');
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

// ---------------- CONTROL REMOTO / TECLADO ----------------
window.addEventListener('keydown', (e) => {
  if (menu.classList.contains('show')) {
    const items = menu.querySelectorAll('.channel-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown' || e.keyCode === 233) {
      currentIndex = (currentIndex + 1) % items.length;
      updateMenuSelection();
      resetMenuTimer();
      e.preventDefault();
      return;
    } else if (e.key === 'ArrowUp' || e.keyCode === 234) {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateMenuSelection();
      resetMenuTimer();
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

  switch (e.key) {
    case 'ArrowDown':
      playChannel(currentIndex + 1);
      break;
    case 'ArrowUp':
      playChannel(currentIndex - 1);
      break;
    case 'ArrowRight':
      showMenu();
      break;
    default:
      switch (e.keyCode) {
        case 233: nextChannel(); break;
        case 234: prevChannel(); break;
        case 36:
          if (menu.classList.contains('show')) hideMenu();
          else showMenu();
          break;
      }
      break;
  }
});

// ---------------- INICIO ----------------
loadChannels();
