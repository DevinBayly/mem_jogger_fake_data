<script>
  export let name;
  import VidOverlay from "./overlayVid.svelte"
  import * as d3 from "d3";
  import Gant from "./gant_chart.svelte";
  window.onload = async () => {
    let paulData = await fetch(
      "location_data.json"
    ).then(res => res.json());
    // remove the eventData attribute on everything
    paulData = paulData.map(e=> {
      e = e.eventData
      // perform other important conversionss
      // make seconds into ms for date creation
      e._time = parseInt(e._time)*1000
      return e
    })
    console.log(paulData);
    let buildingNameData = await fetch(
      "building_names.csv"
    ).then(res => res.text());
    let dsv = d3.dsvFormat(",");
    buildingNameData = dsv.parse(buildingNameData);
    console.log(paulData, buildingNameData);
    const graph = new Gant({
      target: document.body,
      props: {
        data: paulData,
        buildingData: buildingNameData
      }
    });
  };
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
</style>

<VidOverlay></VidOverlay>

<div id="tooltipHolder">
  <p id="tipText" />
</div>
<div id="graphs">
  <div id="topaxisholder">
    <svg id="topaxis">
    </svg>
  </div>
  <div id="topgraph">
    <svg id="main" />
  </div>
  <div id="bottomgraph">
    <svg id="brushable" />
  </div>
</div>
