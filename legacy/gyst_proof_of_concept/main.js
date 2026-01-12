const RATIO = 1.15;

const o_map = {
    1: 4,
    2: 5,
    3: 6,
    4: 1,
    5: 2,
    6: 3
}

const test_offset_map = {
    0: [0, 0],
    1: [0, -1 / RATIO],
    2: [1 * 3 / 4, -1 / RATIO / 2],
    3: [1 * 3 / 4, 1 / RATIO / 2],
    4: [0, 1 / RATIO],
    5: [-1 * 3 / 4, 1 / RATIO / 2],
    6: [-1 * 3 / 4, -1 / RATIO / 2],
    7: [0, 0]
}

let last_id = -1;

function get_id() {
    last_id += 1;
    return last_id;
}

function map_viewport_modules(map, adressbook) {
    let return_map = [];
    let module_y_count = map.length;
    let module_x_count = null;
    for (let i = 0; i < module_y_count; i++) {
        module_x_count = map[i].length;
        for (let ii = 0; ii < module_x_count; ii++) {
            let f_r = ((i <= 0) ? true : false);
            let l_r = ((i + 1 == module_y_count) ? true : false);
            let f_c = ((ii <= 0) ? true : false);
            let l_c = ((ii + 1 == module_x_count) ? true : false);
            let even = ((ii % 2 == 0) ? true : false);

            let m_map = {};


            // 1
            if (!f_r) {
                m_map[1] = adressbook[map[i - 1][ii]];
            }
            // 2
            if (!l_c && !(f_r && even)) {
                if (even) {
                    m_map[2] = adressbook[map[i - 1][ii + 1]];
                } else {
                    m_map[2] = adressbook[map[i][ii + 1]];
                }
            }
            // 3
            if (!l_c && !(l_r && !even)) {
                if (even) {
                    m_map[3] = adressbook[map[i][ii + 1]];
                } else {
                    m_map[3] = adressbook[map[i + 1][ii + 1]];
                }
            }
            // 4
            if (!l_r) {
                m_map[4] = adressbook[map[i + 1][ii]]
            }
            // 5
            if (!f_c && !(l_r && !even)) {
                if (even) {
                    m_map[5] = adressbook[map[i][ii - 1]];
                } else {
                    m_map[5] = adressbook[map[i + 1][ii - 1]];
                }
            }
            // 6
            if (!f_c && !(f_r && even)) {
                if (even) {
                    m_map[6] = adressbook[map[i - 1][ii - 1]];
                } else {
                    m_map[6] = adressbook[map[i][ii - 1]];
                }
            }
            adressbook[map[i][ii]].map = m_map;
        }
    }
}

function generate_position(offset_map, m_width, id) {
    let offset_x = 0;
    let offset_y = 0;

    let id_array = Array.from(String(id), Number)
    id_array.forEach(i => {
        let o = offset_map[i];
        offset_x += o[0] * m_width;
        offset_y += o[1] * m_width;
    });


    return new Position(offset_x, offset_y);
}


function render_modules(modules, m_width, m_class) {
    let html = '';
    modules.forEach(m => {
        html += `<div id=${m.id} class = "${m_class}" 
        style="width: ${m_width}px; height: ${m_width / RATIO}px; top: ${m.y}px; left: ${m.x}px"></div>`;
    });
    document.getElementById('frame').innerHTML += html;
    modules.forEach(m => {
        m.dom_element = document.getElementById(m.id);
    });
}


function generate_viewport_modules(adressbook, rs) {
    let last_id = 0;
    let modules = [];
    let id_map = [];

    let vp_offset = rs.viewport.y - (rs.module_y_count * rs.m_height);
    document.getElementById('frame').style.top = `${vp_offset / 2}px`;
    document.getElementById('frame').style.height = `${rs.viewport.y  - vp_offset}px`

    let ii = 0;
    for (let i = 0; i < rs.module_y_count - 1; i++) {
        let buffer_id = 7;
        for (let iter = 0; iter < i; iter++) {
            buffer_id = `${buffer_id}4`
        }
        last_id = buffer_id;

        let new_m = new Viewport(last_id, {}, adressbook, rs, ii, i);
        new_m.position = generate_position(test_offset_map, rs.m_width, last_id);
        id_map.push([last_id]);
        adressbook[last_id] = new_m;
        modules.push(new_m);
        for (ii = 0; ii < rs.module_x_count - 1; ii++) {
            if (ii % 2 == 0) {
                last_id = `${last_id}3`;
            } else {
                last_id = `${last_id}2`;
            }
            new_m = new Viewport(last_id, {}, adressbook, rs, ii, i);
            new_m.position = generate_position(test_offset_map, rs.m_width, last_id)
            modules.push(new_m);
            adressbook[last_id] = new_m;
            id_map[i].push(last_id);
        }
    }
    map_viewport_modules(id_map, adressbook);
    modules.forEach(m => {
        m.render();
    })
    return rs.m_width;
}

function test() {
    let rs = new RenderSpecs(5);
    let adressbook = {};
    let m_width = generate_viewport_modules(adressbook, rs);
    let ht = new HabitTracker(0, { 7: adressbook[7] }, adressbook);
    ht.position = new Position(0, 0);

    render_modules([ht], m_width, 'ht-module');
    ht.add_onclick();
}