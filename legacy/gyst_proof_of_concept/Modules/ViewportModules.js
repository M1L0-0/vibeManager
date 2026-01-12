class Viewport extends Module {
    constructor(id, map, adressbook, rs, column, row) {
        super(id, map, adressbook);
        this.popularity = 0;
        this.indices = {
            x: column,
            y: row
        }
        this.render_specs = rs;
    }
}