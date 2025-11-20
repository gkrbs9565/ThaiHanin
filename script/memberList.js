const STORAGE_KEY = "thaihanin_users";

// ------------------------------------------------------
// 회원 관리 (관리자용) 스크립트
// - localStorage에 저장된 회원 목록을 읽어와 테이블에 표시
// - 등급(일반회원/정회원/법인회원)을 변경 후 저장 가능
// - 정회원 신청 상태(requestGrade)도 함께 확인
// ------------------------------------------------------

// localStorage에서 전체 회원 배열 로드
function loadUsers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("thaihaninUsers 파싱 오류:", e);
    return [];
  }
}

// localStorage에 전체 회원 배열 저장
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// requestGrade 값을 화면에 보여줄 텍스트로 변환
function formatRequestGrade(user) {
  // 정회원/법인회원 신청 상태 (업그레이드 페이지에서 저장한 값)
  if (user.applyStatus) {
    // 예: "신청중", "승인", "반려" 등 문자열 그대로 노출
    return String(user.applyStatus);
  }

  // 예전 방식: requestGrade 값이 있으면 그대로 매핑
  const req = user.requestGrade;
  if (!req) return "미신청";

  if (req === "정회원요청") return "정회원 신청";
  if (req === "법인회원요청") return "법인회원 신청";

  // 혹시 다른 값이 들어온 경우 그대로 노출
  return String(req);
}

// grade(등급)를 사람이 보기 좋은 텍스트로 정리
function formatGrade(user) {
  if (!user.grade) return "일반회원";
  return String(user.grade);
}

// 회원 테이블 렌더링
function renderMemberTable() {
  const users = loadUsers();
  const tbody = document.getElementById("memberTableBody");

  if (!tbody) {
    console.warn("memberTableBody 요소를 찾을 수 없습니다.");
    return;
  }

  tbody.innerHTML = "";

  if (!users.length) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td colspan="6" class="member-table__empty">등록된 회원이 없습니다.</td>';
    tbody.appendChild(tr);
    return;
  }

  users.forEach((user, index) => {
    const tr = document.createElement("tr");
    const safeEmail = user.email || "";
    const safeName = user.nameKr || user.name || "-";

    const currentGrade = formatGrade(user);
    const requestText = formatRequestGrade(user);

    tr.setAttribute("data-email", safeEmail);

    tr.innerHTML = `
      <td>${safeName}</td>
      <td>${safeEmail}</td>
      <td>${currentGrade}</td>
      <td>${requestText}</td>
      <td>
        <button
          type="button"
          class="member-detail-btn"
          data-index="${index}"
          data-email="${safeEmail}"
        >
          상세보기
        </button>
      </td>
      <td>
        <div class="member-action">
          <select
            class="member-grade-select"
            data-email="${safeEmail}"
          >
            <option value="일반회원" ${
              currentGrade === "일반회원" ? "selected" : ""
            }>일반회원</option>
            <option value="정회원" ${
              currentGrade === "정회원" ? "selected" : ""
            }>정회원</option>
            <option value="법인회원" ${
              currentGrade === "법인회원" ? "selected" : ""
            }>법인회원</option>
          </select>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// 테이블 내 클릭 처리 (상세보기 전용)
function handleMemberTableClick(event) {
  const target = event.target;

  // 상세보기 버튼 클릭
  if (target.classList.contains("member-detail-btn")) {
    handleDetailClick(target);
    return;
  }
}

// 등급 셀렉트 변경 시 자동 저장
function handleMemberTableChange(event) {
  const select = event.target.closest(".member-grade-select");
  if (!select) return;

  const email = select.getAttribute("data-email");
  if (!email) return;

  const newGrade = select.value;
  const users = loadUsers();
  const user = users.find((u) => u.email === email);

  if (!user) return;

  // 등급 업데이트
  user.grade = newGrade;

  // 정회원으로 변경된 경우 신청 상태를 승인완료로 변경
  if (newGrade === "정회원") {
    user.applyStatus = "승인완료";
  }

  // 정회원/법인회원 요청 상태가 있었다면 승인 후 초기화
  if (
    user.requestGrade === "정회원요청" &&
    newGrade === "정회원"
  ) {
    user.requestGrade = null;
  } else if (
    user.requestGrade === "법인회원요청" &&
    newGrade === "법인회원"
  ) {
    user.requestGrade = null;
  }

  saveUsers(users);
  renderMemberTable();
}

// 상세보기 버튼 클릭 처리
function handleDetailClick(target) {
  const email = target.getAttribute("data-email");
  if (!email) return;

  // memberInfo.js에서 사용하는 키에 이메일만 저장
  localStorage.setItem("thaihanin_admin_viewEmail", email);

  // 상세 정보 페이지로 이동
  window.location.href = "memberInfo.html";
}

// 새로고침 버튼 클릭 처리
function handleRefreshClick() {
  renderMemberTable();
}

// 초기 바인딩
document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("memberTableBody");
  if (tbody) {
    tbody.addEventListener("click", handleMemberTableClick);
    tbody.addEventListener("change", handleMemberTableChange);
  }

  const btnRefresh = document.getElementById("btnMemberRefresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", handleRefreshClick);
  }

  // 최초 렌더링
  renderMemberTable();
});
