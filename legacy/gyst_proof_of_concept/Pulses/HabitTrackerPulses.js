class LogStem extends Pulse {
    constructor(singature) {
        super(
            'LogStem:' + Date.now(),
            new WaveSpread(),
            (module) => {
                console.log(module.constructor.name)
                if (module.constructor.name == 'StemModule') {
                    console.log(`Stem found: ${module.creator}`)
                }
            },
            null,
            PulseType.STANDARD, [],
            null,
            null,
            0
        )
        this.parent_signature = singature;
    }
}