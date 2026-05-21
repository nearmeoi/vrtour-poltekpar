
/**
 * LandingScreen — Handles the landing page UI and initial setup
 * (fullscreen, landscape lock, gyroscope permission, panorama load).
 */
export class LandingScreen {
    /**
     * @param {object} app - The main App instance
     */
    constructor(app) {
        this.app = app;
        this._init();
    }

    _init() {
        const landingScreen = document.getElementById('landing-screen');
        const btnStart = document.getElementById('btn-start-tour');

        const enterTour = async () => {
            // Request fullscreen
            await this.app.requestFullscreen();

            // Lock landscape
            this.app.lockLandscape();

            // Resume audio context (required for autoplay policies)
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    if (ctx.state === 'suspended') {
                        await ctx.resume();
                    }
                }
            } catch (e) {
                console.warn('Audio context resume failed:', e);
            }

            // Enable Gyroscope Controls (handles iOS 13+ permission from within user gesture)
            try {
                if (this.app.gyroscopeControls) {
                    const gyroEnabled = await this.app.gyroscopeControls.enable();
                    if (gyroEnabled) {
                        this.app.isGyroEnabled = true;
                        // OrbitControls stays enabled as touch-drag fallback when gyro has no data
                        console.log('Gyroscope enabled for Magic Window mode');
                    } else {
                        console.log('No gyroscope available, using OrbitControls');
                    }
                }
            } catch (e) {
                console.warn('Gyroscope enable failed:', e);
            }

            // Fade out landing screen
            landingScreen.style.opacity = '0';
            setTimeout(() => {
                landingScreen.style.display = 'none';
            }, 500);

            // Show Orbital Menu
            this.app.currentState = 'menu';
            console.log('Opening Orbital Menu...');
            if (this.app.orbitalMenu) {
                this.app.orbitalMenu.show();
            }

            if (this.app.gazeController) {
                this.app.gazeController.triggerLockTime = 1.0; // 1 second lock to prevent instant gaze selection
            }

            this.app.panoramaViewer.setBackButtonVisibility(false);
            this.app.panoramaViewer.setAudioButtonsPosition('standalone');

            // Show VR Button after user starts experience
            if (this.app.vrButton) {
                this.app.vrButton.style.display =
                    (this.app.vrButton.id === 'vr-goggle-button') ? 'flex' : '';
            }
        };

        if (btnStart) {
            btnStart.addEventListener('click', (e) => {
                e.stopPropagation();
                enterTour();
            });
        }
    }

}
