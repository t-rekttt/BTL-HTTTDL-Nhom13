const API = "API.php";

const format = "image/png";

// let minX = 99.28821563720703;
// let minY = 7.891197681427002;
// let maxX = 105.82635310292142;
// let maxY = 21.006057858375527;
// let cenX = (minX + maxX) / 2;
// let cenY = (minY + maxY) / 2;

// Thuy loi University location
let dhtlX = 105.82635310292142;
let dhtlY = 21.006057858375527;
let cenX = dhtlX
let cenY = dhtlY
let mapLat = cenY;
let mapLng = cenX;
let mapDefaultZoom = 17;


// Current location
var currentX;
var currentY;
var isLocatePermission = false;

let app = new Vue({
  el: "#main",
  data: {
    poisTypes: [],
    limitType: "point",
    poisType: "all",
    vectorSource: null,
    vectorSourceZone: null,
    radius: null,
    radiuses: [],
    gids: [],
    map: null,
    searchResultLayer: null,
    highlightZoneLayer: null,
    results: null,
    drawRadius: [],
    drawZones: [],
    zoneData: [],
    errMessage: "",
    zoneHandleClick: function () { },
  },
  methods: {
    post(data) {
      return fetch(API, {
        method: "POST",
        body: this.serialize(data),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }).then((res) => res.json());
    },
    getPointOfInterestTypes() {
      return this.post({
        function: "getPointOfInterestTypes",
      });
    },
    queryPoints(radiuses, gids, poisType) {
      this.removeResultLayer();

      let data = {
        function: "queryPoints",
      };

      if (radiuses) data.radiuses = JSON.stringify(radiuses);
      if (gids && gids.length) data.gids = gids;
      if (poisType && poisType !== "all") data.poisType = poisType;

      return this.post(data);
    },
    queryZones(centerLat, centerLong) {
      return this.post({
        function: "queryZones",
        centerLat,
        centerLong,
      });
    },
    capitalizeFirstLetter(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    formatPoisTypeName(name) {
      return this.capitalizeFirstLetter(name.replace("_", " "));
    },
    formatLength(length) {
      if (length > 100) {
        return Math.round((length / 1000) * 100) / 100 + " " + "km";
      }

      return Math.round(length * 100) / 100 + " " + "m";
    },
    async doSearch() {
      this.errMessage = "";

      try {
        if (!this.radiuses.length && !this.gids.length) {
          this.errMessage = "Chưa nhập giới hạn tìm kiếm!";
          return;
        }

        let data = await this.queryPoints(
          this.radiuses,
          this.gids,
          this.poisType
        );

        this.results = data;

        let markers = data.map((item) => {
          let geo = JSON.parse(item.geo);

          const textStyle = new ol.style.Style({
            text: new ol.style.Text({
              text: item.name,
              font: "5px Calibri,sans-serif",
              fill: new ol.style.Fill({
                color: "black",
              }),
            }),
          });

          let feature = new ol.Feature({
            geometry: new ol.geom.Point(
              ol.proj.transform(geo.coordinates, "EPSG:4326", "EPSG:3857")
            ),
          });

          // feature.setStyle([textStyle]);

          return feature;
        });

        var highlightZoneVectorSource = new ol.source.Vector({
          features: markers,
        });

        var searchResultLayer = new ol.layer.Vector({
          source: highlightZoneVectorSource,
        });
        searchResultLayer.setZIndex(10);

        this.searchResultLayer = searchResultLayer;
        this.map.addLayer(searchResultLayer);
      } catch (err) {
        console.log(err);
        this.errMessage = err.message;
      }
    },
    serialize(obj) {
      var str = [];
      for (var p in obj)
        if (obj.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
      return str.join("&");
    },
    removeResultLayer() {
      if (this.searchResultLayer) {
        this.map.removeLayer(this.searchResultLayer);
        this.searchResultLayer = null;
      }
    },
    removeResultZoneLayer() { },
    initMap() {
      document.querySelector("#map").innerHTML = "";
      this.results = null;
      this.poisType = "all";
      this.limitType = "point";
      this.searchResultLayer = null;
      this.radiuses = [];
      this.map = null;
      this.drawRadius = [];
      this.drawZones = [];
      this.gids = [];
      this.zoneData = [];
      this.errMessage = "";
      this.zoneHandleClick = function () { };

      let layerBackgroundMap = new ol.layer.Tile({
        source: new ol.source.OSM(),
      });
      layerBackgroundMap.setZIndex(0);

      const vectorSourceRadius = new ol.source.Vector({ wrapX: false });
      this.vectorSource = vectorSourceRadius;

      const vectorLayerRadius = new ol.layer.Vector({
        source: vectorSourceRadius,
        // style: {
        //   "fill-color": "rgba(255, 255, 255, 0.2)",
        //   "stroke-color": "#ffcc33",
        //   "stroke-width": 2,
        //   "circle-radius": 7,
        //   "circle-fill-color": "#ffcc33",
        // },
      });
      vectorLayerRadius.setZIndex(9);

      const vectorSourceZone = new ol.source.Vector({ wrapX: false });
      this.vectorSourceZone = vectorSourceZone;

      const vectorLayerZone = new ol.layer.Vector({
        source: vectorSourceZone,
        style: {
          "fill-color": "rgba(255, 255, 255, 0.2)",
          "stroke-color": "#ffcc33",
          "stroke-width": 2,
          "circle-radius": 7,
          "circle-fill-color": "#ffcc33",
        },
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

      layerGadm41_vnm_2.setZIndex(1);
      layerGadm41_vnm_2.setOpacity(0.5);

      // let layerGis_osm_pois_free_1 = new ol.layer.Image({
      //   source: new ol.source.ImageWMS({
      //     ratio: 1,
      //     url: "http://localhost:8080/geoserver/wms?",
      //     params: {
      //       FORMAT: format,
      //       VERSION: "1.1.1",
      //       STYLES: "",
      //       LAYERS: "project.cuoi.ki:gis_osm_pois_free_1",
      //     },
      //   }),
      // });

      // let layerGis_osm_roads_free_1 = new ol.layer.Image({
      //   source: new ol.source.ImageWMS({
      //     ratio: 1,
      //     url: "http://localhost:8080/geoserver/wms?",
      //     params: {
      //       FORMAT: format,
      //       VERSION: "1.1.1",
      //       STYLES: "",
      //       LAYERS: "project.cuoi.ki:gis_osm_roads_free_1",
      //     },
      //   }),
      // });
      // layerGis_osm_roads_free_1.setZIndex(2);
      // layerGadm41_vnm_2.setOpacity(0.5);

      const view = new ol.View({
        center: ol.proj.fromLonLat([mapLng, mapLat]),
        zoom: mapDefaultZoom,
      })

      const map = new ol.Map({
        target: "map",
        layers: [
          layerBackgroundMap,
          layerGadm41_vnm_2,
          // layerGis_osm_roads_free_1,
          // layerGis_osm_pois_free_1,
          vectorLayerRadius,
          vectorLayerZone,
        ],
        view: view,
      });

      this.map = map;

      // Add current locate to layer
      if (isLocatePermission) {
        const positionFeature = new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.transform([mapLng, mapLat], "EPSG:4326", "EPSG:3857")
          ),
        });
        positionFeature.setStyle(
          new ol.style.Style({
            image: new ol.style.Icon({
              anchor: [0.5, 46],
              anchorXUnits: 'fraction',
              anchorYUnits: 'pixels',
              src: "assets/icon/home_pin_FILL0_wght400_GRAD0_opsz48.png",
            }),
          })
        );

        new ol.layer.Vector({
          map: map,
          source: new ol.source.Vector({
            features: [positionFeature],
          }),
        });
      }

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
          features: [iconFeature, accuracyFeature, positionFeature],
        });
        let vectorLayer = new ol.layer.Vector({
          source: vectorSource,
        });
        map.addLayer(vectorLayer);
      }

      highLightObj = (result) => {
        //alert("result: " + result);
        var strObjJson = createJsonObj(result);
        //alert(strObjJson);
        var objJson = JSON.parse(strObjJson);
        //alert(JSON.stringify(objJson));
        // drawGeoJsonObj(objJson);
        highLightGeoJsonObj(objJson);
      };
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

      addInteraction = () => {
        let geometryFunction;

        let draw = new ol.interaction.Draw({
          source: vectorSourceRadius,
          type: typeSelect,
          geometryFunction: geometryFunction,
        });

        let draw1 = new ol.interaction.Draw({
          source: vectorSourceRadius,
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

        let zoneHandleClick = async (evt) => {
          var lonlat = ol.proj.transform(
            evt.coordinate,
            "EPSG:3857",
            "EPSG:4326"
          );
          let data = await this.queryZones(lonlat[0], lonlat[1]);
          // console.log(data);
          for (let item of data) {
            this.gids.push(item.gid);
            this.zoneData.push(item);
          }

          let markers = [];

          // console.log(data);
          for (let item of data) {
            let geo = JSON.parse(item.geo);

            markers.push(
              new ol.Feature(
                new ol.geom.MultiPolygon(
                  geo.coordinates.map((polygon) => {
                    return new ol.geom.Polygon(
                      polygon.map((coors) => {
                        // console.log(coors);

                        return coors.map((coor) => {
                          return ol.proj.transform(
                            coor,
                            "EPSG:4326",
                            "EPSG:3857"
                          );
                        });
                      })
                    );
                  })
                )
              )
            );
          }

          // console.log(markers);

          var styles = {
            MultiPolygon: new ol.style.Style({
              fill: new ol.style.Fill({
                color: "orange",
              }),
              stroke: new ol.style.Stroke({
                color: "yellow",
                width: 2,
              }),
            }),
          };
          var styleFunction = function (feature) {
            // alert("style");
            return styles[feature.getGeometry().getType()];
          };
          var highlightZoneVectorSource = new ol.source.Vector({
            features: markers,
          });

          var highlightZoneLayer = new ol.layer.Vector({
            style: styleFunction,
            source: highlightZoneVectorSource,
          });
          highlightZoneLayer.setZIndex(8);

          this.highlightZoneLayer = highlightZoneLayer;
          this.map.addLayer(highlightZoneLayer);
        };
        this.zoneHandleClick = zoneHandleClick;

        map.addInteraction(draw);
        map.addInteraction(draw1);

        this.drawRadius.push(draw);
        this.drawRadius.push(draw1);

        createMeasureTooltip();
        createHelpTooltip();

        let listener;
        draw1.on("drawstart", (evt) => {
          // set sketch
          sketch = evt.feature;

          /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
          let tooltipCoord = evt.coordinate;

          let coordinate = evt.feature.getGeometry().getCoordinates()[0];
          // console.log({ coordinate, longlat });

          listener = sketch.getGeometry().on("change", (evt) => {
            const geom = evt.target;
            // console.log({ length: ol.sphere.getLength(geom) });
            let output = formatLength(geom);
            tooltipCoord = geom.getLastCoordinate();
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
          });
        });

        draw1.on("drawend", (evt) => {
          this.removeResultLayer();

          // $(".ol-tooltip-static").remove();
          // vectorSourceRadius.clear();

          measureTooltipElement.className = "ol-tooltip ol-tooltip-static";
          measureTooltip.setOffset([0, -7]);
          // this.radiuses.push({ longlat, radius: ol.sphere.getLength(geom) });

          var line = new ol.geom.LineString(
            evt.feature.getGeometry().getCoordinates()
          );

          let distance = ol.sphere.getLength(line);
          let center = evt.feature.getGeometry().getCoordinates()[0];
          let output = formatLength(line);
          // console.log(distance, output);
          measureTooltipElement.innerHTML = output;
          this.radiuses.push({
            latlong: ol.proj.transform(center, "EPSG:3857", "EPSG:4326"),
            radius: distance,
          });

          // unset sketch
          sketch = null;
          // unset tooltip so that a new one can be created
          measureTooltipElement = null;
          createMeasureTooltip();
          ol.Observable.unByKey(listener);
        });
      };

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

      addInteraction();
    },
  },
  mounted() {
    /**
     *  Check location permission
     *  Initial map with isLocatePermission = true if permission is allowed
     *  false if permission is denied
     */
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapLat = pos.coords.latitude;
        mapLng = pos.coords.longitude;
        isLocatePermission = true
        this.initMap();
      },
      () => {
        isLocatePermission = false
        this.initMap();
      }
    );
    this.getPointOfInterestTypes().then((getPointOfInterestTypes) => {
      this.poisTypes = getPointOfInterestTypes.map((item) => item.fclass);
    });
    console.log("Mounted");
  },
  watch: {
    limitType(val) {
      if (val == "zone") {
        console.log("Zone set!");
        this.map.addEventListener("singleclick", this.zoneHandleClick);
        for (let draw of this.drawRadius) this.map.removeInteraction(draw);
      } else if (val == "point") {
        this.map.removeEventListener("singleclick", this.zoneHandleClick);
        for (let draw of this.drawRadius) this.map.addInteraction(draw);
      }
    },
  },
});
