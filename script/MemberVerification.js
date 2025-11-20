// MemberVerification.js
// 회원 인증 성공 페이지 전용 스크립트
// - 현재 로그인한 회원 정보 불러오기
// - 이름 / 등급 / 여권번호 표시
// - 쿠폰 상태(2종) 표시 및 사용 처리
// - 쿠폰 상세보기 모달
// - 상시 혜택(accordion) 열기/닫기

// =======================================
// 0. 공통 상수 및 현재 회원 로드
// =======================================
var USERS_KEY = "thaihanin_users";
var CURRENT_USER_EMAIL_KEY = "currentUserEmail";

var currentUser = null;
var currentUserEmail = null;
var couponStateFromUrl = null;

// URL 파라미터로 전달된 회원 정보 읽기 (QR에서 넘어온 값)
function initUserFromUrlParams() {
  try {
    var params = new URLSearchParams(window.location.search);
    var email = params.get("email");
    var nameKr = params.get("nameKr");
    var nameEn = params.get("nameEn");
    var grade = params.get("grade");
    var passport = params.get("passport");
    var couponMp = params.get("couponMp");
    var couponBria = params.get("couponBria");

    // 아무 값도 없으면 URL 파라미터 방식은 사용하지 않음
    if (
      !email &&
      !nameKr &&
      !nameEn &&
      !grade &&
      !passport &&
      !couponMp &&
      !couponBria
    ) {
      return null;
    }

    // URL 파라미터 기반의 간단한 회원 객체 구성
    var user = {
      email: email || "",
      nameKr: nameKr || "",
      grade: grade || ""
    };

    // 영문 이름은 nameEn 필드에 저장 (getUserNameEn에서 nameEn/englishName도 참고함)
    if (nameEn) {
      user.nameEn = nameEn;
      user.englishName = nameEn;
    }

    if (passport) {
      user.passportNumber = passport;
    }

    currentUser = user;
    currentUserEmail = email || null;

    // URL로 전달된 쿠폰 상태가 있으면 전역 변수에 저장
    if (couponMp || couponBria) {
      couponStateFromUrl = {
        mp: couponMp,
        bria: couponBria
      };
    }

    // URL에서 쿼리스트링 제거 (정보는 JS에 남고, 주소창만 깨끗하게)
    if (window.history && window.history.replaceState) {
      var cleanUrl =
        window.location.origin +
        window.location.pathname +
        window.location.hash;
      window.history.replaceState(null, "", cleanUrl);
    }

    return user;
  } catch (e) {
    console.warn("URL 파라미터에서 회원 정보 읽기 실패:", e);
    return null;
  }
}

// 현재 로그인한 회원 정보 로드
function initCurrentUser() {
  try {
    var email = window.localStorage.getItem(CURRENT_USER_EMAIL_KEY);
    if (!email) {
      console.warn("currentUserEmail 없음");
      return;
    }

    var raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) {
      console.warn("thaihanin_users 없음");
      return;
    }

    var users = JSON.parse(raw);
    if (!Array.isArray(users)) {
      console.warn("users 배열 아님");
      return;
    }

    var user = users.find(function (u) {
      return u && typeof u === "object" && u.email === email;
    });

    if (!user) {
      console.warn("현재 회원 정보 찾을 수 없음");
      return;
    }

    currentUser = user;
    currentUserEmail = email;
  } catch (e) {
    console.warn("현재 회원 로드 실패:", e);
  }
}

// =======================================
// 1. 회원 카드 / 기본 정보 표시
// =======================================

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function getUserNameKr(user) {
  return (
    user.nameKr ||
    user.name_kr ||
    user.korName ||
    user.koreanName ||
    user.name ||
    ""
  );
}

function getUserNameEn(user) {
  // 성 + 이름 조합
  var surname =
    user.surnameEn ||
    user.surname_en ||
    user.familyNameEn ||
    user.passportSurname ||
    user.passport_surname ||
    "";
  var given =
    user.givenNamesEn ||
    user.givenEn ||
    user.passportGivenname ||
    user.passport_givenname ||
    user.givenname ||
    user.firstName ||
    "";

  var combined = (surname + " " + given).trim();
  if (combined) return combined;

  // 그래도 없으면 하나라도 있는 값 반환
  return (
    surname ||
    given ||
    user.englishName ||
    user.nameEn ||
    user.name_en ||
    ""
  );
}

function getUserPassportNumber(user) {
  return (
    user.passportNumber ||
    user.passportNo ||
    user.passport_no ||
    user.passport ||
    ""
  );
}

function renderMemberCard() {
  var nameEl = document.querySelector(".basic-profile__name");
  var gradeEl = document.querySelector(".basic-profile__grade");
  var cardNameEl = document.getElementById("memberCardName");
  var cardPassportEl = document.getElementById("memberCardPassport");

  if (!currentUser) {
    if (nameEl) nameEl.textContent = "회원 님";
    if (gradeEl) gradeEl.textContent = "회원등급";
    if (cardNameEl) cardNameEl.textContent = "";
    if (cardPassportEl) cardPassportEl.textContent = "";
    return;
  }

  var nameKr = getUserNameKr(currentUser);
  var nameEn = getUserNameEn(currentUser);
  var grade = currentUser.grade || "일반회원";
  var passportNumber = getUserPassportNumber(currentUser);

  if (nameEl) {
    nameEl.textContent = (nameKr || "회원") + " 님";
  }
  if (gradeEl) {
    gradeEl.textContent = grade;
  }
  if (cardNameEl) {
    cardNameEl.textContent = nameEn || nameKr || "";
  }
  if (cardPassportEl) {
    cardPassportEl.textContent = passportNumber || "-";
  }
}

// =======================================
// 2. 쿠폰 상태 관리 (MP / BRIA)
// =======================================

// 쿠폰 상태 키 (로그인한 회원별 구분)
function getCouponStateKey() {
  return currentUserEmail
    ? "thaihanin_coupons_" + currentUserEmail
    : "thaihanin_coupons";
}

// 화면용 상태로 정규화
// - "unused" / "available" / null  → "available"
// - "used"                        → "used"
// - "expired" / "disabled"        → "disabled"
function normalizeCouponStatus(value) {
  if (value === "used") return "used";
  if (value === "expired" || value === "disabled") return "disabled";
  return "available";
}

function loadCouponState() {
  // 0순위: QR URL 파라미터로 들어온 쿠폰 상태가 있으면 그 값을 그대로 사용
  if (couponStateFromUrl) {
    return {
      mp: normalizeCouponStatus(couponStateFromUrl.mp),
      bria: normalizeCouponStatus(couponStateFromUrl.bria)
    };
  }

  // 1순위: 현재 로그인한 회원 객체에 couponStatus가 있는 경우
  if (
    currentUser &&
    currentUser.couponStatus &&
    typeof currentUser.couponStatus === "object" &&
    !Array.isArray(currentUser.couponStatus)
  ) {
    var src = currentUser.couponStatus;
    return {
      mp: normalizeCouponStatus(src.mp),
      bria: normalizeCouponStatus(src.bria)
    };
  }

  // 2순위: 사용자별 localStorage 키(thaihanin_coupons_이메일)에 저장된 값
  var raw = window.localStorage.getItem(getCouponStateKey());
  if (!raw) {
    return { mp: "available", bria: "available" };
  }
  try {
    var obj = JSON.parse(raw);
    return {
      mp: normalizeCouponStatus(obj.mp),
      bria: normalizeCouponStatus(obj.bria)
    };
  } catch (e) {
    console.warn("쿠폰 상태 파싱 실패:", e);
    return { mp: "available", bria: "available" };
  }
}

function saveCouponState(state) {
  // 1) per-user coupons 키 갱신
  window.localStorage.setItem(getCouponStateKey(), JSON.stringify(state));

  // 2) 현재 로그인한 회원 객체의 couponStatus 필드도 함께 갱신
  if (currentUser) {
    // 화면용 "available"은 데이터상 "unused"로 저장
    var toUserStatus = function (v) {
      if (v === "used") return "used";
      if (v === "disabled") return "disabled";
      return "unused";
    };

    var updatedStatus = {
      mp: toUserStatus(state.mp),
      bria: toUserStatus(state.bria)
    };
    currentUser.couponStatus = updatedStatus;

    // 3) thaihanin_users 배열 안의 해당 회원 레코드도 갱신
    try {
      var rawUsers = window.localStorage.getItem(USERS_KEY);
      if (rawUsers) {
        var arr = JSON.parse(rawUsers);
        if (Array.isArray(arr)) {
          for (var i = 0; i < arr.length; i++) {
            var u = arr[i];
            if (u && u.email === currentUserEmail) {
              arr[i] = Object.assign({}, u, { couponStatus: updatedStatus });
              break;
            }
          }
          window.localStorage.setItem(USERS_KEY, JSON.stringify(arr));
        }
      }
    } catch (e) {
      console.warn("회원 쿠폰 상태 갱신 실패:", e);
    }
  }
}

// =======================================
// 3. 쿠폰 버튼/모달 UI
// =======================================

function applyCouponStateToButtons(state) {
  var items = document.querySelectorAll(".coupon-item");
  items.forEach(function (btn) {
    var type = btn.getAttribute("data-coupon"); // "mp" or "bria"
    if (!type || !state[type]) return;

    var statusSpan = btn.querySelector("[data-coupon-status]");
    var s = state[type]; // "available" / "used" / "disabled"

    // 버튼 비활성/활성만 여기서 처리
    if (s === "used" || s === "disabled") {
      btn.disabled = true;
    } else {
      btn.disabled = false;
    }

    if (!statusSpan) return;

    // 상태 배지(span)에 붙는 클래스 초기화
    statusSpan.classList.remove(
      "coupon-item__status--available",
      "coupon-item__status--used",
      "coupon-item__status--disabled"
    );

    // 상태에 따라 span 텍스트 + 클래스 부여
    if (s === "used") {
      statusSpan.classList.add("coupon-item__status--used");
      statusSpan.textContent = "사용 완료";
    } else if (s === "disabled") {
      statusSpan.classList.add("coupon-item__status--disabled");
      statusSpan.textContent = "사용 불가";
    } else {
      statusSpan.classList.add("coupon-item__status--available");
      statusSpan.textContent = "사용가능";
    }
  });
}

function openCouponModal(couponType) {
  var modal = document.getElementById("couponModal");
  if (!modal) return;

  var details = modal.querySelectorAll(".coupon-detail");
  details.forEach(function (el) {
    el.classList.remove("is-active");
  });

  if (couponType === "mp") {
    var mpDetail = modal.querySelector(".coupon-detail--mp");
    if (mpDetail) mpDetail.classList.add("is-active");
  } else if (couponType === "bria") {
    var briaDetail = modal.querySelector(".coupon-detail--bria");
    if (briaDetail) briaDetail.classList.add("is-active");
  }

  modal.setAttribute("aria-hidden", "false");
  modal.classList.add("is-open");
}

function closeCouponModal() {
  var modal = document.getElementById("couponModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  modal.classList.remove("is-open");
}

function initCouponUI() {
  var state = loadCouponState();
  applyCouponStateToButtons(state);

  // 쿠폰 아이템 클릭 → 상세 모달 열기
  var couponButtons = document.querySelectorAll(".coupon-item");
  couponButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var type = btn.getAttribute("data-coupon"); // "mp" / "bria"
      var currentState = loadCouponState();
      if (!type) return;

      // 현재 쿠폰 상태가 사용가능일 때만 열기
      if (currentState[type] !== "available") {
        return;
      }

      openCouponModal(type);
    });
  });

  // 모달 닫기 (X 버튼 / 배경 클릭)
  var modal = document.getElementById("couponModal");
  if (modal) {
    var closeBtn = modal.querySelector(".coupon-modal__close");
    var backdrop = modal.querySelector(".coupon-modal__backdrop");

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeCouponModal();
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        closeCouponModal();
      });
    }

    // "이 쿠폰 사용하기" 버튼들
    var useButtons = modal.querySelectorAll(".coupon-use-btn");
    useButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var type = btn.getAttribute("data-coupon"); // "mp" / "bria"
        if (!type) return;

        var confirmUse = window.confirm(
          "이 쿠폰을 사용 처리하시겠습니까?\n사용 후에는 되돌릴 수 없습니다."
        );
        if (!confirmUse) return;

        var currentState = loadCouponState();
        if (currentState[type] !== "available") {
          alert("이미 사용되었거나 사용 불가한 쿠폰입니다.");
          return;
        }

        // 하나를 사용하면 다른 하나는 자동으로 사용 불가 처리
        var nextState = {
          mp: normalizeCouponStatus(currentState.mp),
          bria: normalizeCouponStatus(currentState.bria)
        };

        if (type === "mp") {
          nextState.mp = "used";
          nextState.bria = "disabled";
        } else if (type === "bria") {
          nextState.bria = "used";
          nextState.mp = "disabled";
        }

        saveCouponState(nextState);
        applyCouponStateToButtons(nextState);
        closeCouponModal();
        alert("쿠폰 사용 처리되었습니다.");
      });
    });
  }
}

// =======================================
// 4. 상시 혜택(accordion) 열기/닫기
// =======================================

function initBenefitAccordion() {
  // 모든 혜택 body를 접은 상태로 초기화
  var benefitArticles = document.querySelectorAll(".benefit");
  benefitArticles.forEach(function (article) {
    var body = article.querySelector(".benefit__body");
    if (!body) return;
    body.style.overflow = "hidden";
    body.style.maxHeight = "0px";
  });

  var headers = document.querySelectorAll(".benefit__header");
  headers.forEach(function (header) {
    header.addEventListener("click", function () {
      var article = header.closest(".benefit");
      if (!article) return;
      var body = article.querySelector(".benefit__body");
      if (!body) return;

      var isOpen = article.classList.contains("is-open");

      // 모든 혜택 접기
      benefitArticles.forEach(function (otherArticle) {
        var otherBody = otherArticle.querySelector(".benefit__body");
        if (!otherBody) return;
        otherArticle.classList.remove("is-open");
        otherBody.style.maxHeight = "0px";
      });

      // 클릭한 것만 열기/닫기
      if (!isOpen) {
        article.classList.add("is-open");
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });
}

// =======================================
// 5. 초기화
// =======================================

document.addEventListener("DOMContentLoaded", function () {
  // 1순위: QR에서 넘어온 URL 파라미터 기반 회원 정보 사용
  var paramUser = initUserFromUrlParams();

  // URL 파라미터에 회원 정보가 없을 때만 localStorage에서 로드
  if (!paramUser) {
    initCurrentUser();
  }

  renderMemberCard();
  initCouponUI();
  initBenefitAccordion();
});