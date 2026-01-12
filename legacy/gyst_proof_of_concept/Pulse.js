const PulseType = {
    BACK: -1,
    STANDARD: 0,
    EXPAND: 1
}

const AnimationType = {
    TEMP: 0,
    TOGGLE: 1,
    CHANGE: 2
}

class Payload {}
class Condition {}
class Animation {
    constructor(style, type, duration) {
        this.duration = duration;
        this.style = style
        this.type = type
    }

    animate(id) {
        let temp = new TempAnimations();
        let m = document.getElementById(id);
        m.style.animationDuration = this.duration;
        switch (this.type) {
            case AnimationType.TEMP:
                temp.animate(id);
                break;
        }

    }
}
class Executable {}
class Spread {}

class Pulse {
    constructor(signature, spread, executable, back_pulse, type, payload, animation, report_conditions, delay) {
        this.signature = signature;
        this.spread = spread;
        this.executable = executable;
        this.back_pulse = back_pulse;
        this.type = type;
        this.payload = payload;
        this.animation = animation;
        this.report_conditions = report_conditions;
        this.delay = delay;

        this.layer = 1;
        this.log = [];

    }

    spread_self(map) {
        this.spread.spread(this, map);
        return this;
    }

}

class BackPulse extends Pulse {
    constructor(signature, spread, executable) {
        super(signature, spread, executable, this, PulseType.BACK)
        this.fail_condition = Condition();
        this.success_state = true;
    }
}