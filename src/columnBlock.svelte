<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  export let blockData;

  onMount(() => {

    // create a d3 svg
    let svg = d3.select(`#graph${blockData.id}`)
    svg.attr("height", blockData.dataDims.height);
    svg.attr("width", blockData.dataDims.width);
    let xscale = d3
      .scaleTime()
      .domain(blockData.domain)
      .range([0, blockData.dataDims.width - blockData.dataDims.margin]);
    let rectsG = svg
      .append("g")
      .attr("transform", `translate(${blockData.dataDims.margin},0)`);
    let rects = rectsG
      .selectAll("rect")
      .data([blockData])
      .enter()
      .append("rect")
      .attr("x", d => xscale(d.startTime))
      .attr("y", 0)
      .attr("height", blockData.dataDims.height)
      .attr("width", d => xscale(d.duration) - xscale(d.startTime));
  });
</script>

<style>
#info{
  word-wrap:anywhere;
}
</style>

<div id="block">
  <div id="info">
  <p>Building: {blockData.buildingName}</p>
  <p>Room Number: {blockData.room}</p>

  </div>
  <div id="graphic" >
    <svg id={"graph"+blockData.id} />  </div>
</div>
