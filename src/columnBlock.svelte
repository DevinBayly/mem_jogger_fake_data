<script>
  import { onMount } from "svelte";
  export let blockData;
  onMount(async() => {
      console.log("got ",blockData)
      // create a d3 svg
      let svg = d3.select("#timegraph")
      svg.attr("height",blockData.datadims.height)
      svg.attr("width",blockData.datadims.width)
      let xscale = d3.scaleLinear()
        .domain(blockData.domain)
        .range([blockData.datadims.margin,blockData.datadims.width-blockData.datadims.margin])
  })
</script>

<div id="block">
  <div id="info" >{JSON.stringify(blockData)}</div>
  <div id="graphic">
    <svg id="timegraph" />
  </div>
</div>
