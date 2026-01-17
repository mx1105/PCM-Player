// ================= GLOBAL STATE =================
let audioCtx;
let decodedBuffer;
let sourceNode;
let startTime = 0;
let pauseOffset = 0;

let zoom = 1;
let playbackRate = 1;

// ================= UI ELEMENTS =================
const fileInput = document.getElementById("fileInput");
const sampleRateInput = document.getElementById("sampleRate");
const bitDepthInput = document.getElementById("bitDepth");
const channelsInput = document.getElementById("channels");
const signed = document.getElementById("signed");
const endian = document.getElementById("endian");

const zoomSlider = document.getElementById("zoom");
const speedSlider = document.getElementById("speed");
const speedLabel = document.getElementById("speedLabel");

const waveformCanvas = document.getElementById("waveform");
const waveformCtx = waveformCanvas.getContext("2d");

const rulerCanvas = document.getElementById("ruler");
const rulerCtx = rulerCanvas.getContext("2d");

// ================= UI EVENTS =================
zoomSlider.oninput = () => {
  zoom = +zoomSlider.value;
  redraw();
};

speedSlider.oninput = () => {
  playbackRate = +speedSlider.value;
  speedLabel.textContent = playbackRate.toFixed(1) + "x";
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
    decodedBuffer = buildAudioBuffer(samples, sampleRate, channels);
    redraw();

    document.getElementById("playerControls").style.display = "block";
  };
  reader.readAsArrayBuffer(file);
}

// ================= PCM DECODER =================
function decodePCM(buffer, bitDepth, signed, littleEndian) {
  const view = new DataView(buffer);
  const samples = [];
  const step = bitDepth / 8;

  for (let i = 0; i < view.byteLength; i += step) {
    let value;
    if (bitDepth === 16) {
      value = signed ? view.getInt16(i, littleEndian) : view.getUint16(i, littleEndian);
      samples.push(value / 32768);
    } else {
      value = signed ? view.getInt8(i) : view.getUint8(i);
      samples.push((value - 128) / 128);
    }
  }
  return samples;
}

// ================= BUILD AUDIO BUFFER =================
function buildAudioBuffer(samples, sampleRate, channels) {
  audioCtx = new AudioContext({ sampleRate });
  const buffer = audioCtx.createBuffer(channels, samples.length / channels, sampleRate);

  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      data[i] = samples[i * channels + ch];
    }
  }
  return buffer;
}

// ================= PLAYER =================
function play() {
  if (!decodedBuffer) return;

  sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = decodedBuffer;
  sourceNode.playbackRate.value = playbackRate;
  sourceNode.connect(audioCtx.destination);

  startTime = audioCtx.currentTime - pauseOffset;
  sourceNode.start(0, pauseOffset);
}

function pause() {
  if (!sourceNode) return;
  sourceNode.stop();
  pauseOffset = audioCtx.currentTime - startTime;
}

// ================= WAVEFORM =================
function drawWaveform(samples) {
  waveformCanvas.width = waveformCanvas.offsetWidth;
  waveformCanvas.height = waveformCanvas.offsetHeight;

  waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
  waveformCtx.beginPath();
  waveformCtx.strokeStyle = "#00ff51ff";

  const visibleSamples = samples.length / zoom;
  const step = Math.ceil(visibleSamples / waveformCanvas.width);
  const amp = waveformCanvas.height / 2;

  for (let i = 0; i < waveformCanvas.width; i++) {
    let min = 1, max = -1;
    const idx = Math.floor(i * step);

    for (let j = 0; j < step; j++) {
      const sample = samples[idx + j] || 0;
      if (sample < min) min = sample;
      if (sample > max) max = sample;
    }

    waveformCtx.moveTo(i, (1 + min) * amp);
    waveformCtx.lineTo(i, (1 + max) * amp);
  }
  waveformCtx.stroke();

  // Seek on click
  waveformCanvas.onclick = e => {
    const x = e.offsetX;
    const percent = x / waveformCanvas.width;
    pauseOffset = decodedBuffer.duration * percent;
    play();
  };
}

// ================= TIME RULER =================
function drawRuler() {
  rulerCanvas.width = waveformCanvas.width;
  rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);

  const duration = decodedBuffer.duration;
  const pixelsPerSecond = (waveformCanvas.width * zoom) / duration;

  for (let i = 0; i <= duration; i++) {
    const x = i * pixelsPerSecond;
    if (x > rulerCanvas.width) break;

    rulerCtx.fillStyle = "#ffffffff";
    rulerCtx.fillRect(x, 15, 1, 15);
    rulerCtx.fillText(i + "s", x + 2, 12);
  }
}

// ================= REDRAW =================
function redraw() {
  if (!decodedBuffer) return;
  drawWaveform(decodedBuffer.getChannelData(0));
  drawRuler();
}
