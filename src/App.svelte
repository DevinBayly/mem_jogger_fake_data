<script>
  export let name;
  import { onMount } from "svelte";
  import * as d3 from "d3"
  onMount(() => {
    console.log("loaded");
    let mymap = L.map("mapid").setView([32.231481, -110.951838],18);
    L.esri.basemapLayer("Gray").addTo(mymap);
    var subtleUA = L.esri
      .tiledMapLayer({
        url:
          "https://services.maps.arizona.edu/pdc/rest/services/SubtleCanvasTiles/MapServer"
      })
      .addTo(mymap);
    // get bounds 
    console.log(mymap.getBounds(),"those are lat lngs",mymap.getPixelBounds(),"these are pixel bounds")
    // this is the width the svg should be to cover the full map
    let bounds = mymap.getPixelBounds()
    let width = bounds.max.x- bounds.min.x
    let height = bounds.max.y - bounds.min.y
    console.log("origin is",mymap.getPixelOrigin())
    // create an svg
    let svg = d3.select(mymap.getPanes().overlayPane).append("svg");
    svg.attr("height",height)
    svg.attr("width",width)
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
    let applyLatLngToLayer = function(d) {
      // do some comparison of building number to geojson of buildings to get coords
      let x = d[1];
      let y = d[0];
      return mymap.latLngToLayerPoint(new L.LatLng(y, x));
    };
    // create a point for the student union, i think this has been ordered y,x by lat lng
    let dataPoint = [[32.232508, -110.951248]];

    // make a circle and append it to the svg, and then transform it with the results of the applylatlng
    let circle = g
      .selectAll("circle")
      .data(dataPoint)
      .enter()
      .append("circle")
      .attr("r", 20)
      .attr("class", "testpoint")
      .attr(
        "transform",
        d => `translate(${applyLatLngToLayer(d).x},${applyLatLngToLayer(d).y})`
      )
      .attr("fill","red")
      ;
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
