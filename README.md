# 🎬 As One — A Cinematic Story of Love

An immersive, single-page, vertical scroll-snap storytelling website inspired by the cinematic, emotional aesthetic of Makoto Shinkai films.

Live local preview uses strict CSS vertical scroll-snapping, GPU-accelerated text reveals, Ken Burns background zooms, and a **fully procedural Web Audio synth engine** playing low-fi, melancholic ambient piano chords.

---

## 📖 The Story: Chapters

The website tells a personal love story structured across six full-screen chapters:

1.  **Chapter I: The Scroll** — *"A simple feed, a lifetime found"* (Finding her on Instagram in 2024 and reaching out).
2.  **Chapter II: The Routine** — *"Good morning, tea, and you"* (The daily pattern of caring texts).
3.  **Chapter III: The Pursuit** — *"Rejected twice, accepted once"* (Persistence in chasing love until it was accepted).
4.  **Chapter IV: The Silence** — *"A month of learning value"* (A brief breakup that showed her true value, and rebuilding contact via Instagram).
5.  **Chapter V: The Promise** — *"You said the words"* (Reconnecting, talking daily, leading to her proposing).
6.  **Chapter VI: As One** — *"One year completed. My birthday, and you"* (Anniversary, birthday gift dedication, and loving her forever).

---

## 🛠️ Tech Stack & Features

*   **HTML5 Semantic Structure**: Clean markup separating slide sections and overlay control headers.
*   **Advanced CSS3 Properties**: Heavy use of CSS variables, viewport units (`vh`/`vw`), card glassmorphism overlays, and smooth transition easing.
*   **Procedural Web Audio API**: No external sound assets are needed. The site uses built-in browser audio synthesis to construct soft piano frequencies with dynamic ADSR envelops and custom feedback echo/delay lines that shift scale chords automatically based on active chapters.
*   **Intersection Observer Control**: Detects active chapters on scroll to dynamically update side indicators, top progress bars, active classes, and synthesizer progressions.
*   **Staggered GPU Triggers**: CSS `transform` and `opacity` transition staggers to reveal headers, titles, subtitles, and diary texts in active viewports.
*   **Ken Burns Animations**: Ultra-slow (`32s`) looping scale/translate panning animations on backgrounds.
*   **Full Responsive Support**: Tailored media breakpoints for mobile, tablet, desktop, and landscape phone viewports. Touch target standard constraints (`44px` height) implemented for audio buttons.

---

## ⚙️ How to Run Locally

Since this utilizes the Web Audio API and local assets:

1.  Open your command line/terminal in the root directory.
2.  Launch a simple local web server to host files on port `8000`. If you have Python:
    ```bash
    python -m http.server 8000
    ```
    If you have Node/NPM:
    ```bash
    npx serve
    ```
3.  Navigate to **`http://127.0.0.1:8000/`** in your browser.
4.  Click **Enter Story** on the loader splash screen to begin the interactive audio experience.

---

## 🚀 Production Hosting (Vercel)

This project contains a [vercel.json](./vercel.json) file configuring clean URLs and long-term caching for visual assets. To host online:

1.  Push the codebase to a GitHub repository.
2.  Connect Vercel to your GitHub account and import the repository.
3.  Vercel will auto-detect the static files and host them with continuous integration.

---

*Dedicated to Sivahhhh. Made with ♥ by @avrxt.*
