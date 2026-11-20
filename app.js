// app.js

/*
 * 설정
 * 1. index.html과 app.js를 같은 폴더에 저장하세요.
 * 2. 반려견 사진을 같은 폴더에 넣고 photo에 "./choco.jpg"처럼 입력하세요.
 * 3. phone에 실제 보호자 연락처를 입력하세요.
 * 4. 웹에 배포한 뒤 publicUrl에 명함의 공개 HTTPS 주소를 입력하세요.
 * 5. 카카오 JavaScript 키와 SDK 실행 도메인, 공유 링크 도메인을 등록하세요.
 *
 * 카카오디벨로퍼스 ([1]): SDK 설치 및 초기화
 * https://developers.kakao.com/docs/en/javascript/getting-started
 *
 * 카카오디벨로퍼스 ([2]): 카카오톡 공유 및 도메인 설정
 * https://developers.kakao.com/docs/en/kakaotalk-share/js-link
 *
 * 카카오디벨로퍼스 ([3]): SDK 다운로드
 * https://developers.kakao.com/docs/en/javascript/download
 *
 * QRious ([4]): 브라우저 내 QR 생성
 * https://github.com/airmrcr/qrious
 *
 * 연락처와 건강 정보는 공개할 내용만 입력하세요.
 * JavaScript 키 외에 Admin 키나 비밀 키를 입력하지 마세요.
 */

const CONFIG = {
  name: "초코",
  breed: "골든 리트리버",
  age: "3살",
  gender: "♂",

  photo: "",

  traits: [
    "추위를 많이타요",
    "사교적이에요",
    "활발해요",
    "똑똑해요 ♥"
  ],

  intro: "사람도, 산책도 좋아하는 우리 초코예요!",

  walkGuide:
    "초코는 다른 반려견과도 잘 지내지만, 처음 만나는 친구는 천천히 알아가요!",

  walkNote:
    "다른 반려견에게 다가가기 전 보호자에게 먼저 물어봐 주세요.",

  phone: "010-1234-5678",

  healthInfo: "알레르기 : 닭고기.",
  emergencyInfo: "쓸개골 탈구 / 복용중 : 카프로펜(리마딜).",

  // 비워 두면 현재 페이지 주소를 사용합니다.
  // 파일 주소(file://)나 로컬 주소는 공유 대상으로 사용하지 않습니다.
  publicUrl: "https://megataste.github.io/dogID/",

  kakaoJavaScriptKey: "4475453f02e07547b8f24ee8f631e0d9"
};

const $ = (id) => document.getElementById(id);

let toastTimer;
let qrFile = null;
let qrReady = false;
let qrGeneration = 0;

function showToast(message) {
  const toast = $("toast");

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;

  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 4500);
}

function openDialog(id) {
  const dialog = $(id);

  if (!dialog.open) {
    dialog.showModal();
  }
}

function isLocalHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "::1" ||
    host === "::" ||
    host === "0.0.0.0"
  ) {
    return true;
  }

  if (host.includes(":")) {
    return /^(fc|fd|fe[89ab])/i.test(host) ||
      host.startsWith("::ffff:");
  }

  const parts = host.split(".").map(Number);

  if (
    parts.length === 4 &&
    parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  ) {
    const [a, b] = parts;

    return a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127);
  }

  return !host.includes(".");
}

function getPublicUrl() {
  const rawUrl = CONFIG.publicUrl.trim() || window.location.href;
  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("CONFIG.publicUrl에 올바른 공개 주소를 입력해 주세요.");
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error(
      "파일을 웹에 배포한 뒤 CONFIG.publicUrl에 공개 주소를 입력해 주세요."
    );
  }

  if (isLocalHostname(url.hostname)) {
    throw new Error(
      "로컬 주소는 다른 사람에게 공유할 수 없습니다. 공개 웹 주소를 설정해 주세요."
    );
  }

  if (url.username || url.password) {
    throw new Error("아이디나 비밀번호가 포함되지 않은 공개 주소를 사용해 주세요.");
  }

  // 주소 형식만 검사합니다. 실제 배포 여부나 외부 접속 가능 여부는 별도 확인하세요.
  return url.href;
}

function shareTitle() {
  return `${CONFIG.name}의 반려견 명함 | ANCHOR PET`;
}

function shareText() {
  return `${CONFIG.name} · ${CONFIG.breed} · ${CONFIG.age}\n${CONFIG.intro}`;
}

function renderCard() {
  document.title = shareTitle();

  $("petName").textContent = CONFIG.name;

  $("petMeta").textContent =
    `${CONFIG.breed} · ${CONFIG.age} ${CONFIG.gender}`;

  $("petIntro").textContent = `“${CONFIG.intro}”`;
  $("walkGuide").textContent = CONFIG.walkGuide;
  $("walkNote").textContent = CONFIG.walkNote;
  $("healthInfo").textContent = CONFIG.healthInfo;
  $("emergencyInfo").textContent = CONFIG.emergencyInfo;

  $("phoneNumber").textContent =
    CONFIG.phone.trim() || "연락처 미등록";

  const tags = $("petTags");
  tags.replaceChildren();

  CONFIG.traits.forEach((trait) => {
    const item = document.createElement("li");
    item.textContent = trait;
    tags.append(item);
  });

  const photo = $("petPhoto");
  const fallback = $("photoFallback");

  photo.alt = `${CONFIG.name}의 사진`;

  photo.addEventListener("load", () => {
    photo.hidden = false;
    fallback.hidden = true;
  });

  photo.addEventListener("error", () => {
    photo.hidden = true;
    fallback.hidden = false;
  });

  if (CONFIG.photo.trim()) {
    photo.src = CONFIG.photo.trim();
  }
}

function callGuardian() {
  const rawPhone = CONFIG.phone.trim();

  if (!rawPhone) {
    showToast("보호자 연락처가 아직 등록되지 않았습니다.");
    return;
  }

  const phone = rawPhone.replace(/[\s().-]/g, "");

  if (!/^\+?\d{8,15}$/.test(phone)) {
    showToast("보호자 연락처 형식을 확인해 주세요.");
    return;
  }

  if (phone === "01012345678") {
    showToast("예시 번호입니다. 실제 보호자 연락처로 변경해 주세요.");
    return;
  }

  window.location.href = `tel:${phone}`;
}

function showLinkDialog(url, message) {
  $("manualUrl").value = url;
  $("linkHelp").textContent =
    message || "주소를 복사한 뒤 원하는 앱에 붙여넣어 주세요.";

  openDialog("linkDialog");

  $("manualUrl").focus();
  $("manualUrl").select();
  $("manualUrl").setSelectionRange(0, url.length);
}

async function copyLink() {
  let url;

  try {
    url = getPublicUrl();
  } catch (error) {
    showToast(error.message);
    return;
  }

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      showToast("명함 링크를 복사했습니다.");
      return;
    } catch {
      // 권한이 없거나 브라우저가 복사를 차단하면 직접 복사를 안내합니다.
    }
  }

  showLinkDialog(
    url,
    "자동 복사가 제한되었습니다. 아래 주소를 길게 누르거나 Ctrl+C / ⌘C로 복사해 주세요."
  );
}

async function shareKakao() {
  try {
    const url = getPublicUrl();
    const key = CONFIG.kakaoJavaScriptKey.trim();

    if (!key) {
      showLinkDialog(
        url,
        "카카오톡 연동 키가 아직 설정되지 않았습니다. 링크를 복사해 카카오톡 대화창에 붙여넣어 주세요."
      );
      return;
    }

    if (!window.Kakao?.Share) {
      showLinkDialog(
        url,
        "카카오 SDK를 불러오지 못했습니다. 인터넷 연결을 확인하거나 링크를 직접 공유해 주세요."
      );
      return;
    }

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(key);
    }

    await window.Kakao.Share.sendDefault({
      objectType: "text",
      text: `${shareTitle()}\n\n${shareText()}`,
      link: {
        mobileWebUrl: url,
        webUrl: url
      },
      buttonTitle: "명함 보기"
    });

    // 공유 창 실행과 실제 전송 완료는 다르므로 성공 알림을 표시하지 않습니다.
  } catch (error) {
    console.error("카카오톡 공유 오류:", error);

    showToast(
      "공유하지 못했습니다. 공개 주소, 카카오 JavaScript 키와 등록 도메인을 확인해 주세요."
    );
  }
}

async function shareSNS() {
  let url;

  try {
    url = getPublicUrl();
  } catch (error) {
    showToast(error.message);
    return;
  }

  const data = {
    title: shareTitle(),
    text: shareText(),
    url
  };

  if (window.isSecureContext && navigator.share) {
    try {
      // 표시되는 공유 앱은 기기와 브라우저에 따라 달라집니다.
      await navigator.share(data);
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
    }
  }

  showLinkDialog(
    url,
    "이 환경에서는 공유 메뉴를 열 수 없습니다. 링크를 복사해 원하는 SNS에 붙여넣어 주세요."
  );
}

function openQrDialog() {
  try {
    const url = getPublicUrl();

    if (!window.QRious) {
      showToast("QR 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.");
      return;
    }

    const generation = ++qrGeneration;

    qrFile = null;
    qrReady = false;
    $("shareQrButton").disabled = true;

    new window.QRious({
      element: $("qrCanvas"),
      value: url,
      size: 720,
      padding: 48,
      level: "M",
      background: "#ffffff",
      foreground: "#000000"
    });

    qrReady = true;
    $("qrUrl").value = url;

    openDialog("qrDialog");

    // 공유 버튼을 누르기 전에 파일을 준비하여 사용자 클릭 권한을 유지합니다.
    $("qrCanvas").toBlob((blob) => {
      if (generation !== qrGeneration) {
        return;
      }

      if (blob && typeof File !== "undefined") {
        qrFile = new File(
          [blob],
          "anchor-pet-qr.png",
          { type: "image/png" }
        );
      }

      $("shareQrButton").disabled = false;
    }, "image/png");
  } catch (error) {
    showToast(error.message || "QR을 생성하지 못했습니다.");
  }
}

function saveQr() {
  if (!qrReady) {
    showToast("QR을 먼저 생성해 주세요.");
    return;
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = $("qrCanvas").toDataURL("image/png");
    anchor.download = "anchor-pet-qr.png";

    document.body.append(anchor);
    anchor.click();
    anchor.remove();

    showToast("QR 이미지 저장을 요청했습니다.");
  } catch (error) {
    console.error("QR 저장 오류:", error);
    showToast("이미지를 저장하지 못했습니다. 다른 브라우저에서 다시 시도해 주세요.");
  }
}

async function shareQr() {
  try {
    if (
      qrFile &&
      window.isSecureContext &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [qrFile] })
    ) {
      await navigator.share({
        files: [qrFile]
      });

      return;
    }

    showToast("이 환경에서는 이미지 공유를 지원하지 않습니다. QR 저장을 이용해 주세요.");
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    console.error("QR 공유 오류:", error);
    showToast("이미지 공유가 제한되었습니다. QR을 저장해 직접 첨부해 주세요.");
  }
}

function bindEvents() {
  $("callButton").addEventListener("click", callGuardian);
  $("kakaoButton").addEventListener("click", shareKakao);
  $("copyButton").addEventListener("click", copyLink);
  $("snsButton").addEventListener("click", shareSNS);
  $("qrButton").addEventListener("click", openQrDialog);
  $("saveQrButton").addEventListener("click", saveQr);
  $("shareQrButton").addEventListener("click", shareQr);
  $("manualCopyButton").addEventListener("click", copyLink);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      $(button.dataset.closeDialog).close();
    });
  });

  ["manualUrl", "qrUrl"].forEach((id) => {
    $(id).addEventListener("click", (event) => {
      event.currentTarget.select();
    });
  });
}

renderCard();
bindEvents();
