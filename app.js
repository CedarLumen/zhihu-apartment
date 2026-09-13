'use strict';

const path = require('path');
const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const crypto = require('crypto');
const express = require('express');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const TILE_SIZE = 32;
const FLOOR_Y = 208;
const ROOM_TOP_Y = 32;
const ROOM_HEIGHT_TILES = 5;

// 家具贴地基准 Y（底部坐标）
const CORRIDOR_FLOOR_BASE_Y = FLOOR_Y + TILE_SIZE;                                  // 240
const ROOM_FLOOR_BASE_Y = ROOM_TOP_Y + (ROOM_HEIGHT_TILES - 1) * TILE_SIZE + TILE_SIZE; // 192

// 家具网格
const FURNITURE_GRID = 32;
const FLOOR_COUNT = 100;
const RESIDENT_CAPACITY = 10;
const VISITOR_CAPACITY = 20;
const LOBBY_CAPACITY = 200;
const CHAT_HISTORY_LIMIT = 100;
const HISTORY_RETENTION_DAYS = 30;
const CLIENT_DOOR_START_X = 80;
const CLIENT_DOOR_SPACING = 72;
const CLIENT_STAIRS_OFFSET_X = 120;
const CLIENT_COMMUNITY_SPACE_OFFSET_X = CLIENT_STAIRS_OFFSET_X + CLIENT_DOOR_SPACING;
const CLIENT_FLOOR_Y = 208;
const CLOUD_DIR = path.join(__dirname, 'cloud_data');
const CHAT_HISTORY_DIR = path.join(CLOUD_DIR, 'chat-history');
const PLAYER_CHAT_HISTORY_DIR = path.join(CHAT_HISTORY_DIR, 'by-player');
const PLAYER_PROFILE_FILE = path.join(CLOUD_DIR, 'player-profiles.json');
const ACCOUNTS_FILE = path.join(CLOUD_DIR, 'accounts.json');
const LEGACY_CHAT_HISTORY_FILE = path.join(CLOUD_DIR, 'chat-history.jsonl');
const HISTORY_RETENTION_MS = HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const DOME_101_ID = 'dome-101';
const DOME_101_FLOOR = 101;
const DOME_101_NAME = '101 穹顶';
const DOME_101_ROOM_ID = 'main';
const DOME_101_CAPACITY = 50; // 可调
const STAR_TICKET_ID = 'star-ticket';
const ROOF_AGENT_ID = 'roof-liukanshan';

// ===== 账号系统参数 =====
const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 24;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 64;

const TEXT = {
  lobby: 'Lobby',
  system: 'System',
  lobbyFull: 'Lobby is full (max',
  floorResidentFull: 'Resident capacity reached on this floor (max',
  floorVisitorFull: 'Visitor capacity reached on this floor (max',
  personUnit: 'users)',
  doorplateUsed: 'Doorplate is already in use',
  leave: 'left',
  enter: 'entered',
  inputName: 'Please enter a user name',
  invalidArea: 'Invalid target area',
  residentFloorRange: 'Resident must choose a floor in range',
  doorplateRange: 'Doorplate must be in range',
  joinFirst: 'Please join first',
  lobbyNoRoom: 'Cannot enter room while in lobby',
  invalidRoom: 'Invalid room',
  connected: 'Connected. Please join an area first.',
  badMessage: 'Invalid message format',
  unknownCommand: 'Unknown command',
  floorOnlyAction: 'This action is only available on floor corridor',
  emptyRoomRequired: 'Please choose an empty room',
  claimSuccess: 'Room claimed successfully',
  moveSuccess: 'Moved to new room successfully',
  historyCleared: 'Your chat history has been cleared',
  roomAccessDenied: 'You are not allowed to enter this room',
  roomSettingsUpdated: 'Room permission settings updated',
  invalidTargetPlayer: 'Target player not found',
  cannotAddSelfFriend: 'Cannot add yourself as friend',
  alreadyFriend: 'You are already friends',
  friendRequestSent: 'Friend request sent',
  duplicateFriendRequest: 'Friend request is already pending',
  invalidFriendRequestAction: 'Invalid friend request action',
  friendRequestHandled: 'Friend request handled',
  teleportDenied: 'Teleport denied',
  teleportSuccess: 'Teleported successfully',
  friendOffline: 'Friend is offline',
  notYourFriend: 'Target is not your friend',
  notVisitedFloor: 'You have not visited this floor yet',
  friendBlocked: 'Friend is blocked',
  friendBlockUpdated: 'Friend block setting updated',
  wallpaperUpdated: 'Room wallpaper updated',
  wallpaperDenied: 'Only the room owner can change wallpaper',
  domeTicketRequired: '需要 穹顶通行证（star-ticket）才能进入 101 穹顶',
  domeFull: '101 穹顶人数已满 (max',
  needAuth: '请先登录或注册账号'
};

// ===== 房间墙纸预设 =====
const WALLPAPER_PRESETS = [
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
const DEFAULT_WALLPAPER_ID = 'default';
const WALLPAPER_IDS = new Set(WALLPAPER_PRESETS.map(item => item.id));

function normalizeWallpaperId(value) {
  const id = String(value || '').trim();
  return WALLPAPER_IDS.has(id) ? id : DEFAULT_WALLPAPER_ID;
}

// Agent configuration
const AGENT_ID = 'liu-kanshan';
const AGENT_NAME = '刘看山';
const AGENT_PROMPT = '我是刘看山，是知乎的吉祥物，一只北极狐，我的任务是帮助用户了解这里，包括各种操作，房间布局，同时激励用户探索未知';
const AGENTS_DIR = path.join(CLOUD_DIR, 'agents');
const AGENTS_ASSIGNMENTS_FILE = path.join(AGENTS_DIR, 'assignments.json');
const ROOM_CLAIMS_FILE = path.join(AGENTS_DIR, 'rooms_claims.json');

let AGENT_ASSIGNMENTS = [];
let ROOM_CLAIMS = {};
let AGENT_BY_ID = new Map();

function loadAgentData() {
  try {
    if (fs.existsSync(AGENTS_ASSIGNMENTS_FILE)) {
      AGENT_ASSIGNMENTS = JSON.parse(fs.readFileSync(AGENTS_ASSIGNMENTS_FILE, 'utf8')) || [];
    } else {
      AGENT_ASSIGNMENTS = [];
    }
  } catch (_e) {
    AGENT_ASSIGNMENTS = [];
  }

  try {
    if (fs.existsSync(ROOM_CLAIMS_FILE)) {
      ROOM_CLAIMS = JSON.parse(fs.readFileSync(ROOM_CLAIMS_FILE, 'utf8')) || {};
    } else {
      ROOM_CLAIMS = {};
    }
  } catch (_e) {
    ROOM_CLAIMS = {};
  }

  AGENT_BY_ID = new Map();
  for (const agent of AGENT_ASSIGNMENTS) {
    if (!agent || !agent.id) {
      continue;
    }
    AGENT_BY_ID.set(String(agent.id), agent);
  }
}

loadAgentData();
function ensureRoofAgent() {
  if (AGENT_BY_ID.has(ROOF_AGENT_ID)) {
    return;
  }

  const roofAgent = {
    id: ROOF_AGENT_ID,
    name: '刘看山',
    prompt: '我是刘看山，知乎的IP，一只北极狐。我在 101 穹顶，负责欢迎拿到穹顶通行证的探索者。首先恭贺玩家通关。我之前已经向玩家透露过其他信息了，所以我不再留意玩家的其他提问，而是沉迷于星空。',
    avatar: '/textures/stand_liukanshan.webp',
    location: {
      roomId: `${DOME_101_ID}__${DOME_101_ROOM_ID}`,
      floor: DOME_101_FLOOR,
      posX: 0,
      posY: FLOOR_Y
    }
  };

  AGENT_ASSIGNMENTS.push(roofAgent);
  AGENT_BY_ID.set(ROOF_AGENT_ID, roofAgent);
}

ensureRoofAgent();
function getAgentConfigById(agentId) {
  const id = String(agentId || AGENT_ID);
  const agent = AGENT_BY_ID.get(id);
  if (agent) {
    return {
      id,
      name: String(agent.name || id),
      prompt: String(agent.prompt || ''),
      avatar: String(agent.avatar || '/textures/agent_robot.webp')
    };
  }
  return {
    id,
    name: AGENT_NAME,
    prompt: AGENT_PROMPT,
    avatar: '/textures/agent_robot.webp'
  };
}

// try to read deepseek API key from a few possible locations
let DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || null;
try {
  const tryPath = path.join(__dirname, 'deepseekAPI');
  if (fs.existsSync(tryPath)) {
    const raw = fs.readFileSync(tryPath, 'utf8').trim();
    if (raw) DEEPSEEK_API_KEY = raw;
  }
} catch (_e) { }

function getAgentHistoryForPlayer(playerName, agentId) {
  try {
    return getPlayerRoomHistory(playerName, 'agent', agentId);
  } catch (_e) {
    return [];
  }
}

async function handleOpenAgent(ws, payload) {
  const user = clients.get(ws);
  if (!user) return send(ws, 'error', { message: TEXT.joinFirst });
  const agentId = String(payload?.agentId || AGENT_ID);
  const agentConfig = getAgentConfigById(agentId);
  const history = getAgentHistoryForPlayer(user.name, agentId) || [];
  if (!history.length) {
    send(ws, 'chat-history', { messages: [] });
    return;
  }
  send(ws, 'chat-history', { messages: history });
}

// 解析 NPC 回复中的物品奖励标记，支持 <"item": 2> 或 <item: 2>
// 兼容 <"id": 1>、<id:1>、< "id" : 1 >、全角引号/冒号 等写法
function makeItemRewardRegex() {
  return /<\s*["'“”‘’]?\s*([^<>:"'“”‘’]+?)\s*["'“”‘’]?\s*[:：]\s*(\d+)\s*>/g;
}

function parseItemRewards(text) {
  const rewards = [];
  if (!text) return rewards;
  const regex = makeItemRewardRegex();
  let match;
  while ((match = regex.exec(String(text))) !== null) {
    const itemId = match[1].trim();
    const qty = parseInt(match[2], 10);
    if (itemId && Number.isInteger(qty) && qty > 0) {
      rewards.push({ itemId, qty });
    }
  }
  return rewards;
}

function stripItemRewardTags(text) {
  if (!text) return '';
  return String(text).replace(makeItemRewardRegex(), '').trim();
}

// 统一发放奖励 + 清理文本
function applyAgentItemRewards(user, agentConfig, assistantText) {
  const rewards = parseItemRewards(assistantText);
  if (!rewards.length) {
    return { text: assistantText, rewards: [] };
  }
  for (const reward of rewards) {
    addItemToUserInventory(user, reward.itemId, reward.qty);
  }
  let cleaned = stripItemRewardTags(assistantText);
  if (!cleaned) {
    cleaned = `${agentConfig.name}: 已收到物品。`;
  }
  return { text: cleaned, rewards };
}
// 向玩家背包添加物品
function addItemToUserInventory(user, itemId, qty) {
  if (!user) return;
  if (!Array.isArray(user.inventory)) user.inventory = [];
  const existing = user.inventory.find(i => String(i.id) === itemId);
  if (existing) {
    existing.qty = (Number(existing.qty) || 0) + qty;
  } else {
    const def = ITEM_DEFINITIONS.get(itemId);
    user.inventory.push({ id: itemId, name: def?.name || itemId, qty });
  }
  user.inventory = normalizeInventory(user.inventory);
  upsertPlayerProfileFromUser(user);
  pushStateForUser(user);
}

// 从玩家背包移除物品
function removeItemFromUserInventory(user, itemId, qty = 1) {
  if (!user || !Array.isArray(user.inventory)) return false;
  const idx = user.inventory.findIndex(i => String(i.id) === itemId);
  if (idx === -1) return false;
  const item = user.inventory[idx];
  if ((Number(item.qty) || 0) < qty) return false;
  item.qty -= qty;
  if (item.qty <= 0) {
    user.inventory.splice(idx, 1);
  }
  user.inventory = normalizeInventory(user.inventory);
  upsertPlayerProfileFromUser(user);
  pushStateForUser(user);
  return true;
}

// 将历史记录转换为 DeepSeek messages
function buildAgentMessages(user, agentConfig, history, extraUserText = null) {
  const messages = [];
  if (agentConfig.prompt) {
    messages.push({ role: 'system', content: agentConfig.prompt });
  }

  for (const record of history || []) {
    const rawText = String(record?.text || '').trim();
    if (!rawText) continue;

    if (record.sender === 'System' || rawText.startsWith('#sys:')) {
      messages.push({
        role: 'user',
        content: `[系统通知] ${rawText.replace(/^#sys:\s*/, '')}`
      });
    } else if (String(record.sender) === String(user.name)) {
      messages.push({ role: 'user', content: rawText });
    } else if (rawText.startsWith('#')) {
      continue;
    } else {
      messages.push({ role: 'assistant', content: rawText });
    }
  }

  const extra = String(extraUserText || '').trim();
  if (extra) {
    messages.push({ role: 'user', content: extra });
  }
  return messages;
}

// 调用模型生成 agent 回复（无 API Key 时使用本地回退回复）
async function generateAgentReply(user, agentConfig, agentId, options = {}) {
  const { extraUserText = null, fallbackText = null } = options;
  const history = getAgentHistoryForPlayer(user.name, agentId) || [];

  if (!DEEPSEEK_API_KEY || typeof globalThis.fetch !== 'function') {
    return fallbackText || `${agentConfig.name}: 你好！我是${agentConfig.name}，API调用失败。`;
  }

  const messages = buildAgentMessages(user, agentConfig, history, extraUserText);
  const maxHistoryMessages = Number(process.env.DEEPSEEK_MAX_HISTORY || 30);
  const limitedMessages = messages.slice(-maxHistoryMessages);
  const selectedModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  const deepseekUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

  const body = {
    model: selectedModel,
    messages: limitedMessages,
    max_tokens: Number(process.env.DEEPSEEK_MAX_TOKENS || 3000),  // 800 → 3000
    temperature: Number(process.env.DEEPSEEK_TEMPERATURE || 0.2)
  };

  console.log('[agent] DeepSeek selected model=', selectedModel, 'messages=', limitedMessages.length);
  console.log('[agent] DeepSeek request body=', JSON.stringify(body).slice(0, 2000));
  console.log('[agent] DeepSeek request ->', deepseekUrl);

  try {
    const resp = await fetch(deepseekUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    let respText = null;
    try { respText = await resp.text(); } catch (_e) { respText = null; }
    let data = null;
    try { data = respText ? JSON.parse(respText) : null; } catch (_e) { data = null; }

    console.log('[agent] DeepSeek response status=', resp.status, 'body=', respText);

    if (!resp.ok) {
      return `${agentConfig.name}: 抱歉，调用外部问答接口失败 (status ${resp.status}).`;
    }

    let assistantText = null;
    if (data) {
      if (typeof data === 'string') {
        assistantText = data;
      } else if (data.text) {
        assistantText = String(data.text);
      } else if (data.output && typeof data.output === 'string') {
        assistantText = data.output;
      } else if (Array.isArray(data.choices) && data.choices[0]) {
        const choice = data.choices[0];
        assistantText = choice.text
          || (choice.message && choice.message.content)
          || null;

        // ★ 关键诊断：content 为空但 finish_reason 是 length，说明推理吃满了 token
        if (!assistantText && choice.finish_reason === 'length') {
          const reasoningTokens = data.usage?.completion_tokens_details?.reasoning_tokens;
          console.warn(
            `[agent] content 为空，finish_reason=length，reasoning_tokens=${reasoningTokens ?? '?'}。` +
            `请调大 DEEPSEEK_MAX_TOKENS 或改用非推理模型。`
          );
        }
      } else if (data.result) {
        assistantText = String(data.result);
      } else if (Array.isArray(data.outputs) && data.outputs[0] && data.outputs[0].text) {
        assistantText = data.outputs[0].text;
      }
    }

    return assistantText || fallbackText || `${agentConfig.name}: 我已收到你的信息。`;
  } catch (_err) {
    return fallbackText || `${agentConfig.name}: 我已收到你的信息。`;
  }
}

// 处理 /give 命令
async function handleGiveItem(ws, user, agentId, agentConfig, itemId) {
  const removed = removeItemFromUserInventory(user, itemId, 1);
  if (!removed) {
    send(ws, 'error', { message: `背包中没有 ${itemId}` });
    return;
  }

  pushSystemMessage(user, { type: 'notice', text: `${itemId}已给出`, read: false });
  pushStateForUser(user);
  send(ws, 'info', { message: `${itemId}已给出` });

  const systemRecord = {
    areaId: 'agent',
    roomId: agentId,
    sender: 'System',
    text: `#sys: 玩家「${user.name}」向你赠送了物品 ${itemId}（数量 1）`,
    timestamp: new Date().toISOString()
  };
  appendHistoryForUser(user, systemRecord);

  let assistantText = await generateAgentReply(user, agentConfig, agentId, {
    extraUserText: `（系统通知：玩家刚把物品 ${itemId} 交给你。请用符合你角色设定的一两句话向玩家表示感谢或作出回应。）`,
    fallbackText: `${agentConfig.name}: 谢谢你送我的「${itemId}」，我收下啦！`
  });

  // ★ 关键修复：解析并发放 NPC 回赠物品
  assistantText = applyAgentItemRewards(user, agentConfig, assistantText).text;

  const assistantRecord = {
    areaId: 'agent',
    roomId: agentId,
    sender: agentConfig.name,
    text: assistantText,
    timestamp: new Date().toISOString()
  };
  appendHistoryForUser(user, assistantRecord);
  send(ws, 'chat', assistantRecord);
}

async function handleAgentChat(ws, payload) {
  const user = clients.get(ws);
  if (!user) return send(ws, 'error', { message: TEXT.joinFirst });
  const agentId = String(payload?.agentId || AGENT_ID);
  const agentConfig = getAgentConfigById(agentId);
  const text = String(payload?.text || '').trim();
  if (!text) return;

  const giveMatch = /^\/give\s+(\S+)/i.exec(text);
  if (giveMatch) {
    await handleGiveItem(ws, user, agentId, agentConfig, giveMatch[1].trim());
    return;
  }

  if (text.startsWith('#')) {
    return;
  }

  const userRecord = { areaId: 'agent', roomId: agentId, sender: user.name, text, timestamp: new Date().toISOString() };
  appendHistoryForUser(user, userRecord);
  send(ws, 'chat', userRecord);

  // ★ 关键：先让模型生成回复
  let assistantText = await generateAgentReply(user, agentConfig, agentId, {
    fallbackText: `${agentConfig.name}: 你好！我是${agentConfig.name}。API调用失败！${text}`
  });

  // ★ 再统一解析 / 发放奖励 + 清理标记
  assistantText = applyAgentItemRewards(user, agentConfig, assistantText).text;

  const assistantRecord = {
    areaId: 'agent',
    roomId: agentId,
    sender: agentConfig.name,
    text: assistantText,
    timestamp: new Date().toISOString()
  };
  appendHistoryForUser(user, assistantRecord);
  send(ws, 'chat', assistantRecord);
}
try {
  const tryPath2 = path.join(__dirname, 'apikey.txt');
  if (!DEEPSEEK_API_KEY && fs.existsSync(tryPath2)) {
    const raw = fs.readFileSync(tryPath2, 'utf8').trim();
    if (raw) DEEPSEEK_API_KEY = raw;
  }
} catch (_e) { }

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Item definitions and server-side use behaviors
const ITEM_DEFINITIONS = new Map();
ITEM_DEFINITIONS.set('sample-1', {
  id: 'sample-1',
  name: '示例物品1',
  consumable: true,
  placeable: true,
  onUse: (user, item) => {
    pushSystemMessage(user, { type: 'notice', text: `You used ${item.name || item.id}.`, read: false });
    if (user.ws && user.ws.readyState === 1) pushStateForUser(user);
    notifyRoom(user.areaId, user.roomId, `${user.name} used ${item.name || item.id}`);
  }
});
ITEM_DEFINITIONS.set('chair', {
  id: 'chair',
  name: '椅子',
  placeable: true,
  consumable: false,
  size: { w: 32, h: 32 }
});
ITEM_DEFINITIONS.set('sofa', {
  id: 'sofa',
  name: '沙发',
  placeable: true,
  consumable: false,
  size: { w: 96, h: 48 }
});
ITEM_DEFINITIONS.set('rug', {
  id: 'rug',
  name: '地毯',
  placeable: true,
  consumable: false,
  size: { w: 128, h: 64 }
});
ITEM_DEFINITIONS.set('seal-knowledge', { id: 'seal-knowledge', name: '求知印章', placeable: false, consumable: false });
ITEM_DEFINITIONS.set('seal-truth', { id: 'seal-truth', name: '求真印章', placeable: false, consumable: false });
ITEM_DEFINITIONS.set('star-ticket', { id: 'star-ticket', name: '穹顶通行证', placeable: false, consumable: false });

function handlePlaceItem(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }

  const area = parseArea(user.areaId);
  if (!area || area.type !== 'floor') {
    send(ws, 'error', { message: TEXT.floorOnlyAction });
    return;
  }

  if (!user.roomId || !/^room-\d+$/.test(user.roomId)) {
    send(ws, 'error', { message: TEXT.invalidRoom });
    return;
  }

  const roomMatch = /^room-(\d+)$/.exec(user.roomId || '');
  const doorplate = roomMatch ? Number(roomMatch[1]) : null;
  if (!(user.role === 'resident' && user.homeFloor === area.floor && user.doorplate === doorplate)) {
    send(ws, 'error', { message: TEXT.floorOnlyAction });
    return;
  }

  const itemId = String(payload?.itemId || '').trim();
  const slot = Number.isFinite(Number(payload?.slot)) ? Math.floor(Number(payload.slot)) : null;
  const inv = Array.isArray(user.inventory) ? user.inventory : [];
  let idx = -1;
  if (itemId) idx = inv.findIndex(i => String(i.id) === itemId);
  else if (Number.isInteger(slot) && slot >= 0 && slot < inv.length) idx = slot;
  if (idx === -1) {
    send(ws, 'error', { message: 'Item not found in inventory' });
    return;
  }

  const item = inv[idx];
  const def = ITEM_DEFINITIONS.get(String(item.id)) || {};
  if (!def.placeable) {
    send(ws, 'error', { message: 'Item is not placeable' });
    return;
  }

  const size = (def && def.size && typeof def.size === 'object') ? def.size : {};
  const furnWidth = Number.isFinite(Number(size.w)) && Number(size.w) > 0
    ? Math.round(Number(size.w) * 100) / 100 : 32;
  const furnHeight = Number.isFinite(Number(size.h)) && Number(size.h) > 0
    ? Math.round(Number(size.h) * 100) / 100 : 32;

  const rawX = Number.isFinite(Number(payload?.x))
    ? Number(payload.x)
    : (Number.isFinite(user.posX) ? user.posX : null);
  if (rawX === null) {
    send(ws, 'error', { message: 'Invalid placement position' });
    return;
  }
  const x = snapFurnitureX(rawX, furnWidth);

  const isInRoom = area.type === 'floor' && /^room-\d+$/.test(user.roomId || '');
  const y = isInRoom ? ROOM_FLOOR_BASE_Y : CORRIDOR_FLOOR_BASE_Y;

  const newBounds = {
    left: x - furnWidth / 2,
    right: x + furnWidth / 2,
    top: y - furnHeight,
    bottom: y
  };
  if (collidesWithExistingFurniture(user.areaId, user.roomId, newBounds)) {
    send(ws, 'error', { message: '放置失败：此处已有家具，无法重叠' });
    return;
  }

  const instanceId = nextFurnitureId++;
  const furn = {
    instanceId,
    id: item.id,
    name: item.name,
    areaId: user.areaId,
    roomId: user.roomId,
    x,
    y,
    w: furnWidth,
    h: furnHeight
  };

  if (!Array.isArray(user.furnishings)) user.furnishings = [];
  user.furnishings.push(furn);

  if (def.consumable !== false) {
    item.qty = Math.max(0, (Number(item.qty) || 0) - 1);
    if (item.qty <= 0) inv.splice(idx, 1);
  }

  user.inventory = normalizeInventory(inv);
  user.furnishings = normalizeFurnishings(user.furnishings);
  upsertPlayerProfileFromUser(user);
  void persistPlayerProfiles();

  notifyRoom(user.areaId, user.roomId, `${user.name} placed ${furn.name || furn.id}`);
  pushStateForLocation(user.areaId, user.roomId);
  pushStateForAllOnlineUsers();
  send(ws, 'info', { message: 'Placed item.' });
}

app.use((req, res, next) => {
  const accept = req.headers.accept || '';
  if (accept.includes('application/json')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  } else if (accept.includes('text/')) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  }

  next();
});

function normalizeVisitedFloors(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  const seen = new Set();
  const floors = [];
  for (const item of list) {
    const floor = Number(item);
    if (!Number.isInteger(floor) || floor < 1 || floor > FLOOR_COUNT || seen.has(floor)) {
      continue;
    }
    seen.add(floor);
    floors.push(floor);
  }
  floors.sort((a, b) => a - b);
  return floors;
}

function normalizeSystemMessages(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  const normalized = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const id = Number(item.id);
    const type = String(item.type || '').trim();
    const text = String(item.text || '').trim();
    const createdAt = String(item.createdAt || '').trim() || new Date().toISOString();
    if (!Number.isInteger(id) || !type || !text) {
      continue;
    }
    normalized.push({
      id,
      type,
      text,
      createdAt,
      read: item.read === true,
      meta: item.meta && typeof item.meta === 'object' ? item.meta : {}
    });
    nextSystemMessageId = Math.max(nextSystemMessageId, id + 1);
  }
  return normalized.slice(-200);
}

function handleUseItem(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }

  const itemId = String(payload?.itemId || '').trim();
  const slot = Number.isFinite(Number(payload?.slot)) ? Math.floor(Number(payload.slot)) : null;
  let targetIndex = -1;
  const inv = Array.isArray(user.inventory) ? user.inventory : [];
  if (itemId) {
    targetIndex = inv.findIndex(i => String(i.id) === itemId);
  } else if (Number.isInteger(slot) && slot >= 0 && slot < inv.length) {
    targetIndex = slot;
  }

  if (targetIndex === -1) {
    send(ws, 'error', { message: 'Item not found in inventory' });
    return;
  }

  const item = inv[targetIndex];
  if (!item || !item.id) {
    send(ws, 'error', { message: 'Invalid item' });
    return;
  }

  const def = ITEM_DEFINITIONS.get(String(item.id)) || { consumable: true };

  try {
    if (def && typeof def.onUse === 'function') {
      def.onUse(user, item);
    } else {
      pushSystemMessage(user, { type: 'notice', text: `You used ${item.name || item.id}.`, read: false });
      notifyRoom(user.areaId, user.roomId, `${user.name} used ${item.name || item.id}`);
    }

    if (def.consumable !== false) {
      item.qty = Math.max(0, (Number(item.qty) || 0) - 1);
      if (item.qty <= 0) {
        inv.splice(targetIndex, 1);
      }
    }

    user.inventory = normalizeInventory(inv);
    upsertPlayerProfileFromUser(user);
    pushStateForUser(user);
    send(ws, 'info', { message: `Used item: ${item.name || item.id}` });
  } catch (_err) {
    send(ws, 'error', { message: 'Failed to use item' });
  }
}

function normalizeInventory(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Map();
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item.id || '').trim();
    const name = String(item.name || '').trim() || id;
    const qty = Number.isFinite(Number(item.qty)) ? Math.max(0, Math.floor(Number(item.qty))) : 0;
    if (!id || qty <= 0) continue;
    if (seen.has(id)) {
      seen.set(id, { id, name, qty: seen.get(id).qty + qty });
    } else {
      seen.set(id, { id, name, qty });
    }
  }
  return [...seen.values()];
}

const clients = new Map();
let nextUserId = 1;
let nextSystemMessageId = 1;
let nextFurnitureId = 1;
const playerRoomHistory = new Map();
const playerProfiles = new Map();

/* =========================================================
 *  账号系统（用户名 + 密码）
 * ========================================================= */

const accounts = new Map(); // key: 小写用户名 → { name, salt, hash, createdAt }

function normalizeAccountKey(name) {
  return String(name || '').trim().toLowerCase();
}

function hashPassword(password, salt) {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), useSalt, 64).toString('hex');
  return { salt: useSalt, hash };
}

function verifyPassword(password, salt, hash) {
  try {
    const test = crypto.scryptSync(String(password), String(salt), 64).toString('hex');
    const a = Buffer.from(test, 'hex');
    const b = Buffer.from(String(hash), 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (_e) {
    return false;
  }
}

function loadAccounts() {
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      return;
    }
    const parsed = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    if (!Array.isArray(parsed)) {
      return;
    }
    for (const item of parsed) {
      const key = normalizeAccountKey(item?.name);
      if (!key || !item?.salt || !item?.hash) {
        continue;
      }
      accounts.set(key, {
        name: String(item.name),
        salt: String(item.salt),
        hash: String(item.hash),
        createdAt: String(item.createdAt || new Date().toISOString())
      });
    }
  } catch (_e) {
    // Ignore account load failures.
  }
}

async function persistAccounts() {
  try {
    await fsp.mkdir(CLOUD_DIR, { recursive: true });
    const payload = [...accounts.values()].map(account => ({
      name: account.name,
      salt: account.salt,
      hash: account.hash,
      createdAt: account.createdAt
    }));
    await fsp.writeFile(ACCOUNTS_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (_e) {
    // Ignore account save failures.
  }
}

function handleRegister(ws, payload) {
  const name = String(payload?.name || '').trim();
  const password = String(payload?.password || '');

  if (name.length < MIN_USERNAME_LENGTH || name.length > MAX_USERNAME_LENGTH) {
    send(ws, 'auth-error', { message: `用户名长度需为 ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} 个字符` });
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    send(ws, 'auth-error', { message: `密码长度需为 ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} 位` });
    return;
  }

  const key = normalizeAccountKey(name);
  if (accounts.has(key)) {
    send(ws, 'auth-error', { message: '该用户名已被注册，请直接登录' });
    return;
  }

  const { salt, hash } = hashPassword(password);
  accounts.set(key, {
    name,
    salt,
    hash,
    createdAt: new Date().toISOString()
  });
  void persistAccounts();

  ws.authenticatedUsername = name;
  ws.authenticatedAccountKey = key;
  send(ws, 'auth-success', { name, mode: 'register' });
}

function handleLogin(ws, payload) {
  const name = String(payload?.name || '').trim();
  const password = String(payload?.password || '');

  if (!name || !password) {
    send(ws, 'auth-error', { message: '请输入用户名和密码' });
    return;
  }

  const key = normalizeAccountKey(name);
  const account = accounts.get(key);
  if (!account) {
    send(ws, 'auth-error', { message: '该账号不存在，请先注册' });
    return;
  }
  if (!verifyPassword(password, account.salt, account.hash)) {
    send(ws, 'auth-error', { message: '密码错误' });
    return;
  }

  ws.authenticatedUsername = account.name;
  ws.authenticatedAccountKey = key;
  send(ws, 'auth-success', { name: account.name, mode: 'login' });
}

loadAccounts();

/* =========================================================
 *  以上为账号系统
 * ========================================================= */

function normalizedPlayerName(name) {
  return String(name || '').trim();
}

function normalizeFurnishings(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;

    const instanceId = item.instanceId || item.id || String(Date.now()) + Math.random().toString(36).slice(2, 8);
    const id = String(item.id || item.itemId || '').trim();
    const name = String(item.name || '').trim() || id;
    const areaId = String(item.areaId || item.roomAreaId || '').trim();
    const roomId = String(item.roomId || '').trim();

    const x = Number.isFinite(Number(item.x)) ? Math.round(Number(item.x) * 100) / 100 : null;
    const y = Number.isFinite(Number(item.y)) ? Math.round(Number(item.y) * 100) / 100 : null;
    const w = Number.isFinite(Number(item.w)) && Number(item.w) > 0
      ? Math.round(Number(item.w) * 100) / 100 : 32;
    const h = Number.isFinite(Number(item.h)) && Number(item.h) > 0
      ? Math.round(Number(item.h) * 100) / 100 : 32;

    if (!id || !areaId || !roomId) continue;
    out.push({ instanceId, id, name, areaId, roomId, x, y, w, h });
  }
  return out;
}

// 把家具中心 X 吸附到网格
function snapFurnitureX(centerX, width) {
  const w = Number.isFinite(Number(width)) && Number(width) > 0 ? Number(width) : 32;
  const halfW = w / 2;
  const left = centerX - halfW;
  const snappedLeft = Math.round(left / FURNITURE_GRID) * FURNITURE_GRID;
  return snappedLeft + halfW;
}

// 计算单件家具的包围盒
function furnishingBounds(f) {
  const w = Number.isFinite(Number(f.w)) && Number(f.w) > 0 ? Number(f.w) : 32;
  const h = Number.isFinite(Number(f.h)) && Number(f.h) > 0 ? Number(f.h) : 32;
  const cx = Number.isFinite(Number(f.x)) ? Number(f.x) : 0;
  const by = Number.isFinite(Number(f.y)) ? Number(f.y) : 0;
  return {
    left: cx - w / 2,
    right: cx + w / 2,
    top: by - h,
    bottom: by
  };
}

// 两个轴对齐矩形是否重叠
function boundsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

// 新家具是否与同房间已有家具重叠
function collidesWithExistingFurniture(areaId, roomId, newBounds, excludeInstanceId = null) {
  const seen = new Set();

  const test = (f) => {
    if (!f) return false;
    if (f.areaId !== areaId || f.roomId !== roomId) return false;
    const key = String(f.instanceId);
    if (excludeInstanceId && key === String(excludeInstanceId)) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return boundsOverlap(newBounds, furnishingBounds(f));
  };

  for (const other of clients.values()) {
    for (const f of other.furnishings || []) {
      if (test(f)) return true;
    }
  }
  for (const profile of playerProfiles.values()) {
    for (const f of profile.furnishings || []) {
      if (test(f)) return true;
    }
  }
  return false;
}

function normalizedPlayerNameKey(name) {
  return normalizedPlayerName(name).toLocaleLowerCase();
}

function loadPlayerProfiles() {
  try {
    if (!fs.existsSync(PLAYER_PROFILE_FILE)) {
      return;
    }
    const raw = fs.readFileSync(PLAYER_PROFILE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return;
    }
    for (const item of parsed) {
      const name = normalizedPlayerName(item?.name);
      const key = normalizedPlayerNameKey(name);
      if (!key) {
        continue;
      }
      const role = item?.role === 'resident' ? 'resident' : 'visitor';
      const homeFloor = Number(item?.homeFloor);
      const doorplate = Number(item?.doorplate);
      const safeHomeFloor = Number.isInteger(homeFloor) && homeFloor >= 1 && homeFloor <= FLOOR_COUNT ? homeFloor : null;
      const safeDoorplate = Number.isInteger(doorplate) && doorplate >= 1 && doorplate <= RESIDENT_CAPACITY ? doorplate : null;
      playerProfiles.set(key, {
        name,
        role,
        homeFloor: role === 'resident' ? safeHomeFloor : null,
        doorplate: role === 'resident' ? safeDoorplate : null,
        wallpaper: normalizeWallpaperId(item?.wallpaper),
        roomSettings: normalizeRoomSettings(item?.roomSettings, name),
        friends: normalizePlayerNameList(item?.friends, name),
        blockedFriends: normalizePlayerNameList(item?.blockedFriends, name),
        visitedFloors: normalizeVisitedFloors(item?.visitedFloors),
        systemMessages: normalizeSystemMessages(item?.systemMessages),
        inventory: normalizeInventory(item?.inventory),
        furnishings: normalizeFurnishings(item?.furnishings)
      });
    }
  } catch (_err) {
    // Ignore profile load failures.
  }
}

function pushStateForAllOnlineUsers() {
  for (const user of clients.values()) {
    pushStateForUser(user);
  }
}

function pushStateForPlayerName(playerName) {
  const key = normalizedPlayerNameKey(playerName);
  if (!key) {
    return;
  }
  for (const user of clients.values()) {
    if (normalizedPlayerNameKey(user.name) === key) {
      pushStateForUser(user);
      return;
    }
  }
}

// 推送给整层楼的所有在线玩家
function pushStateForFloor(floor) {
  const targetAreaId = `floor-${floor}`;
  for (const user of clients.values()) {
    if (user.areaId === targetAreaId) {
      pushStateForUser(user);
    }
  }
}

async function persistPlayerProfiles() {
  try {
    await fsp.mkdir(CLOUD_DIR, { recursive: true });
    const payload = [...playerProfiles.values()].map(profile => ({
      name: profile.name,
      role: profile.role,
      homeFloor: profile.homeFloor,
      doorplate: profile.doorplate,
      wallpaper: normalizeWallpaperId(profile.wallpaper),
      roomSettings: normalizeRoomSettings(profile.roomSettings, profile.name),
      friends: normalizePlayerNameList(profile.friends, profile.name),
      blockedFriends: normalizePlayerNameList(profile.blockedFriends, profile.name),
      visitedFloors: normalizeVisitedFloors(profile.visitedFloors),
      systemMessages: normalizeSystemMessages(profile.systemMessages),
      inventory: normalizeInventory(profile.inventory),
      furnishings: normalizeFurnishings(profile.furnishings)
    }));
    await fsp.writeFile(PLAYER_PROFILE_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (_err) {
    // Ignore profile save failures.
  }
}

function upsertPlayerProfileFromUser(user) {
  const key = normalizedPlayerNameKey(user?.name);
  if (!key) {
    return;
  }
  playerProfiles.set(key, {
    name: normalizedPlayerName(user.name),
    role: user.role === 'resident' ? 'resident' : 'visitor',
    homeFloor: user.role === 'resident' ? user.homeFloor : null,
    doorplate: user.role === 'resident' ? user.doorplate : null,
    wallpaper: normalizeWallpaperId(user.wallpaper),
    roomSettings: normalizeRoomSettings(user.roomSettings, user.name),
    friends: normalizePlayerNameList(user.friends, user.name),
    blockedFriends: normalizePlayerNameList(user.blockedFriends, user.name),
    visitedFloors: normalizeVisitedFloors(user.visitedFloors),
    systemMessages: normalizeSystemMessages(user.systemMessages),
    inventory: normalizeInventory(user.inventory),
    furnishings: normalizeFurnishings(user.furnishings)
  });
  void persistPlayerProfiles();
}

function getPlayerProfileByName(name) {
  const key = normalizedPlayerNameKey(name);
  if (!key) {
    return null;
  }
  return playerProfiles.get(key) || null;
}

function ensureProfileForName(name) {
  const normalizedName = normalizedPlayerName(name);
  const key = normalizedPlayerNameKey(normalizedName);
  if (!key) {
    return null;
  }
  let profile = playerProfiles.get(key);
  if (!profile) {
    profile = {
      name: normalizedName,
      role: 'visitor',
      homeFloor: null,
      doorplate: null,
      wallpaper: DEFAULT_WALLPAPER_ID,
      roomSettings: defaultRoomSettings(),
      friends: [],
      blockedFriends: [],
      visitedFloors: [],
      systemMessages: [],
      inventory: [],
      furnishings: []
    };
    playerProfiles.set(key, profile);
  }
  profile.roomSettings = normalizeRoomSettings(profile.roomSettings, profile.name);
  profile.friends = normalizePlayerNameList(profile.friends, profile.name);
  profile.blockedFriends = normalizePlayerNameList(profile.blockedFriends, profile.name);
  profile.visitedFloors = normalizeVisitedFloors(profile.visitedFloors);
  profile.systemMessages = normalizeSystemMessages(profile.systemMessages);
  profile.inventory = normalizeInventory(profile.inventory);
  profile.furnishings = normalizeFurnishings(profile.furnishings);
  profile.wallpaper = normalizeWallpaperId(profile.wallpaper);
  return profile;
}

function normalizeUserSocialState(user) {
  user.friends = normalizePlayerNameList(user.friends, user.name);
  user.blockedFriends = normalizePlayerNameList(user.blockedFriends, user.name);
  user.visitedFloors = normalizeVisitedFloors(user.visitedFloors);
  user.systemMessages = normalizeSystemMessages(user.systemMessages);
}

function unreadSystemMessageCount(user) {
  return (user.systemMessages || []).filter(message => message.read !== true).length;
}

function isFriendName(user, otherName) {
  const key = normalizedPlayerNameKey(otherName);
  return (user.friends || []).some(name => normalizedPlayerNameKey(name) === key);
}

function addFriendName(user, otherName) {
  const name = normalizedPlayerName(otherName);
  if (!name || isFriendName(user, name)) {
    return false;
  }
  user.friends = [...(user.friends || []), name];
  user.friends = normalizePlayerNameList(user.friends, user.name);
  return true;
}

function isBlockedFriendName(user, otherName) {
  const key = normalizedPlayerNameKey(otherName);
  return (user.blockedFriends || []).some(name => normalizedPlayerNameKey(name) === key);
}

function toggleBlockedFriendName(user, otherName) {
  const name = normalizedPlayerName(otherName);
  if (!name) {
    return false;
  }
  if (!Array.isArray(user.blockedFriends)) {
    user.blockedFriends = [];
  }
  if (isBlockedFriendName(user, name)) {
    user.blockedFriends = user.blockedFriends.filter(item => normalizedPlayerNameKey(item) !== normalizedPlayerNameKey(name));
  } else {
    user.blockedFriends = [...user.blockedFriends, name];
  }
  user.blockedFriends = normalizePlayerNameList(user.blockedFriends, user.name);
  return true;
}

function pushSystemMessage(userOrProfile, message) {
  if (!userOrProfile) {
    return;
  }
  const nextMessage = {
    id: nextSystemMessageId++,
    type: String(message?.type || 'notice'),
    text: String(message?.text || '').trim(),
    createdAt: new Date().toISOString(),
    read: message?.read === true,
    meta: message?.meta && typeof message.meta === 'object' ? message.meta : {}
  };
  if (!nextMessage.text) {
    return;
  }
  const list = Array.isArray(userOrProfile.systemMessages) ? userOrProfile.systemMessages : [];
  list.push(nextMessage);
  userOrProfile.systemMessages = normalizeSystemMessages(list);
}

function findOnlineUserByName(name) {
  const key = normalizedPlayerNameKey(name);
  if (!key) {
    return null;
  }
  for (const user of clients.values()) {
    if (normalizedPlayerNameKey(user.name) === key) {
      return user;
    }
  }
  return null;
}

function defaultRoomSettings() {
  return {
    defaultAccess: 'allow',
    whitelist: [],
    blacklist: []
  };
}

function normalizePlayerNameList(list, selfName) {
  if (!Array.isArray(list)) {
    return [];
  }
  const selfKey = normalizedPlayerNameKey(selfName);
  const seen = new Set();
  const normalized = [];
  for (const item of list) {
    const name = normalizedPlayerName(item);
    if (!name) {
      continue;
    }
    const key = normalizedPlayerNameKey(name);
    if (!key || key === selfKey || seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(name);
  }
  return normalized;
}

function normalizeRoomSettings(payload, ownerName) {
  const base = defaultRoomSettings();
  base.defaultAccess = payload?.defaultAccess === 'deny' ? 'deny' : 'allow';
  base.whitelist = normalizePlayerNameList(payload?.whitelist, ownerName);
  const whitelistKeys = new Set(base.whitelist.map(name => normalizedPlayerNameKey(name)));
  base.blacklist = normalizePlayerNameList(payload?.blacklist, ownerName)
    .filter(name => !whitelistKeys.has(normalizedPlayerNameKey(name)));
  return base;
}

function canEnterOwnedRoom(visitor, owner) {
  if (!visitor || !owner) {
    return true;
  }
  if (owner.id && visitor.id === owner.id) {
    return true;
  }
  if (normalizedPlayerNameKey(visitor.name) === normalizedPlayerNameKey(owner.name)) {
    return true;
  }
  const settings = normalizeRoomSettings(owner.roomSettings, owner.name);
  const visitorKey = normalizedPlayerNameKey(visitor.name);
  const isListed = list => list.some(name => normalizedPlayerNameKey(name) === visitorKey);
  if (isListed(settings.blacklist)) {
    return false;
  }
  if (isListed(settings.whitelist)) {
    return true;
  }
  return settings.defaultAccess !== 'deny';
}

function areaUsers(areaId, excludeUserId = null) {
  const users = [...clients.values()]
    .filter(u => u.areaId === areaId && u.id !== excludeUserId)
    .map(u => ({ id: u.id, name: u.name }));

  try {
    for (const agent of AGENT_ASSIGNMENTS) {
      const locationRoomId = String(agent?.location?.roomId || '');
      if (!locationRoomId.startsWith(`${areaId}__`)) {
        continue;
      }
      const exists = users.some(u => normalizedPlayerNameKey(u.name) === normalizedPlayerNameKey(agent.name) || String(u.id) === String(agent.id));
      if (!exists) {
        users.unshift({ id: agent.id, name: agent.name });
      }
    }
  } catch (_e) {
    // ignore
  }

  return users;
}

function historyFilePath(playerName, areaId, roomId) {
  const playerDir = path.join(PLAYER_CHAT_HISTORY_DIR, encodeURIComponent(normalizedPlayerNameKey(playerName)));
  const fileName = `${encodeURIComponent(areaId)}__${encodeURIComponent(roomId)}.jsonl`;
  return path.join(playerDir, fileName);
}

function isWithinRetention(timestamp) {
  const time = Date.parse(timestamp);
  if (Number.isNaN(time)) {
    return false;
  }
  return Date.now() - time <= HISTORY_RETENTION_MS;
}

function filterRecentMessages(messages) {
  return (messages || []).filter(message => isWithinRetention(message.timestamp));
}

function historyMapKey(playerName, areaId, roomId) {
  return `${normalizedPlayerNameKey(playerName)}|${areaId}|${roomId}`;
}

function loadPlayerRoomHistory(playerName, areaId, roomId) {
  const fullPath = historyFilePath(playerName, areaId, roomId);
  try {
    if (!fs.existsSync(fullPath)) {
      return [];
    }
    const raw = fs.readFileSync(fullPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const records = [];
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (!record?.areaId || !record?.roomId || !isWithinRetention(record.timestamp)) {
          continue;
        }
        records.push(record);
      } catch (_err) {
        // Ignore malformed line.
      }
    }
    return filterRecentMessages(records).slice(-CHAT_HISTORY_LIMIT);
  } catch (_err) {
    return [];
  }
}

function getPlayerRoomHistory(playerName, areaId, roomId) {
  const key = historyMapKey(playerName, areaId, roomId);
  if (!playerRoomHistory.has(key)) {
    playerRoomHistory.set(key, loadPlayerRoomHistory(playerName, areaId, roomId));
  }
  return playerRoomHistory.get(key) || [];
}

async function saveHistoryToCloud(playerName, record) {
  try {
    await fsp.mkdir(path.dirname(historyFilePath(playerName, record.areaId, record.roomId)), { recursive: true });
    await fsp.appendFile(historyFilePath(playerName, record.areaId, record.roomId), `${JSON.stringify(record)}\n`, 'utf8');
  } catch (_err) {
    // Ignore cloud history save failures.
  }
}

function appendHistoryForUser(user, record) {
  const key = historyMapKey(user.name, record.areaId, record.roomId);
  const list = getPlayerRoomHistory(user.name, record.areaId, record.roomId);
  list.push(record);
  playerRoomHistory.set(key, filterRecentMessages(list).slice(-CHAT_HISTORY_LIMIT));
  void saveHistoryToCloud(user.name, record);
}

function sendHistory(user) {
  if (!user?.ws || user.ws.readyState !== 1 || !user.areaId || !user.roomId) {
    return;
  }
  if (!user.restoreHistory) {
    send(user.ws, 'chat-history', { messages: [] });
    return;
  }
  void fsp.mkdir(path.dirname(historyFilePath(user.name, user.areaId, user.roomId)), { recursive: true });
  const recentMessages = getPlayerRoomHistory(user.name, user.areaId, user.roomId);
  send(user.ws, 'chat-history', { messages: recentMessages });
}

async function clearUserHistory(playerName) {
  const prefix = `${normalizedPlayerNameKey(playerName)}|`;
  for (const key of playerRoomHistory.keys()) {
    if (key.startsWith(prefix)) {
      playerRoomHistory.delete(key);
    }
  }
  try {
    await fsp.rm(path.join(PLAYER_CHAT_HISTORY_DIR, encodeURIComponent(normalizedPlayerNameKey(playerName))), {
      recursive: true,
      force: true
    });
  } catch (_err) {
    // Ignore user history clear failures.
  }
}

loadPlayerProfiles();

app.use('/textures', express.static(path.join(__dirname, 'textures')));
app.use('/sound', express.static(path.join(__dirname, 'sound')));

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

app.get('/api/layout', (_req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const floors = Array.from({ length: FLOOR_COUNT }, (_v, i) => i + 1);
  const lobbies = [
    { id: 'lobby-1', name: `${TEXT.lobby} 1`, capacity: LOBBY_CAPACITY },
    { id: 'lobby-2', name: `${TEXT.lobby} 2`, capacity: LOBBY_CAPACITY }
  ];
  res.json({
    floors,
    lobbies,
    residentCapacity: RESIDENT_CAPACITY,
    visitorCapacity: VISITOR_CAPACITY,
    lobbyCapacity: LOBBY_CAPACITY,
    stairsOffsetX: CLIENT_STAIRS_OFFSET_X,
    communitySpaceOffsetX: CLIENT_COMMUNITY_SPACE_OFFSET_X,
    communitySpaceRoomId: 'community-space',
    dome: {
      id: DOME_101_ID,
      name: DOME_101_NAME,
      floor: DOME_101_FLOOR,
      roomId: DOME_101_ROOM_ID,
      capacity: DOME_101_CAPACITY,
      requiresItem: STAR_TICKET_ID
    },
    wallpapers: WALLPAPER_PRESETS,
    defaultWallpaper: DEFAULT_WALLPAPER_ID
  });
});

function parseArea(areaId) {
  if (areaId === DOME_101_ID) {
    return { type: 'dome', id: areaId, floor: DOME_101_FLOOR };
  }
  if (areaId === 'lobby-1' || areaId === 'lobby-2') {
    return { type: 'lobby', id: areaId };
  }
  const match = /^floor-(\d+)$/.exec(areaId);
  if (!match) {
    return null;
  }
  const floor = Number(match[1]);
  if (floor < 1 || floor > FLOOR_COUNT) {
    return null;
  }
  return { type: 'floor', id: areaId, floor };
}
function send(ws, type, payload) {
  ws.send(JSON.stringify({ type, payload }));
}

function effectiveRoleOnArea(user, area) {
  if (area.type !== 'floor') {
    return 'visitor';
  }
  if (user.role === 'resident' && user.homeFloor === area.floor) {
    return 'resident';
  }
  return 'visitor';
}

function isDoorplateUsedOnHomeFloor(user, targetArea) {
  return !!roomOwner(targetArea.floor, user.doorplate, user.id, user.name);
}

function roomOwner(floor, doorplate, excludeUserId = null, excludeName = null) {
  const excludedNameKey = normalizedPlayerNameKey(excludeName);
  const roomKey = `floor-${floor}__room-${doorplate}`;
  const claimed = ROOM_CLAIMS[roomKey];
  if (claimed && claimed.claimedBy) {
    const claimedAgent = getAgentConfigById(claimed.claimedBy);
    if (!(excludeUserId !== null && String(excludeUserId) === String(claimedAgent.id))
      && !(excludedNameKey && normalizedPlayerNameKey(claimedAgent.name) === excludedNameKey)) {
      return {
        id: claimedAgent.id,
        name: String(claimed.doorplateLabel || claimedAgent.name),
        role: 'agent',
        homeFloor: floor,
        doorplate,
        roomSettings: defaultRoomSettings(),
        wallpaper: DEFAULT_WALLPAPER_ID,
        avatar: claimedAgent.avatar
      };
    }
  }

  for (const user of clients.values()) {
    if (excludeUserId !== null && user.id === excludeUserId) {
      continue;
    }
    if (excludedNameKey && normalizedPlayerNameKey(user.name) === excludedNameKey) {
      continue;
    }
    if (user.role === 'resident' && user.homeFloor === floor && user.doorplate === doorplate) {
      return user;
    }
  }

  for (const [key, profile] of playerProfiles.entries()) {
    if (excludedNameKey && key === excludedNameKey) {
      continue;
    }
    if (profile.role === 'resident' && profile.homeFloor === floor && profile.doorplate === doorplate) {
      return {
        id: null,
        name: profile.name,
        role: profile.role,
        homeFloor: profile.homeFloor,
        doorplate: profile.doorplate,
        wallpaper: normalizeWallpaperId(profile.wallpaper),
        roomSettings: normalizeRoomSettings(profile.roomSettings, profile.name)
      };
    }
  }
  return null;
}

// 计算玩家当前所在房间的墙纸 id
function currentRoomWallpaper(user) {
  if (!user) {
    return DEFAULT_WALLPAPER_ID;
  }
  const area = parseArea(user.areaId);
  if (!area || area.type !== 'floor') {
    return DEFAULT_WALLPAPER_ID;
  }
  const match = /^room-(\d+)$/.exec(user.roomId || '');
  if (!match) {
    return DEFAULT_WALLPAPER_ID;
  }
  const owner = roomOwner(area.floor, Number(match[1]));
  if (!owner) {
    return DEFAULT_WALLPAPER_ID;
  }
  return normalizeWallpaperId(owner.wallpaper);
}

function floorCounts(floor, excludeUserId = null) {
  const residentOwners = new Set();
  let visitorCount = 0;

  for (const profile of playerProfiles.values()) {
    if (profile.role === 'resident' && profile.homeFloor === floor && profile.doorplate) {
      residentOwners.add(normalizedPlayerNameKey(profile.name));
    }
  }

  for (const other of clients.values()) {
    if (excludeUserId !== null && other.id === excludeUserId) {
      continue;
    }

    const area = parseArea(other.areaId);
    if (!area || area.type !== 'floor' || area.floor !== floor) {
      continue;
    }

    const isResidentOfThisFloor = other.role === 'resident' && other.homeFloor === floor;
    if (!isResidentOfThisFloor) {
      visitorCount += 1;
    }
  }

  return { residentCount: residentOwners.size, visitorCount };
}

function canEnterArea(user, targetArea) {
  if (targetArea.type === 'dome') {
    const hasTicket = (user.inventory || []).some(item =>
      String(item.id) === STAR_TICKET_ID && Number(item.qty) > 0
    );

    if (!hasTicket) {
      return { ok: false, reason: TEXT.domeTicketRequired };
    }

    const currentCount = [...clients.values()]
      .filter(u => u.areaId === targetArea.id && u.id !== user.id)
      .length;

    if (currentCount >= DOME_101_CAPACITY) {
      return {
        ok: false,
        reason: `${TEXT.domeFull} ${DOME_101_CAPACITY} ${TEXT.personUnit}`
      };
    }

    return { ok: true };
  }

  if (targetArea.type === 'lobby') {
    const currentCount = [...clients.values()].filter(u => u.areaId === targetArea.id && u.id !== user.id).length;
    if (currentCount >= LOBBY_CAPACITY) {
      return { ok: false, reason: `${TEXT.lobbyFull} ${LOBBY_CAPACITY} ${TEXT.personUnit}` };
    }
    return { ok: true };
  }

  const { residentCount, visitorCount } = floorCounts(targetArea.floor, user.id);

  const selfRole = effectiveRoleOnArea(user, targetArea);
  if (selfRole === 'resident') {
    if (residentCount >= RESIDENT_CAPACITY) {
      return { ok: false, reason: `${TEXT.floorResidentFull} ${RESIDENT_CAPACITY} ${TEXT.personUnit}` };
    }
    if (isDoorplateUsedOnHomeFloor(user, targetArea)) {
      return { ok: false, reason: TEXT.doorplateUsed };
    }
  } else if (visitorCount >= VISITOR_CAPACITY) {
    return { ok: false, reason: `${TEXT.floorVisitorFull} ${VISITOR_CAPACITY} ${TEXT.personUnit}` };
  }

  return { ok: true };
}

function currentRoomUsers(areaId, roomId) {
  const users = [...clients.values()]
    .filter(u => u.areaId === areaId && u.roomId === roomId)
    .map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      homeFloor: u.homeFloor,
      doorplate: u.doorplate,
      posX: Number.isFinite(u.posX) ? u.posX : null,
      posY: Number.isFinite(u.posY) ? u.posY : null,
      avatar: u.avatar || null
    }));

  const locationKey = `${areaId}__${roomId}`;
  for (const agent of AGENT_ASSIGNMENTS) {
    if (String(agent?.location?.roomId || '') !== locationKey) {
      continue;
    }
    const exists = users.some(u => String(u.id) === String(agent.id));
    if (exists) {
      continue;
    }
    users.unshift({
      id: agent.id,
      name: agent.name,
      role: 'agent',
      homeFloor: Number.isInteger(agent.location?.floor) ? agent.location.floor : null,
      doorplate: null,
      posX: Number.isFinite(agent.location?.posX) ? Number(agent.location.posX) : null,
      posY: Number.isFinite(agent.location?.posY) ? Number(agent.location.posY) : null,
      avatar: String(agent.avatar || '/textures/agent_robot.webp')
    });
  }

  return users;
}

function broadcastRoomUsers(areaId, roomId) {
  const roomUsers = currentRoomUsers(areaId, roomId);
  for (const user of clients.values()) {
    if (user.areaId === areaId && user.roomId === roomId && user.ws.readyState === 1) {
      send(user.ws, 'room-users', { roomUsers });
    }
  }
}

function floorDirectory(floor) {
  const directory = [];
  for (let doorplate = 1; doorplate <= RESIDENT_CAPACITY; doorplate += 1) {
    const owner = roomOwner(floor, doorplate);
    directory.push({
      doorplate,
      ownerName: owner ? owner.name : null
    });
  }
  return directory;
}

function canTeleportToUserRoom(user, targetUser) {
  if (!user || !targetUser || !targetUser.areaId || !targetUser.roomId) {
    return { ok: false, reason: TEXT.invalidTargetPlayer };
  }
  const area = parseArea(targetUser.areaId);
  if (!area) {
    return { ok: false, reason: TEXT.invalidArea };
  }
  const access = canEnterArea(user, area);
  if (!access.ok) {
    return { ok: false, reason: access.reason };
  }
  const roomMatch = /^room-(\d+)$/.exec(targetUser.roomId || '');
  if (roomMatch && area.type === 'floor') {
    const owner = roomOwner(area.floor, Number(roomMatch[1]));
    if (owner && !canEnterOwnedRoom(user, owner)) {
      return { ok: false, reason: TEXT.teleportDenied };
    }
  }
  return { ok: true };
}

function onlineFriendLocationsForUser(user) {
  const list = [];
  for (const friendName of user.friends || []) {
    const onlineFriend = findOnlineUserByName(friendName);
    if (!onlineFriend || onlineFriend.id === user.id) {
      continue;
    }
    const check = canTeleportToUserRoom(user, onlineFriend);
    list.push({
      name: onlineFriend.name,
      areaId: onlineFriend.areaId,
      roomId: onlineFriend.roomId,
      canTeleport: check.ok,
      reason: check.ok ? null : check.reason
    });
  }
  return list;
}

function pushStateForUser(user) {
  if (!user.ws || user.ws.readyState !== 1) {
    return;
  }
  const area = parseArea(user.areaId);
  const roomUsers = currentRoomUsers(user.areaId, user.roomId);
  const roomFurnishings = [];
  const seenInstance = new Set();
  if (user.areaId && user.roomId) {
    for (const other of clients.values()) {
      if (!Array.isArray(other.furnishings)) continue;
      for (const f of other.furnishings) {
        if (f && f.areaId === user.areaId && f.roomId === user.roomId && !seenInstance.has(String(f.instanceId))) {
          seenInstance.add(String(f.instanceId));
          roomFurnishings.push({ ...f, ownerName: other.name });
        }
      }
    }
    for (const profile of playerProfiles.values()) {
      if (!Array.isArray(profile.furnishings)) continue;
      for (const f of profile.furnishings) {
        if (f && f.areaId === user.areaId && f.roomId === user.roomId && !seenInstance.has(String(f.instanceId))) {
          seenInstance.add(String(f.instanceId));
          roomFurnishings.push({ ...f, ownerName: profile.name });
        }
      }
    }
  }

  send(user.ws, 'state', {
    areaId: user.areaId,
    roomId: user.roomId,
    areaType: area?.type,
    roomUsers,
    canChooseRoom: area?.type === 'floor',
    floor: area?.floor ?? null,
    floorDirectory: area?.type === 'floor' ? floorDirectory(area.floor) : [],
    areaUsers: areaUsers(user.areaId, user.id),
    friends: normalizePlayerNameList(user.friends, user.name),
    blockedFriends: normalizePlayerNameList(user.blockedFriends, user.name),
    visitedFloors: normalizeVisitedFloors(user.visitedFloors),
    systemMessages: normalizeSystemMessages(user.systemMessages).slice(-60),
    unreadSystemMessageCount: unreadSystemMessageCount(user),
    onlineFriends: onlineFriendLocationsForUser(user),
    myRoomSettings: normalizeRoomSettings(user.roomSettings, user.name),
    inventory: normalizeInventory(user.inventory).map(it => ({
      id: it.id,
      name: it.name,
      qty: it.qty,
      placeable: ITEM_DEFINITIONS.get(it.id)?.placeable === true,
      consumable: ITEM_DEFINITIONS.get(it.id)?.consumable !== false
    })),
    roomFurnishings,
    ownedRoom: user.role === 'resident' && user.homeFloor && user.doorplate
      ? { floor: user.homeFloor, roomId: `room-${user.doorplate}` }
      : null,
    myWallpaper: normalizeWallpaperId(user.wallpaper),
    roomWallpaper: currentRoomWallpaper(user)
  });
}

function pushStateForLocation(areaId, _roomId) {
  for (const user of clients.values()) {
    if (user.areaId === areaId) {
      pushStateForUser(user);
    }
  }
}

function notifyRoom(areaId, roomId, text, sender = TEXT.system) {
  const message = {
    areaId,
    roomId,
    sender,
    text,
    timestamp: new Date().toISOString()
  };

  for (const user of clients.values()) {
    if (user.areaId === areaId && user.roomId === roomId && user.ws.readyState === 1) {
      appendHistoryForUser(user, message);
      send(user.ws, 'chat', message);
    }
  }
}

function markVisitedFloor(user, areaId) {
  const area = parseArea(areaId);
  if (!area || area.type !== 'floor') {
    return;
  }
  const floor = area.floor;
  if (!Array.isArray(user.visitedFloors)) {
    user.visitedFloors = [];
  }
  if (!user.visitedFloors.includes(floor)) {
    user.visitedFloors.push(floor);
    user.visitedFloors = normalizeVisitedFloors(user.visitedFloors);
    upsertPlayerProfileFromUser(user);
  }
}

function moveUser(user, newAreaId, newRoomId) {
  const oldAreaId = user.areaId;
  const oldRoomId = user.roomId;
  user.areaId = newAreaId;
  user.roomId = newRoomId;
  user.posX = null;
  user.posY = null;
  markVisitedFloor(user, newAreaId);

  if (oldAreaId && oldRoomId) {
    notifyRoom(oldAreaId, oldRoomId, `${user.name} ${TEXT.leave}`);
    pushStateForLocation(oldAreaId, oldRoomId);
  }

  notifyRoom(newAreaId, newRoomId, `${user.name} ${TEXT.enter}`);
  pushStateForLocation(newAreaId, newRoomId);
  broadcastRoomUsers(newAreaId, newRoomId);
  pushStateForUser(user);
  pushStateForAllOnlineUsers();
  sendHistory(user);
}

function handleJoin(ws, payload) {
  // ★ 关键：必须先完成登录 / 注册，且用服务端保存的用户名，避免冒名
  const authedName = ws.authenticatedUsername;
  if (!authedName) {
    send(ws, 'error', { message: TEXT.needAuth });
    return;
  }

  const name = authedName;
  const requestedRole = payload?.role === 'resident' ? 'resident' : 'visitor';
  const areaId = String(payload?.areaId || '').trim();
  const area = parseArea(areaId);
  const existingProfile = getPlayerProfileByName(name);

  if (!area) {
    send(ws, 'error', { message: TEXT.invalidArea });
    return;
  }

  // 如果这个 ws 之前已经 join 过，先清理掉旧连接
  const oldUser = clients.get(ws);
  if (oldUser) {
    upsertPlayerProfileFromUser(oldUser);
    clients.delete(ws);
  }

  const user = {
    id: nextUserId++,
    ws,
    name,
    role: existingProfile?.role === 'resident' ? 'resident' : requestedRole,
    restoreHistory: payload?.restoreHistory !== false,
    homeFloor: existingProfile?.role === 'resident' ? existingProfile.homeFloor : null,
    doorplate: existingProfile?.role === 'resident' ? existingProfile.doorplate : null,
    wallpaper: normalizeWallpaperId(existingProfile?.wallpaper),
    roomSettings: normalizeRoomSettings(existingProfile?.roomSettings, name),
    friends: normalizePlayerNameList(existingProfile?.friends, name),
    blockedFriends: normalizePlayerNameList(existingProfile?.blockedFriends, name),
    visitedFloors: normalizeVisitedFloors(existingProfile?.visitedFloors),
    systemMessages: normalizeSystemMessages(existingProfile?.systemMessages),
    inventory: normalizeInventory(existingProfile?.inventory),
    furnishings: normalizeFurnishings(existingProfile?.furnishings),
    areaId: null,
    roomId: null,
    posX: null,
    posY: null
  };
  normalizeUserSocialState(user);

  if (!Array.isArray(user.inventory) || user.inventory.length === 0) {
    user.inventory = [{ id: 'sample-1', name: '示例物品1', qty: 1 }];
  }

  if (user.role === 'resident' && (!user.homeFloor || !user.doorplate)) {
    const homeFloor = Number(payload?.homeFloor);
    const doorplate = Number(payload?.doorplate);
    if (!Number.isInteger(homeFloor) || homeFloor < 1 || homeFloor > FLOOR_COUNT) {
      send(ws, 'error', { message: `${TEXT.residentFloorRange} 1-${FLOOR_COUNT}` });
      return;
    }
    if (!Number.isInteger(doorplate) || doorplate < 1 || doorplate > RESIDENT_CAPACITY) {
      send(ws, 'error', { message: `${TEXT.doorplateRange} 1-${RESIDENT_CAPACITY}` });
      return;
    }
    user.homeFloor = homeFloor;
    user.doorplate = doorplate;
  }

  if (user.role === 'resident') {
    if (!Number.isInteger(user.homeFloor) || !Number.isInteger(user.doorplate)) {
      send(ws, 'error', { message: TEXT.invalidRoom });
      return;
    }
    if (roomOwner(user.homeFloor, user.doorplate, user.id, user.name)) {
      send(ws, 'error', { message: TEXT.doorplateUsed });
      return;
    }
    if (!existingProfile) {
      const { residentCount } = floorCounts(user.homeFloor);
      if (residentCount >= RESIDENT_CAPACITY) {
        send(ws, 'error', { message: `${TEXT.floorResidentFull} ${RESIDENT_CAPACITY} ${TEXT.personUnit}` });
        return;
      }
    }
  }

  const access = canEnterArea(user, area);
  if (!access.ok) {
    send(ws, 'error', { message: access.reason });
    return;
  }

  clients.set(ws, user);
  upsertPlayerProfileFromUser(user);
  const defaultRoom = area.type === 'floor' ? 'corridor' : 'main';
  moveUser(user, area.id, defaultRoom);

  send(ws, 'joined', {
    id: user.id,
    name: user.name,
    role: user.role,
    homeFloor: user.homeFloor,
    doorplate: user.doorplate
  });
}

function handleSwitchArea(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }
  const area = parseArea(String(payload?.areaId || ''));
  if (!area) {
    send(ws, 'error', { message: TEXT.invalidArea });
    return;
  }

  const access = canEnterArea(user, area);
  if (!access.ok) {
    send(ws, 'error', { message: access.reason });
    return;
  }

  const defaultRoom = area.type === 'floor' ? 'corridor' : 'main';
  moveUser(user, area.id, defaultRoom);
}

function handleEnterRoom(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }
  const area = parseArea(user.areaId);
  if (!area || area.type !== 'floor') {
    send(ws, 'error', { message: TEXT.lobbyNoRoom });
    return;
  }

  const roomId = String(payload?.roomId || '');
  if (roomId === 'corridor') {
    moveUser(user, user.areaId, 'corridor');
    return;
  }

  if (roomId === 'community-space') {
    moveUser(user, user.areaId, roomId);
    return;
  }

  const match = /^room-(\d+)$/.exec(roomId);
  if (!match) {
    send(ws, 'error', { message: TEXT.invalidRoom });
    return;
  }

  const doorplate = Number(match[1]);
  if (doorplate < 1 || doorplate > RESIDENT_CAPACITY) {
    send(ws, 'error', { message: TEXT.invalidRoom });
    return;
  }

  const owner = roomOwner(area.floor, doorplate);
  if (owner && !canEnterOwnedRoom(user, owner)) {
    send(ws, 'error', { message: TEXT.roomAccessDenied });
    return;
  }

  moveUser(user, user.areaId, `room-${doorplate}`);
}

function handleClaimRoom(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }

  const area = parseArea(user.areaId);
  if (!area || area.type !== 'floor' || user.roomId !== 'corridor') {
    send(ws, 'error', { message: TEXT.floorOnlyAction });
    return;
  }

  const doorplate = Number(payload?.doorplate);
  if (!Number.isInteger(doorplate) || doorplate < 1 || doorplate > RESIDENT_CAPACITY) {
    send(ws, 'error', { message: TEXT.invalidRoom });
    return;
  }

  if (roomOwner(area.floor, doorplate, user.id, user.name)) {
    send(ws, 'error', { message: TEXT.emptyRoomRequired });
    return;
  }

  const alreadyOwnedSame = user.role === 'resident' && user.homeFloor === area.floor && user.doorplate === doorplate;
  if (alreadyOwnedSame) {
    moveUser(user, user.areaId, `room-${doorplate}`);
    send(ws, 'info', { message: TEXT.claimSuccess });
    return;
  }

  const { residentCount } = floorCounts(area.floor, user.id);
  if (residentCount >= RESIDENT_CAPACITY) {
    send(ws, 'error', { message: `${TEXT.floorResidentFull} ${RESIDENT_CAPACITY} ${TEXT.personUnit}` });
    return;
  }

  const hadRoomBefore = user.role === 'resident';
  user.role = 'resident';
  user.homeFloor = area.floor;
  user.doorplate = doorplate;
  user.roomSettings = normalizeRoomSettings(user.roomSettings, user.name);
  upsertPlayerProfileFromUser(user);

  moveUser(user, user.areaId, `room-${doorplate}`);
  send(ws, 'info', { message: hadRoomBefore ? TEXT.moveSuccess : TEXT.claimSuccess });
}

function handleUpdateRoomSettings(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }

  if (user.role !== 'resident' || !user.homeFloor || !user.doorplate) {
    send(ws, 'error', { message: TEXT.floorOnlyAction });
    return;
  }

  user.roomSettings = normalizeRoomSettings(payload, user.name);
  upsertPlayerProfileFromUser(user);
  pushStateForUser(user);
  send(ws, 'info', { message: TEXT.roomSettingsUpdated });
}

// 房主设置自己房间的墙纸
function handleSetWallpaper(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }

  if (user.role !== 'resident' || !user.homeFloor || !user.doorplate) {
    send(ws, 'error', { message: TEXT.wallpaperDenied });
    return;
  }

  const requested = String(payload?.wallpaperId || '').trim();
  if (!WALLPAPER_IDS.has(requested)) {
    send(ws, 'error', { message: TEXT.wallpaperDenied });
    return;
  }

  user.wallpaper = requested;
  upsertPlayerProfileFromUser(user);

  pushStateForFloor(user.homeFloor);
  send(ws, 'info', { message: TEXT.wallpaperUpdated });
}

function hasPendingFriendRequest(targetUser, requesterName) {
  const requesterKey = normalizedPlayerNameKey(requesterName);
  return (targetUser.systemMessages || []).some(message => {
    if (message.type !== 'friend-request' || message.meta?.status !== 'pending') {
      return false;
    }
    return normalizedPlayerNameKey(message.meta?.fromName) === requesterKey;
  });
}

function handleFriendRequest(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }

  const targetName = normalizedPlayerName(payload?.targetName);
  if (!targetName) {
    send(ws, 'error', { message: TEXT.invalidTargetPlayer });
    return;
  }

  if (normalizedPlayerNameKey(targetName) === normalizedPlayerNameKey(user.name)) {
    send(ws, 'error', { message: TEXT.cannotAddSelfFriend });
    return;
  }

  const targetOnline = findOnlineUserByName(targetName);
  const targetProfile = getPlayerProfileByName(targetName);
  if (!targetOnline && !targetProfile) {
    send(ws, 'error', { message: TEXT.invalidTargetPlayer });
    return;
  }
  const targetContext = targetOnline || targetProfile;
  if (isBlockedFriendName(user, targetContext.name) || isBlockedFriendName(targetContext, user.name)) {
    send(ws, 'error', { message: TEXT.friendBlocked });
    return;
  }
  if (isFriendName(user, targetContext.name) && isFriendName(targetContext, user.name)) {
    send(ws, 'error', { message: TEXT.alreadyFriend });
    return;
  }
  if (hasPendingFriendRequest(targetContext, user.name)) {
    send(ws, 'error', { message: TEXT.duplicateFriendRequest });
    return;
  }

  pushSystemMessage(targetContext, {
    type: 'friend-request',
    text: `${user.name} sent you a friend request.`,
    read: false,
    meta: {
      fromName: user.name,
      status: 'pending'
    }
  });

  pushSystemMessage(user, {
    type: 'notice',
    text: `Friend request sent to ${targetContext.name}.`,
    read: true,
    meta: { toName: targetContext.name }
  });

  if (targetOnline) {
    targetOnline.systemMessages = normalizeSystemMessages(targetContext.systemMessages);
    upsertPlayerProfileFromUser(targetOnline);
    pushStateForUser(targetOnline);
  } else {
    targetProfile.systemMessages = normalizeSystemMessages(targetContext.systemMessages);
  }

  upsertPlayerProfileFromUser(user);
  void persistPlayerProfiles();
  pushStateForUser(user);
  send(ws, 'info', { message: TEXT.friendRequestSent });
}

function handleFriendRequestAction(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }

  const messageId = Number(payload?.messageId);
  const action = payload?.action === 'approve' ? 'approve' : payload?.action === 'reject' ? 'reject' : null;
  if (!Number.isInteger(messageId) || !action) {
    send(ws, 'error', { message: TEXT.invalidFriendRequestAction });
    return;
  }

  const message = (user.systemMessages || []).find(item => item.id === messageId && item.type === 'friend-request');
  if (!message || message.meta?.status !== 'pending') {
    send(ws, 'error', { message: TEXT.invalidFriendRequestAction });
    return;
  }

  const requesterName = normalizedPlayerName(message.meta?.fromName);
  if (!requesterName) {
    send(ws, 'error', { message: TEXT.invalidFriendRequestAction });
    return;
  }

  message.meta = {
    ...(message.meta || {}),
    status: action === 'approve' ? 'approved' : 'rejected',
    handledAt: new Date().toISOString()
  };
  message.read = true;
  message.text = `${requesterName} friend request ${action === 'approve' ? 'approved' : 'rejected'}.`;

  const requesterOnline = findOnlineUserByName(requesterName);
  const requesterProfile = ensureProfileForName(requesterName);
  const requesterTarget = requesterOnline || requesterProfile;

  if (action === 'approve' && requesterTarget) {
    addFriendName(user, requesterTarget.name);
    addFriendName(requesterTarget, user.name);
  }

  if (requesterTarget) {
    pushSystemMessage(requesterTarget, {
      type: 'notice',
      text: `${user.name} ${action === 'approve' ? 'accepted' : 'rejected'} your friend request.`,
      read: false,
      meta: {
        fromName: user.name,
        requestId: messageId
      }
    });
  }

  if (requesterOnline) {
    requesterOnline.friends = normalizePlayerNameList(requesterTarget?.friends, requesterOnline.name);
    requesterOnline.systemMessages = normalizeSystemMessages(requesterTarget?.systemMessages);
    upsertPlayerProfileFromUser(requesterOnline);
    pushStateForUser(requesterOnline);
  } else if (requesterProfile) {
    requesterProfile.friends = normalizePlayerNameList(requesterTarget?.friends, requesterProfile.name);
    requesterProfile.systemMessages = normalizeSystemMessages(requesterTarget?.systemMessages);
  }

  normalizeUserSocialState(user);
  upsertPlayerProfileFromUser(user);
  void persistPlayerProfiles();
  pushStateForUser(user);
  send(ws, 'info', { message: TEXT.friendRequestHandled });
}

function handleFriendBlockToggle(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }

  const friendName = normalizedPlayerName(payload?.friendName);
  if (!friendName) {
    send(ws, 'error', { message: TEXT.invalidTargetPlayer });
    return;
  }

  if (!isFriendName(user, friendName)) {
    send(ws, 'error', { message: TEXT.notYourFriend });
    return;
  }

  const friendOnline = findOnlineUserByName(friendName);
  const friendProfile = ensureProfileForName(friendName);
  const friendTarget = friendOnline || friendProfile;
  if (!friendTarget) {
    send(ws, 'error', { message: TEXT.invalidTargetPlayer });
    return;
  }

  toggleBlockedFriendName(user, friendTarget.name);
  normalizeUserSocialState(user);
  upsertPlayerProfileFromUser(user);
  void persistPlayerProfiles();
  pushStateForUser(user);
  send(ws, 'info', { message: TEXT.friendBlockUpdated });
}

function handleTeleport(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }

  const kind = String(payload?.kind || '').trim();
  if (kind === 'floor') {
    const floor = Number(payload?.floor);
    if (!Number.isInteger(floor) || floor < 1 || floor > FLOOR_COUNT) {
      send(ws, 'error', { message: TEXT.invalidArea });
      return;
    }
    if (!(user.visitedFloors || []).includes(floor)) {
      send(ws, 'error', { message: TEXT.notVisitedFloor });
      return;
    }
    const area = parseArea(`floor-${floor}`);
    const access = canEnterArea(user, area);
    if (!access.ok) {
      send(ws, 'error', { message: access.reason });
      return;
    }
    moveUser(user, area.id, 'corridor');
    send(ws, 'info', { message: TEXT.teleportSuccess });
    return;
  }

  if (kind === 'friend') {
    const friendName = normalizedPlayerName(payload?.friendName);
    if (!friendName) {
      send(ws, 'error', { message: TEXT.invalidTargetPlayer });
      return;
    }
    if (!isFriendName(user, friendName)) {
      send(ws, 'error', { message: TEXT.notYourFriend });
      return;
    }

    const target = findOnlineUserByName(friendName);
    if (!target) {
      send(ws, 'error', { message: TEXT.friendOffline });
      return;
    }

    if (isBlockedFriendName(user, target.name) || isBlockedFriendName(target, user.name)) {
      send(ws, 'error', { message: TEXT.friendBlocked });
      return;
    }

    const check = canTeleportToUserRoom(user, target);
    if (!check.ok) {
      send(ws, 'error', { message: check.reason || TEXT.teleportDenied });
      return;
    }

    moveUser(user, target.areaId, target.roomId);
    send(ws, 'info', { message: TEXT.teleportSuccess });
    return;
  }

  send(ws, 'error', { message: TEXT.teleportDenied });
}

function handleChat(ws, payload) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }
  const text = String(payload?.text || '').trim();
  if (!text || text.startsWith('#')) {
    return;
  }
  notifyRoom(user.areaId, user.roomId, text, user.name);
}

function handlePlayerMove(ws, payload) {
  const user = clients.get(ws);
  if (!user || !user.areaId || !user.roomId) {
    return;
  }

  const x = Number(payload?.x);
  const y = Number(payload?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return;
  }

  user.posX = x;
  user.posY = y;
  broadcastRoomUsers(user.areaId, user.roomId);
}

async function handleClearHistory(ws) {
  const user = clients.get(ws);
  if (!user) {
    send(ws, 'error', { message: TEXT.joinFirst });
    return;
  }

  await clearUserHistory(user.name);
  send(ws, 'chat-history', { messages: [] });
  send(ws, 'info', { message: TEXT.historyCleared });
}

wss.on('connection', ws => {
  send(ws, 'welcome', { message: TEXT.connected });

  ws.on('message', raw => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch (_err) {
      send(ws, 'error', { message: TEXT.badMessage });
      return;
    }

    const type = String(data?.type || '').trim().toLowerCase();
    const payload = data?.payload || {};

    // ★ 账号相关消息优先处理，未登录时不接受其它命令
    if (type === 'register') {
      handleRegister(ws, payload);
      return;
    }
    if (type === 'login') {
      handleLogin(ws, payload);
      return;
    }

    if (!ws.authenticatedUsername) {
      send(ws, 'error', { message: TEXT.needAuth });
      return;
    }

    if (type === 'join') {
      handleJoin(ws, payload);
    } else if (type === 'open-agent') {
      handleOpenAgent(ws, payload);
    } else if (type === 'agent-chat') {
      handleAgentChat(ws, payload);
    } else if (type === 'switch-area') {
      handleSwitchArea(ws, payload);
    } else if (type === 'enter-room') {
      handleEnterRoom(ws, payload);
    } else if (type === 'chat') {
      handleChat(ws, payload);
    } else if (type === 'claim-room' || type === 'claimroom' || type === 'claim_room' || type === 'apply-room') {
      handleClaimRoom(ws, payload);
    } else if (type === 'clear-history' || type === 'clearhistory' || type === 'clear_history') {
      void handleClearHistory(ws);
    } else if (type === 'player-move' || type === 'playermove' || type === 'player_move') {
      handlePlayerMove(ws, payload);
    } else if (type === 'my-room-settings' || type === 'my_room_settings' || type === 'update-room-settings') {
      handleUpdateRoomSettings(ws, payload);
    } else if (type === 'set-wallpaper' || type === 'set_wallpaper' || type === 'setwallpaper') {
      handleSetWallpaper(ws, payload);
    } else if (type === 'friend-request' || type === 'friend_request') {
      handleFriendRequest(ws, payload);
    } else if (type === 'friend-request-action' || type === 'friend_request_action') {
      handleFriendRequestAction(ws, payload);
    } else if (type === 'friend-block-toggle' || type === 'friend_block_toggle') {
      handleFriendBlockToggle(ws, payload);
    } else if (type === 'teleport') {
      handleTeleport(ws, payload);
    } else if (type === 'use-item' || type === 'use_item' || type === 'useitem') {
      handleUseItem(ws, payload);
    } else if (type === 'place-item' || type === 'place_item' || type === 'placeitem') {
      handlePlaceItem(ws, payload);
    } else {
      send(ws, 'error', { message: TEXT.unknownCommand });
    }
  });

  ws.on('close', () => {
    const user = clients.get(ws);
    if (!user) {
      return;
    }
    upsertPlayerProfileFromUser(user);
    clients.delete(ws);
    notifyRoom(user.areaId, user.roomId, `${user.name} ${TEXT.leave}`);
    broadcastRoomUsers(user.areaId, user.roomId);
    pushStateForLocation(user.areaId, user.roomId);
    pushStateForAllOnlineUsers();
  });
});

server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
