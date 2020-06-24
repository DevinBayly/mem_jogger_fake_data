<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { wifiData, timeSelected, allDevices } from "./store.js";
  // make brushable dimensions element, set this from the view that can query size of other elements on screen
  export let dims;
  let brushEnd = () => {
    console.log("brushing now");
  };
  onMount(() => {
    // setup, and there may be reason to update some variables that are declared
    let svg,
      times,
      buildings,
      devices,
      xscale,
      yscale,
      brushXAxis,
      brushXAxisG,
      blocksG,
      brush,
      gbrush;
    let initialize = userData => {
      svg = d3
        .select("#brushableHolder")
        .append("svg")
        .attr("width", dims.width)
        .attr("height", dims.height);
      times = [];
      buildings = [];
      devices = {};
      for (let entry of userData) {
        times.push(d3.isoParse(entry._time));
        if (buildings.indexOf(entry.apBuildingNumber) == -1) {
          buildings.push(entry.apBuildingNumber);
        }
        if (devices[entry["EndPointMatchedProfile"]] == undefined) {
          devices[entry["EndPointMatchedProfile"]] = {checked:true} ;
        }
      }
      let last_time = new Date(d3.max(times).getTime());
      last_time.setSeconds(last_time.getSeconds() + 5 * 60);
      // create the xscale that handles time

      xscale = d3
        .scaleTime()
        .domain([d3.min(times), last_time])
        .range([0, dims.width - dims.margin]);
      // set the times to be the values used in the dataSelectors component
      timeSelected.update(() => [d3.min(times), last_time]);
      allDevices.set(devices);
      // make all the same rectangles but with different ydims
      yscale = d3
        .scaleBand()
        .domain(d3.range(buildings.length + 1))
        .range([0, dims.height - dims.margin]);
      // make a label axis for bottom chart
      brushXAxis = d3.axisTop(xscale).tickPadding(0);
      brushXAxisG = svg
        .append("g")
        .attr("class", "brushAxis")
        .attr("transform", `translate(${dims.margin},${dims.margin})`)
        .call(brushXAxis);
      blocksG = svg
        .append("g")
        .attr("transform", `translate(${dims.margin},${dims.margin})`);
      // brush steps
      // create a brush
      // define functions for start and brushed
      // extent is the possible canvas that can be brushed
      brush = d3
        .brushX()
        .on("end", brushEnd)
        .extent([
          [0, 0],
          [dims.width - dims.margin, dims.height - dims.margin]
        ]);
      // create a g element, and define a class for the brush
      gbrush = blocksG.append("g").attr("class", "gBrush");
      gbrush.call(brush);
      // call the brush constructor with .call
      redraw(userData);
    };

    let redraw = data => {
      // make the small blocks
      blocksG
        .selectAll("rect")
        .data(data, d => d._time)
        .join(
          enter =>
            enter
              .append("rect")
              .attr("x", d => xscale(d3.isoParse(d._time)))
              .attr("y", (d, i) =>
                yscale(buildings.indexOf(d.apBuildingNumber))
              )
              .attr("height", yscale.bandwidth())
              .attr("width", 1),
          update => update,
          exit => exit.remove()
        );
    };
    let unsubscribe = wifiData.subscribe(data => {
      if (svg == undefined) {
        initialize(data);
      } else {
        // do redraw
        redraw(data);
      }
      // connect redraw to this
    });
  });
</script>

<div id="brushableHolder" />
