<script>
  //
  export let buildingJSON;
  import MissingView from "./MissingBuildingView.svelte";
  import Popout from "./Popout.svelte"
  import { MergeInterval } from "./algos.js";
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
      catScale,
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
              .attr("opacity",.8)
              .attr("r", 10)
              .attr("stroke","white")
              .attr("stroke-width",2)
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
              .attr("fill", d => catScale(d.category))
              .attr("title", d => {
                if (d.duration > 60) {
                  return `${Math.floor(d.duration / 60)} Hours, ${d.duration% 60} Minutes`;
                } else {
                  return `${d.duration} Minutes`;
                }
              }),
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
              .attr("fill", d => catScale(d.category))
              .attr("title", d => {
                if (d.duration > 60) {
                  return `${Math.floor(d.duration / 60)} Hours, ${d.duration% 60} Minutes`;
                } else {
                  return `${d.duration} Minutes`;
                }
              }),
          exit => exit.remove()
        );
      circle.on("mouseover",function(){
        let circ = d3.select(this)
        let data = circ.data()[0]
        //get the xy, and make a new popout, push the popout to collection to remove on zoom
        let duration = (data.duration > 60) ? `${Math.floor(data.duration / 60)} Hours, ${data.duration% 60} Minutes`: `${data.duration} Minutes`
        new Popout({
          target:mymap.getPanes().overlayPane,
          props:{
            time:duration,
            screen:applyLatLngToLayer(data.coords)
          }
        })
      })
      circle.on("mouseout",()=> {
        for (let popout of document.querySelectorAll("#popoutHolder")) {
          popout.remove()
        }
      })
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
      if (document.querySelector("#missingReport")) {
        document.querySelector("#missingReport").remove();
      }
      console.log("running data");
      if (userData.length == 0) {
        // just pick a graphData
        // remove the legend
        legendG.remove();
        document.querySelector("#legend");
        graphData = [];
        redraw();
        return;
      }
      missingBuildings = [];
      let activeBuildings = {};
      for (let connection of userData) {
        // testing
        if (buildingMap[connection.apBuildingNumber] == undefined) {
          // this is a missing building
          // no connection of apBuildingNumber with the map we have generated
          missingBuildings.push(connection);
        }
        if (activeBuildings[connection.apBuildingNumber] == undefined) {
          activeBuildings[connection.apBuildingNumber] = {
            coords: buildingMap[connection.apBuildingNumber],
            connections: [connectionData(connection)],
            number: connection.apBuildingNumber
          };
        } else {
          activeBuildings[connection.apBuildingNumber].connections.push(
            connectionData(connection)
          );
        }
      }
      // feed each building's connections into the mergeinterval algorithm, sum and set as duration value
      graphData = [];
      for (let building in activeBuildings) {
        // run the mergeinterval algorithm
        let dedupDurations = MergeInterval(
          activeBuildings[building].connections
        );
        let sum = 0;
        // calculate sum in ms
        for (let connection of dedupDurations) {
          sum += connection.dur;
        }
        let minutes = sum / (1000 * 60);
        //establish a duration attribute in minutes
        activeBuildings[building].duration = minutes;
        let category;
        if (minutes < 15) {
          category = 1;
        } else if (minutes > 15 && minutes < 60) {
          category = 2;
        } else {
          category = 3;
        }

        activeBuildings[building].category = category;
        graphData.push(activeBuildings[building]);
      }
      //get only the durations and establish domain
      // only update the domain once
      let durations = graphData.map(e => e.duration);
      // create categorical scale
      catScale = d3.scaleQuantize().domain([1,3]).range(["#fee8c8","#fdbb84","#e34a33"]);

      let minCircleScale = d3
        .scaleLinear()
        .domain([0, Math.max(...durations)])
        .range([0, 20]);
      circleScale
        .domain([minCircleScale.invert(5), Math.max(...durations)])
        .range([5, 20]);
      createLegend();
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
      // resolved?
      if (missingBuildings.length > 0) {
        new MissingView({
          target: document.querySelector("#legendHolder"),
          props: {
            missingBuildings
          }
        });
      }
      // the northwest corner is the max.y and the min.x, and the south east corner is the min.y and the max.x
      console.log("boundsbox is", bbox);
      bboxNWLatLng = new L.LatLng(bbox.y.max, bbox.x.min);
      bboxSELatLng = new L.LatLng(bbox.y.min, bbox.x.max);
      redraw();
    };
    // this function takes the important values out of each connection and makes an object that can be put in an array for mergeinterval algorithm to run on
    // first step in deduplicating duration calculations
    let connectionData = d => {
      // calculate in ms the data in niceDuration
      let parts = d.niceDuration.split(":").map(e => parseInt(e));
      // hour,minute,second, want in ms as that's the getTime resolution
      let totalDuration =
        (parts[0] * 60 * 60 + parts[1] * 60 + parts[2]) * 1000;
      // 15minutes in ms
      if (totalDuration < 15 * 60 * 1000) {
        //console.error("duration is less than 15 mins for ", d);
      }
      return { start: d._time, dur: totalDuration };
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
      circleScale = d3
        .scaleLinear()
        .nice()
        .range([5, 20])
        .clamp(true);
      //legend setup
    };
    let createLegend = () => {
      if (legendG != undefined) {
        legendG.remove();
      }
      legendSvg = d3.select("#legend");
      legendG = legendSvg.append("g").attr("transform", "translate(20,20)");
      legendEle = legend
        .legendColor()
        .scale(catScale)
        .labels(["< 15 mins","15 mins to 1 hour ", "> 1 hour"])
        .shape("circle")
        .labelOffset(20)
        .shapePadding(20)
        .orient("vertical");
      legendG.call(legendEle);
      d3.select("#legendHolder").style(
        "width",
        legendG.node().getBoundingClientRect().width + 20 + "px"
      );
      legendSvg.attr(
        "height",
        legendG.node().getBoundingClientRect().height + 20 + "px"
      );
      legendSvg.attr(
        "width",
        legendG.node().getBoundingClientRect().width + 20 + "px"
      );
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
    border: 1px black solid;
    padding: 10px;
    z-index: 5000;
  }
</style>

<div id="leafletHolder">
  <div id="mapid">

    <div id="legendHolder">
      <p>Minutes Spent in Area</p>
      <svg id="legend" />
    </div>
  </div>
</div>
