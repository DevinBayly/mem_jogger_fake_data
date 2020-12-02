<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { histogramData, coordinator } from "./store.js";
  // make brushable dimensions element, set this from the view that can query size of other elements on screen
  export let dims;
  onMount(() => {
    // setup, and there may be reason to update some variables that are declared
    let userData,
      svg,
      times,
      buildings,
      devices,
      xscale,
      yscale,
      axis,
      axisG,
      contentContainer,
      blocksG,
      brush,
      gbrush,
      t1,
      t2;
    function brushEnd() {
      // this function will update our histogram data
      const ext = d3.brushSelection(this);
      let start = xscale.invert(ext[0]);
      let end = xscale.invert(ext[1]);
      let permittedTimes = [];
      for (let i = 0; i < times.length; i++) {
        let time = times[i];
        if (time < end && time > start) {
          permittedTimes.push(JSON.stringify(time));
        }
      }
      // update the coordinator
      coordinator.update(value => {
        value.trigger = "brush";
        value.time = permittedTimes;
        return value;
      });
    }
    let redraw = () => {
      d3.selectAll(".minuteMarks").remove()
      let last_time = new Date(d3.max(times).getTime());
      last_time.setSeconds(last_time.getSeconds() + 5 );
      xscale.domain([d3.min(times), last_time]);

      axisG.call(axis);
      // create the vertical minute marks
      let first = xscale.domain()[0];
      let last = xscale.domain()[1];
      first.setSeconds(0);
      first.setMilliseconds(0);
      while (first <= last) {
        // make
        let linedata = [
          [xscale(first), dims.margin + (dims.height - dims.margin * 2) / 2],
          [
            xscale(first),
            dims.margin + (dims.height - dims.margin * 2) / 2 + 10
          ]
        ];
        let linegen = d3
          .line()
          .x(d => d[0])
          .y(d => d[1]);
        let minuteMarks = contentContainer
          .append("path")
          .datum(linedata)
          .attr("stroke", "black")
          .attr("class","minuteMarks")
          .attr("d", linegen)
          .lower();
        first.setMinutes(first.getMinutes() + 1);
      }
    };
    let initialize = () => {
      svg = d3
        .select("#brushableHolder")
        .append("svg")
        .attr("width", dims.width)
        .attr("height", dims.height);
      // create the xscale that handles time

      xscale = d3.scaleTime().range([0, dims.width - dims.margin * 2]);
      // set the times to be the values used in the dataSelectors component
      // create the scale and the brush that go with the section
      axisG = svg
        .append("g")
        .attr("transform", `translate(${dims.margin},${dims.margin})`);
      axis = d3.axisTop(xscale);
      axisG.call(axis);
      // create the brushes
      gbrush = svg.append("g").attr("class", "brush");
      brush = d3
        .brushX()
        .on("end", brushEnd)
        .extent([
          [dims.margin, dims.margin],
          [dims.width - dims.margin, dims.height - dims.margin]
        ]);
      gbrush.call(brush);
      let vertdata = [[0, dims.margin], [0, dims.height - dims.margin]];
      let line = d3
        .line()
        .x(d => d[0])
        .y(d => d[1]);
      contentContainer = svg
        .append("g")
        .attr("transform", `translate(${dims.margin},0)`);
      let vertG = contentContainer.append("g");
      vertG.lower();
      let vert = vertG
        .append("path")
        .datum(vertdata)
        .attr("d", line)
        .attr("stroke", "red");
      // get svg container on page so we know where to draw the line
      let svgPad = axisG.node().getBoundingClientRect();
      let coef = 1000 * 60;
      svg.on("mousemove", function() {
        // there could be performance issues if too much cursoring is happening, TODO set a block to run only once the previous time is complete
        // todo make it snap to the individual minutes, and update the map data
        let precisex = d3.event.pageX - svgPad.left;
        let cursorTime = xscale.invert(precisex);
        cursorTime.setSeconds(0);
        cursorTime.setMilliseconds(0);
        console.log("cursortime is", cursorTime);
        vertG.attr("transform", `translate(${xscale(cursorTime)},0)`);
        //
        coordinator.update(value => {
          // in final version this will be a time stamp instead of an index
          for (let i = 0; i < times.length; i++) {
            // they are still off by too much even when they say they are equal.
            let delta = Math.abs(times[i].getTime() - cursorTime.getTime())/1000
            console.log(delta)
            if (times[i].getTime() == cursorTime.getTime()) {
              value.time =JSON.stringify(times[i]);
              value.trigger = "cursor";
              break;
            }
          }
          return value;
        });
      });
    };
    let histUnsub = histogramData.subscribe(data => {
      if (svg == undefined && data != null) {
        initialize();
      }
      if (data != null && times== undefined ) {
        times = [];
        for (let i in data) {
          // number of minutes
          let itime = new Date(i)
          times.push(itime);
        }
        console.log("times are", times);
        redraw();
      }
    });
  });
</script>

<div id="brushableHolder" />
