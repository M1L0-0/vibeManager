class Position {
    constructor(offset_x, offset_y) {
        this.offset_x = offset_x;
        this.offset_y = offset_y;
    }
}

class DataType {
    constructor(scope, datatype) {
        this.SCOPES = {
            public: 0,
            private: 1,
            restricted: 2,
            beacon: 3
        };
        this.DATA_TYPES = {
            INT: 0,
            FLOAT: 0.0,
            STRING: '',
            BOOL: false,
            LIST: [],
            MAP: {},
            QUERY: 'QUERY_PLACEHOLDER',
        }

        if (!this.validate(scope, this.SCOPES)) { console.log('Invalid Scope') }
        if (!this.validate(datatype, this.DATA_TYPES)) { console.log('Invalid DataType') }
        this.scope = scope;
        this.datatype = datatype;
    }

    get_default_value() {
        if (this.validate(this.datatype, this.DATA_TYPES)) {
            return this.DATA_TYPES[this.datatype];
        }
        return null
    }

    validate(value, base) { return value in base }
}

class DataStruct {
    constructor(data) {
        this.data = data;
    }
}

class RenderSpecs {
    constructor(module_x_count) {
        this.module_x_count = module_x_count;
        let viewport = {
            x: document.getElementById("frame").clientWidth,
            y: document.getElementById("frame").clientHeight
        }
        this.viewport = viewport;
        this.m_width = (4 * viewport.x) / (3 * this.module_x_count + 1);
        this.m_height = this.m_width / 1.15;
        this.module_y_count = (viewport.y - (this.m_height / 2)) / this.m_height;
        this.module_y_count = Math.round(this.module_y_count / 0.5) * 0.5;
    }
}


class Module {
    constructor(id, map, adressbook, render_specs) {
        this.id = id
        this.map = map;
        this.adressbook = adressbook;
        this.adressbook[id] = this;
        this.render_specs = render_specs;

        this.last_module;
        this.data_struct = {};
        this.data = {};
        this.pulse_log = {};
        this.density = 2;
        this.popularity = 2;
        this._position = {}
        this.dom_element = null;
    }

    // DEPRECATED: REPLACE WITH GETTER LOGIC
    load_data_field() {
        console.log(this.data_struct)
        Object.entries(this.data_struct).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
            this.data[key] = value.get_default_value();
        });
    }

    get x() {
        return this._position.offset_x;
    }
    get y() {
        return this._position.offset_y;
    }
    set position(pos) {
        this._position = pos;
    }

    add_onclick() {
        this.dom_element.onclick = (event) => this.onclick(event);
    }

    onclick(event) {
        console.log(`click on: ${this.id} || event: ${event}`);
    }

    render() {
        let html_proto = `<div id=${this.id} 
                            class = "module" 
                            style="
                            width: ${this.render_specs.m_width}px; 
                            height: ${this.render_specs.m_height}px; 
                            top: ${this.y}px; 
                            left: ${this.x}px"></div>`;
        document.getElementById('frame').innerHTML += html_proto;
        this.dom_element = document.getElementById(this.id);
        return
    }

    derender(render_level) {
        console.log(`derender: ${render_level}`)
    }

    transform(new_module) {
        let newM = new new_module(this.id, this.map, this.adressbook, this.render_specs);
        newM.position = this.position;
        this.last_module = this.cloneNode(true);
        this.adressbook[this.id] = newM;
    }

    layer() {

    }

    async pulse_in(pulse, origin) {
        if (pulse.signature in this.pulse_log) {
            //reject pulse
            return;
        }
        this.pulse_log[pulse.signature] = pulse;
        if (pulse.executable) {
            pulse.executable(this);
        }
        if (pulse.animation) {
            pulse.animation.animate(this.id);
        }
        if (pulse.delay > 0) {
            await new Promise(r => setTimeout(r, pulse.delay));
        }
        return this.pulse_out(pulse);
    }

    pulse_out(pulse) {
        return pulse.spread_self(this.map);
    }

}

class StemModule extends Module {
    constructor(id, parent, creator) {
        super(id, null, null, null);
        this.parent = parent;
        this.creator = creator;
    }

    pulse_in(pulse) {

    }

    pulse_out() {}
}