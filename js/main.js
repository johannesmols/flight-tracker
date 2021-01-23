var map = L.map('mapid', {
    center: [51.505, -0.09],
    zoom: 5,
    worldCopyJump: true
});

// Mapbox tiles
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoiam9oYW5uZXNtb2xzIiwiYSI6ImNrazh6YW14OTA0Mzgydm1ueXFpaTVndXcifQ.Laeu7meLrcCjeAEsB6q1og'
}).addTo(map);

// OpenStreetMaps Tiles
/*L.tileLayer( 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
}).addTo(map);*/

var allAirports;
var allFlights;

const getColumn = (arr, n) => arr.map(x => x[n]);

async function loadData() {
    const loadAirports = parse("data/airports.csv").then(function (results) {
        allAirports = results.data;
    });
    
    const loadFlights = parse("data/flights.csv").then(function (results) {
        allFlights = results.data;
    });

    Promise.all([loadAirports, loadFlights]).then(() => {
        renderFlights(allFlights)
    });
}

function parse(url) {
    return new Promise(function(complete, error) {
        Papa.parse(url, {complete, error, download: true, dynamicTyping: true});
    });
};

function renderFlights(data) {
    const rows = data[0].length;
    for (var i = 0; i < rows; i++) {
        var colData = getColumn(data, i).filter(function (el) { return el != null; });
        var plane = colData[0];
        var airports = colData.length > 1 ? colData.slice(1) : null;

        if (airports) {
            var color = getRandomColor();
            var coordinates = [];
            for (var j = 0; j < airports.length; j++) {
                var coords = lookUpAirport(airports[j]);
                if (coords) {
                    coordinates.push(coords);
                }
            }

            coordinates.forEach(e => addMarkerToMap(e, color));
            for (var c = 0; c < coordinates.length - 1; c++) {
                addLineToMap(coordinates[c], coordinates[c + 1], color);
            }
        }
    }
}

function lookUpAirport(identOrCoords) {
    if (identOrCoords.match(/^[A-z0-9]{4}$/)) {
        const icao = identOrCoords.toUpperCase();
        const result = allAirports[getColumn(allAirports, 1).indexOf(icao)];

        if (result) {
            return [result[4], result[5]];
        } else {
            console.error('Could not find airport with code ' + icao);
        }
    } else {
        var coords = identOrCoords.split(';');

        if (coords.length == 2) {
            return [Number(coords[0]), Number(coords[1])];
        } {
            console.error('Could not read coordinates ' + coords);
        }
    }
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function addMarkerToMap(coordinates, color) {
    var circle = L.circle(coordinates, {
        color: color,
        fillColor: color,
        fillOpacity: 0.1,
        radius: 50
    }).addTo(map);
}

function addLineToMap(start, end, color) {
    // Check whether line crosses the 180th meridian, and split in two if it is the case
    // https://gis.stackexchange.com/a/18986
    if (false) {//Math.abs(start[1] - end[1]) > 180.0) {
        console.log('start and end coordinates', start, end);

        const start_dist_to_antimeridian = start[1] > 0 ? 180 - start[1] : 180 + start[1];
        const end_dist_to_antimeridian = end[1] > 0 ? 180 - end[1] : 180 + end[1];
        const lat_difference = Math.abs(start[0] - end[0]);
        const alpha_angle = Math.atan(lat_difference / (start_dist_to_antimeridian + end_dist_to_antimeridian)) * (180 / Math.PI);
        const lat_diff_at_antimeridian = Math.tan(alpha_angle * Math.PI / 180) * start_dist_to_antimeridian;

        //const end_first_line = [start[0] + lat_diff_at_antimeridian, ];
        //const start_second_line = 

        /*console.log('start and end', start, end);

        const cart_start = [Math.cos(start[1]) * Math.sin(start[0]), Math.sin(start[1]) * Math.sin(start[0]), Math.cos(start[0])];
        const cart_end = [Math.cos(end[1]) * Math.sin(end[0]), Math.sin(end[1]) * Math.sin(end[0]), Math.cos(end[0])];
        const t = cart_end[1] / (cart_end[1] - cart_start[1]);
        const inters = [t * cart_start[0] + (1 - t) * cart_end[0], 0, t * cart_start[2] + (1 - t) * cart_end[2]];
        const inters_lat = Math.atan(inters[2] / inters[0]);

        console.log('start and end cartesian', cart_start, cart_end);
        console.log('t', t);
        console.log('inters cart', inters);
        console.log('intersection', inters_lat);

        var line = L.polyline([start, [-179.999, inters_lat]], {
            color: color
        }).addTo(map);*/
    } else {
        var line = L.polyline([start, end], {
            color: color
        }).addTo(map);
    }
}

loadData();