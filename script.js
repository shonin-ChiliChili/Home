document.addEventListener('DOMContentLoaded', () => {
  const radialMenu = document.getElementById('radialMenu');
  const menuToggle = document.getElementById('menuToggle');

  // メニューボタンを押したときの処理
  menuToggle.addEventListener('click', (e) => {
    // 'active'クラスを付け外ししてアニメーションを発火させる
    radialMenu.classList.toggle('active');
    
    // イベントが親要素（document）に伝わらないようにブロックする
    e.stopPropagation();
  });

  // 画面全体（document）に対するクリック処理
  document.addEventListener('click', (e) => {
    // もしメニューが開いている状態なら
    if (radialMenu.classList.contains('active')) {
      // タップされた場所がメニュー全体(radialMenu)の内側でなければ閉じる
      if (!radialMenu.contains(e.target)) {
        radialMenu.classList.remove('active');
      }
    }
  });
});
