(function (global) {
  const LETTERS = ["A", "B", "C", "D"];
  const CUSTOM_Q_KEY = "dm_custom_questions_v2";
  const PLAYER_SESSION_KEY = "dm_player_session_v1";

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmtMoney(n) {
    const val = Math.round(Number(n) || 0);
    return val.toLocaleString("vi-VN");
  }

  function getBaseAppUrl() {
    return global.location.origin + global.location.pathname;
  }

  function loadQuestionsBank() {
    try {
      const saved = localStorage.getItem(CUSTOM_Q_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 4) return parsed;
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(global.DEFAULT_QUESTIONS));
  }

  function getAvatarObj(id) {
    return (
      global.PLAYER_AVATARS.find((a) => a.id === id) ||
      global.PLAYER_AVATARS[0]
    );
  }

  function spawnConfetti() {
    const colors = ["#f3b72d", "#d63326", "#22c55e", "#38bdf8", "#faf3e3"];
    for (let i = 0; i < 65; i++) {
      const el = document.createElement("div");
      el.className = "confetti-piece";
      el.style.left = Math.random() * 100 + "vw";
      el.style.background = colors[i % colors.length];
      el.style.animationDuration = 2.4 + Math.random() * 2.4 + "s";
      el.style.animationDelay = Math.random() * 0.8 + "s";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5500);
    }
  }

  async function boot() {
    const root = document.getElementById("app");
    const params = new URLSearchParams(global.location.search);
    const demoMode = params.get("demo");
    const role = params.get("role");
    const roomParam = (params.get("r") || params.get("room") || "").trim();

    if (demoMode === "split") {
      renderSplitSimulator(root, roomParam || global.GAME_CONFIG.GROUP_INFO.defaultRoomCode || "1986");
      return;
    }

    const sync = await global.GameSync.init();

    if (role === "host") {
      initHostApp(root, sync, roomParam);
    } else if (role === "player" || roomParam) {
      initPlayerApp(root, sync, roomParam);
    } else {
      renderLanding(root);
    }
  }

  // =========================================================================
  // 1. TRANG CHỦ
  // =========================================================================
  function renderLanding(root) {
    const info = global.GAME_CONFIG.GROUP_INFO;
    const defaultRoom = info.defaultRoomCode || "1986";

    root.innerHTML = `
      <main class="landing-wrap">
        <section class="hero-banner">
          <span class="hero-eyebrow">★ HÀNH TRÌNH LỊCH SỬ ${esc(info.subtitle)}</span>
          <h1 class="hero-title">${esc(info.gameTitle)}</h1>
          <p class="hero-sub">
            Đấu trường quyết sách lịch sử thời gian thực từ thời kỳ Đột phá mở đường (1982–1986), Đổi mới toàn diện (1986–1996) đến Công nghiệp hóa, Hiện đại hóa và Hội nhập (1996–2006).
          </p>
        </section>

        <section class="role-grid">
          <div class="role-card host-card">
            <div>
              <div class="role-icon">🖥️</div>
              <h2>Người dẫn trò (Host)</h2>
              <p>Màn hình điều khiển dành cho máy chiếu lớp học.</p>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;">
              <button id="btn-go-host" class="btn btn-gold btn-lg" style="flex:1;">
                🚀 Mở Màn Chiếu
              </button>
              <button id="btn-go-split" class="btn btn-ghost">
                👀 Xem Song Song
              </button>
            </div>
          </div>

          <div class="role-card">
            <div>
              <div class="role-icon">📱</div>
              <h2>Người chơi</h2>
              <p>Nhập mã phòng hiển thị trên màn chiếu để tham gia.</p>
            </div>
            <form id="form-quick-join" class="quick-join-row">
              <input
                id="inp-landing-room"
                class="input-field"
                type="text"
                maxlength="8"
                placeholder="Mã phòng"
                value="${esc(defaultRoom)}"
                aria-label="Mã phòng"
              />
              <button type="submit" class="btn btn-primary" style="white-space:nowrap;">
                Vào Phòng →
              </button>
            </form>
          </div>
        </section>
      </main>
    `;

    document.getElementById("btn-go-host").onclick = () => {
      global.SoundFX.unlock();
      global.location.href = `${getBaseAppUrl()}?role=host&r=${encodeURIComponent(defaultRoom)}`;
    };

    document.getElementById("btn-go-split").onclick = () => {
      global.SoundFX.unlock();
      global.location.href = `${getBaseAppUrl()}?demo=split&r=${encodeURIComponent(defaultRoom)}`;
    };

    document.getElementById("form-quick-join").onsubmit = (e) => {
      e.preventDefault();
      global.SoundFX.unlock();
      const code = document.getElementById("inp-landing-room").value.trim() || defaultRoom;
      global.location.href = `${getBaseAppUrl()}?r=${encodeURIComponent(code)}`;
    };
  }

  // =========================================================================
  // CHẾ ĐỘ XEM THỬ SONG SONG
  // =========================================================================
  function renderSplitSimulator(root, roomCode) {
    const base = getBaseAppUrl();
    const dbCfg = global.GameSync.getSavedFirebaseConfig();
    const dbParam = dbCfg && dbCfg.databaseURL ? `&d=${encodeURIComponent(global.GameSync.encodeDbToken(dbCfg.databaseURL))}` : "";
    const hostUrl = `${base}?role=host&r=${encodeURIComponent(roomCode)}${dbParam}`;
    const playerUrl = `${base}?role=player&r=${encodeURIComponent(roomCode)}${dbParam}`;

    root.innerHTML = `
      <div class="split-demo-layout">
        <div class="split-host-pane">
          <iframe src="${esc(hostUrl)}" title="Màn hình Người dẫn trò"></iframe>
        </div>
        <div class="split-phone-pane">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 6px 8px;">
            <span style="font-size:0.82rem;font-weight:800;color:var(--gold-bright);">📱 Điện thoại Người chơi</span>
            <a href="${esc(hostUrl)}" class="btn btn-ghost btn-sm" style="text-decoration:none;">Thoát ✕</a>
          </div>
          <div class="phone-bezel">
            <iframe src="${esc(playerUrl)}" title="Màn hình Người chơi"></iframe>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 2. MÀN HÌNH NGƯỜI DẪN TRÒ (HOST)
  // =========================================================================
  function initHostApp(root, sync, initialRoomCode) {
    const info = global.GAME_CONFIG.GROUP_INFO;
    let roomCode =
      initialRoomCode ||
      sessionStorage.getItem("dm_host_room") ||
      info.defaultRoomCode ||
      "1986";
    sessionStorage.setItem("dm_host_room", roomCode);

    let campaignMode = "full";
    let questionDurationSec = info.defaultQuestionSeconds || 20;
    let allQuestions = loadQuestionsBank();

    let state = null;
    let players = {};
    let scores = {};
    let currentSubmissions = {};
    let isConnected = true;

    let unsubState = null;
    let unsubPlayers = null;
    let unsubScores = null;
    let unsubSubs = null;
    let tickTimer = null;
    let botTimers = [];
    let prevPlayerCount = 0;
    const seenPlayerIds = new Set();
    let activeModal = null;
    let lockingRound = false;

    function getActiveQuestions() {
      if (campaignMode === "express") {
        return allQuestions.filter((q) => q.expressInclude !== false);
      }
      return allQuestions;
    }

    function buildJoinUrl() {
      const base = getBaseAppUrl();
      let url = `${base}?r=${encodeURIComponent(roomCode)}`;
      if (sync.mode === "firebase" && sync.source !== "config_js" && sync.databaseURL) {
        const tok = global.GameSync.encodeDbToken(sync.databaseURL);
        url += `&d=${encodeURIComponent(tok)}`;
      }
      return url;
    }

    function clearBotTimers() {
      botTimers.forEach((t) => clearTimeout(t));
      botTimers = [];
    }

    async function bindRoomSubscriptions() {
      if (unsubState) unsubState();
      if (unsubPlayers) unsubPlayers();
      if (unsubScores) unsubScores();
      if (unsubSubs) {
        unsubSubs();
        unsubSubs = null;
      }

      const snap = await sync.getRoomSnapshot(roomCode);
      if (!snap.state) {
        const initState = {
          phase: "lobby",
          roomCode,
          campaignMode,
          questionDurationSec,
          totalRounds: getActiveQuestions().length,
          roundIndex: 0,
          updatedAt: sync.now()
        };
        await sync.setState(roomCode, initState);
      } else {
        campaignMode = snap.state.campaignMode || campaignMode;
        questionDurationSec = snap.state.questionDurationSec || questionDurationSec;
      }

      prevPlayerCount = Object.keys(snap.players || {}).length;

      unsubPlayers = sync.subscribePlayers(roomCode, (plMap) => {
        const count = Object.keys(plMap || {}).length;
        if (count > prevPlayerCount && (!state || state.phase === "lobby")) {
          global.SoundFX.join();
        }
        prevPlayerCount = count;
        players = plMap || {};

        Object.keys(players).forEach((pid) => {
          if (!scores[pid]) {
            sync.ensurePlayerScore(roomCode, pid, createInitialScore(pid));
          }
        });

        updateLiveDomCounters();
        if (!state || state.phase === "lobby") {
          renderHost();
        }
      });

      unsubScores = sync.subscribeScores(roomCode, (scMap) => {
        scores = scMap || {};
        if (state && (state.phase === "leaderboard" || state.phase === "finished")) {
          renderHost();
        }
      });

      unsubState = sync.subscribeState(roomCode, (st) => {
        const prevPhase = state ? state.phase : null;
        const prevRound = state ? state.roundIndex : -1;
        state = st || {
          phase: "lobby",
          roomCode,
          campaignMode,
          questionDurationSec,
          totalRounds: getActiveQuestions().length,
          roundIndex: 0
        };

        if (state.phase === "question" && (prevPhase !== "question" || prevRound !== state.roundIndex)) {
          bindRoundSubmissions(state.roundIndex);
          scheduleBotSubmissionsIfAny(state);
        }
        if (state.phase === "finished" && prevPhase !== "finished") {
          global.SoundFX.victory();
          spawnConfetti();
        }
        renderHost();
      });
    }

    function bindRoundSubmissions(roundIdx) {
      if (unsubSubs) unsubSubs();
      currentSubmissions = {};
      unsubSubs = sync.subscribeSubmissions(roomCode, roundIdx, (subMap) => {
        currentSubmissions = subMap || {};
        updateLiveDomCounters();

        const totalPlayers = Object.keys(players).length;
        const submittedCount = Object.keys(currentSubmissions).length;
        if (
          state &&
          state.phase === "question" &&
          !lockingRound &&
          totalPlayers > 0 &&
          submittedCount >= totalPlayers &&
          sync.now() >= (state.answerUnlockAt || 0)
        ) {
          setTimeout(() => {
            if (state && state.phase === "question" && !lockingRound) {
              lockAndRevealRound();
            }
          }, 450);
        }
      });
    }

    function createInitialScore(pid) {
      return {
        id: pid,
        money: info.startingCapital || 1000,
        correctCount: 0,
        answeredCount: 0,
        totalAnswerMs: 0,
        streak: 0,
        maxStreak: 0,
        boldWins: 0,
        rank: 1,
        prevRank: 1,
        midGameRank: 1,
        lastDelta: 0,
        lastCorrect: null,
        lastChoice: null,
        lastStrategy: "balanced",
        lastReason: ""
      };
    }

    function scheduleBotSubmissionsIfAny(st) {
      clearBotTimers();
      const botIds = Object.keys(players).filter((id) => players[id] && players[id].isBot);
      if (!botIds.length) return;

      const q = st.questionData;
      if (!q) return;
      const durationMs = Math.max(6000, (st.roundEndsAt || 0) - (st.answerUnlockAt || sync.now()));
      const pendingBatch = {};

      botIds.forEach((bid, idx) => {
        const skill = 0.58 + ((idx * 17) % 29) / 100;
        const isCorrect = Math.random() < skill;
        let choice = q.correctIndex;
        if (!isCorrect) {
          const wrongs = [0, 1, 2, 3].filter((x) => x !== q.correctIndex);
          choice = wrongs[Math.floor(Math.random() * wrongs.length)];
        }
        const stratRoll = Math.random();
        const strategy = stratRoll < 0.22 ? "safe" : stratRoll < 0.72 ? "balanced" : "bold";
        const delayMs = 2800 + Math.floor(Math.random() * Math.min(durationMs - 1800, 12500));

        const t = setTimeout(() => {
          if (!state || state.phase !== "question" || state.roundIndex !== st.roundIndex) return;
          pendingBatch[bid] = {
            choice,
            strategy,
            elapsedMs: Math.max(900, delayMs - 2200),
            submittedAt: sync.now()
          };
        }, delayMs);
        botTimers.push(t);
      });

      const flushInterval = setInterval(() => {
        if (!state || state.phase !== "question" || state.roundIndex !== st.roundIndex) {
          clearInterval(flushInterval);
          return;
        }
        const keys = Object.keys(pendingBatch);
        if (keys.length > 0) {
          const toSend = { ...pendingBatch };
          keys.forEach((k) => delete pendingBatch[k]);
          sync.submitAnswersBatch(roomCode, st.roundIndex, toSend).catch(() => {});
        }
      }, 1300);
      botTimers.push(flushInterval);
    }

    async function startRound(roundIndex) {
      lockingRound = false;
      clearBotTimers();
      const activeQs = getActiveQuestions();
      if (roundIndex >= activeQs.length) {
        await finishGame();
        return;
      }
      const q = activeQs[roundIndex];
      const now = sync.now();
      const readingDelayMs = 2200;
      const durationMs = questionDurationSec * 1000;

      if (q.event) {
        if (q.event.tone === "storm") global.SoundFX.eventStorm();
        else global.SoundFX.eventBoom();
      } else {
        global.SoundFX.click();
      }

      const nextState = {
        phase: "question",
        roomCode,
        campaignMode,
        questionDurationSec,
        totalRounds: activeQs.length,
        roundIndex,
        roundStartedAt: now,
        answerUnlockAt: now + readingDelayMs,
        roundEndsAt: now + readingDelayMs + durationMs,
        questionData: {
          id: q.id,
          eraBadge: q.eraBadge,
          yearLabel: q.yearLabel,
          macro: q.macro,
          event: q.event || null,
          scenario: q.scenario,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          mcNote: q.mcNote
        }
      };

      await sync.setState(roomCode, nextState);
    }

    async function lockAndRevealRound() {
      if (!state || state.phase !== "question" || lockingRound) return;
      lockingRound = true;
      clearBotTimers();
      global.SoundFX.lock();

      const rIdx = state.roundIndex;
      const q = state.questionData;
      const pIds = Object.keys(players);
      const totalPlayers = pIds.length;

      const prevSorted = pIds
        .map((id) => ({
          id,
          money: scores[id] ? scores[id].money : info.startingCapital || 1000
        }))
        .sort((a, b) => b.money - a.money);

      const prevRankMap = {};
      prevSorted.forEach((item, idx) => {
        prevRankMap[item.id] = idx + 1;
      });

      const optionCounts = [0, 0, 0, 0];
      let correctTotal = 0;
      let boldTotal = 0;
      let fastestPlayer = null;

      pIds.forEach((pid) => {
        const sub = currentSubmissions[pid];
        if (sub && typeof sub.choice === "number" && sub.choice >= 0 && sub.choice <= 3) {
          optionCounts[sub.choice]++;
          if (sub.strategy === "bold") boldTotal++;
          if (sub.choice === q.correctIndex) {
            correctTotal++;
            const ms = Math.max(400, Number(sub.elapsedMs) || questionDurationSec * 1000);
            if (!fastestPlayer || ms < fastestPlayer.ms) {
              fastestPlayer = {
                id: pid,
                name: players[pid].name,
                avatar: players[pid].avatar,
                ms
              };
            }
          }
        }
      });

      const classCorrectRate = totalPlayers > 0 ? correctTotal / totalPlayers : 0;
      const khoan10Success =
        q.event && q.event.type === "khoan_10_1988" && (classCorrectRate >= 0.6 || (totalPlayers <= 2 && correctTotal >= 1));

      const isFinaleX2 = q.event && q.event.type === "finale_x2_2006";
      const basePoints = isFinaleX2 ? 600 : 300;
      const maxSpeedBonus = isFinaleX2 ? 400 : 200;
      const maxWindowMs = questionDurationSec * 1000;

      const updatedScores = {};

      pIds.forEach((pid) => {
        const prev = scores[pid] || createInitialScore(pid);
        const sub = currentSubmissions[pid] || null;
        const prevRank = prevRankMap[pid] || 1;
        const stratKey = sub && global.STRATEGIES[sub.strategy] ? sub.strategy : "balanced";
        const strat = global.STRATEGIES[stratKey];

        let delta = 0;
        let reasons = [];
        let isCorrect = false;
        let streak = prev.streak || 0;
        let maxStreak = prev.maxStreak || 0;
        let correctCount = prev.correctCount || 0;
        let answeredCount = prev.answeredCount || 0;
        let totalAnswerMs = prev.totalAnswerMs || 0;
        let boldWins = prev.boldWins || 0;

        if (!sub || typeof sub.choice !== "number") {
          streak = 0;
          const stagLoss = Math.min(180, Math.round(prev.money * 0.05));
          delta = -stagLoss;
          reasons.push("Hết giờ (-5% vốn)");
        } else {
          answeredCount++;
          const elapsed = Math.min(maxWindowMs, Math.max(300, Number(sub.elapsedMs) || maxWindowMs));
          totalAnswerMs += elapsed;

          if (sub.choice === q.correctIndex) {
            isCorrect = true;
            correctCount++;
            streak++;
            if (streak > maxStreak) maxStreak = streak;
            if (stratKey === "bold") boldWins++;

            const speedRatio = Math.max(0, 1 - elapsed / maxWindowMs);
            const rawEarn = Math.round((basePoints + maxSpeedBonus * speedRatio) * strat.winMult);
            const streakBonus = streak >= 2 ? Math.min(streak, 5) * 50 : 0;
            delta += rawEarn + streakBonus;
            reasons.push(`${strat.icon} ${strat.name} (+${fmtMoney(rawEarn)})`);
            if (streakBonus > 0) reasons.push(`🔥 Chuỗi ${streak} (+${streakBonus})`);

            if (q.event) {
              if (q.event.type === "inflation_1985") {
                delta += 250;
                reasons.push("🛡️ Bình ổn 1985 (+250)");
              } else if (q.event.type === "khoan_10_1988" && khoan10Success) {
                delta += 350;
                reasons.push("🌾 Xuất khẩu gạo (+350)");
              } else if (q.event.type === "asean_fdi_1995") {
                const inBottomHalf = prevRank > Math.ceil(totalPlayers / 2);
                const fdiBonus = inBottomHalf ? 450 : 200;
                delta += fdiBonus;
                reasons.push(`🌏 Hội nhập (+${fdiBonus})`);
              } else if (q.event.type === "asian_crisis_1997") {
                delta += 250;
                reasons.push("💪 Vượt bão 1997 (+250)");
              }
            }
          } else {
            streak = 0;
            if (stratKey === "safe") {
              delta = 0;
              reasons.push("🛡️ Thận trọng (0 trừ)");
            } else {
              const baseLoss = Math.min(strat.loseCap, Math.max(80, Math.round(prev.money * strat.loseRate)));
              delta -= baseLoss;
              reasons.push(`${strat.icon} Sai (-${fmtMoney(baseLoss)})`);

              if (q.event) {
                if (q.event.type === "inflation_1985") {
                  const stormLoss = Math.min(450, Math.round(prev.money * 0.15));
                  delta -= stormLoss;
                  reasons.push(`🌪️ Lạm phát (-${fmtMoney(stormLoss)})`);
                } else if (q.event.type === "asian_crisis_1997" && prevRank <= 5) {
                  const crisisLoss = Math.min(600, Math.round(prev.money * 0.15));
                  delta -= crisisLoss;
                  reasons.push(`📉 Sốc tài chính (-${fmtMoney(crisisLoss)})`);
                }
              }
            }
          }
        }

        const newMoney = Math.max(100, Math.round((prev.money || 1000) + delta));
        updatedScores[pid] = {
          id: pid,
          money: newMoney,
          correctCount,
          answeredCount,
          totalAnswerMs,
          streak,
          maxStreak,
          boldWins,
          prevRank,
          rank: prevRank,
          midGameRank: prev.midGameRank || prevRank,
          lastDelta: newMoney - (prev.money || 1000),
          lastCorrect: isCorrect,
          lastChoice: sub && typeof sub.choice === "number" ? sub.choice : -1,
          lastStrategy: stratKey,
          lastReason: reasons.join(" · ")
        };
      });

      const newSorted = Object.values(updatedScores).sort((a, b) => {
        if (b.money !== a.money) return b.money - a.money;
        if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
        return a.totalAnswerMs - b.totalAnswerMs;
      });

      const midRoundIndex = Math.floor(state.totalRounds / 2) - 1;
      let biggestClimber = null;

      newSorted.forEach((sc, idx) => {
        const newRank = idx + 1;
        const climb = (sc.prevRank || newRank) - newRank;
        sc.rank = newRank;
        if (rIdx === midRoundIndex) {
          sc.midGameRank = newRank;
        }
        if (climb > 0 && (!biggestClimber || climb > biggestClimber.climb)) {
          const pl = players[sc.id];
          if (pl) {
            biggestClimber = {
              name: pl.name,
              avatar: pl.avatar,
              climb,
              newRank
            };
          }
        }
      });

      const topLeaderboard = newSorted.slice(0, 10).map((sc) => ({
        id: sc.id,
        name: players[sc.id] ? players[sc.id].name : "Người chơi",
        avatar: players[sc.id] ? players[sc.id].avatar : "bike",
        money: sc.money,
        rank: sc.rank,
        prevRank: sc.prevRank,
        streak: sc.streak,
        correctCount: sc.correctCount,
        lastDelta: sc.lastDelta
      }));

      let eventOutcomeBanner = "";
      if (q.event) {
        if (q.event.type === "khoan_10_1988") {
          const pct = Math.round(classCorrectRate * 100);
          eventOutcomeBanner = khoan10Success
            ? `🌾 KHOÁN 10 THÀNH CÔNG (${pct}% đúng): Cộng thưởng +350 Vốn Xuất Khẩu Gạo!`
            : `🌾 Tỷ lệ đúng đạt ${pct}% (cần ≥ 60% để mở thưởng xuất khẩu gạo).`;
        } else if (q.event.type === "inflation_1985") {
          eventOutcomeBanner = `🌪️ Bão giá 1985: ${correctTotal}/${totalPlayers} người giữ vững giá trị thực (+250 Vốn)!`;
        } else if (q.event.type === "asean_fdi_1995") {
          eventOutcomeBanner = `🌏 Mở cửa Hội nhập 1995: Đã trao gói vốn FDI cho các người chơi trả lời đúng!`;
        } else if (q.event.type === "asian_crisis_1997") {
          eventOutcomeBanner = `📉 Vượt bão Tài chính 1997: ${correctTotal} người chơi cộng +250 Vốn Nội Lực!`;
        } else if (q.event.type === "finale_x2_2006") {
          eventOutcomeBanner = `🏆 Đã hoàn thành Vòng Chung Kết X2 Điểm!`;
        }
      }

      await sync.setScoresBatch(roomCode, updatedScores);

      const revealState = {
        ...state,
        phase: "reveal",
        revealSummary: {
          optionCounts,
          correctTotal,
          totalPlayers,
          boldTotal,
          fastestPlayer,
          biggestClimber,
          eventOutcomeBanner
        },
        topLeaderboard,
        updatedAt: sync.now()
      };

      await sync.setState(roomCode, revealState);
    }

    async function showLeaderboardPhase() {
      if (!state) return;
      global.SoundFX.click();
      await sync.setState(roomCode, {
        ...state,
        phase: "leaderboard",
        updatedAt: sync.now()
      });
    }

    async function finishGame() {
      const pIds = Object.keys(players);
      const allSorted = pIds
        .map((id) => {
          const sc = scores[id] || createInitialScore(id);
          const pl = players[id] || { name: "Người chơi", avatar: "bike" };
          return {
            ...sc,
            name: pl.name,
            avatar: pl.avatar
          };
        })
        .sort((a, b) => {
          if (b.money !== a.money) return b.money - a.money;
          if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
          return a.totalAnswerMs - b.totalAnswerMs;
        });

      allSorted.forEach((p, idx) => {
        p.rank = idx + 1;
      });

      const claimedIds = new Set();
      function pickAward(candidates, mapper) {
        if (!candidates.length) return null;
        const fresh = candidates.find((c) => !claimedIds.has(c.id)) || candidates[0];
        claimedIds.add(fresh.id);
        return mapper(fresh);
      }

      const speedCands = allSorted
        .filter((p) => p.correctCount >= 2 && p.answeredCount > 0)
        .map((p) => ({ ...p, avgMs: Math.round(p.totalAnswerMs / p.answeredCount) }))
        .sort((a, b) => a.avgMs - b.avgMs);

      const boldCands = allSorted
        .filter((p) => p.boldWins > 0)
        .sort((a, b) => b.boldWins - a.boldWins || b.money - a.money);

      const streakCands = allSorted
        .filter((p) => p.maxStreak >= 2)
        .sort((a, b) => b.maxStreak - a.maxStreak || b.money - a.money);

      const comebackCands = allSorted
        .map((p) => ({ ...p, comeback: (p.midGameRank || p.rank) - p.rank }))
        .filter((p) => p.comeback > 0)
        .sort((a, b) => b.comeback - a.comeback);

      const speedAward = pickAward(speedCands, (p) => ({
        name: p.name,
        avatar: p.avatar,
        avgMs: p.avgMs,
        detail: `Trung bình ${(p.avgMs / 1000).toFixed(1)}s/câu`
      }));
      const boldAward = pickAward(boldCands, (p) => ({
        name: p.name,
        avatar: p.avatar,
        boldWins: p.boldWins,
        detail: `${p.boldWins} lần Đột phá đúng`
      }));
      const streakAward = pickAward(streakCands, (p) => ({
        name: p.name,
        avatar: p.avatar,
        maxStreak: p.maxStreak,
        detail: `Chuỗi ${p.maxStreak} câu liên tiếp`
      }));
      const comebackAward = pickAward(comebackCands, (p) => ({
        name: p.name,
        avatar: p.avatar,
        comeback: p.comeback,
        detail: `Tăng +${p.comeback} bậc nửa sau`
      }));

      await sync.setState(roomCode, {
        ...state,
        phase: "finished",
        podium: allSorted.slice(0, 10),
        totalPlayersCount: allSorted.length,
        awards: {
          speedAward,
          boldAward,
          streakAward,
          comebackAward
        },
        updatedAt: sync.now()
      });
    }

    async function add45ClassroomBots() {
      global.SoundFX.unlock();
      const names = global.BOT_NAMES || [];
      const batchPlayers = {};
      const batchScores = { ...scores };
      const now = sync.now();

      names.forEach((rawName, idx) => {
        const id = "bot_" + String(idx + 1).padStart(2, "0");
        const av = global.PLAYER_AVATARS[idx % global.PLAYER_AVATARS.length].id;
        batchPlayers[id] = {
          id,
          name: rawName.trim(),
          avatar: av,
          isBot: true,
          joinedAt: now + idx
        };
        if (!batchScores[id]) {
          batchScores[id] = createInitialScore(id);
        }
      });

      await sync.upsertPlayersBatch(roomCode, batchPlayers);
      await sync.setScoresBatch(roomCode, batchScores);
      global.SoundFX.join();
    }

    async function removeAllBots() {
      const botIds = Object.keys(players).filter((id) => players[id] && players[id].isBot);
      if (!botIds.length) return;
      await sync.clearBots(roomCode, botIds);
    }

    async function resetGameToLobby(clearAllPlayers = false) {
      clearBotTimers();
      lockingRound = false;
      if (clearAllPlayers) seenPlayerIds.clear();
      await sync.resetRoom(roomCode, !clearAllPlayers);
      if (!clearAllPlayers) {
        const freshScores = {};
        Object.keys(players).forEach((pid) => {
          freshScores[pid] = createInitialScore(pid);
        });
        await sync.setScoresBatch(roomCode, freshScores);
      }
      await sync.setState(roomCode, {
        phase: "lobby",
        roomCode,
        campaignMode,
        questionDurationSec,
        totalRounds: getActiveQuestions().length,
        roundIndex: 0,
        updatedAt: sync.now()
      });
    }

    function exportScoresCSV() {
      const rows = [["Hang", "Ho_Ten", "Von_Tich_Luy", "So_Cau_Dung", "Chuoi_Dai_Nhat", "Dot_Pha_Dung"]];
      const sorted = Object.keys(players)
        .map((id) => ({
          ...(scores[id] || createInitialScore(id)),
          name: players[id].name
        }))
        .sort((a, b) => b.money - a.money);

      sorted.forEach((r, idx) => {
        rows.push([
          idx + 1,
          `"${String(r.name).replace(/"/g, '""')}"`,
          r.money,
          r.correctCount,
          r.maxStreak,
          r.boldWins
        ]);
      });

      const csvContent = "\uFEFF" + rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ket_Qua_Phong_${roomCode}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    let lastTickSec = -1;
    function startHostTicker() {
      if (tickTimer) clearInterval(tickTimer);
      tickTimer = setInterval(() => {
        if (!state || state.phase !== "question") return;
        const now = sync.now();
        const unlockAt = state.answerUnlockAt || state.roundStartedAt || now;
        const endsAt = state.roundEndsAt || now;

        const timerEl = document.getElementById("host-timer-circle");
        const statusEl = document.getElementById("host-reading-hint");

        if (now < unlockAt) {
          if (timerEl) {
            timerEl.textContent = state.questionDurationSec;
            timerEl.classList.remove("urgent");
          }
          if (statusEl) statusEl.textContent = "⏳ Chuẩn bị...";
          return;
        }

        if (statusEl) statusEl.textContent = "⚡ Đang mở chọn";

        const remainMs = Math.max(0, endsAt - now);
        const remainSec = Math.ceil(remainMs / 1000);

        if (timerEl) {
          timerEl.textContent = remainSec;
          if (remainSec <= 5) timerEl.classList.add("urgent");
          else timerEl.classList.remove("urgent");
        }

        if (remainSec !== lastTickSec && remainSec > 0) {
          lastTickSec = remainSec;
          if (remainSec <= 5) global.SoundFX.tick(true);
          else if (remainSec <= 12) global.SoundFX.tick(false);
        }

        if (remainMs <= 0 && !lockingRound) {
          lockAndRevealRound();
        }
      }, 200);
    }

    function updateLiveDomCounters() {
      const subEl = document.getElementById("host-live-sub-count");
      const boldEl = document.getElementById("host-live-bold-count");
      if (subEl) {
        const subCount = Object.keys(currentSubmissions).length;
        const pCount = Object.keys(players).length;
        subEl.textContent = `${subCount} / ${pCount}`;
      }
      if (boldEl) {
        const bolds = Object.values(currentSubmissions).filter((s) => s && s.strategy === "bold").length;
        boldEl.textContent = bolds;
      }
    }

    function renderHost() {
      const pList = Object.values(players).sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
      const botCount = pList.filter((p) => p.isBot).length;
      const qData = state && state.questionData ? state.questionData : null;
      const macro = qData && qData.macro
        ? qData.macro
        : { inflation: "774,7% → <4%", gdpStatus: "Sẵn sàng", mechanism: "1982 – 2006" };

      const connBtn =
        sync.mode === "firebase"
          ? `<button id="btn-open-fb-top" class="btn btn-ghost btn-sm" style="color:${isConnected ? "#86efac" : "#fcd34d"};">☁️ ${isConnected ? "Cloud" : "..."}</button>`
          : `<button id="btn-open-fb-top" class="btn btn-ghost btn-sm">☁️ Firebase</button>`;

      let mainContent = "";

      if (!state || state.phase === "lobby") {
        const joinUrl = buildJoinUrl();
        const qrSvg = global.createQRCodeSVG(joinUrl, { margin: 2 });

        mainContent = `
          <div class="lobby-grid">
            <aside class="qr-panel">
              <span class="badge badge-era" style="margin-bottom:6px;">QUÉT MÃ THAM GIA</span>
              <div class="qr-box">${qrSvg}</div>
              <div style="font-size:0.8rem;font-weight:800;color:#5c4e43;text-transform:uppercase;">Mã phòng</div>
              <div class="room-code-giant">${esc(roomCode)}</div>
              <div class="join-url-box">${esc(joinUrl)}</div>
              <div style="display:flex;gap:8px;width:100%;">
                <button id="btn-copy-link" class="btn btn-primary btn-sm" style="flex:1;">📋 Copy Link</button>
                <button id="btn-new-code" class="btn btn-ghost btn-sm" style="color:#1b1410;border-color:#cbbba6;">🔄 Đổi mã</button>
              </div>
            </aside>

            <section class="lobby-right">
              <div>
                <div class="lobby-controls-bar">
                  <h2 style="margin:0;font-size:1.45rem;color:var(--gold-bright);">
                    👥 Người chơi: <span id="lobby-count">${pList.length}</span>
                  </h2>

                  <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                    <select id="sel-campaign" class="input-field" style="width:auto;padding:8px 12px;font-size:0.86rem;">
                      <option value="full" ${campaignMode === "full" ? "selected" : ""}>12 vòng</option>
                      <option value="express" ${campaignMode === "express" ? "selected" : ""}>8 vòng</option>
                    </select>
                    <select id="sel-duration" class="input-field" style="width:auto;padding:8px 12px;font-size:0.86rem;">
                      ${[15, 20, 25, 30]
                        .map((s) => `<option value="${s}" ${Number(questionDurationSec) === s ? "selected" : ""}>⏱️ ${s}s / câu</option>`)
                        .join("")}
                    </select>
                    ${
                      botCount === 0
                        ? `<button id="btn-add-bots" class="btn btn-ghost btn-sm">🤖 +45 Bot</button>`
                        : `<button id="btn-clear-bots" class="btn btn-ghost btn-sm" style="border-color:#f87171;color:#fca5a5;">🧹 Xóa Bot</button>`
                    }
                    <button id="btn-edit-questions" class="btn btn-ghost btn-sm">📝 Câu hỏi</button>
                    ${pList.length > 0 ? `<button id="btn-kick-all" class="btn btn-ghost btn-sm">🗑️ Làm mới</button>` : ""}
                  </div>
                </div>

                <div class="players-grid" style="margin-top:14px;">
                  ${
                    pList.length === 0
                      ? `<div style="grid-column:1/-1;padding:46px 20px;text-align:center;color:var(--text-dim);border:1px dashed var(--border-subtle);border-radius:16px;">
                          <div style="font-size:2.2rem;margin-bottom:8px;">📲</div>
                          <strong>Quét mã QR hoặc nhập mã phòng để vào sảnh chờ</strong>
                        </div>`
                      : pList
                          .map((p) => {
                            const av = getAvatarObj(p.avatar);
                            const isNew = !seenPlayerIds.has(p.id);
                            seenPlayerIds.add(p.id);
                            return `
                              <div class="player-chip ${isNew ? "pop-new" : ""}">
                                <div class="player-chip-info">
                                  <span style="font-size:1.25rem;">${av.icon}</span>
                                  <span class="player-chip-name" title="${esc(p.name)}">${esc(p.name)}</span>
                                </div>
                                <button class="player-kick" data-kick="${esc(p.id)}" title="Xóa">✕</button>
                              </div>
                            `;
                          })
                          .join("")
                  }
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;padding-top:12px;border-top:1px solid var(--border-subtle);">
                <button id="btn-start-game" class="btn btn-gold btn-lg">
                  🚀 BẮT ĐẦU (${getActiveQuestions().length} VÒNG)
                </button>
              </div>
            </section>
          </div>
        `;
      } else if (state.phase === "question" && qData) {
        const subCount = Object.keys(currentSubmissions).length;
        const pCount = Object.keys(players).length;
        const boldCount = Object.values(currentSubmissions).filter((s) => s && s.strategy === "bold").length;

        mainContent = `
          <section class="stage-card">
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
              <span class="badge badge-era">VÒNG ${state.roundIndex + 1}/${state.totalRounds} · ${esc(qData.eraBadge)}</span>
              <span id="host-reading-hint" class="badge badge-green">⚡ Đang mở chọn</span>
            </div>

            ${
              qData.event
                ? `
              <div class="event-alert-banner ${esc(qData.event.tone)}">
                <div>
                  <div style="font-weight:900;font-size:1.05rem;color:var(--gold-bright);margin-bottom:2px;">${esc(qData.event.badge)}</div>
                  <div style="font-size:0.92rem;color:#fff7e6;">${esc(qData.event.desc)}</div>
                </div>
              </div>
            `
                : ""
            }

            <div class="question-header-row">
              <div class="question-paper">
                <p class="scenario-text">📜 ${esc(qData.scenario)}</p>
                <h2 class="question-main-text">${esc(qData.question)}</h2>
              </div>

              <div class="timer-stats-col">
                <div id="host-timer-circle" class="timer-circle">${state.questionDurationSec}</div>
                <div style="text-align:center;">
                  <div id="host-live-sub-count" style="font-size:1.35rem;font-weight:900;color:var(--gold-bright);">${subCount} / ${pCount}</div>
                  <div style="font-size:0.8rem;color:#fda4af;">🔥 <span id="host-live-bold-count">${boldCount}</span> Đột phá</div>
                </div>
              </div>
            </div>

            <div class="host-options-grid">
              ${qData.options
                .map(
                  (opt, idx) => `
                <div class="host-opt-card opt-${idx}">
                  <span class="opt-letter">${LETTERS[idx]}</span>
                  <span>${esc(opt)}</span>
                </div>
              `
                )
                .join("")}
            </div>

            <div style="display:flex;justify-content:flex-end;margin-top:auto;padding-top:6px;">
              <button id="btn-lock-now" class="btn btn-primary">
                ⏹️ Công Bố Kết Quả
              </button>
            </div>
          </section>
        `;
      } else if (state.phase === "reveal" && qData) {
        const rev = state.revealSummary || { optionCounts: [0, 0, 0, 0], correctTotal: 0, totalPlayers: 0 };
        const isLastRound = state.roundIndex + 1 >= state.totalRounds;

        mainContent = `
          <section class="stage-card">
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
              <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                <span class="badge badge-era">KẾT QUẢ VÒNG ${state.roundIndex + 1}/${state.totalRounds}</span>
                <span class="badge badge-green">✅ ${rev.correctTotal}/${rev.totalPlayers} đúng</span>
                ${
                  rev.fastestPlayer
                    ? `<span class="badge badge-gold">⚡ ${esc(rev.fastestPlayer.name)} (${(rev.fastestPlayer.ms / 1000).toFixed(1)}s)</span>`
                    : ""
                }
              </div>
              <div style="display:flex;gap:10px;">
                ${
                  !isLastRound
                    ? `<button id="btn-to-leaderboard" class="btn btn-ghost">📊 Bảng Xếp Hạng</button>
                       <button id="btn-next-round" class="btn btn-gold">➡️ Vòng ${state.roundIndex + 2} →</button>`
                    : `<button id="btn-finish-podium" class="btn btn-gold btn-lg">🏆 BẢNG VINH DANH</button>`
                }
              </div>
            </div>

            ${
              rev.eventOutcomeBanner
                ? `<div class="event-alert-banner boom" style="padding:10px 16px;">
                    <strong style="color:var(--gold-bright);font-size:0.98rem;">${esc(rev.eventOutcomeBanner)}</strong>
                  </div>`
                : ""
            }

            <div class="question-paper" style="padding:15px 20px;">
              <h2 class="question-main-text" style="font-size:clamp(1.1rem,1.65vw,1.45rem);">${esc(qData.question)}</h2>
            </div>

            <div class="host-options-grid">
              ${qData.options
                .map((opt, idx) => {
                  const isRight = idx === qData.correctIndex;
                  const votes = (rev.optionCounts && rev.optionCounts[idx]) || 0;
                  return `
                    <div class="host-opt-card opt-${idx} ${isRight ? "correct-highlight" : "dimmed"}">
                      <span class="opt-letter">${isRight ? "✓" : LETTERS[idx]}</span>
                      <span>${esc(opt)}</span>
                      <span class="vote-pill">${votes}</span>
                    </div>
                  `;
                })
                .join("")}
            </div>

            <div class="mc-note-box">
              <div class="mc-note-title">📌 Trọng tâm lịch sử</div>
              <div class="mc-note-body">${esc(qData.mcNote)}</div>
            </div>
          </section>
        `;
      } else if (state.phase === "leaderboard") {
        const topList = state.topLeaderboard || [];
        const rev = state.revealSummary || {};
        const isLastRound = state.roundIndex + 1 >= state.totalRounds;

        mainContent = `
          <section class="stage-card">
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
              <div>
                <span class="badge badge-era">SAU VÒNG ${state.roundIndex + 1}/${state.totalRounds}</span>
                <h2 style="margin:8px 0 0;font-size:1.65rem;color:var(--gold-bright);">
                  📊 Bảng Xếp Hạng
                </h2>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                ${
                  rev.biggestClimber
                    ? `<span class="badge badge-green" style="font-size:0.9rem;padding:8px 14px;">
                        🚀 Bứt phá: ${esc(rev.biggestClimber.name)} (+${rev.biggestClimber.climb} bậc)
                      </span>`
                    : ""
                }
                ${
                  !isLastRound
                    ? `<button id="btn-next-from-lb" class="btn btn-gold btn-lg">➡️ Vòng ${state.roundIndex + 2}/${state.totalRounds}</button>`
                    : `<button id="btn-finish-from-lb" class="btn btn-gold btn-lg">🏆 Bảng Vinh Danh</button>`
                }
              </div>
            </div>

            <div class="leaderboard-list">
              ${
                topList.length === 0
                  ? `<p style="color:var(--text-dim);">Chưa có dữ liệu.</p>`
                  : topList
                      .slice(0, 8)
                      .map((item, idx) => {
                        const av = getAvatarObj(item.avatar);
                        const deltaSign = item.lastDelta >= 0 ? `+${fmtMoney(item.lastDelta)}` : fmtMoney(item.lastDelta);
                        const rankDiff = (item.prevRank || item.rank) - item.rank;
                        const rankArrow =
                          rankDiff > 0
                            ? `<span style="color:#4ade80;font-size:0.82rem;">▲${rankDiff}</span>`
                            : rankDiff < 0
                            ? `<span style="color:#f87171;font-size:0.82rem;">▼${Math.abs(rankDiff)}</span>`
                            : `<span style="color:var(--text-dim);font-size:0.82rem;">•</span>`;
                        return `
                          <div class="lb-row ${idx < 3 ? `top-${idx + 1}` : ""}">
                            <div style="display:flex;align-items:center;gap:14px;">
                              <span style="width:34px;font-weight:900;font-size:1.18rem;color:var(--gold-bright);">#${item.rank}</span>
                              ${rankArrow}
                              <span style="font-size:1.45rem;">${av.icon}</span>
                              <div>
                                <div style="font-weight:800;font-size:1.06rem;">${esc(item.name)}</div>
                                <div style="font-size:0.78rem;color:var(--text-dim);">
                                  Đúng ${item.correctCount} câu ${item.streak >= 2 ? `· 🔥 ${item.streak}` : ""}
                                </div>
                              </div>
                            </div>
                            <div style="text-align:right;">
                              <div style="font-weight:900;font-size:1.22rem;color:var(--gold-bright);">${fmtMoney(item.money)} Vốn</div>
                              <div style="font-size:0.8rem;color:${item.lastDelta >= 0 ? "#86efac" : "#fca5a5"};">${deltaSign}</div>
                            </div>
                          </div>
                        `;
                      })
                      .join("")
              }
            </div>
          </section>
        `;
      } else if (state.phase === "finished") {
        const podium = state.podium || [];
        const p1 = podium[0] || null;
        const p2 = podium[1] || null;
        const p3 = podium[2] || null;
        const awards = state.awards || {};

        function renderPodiumSlot(p, medal, rankClass, titleText) {
          if (!p) {
            return `<div class="podium-card" style="opacity:0.45;"><div style="font-size:2rem;">${medal}</div><div>—</div></div>`;
          }
          const av = getAvatarObj(p.avatar);
          return `
            <div class="podium-card ${rankClass}">
              <div style="font-size:2.5rem;">${medal}</div>
              <span class="badge badge-gold">${esc(titleText)}</span>
              <div style="font-size:2.3rem;margin-top:4px;">${av.icon}</div>
              <div style="font-size:1.32rem;font-weight:900;color:#ffffff;">${esc(p.name)}</div>
              <div style="font-size:1.5rem;font-weight:900;color:var(--gold-bright);">${fmtMoney(p.money)} Vốn</div>
              <div style="font-size:0.84rem;color:var(--text-dim);">Đúng ${p.correctCount}/${state.totalRounds} · Chuỗi ${p.maxStreak}</div>
            </div>
          `;
        }

        mainContent = `
          <section class="stage-card">
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
              <div>
                <span class="badge badge-era">★ KẾT QUẢ CHUNG CUỘC ★</span>
                <h2 style="margin:8px 0 0;font-size:1.75rem;color:var(--gold-bright);">
                  🏆 Bảng Vinh Danh Chung Cuộc
                </h2>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:10px;">
                <button id="btn-export-csv" class="btn btn-emerald">📥 Xuất CSV</button>
                <button id="btn-play-again" class="btn btn-ghost">🔄 Chơi Lại</button>
              </div>
            </div>

            <div class="podium-grid">
              ${renderPodiumSlot(p2, "🥈", "rank-2", "Hạng Nhì")}
              ${renderPodiumSlot(p1, "🥇", "rank-1", "Quán Quân")}
              ${renderPodiumSlot(p3, "🥉", "rank-3", "Hạng Ba")}
            </div>

            <div class="awards-grid">
              ${
                awards.speedAward
                  ? `<div class="award-card">
                      <div style="color:var(--gold-bright);font-weight:800;font-size:0.86rem;">⚡ PHẢN XẠ NHANH NHẤT</div>
                      <div style="font-size:1.1rem;font-weight:900;margin:4px 0;">${esc(awards.speedAward.name)}</div>
                      <div style="font-size:0.82rem;color:var(--text-dim);">${esc(awards.speedAward.detail)}</div>
                    </div>`
                  : ""
              }
              ${
                awards.boldAward
                  ? `<div class="award-card">
                      <div style="color:#fb7185;font-weight:800;font-size:0.86rem;">🔥 ĐỘT PHÁ TÁO BẠO</div>
                      <div style="font-size:1.1rem;font-weight:900;margin:4px 0;">${esc(awards.boldAward.name)}</div>
                      <div style="font-size:0.82rem;color:var(--text-dim);">${esc(awards.boldAward.detail)}</div>
                    </div>`
                  : ""
              }
              ${
                awards.streakAward
                  ? `<div class="award-card">
                      <div style="color:#4ade80;font-weight:800;font-size:0.86rem;">🛡️ CHUỖI BẤT BẠI</div>
                      <div style="font-size:1.1rem;font-weight:900;margin:4px 0;">${esc(awards.streakAward.name)}</div>
                      <div style="font-size:0.82rem;color:var(--text-dim);">${esc(awards.streakAward.detail)}</div>
                    </div>`
                  : ""
              }
              ${
                awards.comebackAward
                  ? `<div class="award-card">
                      <div style="color:#60a5fa;font-weight:800;font-size:0.86rem;">🚀 LỘI NGƯỢC DÒNG</div>
                      <div style="font-size:1.1rem;font-weight:900;margin:4px 0;">${esc(awards.comebackAward.name)}</div>
                      <div style="font-size:0.82rem;color:var(--text-dim);">${esc(awards.comebackAward.detail)}</div>
                    </div>`
                  : ""
              }
            </div>

            ${
              podium.length > 3
                ? `
              <div style="margin-top:6px;">
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;">
                  ${podium
                    .slice(3, 10)
                    .map(
                      (p) => `
                    <div style="background:var(--bg-card);padding:9px 13px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;font-size:0.9rem;">
                      <span><strong>#${p.rank}</strong> ${esc(p.name)}</span>
                      <strong style="color:var(--gold-bright);">${fmtMoney(p.money)}</strong>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
          </section>
        `;
      }

      root.innerHTML = `
        <div class="host-shell">
          <header class="host-topbar">
            <div class="host-brand">
              <div class="host-star-seal">★</div>
              <div>
                <div style="font-weight:900;font-size:1.08rem;color:var(--gold-bright);">
                  ${esc(info.gameTitle)}
                </div>
                <div style="font-size:0.78rem;color:var(--text-dim);">${esc(info.subtitle)}</div>
              </div>
            </div>

            <div class="macro-strip">
              <div class="macro-chip">
                <small>Lạm phát</small>
                <strong>${esc(macro.inflation)}</strong>
              </div>
              <div class="macro-chip">
                <small>Cơ chế</small>
                <strong>${esc(macro.mechanism)}</strong>
              </div>
              <div class="macro-chip">
                <small>Bối cảnh</small>
                <strong>${esc(macro.gdpStatus)}</strong>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <div class="pin-pill">
                PHÒNG: <code>${esc(roomCode)}</code>
              </div>
              ${connBtn}
              <button id="btn-mute-toggle" class="btn btn-ghost btn-sm">
                ${global.SoundFX.isMuted() ? "🔇" : "🔊"}
              </button>
              ${
                state && state.phase !== "lobby"
                  ? `<button id="btn-back-lobby" class="btn btn-ghost btn-sm">🏠 Sảnh</button>`
                  : `<a href="${esc(getBaseAppUrl())}" class="btn btn-ghost btn-sm" style="text-decoration:none;">←</a>`
              }
            </div>
          </header>

          ${mainContent}
        </div>
        ${activeModal === "firebase" ? renderFirebaseModalHtml() : ""}
        ${activeModal === "questions" ? renderQuestionsModalHtml() : ""}
      `;

      bindHostEvents();
    }

    function renderFirebaseModalHtml() {
      const saved = global.GameSync.getSavedFirebaseConfig();
      const currentUrl = saved && saved.databaseURL ? saved.databaseURL : "";

      return `
        <div class="modal-backdrop" id="modal-fb-backdrop">
          <div class="modal-box">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <h3 style="margin:0;font-size:1.25rem;color:var(--gold-bright);">☁️ Kết nối Firebase Realtime Database</h3>
              <button id="btn-close-modal" class="btn btn-ghost btn-sm">✕</button>
            </div>

            <label style="display:block;font-weight:700;font-size:0.9rem;margin-bottom:6px;">
              Database URL (hoặc firebaseConfig):
            </label>
            <textarea
              id="inp-fb-raw"
              class="input-field"
              rows="3"
              placeholder="https://ten-project-default-rtdb.asia-southeast1.firebasedatabase.app"
            >${esc(currentUrl)}</textarea>

            <div id="fb-test-status" style="margin-top:10px;font-size:0.88rem;min-height:22px;"></div>

            <div style="display:flex;justify-content:space-between;gap:10px;margin-top:14px;flex-wrap:wrap;">
              ${
                currentUrl
                  ? `<button id="btn-clear-fb" class="btn btn-ghost btn-sm" style="color:#fca5a5;">Gỡ kết nối</button>`
                  : `<span></span>`
              }
              <button id="btn-save-fb" class="btn btn-gold">✅ Lưu & Kết nối</button>
            </div>
          </div>
        </div>
      `;
    }

    function renderQuestionsModalHtml() {
      return `
        <div class="modal-backdrop" id="modal-q-backdrop">
          <div class="modal-box" style="max-width:860px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <h3 style="margin:0;font-size:1.25rem;color:var(--gold-bright);">📝 Bộ Câu Hỏi (${allQuestions.length} vòng)</h3>
              <div style="display:flex;gap:8px;">
                <button id="btn-reset-default-q" class="btn btn-ghost btn-sm">↺ Mặc định</button>
                <button id="btn-close-modal" class="btn btn-ghost btn-sm">✕</button>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:14px;max-height:60vh;overflow-y:auto;padding-right:6px;">
              ${allQuestions
                .map(
                  (q, idx) => `
                <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:12px;padding:14px;">
                  <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;">
                    <strong style="color:var(--gold-bright);">Câu ${idx + 1} (${esc(q.yearLabel)})</strong>
                    ${q.event ? `<span class="badge badge-warn">${esc(q.event.badge)}</span>` : ""}
                  </div>
                  <input class="input-field q-edit-title" data-idx="${idx}" value="${esc(q.question)}" style="margin-bottom:8px;font-size:0.9rem;padding:9px 12px;" />
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                    ${q.options
                      .map(
                        (opt, oIdx) => `
                      <div style="display:flex;align-items:center;gap:6px;">
                        <input type="radio" name="correct_${idx}" value="${oIdx}" ${q.correctIndex === oIdx ? "checked" : ""} />
                        <input class="input-field q-edit-opt" data-idx="${idx}" data-oidx="${oIdx}" value="${esc(opt)}" style="padding:7px 10px;font-size:0.84rem;" />
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px;">
              <button id="btn-save-questions" class="btn btn-gold">💾 Lưu</button>
            </div>
          </div>
        </div>
      `;
    }

    function bindHostEvents() {
      const muteBtn = document.getElementById("btn-mute-toggle");
      if (muteBtn) {
        muteBtn.onclick = () => {
          global.SoundFX.toggleMute();
          renderHost();
        };
      }

      const backLobbyBtn = document.getElementById("btn-back-lobby");
      if (backLobbyBtn) {
        backLobbyBtn.onclick = () => {
          if (confirm("Quay về Sảnh chờ và đặt lại ván hiện tại?")) {
            resetGameToLobby(false);
          }
        };
      }

      const openFbTop = document.getElementById("btn-open-fb-top");
      if (openFbTop) {
        openFbTop.onclick = () => {
          activeModal = "firebase";
          renderHost();
        };
      }

      const editQBtn = document.getElementById("btn-edit-questions");
      if (editQBtn) {
        editQBtn.onclick = () => {
          activeModal = "questions";
          renderHost();
        };
      }

      const closeModal = document.getElementById("btn-close-modal");
      if (closeModal) {
        closeModal.onclick = () => {
          activeModal = null;
          renderHost();
        };
      }

      const saveFbBtn = document.getElementById("btn-save-fb");
      if (saveFbBtn) {
        saveFbBtn.onclick = async () => {
          const raw = document.getElementById("inp-fb-raw").value;
          const statusBox = document.getElementById("fb-test-status");
          statusBox.innerHTML = `<span style="color:var(--gold-bright);">⏳ Đang kết nối...</span>`;
          saveFbBtn.disabled = true;
          const res = await global.GameSync.testFirebaseConnection(raw, roomCode);
          saveFbBtn.disabled = false;
          if (!res.ok) {
            statusBox.innerHTML = `<span style="color:#fca5a5;">❌ ${esc(res.error)}</span>`;
            return;
          }
          global.GameSync.saveCustomFirebaseConfig(res.config);
          statusBox.innerHTML = `<span style="color:#86efac;">✅ Đã kết nối!</span>`;
          setTimeout(() => {
            const tok = global.GameSync.encodeDbToken(res.config.databaseURL);
            global.location.href = `${getBaseAppUrl()}?role=host&r=${encodeURIComponent(roomCode)}&d=${encodeURIComponent(tok)}`;
          }, 500);
        };
      }

      const clearFbBtn = document.getElementById("btn-clear-fb");
      if (clearFbBtn) {
        clearFbBtn.onclick = () => {
          global.GameSync.clearCustomFirebaseConfig();
          global.location.href = `${getBaseAppUrl()}?role=host&r=${encodeURIComponent(roomCode)}`;
        };
      }

      const saveQBtn = document.getElementById("btn-save-questions");
      if (saveQBtn) {
        saveQBtn.onclick = async () => {
          document.querySelectorAll(".q-edit-title").forEach((inp) => {
            const idx = Number(inp.dataset.idx);
            if (allQuestions[idx]) allQuestions[idx].question = inp.value.trim();
          });
          document.querySelectorAll(".q-edit-opt").forEach((inp) => {
            const idx = Number(inp.dataset.idx);
            const oIdx = Number(inp.dataset.oidx);
            if (allQuestions[idx]) allQuestions[idx].options[oIdx] = inp.value.trim();
          });
          allQuestions.forEach((q, idx) => {
            const checked = document.querySelector(`input[name="correct_${idx}"]:checked`);
            if (checked) q.correctIndex = Number(checked.value);
          });
          localStorage.setItem(CUSTOM_Q_KEY, JSON.stringify(allQuestions));
          activeModal = null;
          await sync.setState(roomCode, {
            ...(state || {}),
            phase: "lobby",
            roomCode,
            campaignMode,
            questionDurationSec,
            totalRounds: getActiveQuestions().length,
            roundIndex: 0,
            updatedAt: sync.now()
          });
          renderHost();
        };
      }

      const resetDefaultQBtn = document.getElementById("btn-reset-default-q");
      if (resetDefaultQBtn) {
        resetDefaultQBtn.onclick = () => {
          localStorage.removeItem(CUSTOM_Q_KEY);
          allQuestions = loadQuestionsBank();
          renderHost();
        };
      }

      const copyBtn = document.getElementById("btn-copy-link");
      if (copyBtn) {
        copyBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(buildJoinUrl());
            copyBtn.textContent = "✅ Đã Copy";
            setTimeout(() => (copyBtn.textContent = "📋 Copy Link"), 1800);
          } catch (_) {}
        };
      }

      const newCodeBtn = document.getElementById("btn-new-code");
      if (newCodeBtn) {
        newCodeBtn.onclick = () => {
          const rand = String(Math.floor(1000 + Math.random() * 9000));
          sessionStorage.setItem("dm_host_room", rand);
          const dbParam =
            sync.mode === "firebase" && sync.source !== "config_js" && sync.databaseURL
              ? `&d=${encodeURIComponent(global.GameSync.encodeDbToken(sync.databaseURL))}`
              : "";
          global.location.href = `${getBaseAppUrl()}?role=host&r=${rand}${dbParam}`;
        };
      }

      const selCampaign = document.getElementById("sel-campaign");
      if (selCampaign) {
        selCampaign.onchange = async (e) => {
          campaignMode = e.target.value;
          await sync.setState(roomCode, {
            ...(state || {}),
            phase: "lobby",
            roomCode,
            campaignMode,
            questionDurationSec,
            totalRounds: getActiveQuestions().length,
            roundIndex: 0,
            updatedAt: sync.now()
          });
        };
      }

      const selDuration = document.getElementById("sel-duration");
      if (selDuration) {
        selDuration.onchange = async (e) => {
          questionDurationSec = Number(e.target.value) || 20;
          await sync.setState(roomCode, {
            ...(state || {}),
            phase: "lobby",
            roomCode,
            campaignMode,
            questionDurationSec,
            totalRounds: getActiveQuestions().length,
            roundIndex: 0,
            updatedAt: sync.now()
          });
        };
      }

      const addBotsBtn = document.getElementById("btn-add-bots");
      if (addBotsBtn) addBotsBtn.onclick = add45ClassroomBots;

      const clearBotsBtn = document.getElementById("btn-clear-bots");
      if (clearBotsBtn) clearBotsBtn.onclick = removeAllBots;

      const kickAllBtn = document.getElementById("btn-kick-all");
      if (kickAllBtn) {
        kickAllBtn.onclick = () => {
          if (confirm("Xóa toàn bộ người chơi trong phòng này?")) {
            resetGameToLobby(true);
          }
        };
      }

      document.querySelectorAll("[data-kick]").forEach((btn) => {
        btn.onclick = () => {
          const pid = btn.getAttribute("data-kick");
          if (pid) sync.removePlayer(roomCode, pid);
        };
      });

      const startBtn = document.getElementById("btn-start-game");
      if (startBtn) {
        startBtn.onclick = async () => {
          global.SoundFX.unlock();
          await sync.clearSubmissions(roomCode);
          await startRound(0);
        };
      }

      const lockNowBtn = document.getElementById("btn-lock-now");
      if (lockNowBtn) lockNowBtn.onclick = lockAndRevealRound;

      const toLbBtn = document.getElementById("btn-to-leaderboard");
      if (toLbBtn) toLbBtn.onclick = showLeaderboardPhase;

      const nextRoundBtn = document.getElementById("btn-next-round");
      if (nextRoundBtn) nextRoundBtn.onclick = () => startRound(state.roundIndex + 1);

      const nextFromLbBtn = document.getElementById("btn-next-from-lb");
      if (nextFromLbBtn) nextFromLbBtn.onclick = () => startRound(state.roundIndex + 1);

      const finishPodiumBtn = document.getElementById("btn-finish-podium");
      if (finishPodiumBtn) finishPodiumBtn.onclick = finishGame;

      const finishFromLbBtn = document.getElementById("btn-finish-from-lb");
      if (finishFromLbBtn) finishFromLbBtn.onclick = finishGame;

      const exportCsvBtn = document.getElementById("btn-export-csv");
      if (exportCsvBtn) exportCsvBtn.onclick = exportScoresCSV;

      const playAgainBtn = document.getElementById("btn-play-again");
      if (playAgainBtn) playAgainBtn.onclick = () => resetGameToLobby(false);
    }

    sync.onConnectionChange((ok) => {
      isConnected = ok;
    });

    startHostTicker();
    bindRoomSubscriptions();
  }

  // =========================================================================
  // 3. MÀN HÌNH NGƯỜI CHƠI (MOBILE)
  // =========================================================================
  function initPlayerApp(root, sync, initialRoomCode) {
    const info = global.GAME_CONFIG.GROUP_INFO;
    let session = null;
    try {
      const raw = localStorage.getItem(PLAYER_SESSION_KEY);
      if (raw) session = JSON.parse(raw);
    } catch (_) {}

    let roomCode = (initialRoomCode || (session && session.roomCode) || info.defaultRoomCode || "1986").trim();
    let playerId = (session && session.id) || "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    let playerName = (session && session.name) || "";
    let playerAvatar = (session && session.avatar) || global.PLAYER_AVATARS[0].id;
    let joined = Boolean(session && session.joined && session.roomCode === roomCode && playerName);

    let state = null;
    let myScore = null;
    let selectedStrategy = "balanced";
    let lockedRoundIndex = -1;
    let lockedChoice = null;
    let lockedStrategy = "balanced";
    let triviaIndex = 0;

    let unsubState = null;
    let unsubMyScore = null;
    let unsubMyPlayer = null;
    let playerTicker = null;

    function saveSession(isJoined) {
      joined = isJoined;
      try {
        localStorage.setItem(
          PLAYER_SESSION_KEY,
          JSON.stringify({
            id: playerId,
            name: playerName,
            avatar: playerAvatar,
            roomCode,
            joined: isJoined
          })
        );
      } catch (_) {}
    }

    async function connectToRoom() {
      if (unsubState) unsubState();
      if (unsubMyScore) unsubMyScore();
      if (unsubMyPlayer) unsubMyPlayer();

      const now = sync.now();
      await sync.upsertPlayer(roomCode, {
        id: playerId,
        name: playerName,
        avatar: playerAvatar,
        isBot: false,
        joinedAt: now
      });

      await sync.ensurePlayerScore(roomCode, playerId, {
        id: playerId,
        money: info.startingCapital || 1000,
        correctCount: 0,
        answeredCount: 0,
        totalAnswerMs: 0,
        streak: 0,
        maxStreak: 0,
        boldWins: 0,
        rank: 1,
        prevRank: 1,
        midGameRank: 1,
        lastDelta: 0,
        lastReason: ""
      });

      let seenSelfOnce = false;
      unsubMyPlayer = sync.subscribeMyPlayer(roomCode, playerId, (me) => {
        if (me) {
          seenSelfOnce = true;
        } else if (seenSelfOnce && joined) {
          saveSession(false);
          renderPlayer();
        }
      });

      unsubMyScore = sync.subscribeMyScore(roomCode, playerId, (sc) => {
        const prevMoney = myScore ? myScore.money : null;
        myScore = sc;
        if (sc && prevMoney !== null && sc.money !== prevMoney) {
          if (sc.lastCorrect) global.SoundFX.correct();
          else if (sc.lastDelta < 0) global.SoundFX.wrong();
        }
        renderPlayer();
      });

      unsubState = sync.subscribeState(roomCode, (st) => {
        const prevRound = state ? state.roundIndex : -1;
        const prevPhase = state ? state.phase : null;
        state = st;

        if (st && st.phase === "question" && (prevPhase !== "question" || st.roundIndex !== prevRound)) {
          if (lockedRoundIndex !== st.roundIndex) {
            lockedChoice = null;
          }
        }
        if (st && st.phase === "lobby") {
          lockedRoundIndex = -1;
          lockedChoice = null;
        }
        renderPlayer();
      });
    }

    async function handleAnswerTap(choiceIdx) {
      if (!state || state.phase !== "question") return;
      if (lockedRoundIndex === state.roundIndex) return;

      const now = sync.now();
      const unlockAt = state.answerUnlockAt || state.roundStartedAt || now;
      if (now < unlockAt) return;

      global.SoundFX.click();
      if (navigator.vibrate) navigator.vibrate(35);

      lockedRoundIndex = state.roundIndex;
      lockedChoice = choiceIdx;
      lockedStrategy = selectedStrategy;
      renderPlayer();

      const elapsedMs = Math.max(250, now - unlockAt);
      await sync.submitAnswer(roomCode, state.roundIndex, playerId, {
        choice: choiceIdx,
        strategy: lockedStrategy,
        elapsedMs,
        submittedAt: now
      });
    }

    function startPlayerTicker() {
      if (playerTicker) clearInterval(playerTicker);
      playerTicker = setInterval(() => {
        if (!joined || !state || state.phase !== "question") return;

        const now = sync.now();
        const unlockAt = state.answerUnlockAt || state.roundStartedAt || now;
        const endsAt = state.roundEndsAt || now;
        const timerBadge = document.getElementById("player-live-timer");

        if (now < unlockAt) {
          const sec = Math.ceil((unlockAt - now) / 1000);
          if (timerBadge) timerBadge.textContent = `⏳ ${sec}s`;
          document.querySelectorAll(".player-opt-btn").forEach((b) => (b.disabled = true));
        } else {
          if (lockedRoundIndex !== state.roundIndex) {
            document.querySelectorAll(".player-opt-btn").forEach((b) => (b.disabled = false));
          }
          const rem = Math.max(0, Math.ceil((endsAt - now) / 1000));
          if (timerBadge) {
            timerBadge.textContent = rem > 0 ? `⏱️ ${rem}s` : "🔒 Hết giờ";
          }
        }
      }, 200);

      setInterval(() => {
        const el = document.getElementById("player-trivia-text");
        if (el && global.LOBBY_TRIVIA && global.LOBBY_TRIVIA.length) {
          triviaIndex = (triviaIndex + 1) % global.LOBBY_TRIVIA.length;
          el.textContent = global.LOBBY_TRIVIA[triviaIndex];
        }
      }, 6500);
    }

    function renderPlayer() {
      if (!joined) {
        root.innerHTML = `
          <main class="player-shell" style="justify-content:center;">
            <div style="background:var(--bg-panel);border:1.5px solid var(--border-warm);border-radius:22px;padding:22px 18px;box-shadow:var(--shadow-heavy);">
              <div style="text-align:center;margin-bottom:16px;">
                <span class="badge badge-era">★ ${esc(info.gameTitle)}</span>
                <h1 style="margin:10px 0 0;font-size:1.45rem;color:var(--gold-bright);">Tham Gia Phòng Chơi</h1>
              </div>

              <form id="form-player-join" style="display:flex;flex-direction:column;gap:14px;">
                <div>
                  <label style="display:block;font-size:0.8rem;font-weight:700;color:var(--text-dim);margin-bottom:5px;">MÃ PHÒNG</label>
                  <input id="inp-p-room" class="input-field" type="text" maxlength="8" value="${esc(roomCode)}" required style="text-align:center;font-size:1.25rem;letter-spacing:0.12em;font-weight:900;color:var(--gold-bright);" />
                </div>

                <div>
                  <label style="display:block;font-size:0.8rem;font-weight:700;color:var(--text-dim);margin-bottom:5px;">TÊN CỦA BẠN</label>
                  <input id="inp-p-name" class="input-field" type="text" maxlength="18" placeholder="Nhập tên..." value="${esc(playerName)}" required />
                </div>

                <div>
                  <label style="display:block;font-size:0.8rem;font-weight:700;color:var(--text-dim);margin-bottom:6px;">BIỂU TƯỢNG</label>
                  <div class="avatar-picker">
                    ${global.PLAYER_AVATARS.map(
                      (a) => `
                      <button type="button" class="avatar-option ${playerAvatar === a.id ? "selected" : ""}" data-av="${esc(a.id)}">
                        <span class="av-emo">${a.icon}</span>
                        <span class="av-lbl">${esc(a.title)}</span>
                      </button>
                    `
                    ).join("")}
                  </div>
                </div>

                <button type="submit" class="btn btn-gold btn-lg" style="width:100%;margin-top:4px;">
                  🚀 VÀO PHÒNG
                </button>
              </form>
            </div>
          </main>
        `;

        document.querySelectorAll("[data-av]").forEach((btn) => {
          btn.onclick = () => {
            playerAvatar = btn.getAttribute("data-av");
            renderPlayer();
          };
        });

        document.getElementById("form-player-join").onsubmit = async (e) => {
          e.preventDefault();
          global.SoundFX.unlock();
          const rVal = document.getElementById("inp-p-room").value.trim();
          const nVal = document.getElementById("inp-p-name").value.trim().slice(0, 18);
          if (!rVal || !nVal) return;
          roomCode = rVal;
          playerName = nVal;
          saveSession(true);
          await connectToRoom();
        };
        return;
      }

      const av = getAvatarObj(playerAvatar);
      const money = myScore ? myScore.money : info.startingCapital || 1000;
      const rank = myScore && myScore.rank ? `#${myScore.rank}` : "—";
      const streak = myScore ? myScore.streak || 0 : 0;

      let bodyHtml = "";

      if (!state || state.phase === "lobby") {
        const trivia = (global.LOBBY_TRIVIA && global.LOBBY_TRIVIA[triviaIndex]) || "";
        bodyHtml = `
          <div class="sealed-stamp-card" style="margin-top:10px;">
            <div class="stamp-seal">PHÒNG ${esc(roomCode)}</div>
            <div style="font-size:3rem;margin:6px 0;">${av.icon}</div>
            <h2 style="margin:0 0 4px;font-size:1.35rem;">${esc(playerName)}</h2>
            <p style="margin:0 0 14px;font-size:0.9rem;color:#5c4e43;">
              Vốn khởi đầu: <strong>${fmtMoney(money)} Vốn</strong>
            </p>
            <div style="background:#efe4cb;border-radius:12px;padding:12px;font-size:0.85rem;color:#3d2f24;line-height:1.45;">
              <strong>⏳ Đang chờ bắt đầu...</strong>
              <hr style="border:none;border-top:1px dashed #c2b295;margin:8px 0;"/>
              <span id="player-trivia-text">${esc(trivia)}</span>
            </div>
          </div>
          <button id="btn-leave-room" class="btn btn-ghost btn-sm" style="align-self:center;margin-top:8px;">
            ✎ Đổi tên / Đổi phòng
          </button>
        `;
      } else if (state.phase === "question" && state.questionData) {
        const q = state.questionData;
        const alreadyLocked = lockedRoundIndex === state.roundIndex && lockedChoice !== null;

        if (alreadyLocked) {
          const stObj = global.STRATEGIES[lockedStrategy] || global.STRATEGIES.balanced;
          bodyHtml = `
            <div class="sealed-stamp-card" style="margin-top:8px;">
              <div class="stamp-seal">ĐÃ CHỐT LỰA CHỌN</div>
              <div style="font-size:2.4rem;margin:6px 0;">🗳️</div>
              <h3 style="margin:0 0 6px;font-size:1.22rem;">
                Phương án <span style="color:var(--red-flag);">${LETTERS[lockedChoice]}</span>
              </h3>
              <p style="margin:0 0 12px;font-size:0.9rem;color:#4a3b31;">
                <strong>${stObj.icon} ${esc(stObj.name)} (${stObj.winMult}x)</strong>
              </p>
              <div id="player-live-timer" class="badge badge-era" style="font-size:0.92rem;">⏳ Chờ kết quả...</div>
            </div>
          `;
        } else {
          const now = sync.now();
          const isPrep = now < (state.answerUnlockAt || 0);

          bodyHtml = `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
              <span class="badge badge-era">Câu ${state.roundIndex + 1}/${state.totalRounds} · ${esc(q.yearLabel)}</span>
              <span id="player-live-timer" class="badge badge-gold">⏱️ ${state.questionDurationSec}s</span>
            </div>

            ${
              q.event
                ? `<div class="event-alert-banner ${esc(q.event.tone)}" style="padding:9px 12px;">
                    <div style="font-size:0.8rem;line-height:1.35;">
                      <strong style="color:var(--gold-bright);display:block;">${esc(q.event.badge)}</strong>
                      ${esc(q.event.desc)}
                    </div>
                  </div>`
                : ""
            }

            <div style="background:var(--bg-paper);color:var(--ink-dark);border-radius:14px;padding:12px 14px;border-left:5px solid var(--red-flag);">
              <div style="font-weight:800;font-size:0.98rem;line-height:1.35;">${esc(q.question)}</div>
            </div>

            <div class="strategy-selector">
              ${Object.values(global.STRATEGIES)
                .map((st) => {
                  const isAct = selectedStrategy === st.id;
                  return `
                    <button type="button" class="strat-btn ${isAct ? `active-${st.id}` : ""}" data-strat="${st.id}">
                      <span style="font-size:1.15rem;">${st.icon}</span>
                      <strong style="font-size:0.82rem;">${esc(st.name)} (${st.winMult}x)</strong>
                      <span style="font-size:0.66rem;color:var(--text-dim);">${st.id === "safe" ? "Sai: 0 trừ" : st.id === "balanced" ? "Sai: -10%" : "Sai: -25%"}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>

            <div class="player-options-stack">
              ${q.options
                .map(
                  (opt, idx) => `
                <button type="button" class="player-opt-btn opt-${idx}" data-choice="${idx}" ${isPrep ? "disabled" : ""}>
                  <span class="opt-letter" style="width:36px;height:36px;font-size:1.05rem;">${LETTERS[idx]}</span>
                  <span>${esc(opt)}</span>
                </button>
              `
                )
                .join("")}
            </div>
          `;
        }
      } else if ((state.phase === "reveal" || state.phase === "leaderboard") && state.questionData) {
        const q = state.questionData;
        const sc = myScore || {};
        const won = Boolean(sc.lastCorrect);
        const delta = sc.lastDelta || 0;
        const rankDiff = (sc.prevRank || sc.rank || 1) - (sc.rank || 1);

        bodyHtml = `
          <div style="background:${won ? "linear-gradient(145deg,#14532d,#14291d)" : "linear-gradient(145deg,#581c1c,#291414)"};border:2px solid ${
          won ? "#4ade80" : "#f87171"
        };border-radius:20px;padding:20px 16px;text-align:center;">
            <div style="font-size:2.6rem;">${won ? "🎉" : sc.lastStrategy === "safe" && delta === 0 ? "🛡️" : "💥"}</div>
            <h2 style="margin:6px 0 4px;font-size:1.4rem;">
              ${won ? "CHÍNH XÁC!" : delta === 0 ? "BẢO TOÀN VỐN!" : "CHƯA CHÍNH XÁC!"}
            </h2>
            <div style="font-size:1.65rem;font-weight:900;color:var(--gold-bright);margin:6px 0;">
              ${delta >= 0 ? `+${fmtMoney(delta)}` : fmtMoney(delta)} Vốn
            </div>
            <div style="font-size:0.84rem;color:#f1f5f9;margin-bottom:10px;">
              ${esc(sc.lastReason || "")}
            </div>
            <div style="display:inline-flex;gap:10px;background:rgba(0,0,0,0.32);padding:7px 14px;border-radius:999px;font-size:0.86rem;font-weight:800;">
              <span>Hạng <strong>#${sc.rank || "—"}</strong></span>
              ${
                rankDiff > 0
                  ? `<span style="color:#4ade80;">▲ +${rankDiff}</span>`
                  : rankDiff < 0
                  ? `<span style="color:#fca5a5;">▼ -${Math.abs(rankDiff)}</span>`
                  : ""
              }
            </div>
          </div>

          <div style="background:var(--bg-panel);border:1px solid var(--border-subtle);border-radius:15px;padding:14px;">
            <div style="font-size:0.78rem;color:var(--gold-bright);font-weight:800;margin-bottom:4px;">
              ✅ ĐÁP ÁN: ${LETTERS[q.correctIndex]}
            </div>
            <div style="font-weight:700;font-size:0.95rem;margin-bottom:8px;">
              ${esc(q.options[q.correctIndex])}
            </div>
            <div style="font-size:0.83rem;color:var(--text-dim);line-height:1.45;">
              ${esc(q.mcNote)}
            </div>
          </div>
        `;
      } else if (state.phase === "finished") {
        const sc = myScore || {};
        const finalRank = sc.rank || 1;
        const medal = finalRank === 1 ? "🥇 QUÁN QUÂN" : finalRank === 2 ? "🥈 HẠNG NHÌ" : finalRank === 3 ? "🥉 HẠNG BA" : `🎖️ HẠNG #${finalRank}`;

        bodyHtml = `
          <div class="sealed-stamp-card" style="margin-top:8px;">
            <div class="stamp-seal">KẾT QUẢ CHUNG CUỘC</div>
            <div style="font-size:2.8rem;margin:6px 0;">${av.icon}</div>
            <div style="font-weight:900;font-size:1.1rem;color:var(--red-flag);">${medal}</div>
            <h2 style="margin:4px 0 6px;font-size:1.45rem;">${esc(playerName)}</h2>
            <div style="font-size:1.75rem;font-weight:900;color:#b45309;margin-bottom:10px;">
              ${fmtMoney(sc.money || 1000)} Vốn
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#efe4cb;padding:12px;border-radius:12px;font-size:0.84rem;">
              <div>Số câu đúng<br/><strong>${sc.correctCount || 0} / ${state.totalRounds}</strong></div>
              <div>Chuỗi dài nhất<br/><strong>🔥 ${sc.maxStreak || 0}</strong></div>
            </div>
          </div>
        `;
      }

      root.innerHTML = `
        <main class="player-shell">
          <header class="player-topbar">
            <div style="display:flex;align-items:center;gap:8px;min-width:0;">
              <span style="font-size:1.35rem;">${av.icon}</span>
              <div style="min-width:0;">
                <div style="font-weight:800;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(playerName)}</div>
                <div style="font-size:0.73rem;color:var(--text-dim);">Hạng ${esc(rank)} ${streak >= 2 ? `· 🔥${streak}` : ""}</div>
              </div>
            </div>
            <div class="player-capital-pill">💰 ${fmtMoney(money)} Vốn</div>
          </header>

          ${bodyHtml}
        </main>
      `;

      const leaveBtn = document.getElementById("btn-leave-room");
      if (leaveBtn) {
        leaveBtn.onclick = async () => {
          await sync.removePlayer(roomCode, playerId);
          saveSession(false);
          renderPlayer();
        };
      }

      document.querySelectorAll("[data-strat]").forEach((btn) => {
        btn.onclick = () => {
          selectedStrategy = btn.getAttribute("data-strat");
          global.SoundFX.click();
          renderPlayer();
        };
      });

      document.querySelectorAll("[data-choice]").forEach((btn) => {
        btn.onclick = () => {
          const c = Number(btn.getAttribute("data-choice"));
          handleAnswerTap(c);
        };
      });
    }

    startPlayerTicker();
    if (joined) {
      connectToRoom();
    } else {
      renderPlayer();
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})(window);
