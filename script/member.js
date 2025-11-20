// 정회원(법인회원) 안내 페이지 스크립트
// 1) localStorage에 저장된 로그인 정보 + 회원 목록에서 현재 회원 정보를 찾아 상단에 표시
// 2) 정회원(법인회원) 혜택 안내 아코디언 동작

/**
 * 1. 회원 목록(thaihanin_users) + 현재 이메일(thaihanin_currentUserEmail 등) 기준으로 찾기
 *    - SignIn.js에서 회원가입 시 다음 형식으로 저장했다고 가정:
 *      localStorage["thaihanin_users"] = JSON.stringify([
 *        {
 *          email: "aaa@bbb.com",
 *          password: "...",
 *          nameKr: "홍길동",
 *          surnameEn: "HONG",
 *          givenNamesEn: "GILDONG",
 *          ...
 *        },
 *        ...
 *      ]);
 *
 * 2. 로그인 시에는 현재 로그인한 유저의 이메일을:
 *    - localStorage["thaihanin_currentUserEmail"] 또는
 *    - localStorage["thaihanin_logged_in_email"]
 *    같은 key에 저장한다고 가정한다.
 */

function getUserFromUsersList() {
  // 로그인 시 저장해 둔 "현재 로그인한 이메일" 후보 key
  var currentEmail =
    window.localStorage.getItem("thaihanin_currentUserEmail") ||
    window.localStorage.getItem("thaihanin_logged_in_email");

  if (!currentEmail) return null;

  var rawUsers = window.localStorage.getItem("thaihanin_users");
  if (!rawUsers) return null;

  var users;
  try {
    users = JSON.parse(rawUsers);
    if (!Array.isArray(users)) {
      return null;
    }
  } catch (e) {
    console.warn("회원 목록 JSON 파싱 실패:", e);
    return null;
  }

  // email이 일치하는 회원 찾기
  for (var i = 0; i < users.length; i++) {
    if (users[i] && users[i].email === currentEmail) {
      return users[i];
    }
  }
  return null;
}

// 예전/임시 구조에 대응하기 위한 보조 함수
function getUserFromLegacyKeys() {
  var candidateKeys = [
    "thaiHain_currentUser",
    "thaiHain_current_user",
    "thaihanin_currentUser",
    "thaihanin_current_user",
    "thaihanin_logged_in_member",
    "loggedInMember",
    "loggedInUser",
    "thaihanin_logged_in_email"
  ];

  for (var i = 0; i < candidateKeys.length; i++) {
    var key = candidateKeys[i];
    var raw = window.localStorage.getItem(key);
    if (!raw) continue;

    // 객체 형태로 저장된 경우
    if (typeof raw === "string" && raw.trim().charAt(0) === "{") {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.warn("현재 유저 정보 JSON 파싱 실패:", e);
      }
    } else {
      // 순수 문자열인 경우: email만 있는 최소 객체로 반환
      return { email: raw };
    }
  }

  return null;
}

function getCurrentUser() {
  var userFromList = getUserFromUsersList();
  if (userFromList) return userFromList;

  var legacyUser = getUserFromLegacyKeys();
  if (legacyUser) return legacyUser;

  return null;
}

document.addEventListener("DOMContentLoaded", function () {
  // ============================
  // 1. 상단 프로필 / Name 영역에 현재 로그인한 계정 정보 반영
  // ============================
  var currentUser = getCurrentUser();
  var currentUserEmail = currentUser && currentUser.email ? currentUser.email : null;

  if (currentUser) {
    // DOM 요소 가져오기
    var nameKrEl = document.querySelector(".basic-profile__name");
    var nameEnEl = document.querySelector(".basic-name-card__value");

    // 회원가입 당시 입력한 한글 이름
    // SignIn.js에서 nameKr로 저장했다고 가정
    var nameKr =
      currentUser.nameKr ||
      currentUser.name_kr ||
      currentUser.name ||
      currentUser.fullName ||
      "";

    // 회원가입 당시 입력한 여권 영문 이름 (성/이름)
    // SignIn.js에서 surnameEn / givenNamesEn 으로 저장했다고 가정
    var surnameEn =
      currentUser.surnameEn ||
      currentUser.passportSurname ||
      currentUser.passport_surname ||
      currentUser.surname ||
      currentUser.lastName ||
      "";
    var givenNamesEn =
      currentUser.givenNamesEn ||
      currentUser.givenEn ||
      currentUser.passportGivenname ||
      currentUser.passport_givenname ||
      currentUser.givenname ||
      currentUser.firstName ||
      "";

    var nameEnCombined = (surnameEn + " " + givenNamesEn).replace(/^\s+|\s+$/g, "");

    // 로그인 ID (이메일 / username 등)
    var loginId =
      currentUser.email || currentUser.id || currentUser.username || "";

    // 상단 큰 이름: 회원가입 당시 쓴 이름 기준
    if (nameKrEl) {
      if (nameKr) {
        // 예: "박유정 님"
        nameKrEl.textContent = nameKr + " 님";
      } else if (loginId) {
        // 이름 정보가 없으면 로그인 ID로 대체
        nameKrEl.textContent = loginId + " 님";
      }
    }

    // Name 행 오른쪽: 영문 이름이 있으면 영문, 없으면 로그인 ID
    if (nameEnEl) {
      if (nameEnCombined) {
        nameEnEl.textContent = nameEnCombined;
      } else if (loginId) {
        nameEnEl.textContent = loginId;
      }
    }

    // 회원 등급 표시 (기본값: 일반회원)
    var gradeEl = document.querySelector(".basic-profile__grade");
    if (gradeEl) {
      var grade =
        currentUser.grade ||
        currentUser.membershipGrade ||
        currentUser.memberType ||
        "일반회원";

      // 화면 표시용 텍스트
      gradeEl.textContent = grade;

      // 멤버십 before/after 토글
      // 공백 제거 후 "정회원" 또는 "법인회원" 문구가 포함되어 있으면 정회원으로 간주
      var normalizedGrade = (grade || "").replace(/\s+/g, "");
      var isFullMember =
        normalizedGrade.indexOf("정회원") !== -1 ||
        normalizedGrade.indexOf("법인회원") !== -1;

      var beforeEl = document.getElementById("memberBeforeUpgrade");
      var afterEl = document.getElementById("memberAfterUpgrade");

      if (beforeEl && afterEl) {
        if (isFullMember) {
          // 정회원/법인회원: 전환 안내 카드 숨기고, QR/쿠폰 영역 표시
          beforeEl.style.display = "none";
          afterEl.style.display = "block";
        } else {
          // 일반회원: 전환 안내 카드만 표시
          beforeEl.style.display = "block";
          afterEl.style.display = "none";
        }
      }

      // 정회원/법인회원일 때는 "무료 쿠폰" 섹션을 숨기고,
      // 상단 섹션 타이틀 문구를 "상시 혜택"으로 변경
      var freeCategory = document.getElementById("benefitFreeCategory");
      var benefitsTitleEl = document.querySelector(".basic-section__title");

      if (freeCategory && benefitsTitleEl) {
        if (isFullMember) {
          // 정회원/법인회원: 무료 쿠폰 안내 전체 숨김 + 제목 변경
          freeCategory.style.display = "none";
          benefitsTitleEl.textContent = "상시 혜택";
        } else {
          // 일반회원: 무료 쿠폰 포함 전체 안내 노출 + 원래 제목 복원
          freeCategory.style.display = "";
          benefitsTitleEl.textContent = "정회원(법인회원) 혜택 안내";
        }
      }

      // 추가: 정회원/법인회원일 때 "상시 혜택" 소제목(benefit-category__title)도 숨기기 (hr은 남김)
      var benefitCategoryTitles = document.querySelectorAll('.benefit-category__title');
      if (benefitCategoryTitles.length > 0) {
        if (isFullMember) {
          // 마지막 소제목이 "상시 혜택"임을 가정하고 숨김
          benefitCategoryTitles[benefitCategoryTitles.length - 1].style.display = "none";
        } else {
          // 일반회원: 원래대로 복원
          benefitCategoryTitles[benefitCategoryTitles.length - 1].style.display = "";
        }
      }
    }

    // 멤버십 카드(Name / Passport) 표시
    var cardNameEl = document.getElementById("memberCardName");
    var cardNameBeforeEl = document.getElementById("memberCardNameBefore");
    var cardPassportEl = document.getElementById("memberCardPassport");

    if (cardNameEl) {
      if (nameEnCombined) {
        cardNameEl.textContent = nameEnCombined;
        if (cardNameBeforeEl) cardNameBeforeEl.textContent = nameEnCombined;
      } else if (loginId) {
        cardNameEl.textContent = loginId;
        if (cardNameBeforeEl) cardNameBeforeEl.textContent = loginId;
      }
    }

    if (cardPassportEl) {
      var passportNo =
        currentUser.passportNo ||
        currentUser.passport_no ||
        currentUser.passportNumber ||
        currentUser.passport_number ||
        "";
      if (passportNo) {
        cardPassportEl.textContent = passportNo;
      }
    }

    var qrContainer = document.getElementById("membershipQr");
    if (qrContainer && typeof QRCode !== "undefined") {
      // 기본 이동 대상: GitHub Pages에 배포된 MemberVerification 페이지
      var baseUrl =
        currentUser.membershipQrUrl ||
        currentUser.membership_qr_url ||
        "https://gkrbs9565.github.io/ThaiHanin/MemberVerification.html";

      // QR에 실어 보낼 회원 정보 파라미터 구성
      var params = new URLSearchParams();

      if (loginId) params.set("email", loginId);
      if (nameKr) params.set("nameKr", nameKr);
      if (nameEnCombined) params.set("nameEn", nameEnCombined);
      if (typeof grade !== "undefined" && grade) params.set("grade", grade);
      if (typeof passportNo !== "undefined" && passportNo)
        params.set("passport", passportNo);

      // 현재 회원의 쿠폰 상태도 함께 실어 보냄 (mp / bria)
      if (typeof loadCouponState === "function") {
        var qrCouponState = loadCouponState();
        if (qrCouponState) {
          if (qrCouponState.mp) {
            params.set("couponMp", qrCouponState.mp);
          }
          if (qrCouponState.bria) {
            params.set("couponBria", qrCouponState.bria);
          }
        }
      }

      // 최종 QR 링크: baseUrl + ?파라미터 (정보가 없으면 쿼리스트링 없이 그대로 사용)
      var targetUrl = params.toString()
        ? baseUrl + "?" + params.toString()
        : baseUrl;

      // 기존 QR 내용 초기화
      qrContainer.innerHTML = "";

      new QRCode(qrContainer, {
        text: targetUrl,
        width: 160,
        height: 160,
      });
    }
  }

  // ============================
  // 2. 정회원(법인회원) 혜택 안내 아코디언
  //    - 한 번에 하나의 혜택만 펼쳐지도록 처리
  // ============================
  var benefitItems = document.querySelectorAll(".benefit");

  for (var j = 0; j < benefitItems.length; j++) {
    (function (item) {
      var header = item.querySelector(".benefit__header");
      var body = item.querySelector(".benefit__body");
      var icon = item.querySelector(".benefit__toggle img");

      if (!header || !body) return;

      // 초기 상태: 접힌 상태 유지
      body.style.maxHeight = "0px";

      header.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");

        // 1) 다른 모든 혜택은 먼저 닫기
        for (var k = 0; k < benefitItems.length; k++) {
          var other = benefitItems[k];
          if (other === item) continue; // 현재 클릭한 항목은 건너뛴다

          other.classList.remove("is-open");

          var otherBody = other.querySelector(".benefit__body");
          var otherIcon = other.querySelector(".benefit__toggle img");

          if (otherBody) {
            otherBody.style.maxHeight = "0px";
          }
          if (otherIcon) {
            otherIcon.style.transform = "rotate(0deg)";
          }
        }

        // 2) 현재 항목 토글 (닫혀 있으면 열고, 열려 있으면 닫기)
        if (isOpen) {
          // 이미 열려 있던 경우 -> 닫기
          item.classList.remove("is-open");
          body.style.maxHeight = "0px";
          if (icon) icon.style.transform = "rotate(0deg)";
        } else {
          // 닫혀 있던 경우 -> 열기
          item.classList.add("is-open");
          body.style.maxHeight = body.scrollHeight + "px";
          if (icon) icon.style.transform = "rotate(180deg)";
        }
      });
    })(benefitItems[j]);
  }
  // ============================
  // 3. 쿠폰 리스트 / 쿠폰 상세보기 모달
  // ============================
  // 쿠폰 상태 관리

  function getCouponStateKey() {
    return currentUserEmail
      ? "thaihanin_coupons_" + currentUserEmail
      : "thaihanin_coupons";
  }

  // 다양한 상태 문자열을 화면용 상태로 정규화
  // - "unused" / "available" / null  → "available"
  // - "used"                        → "used"
  // - "expired" / "disabled"        → "disabled"
  function normalizeCouponStatus(value) {
    if (value === "used") return "used";
    if (value === "expired" || value === "disabled") return "disabled";
    // 그 외(없음, unused, available 등)는 전부 사용 가능 처리
    return "available";
  }

  function loadCouponState() {
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

    // 2순위: 사용자별 localStorage 키(thaihanin_coupons_이메일)
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
    // 1) 사용자별 쿠폰 상태를 localStorage(thaihanin_coupons_이메일)에 저장
    window.localStorage.setItem(getCouponStateKey(), JSON.stringify(state));

    // 2) 현재 회원 객체의 couponStatus 필드도 함께 갱신
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

      // 3) thaihanin_users 배열 안의 해당 회원 데이터도 갱신
      try {
        var rawUsers = window.localStorage.getItem("thaihanin_users");
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
            window.localStorage.setItem("thaihanin_users", JSON.stringify(arr));
          }
        }
      } catch (e) {
        console.warn("회원 쿠폰 상태 갱신 실패:", e);
      }
    }
  }

  function applyCouponStatus(span, status) {
    if (!span) return;
    span.classList.remove(
      "coupon-item__status--available",
      "coupon-item__status--used",
      "coupon-item__status--disabled"
    );
    var text = "사용가능";
    if (status === "used") {
      span.classList.add("coupon-item__status--used");
      text = "사용완료";
    } else if (status === "disabled") {
      span.classList.add("coupon-item__status--disabled");
      text = "사용불가";
    } else {
      span.classList.add("coupon-item__status--available");
    }
    span.textContent = text;
  }

  var couponModal = document.getElementById("couponModal");
  var couponBackdrop = document.querySelector(".coupon-modal__backdrop");
  var couponCloseBtn = document.querySelector(".coupon-modal__close");
  var couponItems = document.querySelectorAll(".coupon-item");
  var couponDetails = document.querySelectorAll(".coupon-detail");

  var couponState = loadCouponState();

  function renderCouponState() {
    couponItems.forEach(function (item) {
      var key = item.getAttribute("data-coupon");
      var statusSpan = item.querySelector("[data-coupon-status]");
      if (!key || !statusSpan) return;
      var status = couponState[key] || "available";
      applyCouponStatus(statusSpan, status);
    });
  }

  renderCouponState();

  function openCouponModal(key) {
    if (!couponModal) return;
    couponDetails.forEach(function (detail) {
      var isTarget = detail.classList.contains("coupon-detail--" + key);
      detail.classList.toggle("is-active", isTarget);
    });
    couponModal.classList.add("is-open");
  }

  function closeCouponModal() {
    if (!couponModal) return;
    couponModal.classList.remove("is-open");
  }

  couponItems.forEach(function (item) {
    item.addEventListener("click", function () {
      var key = item.getAttribute("data-coupon");
      if (!key) return;
      openCouponModal(key);
    });
  });

  if (couponBackdrop) {
    couponBackdrop.addEventListener("click", closeCouponModal);
  }
  if (couponCloseBtn) {
    couponCloseBtn.addEventListener("click", closeCouponModal);
  }

  var couponUseButtons = document.querySelectorAll(".coupon-use-btn");
  couponUseButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-coupon");
      if (!key) return;
      if (!couponState) {
        couponState = loadCouponState();
      }
      if (couponState[key] === "used") {
        alert("이미 사용 완료된 쿠폰입니다.");
        return;
      }
      couponState[key] = "used";
      var otherKey = key === "mp" ? "bria" : "mp";
      couponState[otherKey] = "disabled";
      saveCouponState(couponState);
      renderCouponState();
      closeCouponModal();
    });
  });
});