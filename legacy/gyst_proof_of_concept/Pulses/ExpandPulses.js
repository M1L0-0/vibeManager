class WaveSpread extends Spread {
    spread(pulse, map) {
        for (const [key, value] of Object.entries(map)) {
            value.pulse_in(pulse, o_map[key])
        }
    }
}


class FsExpand extends Pulse {
    constructor(payload) {
        let pulse_signature = 'fsexpand:' + Date.now();
        super(
            pulse_signature,
            new WaveSpread(),
            (module) => {
                let id = get_id();
                let new_m = new payload(id, module, pulse_signature);
                module.adressbook[id] = new_m;
                module.map[7] = new_m;
            },
            null,
            PulseType.EXPAND, payload,
            null,
            null,
            0
        )
    }
}