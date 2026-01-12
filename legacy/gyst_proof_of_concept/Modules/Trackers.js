class Tracker extends Module {
    constructor(id, map, adressbook, render_specs, progress) {
        super(id, map, adressbook, render_specs);
        this.progress = progress; // 0 - 1 
    }
}

class ToggleTracker extends Tracker {
    onclick() {
        this.completion = (this.completion > 0.5) ? 1 : 0;
    }
}

class StaticTracker extends Tracker {

}