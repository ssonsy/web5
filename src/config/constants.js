// ===== 배경 이미지 =====
export const IMAGE_SRC = "/images/002-1.jpg";

// ===== 오버레이 설정 =====
// show 는 스크롤 px 기준 로직이므로 그대로 숫자(px) 유지
export const OVERLAYS = [
  { src: "images/say1.png", show: "1.0%",  left: "2.25vw",   top: "14vh", bottom: "46.3vh" },
  { src: "images/say2.png", show: "2.4%",  left: "40vw", top: "34vh", bottom: "25vh" },
  { src: "images/say3.png", show: "4.0%",  left: "50vw",    top: "9.2vh",  bottom: "56.8vh" },
  { src: "images/say4.png", show: "7.5%",  left: "70vw",   top: "20.4vh", bottom: "26vh" },
  { src: "images/say5.png", show: "18%",   left: "36vw", top: "7.4vh",  bottom: "63vh" },
  { src: "images/say6.png", show: "32%",   left: "60vw",  top: "0vh",       bottom: "51vh" },
];

// ===== Smooth Inertia Params (부드러운 관성) =====
const INERTIA_ACCEL    = 0.60;   // 휠 입력 → 속도로 누적되는 양 (↑ 더 민감)
const INERTIA_FRICTION = 0.88;   // 0.82~0.94 권장, 높을수록 오래 감
const FOLLOW_GAIN      = 0.22;   // 현재 위치가 타깃을 따라잡는 비율 (↑ 더 빠르게 붙음)
const MIN_VY_STOP      = 0.06;   // 속도가 이 값보다 작아지면 정지

// 공통 동작 파라미터 (그대로)
export const OVERLAY_SPEED = 1.0;
export const SCROLL_STEP   = 50;
export const EASE_FACTOR   = 0.15;
export const STOP_EPS      = 0.4;

// 등장(스케일 업) 공통 (그대로)
export const START_SCALE   = 0.6;
export const APPEAR_RANGE  = 160;

// ===== GNB 로고/메뉴 =====
export const LOGO_SRC         = "/images/logo.png";
// 25px → 2.3148vh, 10px → 0.5208vw, 140px → 7.2917vw
export const LOGO_OFFSET_TOP  = "2.3148vh";
export const LOGO_OFFSET_LEFT = "0.5208vw";
export const LOGO_WIDTH       = "7.2917vw";
export const LOGO_HEIGHT      = "auto";

export const MENU_ITEMS = ["Character", "Animation", "Test", "Goods", "About Us"];
// 270px → 14.0625vw, 60px → 3.125vw, 22px → 1.1458vw, 2.2px → 0.1146vw
export const MENU_LEFT_OFFSET        = "14.0625vw";
export const MENU_TOP_OFFSET         = "5.5556vh"; // 60px → 5.5556vh
export const MENU_FONT_SIZE_PX       = "1.1458vw";
export const MENU_LETTER_SPACING_PX  = "0.1146vw";
export const MENU_GAP_PX             = "3.125vw";

// ===== 오른쪽 확장 패널 ===== (스크롤/물리 정합성 때문에 px 유지)
export const EXTRA_VIDEO_PANEL_WIDTH = 1920;
export const EXTRA_BG_PANEL_WIDTH    = 3840;

// 파일 경로
export const VIDEO_SRC  = "/videos/sample.mp4";
export const BG_IMG_SRC = "/images/background1.png";

// 새 배경0 (px 유지)
export const BG0_IMG_SRC     = "/images/background0.png";
export const BG0_PANEL_WIDTH = 2820;

// 배경1.png 위 캡션 — 40pt는 비율 유지 위해 vw/vh 최소값 사용
export const CAPTION_TEXT          = "GOING FOR A TEST   →";
export const CAPTION_FONT_SIZE     = "min(2.0833vw, 3.7037vh)"; // 40px≈2.0833vw, 40px≈3.7037vh
export const CAPTION_MARGIN_LEFT   = "75vw";       // 1440px → 75vw
export const CAPTION_MARGIN_TOP    = "49.0741vh";  // 530px → 49.0741vh
export const CAPTION_MARGIN_BOTTOM = "5.5556vh";   // 60px → 5.5556vh

// 외부 링크
export const EXTERNAL_URL = "https://smore.im/quiz/aFbN246J8S";

// 커스텀 커서 (그대로)
export const CURSOR_PNG_CANDIDATES = ["/cursor.png", "/images/cursor.png", "/assets/cursor.png"];
export const CURSOR_HOTSPOT_X = 8;
export const CURSOR_HOTSPOT_Y = 8;
export const MAX_CURSOR_SIZE  = 64;

// GNB 스와이프 애니메이션 파라미터 (그대로)
export const MENU_SWIPE_PX_PER_MS = 0.2;
export const MENU_SWIPE_MIN_MS    = 2500;
export const MENU_SWIPE_MAX_MS    = 3500;

// GNB 클릭 스크롤 타깃(Y) — 스크롤 픽셀 좌표이므로 px 유지
export const MENU_SCROLL_TARGETS = {
  Character: 0,
  Animation: 10000,
  Test:      13000,
  Goods:     6800,
  "About Us": 9800,
};

export const WEB5_2_URL = import.meta.env.DEV
  ? "http://localhost:5174/" // ← web5-2 dev 주소
  : "/web5-2/";              // ← 배포 시 하위 경로(아래 5번 참고)

