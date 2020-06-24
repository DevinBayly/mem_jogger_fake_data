<script>
  export let name;
  export let buildingJSON;
  import { onMount } from "svelte";
  import { wifiData } from "./store.js";
  import * as d3 from "d3";
  onMount(async () => {
    console.log("loaded");
    console.log("building Json is ", buildingJSON);
    let mymap = L.map("mapid").setView([32.231481, -110.951838], 18);
    L.esri.basemapLayer("Gray").addTo(mymap);
    var subtleUA = L.esri
      .tiledMapLayer({
        url:
          "https://services.maps.arizona.edu/pdc/rest/services/SubtleCanvasTiles/MapServer"
      })
      .addTo(mymap);
    // this  is the magic line for converting the polygon data into useful values
    /*
      let point = new L.Point(centerL20[0],centerL20[1])
      let pointLatLng = L.Projection.SphericalMercator.unproject(point)
      */
    // TODO think about preconfiguring the buildingJSON to be a map already just with coordinates and building numbers
    let buildingMap = {};
    for (let feature of buildingJSON.features) {
      // recall that the coordinates are ordered x,y in geojson, so must put into conversion correctly
      buildingMap[
        feature.properties["Buildings.SpaceNumLetter"]
      ] = new L.LatLng(
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0]
      );
    }
    console.log("building map is ",buildingMap)

    // subscribe to the store
    let once = false;
    let graphData,
      circleScale,
      applyLatLngToLayer,
      bboxNWLatLng,
      bboxSELatLng,
      svg,
      maxRadius = 20,
      g;
    let redraw = function() {
      // need a function to calculate the bounds of the points
      console.log("redrawing");
      // occasionally when zooming and panning the svg's container move, so we have to set svg to be relative and move it left and right

      // make a circle and append it to the svg, and then transform it with the results of the applylatlng
      let circle = g
        .selectAll(".testPoints")
        .data(graphData, d => d.number)
        .join(
          enter =>
            enter
              .append("circle")
              .attr("r", d => circleScale(d.count))
              .attr("class", "testPoints")
              .attr("transform", d => {
                if (d.coords == undefined) {
                  console.log("missing coords on", d);
                } else {
                  return `translate(${applyLatLngToLayer(d.coords).x},${
                    applyLatLngToLayer(d.coords).y
                  })`;
                }
              })
              .attr("fill", "red")
              .attr("opacity", 0.5),
          update =>
            update.attr("transform", d => {
              if (d.coords == undefined) {
                console.log("missing coords on", d);
              } else {
                return `translate(${applyLatLngToLayer(d.coords).x},${
                  applyLatLngToLayer(d.coords).y
                })`;
              }
            })
            .attr("r",d=> circleScale(d.count)),
          exit => exit.remove()
        );
      // the width is the diff nw and se bbox points
      let screenNW = applyLatLngToLayer(bboxNWLatLng);
      let screenSE = applyLatLngToLayer(bboxSELatLng);
      // make sure the circles don't get cut off, so we add a radius on all edges of SVG
      svg.attr("width", screenSE.x - screenNW.x + 2 * maxRadius);
      svg.attr("height", screenSE.y - screenNW.y + 2 * maxRadius);
      // get the pixel coordinates of the top left corner of bbox
      // subtract some left so we don't cutt off the circles
      svg.style("left", screenNW.x - maxRadius + "px");
      svg.style("top", screenNW.y - maxRadius + "px");
      // now update the g that is containing the circles
      // add in the circle radius because points need to shift extra given the padded space
      g.attr(
        "transform",
        `translate(${-screenNW.x + maxRadius},${-screenNW.y + maxRadius})`
      );
    };
    let updateData = userData => {
      console.log("running data")
      let activeBuildings = {};
      for (let connection of userData) {
        if (activeBuildings[connection.apBuildingNumber] == undefined) {
          activeBuildings[connection.apBuildingNumber] = {
            coords: buildingMap[connection.apBuildingNumber],
            count: 1,
            number: connection.apBuildingNumber
          };
        } else {
          activeBuildings[connection.apBuildingNumber].count += 1;
        }
      }
      // convert active Buildings into an array for simplicity in D3
      graphData = [];
      for (let building in activeBuildings) {
        graphData.push(activeBuildings[building]);
      }
      console.log("graph data ",graphData)
      // calculate the nw corner of a bounding box on the points
      let bbox = { x: {}, y: {} };
      // calculate the bounding box on the circles that are being drawn, decide on a max radius, and use it
      for (let i = 0; i < graphData.length; i++) {
        let d = graphData[i].coords;
        if (d == undefined) {
          console.log("missing coords", d);
          continue;
        }
        if (i == 0) {
          // set minmax off the bat
          bbox.x.min = bbox.x.max = d.lng;
          bbox.y.min = bbox.y.max = d.lat;
          continue;
        }
        if (d.lat > bbox.y.max) {
          bbox.y.max = d.lat;
        }
        if (d.lat < bbox.y.min) {
          bbox.y.min = d.lat;
        }
        if (d.lng > bbox.x.max) {
          bbox.x.max = d.lng;
        }
        if (d.lng < bbox.x.min) {
          bbox.x.min = d.lng;
        }
      }
      // the northwest corner is the max.y and the min.x, and the south east corner is the min.y and the max.x
      console.log("boundsbox is", bbox);
      bboxNWLatLng = new L.LatLng(bbox.y.max, bbox.x.min);
      bboxSELatLng = new L.LatLng(bbox.y.min, bbox.x.max);
      redraw()
    }
    let initialize = (userData) => {

      // this is the width the svg should be to cover the full map
      let bounds = mymap.getPixelBounds();
      let width = bounds.max.x - bounds.min.x;
      let height = bounds.max.y - bounds.min.y;
      // create an svg
      svg = d3.select(mymap.getPanes().overlayPane).append("svg");
      g = svg.append("g").attr("class", "leaflet-zoom-hide");
      // define apply latlng to layer that takes in geopoints and produces screenspace x,y for drawing on svg
      // NOTE that geojson points are going to have the x first in the coordinates
      applyLatLngToLayer = function(d) {
        // d is a lat lng calculated from the getCenter() method of a polyline
        // do some comparison of building number to geojson of buildings to get coords
        return mymap.latLngToLayerPoint(d);
      };
      // connect redraw to the map events
      mymap.on("zoomend", redraw);
      mymap.on("moveend", redraw);
      //establish the circle scale before the data gets changed at all
      circleScale = d3
        .scaleLinear()
        .domain([1, userData.length])
        .range([5, maxRadius]);
    };
    let unsubscribeWifiData = wifiData.subscribe(data => {
      if (!once) {
        initialize(data);
        once = true
      }
      updateData(data)
    });
  });
</script>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
  #leafletHolder {
    width: 100%;
  }
  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  #mapid {
    height: 80vh;
  }
  svg {
    position: absolute;
  }
</style>

<div id="leafletHolder">
  <div id="mapid" />
</div>
