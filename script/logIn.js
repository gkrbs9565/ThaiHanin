// logIn.js
// 아주 기본적인 로그인 처리 (localStorage + 관리자 계정)

// 관리자 계정 고정 값
const ADMIN_ID = "admin";
const ADMIN_PW = "1234";

// 회원 목록 불러오기 (회원가입 때 저장된 배열)
function loadUsers() {
  const raw = localStorage.getItem("thaihanin_users");
  if (!raw) return [];

  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
  } catch (e) {
    // 파싱 실패하면 빈 배열 리턴
  }

  return [];
}

// 현재 로그인한 사용자 이메일 저장
function saveCurrentUserEmail(email) {
  localStorage.setItem("thaihanin_currentUserEmail", email);
}

// 로그인 폼 전송 처리
function handleLoginSubmit(event) {
  event.preventDefault();

  const idInput = document.getElementById("loginId");
  const pwInput = document.getElementById("loginPw");

  if (!idInput || !pwInput) return;

  const id = idInput.value.trim();
  const password = pwInput.value;

  // 관리자 로그인
  if (id === ADMIN_ID && password === ADMIN_PW) {
    saveCurrentUserEmail(id);
    window.location.href = "memberList.html"; // 관리자 페이지
    return;
  }

  // 일반 회원 로그인
  const users = loadUsers();
  let foundUser = null;

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (u.email === id && u.password === password) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    alert("이메일 또는 비밀번호가 올바르지 않습니다.");
    return;
  }

  // 로그인 성공
  saveCurrentUserEmail(foundUser.email);
  window.location.href = "member.html"; // 마이페이지
}

// 로그인 페이지 세팅
function setupLoginPage() {
  // 로그인 페이지 들어올 때마다 현재 로그인 정보 지우기
  localStorage.removeItem("thaihanin_currentUserEmail");

  const form = document.querySelector(".login-form");
  if (!form) return;

  // 폼 내용 초기화
  form.reset();

  // 로그인 버튼 눌렀을 때 처리
  form.addEventListener("submit", handleLoginSubmit);
}

document.addEventListener("DOMContentLoaded", setupLoginPage);