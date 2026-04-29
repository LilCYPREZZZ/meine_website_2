/* Shared helpers: fullscreen option, quiz logic, toggles */
(function () {
    var STORAGE = {
        fullscreen: 'pref-fullscreen',
        animations: 'pref-animations',
        shader: 'pref-shader'
    };

    function getPref(key, def) {
        var v = localStorage.getItem(key);
        if (v === null) return def;
        return v === 'true';
    }

    function setPref(key, val) {
        localStorage.setItem(key, val ? 'true' : 'false');
    }

    // Expose globally
    window.LE = {
        getPref: getPref,
        setPref: setPref,
        STORAGE: STORAGE,

        // Called from the intro START button
        startLearning: function () {
            if (getPref(STORAGE.fullscreen, true) && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(function () {});
            }
            window.location.href = 'menu.html';
        },

        // Apply persisted settings on load
        applyPrefs: function () {
            // Disable animations if user turned them off
            if (!getPref(STORAGE.animations, true)) {
                document.documentElement.style.setProperty('--anim', '0');
                var style = document.createElement('style');
                style.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
                document.head.appendChild(style);
            }
            // Hide shader if disabled
            if (!getPref(STORAGE.shader, true)) {
                var bg = document.getElementById('bg-shader');
                if (bg) bg.style.display = 'none';
            }
        },

        // Quiz interaction
        checkAnswer: function (btn, isCorrect) {
            var card = btn.closest('.quiz-card');
            if (!card || card.dataset.answered === '1') return;
            card.dataset.answered = '1';

            var opts = card.querySelectorAll('.quiz-opt');
            opts.forEach(function (o) {
                o.disabled = true;
                if (o.dataset.correct === '1') o.classList.add('correct');
            });

            if (!isCorrect) btn.classList.add('wrong');

            var fb = card.querySelector('.quiz-feedback');
            if (fb) {
                fb.classList.add('show');
                fb.classList.add(isCorrect ? 'ok' : 'fail');
            }
        },

        // Toggle helpers for options page
        bindToggle: function (el, key, def, onChange) {
            var state = getPref(key, def);
            if (state) el.classList.add('on');
            el.setAttribute('role', 'switch');
            el.setAttribute('aria-checked', state ? 'true' : 'false');
            el.addEventListener('click', function () {
                state = !state;
                el.classList.toggle('on', state);
                el.setAttribute('aria-checked', state ? 'true' : 'false');
                setPref(key, state);
                if (typeof onChange === 'function') onChange(state);
            });
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
            });
            el.setAttribute('tabindex', '0');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.LE.applyPrefs);
    } else {
        window.LE.applyPrefs();
    }
})();
