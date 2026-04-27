const statusText = document.getElementById("statusText");
const radios = Array.from(document.querySelectorAll('input[name="themeMode"]'));

const MODE_LABEL = {
  light: "亮色主题",
  dark: "暗色主题",
  off: "不修改"
};

async function loadCurrentMode() {
  const response = await chrome.runtime.sendMessage({ type: "GET_THEME_MODE" });
  const mode = response?.mode || "off";
  const target = radios.find((item) => item.value === mode);
  if (target) {
    target.checked = true;
  }
  updateStatus(mode);
}

function updateStatus(mode) {
  const label = MODE_LABEL[mode] || MODE_LABEL.off;
  statusText.textContent = `当前状态：${label}`;
}

async function onModeChange(event) {
  const mode = event.target.value;
  updateStatus(mode);
  await chrome.runtime.sendMessage({ type: "SET_THEME_MODE", mode });
}

radios.forEach((radio) => {
  radio.addEventListener("change", onModeChange);
});

loadCurrentMode();
