
// checkAgree.js
// 약관 동의 페이지(Agreement.html)에서
// 필수 항목이 체크되지 않으면 다음 단계(infoEnter.html)로 이동하지 못하게 막는 스크립트

document.addEventListener("DOMContentLoaded", function () {
  // "다음" 버튼 찾기
  var nextButton = document.querySelector(".agree-next-btn");
  if (!nextButton) return;

  nextButton.addEventListener("click", function (event) {
    // 필수 약관 체크박스들
    var termsMember = document.querySelector(
      'input[name="agree_terms_member"]'
    );
    var termsPrivacy = document.querySelector(
      'input[name="agree_terms_privacy"]'
    );

    // 체크박스 요소가 없으면 더 이상 진행하지 않음
    if (!termsMember || !termsPrivacy) {
      console.warn("필수 약관 체크박스를 찾을 수 없습니다.");
      return;
    }

    // 하나라도 체크 안 되어 있으면 이동 막기
    if (!termsMember.checked || !termsPrivacy.checked) {
      event.preventDefault(); // 기본 동작(페이지 이동) 막기
      alert("필수 약관에 모두 동의해 주세요.");
      return;
    }

    // 두 필수 항목 모두 체크된 경우에만 다음 페이지로 이동
    window.location.href = "infoEnter.html";
  });
});