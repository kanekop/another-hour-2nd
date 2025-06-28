export class SunAnimation {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
        this.sunGroup = document.getElementById('sun-group');
        this.orbitPath = document.getElementById('sun-orbit');
        
        this.svgWidth = 800;
        this.svgHeight = 400;
        this.horizonY = 300;
        
        this.initOrbitPath();
    }

    initOrbitPath() {
        // Draw the sun's arc path
        const startX = 100;
        const endX = 700;
        const peakY = 100;
        
        const path = `M ${startX},${this.horizonY} 
                      Q ${this.svgWidth/2},${peakY} ${endX},${this.horizonY}`;
        
        this.orbitPath.setAttribute('d', path);
    }

    updateSunPosition(progress, phase) {
        if (phase === 'night') {
            // Hide sun during night
            this.sunGroup.style.opacity = '0';
            this.showStars(true);
            return;
        }

        this.sunGroup.style.opacity = '1';
        this.showStars(false);
        
        // Calculate position on the arc
        const startX = 100;
        const endX = 700;
        const rangeX = endX - startX;
        
        const x = startX + (rangeX * progress);
        const y = this.calculateY(x, progress);
        
        // Update sun position
        this.sunGroup.setAttribute('transform', `translate(${x}, ${y})`);
        
        // Adjust sun size based on time of day
        const scale = 1 + (0.2 * Math.sin(Math.PI * progress));
        this.sunGroup.querySelector('.sun').setAttribute('r', 30 * scale);
        
        // Adjust glow effect
        const glowOpacity = 0.3 + (0.4 * (1 - Math.abs(progress - 0.5) * 2));
        this.sunGroup.querySelector('.sun-glow').style.opacity = glowOpacity;
    }

    calculateY(x, progress) {
        // Calculate parabolic path
        const startX = 100;
        const endX = 700;
        const peakY = 100;
        
        // Quadratic function for the arc
        const a = 4 * (this.horizonY - peakY) / Math.pow(endX - startX, 2);
        const h = (startX + endX) / 2;
        
        return a * Math.pow(x - h, 2) + peakY;
    }

    showStars(show) {
        let starsGroup = document.getElementById('stars');
        
        if (show && !starsGroup) {
            this.addStars();
        } else if (starsGroup) {
            starsGroup.style.opacity = show ? '1' : '0';
        }
    }

    addStars(count = 50) {
        // Add stars for night sky
        const starsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        starsGroup.id = 'stars';
        starsGroup.style.transition = 'opacity 2s ease';
        
        for (let i = 0; i < count; i++) {
            const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            star.setAttribute('cx', Math.random() * this.svgWidth);
            star.setAttribute('cy', Math.random() * (this.horizonY - 50));
            star.setAttribute('r', Math.random() * 2 + 0.5);
            star.setAttribute('fill', 'white');
            star.setAttribute('opacity', Math.random() * 0.8 + 0.2);
            star.classList.add('star');
            
            // Random animation delay for twinkling
            star.style.animationDelay = `${Math.random() * 3}s`;
            
            starsGroup.appendChild(star);
        }
        
        this.svg.insertBefore(starsGroup, this.svg.firstChild);
    }

    animateSunrise() {
        // Special animation for sunrise
        const sun = this.sunGroup.querySelector('.sun');
        sun.style.filter = 'drop-shadow(0 0 30px #ff6b6b)';
        setTimeout(() => {
            sun.style.filter = 'drop-shadow(0 0 20px #FFD700)';
        }, 3000);
    }

    animateSunset() {
        // Special animation for sunset
        const sun = this.sunGroup.querySelector('.sun');
        sun.style.filter = 'drop-shadow(0 0 30px #ff4757)';
    }
}