// 数値（例: 125000）を「12.5万」などの文字列に変換する関数
function formatPoints(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  
  if (num >= 100000000) {
    const oku = num / 100000000;
    return (num % 100000000 === 0 ? oku : parseFloat(oku.toFixed(2))) + '億';
  }
  if (num >= 10000) {
    const man = num / 10000;
    return (num % 10000 === 0 ? man : parseFloat(man.toFixed(2))) + '万';
  }
  return num.toLocaleString();
}

document.addEventListener('DOMContentLoaded', async () => {

  let gameData = { users: {}, events: [] };

  // ==========================================
  // 1. 複数JSONファイルの動的読み込み
  // ==========================================
  try {
    const [usersRes, eventsListRes] = await Promise.all([
      fetch('users.json'),
      fetch('events.json')
    ]);

    if (!usersRes.ok || !eventsListRes.ok) {
      throw new Error('基本ファイルの読み込みに失敗しました。');
    }

    gameData.users = await usersRes.json();
    const eventFiles = await eventsListRes.json();

    const eventFetches = eventFiles.map(filePath => fetch(filePath).then(res => res.json()));
    const rawEvents = await Promise.all(eventFetches);

    gameData.events = structureEventsData(rawEvents);

  } catch (error) {
    console.error('データ読み込みエラー:', error);
    alert('データの読み込みに失敗しました。ファイル構造やJSONの記述を確認してください。');
    return;
  }

  function structureEventsData(rawEvents) {
    const eventMap = {};

    rawEvents.forEach(item => {
      if (!eventMap[item.eventId]) {
        eventMap[item.eventId] = {
          id: item.eventId,
          name: item.eventName,
          history: []
        };
      }
      eventMap[item.eventId].history.push({
        date: item.date,
        records: item.records
      });
    });

    Object.values(eventMap).forEach(evt => {
      evt.history.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return Object.values(eventMap);
  }

  let currentUserId = null;

  // ==========================================
  // 2. タブ切り替え & 画面表示コントロール
  // ==========================================
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');

  function switchView(targetId) {
    viewSections.forEach(section => {
      if (section.id === `view-${targetId}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      switchView(item.getAttribute('data-target'));
    });
  });

  // ==========================================
  // 3. イベント一覧 & 詳細画面の描画
  // ==========================================
  const eventListContainer = document.getElementById('event-list-container');
  const eventHistoryContainer = document.getElementById('event-history-container');
  const detailEventTitle = document.getElementById('detail-event-title');

  function renderEventList() {
    eventListContainer.innerHTML = '';
    gameData.events.forEach(event => {
      const card = document.createElement('div');
      card.className = 'card event-card';
      card.innerHTML = `
        <div>
          <h4 style="margin:0 0 5px;">${event.name}</h4>
          <span class="hint">開催回数: ${event.history.length}回</span>
        </div>
        <span>➔</span>
      `;
      card.addEventListener('click', () => showEventDetail(event));
      eventListContainer.appendChild(card);
    });
  }

  function showEventDetail(event) {
      detailEventTitle.textContent = event.name;
      eventHistoryContainer.innerHTML = '';

      event.history.forEach(h => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // ▼ ポイントの高い順（降順）にソートする処理を追加
        const sortedRecords = [...h.records].sort((a, b) => b.points - a.points);

        let rowsHtml = sortedRecords.map(r => {
          const userName = gameData.users[r.userId] || '不明';
          return `
            <li class="score-item">
              <span>${userName}</span>
              <span class="points">${formatPoints(r.points)}</span>
            </li>
          `;
        }).join('');

        card.innerHTML = `
          <span class="date-badge">開催日: ${h.date}</span>
          <ul class="score-list">${rowsHtml}</ul>
        `;
        eventHistoryContainer.appendChild(card);
      });

      switchView('event-detail');
    }

  document.getElementById('back-to-events-btn').addEventListener('click', () => {
    switchView('home');
  });

  // ==========================================
  // 4. マイページのログイン＆個人データ表示
  // ==========================================
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const inputField = document.getElementById('member-id-input');
  const errorMsg = document.getElementById('login-error');
  const loginForm = document.getElementById('login-form');
  const userDashboard = document.getElementById('user-dashboard');

  loginBtn.addEventListener('click', () => {
    const id = inputField.value.trim();
    if (gameData.users[id]) {
      currentUserId = id;
      errorMsg.classList.add('hidden');
      loginForm.classList.add('hidden');
      userDashboard.classList.remove('hidden');

      document.getElementById('user-name').textContent = gameData.users[id];
      document.getElementById('user-id-display').textContent = id;

      renderPersonalData();
    } else {
      errorMsg.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', () => {
    currentUserId = null;
    inputField.value = '';
    userDashboard.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  function renderPersonalData() {
    const timelineContainer = document.getElementById('personal-timeline-view');
    const byEventContainer = document.getElementById('personal-by-event-view');
    
    timelineContainer.innerHTML = '';
    byEventContainer.innerHTML = '';

    let personalRecords = [];
    gameData.events.forEach(event => {
      event.history.forEach(h => {
        const rec = h.records.find(r => r.userId === currentUserId);
        if (rec) {
          personalRecords.push({
            eventId: event.id,
            eventName: event.name,
            date: h.date,
            points: rec.points
          });
        }
      });
    });

    personalRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (personalRecords.length === 0) {
      timelineContainer.innerHTML = '<p class="text-center hint">参加記録がありません。</p>';
      byEventContainer.innerHTML = '<p class="text-center hint">参加記録がありません。</p>';
      return;
    }

    // 1. 時系列表示
    personalRecords.forEach(r => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <span class="date-badge">${r.date}</span>
        <h4 style="margin:5px 0;">${r.eventName}</h4>
        <p class="points" style="margin:0; font-size:16px;">${formatPoints(r.points)}</p>
      `;
      timelineContainer.appendChild(card);
    });

    // 2. イベント別表示
    gameData.events.forEach(event => {
      const myEventRecords = personalRecords.filter(r => r.eventId === event.id);
      if (myEventRecords.length > 0) {
        const card = document.createElement('div');
        card.className = 'card';
        
        let listHtml = myEventRecords.map(r => `
          <li class="score-item">
            <span>${r.date}</span>
            <span class="points">${formatPoints(r.points)}</span>
          </li>
        `).join('');

        card.innerHTML = `
          <h4 style="margin:0 0 10px; color:var(--primary-color);">${event.name}</h4>
          <ul class="score-list">${listHtml}</ul>
        `;
        byEventContainer.appendChild(card);
      }
    });
  }

  // 表示切替タブ
  const tabTimeline = document.getElementById('tab-timeline');
  const tabByEvent = document.getElementById('tab-by-event');
  const timelineView = document.getElementById('personal-timeline-view');
  const byEventView = document.getElementById('personal-by-event-view');

  tabTimeline.addEventListener('click', () => {
    tabTimeline.classList.add('active');
    tabByEvent.classList.remove('active');
    timelineView.classList.remove('hidden');
    byEventView.classList.add('hidden');
  });

  tabByEvent.addEventListener('click', () => {
    tabByEvent.classList.add('active');
    tabTimeline.classList.remove('active');
    byEventView.classList.remove('hidden');
    timelineView.classList.add('hidden');
  });

  // 初期化実行
  renderEventList();
});
