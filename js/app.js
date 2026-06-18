document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const loader = document.getElementById('loader');
  const enterBtn = document.getElementById('enter-btn');
  const scrollContainer = document.getElementById('scroll-container');
  const sections = document.querySelectorAll('.story-section');
  const navDots = document.querySelectorAll('.nav-dot-container');
  const audioToggle = document.getElementById('audio-toggle');
  const audioStatusText = audioToggle.querySelector('.audio-status-text');
  const progressBar = document.getElementById('progress-bar');
  const scrollPrompt = document.getElementById('scroll-prompt');

  let activeIndex = 0;

  // --- Loader / Entry Trigger ---
  enterBtn.addEventListener('click', () => {
    // Hide Loader
    loader.classList.add('fade-out');

    // Trigger Audio Engine (Web Audio Context requires user gesture)
    if (window.audioEngine) {
      window.audioEngine.start();
      audioToggle.classList.add('playing');
      audioStatusText.textContent = 'SOUND ON';
    }
  });

  // --- Audio Control Button ---
  audioToggle.addEventListener('click', () => {
    if (window.audioEngine) {
      const isPlaying = window.audioEngine.toggle();
      if (isPlaying) {
        audioToggle.classList.add('playing');
        audioStatusText.textContent = 'SOUND ON';
      } else {
        audioToggle.classList.remove('playing');
        audioStatusText.textContent = 'SOUND OFF';
      }
    }
  });

  // --- Intersection Observer for Active Slide Detection ---
  // A threshold of 0.51 ensures the slide is considered active when more than 50% visible
  const observerOptions = {
    root: scrollContainer,
    threshold: 0.51,
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = parseInt(entry.target.getAttribute('data-index'), 10);
        activeIndex = index;

        // Update active class on sections for CSS animations to trigger
        sections.forEach((sec, idx) => {
          if (idx === index) {
            sec.classList.add('active');
          } else {
            sec.classList.remove('active');
          }
        });

        // Update Nav Dots
        updateNavDots(index);

        // Notify Audio Engine of chapter change (to play matching chord progressions)
        if (window.audioEngine) {
          window.audioEngine.setChapter(index);
        }

        // Fade out scroll prompt after passing Chapter 1
        if (index > 0) {
          scrollPrompt.classList.add('fade-out');
        } else {
          scrollPrompt.classList.remove('fade-out');
        }
      }
    });
  }, observerOptions);

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });

  // --- Update Navigation Dots ---
  function updateNavDots(activeIndex) {
    navDots.forEach((dotContainer, idx) => {
      if (idx === activeIndex) {
        dotContainer.classList.add('active');
      } else {
        dotContainer.classList.remove('active');
      }
    });
  }

  // --- Side Nav Dot Clicking ---
  navDots.forEach((dotContainer) => {
    dotContainer.addEventListener('click', () => {
      const targetId = dotContainer.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        // Smoothly scroll container to the target section
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --- Scroll Progress Bar Indicator ---
  scrollContainer.addEventListener('scroll', () => {
    const totalHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    if (totalHeight > 0) {
      const percentage = (scrollContainer.scrollTop / totalHeight) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  });

  // --- Keyboard & Wheel Snapping Support ---
  // Standard scroll snap works well, but we can enhance it with arrow keys for accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(activeIndex + 1, sections.length - 1);
      sections[nextIndex].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(activeIndex - 1, 0);
      sections[prevIndex].scrollIntoView({ behavior: 'smooth' });
    }
  });
});
