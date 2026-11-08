/**
 * HỆ THỐNG ĐỒNG BỘ THỜI GIAN THỰC CHO 40–50 NGƯỜI CHƠI (GameSync)
 * Ưu tiên 1: Firebase Realtime Database (chạy trên Vercel / GitHub Pages cho 50+ điện thoại)
 * Ưu tiên 2: Preview Server SSE Relay (chạy thử trực tiếp ngay trên môi trường Preview / LAN)
 * Ưu tiên 3: BroadcastChannel + localStorage (chạy thử đa tab trên cùng trình duyệt khi chưa gắn mạng)
 */
(function (global) {
  const STORAGE_FB_KEY = "dm_firebase_custom_cfg_v1";

  // Nén URL Firebase ngắn gọn để mã QR trên màn chiếu cực thoáng, quét siêu nhạy từ cuối lớp
  function encodeDbToken(dbUrl) {
    if (!dbUrl) return "";
    const clean = dbUrl.trim().replace(/\/+$/, "");
    let m = clean.match(/^https:\/\/([a-zA-Z0-9-]+)\.asia-southeast1\.firebasedatabase\.app$/i);
    if (m) return "se1:" + m[1];
    m = clean.match(/^https:\/\/([a-zA-Z0-9-]+)\.europe-west1\.firebasedatabase\.app$/i);
    if (m) return "ew1:" + m[1];
    m = clean.match(/^https:\/\/([a-zA-Z0-9-]+)\.firebasedatabase\.app$/i);
    if (m) return "fda:" + m[1];
    m = clean.match(/^https:\/\/([a-zA-Z0-9-]+)\.firebaseio\.com$/i);
    if (m) return "fio:" + m[1];
    return clean;
  }

  function decodeDbToken(token) {
    if (!token) return "";
    const t = token.trim();
    if (t.startsWith("se1:")) return `https://${t.slice(4)}.asia-southeast1.firebasedatabase.app`;
    if (t.startsWith("ew1:")) return `https://${t.slice(4)}.europe-west1.firebasedatabase.app`;
    if (t.startsWith("fda:")) return `https://${t.slice(4)}.firebasedatabase.app`;
    if (t.startsWith("fio:")) return `https://${t.slice(4)}.firebaseio.com`;
    if (/^https?:\/\//i.test(t)) return t.replace(/\/+$/, "");
    return "";
  }

  // Phân tích thông minh chuỗi người dùng dán (chấp nhận cả link đơn lẻ hoặc nguyên đoạn code firebaseConfig)
  function parseFirebaseInput(raw) {
    if (!raw || !String(raw).trim()) {
      return { ok: false, error: "Vui lòng dán đường dẫn Realtime Database URL." };
    }
    const text = String(raw).trim();

    // Trường hợp dán trực tiếp URL https://...
    const directUrlMatch = text.match(/https:\/\/[a-zA-Z0-9.-]+\.(?:firebasedatabase\.app|firebaseio\.com)/i);
    const apiKeyMatch = text.match(/apiKey\s*:\s*["']([^"']+)["']/);
    const projectIdMatch = text.match(/projectId\s*:\s*["']([^"']+)["']/);

    if (directUrlMatch) {
      return {
        ok: true,
        config: {
          databaseURL: directUrlMatch[0].replace(/\/+$/, ""),
          apiKey: apiKeyMatch ? apiKeyMatch[1] : "",
          projectId: projectIdMatch ? projectIdMatch[1] : ""
        }
      };
    }

    // Trường hợp dán firebaseConfig nhưng quên tạo Realtime Database (chỉ có projectId, thiếu databaseURL)
    if (projectIdMatch) {
      return {
        ok: false,
        missingDbUrl: true,
        projectId: projectIdMatch[1],
        error:
          `Bạn đã dán firebaseConfig của project "${projectIdMatch[1]}" nhưng chưa có dòng databaseURL! ` +
          `Hãy vào Firebase Console -> mục Build -> Realtime Database -> bấm "Create Database" (chọn Singapore + Start in test mode) rồi copy link https://...firebasedatabase.app dán vào đây nhé!`
      };
    }

    return {
      ok: false,
      error: "Không nhận diện được link Firebase. Link đúng có dạng: https://ten-project-default-rtdb.asia-southeast1.firebasedatabase.app"
    };
  }

  function resolveFirebaseConfig() {
    const params = new URLSearchParams(global.location.search);
    const urlToken = params.get("d") || params.get("db");
    if (urlToken) {
      const decoded = decodeDbToken(urlToken);
      if (decoded) {
        return { databaseURL: decoded, source: "qr_url" };
      }
    }

    try {
      const saved = localStorage.getItem(STORAGE_FB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.databaseURL) {
          return { ...parsed, source: "local_saved" };
        }
      }
    } catch (_) {}

    const cfg = global.GAME_CONFIG || {};
    if (cfg.FIREBASE_DATABASE_URL && cfg.FIREBASE_DATABASE_URL.trim()) {
      const parsed = parseFirebaseInput(cfg.FIREBASE_DATABASE_URL);
      if (parsed.ok) {
        return {
          databaseURL: parsed.config.databaseURL,
          apiKey: cfg.FIREBASE_API_KEY || parsed.config.apiKey || "",
          projectId: cfg.FIREBASE_PROJECT_ID || parsed.config.projectId || "",
          source: "config_js"
        };
      }
    }

    return null;
  }

  // =========================================================================
  // ADAPTER 1: FIREBASE REALTIME DATABASE (CHUẨN LỚP HỌC 50+ NGƯỜI)
  // =========================================================================
  async function createFirebaseAdapter(fbCfg) {
    const appMod = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
    const dbMod = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js");

    const appName = "dm_app_" + btoa(fbCfg.databaseURL).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
    const existing = appMod.getApps().find((a) => a.name === appName);
    const initOpts = { databaseURL: fbCfg.databaseURL };
    if (fbCfg.apiKey) initOpts.apiKey = fbCfg.apiKey;
    if (fbCfg.projectId) initOpts.projectId = fbCfg.projectId;

    const app = existing || appMod.initializeApp(initOpts, appName);
    const db = dbMod.getDatabase(app);

    let serverOffset = 0;
    let connected = false;
    const connListeners = new Set();

    dbMod.onValue(dbMod.ref(db, ".info/serverTimeOffset"), (snap) => {
      const v = snap.val();
      if (typeof v === "number") serverOffset = v;
    });

    dbMod.onValue(dbMod.ref(db, ".info/connected"), (snap) => {
      connected = !!snap.val();
      connListeners.forEach((cb) => cb(connected));
    });

    return {
      mode: "firebase",
      modeLabel: "Firebase Cloud (Sẵn sàng 50+ máy)",
      databaseURL: fbCfg.databaseURL,
      source: fbCfg.source,
      now() {
        return Date.now() + serverOffset;
      },
      onConnectionChange(cb) {
        connListeners.add(cb);
        cb(connected);
        return () => connListeners.delete(cb);
      },
      async testWrite(roomCode) {
        const pingRef = dbMod.ref(db, `rooms/${roomCode}/_ping`);
        await dbMod.set(pingRef, { t: Date.now() });
        return true;
      },
      async getRoomSnapshot(roomCode) {
        const [stSnap, plSnap, scSnap] = await Promise.all([
          dbMod.get(dbMod.ref(db, `rooms/${roomCode}/state`)),
          dbMod.get(dbMod.ref(db, `rooms/${roomCode}/players`)),
          dbMod.get(dbMod.ref(db, `rooms/${roomCode}/scores`))
        ]);
        return {
          state: stSnap.val() || null,
          players: plSnap.val() || {},
          scores: scSnap.val() || {}
        };
      },
      subscribeState(roomCode, cb) {
        const r = dbMod.ref(db, `rooms/${roomCode}/state`);
        return dbMod.onValue(r, (snap) => cb(snap.val() || null));
      },
      subscribePlayers(roomCode, cb) {
        const r = dbMod.ref(db, `rooms/${roomCode}/players`);
        return dbMod.onValue(r, (snap) => cb(snap.val() || {}));
      },
      subscribeScores(roomCode, cb) {
        const r = dbMod.ref(db, `rooms/${roomCode}/scores`);
        return dbMod.onValue(r, (snap) => cb(snap.val() || {}));
      },
      subscribeMyScore(roomCode, playerId, cb) {
        const r = dbMod.ref(db, `rooms/${roomCode}/scores/${playerId}`);
        return dbMod.onValue(r, (snap) => cb(snap.val() || null));
      },
      subscribeMyPlayer(roomCode, playerId, cb) {
        const r = dbMod.ref(db, `rooms/${roomCode}/players/${playerId}`);
        return dbMod.onValue(r, (snap) => cb(snap.val() || null));
      },
      subscribeSubmissions(roomCode, roundIndex, cb) {
        const r = dbMod.ref(db, `rooms/${roomCode}/submissions/${roundIndex}`);
        return dbMod.onValue(r, (snap) => cb(snap.val() || {}));
      },
      async setState(roomCode, stateObj) {
        await dbMod.set(dbMod.ref(db, `rooms/${roomCode}/state`), stateObj);
      },
      async upsertPlayer(roomCode, player) {
        await dbMod.set(dbMod.ref(db, `rooms/${roomCode}/players/${player.id}`), player);
      },
      async upsertPlayersBatch(roomCode, playersMap) {
        await dbMod.update(dbMod.ref(db, `rooms/${roomCode}/players`), playersMap);
      },
      async removePlayer(roomCode, playerId) {
        await Promise.all([
          dbMod.remove(dbMod.ref(db, `rooms/${roomCode}/players/${playerId}`)),
          dbMod.remove(dbMod.ref(db, `rooms/${roomCode}/scores/${playerId}`))
        ]);
      },
      async clearBots(roomCode, botIds) {
        const updates = {};
        botIds.forEach((id) => {
          updates[`players/${id}`] = null;
          updates[`scores/${id}`] = null;
        });
        await dbMod.update(dbMod.ref(db, `rooms/${roomCode}`), updates);
      },
      async setScoresBatch(roomCode, scoresMap) {
        await dbMod.set(dbMod.ref(db, `rooms/${roomCode}/scores`), scoresMap);
      },
      async ensurePlayerScore(roomCode, playerId, initialScoreObj) {
        const r = dbMod.ref(db, `rooms/${roomCode}/scores/${playerId}`);
        const snap = await dbMod.get(r);
        if (!snap.exists()) {
          await dbMod.set(r, initialScoreObj);
        }
      },
      async submitAnswer(roomCode, roundIndex, playerId, payload) {
        await dbMod.set(dbMod.ref(db, `rooms/${roomCode}/submissions/${roundIndex}/${playerId}`), payload);
      },
      async submitAnswersBatch(roomCode, roundIndex, mapPayload) {
        await dbMod.update(dbMod.ref(db, `rooms/${roomCode}/submissions/${roundIndex}`), mapPayload);
      },
      async clearSubmissions(roomCode) {
        await dbMod.remove(dbMod.ref(db, `rooms/${roomCode}/submissions`));
      },
      async resetRoom(roomCode, keepPlayers = true) {
        if (keepPlayers) {
          await dbMod.remove(dbMod.ref(db, `rooms/${roomCode}/submissions`));
        } else {
          await dbMod.remove(dbMod.ref(db, `rooms/${roomCode}`));
        }
      }
    };
  }

  // =========================================================================
  // ADAPTER 2: PREVIEW RELAY (CHẠY THỬ TRỰC TIẾP TRÊN PREVIEW SERVER KHI CHƯA GẮN FIREBASE)
  // =========================================================================
  async function tryCreatePreviewRelayAdapter() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1200);
      const res = await fetch("/__preview_rtdb/ping", { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(timer);
      if (!res.ok) return null;
      const info = await res.json();
      if (!info || !info.ok) return null;

      let serverOffset = (info.serverNow || Date.now()) - Date.now();
      const roomCaches = {};
      const roomStreams = {};
      const connListeners = new Set();
      let isConnected = true;

      function ensureRoomStream(roomCode) {
        if (roomStreams[roomCode]) return roomCaches[roomCode];
        const cache = {
          state: null,
          players: {},
          scores: {},
          submissions: {},
          listeners: new Set()
        };
        roomCaches[roomCode] = cache;

        const notify = () => cache.listeners.forEach((fn) => fn(cache));

        const es = new EventSource(`/__preview_rtdb/stream?room=${encodeURIComponent(roomCode)}`);
        es.onopen = () => {
          isConnected = true;
          connListeners.forEach((cb) => cb(true));
        };
        es.onerror = () => {
          isConnected = false;
          connListeners.forEach((cb) => cb(false));
        };
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (data.serverNow) serverOffset = data.serverNow - Date.now();
            if (data.room) {
              cache.state = data.room.state || null;
              cache.players = data.room.players || {};
              cache.scores = data.room.scores || {};
              cache.submissions = data.room.submissions || {};
              notify();
            }
          } catch (_) {}
        };
        roomStreams[roomCode] = es;
        return cache;
      }

      async function sendOp(roomCode, op, payload) {
        const r = await fetch("/__preview_rtdb/op", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode, op, payload })
        });
        return r.json();
      }

      return {
        mode: "preview_relay",
        modeLabel: "Máy chủ Chạy thử Trực tiếp (Hãy gắn Firebase trước khi lên Vercel)",
        databaseURL: "",
        source: "preview_server",
        now() {
          return Date.now() + serverOffset;
        },
        onConnectionChange(cb) {
          connListeners.add(cb);
          cb(isConnected);
          return () => connListeners.delete(cb);
        },
        async testWrite() {
          return true;
        },
        async getRoomSnapshot(roomCode) {
          const r = await fetch(`/__preview_rtdb/snapshot?room=${encodeURIComponent(roomCode)}`, { cache: "no-store" });
          const j = await r.json();
          const rm = (j && j.room) || {};
          return {
            state: rm.state || null,
            players: rm.players || {},
            scores: rm.scores || {}
          };
        },
        subscribeState(roomCode, cb) {
          const c = ensureRoomStream(roomCode);
          const fn = (room) => cb(room.state || null);
          c.listeners.add(fn);
          cb(c.state);
          return () => c.listeners.delete(fn);
        },
        subscribePlayers(roomCode, cb) {
          const c = ensureRoomStream(roomCode);
          const fn = (room) => cb(room.players || {});
          c.listeners.add(fn);
          cb(c.players);
          return () => c.listeners.delete(fn);
        },
        subscribeScores(roomCode, cb) {
          const c = ensureRoomStream(roomCode);
          const fn = (room) => cb(room.scores || {});
          c.listeners.add(fn);
          cb(c.scores);
          return () => c.listeners.delete(fn);
        },
        subscribeMyScore(roomCode, playerId, cb) {
          const c = ensureRoomStream(roomCode);
          const fn = (room) => cb((room.scores && room.scores[playerId]) || null);
          c.listeners.add(fn);
          cb((c.scores && c.scores[playerId]) || null);
          return () => c.listeners.delete(fn);
        },
        subscribeMyPlayer(roomCode, playerId, cb) {
          const c = ensureRoomStream(roomCode);
          const fn = (room) => cb((room.players && room.players[playerId]) || null);
          c.listeners.add(fn);
          cb((c.players && c.players[playerId]) || null);
          return () => c.listeners.delete(fn);
        },
        subscribeSubmissions(roomCode, roundIndex, cb) {
          const c = ensureRoomStream(roomCode);
          const fn = (room) => cb((room.submissions && room.submissions[roundIndex]) || {});
          c.listeners.add(fn);
          cb((c.submissions && c.submissions[roundIndex]) || {});
          return () => c.listeners.delete(fn);
        },
        async setState(roomCode, stateObj) {
          await sendOp(roomCode, "setState", stateObj);
        },
        async upsertPlayer(roomCode, player) {
          await sendOp(roomCode, "upsertPlayer", player);
        },
        async upsertPlayersBatch(roomCode, playersMap) {
          await sendOp(roomCode, "upsertPlayersBatch", playersMap);
        },
        async removePlayer(roomCode, playerId) {
          await sendOp(roomCode, "removePlayer", { playerId });
        },
        async clearBots(roomCode, botIds) {
          await sendOp(roomCode, "clearBots", { botIds });
        },
        async setScoresBatch(roomCode, scoresMap) {
          await sendOp(roomCode, "setScoresBatch", scoresMap);
        },
        async ensurePlayerScore(roomCode, playerId, initialScoreObj) {
          await sendOp(roomCode, "ensurePlayerScore", { playerId, initialScoreObj });
        },
        async submitAnswer(roomCode, roundIndex, playerId, payload) {
          await sendOp(roomCode, "submitAnswer", { roundIndex, playerId, payload });
        },
        async submitAnswersBatch(roomCode, roundIndex, mapPayload) {
          await sendOp(roomCode, "submitAnswersBatch", { roundIndex, mapPayload });
        },
        async clearSubmissions(roomCode) {
          await sendOp(roomCode, "clearSubmissions", {});
        },
        async resetRoom(roomCode, keepPlayers = true) {
          await sendOp(roomCode, "resetRoom", { keepPlayers });
        }
      };
    } catch (_) {
      return null;
    }
  }

  // =========================================================================
  // ADAPTER 3: LOCAL MULTI-TAB (KHI MỞ FILE TĨNH MÀ CHƯA GẮN FIREBASE)
  // =========================================================================
  function createLocalBroadcastAdapter() {
    const PREFIX = "dm_local_room_";
    const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("dm_local_bus") : null;
    const subs = new Set();

    function readRoom(roomCode) {
      try {
        const raw = localStorage.getItem(PREFIX + roomCode);
        if (raw) return JSON.parse(raw);
      } catch (_) {}
      return { state: null, players: {}, scores: {}, submissions: {} };
    }

    function writeRoom(roomCode, roomData) {
      try {
        localStorage.setItem(PREFIX + roomCode, JSON.stringify(roomData));
      } catch (_) {}
      if (bc) bc.postMessage({ roomCode });
      notify(roomCode);
    }

    function notify(roomCode) {
      const data = readRoom(roomCode);
      subs.forEach((s) => {
        if (s.roomCode === roomCode) s.fn(data);
      });
    }

    if (bc) {
      bc.onmessage = (e) => {
        if (e.data && e.data.roomCode) notify(e.data.roomCode);
      };
    }
    global.addEventListener("storage", (e) => {
      if (e.key && e.key.startsWith(PREFIX)) {
        notify(e.key.slice(PREFIX.length));
      }
    });

    function addSub(roomCode, fn) {
      const entry = { roomCode, fn };
      subs.add(entry);
      fn(readRoom(roomCode));
      return () => subs.delete(entry);
    }

    return {
      mode: "local",
      modeLabel: "Thử nghiệm nội bộ trên trình duyệt (Cần gắn Firebase để 50 điện thoại cùng vào)",
      databaseURL: "",
      source: "browser_only",
      now() {
        return Date.now();
      },
      onConnectionChange(cb) {
        cb(true);
        return () => {};
      },
      async testWrite() {
        return true;
      },
      async getRoomSnapshot(roomCode) {
        const rm = readRoom(roomCode);
        return { state: rm.state || null, players: rm.players || {}, scores: rm.scores || {} };
      },
      subscribeState(roomCode, cb) {
        return addSub(roomCode, (rm) => cb(rm.state || null));
      },
      subscribePlayers(roomCode, cb) {
        return addSub(roomCode, (rm) => cb(rm.players || {}));
      },
      subscribeScores(roomCode, cb) {
        return addSub(roomCode, (rm) => cb(rm.scores || {}));
      },
      subscribeMyScore(roomCode, playerId, cb) {
        return addSub(roomCode, (rm) => cb((rm.scores && rm.scores[playerId]) || null));
      },
      subscribeMyPlayer(roomCode, playerId, cb) {
        return addSub(roomCode, (rm) => cb((rm.players && rm.players[playerId]) || null));
      },
      subscribeSubmissions(roomCode, roundIndex, cb) {
        return addSub(roomCode, (rm) => cb((rm.submissions && rm.submissions[roundIndex]) || {}));
      },
      async setState(roomCode, stateObj) {
        const rm = readRoom(roomCode);
        rm.state = stateObj;
        writeRoom(roomCode, rm);
      },
      async upsertPlayer(roomCode, player) {
        const rm = readRoom(roomCode);
        rm.players[player.id] = player;
        writeRoom(roomCode, rm);
      },
      async upsertPlayersBatch(roomCode, playersMap) {
        const rm = readRoom(roomCode);
        Object.assign(rm.players, playersMap);
        writeRoom(roomCode, rm);
      },
      async removePlayer(roomCode, playerId) {
        const rm = readRoom(roomCode);
        delete rm.players[playerId];
        delete rm.scores[playerId];
        writeRoom(roomCode, rm);
      },
      async clearBots(roomCode, botIds) {
        const rm = readRoom(roomCode);
        botIds.forEach((id) => {
          delete rm.players[id];
          delete rm.scores[id];
        });
        writeRoom(roomCode, rm);
      },
      async setScoresBatch(roomCode, scoresMap) {
        const rm = readRoom(roomCode);
        rm.scores = scoresMap;
        writeRoom(roomCode, rm);
      },
      async ensurePlayerScore(roomCode, playerId, initialScoreObj) {
        const rm = readRoom(roomCode);
        if (!rm.scores[playerId]) {
          rm.scores[playerId] = initialScoreObj;
          writeRoom(roomCode, rm);
        }
      },
      async submitAnswer(roomCode, roundIndex, playerId, payload) {
        const rm = readRoom(roomCode);
        if (!rm.submissions[roundIndex]) rm.submissions[roundIndex] = {};
        rm.submissions[roundIndex][playerId] = payload;
        writeRoom(roomCode, rm);
      },
      async submitAnswersBatch(roomCode, roundIndex, mapPayload) {
        const rm = readRoom(roomCode);
        if (!rm.submissions[roundIndex]) rm.submissions[roundIndex] = {};
        Object.assign(rm.submissions[roundIndex], mapPayload);
        writeRoom(roomCode, rm);
      },
      async clearSubmissions(roomCode) {
        const rm = readRoom(roomCode);
        rm.submissions = {};
        writeRoom(roomCode, rm);
      },
      async resetRoom(roomCode, keepPlayers = true) {
        const rm = readRoom(roomCode);
        if (keepPlayers) {
          rm.submissions = {};
          writeRoom(roomCode, rm);
        } else {
          writeRoom(roomCode, { state: null, players: {}, scores: {}, submissions: {} });
        }
      }
    };
  }

  global.GameSync = {
    encodeDbToken,
    decodeDbToken,
    parseFirebaseInput,
    saveCustomFirebaseConfig(cfgObj) {
      localStorage.setItem(STORAGE_FB_KEY, JSON.stringify(cfgObj));
    },
    clearCustomFirebaseConfig() {
      localStorage.removeItem(STORAGE_FB_KEY);
    },
    getSavedFirebaseConfig() {
      return resolveFirebaseConfig();
    },
    async init() {
      const fbCfg = resolveFirebaseConfig();
      if (fbCfg && fbCfg.databaseURL) {
        try {
          return await createFirebaseAdapter(fbCfg);
        } catch (err) {
          console.error("Không thể khởi tạo Firebase, chuyển sang chế độ dự phòng:", err);
        }
      }
      const relay = await tryCreatePreviewRelayAdapter();
      if (relay) return relay;
      return createLocalBroadcastAdapter();
    },
    async testFirebaseConnection(rawInput, roomCode = "test_ping") {
      const parsed = parseFirebaseInput(rawInput);
      if (!parsed.ok) return parsed;
      try {
        const adapter = await createFirebaseAdapter(parsed.config);
        await Promise.race([
          adapter.testWrite(roomCode),
          new Promise((_, rej) =>
            setTimeout(
              () =>
                rej(
                  new Error(
                    "Quá thời gian phản hồi (6s). Hãy kiểm tra Rules trong Realtime Database đã bật '.read': true, '.write': true (Test Mode) chưa nhé!"
                  )
                ),
              6500
            )
          )
        ]);
        return { ok: true, config: parsed.config };
      } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (/PERMISSION_DENIED/i.test(msg)) {
          return {
            ok: false,
            error:
              "Bị từ chối quyền ghi (PERMISSION_DENIED)! Hãy mở tab 'Rules' trong Firebase Realtime Database và sửa thành: { \"rules\": { \".read\": true, \".write\": true } } rồi bấm Publish!"
          };
        }
        return { ok: false, error: "Lỗi kết nối Firebase: " + msg };
      }
    }
  };
})(window);
