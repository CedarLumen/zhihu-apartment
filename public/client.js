const joinPanel = document.getElementById('joinPanel');
const chatPanel = document.getElementById('chatPanel');

const nameInput = document.getElementById('nameInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authStatus = document.getElementById('authStatus');
const roleSelect = document.getElementById('roleSelect');
const residentFields = document.getElementById('residentFields');
const homeFloorSelect = document.getElementById('homeFloorSelect');
const doorplateSelect = document.getElementById('doorplateSelect');
const areaSelect = document.getElementById('areaSelect');
const restoreHistoryCheckbox = document.getElementById('restoreHistoryCheckbox');
const joinBtn = document.getElementById('joinBtn');

const selfInfo = document.getElementById('selfInfo');
const locationInfo = document.getElementById('locationInfo');

const scenePanel = document.getElementById('scenePanel');
const gameCanvas = document.getElementById('gameCanvas');
const sceneHint = document.getElementById('sceneHint');
const sceneCtx = gameCanvas.getContext('2d');

const DOME_101_ID = 'dome-101';
const DOME_101_LABEL = '101 穹顶';
const DOME_101_WORLD_CENTER_X = 0;
const DOME_101_WORLD_HALF_WIDTH = 180;
const DOME_101_CAPACITY = 50;
const STAR_TICKET_ID = 'star-ticket';
const STAR_SKY_TEXTURE_PATH = '/textures/starry_sky.jpg'; // 改成你的星空图文件名

const AGENT_JUMP_DURATION_MS = 520;   // 一次跳跃总时长
const AGENT_JUMP_HEIGHT = 22;         // 跳起最高像素
const agentJumpStartedAt = new Map(); // agentId -> 起跳时间戳

// ===== 聊天对话框（HTML 元素） =====
const chatBox = document.getElementById('chatBox');
const chatBoxTitle = document.getElementById('chatBoxTitle');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatBoxClose = document.getElementById('chatBoxClose');
const imeChatInput = document.getElementById('imeChatInput');
const messages = document.getElementById('messages');

// ===== 系统消息面板（HTML 元素） =====
const sysMsgBox = document.getElementById('sysMsgBox');
const sysMsgList = document.getElementById('sysMsgList');
const sysMsgClose = document.getElementById('sysMsgClose');
const usersList = document.getElementById('usersList');

// ===== 覆盖层面板（HTML 元素） =====
const stairsMenuBox = document.getElementById('stairsMenuBox');
const stairsMenuList = document.getElementById('stairsMenuList');
const stairsMenuSearchInput = document.getElementById('stairsMenuSearchInput');
const stairsMenuSearchClear = document.getElementById('stairsMenuSearchClear');

const friendPanelBox = document.getElementById('friendPanelBox');
const friendPanelList = document.getElementById('friendPanelList');
const friendSearchInput = document.getElementById('friendSearchInput');
const friendAddBtn = document.getElementById('friendAddBtn');

const teleportPanelBox = document.getElementById('teleportPanelBox');
const teleportPanelList = document.getElementById('teleportPanelList');
const teleportSearchInput = document.getElementById('teleportSearchInput');
const teleportSearchClear = document.getElementById('teleportSearchClear');

const roomSettingsBox = document.getElementById('roomSettingsBox');
const roomSettingsList = document.getElementById('roomSettingsList');
const roomSettingsAccessBtn = document.getElementById('roomSettingsAccessBtn');
const roomSettingsWallpaperPrev = document.getElementById('roomSettingsWallpaperPrev');
const roomSettingsWallpaperNext = document.getElementById('roomSettingsWallpaperNext');
const roomSettingsWallpaperLabel = document.getElementById('roomSettingsWallpaperLabel');
const roomSettingsSaveBtn = document.getElementById('roomSettingsSaveBtn');
const inventoryBox = document.getElementById('inventoryBox');
const inventoryListEl = document.getElementById('inventoryListEl');

// ===== 触屏虚拟按键 =====
const touchControls = document.getElementById('touchControls');
const touchLeftBtn = document.getElementById('touchLeftBtn');
const touchRightBtn = document.getElementById('touchRightBtn');
const touchJumpBtn = document.getElementById('touchJumpBtn');
const touchInteractBtn = document.getElementById('touchInteractBtn');

// ===== 全局悬浮层 =====
const toastBox = document.getElementById('toastBox');
const buttonTooltip = document.getElementById('buttonTooltip');

const TILE_SIZE = 32;
const DOOR_WIDTH = 32;
const DOOR_HEIGHT = 64;
const FLOOR_Y = 208;
const DOOR_START_X = 80;
const DOOR_SPACING = 84;
const STAIRS_OFFSET_X = 120;
const COMMUNITY_SPACE_OFFSET_X = STAIRS_OFFSET_X + DOOR_SPACING;
const PLAYER_SPEED = 190;
const PLAYER_ACCELERATION = 950;
const PLAYER_GROUND_DRAG = 3.5;
const PLAYER_AIR_DRAG = 3.5;
const PLAYER_JUMP_VELOCITY = -420;
const PLAYER_GRAVITY = 1200;
const JUMP_BUFFER_SECONDS = 0.14;
const HIDDEN_PHYSICS_INTERVAL_MS = 50;
const INTERACT_DISTANCE = 34;
const ROOM_WIDTH_TILES = 20;
const ROOM_HEIGHT_TILES = 5;
const ROOM_TOP_Y = 32;
const ROOM_WORLD_LEFT = 0;
const LOBBY_WORLD_CENTER_X = 0;
const STAIRS_LABEL = '楼梯间';
const COMMUNITY_SPACE_LABEL = '社区空间';
const EXIT_LABEL = '出口';
const COMMUNITY_SPACE_ROOM_ID = 'community-space';
const CHAT_OPEN_KEY = 'T';
const CLAIM_KEY = 'R';
const CLEAR_HISTORY_KEY = 'H';
const TELEPORT_KEY = 'G';
const NOTICE_DURATION_MS = 2600;
const UI_BUTTON_SIZE = 36;
const UI_BUTTON_GAP = 8;
const UI_BUTTON_MARGIN_X = 14;
const UI_BUTTON_MARGIN_Y = 12;

// ===== 视口 / 缩放相关 =====
const REF_DIAGONAL = Math.hypot(1280, 720);
const MIN_VIEW_SCALE = 1;
const MAX_VIEW_SCALE = 2.6;
const WORLD_CONTENT_TOP = 0;
const WORLD_CONTENT_BOTTOM = FLOOR_Y + TILE_SIZE;
const WORLD_CONTENT_HEIGHT = WORLD_CONTENT_BOTTOM - WORLD_CONTENT_TOP;

let dpr = 1;
let viewScale = 1;
let cssWidth = 1280;
let cssHeight = 720;
let cameraY = 0;

// ===== 账号状态 =====
let isAuthenticated = false;
let authenticatedName = null;

// ===== 墙纸预设 =====
let wallpaperPresets = [
  { id: 'default', name: '原木（默认）' },
  { id: 'sakura', name: '樱粉' },
  { id: 'ocean', name: '海蓝' },
  { id: 'forest', name: '森绿' },
  { id: 'sunset', name: '暖阳' },
  { id: 'night', name: '午夜' },
  { id: 'mono', name: '素白' },
  { id: 'violet', name: '紫罗兰' },
  { id: 'mint', name: '薄荷' }
];
let currentWallpaperId = 'default';

const WALLPAPER_TINTS = {
  default: null,
  sakura: 'rgba(255, 170, 200, 0.35)',
  ocean: 'rgba(100, 180, 255, 0.35)',
  forest: 'rgba(90, 200, 130, 0.35)',
  sunset: 'rgba(255, 170, 90, 0.35)',
  night: 'rgba(70, 70, 140, 0.45)',
  mono: 'rgba(230, 230, 230, 0.25)',
  violet: 'rgba(180, 120, 230, 0.35)',
  mint: 'rgba(110, 230, 210, 0.32)'
};

const AREA_TINTS = {
  lobby: {
    upper: 'rgba(255, 200, 120, 0.22)',  // 墙上层
    middle: 'rgba(255, 200, 120, 0.18)',  // 墙中层
    lower: 'rgba(255, 200, 120, 0.16)',  // 墙下层
    floor: 'rgba(255, 180, 90, 0.20)'    // 地板
  },
  corridor: {
    upper: 'rgba(110, 170, 255, 0.20)',
    middle: 'rgba(110, 170, 255, 0.16)',
    lower: 'rgba(110, 170, 255, 0.14)',
    floor: 'rgba(90, 140, 220, 0.18)'
  },
  dome: {
    upper: 'rgba(0, 0, 0, 0.9)',
    middle: 'rgba(0, 0, 0, 0.9)',
    lower: 'rgba(0, 0, 0, 0.9)',
    floor: 'rgba(0, 0, 0, 0.8)'
  }
};

const player = {
  x: DOOR_START_X,
  y: FLOOR_Y,
  velocityX: 0,
  velocityY: 0,
  moveLeft: false,
  moveRight: false
};

let ws;
let layout;
let sceneState = null;
let textures = {};
let sounds = {};
let bootError = '';
let lastFrame = 0;
let currentUserId = null;
let currentUserName = null;
let isJoined = false;
let lastSentPositionAt = 0;
let lastSentX = null;
let lastSentY = null;
let canSyncPlayerPosition = true;

let isStairsMenuOpen = false;
let stairsMenuAllOptions = [];
let stairsMenuOptions = [];
let stairsMenuIndex = 0;
let stairsMenuSearchQuery = '';

let isChatPanelOpen = false;
let isRoomSettingsOpen = false;
let chatInputText = '';
let isChatComposing = false;
const chatLog = [];
let currentAgentId = null;
let currentAgentName = null;
let isAgentChat = false;
let jumpBufferRemaining = 0;
let areaUserDirectory = [];
let friendList = [];
let blockedFriendList = [];
let systemMessagesData = [];
let unreadSystemMessageCount = 0;
let onlineFriendLocations = [];
let myRoomSettings = {
  defaultAccess: 'allow',
  whitelist: [],
  blacklist: []
};
let roomSettingsUserIndex = 0;
let isRoomSettingsDirty = false;
let isSystemMessagesOpen = false;
let systemMessageIndex = 0;
let systemMessageScrollOffset = 0;
let isFriendPanelOpen = false;
let friendPanelIndex = 0;
let friendPanelScrollOffset = 0;
let isTeleportMenuOpen = false;
let teleportAllOptions = [];
let teleportOptions = [];
let teleportIndex = 0;
let teleportScrollOffset = 0;
let teleportSearchQuery = '';
let roomSettingsScrollOffset = 0;
let inventoryList = [];
let inventoryIndex = 0;
let inventoryScrollOffset = 0;
const INVENTORY_VISIBLE_ROWS = 5;
let roomFurnishings = [];

let uiButtons = [];
let hoveredButtonKey = null;
let mouseCanvasX = -1;
let mouseCanvasY = -1;
let isChatInputActive = false;

const BUTTON_TOOLTIPS = {
  sysmsg: '系统消息',
  friends: '好友',
  teleport: '传送',
  chat: '聊天',
  claim: '认领/更换房间',
  settings: '我的房间设置'
};

const POSITION_SYNC_INTERVAL_MS = 50;

/* =========================================================
 *  账号 UI 辅助
 * ========================================================= */

function setAuthStatus(text, isError = false) {
  if (!authStatus) {
    return;
  }
  authStatus.textContent = text || '';
  authStatus.classList.toggle('error', !!isError && !!text);
  authStatus.classList.toggle('success', !isError && !!text);
}

function setAuthFormLocked(locked) {
  if (nameInput) {
    nameInput.readOnly = locked;
  }
  if (passwordInput) {
    passwordInput.disabled = locked;
  }
  if (loginBtn) {
    loginBtn.disabled = locked;
  }
  if (registerBtn) {
    registerBtn.disabled = locked;
  }
  if (joinBtn) {
    joinBtn.disabled = !locked;
  }
}

function sendAuth(type) {
  const name = String(nameInput?.value || '').trim();
  const password = String(passwordInput?.value || '');
  if (!name) {
    pushCanvasNotice('请输入用户名', true);
    setAuthStatus('请输入用户名', true);
    nameInput?.focus();
    return;
  }
  if (!password) {
    pushCanvasNotice('请输入密码', true);
    setAuthStatus('请输入密码', true);
    passwordInput?.focus();
    return;
  }
  if (!ws || ws.readyState !== 1) {
    pushCanvasNotice('正在连接服务器，请稍候…', true);
    setAuthStatus('正在连接服务器，请稍候…', true);
    return;
  }
  setAuthStatus(type === 'register' ? '正在注册…' : '正在登录…', false);
  send(type, { name, password });
}

/* =========================================================
 *  HTML 覆盖层面板：通用工具
 * ========================================================= */

function setListItems(ul, signature, items, buildItem, emptyText) {
  if (!ul) {
    return;
  }
  if (ul.dataset.signature === signature) {
    return;
  }
  ul.dataset.signature = signature;
  ul.dataset.scrolledIndex = '';
  ul.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'overlay-empty';
    li.textContent = emptyText || '暂无内容';
    ul.appendChild(li);
    return;
  }
  items.forEach((item, idx) => ul.appendChild(buildItem(item, idx)));
}

function updateListSelection(ul, index) {
  if (!ul) {
    return;
  }
  const children = ul.children;
  for (let i = 0; i < children.length; i += 1) {
    children[i].classList.toggle('selected', i === index);
  }
  const key = String(index);
  if (ul.dataset.scrolledIndex === key) {
    return;
  }
  ul.dataset.scrolledIndex = key;
  const selectedEl = children[index];
  if (selectedEl && selectedEl.classList.contains('overlay-list-item')) {
    selectedEl.scrollIntoView({ block: 'nearest' });
  }
}

function createItemIconImg(itemId) {
  const img = document.createElement('img');
  img.className = 'item-icon';
  img.alt = '';
  img.src = `/textures/${itemId}.png`;
  img.addEventListener('error', () => {
    if (img.dataset.fallback !== '1') {
      img.dataset.fallback = '1';
      img.src = `/textures/item-${itemId}.png`;
    } else {
      img.style.visibility = 'hidden';
    }
  });
  return img;
}

/**
 * 模糊/分词匹配：
 *  - 空查询 -> 全部匹配
 *  - 多词查询以空格分隔，要求每个词都出现在标签中（不区分大小写）
 */
function matchSearchTokens(label, query) {
  const tokens = String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return true;
  }
  const lower = String(label || '').toLowerCase();
  return tokens.every(t => lower.includes(t));
}

/* =========================================================
 *  场景提示（HTML）
 * ========================================================= */

function setSceneHint(text) {
  if (sceneHint) {
    sceneHint.textContent = text;
  }
}

/* =========================================================
 *  Toast 提示（HTML）
 * ========================================================= */

function pushCanvasNotice(text, isError = false) {
  if (!text || !toastBox) {
    return;
  }
  const el = document.createElement('div');
  el.className = `toast${isError ? ' error' : ''}`;
  el.textContent = String(text);
  toastBox.appendChild(el);
  while (toastBox.childElementCount > 6) {
    toastBox.removeChild(toastBox.firstElementChild);
  }
  setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 400);
  }, NOTICE_DURATION_MS);
}

/* =========================================================
 *  图标按钮提示（HTML）
 * ========================================================= */

function updateButtonTooltip() {
  if (!buttonTooltip) {
    return;
  }
  if (!isJoined || !hoveredButtonKey) {
    buttonTooltip.classList.add('hidden');
    return;
  }
  const button = uiButtons.find(b => b.key === hoveredButtonKey);
  const text = button && !button.disabled ? BUTTON_TOOLTIPS[button.key] : null;
  if (!text) {
    buttonTooltip.classList.add('hidden');
    return;
  }

  buttonTooltip.textContent = text;
  buttonTooltip.classList.remove('hidden');

  const rect = gameCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    buttonTooltip.classList.add('hidden');
    return;
  }
  const tipW = buttonTooltip.offsetWidth;
  const tipH = buttonTooltip.offsetHeight;

  let left = rect.left + button.x;
  let top = rect.top + (button.y + button.h) + 6;
  if (left + tipW > window.innerWidth - 4) {
    left = window.innerWidth - tipW - 4;
  }
  if (top + tipH > window.innerHeight - 4) {
    top = rect.top + button.y - tipH - 6;
  }
  buttonTooltip.style.left = `${Math.max(4, left)}px`;
  buttonTooltip.style.top = `${Math.max(4, top)}px`;
}

/* =========================================================
 *  聊天对话框（HTML 元素）相关
 * ========================================================= */

function scrollChatToBottom() {
  if (!messages) {
    return;
  }
  messages.scrollTop = messages.scrollHeight;
}

function isChatNearBottom(threshold = 48) {
  if (!messages) {
    return true;
  }
  return (messages.scrollHeight - messages.scrollTop - messages.clientHeight) <= threshold;
}

function updateChatImeInput() {
  if (!imeChatInput) {
    return;
  }

  if (!isJoined) {
    if (chatBox) {
      chatBox.classList.add('hidden');
    }
    isChatInputActive = false;
    if (document.activeElement === imeChatInput) {
      imeChatInput.blur();
    }
    return;
  }

  const covered = isChatPanelCoveredByOverlay();

  if (chatBox) {
    chatBox.classList.toggle('hidden', !isChatPanelOpen || covered);
  }

  if (!isChatComposing && imeChatInput.value !== chatInputText) {
    imeChatInput.value = chatInputText;
  }

  if (chatBoxTitle) {
    if (isAgentChat) {
      chatBoxTitle.textContent = `与 ${currentAgentName || '智能体'} 聊天`;
    } else {
      const a = areaName(sceneState?.areaId || '-');
      const r = roomName(sceneState?.roomId || '-');
      chatBoxTitle.textContent = `房间聊天 · ${a} / ${r}`;
    }
  }

  if ((!isChatPanelOpen || covered) && document.activeElement === imeChatInput) {
    imeChatInput.blur();
  }
}

function isChatPanelCoveredByOverlay() {
  return isStairsMenuOpen
    || isRoomSettingsOpen
    || isSystemMessagesOpen
    || isFriendPanelOpen
    || isTeleportMenuOpen;
}

function openChatPanel(agentId = null, agentName = null, activateInput = false) {
  if (!isJoined) {
    return;
  }

  isAgentChat = !!agentId;
  currentAgentId = agentId;
  currentAgentName = agentName;
  isChatPanelOpen = true;

  closeStairsMenu();
  closeRoomSettings();
  closeSystemMessagesPanel();
  closeFriendPanel();
  closeTeleportMenu();
  stopMovement();

  if (activateInput) {
    activateChatInput();
  } else {
    isChatInputActive = false;
    updateChatImeInput();
  }
}

function closeChatPanel() {
  if (isChatInputActive) {
    isChatInputActive = false;
    if (imeChatInput) {
      imeChatInput.blur();
    }
    updateChatImeInput();
    return;
  }

  if (isAgentChat) {
    isAgentChat = false;
    currentAgentId = null;
    currentAgentName = null;
    updateChatImeInput();
    return;
  }

  isChatPanelOpen = false;
  if (imeChatInput) {
    imeChatInput.blur();
  }
  updateChatImeInput();
}

function sendChatFromInput() {
  const text = String(chatInputText || '').trim();
  if (!text) {
    return;
  }
  if (isAgentChat && currentAgentId) {
    send('agent-chat', { agentId: currentAgentId, text });
  } else {
    send('chat', { text });
  }
  chatInputText = '';
  if (imeChatInput) {
    imeChatInput.value = '';
  }
}

function activateChatInput() {
  if (!isChatPanelOpen || isChatPanelCoveredByOverlay()) {
    return;
  }
  isChatInputActive = true;
  updateChatImeInput();
  requestAnimationFrame(() => {
    if (!imeChatInput) {
      return;
    }
    imeChatInput.focus();
    const len = imeChatInput.value.length;
    try {
      imeChatInput.setSelectionRange(len, len);
    } catch (_e) {
      /* ignore */
    }
    scrollChatToBottom();
  });
}

function deactivateChatInputAndFocusCanvas() {
  let changed = false;
  if (isChatInputActive) {
    isChatInputActive = false;
    changed = true;
  }
  if (imeChatInput && document.activeElement === imeChatInput) {
    imeChatInput.blur();
  }
  if (changed) {
    updateChatImeInput();
  }
  try {
    if (gameCanvas && typeof gameCanvas.focus === 'function') {
      gameCanvas.focus({ preventScroll: true });
    }
  } catch (_e) {
    /* ignore */
  }
}

/* =========================================================
 *  消息渲染
 * ========================================================= */

function renderHistory(history) {
  if (!messages) {
    return;
  }
  messages.innerHTML = '';
  chatLog.length = 0;
  history.forEach(m => {
    addMessage(m.sender, m.text, m.sender === 'System');
  });
  scrollChatToBottom();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdown(text) {
  if (!text) return '';
  let out = escapeHtml(text);
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, t, u) => {
    const safeUrl = escapeHtml(u);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(t)}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, (m, t) => `<strong>${t}</strong>`);
  out = out.replace(/\*([^*]+)\*/g, (m, t) => `<em>${t}</em>`);
  out = out.replace(/`([^`]+)`/g, (m, t) => `<code>${escapeHtml(t)}</code>`);
  out = out.replace(/\r?\n/g, '<br>');
  return out;
}

function useSelectedItem() {
  if (!isJoined || !inventoryList || !inventoryList.length) return false;
  const item = inventoryList[inventoryIndex];
  if (!item) return false;
  send('use-item', { itemId: item.id, slot: inventoryIndex });
  return true;
}

function addMessage(sender, text, isSystem = false) {
  if (!messages) {
    return;
  }
  if (String(text || '').trim().startsWith('#')) {
    return;
  }

  const stickToBottom = isChatNearBottom();

  const item = document.createElement('div');
  item.className = `msg ${isSystem ? 'sys' : ''}`;
  const rendered = `<strong>${escapeHtml(String(sender || ''))}:</strong> ${renderMarkdown(String(text || ''))}`;
  item.innerHTML = rendered;
  messages.appendChild(item);

  while (messages.childElementCount > 200) {
    messages.removeChild(messages.firstElementChild);
  }

  chatLog.push({ sender, text, isSystem });
  if (chatLog.length > 120) {
    chatLog.shift();
  }

  if (stickToBottom) {
    scrollChatToBottom();
  }
}

/* =========================================================
 *  System Messages 面板（HTML）
 * ========================================================= */

function renderSystemMessagesPanel() {
  if (!sysMsgList) {
    return;
  }

  const sysMessages = normalizeSystemMessages(systemMessagesData).slice().reverse();
  systemMessageIndex = clamp(systemMessageIndex, 0, Math.max(0, sysMessages.length - 1));

  const signature = sysMessages
    .map(m => `${m.id}|${m.read ? 1 : 0}|${m.meta?.status || ''}|${m.text}`)
    .join('\u0001');

  setListItems(sysMsgList, signature, sysMessages, (msg, idx) => {
    const li = document.createElement('li');
    li.className = 'sys-msg-item';
    li.classList.add(msg.read ? 'read' : 'unread');
    li.dataset.index = String(idx);

    if (msg.type === 'friend-request') {
      const badge = document.createElement('span');
      badge.className = 'status';
      badge.textContent = `[${msg.meta?.status || 'pending'}]`;
      li.appendChild(badge);
    }

    const textNode = document.createElement('span');
    textNode.textContent = msg.text;
    li.appendChild(textNode);

    li.addEventListener('click', () => {
      systemMessageIndex = idx;
      updateSystemMessageSelection();
    });

    return li;
  }, '暂无系统消息。');

  updateSystemMessageSelection();
}

function updateSystemMessageSelection() {
  if (!sysMsgList) {
    return;
  }
  const items = sysMsgList.querySelectorAll('.sys-msg-item');
  items.forEach((el, idx) => {
    el.classList.toggle('selected', idx === systemMessageIndex);
  });
  const selectedEl = items[systemMessageIndex];
  if (selectedEl) {
    selectedEl.scrollIntoView({ block: 'nearest' });
  }
}

/* =========================================================
 *  好友面板（HTML）
 * ========================================================= */

function friendStatusText(user) {
  if (user.kind === 'friend') {
    const parts = ['好友', user.online ? '在线' : '离线'];
    if (user.blocked) {
      parts.push('已屏蔽');
    }
    return parts.join(' · ');
  }
  return '玩家';
}

function renderFriendPanel() {
  if (!friendPanelBox) {
    return;
  }
  const visible = isJoined && isFriendPanelOpen;
  friendPanelBox.classList.toggle('hidden', !visible);
  if (!visible) {
    return;
  }

  const candidates = getFriendPanelCandidates();
  friendPanelIndex = clamp(friendPanelIndex, 0, Math.max(0, candidates.length - 1));
  friendPanelScrollOffset = ensureIndexVisible(friendPanelIndex, 8, candidates.length, friendPanelScrollOffset);

  const signature = candidates
    .map(u => `${u.id}|${u.kind}|${u.online ? 1 : 0}|${u.blocked ? 1 : 0}|${u.canTeleport ? 1 : 0}|${u.name}`)
    .join('\u0001');

  setListItems(friendPanelList, signature, candidates, (user, idx) => {
    const li = document.createElement('li');
    li.className = 'overlay-list-item';

    const nameEl = document.createElement('span');
    nameEl.className = 'overlay-item-name';
    nameEl.textContent = user.name;

    const statusEl = document.createElement('span');
    statusEl.className = 'overlay-item-status';
    statusEl.textContent = friendStatusText(user);

    li.appendChild(nameEl);
    li.appendChild(statusEl);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    if (user.kind === 'player') {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'mini-btn';
      addBtn.textContent = '加好友';
      addBtn.addEventListener('click', e => {
        e.stopPropagation();
        sendFriendRequestByName(user.name);
      });
      actions.appendChild(addBtn);
    } else if (user.kind === 'friend') {
      const tpBtn = document.createElement('button');
      tpBtn.type = 'button';
      tpBtn.className = 'mini-btn';
      tpBtn.textContent = '传送';
      tpBtn.disabled = !user.online || user.canTeleport === false;
      tpBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (!user.online || user.canTeleport === false) return;
        send('teleport', { kind: 'friend', friendName: user.name });
        closeFriendPanel();
      });
      actions.appendChild(tpBtn);

      const blockBtn = document.createElement('button');
      blockBtn.type = 'button';
      blockBtn.className = `mini-btn${user.blocked ? ' on' : ' warn'}`;
      blockBtn.textContent = user.blocked ? '解除屏蔽' : '屏蔽';
      blockBtn.addEventListener('click', e => {
        e.stopPropagation();
        sendFriendBlockToggleByName(user.name);
      });
      actions.appendChild(blockBtn);
    }

    li.appendChild(actions);

    li.addEventListener('click', () => {
      friendPanelIndex = idx;
      updateListSelection(friendPanelList, friendPanelIndex);
    });

    return li;
  }, '暂无好友或在线玩家。');

  updateListSelection(friendPanelList, friendPanelIndex);
}

/* =========================================================
 *  传送面板（HTML）
 * ========================================================= */

function renderTeleportPanel() {
  if (!teleportPanelBox) {
    return;
  }
  const visible = isJoined && isTeleportMenuOpen;
  teleportPanelBox.classList.toggle('hidden', !visible);
  if (!visible) {
    return;
  }

  teleportOptions = teleportAllOptions.filter(o => matchSearchTokens(o.label, teleportSearchQuery));
  teleportIndex = clamp(teleportIndex, 0, Math.max(0, teleportOptions.length - 1));
  teleportScrollOffset = ensureIndexVisible(teleportIndex, 9, teleportOptions.length, teleportScrollOffset);

  const signature = teleportOptions
    .map(o => `${o.label}|${o.disabled ? 1 : 0}`)
    .join('\u0001');

  setListItems(teleportPanelList, signature, teleportOptions, (item, idx) => {
    const li = document.createElement('li');
    li.className = 'overlay-list-item';
    if (item.disabled) {
      li.classList.add('disabled');
    }
    li.textContent = item.label;

    li.addEventListener('click', () => {
      if (item.disabled) {
        return;
      }
      if (teleportIndex === idx) {
        teleportToSelectedOption();
        closeTeleportMenu();
      } else {
        teleportIndex = idx;
        updateListSelection(teleportPanelList, teleportIndex);
      }
    });

    return li;
  }, teleportSearchQuery ? '没有匹配的传送目的地。' : '暂无可用传送目的地。');

  updateListSelection(teleportPanelList, teleportIndex);
}

/* =========================================================
 *  房间设置面板（HTML）
 * ========================================================= */

function renderRoomSettingsPanel() {
  if (!roomSettingsBox) {
    return;
  }
  const visible = isJoined && isRoomSettingsOpen;
  roomSettingsBox.classList.toggle('hidden', !visible);
  if (!visible) {
    return;
  }

  const defaultDenied = myRoomSettings.defaultAccess === 'deny';
  if (roomSettingsAccessBtn) {
    roomSettingsAccessBtn.textContent = defaultDenied ? '默认权限：拒绝' : '默认权限：允许';
    roomSettingsAccessBtn.classList.toggle('active-b', defaultDenied);
    roomSettingsAccessBtn.classList.toggle('active-w', !defaultDenied);
  }

  if (roomSettingsWallpaperLabel) {
    roomSettingsWallpaperLabel.textContent = `墙纸：${getWallpaperName(currentWallpaperId)}`;
  }

  roomSettingsUserIndex = clamp(roomSettingsUserIndex, 0, Math.max(0, areaUserDirectory.length - 1));
  roomSettingsScrollOffset = ensureIndexVisible(roomSettingsUserIndex, 7, areaUserDirectory.length, roomSettingsScrollOffset);

  const whitelist = myRoomSettings.whitelist || [];
  const blacklist = myRoomSettings.blacklist || [];
  const signature = areaUserDirectory
    .map(u => `${u.id}|${u.name}|${whitelist.includes(u.name) ? 'w' : blacklist.includes(u.name) ? 'b' : 'd'}`)
    .join('\u0001');

  setListItems(roomSettingsList, signature, areaUserDirectory, (user, idx) => {
    const li = document.createElement('li');
    li.className = 'overlay-list-item';

    const nameEl = document.createElement('span');
    nameEl.className = 'overlay-item-name';
    nameEl.textContent = user.name;
    li.appendChild(nameEl);

    const isW = whitelist.includes(user.name);
    const isB = blacklist.includes(user.name);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const makeBtn = (text, cls, onClick) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `mini-btn${cls ? ' ' + cls : ''}`;
      b.textContent = text;
      b.addEventListener('click', e => {
        e.stopPropagation();
        onClick();
        renderRoomSettingsPanel();
      });
      return b;
    };

    actions.appendChild(makeBtn('白名单', isW ? 'on' : '', () => toggleRoomSettingsList('whitelist', user.name)));
    actions.appendChild(makeBtn('黑名单', isB ? 'danger' : '', () => toggleRoomSettingsList('blacklist', user.name)));
    if (isW || isB) {
      actions.appendChild(makeBtn('移除', 'warn', () => removeRoomSettingsUser(user.name)));
    }

    li.appendChild(actions);

    li.addEventListener('click', () => {
      roomSettingsUserIndex = idx;
      updateListSelection(roomSettingsList, roomSettingsUserIndex);
    });

    return li;
  }, '当前区域没有其他玩家可设置。');

  updateListSelection(roomSettingsList, roomSettingsUserIndex);
}

/* =========================================================
 *  背包 HUD（HTML）
 * ========================================================= */

function renderInventoryHUD() {
  if (!inventoryBox) {
    return;
  }
  const visible = !!isJoined;
  inventoryBox.classList.toggle('hidden', !visible);
  if (!visible) {
    return;
  }

  inventoryIndex = clamp(inventoryIndex, 0, Math.max(0, inventoryList.length - 1));
  inventoryScrollOffset = ensureIndexVisible(inventoryIndex, INVENTORY_VISIBLE_ROWS, inventoryList.length, inventoryScrollOffset);

  const signature = inventoryList
    .map(it => `${it.id}|${it.name}|${it.qty}`)
    .join('\u0001');

  setListItems(inventoryListEl, signature, inventoryList, (item, idx) => {
    const li = document.createElement('li');
    li.className = 'overlay-list-item';

    li.appendChild(createItemIconImg(item.id));

    const label = document.createElement('span');
    label.className = 'item-label';
    label.textContent = item.name || item.id;
    li.appendChild(label);

    const qty = document.createElement('span');
    qty.className = 'item-qty';
    qty.textContent = `x${item.qty}`;
    li.appendChild(qty);

    li.addEventListener('click', () => {
      inventoryIndex = idx;
      updateListSelection(inventoryListEl, inventoryIndex);
    });
    li.addEventListener('dblclick', () => {
      inventoryIndex = idx;
      useSelectedItem();
    });

    return li;
  }, '背包为空');

  updateListSelection(inventoryListEl, inventoryIndex);
}

/* =========================================================
 *  区域 / 房间 名称
 * ========================================================= */

function areaName(areaId) {
  if (areaId === DOME_101_ID) return DOME_101_LABEL;
  if (areaId === 'lobby-1') return '大厅 1';
  if (areaId === 'lobby-2') return '大厅 2';
  if (areaId.startsWith('floor-')) return `楼层 ${areaId.split('-')[1]}`;
  return areaId;
}

function roomName(roomId) {
  if (sceneState?.areaId === DOME_101_ID && roomId === 'main') { return '穹顶'; }
  if (roomId === 'main') return '大厅';
  if (roomId === 'corridor') return '走廊';
  if (roomId === COMMUNITY_SPACE_ROOM_ID || roomId === roomIdFromLayout()) {
    if (sceneState?.areaId === 'floor-1') return '智能体平台';
    return '社区空间';
  }
  if (roomId.startsWith('room-')) return `${roomId.split('-')[1]} 号房间`;
  return roomId;
}

function roomIdFromLayout() {
  return layout?.communitySpaceRoomId || COMMUNITY_SPACE_ROOM_ID;
}

function normalizeSystemMessages(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      id: Number(item.id),
      type: String(item.type || ''),
      text: String(item.text || ''),
      createdAt: String(item.createdAt || ''),
      read: item.read === true,
      meta: item.meta && typeof item.meta === 'object' ? item.meta : {}
    }))
    .filter(item => Number.isInteger(item.id) && item.text);
}

function nameKey(name) {
  return String(name || '').trim().toLowerCase();
}

function isNameInList(list, name) {
  const key = nameKey(name);
  return Array.isArray(list) && !!key && list.some(item => nameKey(item) === key);
}

function ensureIndexVisible(index, visibleCount, totalCount, offset) {
  const maxOffset = Math.max(0, totalCount - visibleCount);
  let nextOffset = clamp(offset, 0, maxOffset);
  if (index < nextOffset) {
    nextOffset = index;
  }
  if (index >= nextOffset + visibleCount) {
    nextOffset = index - visibleCount + 1;
  }
  return clamp(nextOffset, 0, maxOffset);
}

function getPendingSystemMessages() {
  return systemMessagesData.filter(item => item.type === 'friend-request' && item.meta?.status === 'pending');
}

function getFriendPanelCandidates() {
  const onlineMap = new Map((onlineFriendLocations || [])
    .filter(item => item && item.name)
    .map(item => [nameKey(item.name), item]));

  const entries = [];
  const seen = new Set();

  (friendList || []).forEach(friendName => {
    const key = nameKey(friendName);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    const online = onlineMap.get(key) || null;
    const blocked = isNameInList(blockedFriendList, friendName);
    entries.push({
      id: `friend:${key}`,
      kind: 'friend',
      name: String(friendName),
      online: !!online,
      blocked,
      canTeleport: online ? online.canTeleport !== false : false,
      areaId: online?.areaId || null,
      roomId: online?.roomId || null
    });
  });

  (sceneState?.roomUsers || []).forEach(user => {
    if (!user || user.id === currentUserId || isNameInList(friendList, user.name)) {
      return;
    }
    if (user.role === 'agent') {
      return;
    }
    const key = nameKey(user.name);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    entries.push({
      id: `player:${user.id || key}`,
      kind: 'player',
      name: user.name
    });
  });

  return entries;
}

function buildTeleportOptions() {
  const options = [];
  const visited = Array.isArray(sceneState?.visitedFloors) ? sceneState.visitedFloors : [];
  visited.forEach(floor => {
    options.push({ kind: 'floor', floor: Number(floor), label: `楼层 ${floor} 走廊` });
  });

  (onlineFriendLocations || []).forEach(friend => {
    const area = areaName(friend.areaId || '-');
    const room = roomName(friend.roomId || '-');
    const blocked = isNameInList(blockedFriendList, friend.name);
    const suffix = blocked
      ? '（已屏蔽）'
      : (friend.canTeleport === false ? '（拒绝传送）' : '');
    options.push({
      kind: 'friend',
      friendName: friend.name,
      disabled: blocked || friend.canTeleport === false,
      label: `好友 ${friend.name}：${area} / ${room}${suffix}`
    });
  });
  return options;
}

function fillOptions() {
  if (!layout) {
    return;
  }
  const areas = [
    ...layout.lobbies.map(x => ({ value: x.id, label: `${areaName(x.id)}（容量 ${x.capacity}）` })),
    ...layout.floors.map(x => ({
      value: `floor-${x}`,
      label: `楼层 ${x}（住户 ${layout.residentCapacity} / 访客 ${layout.visitorCapacity}）`
    }))
  ];

  areaSelect.innerHTML = '';
  areas.forEach(item => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    areaSelect.appendChild(option);
  });

  homeFloorSelect.innerHTML = '';
  layout.floors.forEach(x => {
    const option = document.createElement('option');
    option.value = String(x);
    option.textContent = `楼层 ${x}`;
    homeFloorSelect.appendChild(option);
  });

  doorplateSelect.innerHTML = '';
  for (let i = 1; i <= layout.residentCapacity; i += 1) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = String(i);
    doorplateSelect.appendChild(option);
  }

  if (Array.isArray(layout.wallpapers) && layout.wallpapers.length) {
    wallpaperPresets = layout.wallpapers;
  }
  currentWallpaperId = layout.defaultWallpaper || 'default';
}

function buildStairsMenuOptions() {
  if (!layout) {
    return [];
  }

  const options = [
    ...layout.lobbies.map(lobby => ({ areaId: lobby.id, label: areaName(lobby.id) })),
    ...layout.floors.map(floor => ({ areaId: `floor-${floor}`, label: `楼层 ${floor}` }))
  ];

  if (layout.dome) {
    options.push({
      areaId: layout.dome.id,
      label: `${layout.dome.name}（需要 穹顶通行证）`
    });
  }

  return options;
}
/* =========================================================
 *  墙纸工具
 * ========================================================= */

function getWallpaperName(id) {
  const preset = wallpaperPresets.find(item => item.id === id);
  return preset ? preset.name : id;
}

function getWallpaperTint(id) {
  return WALLPAPER_TINTS[id] || null;
}

function drawWallpaperTile(image, x, y, w, h, fallback, tint) {
  drawSprite(image, x, y, w, h, fallback);
  if (tint) {
    sceneCtx.save();
    sceneCtx.fillStyle = tint;
    sceneCtx.fillRect(x, y, w, h);
    sceneCtx.restore();
  }
}

function cycleWallpaper(delta) {
  if (!isJoined || !sceneState?.ownedRoom) {
    return;
  }
  const presets = wallpaperPresets.length ? wallpaperPresets : [{ id: 'default', name: '默认' }];
  let idx = presets.findIndex(item => item.id === currentWallpaperId);
  if (idx === -1) {
    idx = 0;
  }
  idx = (idx + delta + presets.length) % presets.length;
  const next = presets[idx];
  currentWallpaperId = next.id;
  send('set-wallpaper', { wallpaperId: next.id });
  if (roomSettingsWallpaperLabel) {
    roomSettingsWallpaperLabel.textContent = `墙纸：${next.name}`;
  }
}

/* =========================================================
 *  楼梯菜单（HTML）
 * ========================================================= */

function renderStairsMenu() {
  if (!stairsMenuBox) {
    return;
  }
  const visible = isJoined && isStairsMenuOpen;
  stairsMenuBox.classList.toggle('hidden', !visible);
  if (!visible) {
    return;
  }

  stairsMenuOptions = stairsMenuAllOptions.filter(o => matchSearchTokens(o.label, stairsMenuSearchQuery));
  stairsMenuIndex = clamp(stairsMenuIndex, 0, Math.max(0, stairsMenuOptions.length - 1));

  const signature = stairsMenuOptions.map(o => `${o.areaId}|${o.label}`).join('\u0001');

  setListItems(stairsMenuList, signature, stairsMenuOptions, (item, idx) => {
    const li = document.createElement('li');
    li.className = 'overlay-list-item';
    li.textContent = item.label;
    li.addEventListener('click', () => {
      stairsMenuIndex = idx;
      confirmStairsSelection();
    });
    return li;
  }, stairsMenuSearchQuery ? '没有匹配的地点' : '没有可前往的地点');

  updateListSelection(stairsMenuList, stairsMenuIndex);
}

function confirmStairsSelection() {
  const selected = stairsMenuOptions[stairsMenuIndex];
  if (selected && selected.areaId !== sceneState?.areaId) {
    playSound('doorOpen');
    send('switch-area', { areaId: selected.areaId });
  }
  closeStairsMenu();
}

/* =========================================================
 *  移动 / 声音 / 加载
 * ========================================================= */

function stopMovement() {
  player.moveLeft = false;
  player.moveRight = false;
}

function openStairsMenu() {
  if (!sceneState || !layout) {
    return;
  }
  const mode = getSceneMode();
  if (mode !== 'corridor' && mode !== 'lobby' && mode !== 'dome') {
    return;
  }
  stairsMenuAllOptions = buildStairsMenuOptions();
  stairsMenuSearchQuery = '';
  if (stairsMenuSearchInput) {
    stairsMenuSearchInput.value = '';
  }
  stairsMenuOptions = stairsMenuAllOptions;
  stairsMenuIndex = Math.max(0, stairsMenuAllOptions.findIndex(x => x.areaId === sceneState.areaId));
  isStairsMenuOpen = true;
  closeSystemMessagesPanel();
  closeFriendPanel();
  closeTeleportMenu();
  stopMovement();
  updateChatImeInput();
  renderStairsMenu();

  if (stairsMenuSearchInput && !isTouchDevice) {
    requestAnimationFrame(() => {
      try { stairsMenuSearchInput.focus({ preventScroll: true }); } catch (_e) { /* ignore */ }
    });
  }
}

function closeStairsMenu() {
  isStairsMenuOpen = false;
  updateChatImeInput();
  if (stairsMenuBox) {
    stairsMenuBox.classList.add('hidden');
  }
}

function send(type, payload) {
  if (!ws || ws.readyState !== 1) {
    return;
  }
  ws.send(JSON.stringify({ type, payload }));
}

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function loadAudio(src) {
  return new Promise(resolve => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    const done = () => resolve(audio);
    audio.addEventListener('canplaythrough', done, { once: true });
    audio.addEventListener('error', () => resolve(null), { once: true });
    audio.load();
    setTimeout(() => resolve(audio), 1200);
  });
}

async function loadTextures() {
  const [
    floor,
    wallpaperLower,
    wallpaperMiddle,
    wallpaperUpper,
    door,
    playerImage,
    iconChat,
    iconMyRoomSettings,
    iconClaimRoom,
    iconClaimRoomTypo,
    iconFriends,
    iconSystemMessage,
    iconSystemMessageNew,
    iconTeleport,
    starrySky
  ] = await Promise.all([
    loadImage('/textures/floor.png'),
    loadImage('/textures/wallpaper_lower.png'),
    loadImage('/textures/wallpaper_middle.png'),
    loadImage('/textures/wallpaper_upper.png'),
    loadImage('/textures/door32x64.png'),
    loadImage('/textures/player.png'),
    loadImage('/textures/icon_chat.png'),
    loadImage('/textures/icon_my_room_settings.png'),
    loadImage('/textures/icon_claim_room.png'),
    loadImage('/textures/icon_cliam_room.png'),
    loadImage('/textures/Icon_friends.png'),
    loadImage('/textures/icon_sys_msg.png'),
    loadImage('/textures/icon_sys_msg_new_msg.png'),
    loadImage('/textures/icon_teleport.png'),
    loadImage(STAR_SKY_TEXTURE_PATH)
  ]);

  const agentRobot = await loadImage('/textures/agent_robot.webp');

  textures = {
    floor,
    wallpaperLower,
    wallpaperMiddle,
    wallpaperUpper,
    door,
    playerImage,
    iconChat,
    iconMyRoomSettings,
    iconClaimRoom: iconClaimRoom || iconClaimRoomTypo,
    iconFriends,
    iconSystemMessage,
    iconSystemMessageNew,
    iconTeleport,
    starrySky
  };
  textures.agentRobot = agentRobot;
  textures.agentAvatarCache = Object.create(null);
  textures.itemIcons = Object.create(null);
}
function getAgentAvatarImage(avatarPath) {
  const key = String(avatarPath || '/textures/agent_robot.webp');
  if (!textures.agentAvatarCache) {
    return textures.agentRobot;
  }
  const cached = textures.agentAvatarCache[key];
  if (cached === undefined) {
    textures.agentAvatarCache[key] = null;
    loadImage(key).then(img => {
      textures.agentAvatarCache[key] = img || null;
    }).catch(() => {
      textures.agentAvatarCache[key] = null;
    });
    return textures.agentRobot;
  }
  return cached || textures.agentRobot;
}

async function loadSounds() {
  const doorOpen = await loadAudio('/sound/door_open.mp3');
  sounds = { doorOpen };
}

function playSound(soundName) {
  const sound = sounds[soundName];
  if (!sound) {
    return;
  }
  sound.currentTime = 0;
  sound.play().catch(() => { });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function triggerAgentJump(agentId) {
  const id = String(agentId || '').trim();
  if (!id) return;
  agentJumpStartedAt.set(id, performance.now());
}

function getAgentJumpOffsetY(agentId) {
  const id = String(agentId || '').trim();
  if (!id) return 0;

  const startedAt = agentJumpStartedAt.get(id);
  if (!startedAt) return 0;

  const elapsed = performance.now() - startedAt;
  if (elapsed >= AGENT_JUMP_DURATION_MS) {
    agentJumpStartedAt.delete(id);
    return 0;
  }

  const t = elapsed / AGENT_JUMP_DURATION_MS;
  // 0 → 1 → 0 的正弦弧线
  return -Math.sin(t * Math.PI) * AGENT_JUMP_HEIGHT;
}

function getDoorX(doorplate) {
  return DOOR_START_X + (doorplate - 1) * DOOR_SPACING;
}

function getCommunitySpaceRoomId() {
  return layout?.communitySpaceRoomId || COMMUNITY_SPACE_ROOM_ID;
}

function getCommunitySpaceX() {
  return getDoorX(layout.residentCapacity) + (Number(layout.communitySpaceOffsetX) || COMMUNITY_SPACE_OFFSET_X);
}

function getSceneMode(targetState = sceneState) {
  if (!targetState) {
    return 'none';
  }
  if (targetState.areaId === DOME_101_ID || targetState.areaType === 'dome') {
    return 'dome';
  }
  if (targetState.areaType === 'lobby') {
    return 'lobby';
  }
  if (targetState.areaType === 'floor' && targetState.roomId === 'corridor') {
    return 'corridor';
  }
  if (targetState.areaType === 'floor' && /^room-\d+$/.test(targetState.roomId || '')) {
    return 'room';
  }
  if (targetState.areaType === 'floor' && targetState.roomId === roomIdFromLayout()) {
    return 'room';
  }
  return 'none';
}

function getRoomGeometry() {
  const width = ROOM_WIDTH_TILES * TILE_SIZE;
  const height = ROOM_HEIGHT_TILES * TILE_SIZE;
  const left = ROOM_WORLD_LEFT;
  const top = ROOM_TOP_Y;
  const floorY = top + (ROOM_HEIGHT_TILES - 1) * TILE_SIZE;
  return { width, height, left, top, floorY };
}

function getWorldBounds(mode, interactables) {
  if (mode === 'lobby') {
    return {
      min: LOBBY_WORLD_CENTER_X - 160,
      max: LOBBY_WORLD_CENTER_X + 160
    };
  }
  if (mode === 'dome') {
    return {
      min: DOME_101_WORLD_CENTER_X - DOME_101_WORLD_HALF_WIDTH,
      max: DOME_101_WORLD_CENTER_X + DOME_101_WORLD_HALF_WIDTH
    };
  }
  if (mode === 'room') {
    const room = getRoomGeometry();
    return { min: room.left, max: room.left + room.width };
  }
  const structural = getStructuralInteractables(interactables);
  if (!structural.length) {
    return { min: 0, max: 1000 };
  }
  return {
    min: structural[0].x - 80,
    max: structural[structural.length - 1].x + 80
  };
}

function getWorldViewWidth() {
  // 用画布物理宽度除以世界缩放，得到世界可见宽度
  return gameCanvas.width / getPixelPerfectScale();
}
function computeCameraX(bounds) {
  const viewWidth = getWorldViewWidth();
  const worldWidth = bounds.max - bounds.min;
  if (worldWidth <= viewWidth) {
    return (bounds.min + bounds.max) / 2 - viewWidth / 2;
  }
  return clamp(player.x - viewWidth / 2, bounds.min, bounds.max - viewWidth);
}

function getAgentInteractables(mode) {
  const agents = (sceneState?.roomUsers || []).filter(u => u && u.role === 'agent');
  if (!agents.length) {
    return [];
  }

  let fallbackBaseX;
  let groundY;
  if (mode === 'room') {
    const room = getRoomGeometry();
    fallbackBaseX = room.left + room.width - 100;
    groundY = room.floorY;
  } else if (mode === 'lobby') {
    fallbackBaseX = LOBBY_WORLD_CENTER_X + 140;
    groundY = FLOOR_Y;
  }
  else if (mode === 'dome') {
    fallbackBaseX = DOME_101_WORLD_CENTER_X + 40;
    groundY = FLOOR_Y;
  }
  else if (mode === 'corridor') {
    const communityOffset = Number(layout?.communitySpaceOffsetX) || COMMUNITY_SPACE_OFFSET_X;
    fallbackBaseX = getDoorX(layout.residentCapacity) + communityOffset + 60;
    groundY = FLOOR_Y;
  } else {
    return [];
  }

  return agents.map((agent, i) => {
    const rawY = Number.isFinite(agent.posY) ? Number(agent.posY) : null;
    const y = (rawY !== null && rawY > 0) ? rawY : groundY;
    return {
      type: 'agent',
      x: Number.isFinite(agent.posX) ? agent.posX : fallbackBaseX + i * 60,
      y,
      agentId: agent.id,
      ownerName: agent.name,
      avatar: agent.avatar || '/textures/agent_robot.webp'
    };
  });
}

function getInteractables(mode = getSceneMode()) {
  if (!sceneState || !layout) {
    return [];
  }

  if (mode === 'corridor') {
    const owners = new Map((sceneState.floorDirectory || []).map(x => [x.doorplate, x.ownerName]));
    const interactables = [];
    for (let doorplate = 1; doorplate <= layout.residentCapacity; doorplate += 1) {
      interactables.push({
        type: 'room',
        x: getDoorX(doorplate),
        roomId: `room-${doorplate}`,
        doorplate,
        ownerName: owners.get(doorplate) || '空置'
      });
    }

    const stairsOffset = Number(layout.stairsOffsetX) || STAIRS_OFFSET_X;
    const communityOffset = Number(layout.communitySpaceOffsetX) || COMMUNITY_SPACE_OFFSET_X;
    const stairsX = getDoorX(layout.residentCapacity) + stairsOffset;
    const communityRoomId = layout.communitySpaceRoomId || COMMUNITY_SPACE_ROOM_ID;

    interactables.push({
      type: 'stairs',
      x: stairsX,
      roomId: null,
      doorplate: null,
      ownerName: STAIRS_LABEL
    });

    interactables.push({
      type: 'community',
      x: getDoorX(layout.residentCapacity) + communityOffset,
      roomId: communityRoomId,
      doorplate: null,
      ownerName: COMMUNITY_SPACE_LABEL
    });

    interactables.push(...getAgentInteractables(mode));

    return interactables;
  }
  if (mode === 'dome') {
    const items = [{
      type: 'stairs',
      x: DOME_101_WORLD_CENTER_X + DOME_101_WORLD_HALF_WIDTH - 40,
      ownerName: STAIRS_LABEL
    }];

    items.push(...getAgentInteractables(mode));
    return items;
  }
  if (mode === 'lobby') {
    const centerX = LOBBY_WORLD_CENTER_X;
    const items = [{ type: 'stairs', x: centerX, ownerName: STAIRS_LABEL }];
    items.push(...getAgentInteractables(mode));
    return items;
  }

  if (mode === 'room') {
    const room = getRoomGeometry();
    const items = [{ type: 'exit', x: room.left + 54, ownerName: EXIT_LABEL, roomId: 'corridor' }];
    items.push(...getAgentInteractables(mode));
    return items;
  }

  return [];
}

function getStructuralInteractables(interactables) {
  const structural = (interactables || []).filter(x => x && x.type !== 'agent');
  return structural.length ? structural : (interactables || []);
}

function getNearestInteractable(interactables) {
  let nearest = null;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const item of interactables) {
    const distance = Math.abs(player.x - item.x);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = item;
    }
  }

  if (minDistance > INTERACT_DISTANCE) {
    return null;
  }
  return nearest;
}

function describeInteractable(item) {
  if (!item) {
    return `移动 A/D 或 ←/→，跳跃 W/↑/空格，聊天 ${CHAT_OPEN_KEY}。按 E 在门或楼梯间旁交互，按 ${CLEAR_HISTORY_KEY} 清空所有历史记录。`;
  }
  if (item.type === 'stairs') {
    return `按 E：进入${STAIRS_LABEL}。按 ${CHAT_OPEN_KEY} 聊天，按 ${CLEAR_HISTORY_KEY} 清空所有历史记录。`;
  }
  if (item.type === 'community') {
    return `按 E：进入${COMMUNITY_SPACE_LABEL}。按 ${CHAT_OPEN_KEY} 聊天，按 ${CLEAR_HISTORY_KEY} 清空所有历史记录。`;
  }
  if (item.type === 'agent') {
    return `按 E：与 ${item.ownerName} 聊天。按 ${CHAT_OPEN_KEY} 聊天，按 ${CLEAR_HISTORY_KEY} 清空所有历史记录。`;
  }
  if (item.type === 'exit') {
    return `按 E：使用${EXIT_LABEL}返回走廊。`;
  }
  return `按 E：进入房间 ${item.doorplate}（${item.ownerName}）。按 ${CLAIM_KEY} 申请房间/搬入，按 ${CLEAR_HISTORY_KEY} 清空所有历史记录。`;
}

function handleClaimNearestRoom() {
  if (!sceneState || getSceneMode() !== 'corridor') {
    return;
  }
  const nearest = getNearestInteractable(getInteractables('corridor'));
  if (!nearest || nearest.type !== 'room') {
    return;
  }
  send('claim-room', { doorplate: Number(nearest.doorplate) });
}

function sendFriendRequestByName(name) {
  const targetName = String(name || '').trim();
  if (!targetName) {
    return;
  }
  send('friend-request', { targetName });
}

function sendFriendBlockToggleByName(name) {
  const friendName = String(name || '').trim();
  if (!friendName) {
    return;
  }
  send('friend-block-toggle', { friendName });
}

function handleSelectedSystemMessageAction(action) {
  const list = normalizeSystemMessages(systemMessagesData).slice().reverse();
  const selected = list[systemMessageIndex] || null;
  if (!selected || selected.type !== 'friend-request' || selected.meta?.status !== 'pending') {
    return;
  }
  send('friend-request-action', {
    messageId: selected.id,
    action
  });
}

function teleportToSelectedOption() {
  const selected = teleportOptions[teleportIndex] || null;
  if (!selected || selected.disabled) {
    return;
  }
  if (selected.kind === 'floor') {
    send('teleport', { kind: 'floor', floor: selected.floor });
    return;
  }
  if (selected.kind === 'friend') {
    send('teleport', { kind: 'friend', friendName: selected.friendName });
  }
}

/* =========================================================
 *  视口 / 缩放计算
 * ========================================================= */

function computeViewScale(w, h) {
  const diag = Math.hypot(w, h) || 1;
  const scale = REF_DIAGONAL / diag;
  return clamp(scale, MIN_VIEW_SCALE, MAX_VIEW_SCALE);
}
function getPixelPerfectScale() {
  const raw = viewScale * dpr;
  return Math.max(1, Math.round(raw));
}
function getBottomUiReserveCss() {
  let reserve = 0;

  // 聊天框可见时，按它的真实顶部位置计算遮挡高度
  if (isJoined && isChatPanelOpen && chatBox && !chatBox.classList.contains('hidden')) {
    const rect = chatBox.getBoundingClientRect();
    if (rect.height > 0) {
      reserve = Math.max(reserve, window.innerHeight - rect.top + 12);
    }
  }

  // 触屏虚拟按键区域（约 64px 按钮 + 16px 内边距 + 安全区）
  if (isTouchDevice) {
    reserve = Math.max(reserve, 104);
  }

  return reserve;
}

function computeCameraY() {
  const pxScale = getPixelPerfectScale();
  const viewH = gameCanvas.height / pxScale;
  // getBottomUiReserveCss() 返回 CSS 像素，先转物理像素再转世界坐标
  const reserveWorld = (getBottomUiReserveCss() * dpr) / pxScale;
  const usableViewH = Math.max(80, viewH - reserveWorld);

  if (usableViewH >= WORLD_CONTENT_HEIGHT) {
    cameraY = WORLD_CONTENT_TOP + WORLD_CONTENT_HEIGHT / 2 - usableViewH / 2;
  } else {
    cameraY = WORLD_CONTENT_BOTTOM - usableViewH;
  }
} function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cssWidth = Math.max(320, Math.round(window.innerWidth));
  cssHeight = Math.max(200, Math.round(window.innerHeight));

  gameCanvas.width = Math.round(cssWidth * dpr);
  gameCanvas.height = Math.round(cssHeight * dpr);
  gameCanvas.style.width = `${cssWidth}px`;
  gameCanvas.style.height = `${cssHeight}px`;

  viewScale = computeViewScale(cssWidth, cssHeight);
  computeCameraY();

  sceneCtx.imageSmoothingEnabled = false;
  sceneCtx.mozImageSmoothingEnabled = false;
  sceneCtx.webkitImageSmoothingEnabled = false;
  sceneCtx.msImageSmoothingEnabled = false;
}/* =========================================================
 *  交互 / 输入辅助
 * ========================================================= */

function canAcceptGameInput() {
  if (!isJoined) {
    return false;
  }
  if (isStairsMenuOpen || isRoomSettingsOpen || isSystemMessagesOpen
    || isFriendPanelOpen || isTeleportMenuOpen) {
    return false;
  }
  if (isChatPanelOpen && isChatInputActive) {
    return false;
  }
  return true;
}

function handleInteractKey() {
  if (!canAcceptGameInput()) {
    return false;
  }
  const nearbyInteractable = getNearestInteractable(getInteractables(getSceneMode()));
  if (nearbyInteractable) {
    handleInteract();
    return true;
  }
  if (inventoryList && inventoryList.length) {
    return useSelectedItem();
  }
  return false;
}

function handleInteract() {
  if (!sceneState || !layout) {
    return;
  }

  const mode = getSceneMode();
  const nearest = getNearestInteractable(getInteractables(mode));
  if (!nearest) {
    return;
  }

  if (nearest.type === 'exit') {
    playSound('doorOpen');
    send('enter-room', { roomId: 'corridor' });
    return;
  }

  if (nearest.type === 'stairs') {
    playSound('doorOpen');
    openStairsMenu();
    return;
  }

  if (nearest.type === 'agent') {
    const agentId = nearest.agentId || 'liu-kanshan';
    openChatPanel(agentId, nearest.ownerName || '智能体', true);
    triggerAgentJump(agentId);
    send('open-agent', { agentId: currentAgentId });
    return;
  }

  if (nearest.type === 'room' || nearest.type === 'community') {
    playSound('doorOpen');
    send('enter-room', { roomId: nearest.roomId });
    return;
  }
}

/* =========================================================
 *  触屏虚拟按键
 * ========================================================= */

const isTouchDevice = (('ontouchstart' in window)
  || (navigator.maxTouchPoints > 0)
  || (navigator.msMaxTouchPoints > 0));

function bindHoldButton(el, onPress, onRelease) {
  if (!el) {
    return;
  }
  let active = false;

  const press = e => {
    if (e) {
      e.preventDefault();
    }
    if (active) {
      return;
    }
    active = true;
    el.classList.add('active');
    if (onPress) {
      onPress();
    }
  };

  const release = e => {
    if (e) {
      e.preventDefault();
    }
    if (!active) {
      return;
    }
    active = false;
    el.classList.remove('active');
    if (onRelease) {
      onRelease();
    }
  };

  el.addEventListener('pointerdown', press);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', release);
  el.addEventListener('contextmenu', e => e.preventDefault());
}

function setupTouchControls() {
  if (!isTouchDevice) {
    if (touchControls) {
      touchControls.classList.add('hidden');
    }
    return;
  }

  document.body.classList.add('touch-mode');
  if (touchControls) {
    touchControls.classList.remove('hidden');
  }

  bindHoldButton(
    touchLeftBtn,
    () => {
      if (canAcceptGameInput()) {
        player.moveLeft = true;
      }
    },
    () => {
      player.moveLeft = false;
    }
  );

  bindHoldButton(
    touchRightBtn,
    () => {
      if (canAcceptGameInput()) {
        player.moveRight = true;
      }
    },
    () => {
      player.moveRight = false;
    }
  );

  bindHoldButton(
    touchJumpBtn,
    () => {
      if (canAcceptGameInput()) {
        jumpBufferRemaining = JUMP_BUFFER_SECONDS;
      }
    },
    null
  );

  bindHoldButton(
    touchInteractBtn,
    () => {
      handleInteractKey();
    },
    null
  );

  window.addEventListener('blur', () => {
    stopMovement();
  });
}

/* =========================================================
 *  绘制基础
 * ========================================================= */

function setupInventoryDrag() {
  if (!inventoryBox) {
    return;
  }
  const handle = inventoryBox.querySelector('.overlay-header');
  if (!handle) {
    return;
  }

  handle.style.cursor = 'move';
  handle.style.touchAction = 'none';

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const startDrag = e => {
    if (e.target.closest('button')) {
      return;
    }
    const rect = inventoryBox.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    inventoryBox.style.right = 'auto';
    inventoryBox.style.bottom = 'auto';
    inventoryBox.style.left = `${rect.left}px`;
    inventoryBox.style.top = `${rect.top}px`;

    dragging = true;
    document.body.style.userSelect = 'none';
    try {
      handle.setPointerCapture(e.pointerId);
    } catch (_e) { /* ignore */ }
    e.preventDefault();
  };

  const doDrag = e => {
    if (!dragging) {
      return;
    }
    const w = inventoryBox.offsetWidth;
    const h = inventoryBox.offsetHeight;
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);
    x = Math.max(0, Math.min(maxX, x));
    y = Math.max(0, Math.min(maxY, y));
    inventoryBox.style.left = `${x}px`;
    inventoryBox.style.top = `${y}px`;
    e.preventDefault();
  };

  const endDrag = e => {
    if (!dragging) {
      return;
    }
    dragging = false;
    document.body.style.userSelect = '';
    try {
      localStorage.setItem('inventory-pos', JSON.stringify({
        left: inventoryBox.style.left,
        top: inventoryBox.style.top
      }));
    } catch (_e) { /* ignore */ }
    if (e) {
      e.preventDefault();
    }
  };

  handle.addEventListener('pointerdown', startDrag);
  window.addEventListener('pointermove', doDrag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  try {
    const saved = JSON.parse(localStorage.getItem('inventory-pos') || 'null');
    if (saved && saved.left && saved.top) {
      const lx = parseFloat(saved.left);
      const ly = parseFloat(saved.top);
      const w = inventoryBox.offsetWidth || 240;
      const h = inventoryBox.offsetHeight || 216;
      if (lx >= 0 && ly >= 0 && lx + w <= window.innerWidth && ly + h <= window.innerHeight) {
        inventoryBox.style.right = 'auto';
        inventoryBox.style.bottom = 'auto';
        inventoryBox.style.left = `${lx}px`;
        inventoryBox.style.top = `${ly}px`;
      }
    }
  } catch (_e) { /* ignore */ }

  window.addEventListener('resize', () => {
    const rect = inventoryBox.getBoundingClientRect();
    const maxX = Math.max(0, window.innerWidth - rect.width);
    const maxY = Math.max(0, window.innerHeight - rect.height);
    if (rect.left > maxX || rect.top > maxY) {
      const nx = Math.max(0, Math.min(maxX, rect.left));
      const ny = Math.max(0, Math.min(maxY, rect.top));
      inventoryBox.style.right = 'auto';
      inventoryBox.style.bottom = 'auto';
      inventoryBox.style.left = `${nx}px`;
      inventoryBox.style.top = `${ny}px`;
    }
  });
}

function drawSprite(image, x, y, width, height, fallback) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (image) {
    sceneCtx.drawImage(image, px, py, width, height);
    return;
  }
  sceneCtx.fillStyle = fallback;
  sceneCtx.fillRect(px, py, width, height);
}
function drawDoorLabel(text, x, y) {
  sceneCtx.font = '12px "Microsoft YaHei", "PingFang SC", sans-serif';
  const paddingX = 6;
  const width = sceneCtx.measureText(text).width + paddingX * 2;
  const left = Math.round(x - width / 2);
  sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  sceneCtx.fillRect(left, y - 14, width, 16);
  sceneCtx.fillStyle = '#fff';
  sceneCtx.fillText(text, left + paddingX, y - 2);
}

function drawPlayerName(text, x, y) {
  sceneCtx.font = '12px "Microsoft YaHei", "PingFang SC", sans-serif';
  const paddingX = 6;
  const width = sceneCtx.measureText(text).width + paddingX * 2;
  const left = Math.round(x - width / 2);
  sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  sceneCtx.fillRect(left, y - 14, width, 16);
  sceneCtx.fillStyle = '#9be6ff';
  sceneCtx.fillText(text, left + paddingX, y - 2);
}

function drawOverlayPanel(x, y, w, h) {
  sceneCtx.fillStyle = 'rgba(8, 12, 18, 0.9)';
  sceneCtx.fillRect(x, y, w, h);
  sceneCtx.strokeStyle = '#6fa8dc';
  sceneCtx.lineWidth = 2;
  sceneCtx.strokeRect(x, y, w, h);
}

/* =========================================================
 *  房间设置逻辑
 * ========================================================= */

function getSelectedRoomSettingsUser() {
  if (!areaUserDirectory.length) {
    return null;
  }
  roomSettingsUserIndex = clamp(roomSettingsUserIndex, 0, areaUserDirectory.length - 1);
  return areaUserDirectory[roomSettingsUserIndex] || null;
}

function toggleRoomSettingsList(listKey, userName) {
  const targetName = String(userName || '').trim();
  if (!targetName || !myRoomSettings) {
    return;
  }

  const target = myRoomSettings[listKey];
  if (!Array.isArray(target)) {
    return;
  }

  const otherKey = listKey === 'whitelist' ? 'blacklist' : 'whitelist';
  const other = Array.isArray(myRoomSettings[otherKey]) ? myRoomSettings[otherKey] : [];
  myRoomSettings[otherKey] = other.filter(name => name !== targetName);

  if (target.includes(targetName)) {
    myRoomSettings[listKey] = target.filter(name => name !== targetName);
  } else {
    myRoomSettings[listKey] = [...target, targetName];
  }
  isRoomSettingsDirty = true;
}

function removeRoomSettingsUser(userName) {
  const targetName = String(userName || '').trim();
  if (!targetName || !myRoomSettings) {
    return;
  }
  myRoomSettings.whitelist = (myRoomSettings.whitelist || []).filter(name => name !== targetName);
  myRoomSettings.blacklist = (myRoomSettings.blacklist || []).filter(name => name !== targetName);
  isRoomSettingsDirty = true;
}

function saveRoomSettings() {
  send('my-room-settings', {
    defaultAccess: myRoomSettings.defaultAccess === 'deny' ? 'deny' : 'allow',
    whitelist: myRoomSettings.whitelist || [],
    blacklist: myRoomSettings.blacklist || []
  });
  isRoomSettingsDirty = false;
}

function openRoomSettings() {
  if (!isJoined || !sceneState?.ownedRoom) {
    return;
  }
  isRoomSettingsOpen = true;
  closeSystemMessagesPanel();
  closeFriendPanel();
  closeTeleportMenu();
  closeStairsMenu();
  stopMovement();
  isRoomSettingsDirty = false;
  roomSettingsScrollOffset = 0;
  updateChatImeInput();
}

function closeRoomSettings() {
  isRoomSettingsOpen = false;
  updateChatImeInput();
  if (roomSettingsBox) {
    roomSettingsBox.classList.add('hidden');
  }
}

function closeSystemMessagesPanel() {
  isSystemMessagesOpen = false;
  if (sysMsgBox) {
    sysMsgBox.classList.add('hidden');
  }
  updateChatImeInput();
}

function openSystemMessagesPanel() {
  isSystemMessagesOpen = true;
  isFriendPanelOpen = false;
  isTeleportMenuOpen = false;
  closeStairsMenu();
  closeRoomSettings();
  stopMovement();
  systemMessageIndex = 0;
  renderSystemMessagesPanel();
  if (sysMsgBox) {
    sysMsgBox.classList.remove('hidden');
  }
  updateChatImeInput();
}

function closeFriendPanel() {
  isFriendPanelOpen = false;
  updateChatImeInput();
  if (friendPanelBox) {
    friendPanelBox.classList.add('hidden');
  }
}

function openFriendPanel() {
  isFriendPanelOpen = true;
  isSystemMessagesOpen = false;
  isTeleportMenuOpen = false;
  closeStairsMenu();
  closeRoomSettings();
  stopMovement();
  updateChatImeInput();
  const candidates = getFriendPanelCandidates();
  friendPanelIndex = clamp(friendPanelIndex, 0, Math.max(0, candidates.length - 1));
  friendPanelScrollOffset = 0;
}

function closeTeleportMenu() {
  isTeleportMenuOpen = false;
  updateChatImeInput();
  if (teleportPanelBox) {
    teleportPanelBox.classList.add('hidden');
  }
}

function openTeleportMenu() {
  teleportAllOptions = buildTeleportOptions();
  teleportSearchQuery = '';
  if (teleportSearchInput) {
    teleportSearchInput.value = '';
  }
  teleportOptions = teleportAllOptions;
  teleportIndex = clamp(teleportIndex, 0, Math.max(0, teleportAllOptions.length - 1));
  isTeleportMenuOpen = true;
  isFriendPanelOpen = false;
  isSystemMessagesOpen = false;
  closeStairsMenu();
  closeRoomSettings();
  stopMovement();
  updateChatImeInput();
  teleportScrollOffset = 0;

  if (teleportSearchInput && !isTouchDevice) {
    requestAnimationFrame(() => {
      try { teleportSearchInput.focus({ preventScroll: true }); } catch (_e) { /* ignore */ }
    });
  }
}

/* =========================================================
 *  图标按钮（绘制在 canvas 上，使用 CSS 像素坐标系）
 * ========================================================= */

function getUiButtons() {
  if (!isJoined) {
    return [];
  }
  const buttons = [];
  let x = UI_BUTTON_MARGIN_X;
  const y = UI_BUTTON_MARGIN_Y;
  const mode = getSceneMode();
  const hasPendingSystemMessage = unreadSystemMessageCount > 0;
  buttons.push({
    key: 'sysmsg',
    x, y, w: UI_BUTTON_SIZE, h: UI_BUTTON_SIZE,
    icon: hasPendingSystemMessage ? textures.iconSystemMessageNew : textures.iconSystemMessage,
    label: '系统'
  });
  x += UI_BUTTON_SIZE + UI_BUTTON_GAP;
  buttons.push({ key: 'friends', x, y, w: UI_BUTTON_SIZE, h: UI_BUTTON_SIZE, icon: textures.iconFriends, label: '好友' });
  x += UI_BUTTON_SIZE + UI_BUTTON_GAP;
  buttons.push({ key: 'teleport', x, y, w: UI_BUTTON_SIZE, h: UI_BUTTON_SIZE, icon: textures.iconTeleport, label: '传送' });
  x += UI_BUTTON_SIZE + UI_BUTTON_GAP;
  buttons.push({ key: 'chat', x, y, w: UI_BUTTON_SIZE, h: UI_BUTTON_SIZE, icon: textures.iconChat, label: '聊天', active: isChatPanelOpen });
  x += UI_BUTTON_SIZE + UI_BUTTON_GAP;
  buttons.push({ key: 'claim', x, y, w: UI_BUTTON_SIZE, h: UI_BUTTON_SIZE, icon: textures.iconClaimRoom, label: '认领', disabled: mode !== 'corridor' });
  x += UI_BUTTON_SIZE + UI_BUTTON_GAP;
  buttons.push({ key: 'settings', x, y, w: UI_BUTTON_SIZE, h: UI_BUTTON_SIZE, icon: textures.iconMyRoomSettings, label: '房间', disabled: !sceneState?.ownedRoom });
  return buttons;
}

function drawIconButton(button) {
  const isHovered = button.key === hoveredButtonKey && !button.disabled;

  sceneCtx.fillStyle = button.disabled
    ? 'rgba(30, 30, 30, 0.65)'
    : (isHovered ? 'rgba(0, 0, 0, 0.95)' : 'rgba(12, 22, 35, 0.86)');

  sceneCtx.fillRect(button.x, button.y, button.w, button.h);

  sceneCtx.strokeStyle = button.disabled
    ? '#555'
    : (button.active ? '#ffd54f' : (isHovered ? '#9be6ff' : '#6fa8dc'));
  sceneCtx.lineWidth = isHovered ? 2.5 : 2;
  sceneCtx.strokeRect(button.x, button.y, button.w, button.h);

  if (button.icon) {
    sceneCtx.globalAlpha = button.disabled ? 0.35 : (isHovered ? 0.7 : 1);
    sceneCtx.drawImage(button.icon, button.x + 6, button.y + 6, button.w - 12, button.h - 12);
    sceneCtx.globalAlpha = 1;
  } else {
    sceneCtx.fillStyle = button.disabled ? '#888' : (isHovered ? '#b0bec5' : '#fff');
    sceneCtx.font = '11px "Microsoft YaHei", "PingFang SC", sans-serif';
    sceneCtx.fillText(button.label, button.x + 5, button.y + 22);
  }
}

function renderUiButtons() {
  uiButtons = getUiButtons();
  if (!uiButtons.length) {
    updateButtonTooltip();
    return;
  }
  sceneCtx.save();
  sceneCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  uiButtons.forEach(drawIconButton);
  sceneCtx.restore();
  updateButtonTooltip();
}

function updateHoveredButton() {
  hoveredButtonKey = null;
  if (!isJoined || !uiButtons.length) {
    return;
  }
  for (const b of uiButtons) {
    const insideX = mouseCanvasX >= b.x && mouseCanvasX <= b.x + b.w;
    const insideY = mouseCanvasY >= b.y && mouseCanvasY <= b.y + b.h;
    if (insideX && insideY) {
      hoveredButtonKey = b.disabled ? null : b.key;
      return;
    }
  }
}

function handleUiButtonClick(key) {
  if (key === 'sysmsg') {
    if (isSystemMessagesOpen) {
      closeSystemMessagesPanel();
    } else {
      openSystemMessagesPanel();
    }
    return;
  }
  if (key === 'friends') {
    if (isFriendPanelOpen) {
      closeFriendPanel();
    } else {
      openFriendPanel();
    }
    return;
  }
  if (key === 'teleport') {
    if (isTeleportMenuOpen) {
      closeTeleportMenu();
    } else {
      openTeleportMenu();
    }
    return;
  }
  if (key === 'chat') {
    if (isChatPanelOpen) {
      closeChatPanel();
    } else {
      openChatPanel();
    }
    return;
  }
  if (key === 'claim') {
    handleClaimNearestRoom();
    return;
  }
  if (key === 'settings') {
    if (isRoomSettingsOpen) {
      closeRoomSettings();
    } else {
      openRoomSettings();
    }
  }
}

/* =========================================================
 *  其它玩家
 * ========================================================= */

function getOtherPlayers(mode = getSceneMode()) {
  if (!sceneState?.roomUsers?.length) {
    return [];
  }

  const others = sceneState.roomUsers.filter(u => u.id !== currentUserId && u.role !== 'agent');
  if (!others.length) {
    return [];
  }
  const groundY = mode === 'room' ? getRoomGeometry().floorY : FLOOR_Y;
  const interactables = getInteractables(mode);
  const boundarySource = getStructuralInteractables(interactables);
  const fallbackMinX = boundarySource.length ? (mode === 'lobby' ? boundarySource[0].x - 150 : boundarySource[0].x - 40) : 40;
  const fallbackMaxX = boundarySource.length
    ? (mode === 'lobby' ? boundarySource[0].x + 150 : boundarySource[boundarySource.length - 1].x + 40)
    : (LOBBY_WORLD_CENTER_X + 150);

  return others.map((u, i) => {
    const fallbackX = clamp(fallbackMinX + 50 + i * 56, fallbackMinX + 24, fallbackMaxX - 24);
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      avatar: u.avatar || null,
      x: Number.isFinite(u.posX) ? u.posX : fallbackX,
      y: Number.isFinite(u.posY) ? Math.min(u.posY, groundY) : groundY
    };
  });
}

/* =========================================================
 *  场景渲染
 * ========================================================= */

function renderScene() {
  if (!isJoined) {
    return;
  }

  sceneCtx.setTransform(1, 0, 0, 1, 0, 0);
  sceneCtx.fillStyle = '#000';
  sceneCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

  updateChatImeInput();
  computeCameraY();

  const mode = getSceneMode();
  if (mode === 'none') {
    setSceneHint('场景加载中…');
    renderInventoryHUD();
    renderUiButtons();
    renderStairsMenu();
    renderRoomSettingsPanel();
    renderFriendPanel();
    renderTeleportPanel();
    return;
  }

  const pxScale = getPixelPerfectScale();
  sceneCtx.setTransform(pxScale, 0, 0, pxScale, 0, 0);
  sceneCtx.translate(0, -cameraY);

  const viewWorldWidth = getWorldViewWidth();
  const interactables = getInteractables(mode);
  const nearest = getNearestInteractable(interactables);
  const otherPlayers = getOtherPlayers(mode);
  setSceneHint(describeInteractable(nearest));

  if (mode === 'corridor' || mode === 'lobby' || mode === 'dome') {
    const bounds = getWorldBounds(mode, interactables);
    const cameraX = computeCameraX(bounds);
    const tint = AREA_TINTS[mode] || null;

    // 穹顶：星空铺满整个视口，作为背景
    if (mode === 'dome') {
      const viewH = gameCanvas.height / getPixelPerfectScale();
      const bg = textures.starrySky;

      sceneCtx.fillStyle = '#000';
      sceneCtx.fillRect(0, cameraY, viewWorldWidth, viewH);

      if (bg) {
        sceneCtx.drawImage(bg, 0, cameraY, viewWorldWidth, viewH);
      }

      // 星空整体压暗一点，避免过亮
      sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      sceneCtx.fillRect(0, cameraY, viewWorldWidth, viewH);
    }

    // 瓦片范围：穹顶只画空气墙内；其它区域照旧按视口画
    const tileStart = mode === 'dome'
      ? Math.floor(bounds.min / TILE_SIZE) - 1
      : Math.floor((cameraX - TILE_SIZE) / TILE_SIZE);
    const tileEnd = mode === 'dome'
      ? Math.ceil(bounds.max / TILE_SIZE) + 1
      : Math.ceil((cameraX + viewWorldWidth + TILE_SIZE) / TILE_SIZE);

    for (let i = tileStart; i <= tileEnd; i += 1) {
      const drawX = i * TILE_SIZE - cameraX;
      drawWallpaperTile(textures.wallpaperUpper, drawX, FLOOR_Y - 96, TILE_SIZE, TILE_SIZE, '#111', tint?.upper);
      drawWallpaperTile(textures.wallpaperMiddle, drawX, FLOOR_Y - 64, TILE_SIZE, TILE_SIZE, '#1a1a1a', tint?.middle);
      drawWallpaperTile(textures.wallpaperMiddle, drawX, FLOOR_Y - 32, TILE_SIZE, TILE_SIZE, '#1a1a1a', tint?.middle);
      drawWallpaperTile(textures.wallpaperLower, drawX, FLOOR_Y, TILE_SIZE, TILE_SIZE, '#242424', tint?.lower);
      drawWallpaperTile(textures.floor, drawX, FLOOR_Y, TILE_SIZE, TILE_SIZE, '#464646', tint?.floor);
    }

    for (const item of interactables) {
      const drawX = item.x - cameraX - DOOR_WIDTH / 2;
      if (item.type === 'agent') {
        const img = getAgentAvatarImage(item.avatar);
        const baseY = Number.isFinite(item.y) ? item.y : FLOOR_Y;
        const jumpOffset = getAgentJumpOffsetY(item.agentId);
        const ay = baseY + jumpOffset;
        if (img) {
          sceneCtx.drawImage(img, item.x - cameraX - 16, ay, 32, 32);
        } else {
          sceneCtx.fillStyle = '#8d6e63';
          sceneCtx.fillRect(item.x - cameraX - 12, ay + 8, 24, 24);
        }
        // 名字标签留在原位，不跟着跳
        drawDoorLabel(item.ownerName || '智能体', item.x - cameraX, baseY - 6);
        continue;
      }

      if (mode === 'lobby' || mode === 'dome') {
        if (item.type === 'stairs') {
          drawSprite(textures.door, drawX, FLOOR_Y - (DOOR_HEIGHT - TILE_SIZE), DOOR_WIDTH, DOOR_HEIGHT, '#6b4a2d');
          drawDoorLabel(STAIRS_LABEL, item.x - cameraX, FLOOR_Y - 42);
          continue;
        }
        if (item.type === 'community') {
          drawDoorLabel(COMMUNITY_SPACE_LABEL, item.x - cameraX, FLOOR_Y - 42);
          continue;
        }
        drawDoorLabel(`${item.doorplate}: ${item.ownerName}`, item.x - cameraX, FLOOR_Y - 42);
        continue;
      }

      drawSprite(textures.door, drawX, FLOOR_Y - (DOOR_HEIGHT - TILE_SIZE), DOOR_WIDTH, DOOR_HEIGHT, '#6b4a2d');
      if (item.type === 'stairs') {
        drawDoorLabel(STAIRS_LABEL, item.x - cameraX, FLOOR_Y - 42);
      } else if (item.type === 'community') {
        drawDoorLabel(COMMUNITY_SPACE_LABEL, item.x - cameraX, FLOOR_Y - 42);
      } else {
        drawDoorLabel(`${item.doorplate}: ${item.ownerName}`, item.x - cameraX, FLOOR_Y - 42);
      }
    }

    if (nearest) {
      const drawX = nearest.x - cameraX - DOOR_WIDTH / 2;
      if (nearest.type === 'agent') {
        const nearestBaseY = Number.isFinite(nearest.y) ? nearest.y : FLOOR_Y;
        const nearestJumpOffset = getAgentJumpOffsetY(nearest.agentId);
        const nearestY = nearestBaseY + nearestJumpOffset;
        sceneCtx.fillStyle = 'rgba(255,255,255,0.12)';
        sceneCtx.fillRect(drawX - 2, nearestY - 2, DOOR_WIDTH + 4, DOOR_HEIGHT - 24);
        try {
          const img = getAgentAvatarImage(nearest.avatar);
          const ax = nearest.x - cameraX - 16;
          if (img) {
            sceneCtx.drawImage(img, ax, nearestY, 32, 32);
          } else {
            sceneCtx.fillStyle = '#9e7b6a';
            sceneCtx.fillRect(ax + 4, nearestY + 8, 24, 24);
          }
        } catch (_e) { }
      } else {
        sceneCtx.strokeStyle = '#ffd54f';
        sceneCtx.lineWidth = 2;
        sceneCtx.strokeRect(drawX - 2, FLOOR_Y - (DOOR_HEIGHT - TILE_SIZE) - 2, DOOR_WIDTH + 4, DOOR_HEIGHT + 4);
      }
    }
    for (const other of otherPlayers) {
      if (other.role === 'agent') {
        const avatar = getAgentAvatarImage(other.avatar);
        drawSprite(avatar, other.x - cameraX - 16, other.y - 48, 32, 32, '#6dc56d');
      } else {
        drawSprite(textures.playerImage, other.x - cameraX - 16, other.y, 32, 32, '#6dc56d');
      }
      drawPlayerName(other.name, other.x - cameraX, other.y - 6);
    }

    for (const f of roomFurnishings || []) {
      if (!f) continue;
      const fw = Number.isFinite(Number(f.w)) && Number(f.w) > 0 ? Number(f.w) : 32;
      const fh = Number.isFinite(Number(f.h)) && Number(f.h) > 0 ? Number(f.h) : 32;
      const fx = (Number.isFinite(Number(f.x)) ? Number(f.x) : 0) - cameraX - fw / 2;
      const fy = Number.isFinite(Number(f.y)) ? Number(f.y) - fh : FLOOR_Y - fh;
      const icon = textures.itemIcons[f.id];
      if (icon === undefined) {
        (async id => {
          try {
            const img = await loadImage(`/textures/${id}.png`);
            if (img) { textures.itemIcons[id] = img; return; }
            const img2 = await loadImage(`/textures/item-${id}.png`);
            textures.itemIcons[id] = img2 || null;
          } catch (_e) {
            textures.itemIcons[id] = null;
          }
        })(f.id);
      }
      if (icon) {
        sceneCtx.drawImage(icon, fx, fy, fw, fh);
      } else {
        sceneCtx.fillStyle = '#8d6e63';
        sceneCtx.fillRect(fx, fy, fw, fh);
      }
    }

    drawSprite(textures.playerImage, player.x - cameraX - 16, player.y, 32, 32, '#4ea7ff');
    drawPlayerName('你', player.x - cameraX, player.y - 6);

    renderInventoryHUD();
    renderUiButtons();
    renderStairsMenu();
    renderRoomSettingsPanel();
    renderFriendPanel();
    renderTeleportPanel();
    return;
  }

  if (mode === 'room') {
    const room = getRoomGeometry();
    const bounds = getWorldBounds(mode, interactables);
    const cameraX = computeCameraX(bounds);
    const toScreenX = worldX => worldX - cameraX;

    const roomWallpaperId = sceneState?.roomWallpaper || 'default';
    const wallpaperTint = getWallpaperTint(roomWallpaperId);

    for (let i = 0; i < ROOM_WIDTH_TILES; i += 1) {
      const drawX = toScreenX(room.left + i * TILE_SIZE);
      drawWallpaperTile(textures.wallpaperUpper, drawX, room.top, TILE_SIZE, TILE_SIZE, '#111', wallpaperTint);
      drawWallpaperTile(textures.wallpaperMiddle, drawX, room.top + TILE_SIZE, TILE_SIZE, TILE_SIZE, '#1a1a1a', wallpaperTint);
      drawWallpaperTile(textures.wallpaperMiddle, drawX, room.top + TILE_SIZE * 2, TILE_SIZE, TILE_SIZE, '#1a1a1a', wallpaperTint);
      drawWallpaperTile(textures.wallpaperMiddle, drawX, room.top + TILE_SIZE * 3, TILE_SIZE, TILE_SIZE, '#1a1a1a', wallpaperTint);
      drawWallpaperTile(textures.wallpaperLower, drawX, room.floorY, TILE_SIZE, TILE_SIZE, '#242424', wallpaperTint);
      drawSprite(textures.floor, drawX, room.floorY, TILE_SIZE, TILE_SIZE, '#464646');
    }

    const exit = interactables.find(x => x.type === 'exit');
    if (exit) {
      const exitX = toScreenX(exit.x);
      const doorX = exitX - DOOR_WIDTH / 2;
      drawSprite(textures.door, doorX, room.floorY - (DOOR_HEIGHT - TILE_SIZE), DOOR_WIDTH, DOOR_HEIGHT, '#6b4a2d');
      drawDoorLabel(EXIT_LABEL, exitX, room.floorY - 42);

      if (nearest?.type === 'exit') {
        sceneCtx.strokeStyle = '#ffd54f';
        sceneCtx.lineWidth = 2;
        sceneCtx.strokeRect(doorX - 2, room.floorY - (DOOR_HEIGHT - TILE_SIZE) - 2, DOOR_WIDTH + 4, DOOR_HEIGHT + 4);
      }
    }

    for (const item of interactables) {
      if (item.type !== 'agent') {
        continue;
      }
      const itemX = toScreenX(item.x);
      const baseY = Number.isFinite(item.y) ? item.y : room.floorY;
      const jumpOffset = getAgentJumpOffsetY(item.agentId);
      const itemY = baseY + jumpOffset;
      const img = getAgentAvatarImage(item.avatar);

      if (img) {
        sceneCtx.drawImage(img, itemX - 16, itemY, 32, 32);
      } else {
        sceneCtx.fillStyle = '#8d6e63';
        sceneCtx.fillRect(itemX - 12, itemY + 8, 24, 24);
      }
      drawDoorLabel(item.ownerName || '智能体', itemX, baseY - 6);

      if (nearest && nearest.type === 'agent' && nearest.x === item.x) {
        sceneCtx.fillStyle = 'rgba(255,255,255,0.12)';
        sceneCtx.fillRect(itemX - 18, itemY - 2, 36, 36);
        if (img) {
          sceneCtx.drawImage(img, itemX - 16, itemY, 32, 32);
        }
      }
    }

    for (const f of roomFurnishings || []) {
      if (!f) continue;
      const fw = Number.isFinite(Number(f.w)) && Number(f.w) > 0 ? Number(f.w) : 32;
      const fh = Number.isFinite(Number(f.h)) && Number(f.h) > 0 ? Number(f.h) : 32;
      const fx = toScreenX(Number.isFinite(Number(f.x)) ? Number(f.x) : 0) - fw / 2;
      const fy = Number.isFinite(Number(f.y)) ? Number(f.y) - fh : room.floorY - fh;
      const icon = textures.itemIcons[f.id];
      if (icon === undefined) {
        (async id => {
          try {
            const img = await loadImage(`/textures/${id}.png`);
            if (img) { textures.itemIcons[id] = img; return; }
            const img2 = await loadImage(`/textures/item-${id}.png`);
            textures.itemIcons[id] = img2 || null;
          } catch (_e) {
            textures.itemIcons[id] = null;
          }
        })(f.id);
      }
      if (icon) {
        sceneCtx.drawImage(icon, fx, fy, fw, fh);
      } else {
        sceneCtx.fillStyle = '#8d6e63';
        sceneCtx.fillRect(fx, fy, fw, fh);
      }
    }

    for (const other of otherPlayers) {
      const otherX = toScreenX(other.x);
      if (other.role === 'agent') {
        const avatar = getAgentAvatarImage(other.avatar);
        drawSprite(avatar, otherX - 16, other.y - 48, 32, 32, '#6dc56d');
      } else {
        drawSprite(textures.playerImage, otherX - 16, other.y, 32, 32, '#6dc56d');
      }
      drawPlayerName(other.name, otherX, other.y - 6);
    }

    drawSprite(textures.playerImage, toScreenX(player.x) - 16, player.y, 32, 32, '#4ea7ff');
    drawPlayerName('你', toScreenX(player.x), player.y - 6);

    renderInventoryHUD();
    renderUiButtons();
    renderStairsMenu();
    renderRoomSettingsPanel();
    renderFriendPanel();
    renderTeleportPanel();
  }
}

function getGroundY(mode = getSceneMode()) {
  if (mode === 'room') {
    return getRoomGeometry().floorY;
  }
  return FLOOR_Y;
}

/* =========================================================
 *  状态同步
 * ========================================================= */

function syncState(state) {
  const previousState = sceneState;
  sceneState = state;
  areaUserDirectory = Array.isArray(state.areaUsers) ? state.areaUsers : [];
  friendList = Array.isArray(state.friends) ? state.friends : [];
  blockedFriendList = Array.isArray(state.blockedFriends) ? state.blockedFriends : [];
  systemMessagesData = normalizeSystemMessages(state.systemMessages);
  unreadSystemMessageCount = Number.isInteger(state.unreadSystemMessageCount) ? state.unreadSystemMessageCount : 0;
  onlineFriendLocations = Array.isArray(state.onlineFriends) ? state.onlineFriends : [];
  if (!isRoomSettingsOpen || !isRoomSettingsDirty) {
    myRoomSettings = {
      defaultAccess: state.myRoomSettings?.defaultAccess === 'deny' ? 'deny' : 'allow',
      whitelist: Array.isArray(state.myRoomSettings?.whitelist) ? state.myRoomSettings.whitelist : [],
      blacklist: Array.isArray(state.myRoomSettings?.blacklist) ? state.myRoomSettings.blacklist : []
    };
  }
  if (state.myWallpaper) {
    currentWallpaperId = state.myWallpaper;
  }
  roomSettingsUserIndex = clamp(roomSettingsUserIndex, 0, Math.max(0, areaUserDirectory.length - 1));
  roomSettingsScrollOffset = ensureIndexVisible(roomSettingsUserIndex, 7, areaUserDirectory.length, roomSettingsScrollOffset);
  locationInfo.textContent = `当前位置：${areaName(state.areaId)} / ${roomName(state.roomId)}`;
  scenePanel.classList.remove('hidden');

  selfInfo.textContent = selfInfo.textContent.split(' | ')[0];
  if (state.ownedRoom) {
    const ownedLabel = `我的房间：楼层 ${state.ownedRoom.floor} · ${roomName(state.ownedRoom.roomId)}`;
    selfInfo.textContent = `${selfInfo.textContent.split(' | ')[0]} | ${ownedLabel}`;
  }

  const mode = getSceneMode(state);
  const previousMode = getSceneMode(previousState);
  const isSameLocation = previousState?.areaId === state.areaId && previousState?.roomId === state.roomId;
  if (!isSameLocation) {
    if (mode === 'corridor' && previousMode === 'room' && previousState?.areaId === state.areaId) {
      const previousRoomMatch = /^room-(\d+)$/.exec(previousState.roomId || '');
      if (previousRoomMatch) {
        player.x = getDoorX(Number(previousRoomMatch[1]));
      } else if ((previousState.roomId || '') === getCommunitySpaceRoomId()) {
        player.x = getCommunitySpaceX();
      }
    } else if (mode === 'corridor') {
      player.x = getDoorX(layout.residentCapacity) + (Number(layout.stairsOffsetX) || STAIRS_OFFSET_X);
    } else if (mode === 'lobby') {
      player.x = LOBBY_WORLD_CENTER_X;
    } else if (mode === 'dome') {
      player.x = DOME_101_WORLD_CENTER_X - DOME_101_WORLD_HALF_WIDTH + 60;
    }

    else if (mode === 'room') {
      const room = getRoomGeometry();
      player.x = room.left + 110;
    }
    if (isAgentChat) {
      isAgentChat = false;
      currentAgentId = null;
      currentAgentName = null;
    }
    isChatInputActive = false;
    updateChatImeInput();

    closeStairsMenu();
    closeRoomSettings();
    closeSystemMessagesPanel();
    closeFriendPanel();
    closeTeleportMenu();

    player.y = getGroundY(mode);
    player.velocityX = 0;
    player.velocityY = 0;
    jumpBufferRemaining = 0;
    lastSentX = null;
    lastSentY = null;
    if (isChatPanelOpen) {
      stopMovement();
    }
  }

  usersList.innerHTML = '';
  state.roomUsers.forEach(u => {
    const li = document.createElement('li');
    if (u.role === 'resident') {
      li.textContent = `${u.name}（住户 · 楼层 ${u.homeFloor} · ${u.doorplate} 号门牌）`;
    } else if (u.role === 'agent') {
      li.textContent = `${u.name}（智能体）`;
    } else {
      li.textContent = `${u.name}（访客）`;
    }
    usersList.appendChild(li);
  });

  inventoryList = Array.isArray(state.inventory) ? state.inventory : [];
  roomFurnishings = Array.isArray(state.roomFurnishings) ? state.roomFurnishings : [];
  inventoryIndex = clamp(inventoryIndex, 0, Math.max(0, inventoryList.length - 1));
}

/* =========================================================
 *  物理更新与主循环
 * ========================================================= */

function updatePlayerPosition(dt) {
  if (!sceneState || !layout) {
    return;
  }

  const mode = getSceneMode();
  const interactables = getInteractables(mode);
  if (!interactables.length) {
    return;
  }

  let minX;
  let maxX;
  if (mode === 'room') {
    const room = getRoomGeometry();
    minX = room.left + 24;
    maxX = room.left + room.width - 24;
  } else if (mode === 'lobby') {
    minX = interactables[0].x - 150;
    maxX = interactables[0].x + 150;
  } else if (mode === 'dome') {
    minX = DOME_101_WORLD_CENTER_X - DOME_101_WORLD_HALF_WIDTH + 24;
    maxX = DOME_101_WORLD_CENTER_X + DOME_101_WORLD_HALF_WIDTH - 24;
  }

  else {
    const boundarySource = getStructuralInteractables(interactables);
    minX = boundarySource[0].x - 40;
    maxX = boundarySource[boundarySource.length - 1].x + 40;
  }

  const groundY = getGroundY(mode);
  const isOnGround = player.y >= groundY - 0.5;
  jumpBufferRemaining = Math.max(0, jumpBufferRemaining - dt);
  const direction = (player.moveRight ? 1 : 0) - (player.moveLeft ? 1 : 0);
  const drag = isOnGround ? PLAYER_GROUND_DRAG : PLAYER_AIR_DRAG;

  player.velocityX += direction * PLAYER_ACCELERATION * dt;
  player.velocityX -= player.velocityX * drag * dt;
  player.velocityX = clamp(player.velocityX, -PLAYER_SPEED, PLAYER_SPEED);
  if (direction === 0 && Math.abs(player.velocityX) < 3) {
    player.velocityX = 0;
  }

  player.x = clamp(player.x + player.velocityX * dt, minX, maxX);
  if ((player.x <= minX && player.velocityX < 0) || (player.x >= maxX && player.velocityX > 0)) {
    player.velocityX = 0;
  }

  if (jumpBufferRemaining > 0 && isOnGround) {
    player.velocityY = PLAYER_JUMP_VELOCITY;
    jumpBufferRemaining = 0;
  }

  player.velocityY += PLAYER_GRAVITY * dt;
  player.y += player.velocityY * dt;
  if (player.y > groundY) {
    player.y = groundY;
    player.velocityY = 0;
  }
}

function syncPlayerPosition(timestamp) {
  if (!sceneState || !canSyncPlayerPosition) {
    return;
  }

  const now = timestamp || performance.now();
  if (now - lastSentPositionAt < POSITION_SYNC_INTERVAL_MS) {
    return;
  }

  const x = Math.round(player.x * 100) / 100;
  const y = Math.round(player.y * 100) / 100;
  if (lastSentX === x && lastSentY === y) {
    return;
  }

  lastSentPositionAt = now;
  lastSentX = x;
  lastSentY = y;
  send('player-move', { x, y });
}

function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastFrame) / 1000 || 0);
  lastFrame = timestamp;
  updatePlayerPosition(dt);
  syncPlayerPosition(timestamp);
  renderScene();
  requestAnimationFrame(frame);
}

function simulateHiddenPhysicsTick() {
  if (!document.hidden) {
    return;
  }
  const now = performance.now();
  const dt = Math.min(0.1, (now - lastFrame) / 1000 || 0);
  lastFrame = now;
  updatePlayerPosition(dt);
  syncPlayerPosition(now);
}

function catchUpPhysicsAfterVisibilityRestore() {
  const now = performance.now();
  let remaining = Math.min(2, (now - lastFrame) / 1000 || 0);
  const step = 1 / 60;
  while (remaining > 0) {
    const dt = Math.min(step, remaining);
    updatePlayerPosition(dt);
    remaining -= dt;
  }
  lastFrame = now;
  syncPlayerPosition(now);
}

/* =========================================================
 *  初始化
 * ========================================================= */

async function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 250);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (document.activeElement === imeChatInput) {
        return;
      }
      resizeCanvas();
    });
  }

  setupTouchControls();
  setupInventoryDrag();

  // 默认锁定“加入”按钮，需登录/注册成功后才可用
  setAuthFormLocked(false);

  if (gameCanvas) {
    if (!gameCanvas.hasAttribute('tabindex')) {
      gameCanvas.setAttribute('tabindex', '-1');
    }
    gameCanvas.style.outline = 'none';
  }

  document.addEventListener('pointerdown', e => {
    if (!isJoined) {
      return;
    }
    const target = e.target;
    if (!target || typeof target.closest !== 'function') {
      return;
    }

    const insidePanel = target.closest('#chatBox')
      || target.closest('#sysMsgBox')
      || target.closest('#stairsMenuBox')
      || target.closest('#friendPanelBox')
      || target.closest('#teleportPanelBox')
      || target.closest('#roomSettingsBox')
      || target.closest('#inventoryBox')
      || target.closest('#joinPanel')
      || target.closest('#touchControls');
    if (insidePanel) {
      return;
    }

    deactivateChatInputAndFocusCanvas();
  }, true);

  requestAnimationFrame(frame);
  setInterval(simulateHiddenPhysicsTick, HIDDEN_PHYSICS_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      catchUpPhysicsAfterVisibilityRestore();
    }
  });
  window.addEventListener('blur', () => {
    stopMovement();
  });

  try {
    const res = await fetch('/api/layout');
    layout = await res.json();
    fillOptions();
  } catch (_err) {
    // 即使布局接口暂时不可用，也保留 HTML 登录界面
  }

  await loadTextures();
  await loadSounds();

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${window.location.host}`);

  ws.onmessage = e => {
    const data = JSON.parse(e.data);

    // ===== 账号相关消息 =====
    if (data.type === 'auth-success') {
      isAuthenticated = true;
      authenticatedName = String(data.payload?.name || '').trim() || null;
      const modeText = data.payload?.mode === 'register' ? '注册并登录成功' : '登录成功';
      setAuthStatus(`${modeText}：${authenticatedName}`, false);
      setAuthFormLocked(true);
      pushCanvasNotice(`${modeText}：${authenticatedName}`);
      return;
    }
    if (data.type === 'auth-error') {
      isAuthenticated = false;
      authenticatedName = null;
      const msg = String(data.payload?.message || '认证失败');
      setAuthStatus(msg, true);
      pushCanvasNotice(msg, true);
      return;
    }

    if (data.type === 'error') {
      if (data.payload?.message === 'Unknown command') {
        canSyncPlayerPosition = false;
        return;
      }
      pushCanvasNotice(data.payload.message, true);
      return;
    }
    if (data.type === 'chat') {
      addMessage(data.payload.sender, data.payload.text, data.payload.sender === 'System');

      // 只有当这条消息确实来自当前正在聊天的 NPC 时，才让它跳一下
      const payload = data.payload || {};
      if (isAgentChat
        && currentAgentId
        && currentAgentName
        && String(payload.sender) === String(currentAgentName)
        && String(payload.sender) !== 'System'
        && String(payload.sender) !== String(currentUserName || '')) {
        triggerAgentJump(currentAgentId);
      }
      return;
    }
    if (data.type === 'chat-history') {
      renderHistory(data.payload.messages || []);
      return;
    }
    if (data.type === 'info') {
      pushCanvasNotice(data.payload.message);
      addMessage('System', data.payload.message, true);
      return;
    }
    if (data.type === 'joined') {
      const me = data.payload;
      currentUserId = me.id;
      currentUserName = me.name;
      isJoined = true;

      document.body.classList.add('in-game');

      isChatPanelOpen = true;
      isAgentChat = false;
      currentAgentId = null;
      currentAgentName = null;
      isChatInputActive = false;

      selfInfo.textContent = me.role === 'resident'
        ? `用户：${me.name}（住户 · 楼层 ${me.homeFloor} · ${me.doorplate} 号门牌）`
        : `用户：${me.name}（访客）`;
      joinPanel.classList.add('hidden');
      chatPanel.classList.remove('hidden');
      updateChatImeInput();
      return;
    }
    if (data.type === 'state') {
      syncState(data.payload);
      return;
    }
    if (data.type === 'room-users') {
      if (sceneState) {
        sceneState.roomUsers = data.payload?.roomUsers || [];
      }
    }
  };

  roleSelect.addEventListener('change', () => {
    residentFields.classList.toggle('hidden', roleSelect.value !== 'resident');
  });

  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      if (isAuthenticated) {
        joinBtn.click();
      } else {
        loginBtn?.click();
      }
    }
  });

  if (passwordInput) {
    passwordInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        loginBtn?.click();
      }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => sendAuth('login'));
  }
  if (registerBtn) {
    registerBtn.addEventListener('click', () => sendAuth('register'));
  }

  joinBtn.addEventListener('click', () => {
    if (!isAuthenticated) {
      pushCanvasNotice('请先登录或注册账号', true);
      setAuthStatus('请先登录或注册账号', true);
      nameInput?.focus();
      return;
    }
    const payload = {
      name: authenticatedName || String(nameInput.value || '').trim(),
      role: roleSelect.value,
      areaId: areaSelect.value,
      restoreHistory: restoreHistoryCheckbox.checked
    };
    if (roleSelect.value === 'resident') {
      payload.homeFloor = Number(homeFloorSelect.value);
      payload.doorplate = Number(doorplateSelect.value);
    }
    send('join', payload);
  });

  imeChatInput.addEventListener('compositionstart', () => {
    isChatComposing = true;
  });

  imeChatInput.addEventListener('compositionend', () => {
    isChatComposing = false;
    chatInputText = imeChatInput.value.slice(0, 120);
  });

  /* ============ 房间设置面板按钮 ============ */
  if (roomSettingsAccessBtn) {
    roomSettingsAccessBtn.addEventListener('click', () => {
      myRoomSettings.defaultAccess = myRoomSettings.defaultAccess === 'deny' ? 'allow' : 'deny';
      isRoomSettingsDirty = true;
      renderRoomSettingsPanel();
    });
  }

  if (roomSettingsWallpaperPrev) {
    roomSettingsWallpaperPrev.addEventListener('click', () => cycleWallpaper(-1));
  }

  if (roomSettingsWallpaperNext) {
    roomSettingsWallpaperNext.addEventListener('click', () => cycleWallpaper(1));
  }

  if (roomSettingsSaveBtn) {
    roomSettingsSaveBtn.addEventListener('click', () => {
      saveRoomSettings();
      closeRoomSettings();
    });
  }

  /* ============ 好友面板按钮 ============ */
  if (friendAddBtn) {
    friendAddBtn.addEventListener('click', () => {
      const target = String(friendSearchInput?.value || '').trim();
      if (!target) {
        pushCanvasNotice('请输入要添加的昵称', true);
        friendSearchInput?.focus();
        return;
      }
      sendFriendRequestByName(target);
      if (friendSearchInput) friendSearchInput.value = '';
    });
  }

  if (friendSearchInput) {
    friendSearchInput.addEventListener('keydown', e => {
      // 阻止事件冒泡到 window 上的全局 keydown 处理，避免输入时触发游戏按键
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        friendAddBtn?.click();
      }
    });
  }

  imeChatInput.addEventListener('focus', () => {
    if (isChatPanelOpen && !isChatPanelCoveredByOverlay()) {
      isChatInputActive = true;
      updateChatImeInput();
    }
  });

  imeChatInput.addEventListener('input', () => {
    chatInputText = imeChatInput.value.slice(0, 120);
    if (imeChatInput.value !== chatInputText) {
      imeChatInput.value = chatInputText;
    }
  });

  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', () => {
      sendChatFromInput();
      activateChatInput();
    });
  }

  if (chatBoxClose) {
    chatBoxClose.addEventListener('click', () => {
      closeChatPanel();
    });
  }

  if (sysMsgClose) {
    sysMsgClose.addEventListener('click', () => {
      closeSystemMessagesPanel();
    });
  }

  /* ============ 楼梯间搜索框 ============ */
  if (stairsMenuSearchInput) {
    stairsMenuSearchInput.addEventListener('input', () => {
      stairsMenuSearchQuery = stairsMenuSearchInput.value.slice(0, 60);
      stairsMenuIndex = 0;
      renderStairsMenu();
    });
    stairsMenuSearchInput.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (stairsMenuOptions.length) {
          stairsMenuIndex = (stairsMenuIndex - 1 + stairsMenuOptions.length) % stairsMenuOptions.length;
          updateListSelection(stairsMenuList, stairsMenuIndex);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (stairsMenuOptions.length) {
          stairsMenuIndex = (stairsMenuIndex + 1) % stairsMenuOptions.length;
          updateListSelection(stairsMenuList, stairsMenuIndex);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmStairsSelection();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (stairsMenuSearchInput.value) {
          stairsMenuSearchInput.value = '';
          stairsMenuSearchQuery = '';
          stairsMenuIndex = 0;
          renderStairsMenu();
        } else {
          closeStairsMenu();
        }
      }
    });
  }
  if (stairsMenuSearchClear) {
    stairsMenuSearchClear.addEventListener('click', () => {
      if (stairsMenuSearchInput) {
        stairsMenuSearchInput.value = '';
      }
      stairsMenuSearchQuery = '';
      stairsMenuIndex = 0;
      renderStairsMenu();
      if (stairsMenuSearchInput) {
        stairsMenuSearchInput.focus();
      }
    });
  }

  /* ============ 传送搜索框 ============ */
  if (teleportSearchInput) {
    teleportSearchInput.addEventListener('input', () => {
      teleportSearchQuery = teleportSearchInput.value.slice(0, 60);
      teleportIndex = 0;
      renderTeleportPanel();
    });
    teleportSearchInput.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (teleportOptions.length) {
          teleportIndex = (teleportIndex - 1 + teleportOptions.length) % teleportOptions.length;
          updateListSelection(teleportPanelList, teleportIndex);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (teleportOptions.length) {
          teleportIndex = (teleportIndex + 1) % teleportOptions.length;
          updateListSelection(teleportPanelList, teleportIndex);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        teleportToSelectedOption();
        closeTeleportMenu();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (teleportSearchInput.value) {
          teleportSearchInput.value = '';
          teleportSearchQuery = '';
          teleportIndex = 0;
          renderTeleportPanel();
        } else {
          closeTeleportMenu();
        }
      }
    });
  }
  if (teleportSearchClear) {
    teleportSearchClear.addEventListener('click', () => {
      if (teleportSearchInput) {
        teleportSearchInput.value = '';
      }
      teleportSearchQuery = '';
      teleportIndex = 0;
      renderTeleportPanel();
      if (teleportSearchInput) {
        teleportSearchInput.focus();
      }
    });
  }

  function canvasCssPoint(e) {
    const rect = gameCanvas.getBoundingClientRect();
    const scaleX = rect.width ? cssWidth / rect.width : 1;
    const scaleY = rect.height ? cssHeight / rect.height : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  gameCanvas.addEventListener('click', e => {
    if (!isJoined || !uiButtons.length) {
      return;
    }
    const { x, y } = canvasCssPoint(e);

    for (const button of uiButtons) {
      const insideX = x >= button.x && x <= button.x + button.w;
      const insideY = y >= button.y && y <= button.y + button.h;
      if (!insideX || !insideY || button.disabled) {
        continue;
      }
      handleUiButtonClick(button.key);
      break;
    }
  });

  gameCanvas.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') {
      return;
    }
    const { x, y } = canvasCssPoint(e);
    mouseCanvasX = x;
    mouseCanvasY = y;

    updateHoveredButton();

    gameCanvas.style.cursor = hoveredButtonKey ? 'pointer' : 'default';
  });

  gameCanvas.addEventListener('pointerleave', () => {
    mouseCanvasX = -1;
    mouseCanvasY = -1;
    hoveredButtonKey = null;
    gameCanvas.style.cursor = 'default';
    if (buttonTooltip) {
      buttonTooltip.classList.add('hidden');
    }
  });

  const handlePanelWheel = deltaY => {
    if (!isJoined) {
      return false;
    }

    const delta = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;
    if (!delta) {
      return false;
    }

    if (isSystemMessagesOpen || isChatPanelOpen) {
      return false;
    }

    if (isFriendPanelOpen) {
      const candidates = getFriendPanelCandidates();
      if (!candidates.length) {
        return false;
      }
      friendPanelIndex = clamp(friendPanelIndex + delta, 0, candidates.length - 1);
      friendPanelScrollOffset = ensureIndexVisible(friendPanelIndex, 8, candidates.length, friendPanelScrollOffset);
      return true;
    }

    if (isTeleportMenuOpen) {
      if (!teleportOptions.length) {
        return false;
      }
      teleportIndex = clamp(teleportIndex + delta, 0, teleportOptions.length - 1);
      teleportScrollOffset = ensureIndexVisible(teleportIndex, 9, teleportOptions.length, teleportScrollOffset);
      return true;
    }

    if (isRoomSettingsOpen) {
      if (!areaUserDirectory.length) {
        return false;
      }
      roomSettingsUserIndex = clamp(roomSettingsUserIndex + delta, 0, areaUserDirectory.length - 1);
      roomSettingsScrollOffset = ensureIndexVisible(roomSettingsUserIndex, 7, areaUserDirectory.length, roomSettingsScrollOffset);
      return true;
    }

    if (inventoryList && inventoryList.length) {
      inventoryIndex = clamp(inventoryIndex + delta, 0, inventoryList.length - 1);
      inventoryScrollOffset = ensureIndexVisible(inventoryIndex, INVENTORY_VISIBLE_ROWS, inventoryList.length, inventoryScrollOffset);
      return true;
    }

    return false;
  };

  gameCanvas.addEventListener('wheel', e => {
    if (!isJoined) {
      return;
    }
    if (handlePanelWheel(e.deltaY)) {
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('keydown', e => {
    if (!isJoined) {
      return;
    }

    if (isChatPanelOpen && isChatInputActive) {
      if (e.key === 'Escape') {
        closeChatPanel();
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' && !e.isComposing && !isChatComposing) {
        sendChatFromInput();
        e.preventDefault();
        return;
      }
      if (document.activeElement !== imeChatInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        imeChatInput.focus();
      }
      return;
    }

    if (isChatPanelOpen && !isChatInputActive) {
      if (e.key === 'Escape') {
        closeChatPanel();
        e.preventDefault();
        return;
      }
    }

    if (isSystemMessagesOpen) {
      const sysList = normalizeSystemMessages(systemMessagesData).slice().reverse();
      if (e.key === 'Escape') {
        closeSystemMessagesPanel();
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (sysList.length) {
          systemMessageIndex = (systemMessageIndex - 1 + sysList.length) % sysList.length;
          systemMessageScrollOffset = ensureIndexVisible(systemMessageIndex, 9, sysList.length, systemMessageScrollOffset);
          updateSystemMessageSelection();
        }
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (sysList.length) {
          systemMessageIndex = (systemMessageIndex + 1) % sysList.length;
          systemMessageScrollOffset = ensureIndexVisible(systemMessageIndex, 9, sysList.length, systemMessageScrollOffset);
          updateSystemMessageSelection();
        }
        e.preventDefault();
        return;
      }
      if ((e.key === 'a' || e.key === 'A') && !e.repeat) {
        handleSelectedSystemMessageAction('approve');
        e.preventDefault();
        return;
      }
      if ((e.key === 'd' || e.key === 'D') && !e.repeat) {
        handleSelectedSystemMessageAction('reject');
        e.preventDefault();
        return;
      }
      return;
    }

    if (isFriendPanelOpen) {
      const candidates = getFriendPanelCandidates();
      if (e.key === 'Escape') {
        closeFriendPanel();
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (candidates.length) {
          friendPanelIndex = (friendPanelIndex - 1 + candidates.length) % candidates.length;
          friendPanelScrollOffset = ensureIndexVisible(friendPanelIndex, 8, candidates.length, friendPanelScrollOffset);
          updateListSelection(friendPanelList, friendPanelIndex);
        }
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (candidates.length) {
          friendPanelIndex = (friendPanelIndex + 1) % candidates.length;
          friendPanelScrollOffset = ensureIndexVisible(friendPanelIndex, 8, candidates.length, friendPanelScrollOffset);
          updateListSelection(friendPanelList, friendPanelIndex);
        }
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter') {
        const selected = candidates[friendPanelIndex];
        if (selected?.kind === 'player') {
          sendFriendRequestByName(selected.name);
        }
        e.preventDefault();
        return;
      }
      if ((e.key === 'b' || e.key === 'B') && !e.repeat) {
        const selected = candidates[friendPanelIndex];
        if (selected?.kind === 'friend') {
          sendFriendBlockToggleByName(selected.name);
        }
        e.preventDefault();
        return;
      }
      if ((e.key === 'n' || e.key === 'N') && !e.repeat) {
        if (friendSearchInput) {
          friendSearchInput.focus();
        }
        e.preventDefault();
      }
      return;
    }

    if (isTeleportMenuOpen) {
      if (e.key === 'Escape') {
        closeTeleportMenu();
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (teleportOptions.length) {
          teleportIndex = (teleportIndex - 1 + teleportOptions.length) % teleportOptions.length;
          teleportScrollOffset = ensureIndexVisible(teleportIndex, 9, teleportOptions.length, teleportScrollOffset);
          updateListSelection(teleportPanelList, teleportIndex);
        }
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (teleportOptions.length) {
          teleportIndex = (teleportIndex + 1) % teleportOptions.length;
          teleportScrollOffset = ensureIndexVisible(teleportIndex, 9, teleportOptions.length, teleportScrollOffset);
          updateListSelection(teleportPanelList, teleportIndex);
        }
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        teleportToSelectedOption();
        closeTeleportMenu();
        e.preventDefault();
      }
      return;
    }

    if (isRoomSettingsOpen) {
      if (e.key === 'Escape') {
        closeRoomSettings();
        e.preventDefault();
        return;
      }

      if ((e.key === '[' || e.key === ']') && !e.repeat) {
        cycleWallpaper(e.key === ']' ? 1 : -1);
        e.preventDefault();
        return;
      }

      if ((e.key === TELEPORT_KEY || e.key === TELEPORT_KEY.toLowerCase()) && !e.repeat) {
        openTeleportMenu();
        e.preventDefault();
        return;
      }
      if (e.key === 'Tab') {
        myRoomSettings.defaultAccess = myRoomSettings.defaultAccess === 'deny' ? 'allow' : 'deny';
        isRoomSettingsDirty = true;
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (areaUserDirectory.length) {
          roomSettingsUserIndex = (roomSettingsUserIndex - 1 + areaUserDirectory.length) % areaUserDirectory.length;
          roomSettingsScrollOffset = ensureIndexVisible(roomSettingsUserIndex, 7, areaUserDirectory.length, roomSettingsScrollOffset);
          updateListSelection(roomSettingsList, roomSettingsUserIndex);
        }
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (areaUserDirectory.length) {
          roomSettingsUserIndex = (roomSettingsUserIndex + 1) % areaUserDirectory.length;
          roomSettingsScrollOffset = ensureIndexVisible(roomSettingsUserIndex, 7, areaUserDirectory.length, roomSettingsScrollOffset);
          updateListSelection(roomSettingsList, roomSettingsUserIndex);
        }
        e.preventDefault();
        return;
      }

      const selected = getSelectedRoomSettingsUser();
      if ((e.key === 'a' || e.key === 'A') && selected) {
        toggleRoomSettingsList('whitelist', selected.name);
        e.preventDefault();
        return;
      }
      if ((e.key === 'd' || e.key === 'D') && selected) {
        toggleRoomSettingsList('blacklist', selected.name);
        e.preventDefault();
        return;
      }
      if ((e.key === 'x' || e.key === 'X' || e.key === 'Delete') && selected) {
        removeRoomSettingsUser(selected.name);
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter') {
        saveRoomSettings();
        closeRoomSettings();
        e.preventDefault();
      }
      return;
    }

    if (isStairsMenuOpen) {
      if (e.key === 'Escape') {
        closeStairsMenu();
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (stairsMenuOptions.length) {
          stairsMenuIndex = (stairsMenuIndex - 1 + stairsMenuOptions.length) % stairsMenuOptions.length;
          updateListSelection(stairsMenuList, stairsMenuIndex);
        }
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (stairsMenuOptions.length) {
          stairsMenuIndex = (stairsMenuIndex + 1) % stairsMenuOptions.length;
          updateListSelection(stairsMenuList, stairsMenuIndex);
        }
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        confirmStairsSelection();
        e.preventDefault();
      }
      return;
    }

    if ((e.key === 't' || e.key === 'T') && !e.repeat) {
      if (!isChatPanelOpen) {
        openChatPanel(null, null, true);
      } else {
        activateChatInput();
      }
      e.preventDefault();
      return;
    }

    if ((e.key === 'r' || e.key === 'R') && !e.repeat) {
      handleClaimNearestRoom();
      e.preventDefault();
      return;
    }

    if ((e.key === 'h' || e.key === 'H') && !e.repeat) {
      send('clear-history', {});
      e.preventDefault();
      return;
    }

    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      player.moveLeft = true;
      e.preventDefault();
      return;
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      player.moveRight = true;
      e.preventDefault();
      return;
    }
    if ((e.key === 'f' || e.key === 'F') && !e.repeat) {
      const mode = getSceneMode();
      const selected = inventoryList && inventoryList[inventoryIndex];
      if (mode === 'room' && selected && selected.placeable) {
        const x = Math.round(player.x * 100) / 100;
        const y = Math.round(player.y * 100) / 100;
        send('place-item', { itemId: selected.id, slot: inventoryIndex, x, y });
        e.preventDefault();
        return;
      }
    }
    if ((e.key === 'e' || e.key === 'E') && !e.repeat) {
      handleInteractKey();
      e.preventDefault();
      return;
    }
    if ((e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.code === 'Space') && !e.repeat) {
      jumpBufferRemaining = JUMP_BUFFER_SECONDS;
      e.preventDefault();
      return;
    }
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      player.moveLeft = false;
      return;
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      player.moveRight = false;
    }
  });
}

init();
