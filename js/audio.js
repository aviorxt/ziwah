/**
 * Cinematic Audio Engine
 * Uses Web Audio API to synthesize ambient, lofi-piano chords and melodies.
 * Completely self-contained - no external assets required.
 */
class CinematicAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.delayNode = null;
    this.feedbackNode = null;
    this.filterNode = null;
    this.isPlaying = false;
    this.chordInterval = null;
    this.melodyInterval = null;
    this.activeChapter = 0;
    this.currentVolume = 0.15; // Soft background level

    // Scale notes for melody: A Minor Pentatonic / A Aeolian
    // A4 (440Hz), B4 (493.88Hz), C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), A5 (880Hz), B5 (987.77Hz), C6 (1046.50Hz)
    this.melodyScale = [440.00, 493.88, 523.25, 659.25, 783.99, 880.00, 987.77, 1046.50];

    // Chords database: 6 chords matching the emotional progression of the 6 chapters
    this.chords = [
      // Chapter 1: The Glance - Fmaj7 (Dreamy, expectant)
      [174.61, 220.00, 261.63, 329.63, 392.00], // F3, A3, C4, E4, G4
      // Chapter 2: The Blush - Cmaj7 (Warm, blossoming)
      [130.81, 196.00, 246.94, 329.63, 493.88], // C3, G3, B3, E4, B4
      // Chapter 3: The Wait - Am7 (Melancholic, spacious)
      [110.00, 164.81, 220.00, 261.63, 392.00], // A2, E3, A3, C4, G4
      // Chapter 4: A Sign - Dm7 (Hopeful shift)
      [146.83, 220.00, 293.66, 349.23, 440.00], // D3, A3, D4, F4, A4
      // Chapter 5: Your Hand - G6 (Warm, resolved)
      [98.00, 146.83, 196.00, 246.94, 293.66],  // G2, D3, G3, B3, D4
      // Chapter 6: As One - Cmaj9 (Complete, eternal)
      [130.81, 196.00, 261.63, 329.63, 493.88, 523.25] // C3, G3, C4, E4, B4, C5
    ];
  }

  /**
   * Initializes the Web Audio context and signal routing.
   * Must be triggered by user gesture.
   */
  init() {
    if (this.ctx) return;

    // Create context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Gain for volume control
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime); // Start silent for fade-in

    // Filter Node (Low-pass to make the synth sound soft and warm)
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(1000, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1, this.ctx.currentTime);

    // Delay Node (Cinematic space and echo)
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime(0.6, this.ctx.currentTime);

    // Feedback for the delay
    this.feedbackNode = this.ctx.createGain();
    this.feedbackNode.gain.setValueAtTime(0.4, this.ctx.currentTime);

    // Routing
    // Synth -> Filter -> Master Gain -> Destination
    //        Filter -> Delay -> Feedback -> Delay (Feedback Loop)
    //                          Delay -> Master Gain
    this.filterNode.connect(this.masterGain);
    this.filterNode.connect(this.delayNode);
    this.delayNode.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delayNode); // loop
    this.delayNode.connect(this.masterGain);

    this.masterGain.connect(this.ctx.destination);
  }

  /**
   * Synthesize a single note with a piano-like envelope.
   * @param {number} freq - Frequency in Hz
   * @param {number} time - Start time
   * @param {number} duration - Note duration in seconds
   * @param {number} velocity - Gain volume multiplier (0.0 to 1.0)
   */
  playPianoNote(freq, time, duration = 3.0, velocity = 0.5) {
    if (!this.ctx) return;

    // Simple piano synthesis using a mix of Triangle (warmth) and Sine (purity) oscillators
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.01, time); // Subtle detuned octave harmonic

    noteGain.gain.setValueAtTime(0, time);
    
    // Piano ADSR envelope:
    // Instant attack, quick decay, long release
    const attackTime = 0.015;
    const decayTime = 0.35;
    const sustainLevel = 0.3;
    const releaseTime = duration - decayTime - attackTime;

    noteGain.gain.linearRampToValueAtTime(velocity * 0.4, time + attackTime);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.4 * sustainLevel, time + attackTime + decayTime);
    
    // Wait for the release trigger
    noteGain.gain.setValueAtTime(velocity * 0.4 * sustainLevel, time + attackTime + decayTime + 0.1);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Filter sweep: starts bright, rapidly warms up (low pass)
    const noteFilter = this.ctx.createBiquadFilter();
    noteFilter.type = 'lowpass';
    noteFilter.frequency.setValueAtTime(freq * 3, time);
    noteFilter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + 0.5);

    // Route notes through their filter, gain, then the global filter node
    osc1.connect(noteFilter);
    osc2.connect(noteFilter);
    noteFilter.connect(noteGain);
    noteGain.connect(this.filterNode);

    // Play and stop
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  /**
   * Triggers a full chord
   * @param {Array<number>} chordFreqs - Array of frequencies
   */
  playChord(chordFreqs) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    chordFreqs.forEach((freq, index) => {
      // Arpeggiate slightly for human feel (50-100ms stagger)
      const stagger = index * 0.08 + (Math.random() * 0.04);
      // Lower notes louder, higher notes softer
      const vol = 0.7 - (index * 0.08);
      // Soft bass notes hold longer
      const duration = index === 0 ? 5.0 : 4.0;
      this.playPianoNote(freq, now + stagger, duration, vol);
    });
  }

  /**
   * Generates a random melody note matching the key
   */
  playMelodyNote() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Select notes based on active chapter
    // Chapter 3 is melancholic (fewer melody notes, lower register)
    // Chapter 5 & 6 are happy/complete (higher registry, more active)
    let octaveOffset = 0;
    if (this.activeChapter >= 4) {
      octaveOffset = 1; // Play one octave higher
    }
    
    // Select note
    const noteIndex = Math.floor(Math.random() * this.melodyScale.length);
    let freq = this.melodyScale[noteIndex];
    if (octaveOffset > 0) {
      freq *= 2.0; // Shift octave
    }

    // Occasional grace notes / rolls
    const vol = 0.35 + (Math.random() * 0.15);
    const duration = 2.5 + Math.random();
    
    this.playPianoNote(freq, now, duration, vol);

    // 20% chance to play a harmonious secondary note 150ms later
    if (Math.random() > 0.8) {
      const harmIndex = (noteIndex + 2) % this.melodyScale.length;
      const harmFreq = this.melodyScale[harmIndex] * (octaveOffset > 0 ? 2.0 : 1.0);
      this.playPianoNote(harmFreq, now + 0.15, duration - 0.2, vol * 0.7);
    }
  }

  /**
   * Start playing the looping audio schedule
   */
  start() {
    this.init();
    if (this.isPlaying) return;

    this.isPlaying = true;
    
    // Resume audio context if suspended (browser rule)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Fade-in master volume
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(this.currentVolume, this.ctx.currentTime + 1.5);

    // Initial chords and loops
    let chordIndex = this.activeChapter;
    const triggerChordLoop = () => {
      // Rotate chords if desired, or play active chapter's chord
      const currentChord = this.chords[this.activeChapter];
      this.playChord(currentChord);
    };

    triggerChordLoop();
    // Play chord every 6 seconds
    this.chordInterval = setInterval(triggerChordLoop, 6000);

    // Play random slow melodies
    const triggerMelodyLoop = () => {
      // 70% chance to play note to allow empty breathing space
      if (Math.random() > 0.3) {
        this.playMelodyNote();
      }
      // Randomize next note timing between 2.5s and 4.5s
      clearInterval(this.melodyInterval);
      const nextTime = 2500 + Math.random() * 2000;
      this.melodyInterval = setInterval(triggerMelodyLoop, nextTime);
    };
    
    this.melodyInterval = setInterval(triggerMelodyLoop, 3000);
  }

  /**
   * Stop playing / Fade-out
   */
  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    // Fade-out master volume
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
    }

    // Clear loops
    clearInterval(this.chordInterval);
    clearInterval(this.melodyInterval);
    this.chordInterval = null;
    this.melodyInterval = null;
  }

  /**
   * Switch the emotional scale based on active chapter
   * @param {number} index - Active section index (0-5)
   */
  setChapter(index) {
    this.activeChapter = index;
    if (this.isPlaying && this.ctx) {
      // Instantly play the new chapter's chord to reflect state change
      this.playChord(this.chords[index]);
    }
  }

  /**
   * Toggles the audio playback state
   * @returns {boolean} - New playing state
   */
  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }
}

// Export engine globally for script access
window.audioEngine = new CinematicAudioEngine();
