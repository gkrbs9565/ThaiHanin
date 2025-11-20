// 현재 로그인한 회원 이름을 localStorage 또는 쿼리스트링에서 가져오는 함수
function getLoggedInName() {
  // 1) localStorage에 로그인 회원 정보가 저장된 경우 사용
  try {
    // 상황에 따라 사용할 수 있는 후보 키들
    const candidateKeys = [
      "thaihanin_currentUser",
      "thaihanin_loginUser",
      "thaihanin_selectedMember"
    ];

    for (const key of candidateKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const user = JSON.parse(raw);
      if (user && typeof user === "object") {
        const name =
          (user.nameKr ||
            user.koreanName ||
            user.name ||
            user.fullNameKr ||
            "") + "";
        if (name.trim()) {
          return name.trim();
        }
      }
    }
  } catch (e) {
    console.error("로그인 회원 정보 파싱 오류:", e);
  }

  // 2) 쿼리스트링에서 name_kr 또는 name 읽기 (fallback)
  const qs = new URLSearchParams(window.location.search);
  const fromQuery = (qs.get("name_kr") || qs.get("name") || "").trim();
  return fromQuery;
}

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const nameBox = document.getElementById("menuUserName");

  const nameKr = getLoggedInName();

  // name 값이 있으면 로그인 상태로 간주
  if (nameKr) {
    body.classList.remove("is-guest");
    body.classList.add("is-member");

    if (nameBox) {
      nameBox.textContent = `${nameKr} 님`;
    }
  } else {
    // name 값이 없으면 비로그인 상태
    body.classList.remove("is-member");
    body.classList.add("is-guest");
  }
});

// exitMenu.js
// 전체 메뉴 페이지 상단 X 버튼 클릭 시 이전 페이지로 이동
// - 브라우저 history가 있으면 history.back()
// - 없는 경우(직접 접근 등)에는 메인(index.html)으로 이동

document.addEventListener("DOMContentLoaded", () => {
  // 메뉴 상단 우측 아이콘 영역에서 두 번째 버튼(X)을 찾는다.
  const headerRight = document.querySelector(".menu-header__right");
  if (!headerRight) return;

  const buttons = headerRight.querySelectorAll(".icon-button");
  if (!buttons || buttons.length < 2) return;

  const closeButton = buttons[1];

  closeButton.addEventListener("click", () => {
    // 이전 페이지 정보(referrer)가 있으면 뒤로가기,
    // 없으면 메인 페이지로 이동
    if (document.referrer && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "index.html";
    }
  });
});
