// 약관 상세 모달 열기 / 닫기 전용 스크립트
// - 약관 행 오른쪽 아이콘(.agree-row__arrow)을 클릭했을 때만 모달이 열린다.
// - 모달 안의 닫기(X, "닫기" 버튼) 또는 회색 배경을 클릭하면 모달이 닫힌다.

document.addEventListener('DOMContentLoaded', () => {
  const arrowTriggers = document.querySelectorAll('.agree-row__arrow');

  arrowTriggers.forEach((trigger) => {
    const targetId = trigger.dataset.modalTarget;
    if (!targetId) return;

    const modal = document.getElementById(targetId);
    if (!modal) return;

    const openModal = () => {
      modal.classList.add('is-open');
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
    };

    // 아이콘(화살표) 클릭 시 모달 열기
    trigger.addEventListener('click', (event) => {
      event.stopPropagation(); // 행 클릭 이벤트와 분리
      openModal();
    });

    // 모달 안의 닫기 버튼들 (상단 X, 하단 "닫기")
    const closeButtons = modal.querySelectorAll('[data-modal-close]');
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        closeModal();
      });
    });

    // 회색 배경 클릭 시 모달 닫기
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  });
});
