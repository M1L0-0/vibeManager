class TestPulse extends Pulse {
    constructor() {
        super(
            'test:' + Date.now(),
            new WaveSpread(),
            null,
            null,
            PulseType.STANDARD,
            null,
            new Animation([
                ['color', 'black']
            ], AnimationType.TEMP, 400),
            null,
            100
        )
    }
}