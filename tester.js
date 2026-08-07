// Theme toggle for tester.html
(function () {
  try {
    const stored = localStorage.getItem('ghub-theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('ghub-theme', next);
      } catch (e) {}
      btn.querySelector('span').textContent = next === 'dark' ? 'Theme' : 'Theme';
    });
  }
  // Footer date
  const f = document.getElementById('footer-date');
  if (f) f.textContent = new Date().toISOString().slice(0, 10);
})();

/* =================================================================
   Solo Instrument Transcription Tester
   Pitch detection: ACF2+ (autocorrelation with parabolic interpolation)
   Note segmentation: time-domain grouping of contiguous same-pitch frames
   ================================================================= */
(function () {
  'use strict';

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let audioBuffer = null;
  let sampleRate = 44100;

  const fileInput = document.getElementById('file-input');
  const sampleBtn = document.getElementById('sample-btn');
  const analyzeBtn = document.getElementById('analyze-btn');
  const status = document.getElementById('status');
  const waveCanvas = document.getElementById('wave-canvas');
  const pianoCanvas = document.getElementById('piano-canvas');
  const description = document.getElementById('description');

  // Output audio player
  const outputAudio = document.getElementById('output-audio');
  const outputPlay = document.getElementById('output-play');
  const outputStop = document.getElementById('output-stop');
  const outputProgress = document.getElementById('output-progress');
  const outputTime = document.getElementById('output-time');
  const outputDownload = document.getElementById('output-download');
  const outputMidiDownload = document.getElementById('output-midi-download');

  const sNotes = document.getElementById('s-notes');
  const sKey = document.getElementById('s-key');
  const sRange = document.getElementById('s-range');
  const sTempo = document.getElementById('s-tempo');

  function ensureCtx() {
    if (!ctx) ctx = new AudioContextClass();
    return ctx;
  }

  function setStatus(msg) {
    status.textContent = msg;
  }

  function getCss(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#7dd3c0';
  }

  function formatTime(s) {
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  /* ---------- MIDI / pitch conversion helpers ---------- */
  function freqToMidi(f) {
    return Math.round(12 * (Math.log(f / 440) / Math.log(2)) + 69);
  }
  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }
  function midiToName(m) {
    const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const oct = Math.floor(m / 12) - 1;
    return NAMES[m % 12] + oct;
  }
  function midiToPC(m) {
    return ((m % 12) + 12) % 12;
  }

  /* ---------- Audio loading ---------- */
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    ensureCtx();
    setStatus('Decoding ' + file.name + '…');
    const reader = new FileReader();
    reader.onload = (ev) => {
      ctx.decodeAudioData(ev.target.result, (buf) => {
        audioBuffer = buf;
        sampleRate = buf.sampleRate;
        drawWaveform(buf);
        setStatus('Loaded ' + file.name + ' (' + buf.duration.toFixed(2) + 's @ ' + buf.sampleRate + 'Hz). Click Analyze.');
        analyzeBtn.disabled = false;
      }, (err) => {
        setStatus('Failed to decode: ' + (err.message || err));
      });
    };
    reader.readAsArrayBuffer(file);
  });

  sampleBtn.addEventListener('click', () => {
    setStatus('Generating built-in sample: C major scale…');
    ensureCtx();
    const sr = 44100;
    sampleRate = sr;
    const len = Math.floor(sr * 4); // 4 seconds
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    // 8 notes (C4..C5), 0.5s each
    const notes = [60, 62, 64, 65, 67, 69, 71, 72];
    for (let i = 0; i < notes.length; i++) {
      const f = midiToFreq(notes[i]);
      const start = Math.floor((i * 0.5) * sr);
      const end = Math.floor(((i + 1) * 0.5) * sr);
      for (let j = start; j < end; j++) {
        const t = (j - start) / sr;
        const rel = t / 0.5;
        let env = 1;
        const attack = 0.02, release = 0.05;
        if (rel < attack) env = rel / attack;
        else if (rel > 1 - release) env = (1 - rel) / release;
        data[j] = 0.5 * env * Math.sin(2 * Math.PI * f * t);
      }
    }
    audioBuffer = buf;
    drawWaveform(buf);
    setStatus('Sample loaded: C major scale (8 notes, 4s). Click Analyze.');
    analyzeBtn.disabled = false;
  });

  function drawWaveform(buf) {
    const canvas = waveCanvas;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : 600;
    const h = rect.height > 0 ? rect.height : 200;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const c = canvas.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(dpr, dpr);
    const accent = getCss('--accent');
    const border = getCss('--border');
    c.clearRect(0, 0, w, h);
    c.strokeStyle = border;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, h / 2);
    c.lineTo(w, h / 2);
    c.stroke();
    const data = buf.getChannelData(0);
    const step = Math.max(1, Math.floor(data.length / w));
    c.strokeStyle = accent;
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i < w; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const v = data[(i * step) + j] || 0;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      c.moveTo(i + 0.5, (1 + min) * h / 2);
      c.lineTo(i + 0.5, (1 + max) * h / 2);
    }
    c.stroke();
  }

  /* ---------- ACF2+ pitch detection on a frame ---------- */
  function detectPitchACF2Plus(buf, sr, startIdx, frameSize) {
    let rms = 0;
    for (let i = 0; i < frameSize; i++) {
      const v = buf[startIdx + i] || 0;
      rms += v * v;
    }
    rms = Math.sqrt(rms / frameSize);
    if (rms < 0.01) return -1;

    const minLag = Math.floor(sr / 1500); // 1500 Hz max
    const maxLag = Math.floor(sr / 60);   // 60 Hz min
    let bestLag = -1;
    let bestVal = 0;
    const diff = new Float32Array(maxLag + 1);
    for (let lag = 1; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < frameSize - lag; i++) {
        const d = (buf[startIdx + i] || 0) - (buf[startIdx + i + lag] || 0);
        sum += d * d;
      }
      diff[lag] = sum;
    }
    const c = new Float32Array(maxLag + 1);
    c[0] = 1;
    for (let lag = 1; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < frameSize - lag; i++) {
        sum += (buf[startIdx + i] || 0) * (buf[startIdx + i + lag] || 0);
      }
      const norm = Math.sqrt(diff[lag] * diff[0] || 1);
      c[lag] = norm > 0 ? sum / norm : 0;
    }
    for (let lag = minLag; lag <= maxLag; lag++) {
      if (c[lag] > bestVal) {
        bestVal = c[lag];
        bestLag = lag;
      }
    }
    if (bestLag < 0 || bestVal < 0.3) return -1;
    // Parabolic interpolation
    const lag = bestLag;
    if (lag > 0 && lag < maxLag) {
      const s0 = c[lag - 1], s1 = c[lag], s2 = c[lag + 1];
      const denom = (s0 + s2 - 2 * s1);
      if (denom !== 0) {
        const delta = 0.5 * (s0 - s2) / denom;
        return sr / (lag + delta);
      }
    }
    return sr / bestLag;
  }

  /* ---------- Run full-buffer analysis ---------- */
  function analyzeBuffer() {
    if (!audioBuffer) return;
    setStatus('Analyzing…');
    analyzeBtn.disabled = true;
    const data = audioBuffer.getChannelData(0);
    const sr = sampleRate;
    const frameSize = Math.floor(sr * 0.04); // 40ms
    const hop = Math.floor(sr * 0.02);      // 20ms hop
    const pitches = [];
    setTimeout(() => {
      for (let i = 0; i + frameSize < data.length; i += hop) {
        const t = i / sr;
        const f = detectPitchACF2Plus(data, sr, i, frameSize);
        if (f > 0) pitches.push({ t, f });
      }
      // Group into notes
      const tolerance = 1.06; // ~1 semitone
      const notes = [];
      let noteStart = null, noteFreq = null;
      for (let i = 0; i < pitches.length; i++) {
        const f = pitches[i].f;
        if (noteStart === null) {
          noteStart = pitches[i].t;
          noteFreq = f;
          continue;
        }
        if (f / noteFreq > tolerance || noteFreq / f > tolerance) {
          notes.push({ start: noteStart, end: pitches[i].t, freq: noteFreq });
          noteStart = pitches[i].t;
          noteFreq = f;
        }
      }
      if (noteStart !== null && pitches.length) {
        notes.push({ start: noteStart, end: pitches[pitches.length - 1].t, freq: noteFreq });
      }
      const filtered = notes.filter((n) => (n.end - n.start) >= 0.05);
      setStatus('Analysis complete: ' + filtered.length + ' note(s) detected.');
      drawPianoRoll(filtered, audioBuffer.duration);
      description.textContent = generateDescription(filtered, audioBuffer.duration);
      updateStats(filtered);
      buildSynthesizedOutput(filtered);
      analyzeBtn.disabled = false;
    }, 50);
  }

  function drawPianoRoll(notes, totalDur) {
    const canvas = pianoCanvas;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : 600;
    const h = rect.height > 0 ? rect.height : 240;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const c = canvas.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(dpr, dpr);

    const lo = 36, hi = 84;
    const nMidi = hi - lo;
    const padX = 8, padY = 6;
    const accent = getCss('--accent');
    const border = getCss('--border');
    const borderStrong = getCss('--border-strong');
    const textDim = getCss('--text-dim');
    const textFaint = getCss('--text-faint');

    c.fillStyle = getCss('--code-bg');
    c.fillRect(0, 0, w, h);

    for (let m = lo; m <= hi; m++) {
      const y = padY + (hi - m) / nMidi * (h - 2 * padY);
      const isC = (m % 12) === 0;
      c.strokeStyle = isC ? borderStrong : border;
      c.beginPath();
      c.moveTo(padX, y);
      c.lineTo(w - padX, y);
      c.stroke();
    }
    for (let s = 0; s <= totalDur; s++) {
      const x = padX + s / totalDur * (w - 2 * padX);
      c.beginPath();
      c.moveTo(x, padY);
      c.lineTo(x, h - padY);
      c.stroke();
    }

    c.fillStyle = accent;
    notes.forEach((n) => {
      const midi = freqToMidi(n.freq);
      if (midi < lo || midi > hi) return;
      const yMid = padY + (hi - midi) / nMidi * (h - 2 * padY);
      const xStart = padX + n.start / totalDur * (w - 2 * padX);
      const xEnd = padX + n.end / totalDur * (w - 2 * padX);
      const noteH = (h - 2 * padY) / nMidi * 0.85;
      c.fillRect(xStart, yMid - noteH / 2, Math.max(2, xEnd - xStart), noteH);
    });

    c.fillStyle = textDim;
    c.font = '10px ui-monospace, SFMono-Regular, monospace';
    c.textAlign = 'right';
    for (let m2 = lo; m2 <= hi; m2 += 12) {
      const y2 = padY + (hi - m2) / nMidi * (h - 2 * padY);
      c.fillText(midiToName(m2), padX - 2, y2 + 3);
    }
    c.textAlign = 'center';
    c.fillStyle = textFaint;
    for (let s2 = 0; s2 <= totalDur; s2 += Math.max(1, Math.floor(totalDur / 5))) {
      const x2 = padX + s2 / totalDur * (w - 2 * padX);
      c.fillText(s2 + 's', x2, h - 1);
    }
  }

  /* ---------- Key / range / tempo / multi-instrument description ---------- */
  const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

  function inferKey(notes) {
    if (!notes.length) return { name: '—', root: -1, mode: '—' };
    const hist = new Array(12).fill(0);
    notes.forEach((n) => {
      const pc = midiToPC(freqToMidi(n.freq));
      hist[pc] += (n.end - n.start);
    });
    let best = { score: -1, root: 0, mode: 'major' };
    for (let root = 0; root < 12; root++) {
      let major = 0, minor = 0;
      for (let i = 0; i < 12; i++) {
        major += hist[(i + root) % 12] * MAJOR_PROFILE[i];
        minor += hist[(i + root) % 12] * MINOR_PROFILE[i];
      }
      if (major > best.score) best = { score: major, root, mode: 'major' };
      if (minor > best.score) best = { score: minor, root, mode: 'minor' };
    }
    const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return { name: NAMES[best.root] + ' ' + best.mode, root: best.root, mode: best.mode };
  }

  function inferTempo(notes) {
    if (notes.length < 4) return { bpm: null, display: '—', confidence: 0, method: 'too-few-notes' };
    const onsets = notes.map((n) => n.start).sort((a, b) => a - b);
    const lastOnset = onsets[onsets.length - 1];
    if (lastOnset < 1.0) return { bpm: null, display: '—', confidence: 0, method: 'too-short' };
    const SR_MS = 1000;
    const SIGMA_MS = 35;
    const lenMs = Math.ceil(lastOnset * SR_MS) + SIGMA_MS * 6;
    const kernel = new Float32Array(lenMs);
    const sigma2 = SIGMA_MS * SIGMA_MS;
    for (let i = 0; i < onsets.length; i++) {
      const center = Math.round(onsets[i] * SR_MS);
      const span = Math.ceil(SIGMA_MS * 3);
      for (let d = -span; d <= span; d++) {
        const idx = center + d;
        if (idx >= 0 && idx < kernel.length) {
          kernel[idx] = Math.exp(-(d * d) / (2 * sigma2));
        }
      }
    }
    let bestBpm = 120;
    let bestScore = 0;
    const scores = {};
    for (let bpmInt = 40; bpmInt <= 240; bpmInt++) {
      const beatMs = 60000 / bpmInt;
      let score = 0;
      for (let t = 0; t < kernel.length; t += beatMs) {
        const idx = Math.round(t);
        if (idx < kernel.length) score += kernel[idx];
      }
      scores[bpmInt] = score;
      if (score > bestScore) { bestScore = score; bestBpm = bpmInt; }
    }
    const halfBpm = bestBpm / 2;
    if (halfBpm >= 40 && scores[Math.round(halfBpm)] >= bestScore * 0.7) {
      bestBpm = Math.round(halfBpm);
      bestScore = scores[bestBpm];
    }
    const dblBpm = bestBpm * 2;
    if (dblBpm <= 240 && scores[dblBpm] > bestScore * 1.3 && scores[Math.round(bestBpm / 2)] < bestScore * 0.4) {
      bestBpm = Math.round(dblBpm);
      bestScore = scores[bestBpm];
    }
    const sorted = Object.keys(scores).map((k) => scores[k]).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 1;
    const confidence = Math.min(1, bestScore / (median * 4));
    return { bpm: bestBpm, display: bestBpm + ' BPM', confidence, method: 'onset-autocorr' };
  }

  function notesToMidi(notes, bpm) {
    if (!notes.length) return null;
    bpm = bpm || 120;
    const PPQ = 480;
    const microsecPerQuarter = Math.round(60000000 / bpm);
    const events = [];
    notes.forEach((n) => {
      const pitch = freqToMidi(n.freq);
      if (pitch < 0 || pitch > 127) return;
      const onTick = Math.max(0, Math.round(n.start * bpm / 60 * PPQ));
      const offTick = Math.max(onTick + 1, Math.round(n.end * bpm / 60 * PPQ));
      events.push({ tick: onTick, type: 0x90, d1: pitch, d2: 100 });
      events.push({ tick: offTick, type: 0x80, d1: pitch, d2: 0 });
    });
    events.sort((a, b) => a.tick - b.tick);
    const track = [];
    track.push(0x00, 0xFF, 0x51, 0x03,
      (microsecPerQuarter >> 16) & 0xFF,
      (microsecPerQuarter >> 8) & 0xFF,
      microsecPerQuarter & 0xFF);
    track.push(0x00, 0xFF, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);
    const name = 'Gradio Pipeline Hub Tester';
    track.push(0x00, 0xFF, 0x03, name.length);
    for (let n = 0; n < name.length; n++) track.push(name.charCodeAt(n) & 0x7F);
    let prevTick = 0;
    for (let i = 0; i < events.length; i++) {
      let delta = events[i].tick - prevTick;
      if (delta < 0) delta = 0;
      const vlq = [];
      vlq.push(delta & 0x7F);
      delta >>= 7;
      while (delta > 0) {
        vlq.push((delta & 0x7F) | 0x80);
        delta >>= 7;
      }
      vlq.reverse();
      for (let k = 0; k < vlq.length; k++) track.push(vlq[k]);
      track.push(events[i].type, events[i].d1, events[i].d2);
      prevTick = events[i].tick;
    }
    track.push(0x00, 0xFF, 0x2F, 0x00);
    const header = [];
    header.push(0x4D, 0x54, 0x68, 0x64);
    header.push(0x00, 0x00, 0x00, 0x06);
    header.push(0x00, 0x00);
    header.push(0x00, 0x01);
    header.push((PPQ >> 8) & 0xFF, PPQ & 0xFF);
    const trackHeader = [];
    trackHeader.push(0x4D, 0x54, 0x72, 0x6B);
    const trackLen = track.length;
    trackHeader.push((trackLen >> 24) & 0xFF, (trackLen >> 16) & 0xFF,
                    (trackLen >> 8) & 0xFF, trackLen & 0xFF);
    const all = header.concat(trackHeader, track);
    return new Blob([new Uint8Array(all)], { type: 'audio/midi' });
  }

  function generateDescription(notes, dur) {
    if (!notes.length) return 'No notes detected. Try a louder or longer signal.';
    const key = inferKey(notes);
    const midis = notes.map((n) => freqToMidi(n.freq));
    const lo = Math.min.apply(null, midis);
    const hi = Math.max.apply(null, midis);
    const totalDur = notes.reduce((s, n) => s + (n.end - n.start), 0);
    const density = (notes.length / dur).toFixed(2);
    const tempoResult = inferTempo(notes);
    const tempo = tempoResult.display;
    const range = hi - lo;
    const avgMidi = midis.reduce((a, b) => a + b, 0) / midis.length;
    const register = avgMidi < 55 ? 'low (bass / cello / trombone range)'
                  : avgMidi < 67 ? 'mid-low (tenor / viola / trombone range)'
                  : avgMidi < 76 ? 'mid (cello / alto sax range)'
                  : 'high (violin / flute / soprano range)';
    const arrLines = range < 5
      ? ['Lead (solo instrument, doubled an octave below by bass)', 'Pad (sustained chord on the detected key, 4-voice)', 'Bass (root + fifth, every 2 beats)']
      : range < 12
      ? ['Lead (solo instrument, original register)', 'Harmony (a 3rd or 6th below, sustained)', 'Bass (root on beat 1, fifth on beat 3)']
      : ['Lead (solo instrument, original register)', 'Counter-line (improvised on a 5th or 7th)', 'Inner voice (3rd below the lead, sustained)', 'Bass (root + fifth pattern, octave below)'];
    const noteNames = notes.slice(0, 12).map((n) => midiToName(freqToMidi(n.freq)));
    const desc = [
      '═══════════════════════════════════════════════════════════════════════',
      '  MULTI-INSTRUMENT ARRANGEMENT DESCRIPTION',
      '  Generated ' + new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC',
      '═══════════════════════════════════════════════════════════════════════',
      '',
      'INPUT ANALYSIS',
      '  Audio duration:        ' + dur.toFixed(2) + ' s',
      '  Notes detected:        ' + notes.length + ' (pitch segmentation via ACF2+)',
      '  Detected key:          ' + key.name,
      '  Detected tempo:        ' + tempo + (tempoResult.bpm ? '   (method: ' + tempoResult.method + ', confidence: ' + Math.round(tempoResult.confidence * 100) + '%)' : ''),
      '  Register:              ' + register,
      '  Range:                 ' + midiToName(lo) + '  →  ' + midiToName(hi) + '  (' + range + ' semitones)',
      '  Note density:          ' + density + ' notes / second',
      '  Sounded duration:      ' + totalDur.toFixed(2) + ' s  (' + Math.round(100 * totalDur / dur) + '% of audio)',
      '',
      'DETECTED NOTE STREAM (first 12)',
      '  ' + noteNames.join(' · '),
      '',
      'SUGGESTED MULTI-INSTRUMENT ARRANGEMENT',
      '  Voice 1 — Lead:        ' + arrLines[0],
    ];
    for (let i = 1; i < arrLines.length; i++) {
      desc.push('  Voice ' + (i + 1) + ' — ' + (i === arrLines.length - 1 ? 'Bass:       ' : 'Harmony:    ') + arrLines[i]);
    }
    desc.push('');
    desc.push('INSTRUMENTATION HINTS (based on register)');
    if (avgMidi < 55) {
      desc.push('  Lead: cello, bassoon, euphonium, or tenor sax');
      desc.push('  Harmony: viola, french horn');
      desc.push('  Bass: double bass, tuba');
    } else if (avgMidi < 67) {
      desc.push('  Lead: viola, trombone, tenor sax, or french horn');
      desc.push('  Harmony: violin 2, alto sax');
      desc.push('  Bass: cello, bass trombone');
    } else if (avgMidi < 76) {
      desc.push('  Lead: violin, oboe, flute, or soprano sax');
      desc.push('  Harmony: violin 2, clarinet');
      desc.push('  Bass: cello, bassoon');
    } else {
      desc.push('  Lead: violin, flute, piccolo, or soprano sax');
      desc.push('  Harmony: violin 2, oboe');
      desc.push('  Bass: viola, cello');
    }
    desc.push('');
    desc.push('NEXT STEPS IN THE PIPELINE');
    desc.push('  1. Take this solo MIDI into a real AMT (e.g., Basic Pitch on HF)');
    desc.push('     to confirm the note stream — the browser ACF2+ is monophonic-only.');
    desc.push('  2. Run Demucs on the source audio to extract accompaniment stems,');
    desc.push('     if any, and add them as additional voices.');
    desc.push('  3. Use music21 to quantize the lead MIDI to a clean 16th-note grid.');
    desc.push('  4. Hand-write the harmony lines above as additional tracks in your DAW.');
    desc.push('  5. Render the score with Verovio for visual review.');
    desc.push('');
    desc.push('═══════════════════════════════════════════════════════════════════════');
    return desc.join('\n');
  }

  function updateStats(notes) {
    sNotes.textContent = String(notes.length);
    const key = inferKey(notes);
    sKey.textContent = key.name;
    if (notes.length) {
      const midis = notes.map((n) => freqToMidi(n.freq));
      sRange.textContent = midiToName(Math.min.apply(null, midis)) + '–' + midiToName(Math.max.apply(null, midis));
    } else {
      sRange.textContent = '—';
    }
    const tempoResult = inferTempo(notes);
    sTempo.textContent = tempoResult.display;
  }

  function audioBufferToWavBlob(buffer) {
    const numCh = buffer.numberOfChannels;
    const sr = buffer.sampleRate;
    const len = buffer.length;
    const bytesPerSample = 2;
    const blockAlign = numCh * bytesPerSample;
    const byteRate = sr * blockAlign;
    const dataSize = len * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    const ab = new ArrayBuffer(totalSize);
    const view = new DataView(ab);
    function ws(off, str) { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); }
    ws(0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    ws(8, 'WAVE');
    ws(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 8 * bytesPerSample, true);
    ws(36, 'data');
    view.setUint32(40, dataSize, true);
    const chData = [];
    for (let c = 0; c < numCh; c++) chData.push(buffer.getChannelData(c));
    let off = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < numCh; c++) {
        const s = Math.max(-1, Math.min(1, chData[c][i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        off += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  function synthesizeNotes(notes, sr) {
    if (!notes.length) return ensureCtx().createBuffer(1, Math.floor(0.2 * sr), sr);
    const end = Math.max.apply(null, notes.map((n) => n.end)) + 0.1;
    const len = Math.floor(end * sr);
    const buf = ensureCtx().createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    const coeffs = notes.map((note) => {
      const sStart = Math.max(0, Math.floor(note.start * sr));
      const sEnd = Math.min(len, Math.floor(note.end * sr));
      const dur = note.end - note.start;
      const f = note.freq;
      return { sStart, sEnd, dur, f, startTime: note.start };
    });
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let sum = 0;
      for (let n = 0; n < coeffs.length; n++) {
        const c = coeffs[n];
        if (i < c.sStart || i >= c.sEnd) continue;
        const rel = (t - c.startTime) / c.dur;
        let env = 1;
        const attack = 0.012, release = 0.06;
        if (rel < attack) env = rel / attack;
        else if (rel > 1 - release) env = (1 - rel) / release;
        const sine = Math.sin(2 * Math.PI * c.f * t);
        const harm = 0.25 * Math.sin(2 * Math.PI * c.f * 2 * t + 0.4);
        sum += 0.35 * env * (sine + harm);
      }
      data[i] = Math.tanh(sum);
    }
    return buf;
  }

  function buildSynthesizedOutput(notes) {
    if (!notes.length) {
      outputPlay.disabled = true;
      outputStop.disabled = true;
      return;
    }
    const tempoResult = inferTempo(notes);
    const bpm = tempoResult.bpm || 120;
    try {
      const midiBlob = notesToMidi(notes, bpm);
      if (midiBlob) {
        if (outputMidiDownload.href) { try { URL.revokeObjectURL(outputMidiDownload.href); } catch (e) {} }
        const midiUrl = URL.createObjectURL(midiBlob);
        outputMidiDownload.href = midiUrl;
        outputMidiDownload.download = 'transcribed-bpm' + bpm + '.mid';
        outputMidiDownload.style.display = '';
      }
    } catch (e) {}
    const synthBuf = synthesizeNotes(notes, sampleRate);
    const blob = audioBufferToWavBlob(synthBuf);
    const url = URL.createObjectURL(blob);
    if (outputAudio.src) { try { URL.revokeObjectURL(outputAudio.src); } catch (e) {} }
    outputAudio.src = url;
    outputDownload.href = url;
    outputDownload.download = 'synthesized.wav';
    outputDownload.style.display = '';
    outputPlay.disabled = false;
    outputStop.disabled = false;
  }

  // Output player controls
  outputPlay.addEventListener('click', () => {
    if (outputAudio.paused) {
      outputAudio.play();
      outputPlay.textContent = '❚❚';
    } else {
      outputAudio.pause();
      outputPlay.textContent = '▶';
    }
  });
  outputStop.addEventListener('click', () => {
    outputAudio.pause();
    outputAudio.currentTime = 0;
    outputPlay.textContent = '▶';
  });
  outputAudio.ontimeupdate = () => {
    const d = outputAudio.duration || 0;
    const t = outputAudio.currentTime || 0;
    outputProgress.style.width = (d > 0 ? (t / d * 100) : 0) + '%';
    outputTime.textContent = formatTime(t) + ' / ' + formatTime(d);
  };
  outputAudio.onended = () => { outputPlay.textContent = '▶'; };

  // Initialize canvas on load
  function initCanvases() {
    [waveCanvas, pianoCanvas].forEach((canvas) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : 600;
      const h = rect.height > 0 ? rect.height : 200;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const c = canvas.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.scale(dpr, dpr);
      c.fillStyle = getCss('--code-bg');
      c.fillRect(0, 0, w, h);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvases);
  } else {
    initCanvases();
  }
  window.addEventListener('resize', initCanvases);

  analyzeBtn.addEventListener('click', () => {
    try { analyzeBuffer(); }
    catch (e) { setStatus('Analysis error: ' + e.message); }
  });
})();
