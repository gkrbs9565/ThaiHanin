// 현재 로그인한 사용자에게 정회원 신청 정보를 저장 (단순 버전)
function saveUpgradeInfoToCurrentUser(upgradeData) {
  const currentEmail = localStorage.getItem("currentUserEmail");
  if (!currentEmail) return;

  const USERS_KEY = "thaihanin_users";
  const usersRaw = localStorage.getItem(USERS_KEY);
  if (!usersRaw) return;

  let users;
  try {
    users = JSON.parse(usersRaw);
  } catch (e) {
    return;
  }

  const idx = users.findIndex((user) => user && user.email === currentEmail);
  if (idx === -1) return;

  users[idx] = {
    ...users[idx],
    passportNumber: upgradeData.passportNumber,
    passportImage: upgradeData.passportImage,
    paymentImage: upgradeData.paymentImage,
    profileImage: upgradeData.profileImage,
    applyStatus: "신청중",
  };

  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("localStorage quota exceeded", e);
    alert("브라우저 저장 공간이 가득 찼습니다.\n테스트용 데이터(회원/이미지)를 지우고 다시 시도해주세요.");
  }
}

// 정회원 신청 페이지용 스크립트 (이미지 미리보기 + 기본 제출 처리)

document.addEventListener("DOMContentLoaded", () => {
  const MAX_IMAGE_SIZE = 200 * 1024; // 200KB
  // 여권번호: 영어/숫자만, 최대 8글자
  const passportNumberInput = document.getElementById("passportNumber");
  if (passportNumberInput) {
    passportNumberInput.maxLength = 8;
    passportNumberInput.addEventListener("input", (e) => {
      let value = e.target.value;
      // 영어 대소문자 + 숫자만 허용
      value = value.replace(/[^A-Za-z0-9]/g, "");
      // 최대 8글자까지만
      if (value.length > 8) {
        value = value.slice(0, 8);
      }
      e.target.value = value;
    });
  }

  // 업로드 박스 안의 파일 선택 시 미리보기 표시
  const fileInputs = document.querySelectorAll(".upload-box input[type='file']");

  fileInputs.forEach((input) => {
    input.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_SIZE) {
        alert("이미지 용량이 너무 큽니다. 200KB 이하의 파일만 업로드해주세요.");
        event.target.value = "";
        return;
      }

      const box = event.target.closest(".upload-box");
      if (!box) return;

      // 기존 미리보기 이미지가 있으면 재사용, 없으면 새로 생성
      let preview = box.querySelector(".upload-preview");
      if (!preview) {
        preview = document.createElement("img");
        preview.className = "upload-preview";
        box.appendChild(preview);
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);

      // + 아이콘 숨기기
      const plus = box.querySelector(".upload-plus");
      if (plus) {
        plus.style.display = "none";
      }

      // 삭제(X) 버튼 생성 또는 찾기
      let removeBtn = box.querySelector(".upload-remove");
      if (!removeBtn) {
        removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "upload-remove";

        const icon = document.createElement("img");
        icon.src = "img/x.svg";
        icon.alt = "사진 삭제";

        removeBtn.appendChild(icon);
        box.appendChild(removeBtn);

        // 클릭 시 업로드 리셋
        removeBtn.addEventListener("click", () => {
          // 파일 인풋 비우기
          input.value = "";

          // 미리보기 제거
          const currentPreview = box.querySelector(".upload-preview");
          if (currentPreview) {
            currentPreview.remove();
          }

          // + 아이콘 다시 보이게
          if (plus) {
            plus.style.display = "block";
          }

          // X 버튼 숨기기
          removeBtn.style.display = "none";
        });
      }

      // 파일 선택되면 X 버튼 보이게
      removeBtn.style.display = "flex";
    });
  });

  // 정회원 신청 폼 제출 처리: 필수 항목만 간단히 확인 후 현재 사용자 정보에 저장
  const form = document.querySelector(".upgrade-form");
  const submitBtn = document.querySelector(".upgrade-submit-btn");

  function handleUpgradeSubmit(event) {
    if (event) {
      event.preventDefault();
    }

    const passportNumberInput = document.getElementById("passportNumber");
    const passportImageInput = document.getElementById("passportImage");
    const paymentImageInput = document.getElementById("paymentImage");
    const profileImageInput = document.getElementById("profileImage");

    const missing = [];

    // 여권번호 필수
    if (!passportNumberInput.value.trim()) {
      missing.push("여권번호");
    }

    // 여권 사진 필수
    if (!passportImageInput.files || passportImageInput.files.length === 0) {
      missing.push("여권 사진");
    }

    // 회비 납부 사진 필수
    if (!paymentImageInput.files || paymentImageInput.files.length === 0) {
      missing.push("회비 납부 사진");
    }

    // 빠진 항목이 있다면 알림 후 종료
    if (missing.length > 0) {
      alert(missing.join(", ") + " 항목을 입력/등록해주세요.");
      return;
    }

    // 미리보기 이미지(src)를 그대로 저장에 사용
    const getPreviewSrc = (inputEl) => {
      if (!inputEl) return null;
      const box = inputEl.closest(".upload-box");
      if (!box) return null;
      const previewImg = box.querySelector(".upload-preview");
      return previewImg ? previewImg.src : null;
    };

    const passportPreviewSrc = getPreviewSrc(passportImageInput);
    const paymentPreviewSrc = getPreviewSrc(paymentImageInput);
    const profilePreviewSrc = getPreviewSrc(profileImageInput);

    const upgradeData = {
      passportNumber: passportNumberInput.value.trim(),
      passportImage: passportPreviewSrc,
      paymentImage: paymentPreviewSrc,
      profileImage: profilePreviewSrc,
    };

    saveUpgradeInfoToCurrentUser(upgradeData);

    // 신청 완료 안내 후 멤버페이지로 이동
    alert("신청이 완료되었습니다. 대기해주시길 바랍니다.");
    window.location.href = "member.html";
  }

  if (form) {
    form.addEventListener("submit", handleUpgradeSubmit);
  }

  // 혹시 버튼이 type="button"으로 되어 있어 submit 이벤트가 안 걸리는 경우를 대비해 클릭도 처리
  if (submitBtn) {
    submitBtn.addEventListener("click", handleUpgradeSubmit);
  }
});
