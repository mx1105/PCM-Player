# PCM Player 🎧

A lightweight, browser-based **PCM audio player and waveform visualizer** built using pure **HTML, CSS, and JavaScript**.

This tool allows you to **decode raw PCM audio files**, visualize the waveform, and play audio directly in the browser — no backend required.

🔗 **Live Demo:**  
https://mx1105.github.io/PCM-Player/

---

## ✨ Features

- 🎵 Decode raw **PCM audio files**
- 📊 Real-time **waveform visualization**
- ▶️ Play / Pause audio playback
- ⏱️ Playback progress timeline with seek support
- 📏 Time ruler synced with audio duration
- 🔄 Supports configurable PCM parameters:
  - Sample rate
  - Bit depth (8-bit / 16-bit)
  - Mono / Stereo
  - Signed / Unsigned
  - Little / Big Endian
- 💾 Export decoded audio as **WAV**
- 🌐 Runs entirely in the browser (client-side)

---

## 🧠 What is PCM?

**PCM (Pulse Code Modulation)** is a raw, uncompressed digital audio format.  
Unlike WAV or MP3, PCM files do **not contain metadata** such as sample rate or bit depth — these must be provided manually to correctly decode the audio.

This project helps visualize and understand PCM audio by letting users configure decoding parameters and instantly see & hear the result.

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/mx1105/PCM-Player.git
cd PCM-Player
```
### 2️⃣ Open locally

Simply open `index.html` in your browser:

```text
index.html
```


---

### 🛠️ How It Works

```markdown
## 🛠️ How It Works

- PCM file is read using `FileReader`
- Samples are decoded based on user-provided configuration
- Audio is played using the **Web Audio API**
- Waveform is rendered using **HTML5 Canvas**
- Playback timeline and progress are synced in real time

All processing happens **locally in the browser**.
```

## 📁 Project Structure

```text
PCM-Player/
├── index.html      # Main UI
├── style.css       # Styling
├── player.js       # PCM decoding, playback & waveform logic
└── README.md
```


---

### 🧪 Supported PCM Formats

```markdown
## 🧪 Supported PCM Formats

| Feature       | Supported                  |
|--------------|----------------------------|
| Sample Rate  | Any (e.g. 8k, 16k, 44.1k)  |
| Bit Depth    | 8-bit, 16-bit              |
| Channels     | Mono, Stereo               |
| Endianness  | Little / Big               |
| Signed      | Signed / Unsigned          |
```

## 🔮 Planned Enhancements

- 🔊 MP3 / FLAC export
- 📈 Zoomable & scrollable waveform
- 🎯 Waveform click-to-seek
- 🎚️ Playback speed control
- 📱 Improved mobile support
- 🧩 Additional audio converters & players

## ⚠️ Limitations

- PCM files do not carry format metadata — incorrect settings may produce noise
- All logic runs client-side (JavaScript is visible in browser)
- Large PCM files may be slow on low-end devices

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request


## 🙌 Acknowledgements

- Web Audio API
- HTML5 Canvas
- Open web standards


