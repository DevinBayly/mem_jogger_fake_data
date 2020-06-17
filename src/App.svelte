<script>
  export let name;
  import { onMount } from "svelte";
  import * as d3 from "d3";
  onMount(async () => {
    console.log("loaded");
    /*
    let mymap = L.map("mapid").setView([32.231481, -110.951838], 18);
    L.esri.basemapLayer("Gray").addTo(mymap);
    var subtleUA = L.esri
      .tiledMapLayer({
        url:
          "https://services.maps.arizona.edu/pdc/rest/services/SubtleCanvasTiles/MapServer"
      })
      .addTo(mymap);
      */
    let paulData = await fetch("paulFebruaryTokenized.csv").then(res =>
      res.text()
    );
    console.log(paulData);
    let dsv = d3.dsvFormat(",");
    paulData = dsv.parse(paulData);
    let layer = new L.StamenTileLayer("toner");
    let mymap = L.map("mapid").setView(
      [32.235649302713874, -110.95145375967088],
      16
    );

    mymap.addLayer(layer);
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
    svg.attr("height",bounds.max.y - bounds.min.y)
    svg.attr("width",bounds.max.x - bounds.min.x)
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
        buildingPoints.push({tstamp:connection._time,coords:coords});
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
      let circleRad = 5;

      // make a circle and append it to the svg, and then transform it with the results of the applylatlng
      let circle = g
        .selectAll(".testPoints")
        .data(buildingPoints,d=> d.tstamp )
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
</style>

<div id="leafletHolder">
  <div id="mapid" />
</div>
