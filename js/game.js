document.addEventListener('DOMContentLoaded', () => {
    // --- Audio System (Programmatic) ---
    class AudioSystem {
        constructor() {
            this.ctx = null;
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.isInitialized = true;
        }

        resume() {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playTone(freq, type, duration, volume = 0.1) {
            this.init();
            this.resume();

            const oscillator = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            oscillator.start();
            oscillator.stop(this.ctx.currentTime + duration);
        }

        playHover() {
            this.playTone(800, 'sine', 0.1, 0.05);
        }

        playClick() {
            this.playTone(400, 'square', 0.05, 0.1);
        }

        playSuccess() {
            const now = this.ctx ? this.ctx.currentTime : 0;
            const sequence = [
                { f: 523.25, t: 0 },   // C5
                { f: 659.25, t: 0.1 }, // E5
                { f: 783.99, t: 0.2 }, // G5
                { f: 1046.50, t: 0.3 } // C6
            ];

            sequence.forEach(note => {
                setTimeout(() => {
                    this.playTone(note.f, 'triangle', 0.4, 0.1);
                }, note.t * 1000);
            });
        }

        playError() {
            this.playTone(150, 'sawtooth', 0.5, 0.15);
            this.playTone(100, 'sawtooth', 0.5, 0.1);
        }

        playTypeSound() {
            // High-pitched short chirp for typing
            this.playTone(1200 + Math.random() * 400, 'sine', 0.02, 0.02);
        }
    }


    const audio = new AudioSystem();

    // Utility to attach audio to buttons
    function attachButtonSounds(selector) {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => audio.playHover());
            btn.addEventListener('click', () => audio.playClick());
        });
    }

    // --- Configuration ---
    let puzzles = [];
    let currentLevelIndex = 0;
    const STORAGE_KEY = 'mission02_level';
    let isEasyMode = false;

    // --- DOM Elements ---
    const fractionA_Text = document.getElementById('fraction-a-text');
    const fractionB_Text = document.getElementById('fraction-b-text');
    const liquidA = document.getElementById('liquid-a');
    const liquidB = document.getElementById('liquid-b');
    const levelIndicator = document.getElementById('level-indicator');
    const sectorIndicator = document.getElementById('sector-indicator');
    const statusText = document.getElementById('status-text');
    const comparisonContainer = document.querySelector('.comparison-container');
    const overlay = document.getElementById('message-overlay');
    const msgTitle = document.getElementById('msg-title');
    const msgBody = document.getElementById('msg-body');
    const nextBtn = document.getElementById('next-btn');
    const startOverlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');

    // Certificate Elements
    const certOverlay = document.getElementById('certificate-overlay'); // New
    const certNameInput = document.getElementById('student-name');
    const printCertBtn = document.getElementById('print-cert-btn');
    const certNameDisplay = document.getElementById('cert-student-name');
    const certDateDisplay = document.getElementById('cert-date');

    // --- Initialization ---
    init();

    async function init() {
        // Run Briefing Animation after user interaction (to allow audio)
        if (startOverlay) {
            // Add a temporary "click to start" listener
            const initialHandler = () => {
                audio.init();
                audio.resume();
                audio.playTone(400, 'sine', 0.1, 0.1);

                // Clear the overlay content for the briefing
                const briefingBox = startOverlay.querySelector('.briefing-box');
                const briefingContent = briefingBox.querySelector('.briefing-content');
                briefingContent.style.visibility = 'visible';

                startOverlay.removeEventListener('click', initialHandler);
                startOverlay.style.cursor = 'default';

                // Remove the "click to start" prompt if we added one
                const prompt = startOverlay.querySelector('.init-prompt');
                if (prompt) prompt.remove();

                runBriefing();
            };

            startOverlay.style.cursor = 'pointer';
            startOverlay.addEventListener('click', initialHandler);

            // Add visual cue to click
            const prompt = document.createElement('p');
            prompt.className = 'init-prompt';
            prompt.innerText = "[ CLICK TO DECRYPT MISSION ]";
            prompt.style.textAlign = 'center';
            prompt.style.color = 'var(--accent-cyan)';
            prompt.style.marginTop = '2rem';
            prompt.style.animation = 'blinker 1.5s infinite';
            startOverlay.querySelector('.briefing-box').appendChild(prompt);

            // Hide the actual content until clicked
            startOverlay.querySelector('.briefing-content').style.visibility = 'hidden';
        }

        // Attach initial sounds (optional here, will re-attach after audio init)
        attachButtonSounds('button, .btn-compare, .next-btn');

        // Handle Start Mission
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                audio.init();
                audio.playClick();
                startOverlay.style.display = 'none';

                // Load data and start game
                loadGameData();
            });
        }
    }

    async function runBriefing() {
        const texts = [
            "> SITUATION: Zeta Station's oxygen mix is unstable.",
            "> OBJECTIVE: Compare pressure levels in TANK A and TANK B.",
            "> TASK: Identify the larger fraction to stabilize the sector.",
            "> WARNING: Errors will cause pressure imbalances."
        ];

        for (let i = 0; i < texts.length; i++) {
            await typeWriter(`type-${i + 1}`, texts[i], 30);
            await new Promise(r => setTimeout(r, 400));
        }

        // Show button
        if (startBtn) {
            startBtn.style.opacity = '1';
            startBtn.style.transform = 'translateY(0)';
            audio.playTone(600, 'sine', 0.2, 0.1); // Notification sound
        }
    }

    async function typeWriter(elementId, text, speed) {
        const el = document.getElementById(elementId);
        if (!el) return;

        for (let i = 0; i < text.length; i++) {
            el.innerHTML += text.charAt(i);

            // Randomly play typing sound
            if (Math.random() > 0.3) {
                audio.playTypeSound();
            }

            await new Promise(r => setTimeout(r, speed));
        }
    }


    async function loadGameData() {
        // Check URL Params for Teacher Mode
        const urlParams = new URLSearchParams(window.location.search);
        isEasyMode = urlParams.get('mode') === 'easy';

        try {
            const response = await fetch('data/puzzles.json');
            puzzles = await response.json();

            // Load progress
            const savedLevel = localStorage.getItem(STORAGE_KEY);
            if (savedLevel) {
                currentLevelIndex = parseInt(savedLevel, 10);
                if (currentLevelIndex >= puzzles.length) currentLevelIndex = 0;
            }

            loadLevel(currentLevelIndex);
        } catch (error) {
            console.error("Failed to load puzzles:", error);
            statusText.innerText = "CRITICAL ERROR: DATA LINK SEVERED.";
        }
    }

    // --- Core Logic ---
    function loadLevel(index) {
        if (index >= puzzles.length) {
            gameComplete();
            return;
        }

        const puzzle = puzzles[index];
        levelIndicator.innerText = `LEVEL ${puzzle.level} / ${puzzles.length}`;

        // Update Sector info if available
        if (puzzle.sector && sectorIndicator) {
            sectorIndicator.innerText = `SECTOR: ${puzzle.sector}`;
        }

        // Update Text (Stacked Math Fraction)
        fractionA_Text.innerHTML = `
            <div class="math-fraction">
                <span class="num">${puzzle.fractionA.n}</span>
                <span class="den">${puzzle.fractionA.d}</span>
            </div>
        `;
        fractionB_Text.innerHTML = `
            <div class="math-fraction">
                <span class="num">${puzzle.fractionB.n}</span>
                <span class="den">${puzzle.fractionB.d}</span>
            </div>
        `;


        // Reset Visuals
        comparisonContainer.classList.remove('shake');

        // FEATURE: Easy Mode vs Standard Mode
        // Standard: Tanks start empty (0%). 
        // Easy: Tanks fill immediately to show size.
        if (isEasyMode) {
            statusText.innerHTML = `> MODE: TRAINING (EASY)<br>> VISUALS ONLINE.`;
            updateTankVisuals(puzzle);
        } else {
            liquidA.style.height = '0%';
            liquidB.style.height = '0%';
            statusText.innerHTML = `> SECTOR ${puzzle.sector || 'UNKNOWN'} ACTIVE.<br>> ANALYZE DATA.`;
        }
    }

    function updateTankVisuals(puzzle) {
        const valA = puzzle.fractionA.n / puzzle.fractionA.d;
        const valB = puzzle.fractionB.n / puzzle.fractionB.d;

        liquidA.style.height = `${valA * 100}%`;
        liquidB.style.height = `${valB * 100}%`;
    }

    window.checkAnswer = (operator) => {
        const puzzle = puzzles[currentLevelIndex];
        const valA = puzzle.fractionA.n / puzzle.fractionA.d;
        const valB = puzzle.fractionB.n / puzzle.fractionB.d;

        // Calculate correct operator dynamically
        let correctOp = '=';
        if (valA > valB) correctOp = '>';
        if (valA < valB) correctOp = '<';

        audio.playClick(); // Click sound on decision

        if (operator === correctOp) {
            handleSuccess(puzzle);
        } else {
            handleFailure();
        }
    };

    function handleSuccess(puzzle) {
        audio.playSuccess(); // Success sound
        statusText.innerHTML = `> MATCH CONFIRMED.<br>> GENERATING VISUAL PROOF...`;

        // FEATURE: Visual Proof
        // Animate tanks to fill up now if they weren't already
        updateTankVisuals(puzzle);

        // Delay showing success msg to let user see the tanks align
        setTimeout(() => {
            overlay.style.display = 'flex';
            msgTitle.innerText = "PRESSURE STABILIZED";
            msgTitle.style.color = "var(--success-green)";

            // Show tanks in background, overlay is semi-transparent? 
            // Actually, keep standard overlay behavior
            msgBody.innerHTML = `
                <div style="margin-bottom:1rem; font-size:1.2rem; color:#ccc">Visual Check Complete</div>
                Correct Code: <strong style="font-size:2rem; color:var(--accent-cyan); letter-spacing:3px;">${puzzle.code}</strong>
            `;

            // Save Progress
            currentLevelIndex++;
            localStorage.setItem(STORAGE_KEY, currentLevelIndex);
        }, 1200); // Wait 1.2s for tank animation
    }

    function handleFailure() {
        audio.playError(); // Error sound
        statusText.innerHTML = `> ALERT: IMBALANCE DETECTED.<br>> RETRY IMMEDIATELY.`;
        comparisonContainer.classList.add('shake');

        setTimeout(() => {
            comparisonContainer.classList.remove('shake');
        }, 500);
    }

    nextBtn.addEventListener('click', () => {
        audio.playClick();
        overlay.style.display = 'none';
        loadLevel(currentLevelIndex);
    });

    // --- Certificate Logic ---
    function gameComplete() {
        // Hide game UI, show Certificate Input
        if (certOverlay) {
            certOverlay.style.display = 'flex';

            // Auto-fill date
            const today = new Date();
            certDateDisplay.innerText = today.toLocaleDateString();
        }
    }

    if (printCertBtn) {
        printCertBtn.addEventListener('click', () => {
            audio.playClick();
            const name = certNameInput.value || "Specialist";
            certNameDisplay.innerText = name;

            // Trigger print
            window.print();
        });
    }
});

