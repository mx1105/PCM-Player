// ================= CONFIG =================
const ENABLE_TIMELINE_INTERACTION = true; // seeking via progress bar

// ================= GLOBAL STATE =================
let audioCtx;
let decodedBuffer;
let sourceNode;

let startTime = 0;
let pauseOffset = 0;
let isPlaying = false;
let animationFrameId = null;

// export
let decodedSamples = null;
let decodedSampleRate = 0;
let decodedChannels = 0;

const RULER_HEIGHT = 30;

// ================= UI ELEMENTS =================
const fileInput = document.getElementById("fileInput");
const fileNameLabel = document.getElementById("fileName");

const sampleRateInput = document.getElementById("sampleRate");
const bitDepthInput = document.getElementById("bitDepth");
const channelsInput = document.getElementById("channels");
const signed = document.getElementById("signed");
const endian = document.getElementById("endian");

const playPauseBtn = document.getElementById("playPauseBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const timeLabel = document.getElementById("timeLabel");
const downloadFormat = document.getElementById("downloadFormat");
const downloadBtn = document.getElementById("downloadBtn");
const timeline = document.getElementById("timeline");

const waveformCanvas = document.getElementById("waveform");
const waveformCtx = waveformCanvas.getContext("2d");
const rulerCanvas = document.getElementById("ruler");
const rulerCtx = rulerCanvas.getContext("2d");

// ================= FILE SELECTION =================
fileInput.onchange = () => {
  if (fileInput.files.length > 0) {
    fileNameLabel.textContent = fileInput.files[0].name;
  } else {
    fileNameLabel.textContent = "No file selected";
  }
};

// ================= DECODE =================
function decodePCMFile() {
  const file = fileInput.files[0];
  if (!file) return alert("Select a PCM file");

  const sampleRate = +sampleRateInput.value;
  const bitDepth = +bitDepthInput.value;
  const channels = +channelsInput.value;
  const isSigned = signed.value === "true";
  const littleEndian = endian.value === "little";

  const reader = new FileReader();
  reader.onload = () => {
    const samples = decodePCM(reader.result, bitDepth, isSigned, littleEndian);

    decodedSamples = samples;
    decodedSampleRate = sampleRate;
    decodedChannels = channels;

    decodedBuffer = buildAudioBuffer(samples, sampleRate, channels);

    pauseOffset = 0;
    isPlaying = false;
    playPauseBtn.textContent = "▶";

    // show UI
    playPauseBtn.style.display = "inline-flex";
    progressContainer.style.display = "block";
    timeLabel.style.display = "inline-block";
    downloadFormat.style.display = "inline-block";
    downloadBtn.style.display = "inline-flex";
    timeline.style.display = "block";

    updateProgress(0);

    requestAnimationFrame(() => {
      drawWaveform(decodedBuffer.getChannelData(0));
      drawRuler();
    });
  };

  reader.readAsArrayBuffer(file);
}

// ================= PCM DECODER =================
function decodePCM(buffer, bitDepth, signed, littleEndian) {
  const view = new DataView(buffer);
  const samples = [];
  const step = bitDepth / 8;

  for (let i = 0; i < view.byteLength; i += step) {
    let v;
    if (bitDepth === 16) {
      v = signed
        ? view.getInt16(i, littleEndian)
        : view.getUint16(i, littleEndian);
      samples.push(v / 32768);
    } else {
      v = signed ? view.getInt8(i) : view.getUint8(i);
      samples.push((v - 128) / 128);
    }
  }
  return samples;
}

// ================= AUDIO BUFFER =================
function buildAudioBuffer(samples, rate, channels) {
  audioCtx = new AudioContext({ sampleRate: rate });
  const buffer = audioCtx.createBuffer(
    channels,
    samples.length / channels,
    rate
  );

  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      data[i] = samples[i * channels + ch];
    }
  }
  return buffer;
}

// ================= PLAY / PAUSE =================
function togglePlay() {
  if (!decodedBuffer) return;

  if (!isPlaying) {
    playPauseBtn.textContent = "⏸";
    isPlaying = true;
    play();
  } else {
    playPauseBtn.textContent = "▶";
    isPlaying = false;
    pause();
  }
}

function play() {
  if (!decodedBuffer) return;

  if (sourceNode) sourceNode.stop();

  sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = decodedBuffer;
  sourceNode.connect(audioCtx.destination);

  startTime = audioCtx.currentTime;
  sourceNode.start(0, pauseOffset);

  animatePlayback();
}

function pause() {
  if (!sourceNode) return;
  sourceNode.stop();
  pauseOffset += audioCtx.currentTime - startTime;
  cancelAnimationFrame(animationFrameId);
}


// ================= PLAYBACK PROGRESS =================
function animatePlayback() {
  cancelAnimationFrame(animationFrameId);

  function frame() {
    if (!isPlaying) return;

    const elapsed = audioCtx.currentTime - startTime;
    const currentTime = pauseOffset + elapsed;

    updateProgress(currentTime);

    if (currentTime >= decodedBuffer.duration) {
      isPlaying = false;
      pauseOffset = 0;
      playPauseBtn.textContent = "▶";
      updateProgress(decodedBuffer.duration);
      return;
    }

    animationFrameId = requestAnimationFrame(frame);
  }

  frame();
}


function updateProgress(time) {
  const duration = decodedBuffer.duration;
  const percent = (time / duration) * 100;

  progressBar.style.width = percent + "%";
  timeLabel.textContent =
    formatTime(time) + " / " + formatTime(duration);
}

// ================= SEEK =================
if (ENABLE_TIMELINE_INTERACTION) {
progressContainer.onclick = e => {
  if (!decodedBuffer) return;

  const rect = progressContainer.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;

  pauseOffset = ratio * decodedBuffer.duration;

  if (isPlaying) {
    play();
  } else {
    updateProgress(pauseOffset);
  }
};

}

// ================= WAVEFORM =================
function drawWaveform(samples) {
  waveformCanvas.width = waveformCanvas.offsetWidth;
  waveformCanvas.height = waveformCanvas.offsetHeight;

  const ctx = waveformCtx;
  ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
  ctx.strokeStyle = "#00ff88";

  const width = waveformCanvas.width;
  const height = waveformCanvas.height;
  const mid = height / 2;

  const samplesPerPixel = Math.max(
    1,
    Math.floor(samples.length / width)
  );

  ctx.beginPath();

  for (let x = 0; x < width; x++) {
    let sum = 0;
    let count = 0;

    const start = x * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, samples.length);

    for (let i = start; i < end; i++) {
      const s = samples[i];
      sum += s * s;
      count++;
    }

    const rms = Math.sqrt(sum / count);
    const y = rms * mid;

    ctx.moveTo(x, mid - y);
    ctx.lineTo(x, mid + y);
  }

  ctx.stroke();
}


// ================= RULER =================
function drawRuler() {
  rulerCanvas.width = waveformCanvas.width;
  rulerCanvas.height = RULER_HEIGHT;

  rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);
  rulerCtx.fillStyle = "#aaa";
  rulerCtx.font = "10px Arial";
  rulerCtx.textBaseline = "middle";

  const duration = decodedBuffer.duration;
  const pxPerSec = rulerCanvas.width / duration;
  const midY = RULER_HEIGHT / 2;

  for (let t = 0; t <= duration; t++) {
    const x = t * pxPerSec;
    rulerCtx.fillRect(x, midY - 5, 1, 10);
    rulerCtx.fillText(`${t}s`, x + 2, midY - 10);
  }
}

// ================= DOWNLOAD =================
function downloadAudio() {
  if (downloadFormat.value === "wav") downloadWav();
  else alert("MP3 export will be added later");
}

function downloadWav() {
  const buffer = createWav(decodedSamples, decodedSampleRate, decodedChannels);
  const blob = new Blob([buffer], { type: "audio/wav" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "decoded.wav";
  a.click();
}

// ================= WAV ENCODER =================
function createWav(samples, rate, channels) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  let o = 0;

  write(view, o, "RIFF"); o += 4;
  view.setUint32(o, 36 + samples.length * 2, true); o += 4;
  write(view, o, "WAVE"); o += 4;
  write(view, o, "fmt "); o += 4;
  view.setUint32(o, 16, true); o += 4;
  view.setUint16(o, 1, true); o += 2;
  view.setUint16(o, channels, true); o += 2;
  view.setUint32(o, rate, true); o += 4;
  view.setUint32(o, rate * channels * 2, true); o += 4;
  view.setUint16(o, channels * 2, true); o += 2;
  view.setUint16(o, 16, true); o += 2;
  write(view, o, "data"); o += 4;
  view.setUint32(o, samples.length * 2, true); o += 4;

  for (let i = 0; i < samples.length; i++, o += 2) {
    view.setInt16(o, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  }

  return buffer;
}

function write(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ================= UTILS =================
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
