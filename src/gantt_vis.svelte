<script>
  export let reportData
  import * as d3 from "d3";
  import Gant from "./gant_chart.svelte";
  import {onMount} from "svelte"
  onMount( async () => {
    // remove the eventData attribute on everything
    let buildingNameData = await fetch(
      "building_names.csv"
    ).then(res => res.text());
    let dsv = d3.dsvFormat(",");
    buildingNameData = dsv.parse(buildingNameData);
    console.log(reportData, buildingNameData);
    const graph = new Gant({
      target: document.body,
      props: {
        data: reportData,
        buildingData: buildingNameData
      }
    });
  }
  )
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


<div id="tooltipHolder">
  <p id="tipText" />
</div>
<div id="graphs">
  <div id="topaxisholder">
    <svg id="topaxis" />
  </div>
  <div id="topgraph">
    <svg id="main" />
  </div>
  <div id="bottomgraph">
    <svg id="brushable" />
  </div>
</div>
