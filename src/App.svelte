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
    let roomData = await fetch("rooms.geojson").then(res => res.json());
    let roomMap = {};
    for (let r of roomData.features) {
      let roomNum = r.attributes["ROOMEXT.RM_ID"];
      let buildingNum = r.attributes["ROOMEXT.BldgAlpha"];
      let key = `${roomNum},${buildingNum}`;
      roomMap[key] = r.geometry;
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
    // compare Paul's data to the roomMap
    let paulRooms = [];
    for (let e of paulData) {
      let ekey = `0${e.apRoomNumber},${e.apBuildingNumber}`;
      if (roomMap[ekey] != undefined) {
        // make into a poly line and get the centroid
        // TODO ask Naveed if there's any examples of shapes where we have to use more than the first entry of rings?
        console.log(e)
        let ringLats = roomMap[ekey].rings[0].map(pair =>
          L.Projection.SphericalMercator.unproject(new L.Point(pair[0], pair[1]))
        );
        let roomCenter = L.polyline(ringLats,{fill:false,opacity:0})
          .addTo(mymap)
          .getCenter();
        paulRooms.push({ tstamp: e._time, coords: roomCenter });
      }
    }
    // get bounds
    console.log("paul's rooms",paulRooms)

    // this is the width the svg should be to cover the full map
    let bounds = mymap.getPixelBounds();
    let width = bounds.max.x - bounds.min.x;
    let height = bounds.max.y - bounds.min.y;
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
    let applyLatLngToLayer = function(d) {
      // d is a lat lng calculated from the getCenter() method of a polyline
      // do some comparison of building number to geojson of buildings to get coords
      return mymap.latLngToLayerPoint(d);
    };
    let redraw = function() {
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
