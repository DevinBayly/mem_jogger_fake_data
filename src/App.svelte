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
    // what's bizarre is that we get such wrong values for layerPointToLatLngs, but the feature layer is drawn in the correct spot
    let roomFeatures = L.esri
      .featureLayer({
        url:
          "https://services.maps.arizona.edu/pdc/rest/services/Interior/MapServer/16"
      })
      .addTo(mymap);
    roomFeatures.setStyle({ opacity: 0, fill: false });
    let boundsAndRooms = [];
    roomFeatures.on("load", () => {
      //
      let uid = 0;
      for (let room in roomFeatures._layers) {
        let layerData = roomFeatures._layers[room];
        let bound = layerData._bounds;
        let mid = {
          lat:
            bound._southWest.lat +
            (bound._northEast.lat - bound._southWest.lat) / 2,
          lng:
            bound._northEast.lng +
            (bound._southWest.lng - bound._northEast.lng) / 2
        };
        boundsAndRooms.push({
          uid,
          roomID: layerData.feature.properties["ROOMEXT.RM_ID"],
          building: layerData.feature.properties["ROOMEXT.BldgName"],
          point: mid
        });
        uid += 1;
      }
      console.log("rooms and bounds", boundsAndRooms);
    });

    let roomData = await fetch("rooms.geojson").then(res => res.json());
    let paulData = await fetch("paulFebruaryTokenized.csv").then(res =>
      res.text()
    );
    console.log(paulData);
    let dsv = d3.dsvFormat(",");
    paulData = dsv.parse(paulData);
    // get bounds
    console.log(
      mymap.getBounds(),
      "those are lat lngs",
      mymap.getPixelBounds(),
      "these are pixel bounds"
    );
    // this is the width the svg should be to cover the full map
    let bounds = mymap.getPixelBounds();
    let width = bounds.max.x - bounds.min.x;
    let height = bounds.max.y - bounds.min.y;
    console.log("origin is", mymap.getPixelOrigin());
    // create an svg
    let svg = d3.select(mymap.getPanes().overlayPane).append("svg");
    svg.attr("height", bounds.max.y - bounds.min.y);
    svg.attr("width", bounds.max.x - bounds.min.x);
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
    let roomLatLng = function(d) {
      return mymap.latLngToLayerPoint(new L.LatLng(d.lat, d.lng));
    };
    let applyLatLngToLayer = function(d) {
      // do some comparison of building number to geojson of buildings to get coords
      let y = d[1];
      let x = d[0];
      return mymap.latLngToLayerPoint(new L.LatLng(y, x));
    };
    // create a point for the student union, i think this has been ordered y,x by lat lng
    let allData = await fetch("buildings.geojson").then(res => res.json());
    // create a map that is building number to coordinates
    let numToCoords = {};
    for (let e of allData.features) {
      numToCoords[e.properties["BuildingPoints.SpaceNum"]] =
        e.geometry.coordinates;
    }
    console.log(numToCoords);
    console.log(paulData);
    let buildingPoints = [];
    for (let connection of paulData) {
      let coords = numToCoords[connection.apBuildingNumber];
      if (coords != undefined) {
        buildingPoints.push({ tstamp: connection._time, coords: coords });
      } else {
        console.log(
          "prob with ",
          connection,
          "building",
          connection.apBuildingNumber
        );
      }
    }
    console.log(buildingPoints);
    console.log();
    let redraw = function() {
      console.log("redrawing");
      // occasionally when zooming and panning the svg's container move, so we have to set svg to be relative and move it left and right
      let circleRad = 5;

      // make a circle and append it to the svg, and then transform it with the results of the applylatlng
      let circle = g
        .selectAll(".testPoints")
        .data(buildingPoints, d => d.tstamp)
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
      if (boundsAndRooms.length > 0) {
        let blueCircles = g
          .selectAll(".roomPoints")
          .data(boundsAndRooms, d => d.uid)
          .join(enter =>
            enter
              .append("circle")
              .attr("r", 3)
              .attr("fill", "blue")
              .attr("class", ".roomPoints")
              .attr(
                "transform",
                d => `translate(${roomLatLng(d.point).x},${roomLatLng(d.point).y})`
              )
          );
      }
      // get the pixel coordinates of the top left corner,
      let newPlace = svg.node().getBoundingClientRect();
      svg.style("left", -newPlace.left + "px");
      svg.style("top", -newPlace.top + "px");
      // now update the g that is containing the circles
      g.attr("transform", `translate(${newPlace.left},${newPlace.top})`);
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
