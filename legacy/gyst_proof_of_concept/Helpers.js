class ScrollGroup {
    constructor(id, render_specs) {
        this.id = id;
        this.render_specs = render_specs;
        this.group = [];
        this.listener_group = [];
        this.element, this.position, this.is_x, this.is_y;
    }
    render_all() {
        group.forEach(element => {
            element.render();
        });
    }
    derender_all(render_level) {
        group.forEach(element => {
            element.derender();
        });
    }
    set_listeners() {
        listener_group.forEach(element => {
            element.onscroll = (event) => {
                console.log(event);
            }
        });
    }

    move_y(offset, duration) {
        let previous_time_stamp, start;
        let done = false;

        function step_y(timestamp) {
            if (start === undefined) {
                start = timestamp;
            }
            const elapsed = timestamp - start;

            if (previous_time_stamp !== timestamp) {
                // Math.min() is used here to make sure the element stops at exactly 200px
                const count = Math.min(0.1 * elapsed, offset);
                element.style.transform = `translateX(${count}px)`;
                if (count == offset) done = true;
            }

            if (elapsed < duration) { // Stop the animation after duration in ms
                previous_time_stamp = timestamp;
                if (!done) {
                    window.requestAnimationFrame(step_y);
                }
            }
        }
        window.requestAnimationFrame(step_y);
    }
}