// 비밀번호 보기/숨기기 토글 (여러 페이지 공통)
document.addEventListener('DOMContentLoaded', () => {
  const areas = document.querySelectorAll('[data-pw-toggle]');

  areas.forEach((area) => {
    const input = area.querySelector('input');
    const button = area.querySelector('[data-pw-toggle-btn]');
    const icon = button && button.querySelector('img');

    // 핵심 요소가 없으면만 스킵
    if (!input || !button || !icon) return;

    const showSrc = button.getAttribute('data-eye-show'); // 보이는 상태 아이콘
    const hideSrc = button.getAttribute('data-eye-hide') || icon.getAttribute('src'); // 숨김 상태 아이콘

    button.addEventListener('click', () => {
      const isHidden = input.type === 'password';

      // input type 토글
      input.type = isHidden ? 'text' : 'password';

      // 아이콘 토글 (data 속성 설정된 경우)
      if (showSrc && hideSrc) {
        icon.src = isHidden ? showSrc : hideSrc;
      }

      // 접근성용 라벨도 같이 변경
      button.setAttribute('aria-label', isHidden ? '비밀번호 숨기기' : '비밀번호 보이기');
    });
  });
});