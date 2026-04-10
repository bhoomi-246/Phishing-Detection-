const API_ENDPOINT = 'http://127.0.0.1:5000/predict';

/* ── DOM refs ── */
const urlInput   = document.getElementById('urlInput');
const checkBtn   = document.getElementById('checkBtn');
const clearBtn   = document.getElementById('clearBtn');
const loaderWrap = document.getElementById('loaderWrap');
const resultWrap = document.getElementById('resultWrap');
const resultCard = document.getElementById('resultCard');
const resultIcon = document.getElementById('resultIcon');
const resultLabel= document.getElementById('resultLabel');
const resultUrl  = document.getElementById('resultUrl');
const resultDetail=document.getElementById('resultDetail');
const errorWrap  = document.getElementById('errorWrap');
const errorMsg   = document.getElementById('errorMsg');
const inputHint  = document.getElementById('inputHint');

/* ── Helpers ── */

function isValidURL(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    // Try with https:// prefix if missing
    try {
      const u = new URL('https://' + str);
      return u.hostname.includes('.');
    } catch {
      return false;
    }
  }
}

function normalizeURL(str) {
  str = str.trim();
  if (!/^https?:\/\//i.test(str)) {
    str = 'https://' + str;
  }
  return str;
}

function resetUI() {
  loaderWrap.hidden = true;
  resultWrap.hidden = true;
  errorWrap.hidden  = true;
  resultCard.className = 'result-card';
  inputHint.textContent = 'Paste any URL — we\'ll analyze it instantly';
  inputHint.classList.remove('error');
}

function showLoader() {
  loaderWrap.hidden = false;
  resultWrap.hidden = true;
  errorWrap.hidden  = true;
}

function showResult(verdict, url) {
  loaderWrap.hidden = false; // keep space consistent
  loaderWrap.hidden = true;
  resultWrap.hidden = false;
  errorWrap.hidden  = true;

  const isPhishing = verdict.toLowerCase().includes('phish');

  resultCard.classList.add(isPhishing ? 'phishing' : 'safe');
  resultIcon.textContent  = isPhishing ? '🎣' : '✅';
  resultLabel.textContent = isPhishing ? 'Phishing Detected' : 'Safe URL';
  resultUrl.textContent   = url;
  resultDetail.textContent = isPhishing
    ? 'This URL exhibits phishing patterns. Do not visit or share it.'
    : 'No phishing indicators found. Proceed with normal caution.';
}

function showError(msg) {
  loaderWrap.hidden = true;
  resultWrap.hidden = true;
  errorWrap.hidden  = false;
  errorMsg.textContent = msg;
}

/* ── Main check function ── */

async function checkURL() {
  resetUI();

  const raw = urlInput.value.trim();

  if (!raw) {
    inputHint.textContent = 'Please enter a URL first.';
    inputHint.classList.add('error');
    urlInput.focus();
    return;
  }

  if (!isValidURL(raw)) {
    inputHint.textContent = 'Invalid URL format. Example: https://example.com';
    inputHint.classList.add('error');
    urlInput.focus();
    return;
  }

  const url = normalizeURL(raw);

  checkBtn.disabled = true;
  showLoader();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server returned ${response.status}: ${text || response.statusText}`);
    }

    const data = await response.json();

    // Accept flexible response shapes:
    //   { prediction: "Phishing" } | { result: "Safe" } | { label: "..." }
    const verdict =
      data.prediction ?? data.result ?? data.label ?? data.verdict ?? null;

    if (!verdict) {
      throw new Error('Unexpected response format from server.');
    }

    showResult(verdict, url);

  } catch (err) {
    if (err.name === 'AbortError') {
      showError('Request timed out. The backend server may be unavailable.');
    } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      showError('Cannot reach the backend server at ' + API_ENDPOINT + '. Make sure it is running.');
    } else {
      showError(err.message);
    }
  } finally {
    checkBtn.disabled = false;
  }
}

/* ── Event listeners ── */

checkBtn.addEventListener('click', checkURL);

clearBtn.addEventListener('click', () => {
  urlInput.value = '';
  urlInput.focus();
  resetUI();
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkURL();
});

urlInput.addEventListener('input', () => {
  // Clear error state on new input
  inputHint.textContent = 'Paste any URL — we\'ll analyze it instantly';
  inputHint.classList.remove('error');
  if (resultWrap.hidden === false || errorWrap.hidden === false) {
    resetUI();
  }
});

// Auto-focus on load
window.addEventListener('DOMContentLoaded', () => urlInput.focus());

async function checkURL() {
    const url = document.getElementById("urlInput").value;

    const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: url })
    });

    const data = await response.json();
    alert("Result: " + data.prediction);
}