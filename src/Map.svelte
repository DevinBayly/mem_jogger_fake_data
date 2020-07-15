<script>
  export let buildingJSON;
  import MissingView from "./MissingBuildingView.svelte"
  import { onMount } from "svelte";
  import { wifiData } from "./store.js";
  import * as d3 from "d3";
  import legend from "d3-svg-legend";
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
    console.log("building map is ", buildingMap);

    // subscribe to the store
    let once = false;
    let graphData,
      circleScale,
      applyLatLngToLayer,
      bboxNWLatLng,
      legendSvg,
      legendG,
      legendEle,
      missingBuildings,
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
              .attr("r", d => circleScale(d.duration))
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
            update
              .attr("transform", d => {
                if (d.coords == undefined) {
                  console.log("missing coords on", d);
                } else {
                  return `translate(${applyLatLngToLayer(d.coords).x},${
                    applyLatLngToLayer(d.coords).y
                  })`;
                }
              })
              .attr("r", d => circleScale(d.duration)),
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
      //
      // remove missing buildings from legend if found
      if( document.querySelector("#missingReport")) {
         document.querySelector("#missingReport").remove()
      }
      console.log("running data");
      if (userData.length == 0) {
        // just pick a graphData
        graphData = [];
        redraw();
        return;
      }
      missingBuildings =[]
      let activeBuildings = {};
      for (let connection of userData) {
        // testing
        if (buildingMap[connection.apBuildingNumber] == undefined) {
          // this is a missing building
          // no connection of apBuildingNumber with the map we have generated
          missingBuildings.push(connection)
        }
        if (activeBuildings[connection.apBuildingNumber] == undefined) {
          activeBuildings[connection.apBuildingNumber] = {
            coords: buildingMap[connection.apBuildingNumber],
            duration: calculateTime(connection),
            number: connection.apBuildingNumber
          };
        } else {
          activeBuildings[
            connection.apBuildingNumber
          ].duration += calculateTime(connection);
        }
      }
      // convert active Buildings into an array for simplicity in D3
      graphData = [];
      for (let building in activeBuildings) {
        graphData.push(activeBuildings[building]);
      }
      //get only the durations and establish domain
      // only update the domain once
        let durations = graphData.map(e => e.duration);
        let minCircleScale = d3.scaleLinear()
        .domain([0, Math.max(...durations)])
        .range([0,20])
        circleScale
          .domain([minCircleScale.invert(5), Math.max(...durations)])
          .range([5, 20]);
        createLegend()
      // force correct radius

      // update legend so values change
      console.log("graph data ", graphData);
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
      // if we have missing buildings, create missing building ahref
      if (missingBuildings.length > 0) {
        new MissingView({
          target:document.querySelector("#legendHolder"),
          props:{
            missingBuildings
          }
        })
      }
      // the northwest corner is the max.y and the min.x, and the south east corner is the min.y and the max.x
      console.log("boundsbox is", bbox);
      bboxNWLatLng = new L.LatLng(bbox.y.max, bbox.x.min);
      bboxSELatLng = new L.LatLng(bbox.y.min, bbox.x.max);
      redraw();
    };
    // this function lets us figure out the amount of time (in minutes) for a duration
    let calculateTime = d => {
      // calculate in ms the data in niceDuration
      let parts = d.niceDuration.split(":").map(e => parseInt(e));
      let total = parts[0] * 60 + parts[1] + parts[2] / 60;
      if (total < 15) {
        console.log("duration is less than 15 mins for ",d)
      }
      return total
    };
    let initialize = userData => {
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
      // decide circle scale is the sum of the amount of time spent in that location during the selected time
      // separate by building
      circleScale = d3.scaleLinear().nice().range([5, 20]).clamp(true);
      //legend setup
    };
    let createLegend = ()=> {
      if (legendG != undefined) {
        legendG.remove()
      }
      legendSvg = d3.select("#legend");
      legendG = legendSvg.append("g").attr("transform", "translate(20,20)");
      legendEle = legend
        .legendSize()
        .scale(circleScale)
        .shape("circle")
        .labelOffset(20)
        .labelFormat(d3.format(".0f"))
        .shapePadding(20)
        .orient("vertical");
      legendG.call(legendEle);
      d3.select("#legendHolder").style(
        "width",
        (legendG.node().getBoundingClientRect().width + 20) + "px"
      );
      legendSvg.attr(
        "height",
        legendG.node().getBoundingClientRect().height + 20 + "px"
      );
      legendSvg.attr(
        "width",
        legendG.node().getBoundingClientRect().width + 20 + "px"
      );
      // attempt to style the created legend correctly
      d3.selectAll(".swatch")
        .attr("fill", "red")
        .attr("opacity", 0.5);
      if (circleScale.domain()[0] == circleScale.domain()[1]) {
        d3.selectAll(".cell")
          .data([1])
          .exit()
          .remove();
      }
    };
    let unsubscribeWifiData = wifiData.subscribe(data => {
      if (data != null) {
        if (!once) {
          initialize(data);
          once = true;
        }
        if (data.type != undefined) {
          console.log("brush trigger data change", data.type);
          updateData(data.data);
        } else {
          updateData(data);
        }
      }
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
  #legendHolder {
    position: absolute;
    right: 0px;
    background: white;
    border-radius: 10px;
    border:1px black solid;
    padding: 10px;
    z-index: 5000;
  }
</style>

<div id="leafletHolder">
  <div id="mapid" />
</div>
<div id="legendHolder">
  <p>Radius in minutes</p>
  <svg id="legend" />
</div>
