class TempAnimations extends Animation {
    animate(m_id) {
        let rgba = [256, 256, 256, 0.5];
        let interval = 5;
        let id = null;
        clearInterval(id);
        let opacity = 0;
        let done = false;
        let m = document.getElementById(m_id);

        let animation_module = m.cloneNode(true);
        animation_module.style.backgroundColor = `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`;
        animation_module.style.zIndex = 99;
        animation_module.style.opacity = opacity;
        m.parentElement.appendChild(animation_module);
        id = setInterval(frame, interval);

        function frame() {
            if (opacity >= 1) {
                done = true;
            } else if (opacity <= 0 && done == true) {
                animation_module.remove();
                clearInterval(id);
                return;
            }
            animation_module.style.opacity = opacity;
            if (done) {
                opacity -= 0.01
            } else {
                opacity += 0.01;
            }
        }

    }
}