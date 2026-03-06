// ==========================================
// OBSERVATÓRIO HIDROTERRITORIAL
// ==========================================

// 🔹 Criar mapa
var map = L.map('map').setView([-2.55, -44.30], 10);

// 🔹 Camadas base
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: "&copy; OpenStreetMap contributors"
});

var hillshade = L.tileLayer(
    'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}'
);

osm.addTo(map);

L.control.layers({
    "OpenStreetMap": osm,
    "Relevo (Hillshade)": hillshade
}).addTo(map);

// ==========================================
// 🔹 FUNÇÃO PADRÃO PARA CARREGAR GEOJSON
// ==========================================

function loadGeoJSON(url, options, bringFront = false) {

    fetch(url)
        .then(res => res.json())
        .then(data => {

            var layer = L.geoJSON(data, options).addTo(map);

            if (bringFront) layer.bringToFront();

        })
        .catch(err => console.error("Erro ao carregar:", url, err));
}

// ==========================================
// 🔹 POPUP CONTRIBUIÇÃO
// ==========================================

function abrirAviso(){
    document.getElementById("popupAviso").style.display = "flex";
}

function fecharAviso(){
    document.getElementById("popupAviso").style.display = "none";
}

function irFormulario(){
    window.open(
    "https://docs.google.com/forms/d/e/1FAIpQLSfGb7pc-sHomENdICrElskZD10qva8j08s_DbzBoju2hI3xGw/viewform",
    "_blank"
    );
}

// ==========================================
// 🔹 LIMITES MUNICIPAIS
// ==========================================

loadGeoJSON('assets/limites_municipais.geojson', {

    style: {
        color: "#003049",
        weight: 2,
        fillOpacity: 0.05
    },

    interactive:false,

    onEachFeature: function(feature, layer) {

        if (feature.properties) {

            layer.bindPopup(`
                <strong>Município:</strong> ${feature.properties.NM_MUNICIP || "-"}
            `);

        }
    }

});

// ==========================================
// 🔹 SEDES MUNICIPAIS
// ==========================================

fetch('assets/sedes_municipais.geojson')
.then(res => res.json())
.then(data => {

    console.log("Sedes carregadas:", data); // ajuda debug

    var sedesLayer = L.geoJSON(data, {

        pointToLayer: function(feature, latlng){

            return L.circleMarker(latlng, {

                radius: 6,
                fillColor: "black",
                color: "white",
                weight: 2,
                fillOpacity: 1

            });

        },

        onEachFeature: function(feature, layer){

            let nome =
                feature.properties?.NM_MUNICIP ||
                feature.properties?.nome ||
                feature.properties?.name ||
                "Sede Municipal";

            layer.bindPopup(`
                <strong>Sede Municipal</strong><br>
                ${nome}
            `);

        }

    }).addTo(map);

    sedesLayer.bringToFront();

})
.catch(err => console.error("Erro sedes:", err));

// ==========================================
// 🔹 PONTOS DE ALAGAMENTO
// ==========================================

var markers = L.layerGroup();


// 🔴 Ícone oficial DEA

var iconDEA = L.divIcon({

    className:"",
    html:`<div class="pulse-red"></div>`,
    iconSize:[18,18],
    iconAnchor:[9,9]

});


// 🔵 Ícone colaborativo

var iconPublico = L.divIcon({

    className:"",
    html:`<div class="pulse-blue"></div>`,
    iconSize:[18,18],
    iconAnchor:[9,9]

});


var sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR1NaIwiVdKK-yCAMp2stgMbS4oBwJT-M2_9gIRVnbERKNcwLsLdG1AdgBPe9HbUt9LsNgnnSB_xx6r/pub?output=csv";


Papa.parse(sheetURL,{

    download:true,
    header:true,
    skipEmptyLines:true,

    complete:function(results){

        markers.clearLayers();

        results.data.forEach(function(row){

            let latKey = Object.keys(row).find(k => k.toLowerCase().includes("lat"));
            let lonKey = Object.keys(row).find(k => k.toLowerCase().includes("long"));
            let dataKey = Object.keys(row).find(k => k.toLowerCase().includes("data"));
            let horaKey = Object.keys(row).find(k => k.toLowerCase().includes("hor"));
            let localKey = Object.keys(row).find(k => k.toLowerCase().includes("ident"));
            let autorKey = Object.keys(row).find(k => k.toLowerCase().includes("autor"));

            if(!latKey || !lonKey) return;

            let latitude = parseFloat(row[latKey]);
            let longitude = parseFloat(row[lonKey]);

            if(!isNaN(latitude) && !isNaN(longitude)){

                let fonte = row[autorKey] || "";

                let icon = iconPublico;

                if(
                    fonte.includes("Departamento de Estudos Ambientais") ||
                    fonte.includes("DEA")
                ){
                    icon = iconDEA;
                }

                let marker = L.marker([latitude,longitude],{icon:icon})

                .bindPopup(`

                    <strong>${row[localKey] || "-"}</strong><br>
                    <strong>Data:</strong> ${row[dataKey] || "-"}<br>
                    <strong>Hora:</strong> ${row[horaKey] || "-"}<br>
                    <strong>Autor:</strong> ${fonte || "Não informado"}

                `);

                markers.addLayer(marker);

            }

        });

        markers.addTo(map);

    }

});


// ==========================================
// 🔹 NORTE GEOGRÁFICO
// ==========================================

var north = L.control({position:'topright'});

north.onAdd = function(map){

    var div = L.DomUtil.create('div','north-arrow');
    div.innerHTML = "N";
    return div;

};

north.addTo(map);


// ==========================================
// 🔹 AUTO RELOAD 1H
// ==========================================

//setInterval(function(){
// location.reload();
//},3600000);
