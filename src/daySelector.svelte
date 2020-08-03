<script>
  import {onMount} from "svelte";
  import * as d3 from "d3"
  export let axisData;
  onMount(() => {
    let svg = d3.select("#selectionGraph");
    let boundRect= svg.node().getBoundingClientRect()
    let graphInnerWidth = boundRect.width
    let height  = boundRect.height
    let xscale = d3
      .scaleTime()
      .domain(axisData.domain)
      .range([0, graphInnerWidth - 20]);

    let axis = d3.axisBottom(xscale).ticks(d3.timeDay.every(1))
    let axisG = svg.append("g").attr("transform",`translate(10,${height-20})`);
    axisG.call(axis);
    axisG.selectAll("text").style("text-achor","end")
  });
</script>

<style>
  #selectorHolder {
    border-top: black 2px solid;
  }
  #optionsBlock {
    display: flex;
    justify-content: space-evenly;
    border-top: black 1px solid;
  }
  #selectionGraph {
    border-left: black 2px solid;
    border-right: black 2px solid;
  }
  h3 {
    text-align: center;
  }
  .navOp {
      display:flex;
      align-items:center; 
  }
</style>

<div id="selectorHolder">
  <h3>Day Selector options</h3>
  <div id="optionsBlock">
    <div class="navOp" id="left"><p>left</p></div>
    <svg id="selectionGraph" />
    <div class="navOp" id="right"><p>right</p></div>
  </div>
</div>

