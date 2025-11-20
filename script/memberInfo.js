// 회원 상세 정보 페이지 전용 스크립트
// - thaihanin_users 에서 회원 정보를 읽어와 화면에 표시
// - 관리자에서 선택한 회원이 있으면 그 회원, 아니면 현재 로그인한 회원을 사용

const USERS_KEY = "thaihanin_users";
const CURRENT_USER_EMAIL_KEY = "currentUserEmail";
const SELECTED_MEMBER_KEY = "thaihanin_selectedMember";

// 로컬스토리지에서 전체 회원 목록 불러오기
function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("회원 정보 파싱 오류", e);
    return [];
  }
}

// 어떤 회원을 보여줄지 결정 (관리자 선택 → 현재 로그인 순)
function getTargetUser() {
  let email = null;

  const selectedRaw = localStorage.getItem(SELECTED_MEMBER_KEY);
  if (selectedRaw) {
    try {
      const selected = JSON.parse(selectedRaw);
      if (selected && typeof selected.email === "string") {
        email = selected.email;
      }
    } catch (e) {
      console.error("선택된 회원 정보 파싱 오류", e);
    }
  }

  if (!email) {
    const current = localStorage.getItem(CURRENT_USER_EMAIL_KEY);
    if (current) {
      email = current;
    }
  }

  if (!email) return null;

  const users = loadUsers();
  const found = users.find(
    (u) => u && typeof u === "object" && typeof u.email === "string" && u.email === email
  );
  return found || null;
}

// 텍스트 노드에 값 넣기 (없으면 "-")
function setInfoText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (value === null || value === undefined || String(value).trim() === "") {
    el.textContent = "-";
  } else {
    el.textContent = String(value);
  }
}

// 이미지 + "제출된 이미지 없음" 토글
function setInfoImage(imgId, src) {
  const img = document.getElementById(imgId);
  if (!img) return;

  const box = img.closest(".member-info-image__box");
  const emptySpan = box ? box.querySelector(".member-info-image__empty") : null;

  if (src && typeof src === "string" && src.trim() !== "") {
    img.src = src;
    img.style.display = "block";
    if (emptySpan) emptySpan.style.display = "none";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
    if (emptySpan) emptySpan.style.display = "flex";
  }
}

// 쿠폰 상태 뱃지 HTML 생성
function getCouponBadgeHtml(state) {
  const normalized = (state || "unused").toLowerCase();

  if (normalized === "used") {
    return '<span class="coupon-status coupon-status--used">사용 완료</span>';
  }
  if (normalized === "expired") {
    return '<span class="coupon-status coupon-status--expired">기간 만료</span>';
  }
  if (normalized === "disabled") {
    return '<span class="coupon-status coupon-status--disabled">사용 불가</span>';
  }
  // 기본: 사용 가능
  return '<span class="coupon-status coupon-status--unused">사용 가능</span>';
}

// 쿠폰 상태 렌더링
function renderCouponStatus(user) {
  const container = document.getElementById("couponList");
  if (!container) return;

  const couponStatus = user.couponStatus || {};
  const mpState = couponStatus.mp || "unused";
  const briaState = couponStatus.bria || "unused";

  container.innerHTML = `
    <div class="member-info__row">
      <dt>MP Healthplus Clinic 무료 검진 쿠폰</dt>
      <dd>${getCouponBadgeHtml(mpState)}</dd>
    </div>
    <div class="member-info__row">
      <dt>Bangkok R.I.A Lab 무료 검진 쿠폰</dt>
      <dd>${getCouponBadgeHtml(briaState)}</dd>
    </div>
  `;
}

// 메인 렌더 함수
function renderMemberInfo() {
  const user = getTargetUser();

  if (!user) {
    console.warn("표시할 회원 정보를 찾을 수 없습니다.");
    return;
  }

  // 기본 정보
  setInfoText("infoNameKr", user.nameKr || user.name || "");

  // 여권이름(영문): 회원가입 시 입력한 성/이름 사용
  const nameEn =
    user.nameEn ||
    user.nameEN ||
    [user.surnameEn, user.givenEn].filter(Boolean).join(" ") ||
    [user.englishSurname, user.englishGivenName].filter(Boolean).join(" ") ||
    [user.passportSurname, user.passportGivenName].filter(Boolean).join(" ") ||
    user.passportName ||
    user.englishName ||
    "";
  setInfoText("infoNameEn", nameEn);

  setInfoText("infoEmail", user.email || "");
  setInfoText("infoBirth", user.birth || user.birthday || "");
  setInfoText("infoPhone", user.phone || user.mobile || user.mobileNumber || "");

  // 여권번호 (정회원 신청 시 저장된 값)
  const passportNumber =
    user.passportNumber ||
    user.passportNo ||
    user.passport ||
    "";
  setInfoText("infoPassportNumber", passportNumber);

  // 회원 등급 / 신청 상태
  setInfoText("infoGrade", user.grade || "일반회원");
  setInfoText("infoApplyStatus", user.applyStatus || "미신청");

  // 제출 서류 이미지
  setInfoImage("infoPassportImage", user.passportImage);
  setInfoImage("infoPaymentImage", user.paymentImage);
  setInfoImage("infoProfileImage", user.profileImage);

  // 쿠폰 상태
  renderCouponStatus(user);
}

document.addEventListener("DOMContentLoaded", () => {
  renderMemberInfo();
});
