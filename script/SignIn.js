const STORAGE_KEY = "thaihanin_users";

// memberList.js
// 회원 목록 표시 및 관리 스크립트

function loadUsers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  let users = [];
  try {
    users = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(users)) {
      users = [];
    }
  } catch (e) {
    users = [];
  }

  // 각 사용자에 기본 등급이 없으면 "일반회원"으로 설정 및 쿠폰 상태 초기값 세팅
  users = users.map((user) => {
    if (!user || typeof user !== "object") return user;

    // 기존 사용자 데이터 복사
    const updated = { ...user };

    // 기본 등급이 없으면 "일반회원"으로 설정
    if (!updated.grade) {
      updated.grade = "일반회원";
    }

    // 쿠폰 상태 초기값 세팅
    // - 객체 형태가 아니거나 배열인 경우 모두 새 구조로 맞춘다.
    if (
      !updated.couponStatus ||
      typeof updated.couponStatus !== "object" ||
      Array.isArray(updated.couponStatus)
    ) {
      let mpStatus = "unused";
      let briaStatus = "unused";

      // 기존에 coupons 배열을 사용하고 있었다면 그 값으로부터 마이그레이션
      if (Array.isArray(updated.coupons)) {
        const c1 = updated.coupons[0];
        const c2 = updated.coupons[1];
        if (c1 && c1.status) mpStatus = c1.status;
        if (c2 && c2.status) briaStatus = c2.status;
      }

      updated.couponStatus = {
        mp: mpStatus,   // MP Lab 무료 검진 쿠폰
        bria: briaStatus, // BRia Lab 무료 검진 쿠폰
      };
    }

    return updated;
  });

  return users;
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// ----------------------------------------
// 회원가입 입력 제약 조건 & 공통 유효성 검사
// ----------------------------------------

// 이메일 입력: 영문/숫자/일부 특수문자만 허용
function filterEmailInput(value) {
  // 영문, 숫자, @ . _ - 만 허용
  return value.replace(/[^A-Za-z0-9@._-]/g, "");
}

// 이메일 형식: @ 1개, @ 뒤에 . 이 최소 1개 포함
function isValidEmailFormat(value) {
  const pattern = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return pattern.test(value);
}

// 한글 이름: 한글 + 공백만 허용
function filterKoreanName(value) {
  return value.replace(/[^\u3131-\uD79D\s]/g, "");
}

// 영문 대문자 전용(여권 이름 등)
function filterEnglishUpper(value) {
  const onlyLettersSpace = value.replace(/[^A-Za-z\s]/g, "");
  return onlyLettersSpace.toUpperCase();
}

// 숫자만 (전화번호 등)
function filterDigits(value) {
  return value.replace(/[^0-9]/g, "");
}

// ----------------------------------------
// DOM 로드 후, 실제 입력 필드에 제약 조건 적용
// - 존재하는 요소에만 적용되도록 방어코드 포함
// ----------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // 이메일 입력: 첫 번째 email 타입 또는 id/name 기반으로 탐색
  const emailInput =
    document.querySelector("input[type='email']") ||
    document.getElementById("signupEmail") ||
    document.getElementById("email");

  if (emailInput) {
    emailInput.addEventListener("input", (event) => {
      const filtered = filterEmailInput(event.target.value);
      if (filtered !== event.target.value) {
        event.target.value = filtered;
      }
    });

    emailInput.addEventListener("blur", (event) => {
      const value = event.target.value.trim();
      if (!value) return;
      if (!isValidEmailFormat(value)) {
        // 형식이 맞지 않으면 간단히 기존 값만 유지 (추가 경고는 회원가입 제출 시 처리)
        console.warn("잘못된 이메일 형식:", value);
      }
    });
  }

  // 한글 이름 입력: id/name에 "signupNameKr", "name_kr" 포함하는 필드를 우선 탐색, 기존 fallback 유지
  const koreanNameInput =
    document.getElementById("signupNameKr") ||
    document.querySelector("input[name='name_kr']") ||
    document.getElementById("nameKr") ||
    document.querySelector("input[name='nameKr']") ||
    document.querySelector("input[id*='NameKr']") ||
    document.querySelector("input[name*='koreanName']");

  if (koreanNameInput) {
    koreanNameInput.addEventListener("input", (event) => {
      const filtered = filterKoreanName(event.target.value);
      if (filtered !== event.target.value) {
        event.target.value = filtered;
      }
    });
  }

  // 여권 영문 성 입력: 실제 필드 id/name 추가 반영
  const passportSurnameInput =
    document.getElementById("signupSurname") ||            // 여권 성 (영문)
    document.querySelector("input[name='passport_surname']") ||
    document.getElementById("surnameEn") ||
    document.querySelector("input[name='surnameEn']") ||
    document.querySelector("input[id*='SurnameEn']");

  // 여권 영문 이름 입력: 실제 필드 id/name 추가 반영
  const passportGivenInput =
    document.getElementById("signupGivenNames") ||         // 여권 이름 (영문)
    document.querySelector("input[name='passport_given']") ||
    document.getElementById("givennameEn") ||
    document.querySelector("input[name='givennameEn']") ||
    document.querySelector("input[id*='GivenEn']");

  [passportSurnameInput, passportGivenInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", (event) => {
      const filtered = filterEnglishUpper(event.target.value);
      if (filtered !== event.target.value) {
        event.target.value = filtered;
      }
    });
  });

  // 전화번호: 숫자만 허용 (id/name 에 signupPhone 포함하는 필드 추가)
  const phoneInput =
    document.getElementById("signupPhone") ||
    document.getElementById("phone") ||
    document.querySelector("input[name='phone']") ||
    document.querySelector("input[id*='Phone']") ||
    document.querySelector("input[name*='phone']");

  if (phoneInput) {
    phoneInput.addEventListener("input", (event) => {
      const filtered = filterDigits(event.target.value);
      if (filtered !== event.target.value) {
        event.target.value = filtered;
      }
    });
  }

  // 생년월일: 숫자만 허용 (id/name에 birth 포함하는 첫 번째 필드)
  const birthInput =
    document.getElementById("signupBirth") ||
    document.querySelector("input[name='birth']") ||
    document.querySelector("input[id*='Birth']") ||
    document.querySelector("input[name*='birth']");

  if (birthInput) {
    birthInput.addEventListener("input", (event) => {
      const filtered = filterDigits(event.target.value);
      if (filtered !== event.target.value) {
        event.target.value = filtered;
      }
    });
  }

  // 비밀번호 / 비밀번호 확인 일치 여부 표시
  const pwInput = document.getElementById("signupPassword");
  const pwConfirmInput = document.getElementById("signupPasswordConfirm");
  const pwMsg = document.getElementById("pwMatchMessage");

  function updatePasswordMatchMessage() {
    if (!pwInput || !pwConfirmInput || !pwMsg) return;

    const v1 = pwInput.value;
    const v2 = pwConfirmInput.value;

    // 둘 다 비어있으면 메시지 숨김
    if (!v1 && !v2) {
      pwMsg.textContent = "";
      pwMsg.className = "info-field__pw-message";
      return;
    }

    if (v1 === v2) {
      pwMsg.textContent = "비밀번호가 일치합니다.";
      pwMsg.className = "info-field__pw-message info-field__pw-message--ok";
    } else {
      pwMsg.textContent = "비밀번호가 일치하지 않습니다.";
      pwMsg.className = "info-field__pw-message info-field__pw-message--error";
    }
  }

  if (pwInput && pwConfirmInput) {
    pwInput.addEventListener("input", updatePasswordMatchMessage);
    pwConfirmInput.addEventListener("input", updatePasswordMatchMessage);
  }

  // 회원가입 폼 제출 처리
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      // 1) 기본 폼 전송(POST) 막기
      event.preventDefault();

      // 2) 브라우저 기본 required / pattern 검사 실행
      if (!signupForm.reportValidity()) {
        // 필수값/패턴 안 맞으면 브라우저가 자체 에러 메시지를 표시하게 둔다.
        return;
      }

      // 3) 비밀번호 일치 확인
      if (pwInput && pwConfirmInput && pwInput.value !== pwConfirmInput.value) {
        alert("비밀번호가 일치하지 않습니다.");
        pwConfirmInput.focus();
        return;
      }

      // 4) 입력값 읽기
      const email = document.getElementById("signupEmail")?.value.trim() || "";
      const nameKr = document.getElementById("signupNameKr")?.value.trim() || "";
      const surnameEn = document.getElementById("signupSurname")?.value.trim() || "";
      const givenEn = document.getElementById("signupGivenNames")?.value.trim() || "";
      const birth = document.getElementById("signupBirth")?.value.trim() || "";
      const phone = document.getElementById("signupPhone")?.value.trim() || "";

      // 5) 기존 사용자 목록 불러오기
      const users = loadUsers();

      // 6) 이메일 중복(유니크) 체크
      const isDuplicate = users.some((user) => user && user.email === email);
      if (isDuplicate) {
        alert("이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.");
        return;
      }

      // 7) 새 사용자 추가
      users.push({
        email,
        password: pwInput ? pwInput.value : "",
        nameKr,
        surnameEn,
        givenEn,
        birth,
        phone,
        grade: "일반회원",
        couponStatus: {
          mp: "unused",
          bria: "unused",
        },
      });

      saveUsers(users);

      // 8) 방금 가입한 사용자를 현재 사용자로 기억
      if (email) {
        localStorage.setItem("currentUserEmail", email);
      }

      // 9) 완료 안내 후 로그인 페이지로 이동
      alert("회원가입이 완료되었습니다.");
      window.location.href = "index.html";
    });
  }
});
