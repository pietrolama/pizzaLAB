// timer-engine.js
// Motore Timer da Cucina per PizzaLab: Web Audio API (suono senza file esterni)
// e integrazione Notifiche di sistema per notifiche a schermo spento / background.

class KitchenTimer {
    constructor() {
        this.timerId = null;
        this.remainingSeconds = 0;
        this.totalSeconds = 0;
        this.label = 'Timer';
        this.isRunning = false;
        this.isPaused = false;
        this.onTick = null;
        this.onComplete = null;
        this.audioCtx = null;
    }

    _getAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    // Suono campana / chime piacevole a 3 toni armonici
    playChime() {
        try {
            const ctx = this._getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const freqs = [587.33, 880, 1174.66]; // D5, A5, D6 accordo maggiore brillante

            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);

                gain.gain.setValueAtTime(0, now + idx * 0.12);
                gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.12 + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.6);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 1.8);
            });

            // Vibrazione tattile per smartphone
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 400]);
            }
        } catch (e) {
            console.warn('Audio non riproducibile:', e);
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (e) {
                console.warn('Errore permessi notifiche:', e);
            }
        }
    }

    start(minutes, label = 'Timer Impasto', { onTick, onComplete } = {}) {
        this._getAudioContext(); // sblocca audio su interazione utente
        this.requestNotificationPermission();

        this.stop();
        this.totalSeconds = Math.round(minutes * 60);
        this.remainingSeconds = this.totalSeconds;
        this.label = label;
        this.isRunning = true;
        this.isPaused = false;
        this.onTick = onTick;
        this.onComplete = onComplete;

        if (this.onTick) this.onTick(this.remainingSeconds, this.totalSeconds, this.label);

        this.timerId = setInterval(() => {
            if (this.isPaused) return;

            this.remainingSeconds--;
            if (this.onTick) this.onTick(this.remainingSeconds, this.totalSeconds, this.label);

            if (this.remainingSeconds <= 0) {
                this.stop();
                this.playChime();

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('🍕 PizzaLab — Timer Completato!', {
                        body: `È ora di procedere con: "${label}"`,
                        icon: 'img/logo.png',
                    });
                }

                if (this.onComplete) this.onComplete(this.label);
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
    }

    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.isRunning = false;
        this.isPaused = false;
        this.remainingSeconds = 0;
    }

    static formatTime(seconds) {
        const mins = Math.floor(Math.max(0, seconds) / 60);
        const secs = Math.max(0, seconds) % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

export const kitchenTimer = new KitchenTimer();
