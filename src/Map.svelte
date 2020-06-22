<script>
  export let name;
  import { onMount } from "svelte";
  import * as d3 from "d3";
  onMount(async () => {
    console.log("loaded");
    let mymap = L.map("mapid").setView([32.231481, -110.951838], 18);
    L.esri.basemapLayer("Gray").addTo(mymap);
    var subtleUA = L.esri
      .tiledMapLayer({
        url:
          "https://services.maps.arizona.edu/pdc/rest/services/SubtleCanvasTiles/MapServer"
      })
      .addTo(mymap);
    let roomMap = {};
    // iterate over the files
    let files = [
      "rooms16.geojson",
      "rooms17.geojson",
      "rooms18.geojson",
      "rooms19.geojson",
      "rooms20.geojson",
      "rooms21.geojson",
      "rooms22.geojson",
      "rooms23.geojson",
      "rooms24.geojson",
      "rooms25.geojson",
      "rooms26.geojson",
      "rooms27.geojson"
    ];
    for (let roomFile of files) {
      console.log("loading ", roomFile);
      let roomData = await fetch(roomFile).then(res => res.json());
      for (let r of roomData.features) {
        let roomNum = r.attributes["ROOMEXT.RM_ID"];
        let buildingNum = r.attributes["ROOMEXT.BldgAlpha"];
        let key = `${roomNum},${buildingNum}`;
        roomMap[key] = r.geometry;
      }
    }
    console.log("the room map is", roomMap);
    // this  is the magic line for converting the polygon data into useful values
    /*
      let point = new L.Point(centerL20[0],centerL20[1])
      let pointLatLng = L.Projection.SphericalMercator.unproject(point)
      */

    let paulData = await fetch("paulFebruaryTokenized.csv").then(res =>
      res.text()
    );
    let dsv = d3.dsvFormat(",");
    paulData = dsv.parse(paulData);
    // Naveed's formula for calculating a centroid
    // TODO make proper attribution for this code
    var getCentroid = function(arr) {
      return arr.reduce(
        function(x, y) {
          return [x[0] + y[0] / arr.length, x[1] + y[1] / arr.length];
        },
        [0, 0]
      );
    };
    // compare Paul's data to the roomMap
    let paulRooms = [];
    for (let e of paulData) {
      let ekey;
      // strip out the number part of the room number from the letters, but keep track of what's there after the numbers so we can add it back
      let justNumbers = e.apRoomNumber.match(/(\d+)(.*)/);
      if (justNumbers) {
        ekey = `${justNumbers[1].padStart(4, "0")}${justNumbers[2]},${
          e.apBuildingNumber
        }`;
      } else {
        ekey = `${e.apRoomNumber.padStart(4, "0")},${e.apBuildingNumber}`;
      }
      console.log(e.apBuildingNumber, e.apRoomNumber);
      if (roomMap[ekey] != undefined) {
        console.log("hit");
        // make into a poly line and get the centroid
        // TODO ask Naveed if there's any examples of shapes where we have to use more than the first entry of rings?
        let centerMercator = getCentroid(roomMap[ekey].rings[0]);
        /*
        let roomCenter = L.polyline(ringLats, { fill: false })
          .addTo(mymap)
          .getCenter();
          */
        let pMerc = new L.Point(centerMercator[0], centerMercator[1]);
        let pLatLng = L.Projection.SphericalMercator.unproject(pMerc);
        paulRooms.push({ tstamp: e._time, coords: pLatLng });
      }
    }
    // get bounds
    console.log("paul's rooms", paulRooms);

    // this is the width the svg should be to cover the full map
    let bounds = mymap.getPixelBounds();
    let width = bounds.max.x - bounds.min.x;
    let height = bounds.max.y - bounds.min.y;
    // create an svg
    let svg = d3.select(mymap.getPanes().overlayPane).append("svg");
    let g = svg.append("g").attr("class", "leaflet-zoom-hide");
    // create the geotransform
    let projectPoint = function(x, y) {
      let pt = mymap.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(pt.x, pt.y);
    };
    let transform = d3.geoTransform({
      point: projectPoint
    });
    let d3path = d3.geoPath().projection(transform);
    // define apply latlng to layer that takes in geopoints and produces screenspace x,y for drawing on svg
    // NOTE that geojson points are going to have the x first in the coordinates
    let applyLatLngToLayer = function(d) {
      // d is a lat lng calculated from the getCenter() method of a polyline
      // do some comparison of building number to geojson of buildings to get coords
      return mymap.latLngToLayerPoint(d);
    };
    // calculate the nw corner of a bounding box on the points
    let bbox = {x:{},y:{}}
    for(let i = 0 ; i < paulRooms.length;i++) {
      let d=paulRooms[i].coords
      if (i == 0) {
        // set minmax off the bat
        bbox.x.min = bbox.x.max = d.lng
        bbox.y.min = bbox.y.max = d.lat
        continue
      }
      if (d.lat > bbox.y.max) {
        bbox.y.max = d.lat
      }
      if (d.lat < bbox.y.min) {
        bbox.y.min = d.lat
      }
      if (d.lng > bbox.x.max) {
        bbox.x.max = d.lng
      }
      if (d.lng < bbox.x.min) {
        bbox.x.min = d.lng
      }
    }
    // the northwest corner is the max.y and the min.x, and the south east corner is the min.y and the max.x
    console.log("boundsbox is",bbox)
    let bboxNWLatLng = new L.LatLng(bbox.y.max,bbox.x.min)
    let bboxSELatLng = new L.LatLng(bbox.y.min,bbox.x.max)
    let redraw = function() {
      // need a function to calculate the bounds of the points
      console.log("redrawing");
      // occasionally when zooming and panning the svg's container move, so we have to set svg to be relative and move it left and right
      let circleRad = 5;

      // make a circle and append it to the svg, and then transform it with the results of the applylatlng
      let circle = g
        .selectAll(".testPoints")
        .data(paulRooms, d => d.tstamp)
        .join(
          enter =>
            enter
              .append("circle")
              .attr("r", circleRad)
              .attr("class", "testPoints")
              .attr(
                "transform",
                d =>
                  `translate(${applyLatLngToLayer(d.coords).x},${
                    applyLatLngToLayer(d.coords).y
                  })`
              )
              .attr("fill", "red"),
          update =>
            update.attr(
              "transform",
              d =>
                `translate(${applyLatLngToLayer(d.coords).x},${
                  applyLatLngToLayer(d.coords).y
                })`
            ),
          exit => exit
        );
      // the width is the diff nw and se bbox points 
      let screenNW = applyLatLngToLayer(bboxNWLatLng)
      let screenSE = applyLatLngToLayer(bboxSELatLng)
      // make sure the circles don't get cut off, so we add a radius on all edges of SVG
      svg.attr("width",screenSE.x -screenNW.x + 2*circleRad)
      svg.attr("height",screenSE.y -screenNW.y + 2*circleRad)
      // get the pixel coordinates of the top left corner of bbox
      // subtract some left so we don't cutt off the circles
      svg.style("left", (screenNW.x - circleRad)+  "px");
      svg.style("top", (screenNW.y -circleRad)+  "px");
      // now update the g that is containing the circles
      // add in the circle radius because points need to shift extra given the padded space
      g.attr("transform", `translate(${-screenNW.x+ circleRad },${-screenNW.y + circleRad})`);
    };
    redraw();
    // connect redraw to the map events
    mymap.on("zoomend", redraw);
    mymap.on("moveend", redraw);
  });
</script>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
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
    height: 100vh;
  }
  svg {
    position: absolute;
  }
</style>

<div id="leafletHolder">
  <div id="mapid" />
</div>
