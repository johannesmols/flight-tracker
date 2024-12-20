var map = L.map('mapid', {
    center: [51.505, -0.09],
    zoom: 5,
    worldCopyJump: true,
    continuousWorld: false
});

// Stadia AlidadeSmooth
/*L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
	maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});*/

// Mapbox tiles
/*L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoiam9oYW5uZXNtb2xzIiwiYSI6ImNrazh6YW14OTA0Mzgydm1ueXFpaTVndXcifQ.Laeu7meLrcCjeAEsB6q1og'
}).addTo(map);*/

// OpenStreetMaps Tiles
L.tileLayer( 'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
}).addTo(map);


// Icons

function getPointMarker(color) {
    const markerHtmlStyles = `
        background-color: ${color};
        width: 12px;
        height: 12px;
        display: block;
        position: relative;
        border-radius: 1rem;
        transform: rotate(0deg);
        opacity: 0.5;
        border: 1px solid #FFFFFF`;

    return icon = L.divIcon({
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 12],
        labelAnchor: [-6, 0],
        popupAnchor: [0, -36],
        html: `<span style="${markerHtmlStyles}" />`
    });
}

function getAirplaneMarker(color) {
    const markerHtmlStyles = `
        background-color: ${color};
        width: 12px;
        height: 12px;
        display: block;
        position: relative;
        border-radius: 3rem 3rem 1;
        transform: rotate(45deg);
        opacity: 1;
        border: 1px solid #FFFFFF`;

    return icon = L.divIcon({
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 12],
        labelAnchor: [-6, 0],
        popupAnchor: [0, -36],
        html: `<span style="${markerHtmlStyles}" />`
    });
}


// Data and rendering

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
                var result = lookUpAirport(airports[j]);
                if (result[0]) {
                    coordinates.push(result[0]);

                    if (j === airports.length - 1) {
                        addMarkerToMap(result[0], color, result[1] ? `${plane} - ${airports[j]} - ${result[1]}` : `${plane} - ${airports[j].replace(';', ', ')}`, true);
                    } else {
                        addMarkerToMap(result[0], color, result[1] ? `${airports[j]} - ${result[1]}` : `${airports[j].replace(';', ', ')}`, false);
                    }
                }
            }

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
            return [[result[4], result[5]], result[3]];
        } else {
            console.error('Could not find airport with code ' + icao);
        }
    } else {
        var coords = identOrCoords.split(';');

        if (coords.length == 2) {
            return [[Number(coords[0]), Number(coords[1])], null];
        } {
            console.error('Could not read coordinates ' + coords);
        }
    }
}

function getRandomColor() {
    var colors = ['#7F3C8D','#11A579','#3969AC','#F2B701','#E73F74','#80BA5A','#E68310','#008695','#CF1C90','#f97b72','#4b4b8f','#A5AA99'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function addMarkerToMap(coordinates, color, popup, isAirplane) {
    var icon = isAirplane ? getAirplaneMarker(color) : getPointMarker(color);

    L.marker(coordinates, { icon: icon }).addTo(map).bindPopup(popup);
    L.marker([coordinates[0], coordinates[1] - 360], { icon: icon }).addTo(map).bindPopup(popup);
    L.marker([coordinates[0], coordinates[1] + 360], { icon: icon }).addTo(map).bindPopup(popup);
}

function addLineToMap(start, end, color) {
    if (curved = true) {
        const geodesic = new L.Geodesic([start, end], {
            color: color,
            steps: 8,
            wrap: false
        }).addTo(map);

        const geodesic_left = new L.Geodesic([[start[0], start[1] - 360], [end[0], end[1] - 360]], {
            color: color,
            steps: 8,
            wrap: false
        }).addTo(map);

        const geodesic_right = new L.Geodesic([[start[0], start[1] + 360], [end[0], end[1] + 360]], {
            color: color,
            steps: 8,
            wrap: false
        }).addTo(map);
    }
    else {
        // Check whether line crosses the 180th meridian, and split in two if it is the case
        if (Math.abs(start[1] - end[1]) > 180.0) {
            const start_dist_to_antimeridian = start[1] > 0 ? 180 - start[1] : 180 + start[1];
            const end_dist_to_antimeridian = end[1] > 0 ? 180 - end[1] : 180 + end[1];
            const lat_difference = Math.abs(start[0] - end[0]);
            const alpha_angle = Math.atan(lat_difference / (start_dist_to_antimeridian + end_dist_to_antimeridian)) * (180 / Math.PI) * (start[1] > 0 ? 1 : -1);
            const lat_diff_at_antimeridian = Math.tan(alpha_angle * Math.PI / 180) * start_dist_to_antimeridian;
            const intersection_lat = start[0] + lat_diff_at_antimeridian;
            const first_line_end = [intersection_lat, start[1] > 0 ? 180 : -180];
            const second_line_start = [intersection_lat, end[1] > 0 ? 180 : -180];

            if (debug = false) {
                console.log('Identified line crossing the 180th meridian, start and end:', start, end);
                console.log('Distance from start point to 180th meridian:', start_dist_to_antimeridian);
                console.log('Distance from end point to 180th meridian:', end_dist_to_antimeridian);
                console.log('Lateral difference between start and end:', lat_difference);
                console.log('Alpha angle of pythagorean triangle connecting the points:', alpha_angle);
                console.log('Lateral difference from start point to point intersecting the 180th meridian:', lat_diff_at_antimeridian);
                console.log('Latitude of intersection at 180th meridian:', intersection_lat);
                console.log('First line ending at:', first_line_end);
                console.log('Second line starting at:', second_line_start);
            }
            
            drawLineThrice(start, first_line_end, color);
            drawLineThrice(second_line_start, end, color);
        } else {
            drawLineThrice(start, end, color);
        }
    }    
}

function drawLineThrice(start, end, color) {
    var regular = L.polyline([start, end], {
        color: color
    }).addTo(map);

    var toTheLeft = L.polyline([[start[0], start[1] - 360], [end[0], end[1] - 360]], {
        color: color
    }).addTo(map);

    var toTheRight = L.polyline([[start[0], start[1] + 360], [end[0], end[1] + 360]], {
        color: color
    }).addTo(map);
}

loadData();