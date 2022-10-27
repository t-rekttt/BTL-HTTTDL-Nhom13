const format = "image/png";

let minX = 99.28821563720703;
let minY = 7.891197681427002;
let maxX = 114.35734558105469;
let maxY = 23.371946334838867;
let cenX = (minX + maxX) / 2;
let cenY = (minY + maxY) / 2;
let mapLat = cenY;
let mapLng = cenX;
let mapDefaultZoom = 6;
let distance;

let drawingCircle = false;

let layerBackgroundMap = new ol.layer.Tile({
  source: new ol.source.OSM(),
});

const source = new ol.source.Vector({ wrapX: false });

const vector = new ol.layer.Vector({
  source: source,
});

let layerGadm41_vnm_2 = new ol.layer.Image({
  source: new ol.source.ImageWMS({
    ratio: 1,
    url: "http://localhost:8080/geoserver/wms?",
    params: {
      FORMAT: format,
      VERSION: "1.1.1",
      STYLES: "",
      LAYERS: "project.cuoi.ki:gadm41_vnm_2",
    },
  }),
});

let layerGis_osm_pois_free_1 = new ol.layer.Image({
  source: new ol.source.ImageWMS({
    ratio: 1,
    url: "http://localhost:8080/geoserver/wms?",
    params: {
      FORMAT: format,
      VERSION: "1.1.1",
      STYLES: "",
      LAYERS: "project.cuoi.ki:gis_osm_pois_free_1",
    },
  }),
});

const map = new ol.Map({
  target: "map",
  layers: [
    layerBackgroundMap,
    layerGadm41_vnm_2,
    layerGis_osm_pois_free_1,
    vector,
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([mapLng, mapLat]),
    zoom: mapDefaultZoom,
  }),
});

function highLightGeoJsonObj(coordinate) {
  let iconFeature = new ol.Feature({
    geometry: new ol.geom.Point(coordinate),
    name: "Null Island",
    population: 4000,
    rainfall: 500,
  });

  let iconStyle = new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 46],
      anchorXUnits: "fraction",
      anchorYUnits: "pixels",
      src: "https://openlayers.org/en/latest/examples/data/icon.png",
    }),
  });

  iconFeature.setStyle(iconStyle);
  let vectorSource = new ol.source.Vector({
    features: [iconFeature],
  });
  let vectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });
  map.addLayer(vectorLayer);
}

function highLightObj(result) {
  //alert("result: " + result);
  var strObjJson = createJsonObj(result);
  //alert(strObjJson);
  var objJson = JSON.parse(strObjJson);
  //alert(JSON.stringify(objJson));
  // drawGeoJsonObj(objJson);
  highLightGeoJsonObj(objJson);
}
// map.on("singleclick", function (evt) {
//   //alert("coordinate: " + evt.coordinate);
//   //var myPoint = 'POINT(12,5)';
//   var lonlat = ol.proj.transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
//   var lon = lonlat[0];
//   var lat = lonlat[1];

//   if (!drawingCircle) {
//     highLightGeoJsonObj(evt.coordinate);
//   }

//   drawingCircle = !drawingCircle;
// });

// const typeSelect = document.getElementById("type");
const typeSelect = "Circle";

/**
 * Currently drawn feature.
 * @type {import("../src/ol/Feature.js").default}
 */
let sketch;

/**
 * The help tooltip element.
 * @type {HTMLElement}
 */
let helpTooltipElement;

/**
 * Overlay to show the help messages.
 * @type {Overlay}
 */
let helpTooltip;

/**
 * The measure tooltip element.
 * @type {HTMLElement}
 */
let measureTooltipElement;

/**
 * Overlay to show the measurement.
 * @type {Overlay}
 */
let measureTooltip;

/**
 * Format length output.
 * @param {LineString} line The line.
 * @return {string} The formatted length.
 */
const formatLength = function (line) {
  const length = ol.sphere.getLength(line);
  let output;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + " " + "km";
  } else {
    output = Math.round(length * 100) / 100 + " " + "m";
  }
  return output;
};

let draw, draw1; // global so we can remove it later
function addInteraction() {
  let geometryFunction;

  draw = new ol.interaction.Draw({
    source: source,
    type: typeSelect,
    geometryFunction: geometryFunction,
  });

  draw1 = new ol.interaction.Draw({
    source: source,
    type: "LineString",
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: "rgba(255, 255, 255, 0.2)",
      }),
      stroke: new ol.style.Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        lineDash: [10, 10],
        width: 2,
      }),
      image: new ol.style.Circle({
        radius: 5,
        stroke: new ol.style.Stroke({
          color: "rgba(0, 0, 0, 0.7)",
        }),
        fill: new ol.style.Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
      }),
    }),
    maxPoints: 2,
  });

  map.addInteraction(draw);
  map.addInteraction(draw1);

  createMeasureTooltip();
  createHelpTooltip();

  let listener;
  draw1.on("drawstart", function (evt) {
    // set sketch
    sketch = evt.feature;

    /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
    let tooltipCoord = evt.coordinate;

    listener = sketch.getGeometry().on("change", function (evt) {
      const geom = evt.target;
      let output;
      output = formatLength(geom);
      distance = ol.sphere.getLength(geom);
      tooltipCoord = geom.getLastCoordinate();
      measureTooltipElement.innerHTML = output;
      measureTooltip.setPosition(tooltipCoord);
    });
  });

  draw1.on("drawend", function () {
    measureTooltipElement.className = "ol-tooltip ol-tooltip-static";
    measureTooltip.setOffset([0, -7]);
    // unset sketch
    sketch = null;
    // unset tooltip so that a new one can be created
    measureTooltipElement = null;
    createMeasureTooltip();
    ol.Observable.unByKey(listener);
  });
}

/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }
  helpTooltipElement = document.createElement("div");
  helpTooltipElement.className = "ol-tooltip hidden";
  helpTooltip = new ol.Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: "center-left",
  });
  map.addOverlay(helpTooltip);
}

/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  measureTooltipElement = document.createElement("div");
  measureTooltipElement.className = "ol-tooltip ol-tooltip-measure";
  measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: "bottom-center",
    stopEvent: false,
    insertFirst: false,
  });
  map.addOverlay(measureTooltip);
}

/**
 * Handle change event.
 */
// typeSelect.onchange = function () {
//   map.removeInteraction(draw);
//   addInteraction();
// };

// document.getElementById("undo").addEventListener("click", function () {
//   draw.removeLastPoint();
// });

addInteraction();