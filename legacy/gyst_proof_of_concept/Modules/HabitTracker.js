class Habit extends Module {
    constructor(name, adressbook, render_specs, tracker_proto) {
        super(get_id(), {}, adressbook, render_specs)
        this.name = name;
        this.progress = 0;
        this.tracker_proto = tracker_proto;
        this.trackers = {}

        this.data_struct = {
            trackers: new DataType('private', 'LIST')
        };
    }

    add_progress(date, progress) {
        if (date in this.trackers) {
            this.trackers[date].progress = progress;
        } else {
            this.trackers[date] = new this.tracker_proto(get_id(), [], this.adressbook, this.render_specs, progress);
        }
        return this;
    }
}
class DateModule extends Module {}

class TimeFrame extends Module {
    constructor(timespan) {
        this.timespan = timespan;
        this.data_struct = {
            date: new DataType('private', 'STRING')
        };
    }
}

class StemHT extends StemModule {
    constructor(id, module, pulse_signature) {
        super(id, module, pulse_signature);
    }

    evolve(type) {
        this.transform(type)
    }
}

class HabitTracker extends Module {
    constructor(id, map, adressbook, dom_element) {
        super(id, map, adressbook);

        this.dom_element = dom_element;
        this.habits = this.fetch_data()['habits'];
        this.data_struct = {
            habits: new DataType('public', 'MAP'),
            settings: new DataType('public', 'MAP')
        };
        this.load_data_field();
    }

    generate_scroll_groups(payload) {
        let group_x = [];
        let group_y = [];

        payload.forEach((module) => {
            if (module.indices.x == 0) {
                group_y.push(module);
            }
            if (module.indices.y == 0) {
                group_x.push(module);
            }
        })
    }

    // TODO: Write function to fetch progrss from memgraph db pass fetched data along with expand
    async fetch_data() {
        let test_data = {
            "habits": {
                0: new Habit('clean', this.adressbook, this.render_specs, Tracker).add_progress('20/03/2023', 1).add_progress('19/03/2023', 0),
                1: new Habit('sleep', this.adressbook, this.render_specs, Tracker).add_progress('19/03/2023', 1),
                2: new Habit('workout', this.adressbook, this.render_specs, Tracker).add_progress('20/03/2023', 1).add_progress('19/03/2023', 1)
            },
            "settings": {
                "timeScope": 1
            }
        }
        return test_data;
    }

    assignStems(stemHTs) {
        for (let stem in stemHTs) {
            let map = stemHTs[stem].parent.map;
            let leftMost = true;
            let upMost = true;
            if (Object.keys(map).includes('5') || Object.keys(map).includes('6')) {
                leftMost = false;
            }
            if (Object.keys(map).includes('1')) {
                upMost = false;
            }
            if (upMost && leftMost) {
                console.log(stemHTs[stem])
                    //stemHTs[stem].evolve('root')
            } else if (upMost) {
                stemHTs[stem].evolve(Habit);
            } else if (leftMost) {
                stemHTs[stem].evolve(DateModule);
            }
        }
    }

    async expand() {
        console.log(this.map)
        if (!this.map[7]) {
            console.log(`missing map: 7 || got: ${this.map}`)
            return -1
        }
        let fs_expand = new FsExpand(StemHT);
        fs_expand = await this.map[7].pulse_in(fs_expand);
        // filter all StemHt
        let filteredAdressBook = {}
        for (let k in this.adressbook) {
            if (this.adressbook[k].constructor.name == 'StemHT') {
                filteredAdressBook[k] = this.adressbook[k];
            }
        }
        this.assignStems(filteredAdressBook);
    }




    onclick() {
        this.expand();
    }

    on_scroll(direction) {
        if (direction = 'x') {
            this.scroll_x;
        } else {
            this.scroll_y;
        }
    }

    scroll_x() {};
    scroll_y() {};
}