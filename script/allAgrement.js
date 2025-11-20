// 전체 동의 / 개별 약관 체크 연동
// - "전체 동의" 체크 시: 아래 개별 약관(필수/선택 포함) 모두 체크/해제
// - 개별 약관 중 하나라도 해제되면: 전체 동의 자동 해제
// - 개별 약관이 모두 체크되면: 전체 동의 자동 체크

document.addEventListener('DOMContentLoaded', () => {
  // 상단 "전체 동의" 체크박스
  const masterCheckbox = document.querySelector('input[name="agree_all"]');
  // 개별 약관 체크박스들 (멤버십 약관, 개인정보 수집/이용, 제3자 제공 등)
  const termCheckboxes = document.querySelectorAll(
    '.agree-list .agree-checkbox'
  );

  // 1) "전체 동의" 클릭 시, 개별 약관 전체 체크/해제
  masterCheckbox.addEventListener('change', () => {
    const checked = masterCheckbox.checked;

    termCheckboxes.forEach((checkbox) => {
      checkbox.checked = checked;
    });
  });

  // 2) 개별 약관 체크 상태 변경 시, 전체 동의 상태 자동 조정
  termCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const allChecked = Array.from(termCheckboxes).every(
        (cb) => cb.checked
      );

      // 하나라도 해제되어 있으면 전체 동의 해제
      // 모두 체크되어 있으면 전체 동의 체크
      masterCheckbox.checked = allChecked;
    });
  });
});
