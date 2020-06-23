<script>
  import * as d3 from "d3";
  export let blockData
  import {onMount} from "svelte"
  onMount(()=> {

    // calculate the space left to make the brushable region
    d3.select("#topgraph").style(
      "height",
      document.querySelector("#bottomgraph").getBoundingClientRect().top + "px"
    );
    // make a copy while the data is still for the global view
    ob.brushableXScale = ob.xscale.copy();
    // make the final range larger so it covers the entire bottom of page
    ob.brushableXScale.range([
      0,
      ob.brushableDimensions.innerwidth -
        ob.brushableDimensions.margin * 2 -
        ob.maxTextWidth
    ]);
    // make all the same rectangles but with different ydims
    ob.brushableYScale = d3
      .scaleBand()
      .domain(d3.range(ob.buildings.length + 1))
      .range([
        ob.brushableDimensions.margin,
        ob.brushableDimensions.innerheight
      ])
      .round(true);
    // make a label axis for bottom chart
    ob.brushXAxis = d3.axisTop(ob.brushableXScale).tickPadding(0);
    ob.brushXAxisG = ob.brushSvg
      .append("g")
      .attr("class", "brushAxis")
      .attr(
        "transform",
        `translate(${ob.maxTextWidth},${ob.brushableDimensions.margin})`
      )
      .call(ob.brushXAxis);
    ob.blocksG = ob.brushSvg
      .append("g")
      .attr("transform", `translate(${ob.maxTextWidth},0)`);
    // split this by device
    for (let device in ob.devices) {
      let deviceData = ob.devices[device];
      console.log("device", device, "data", deviceData);
      ob.occupancyBlocks = ob.blocksG
        .selectAll(".dataElement")
        .data(deviceData, function(d) {
          return d._time;
        })
        .enter()
        .append("rect");
      ob.occupancyBlocks
        .attr("x", d => {
          return ob.brushableXScale(d3.isoParse(d._time));
        })
        .attr("y", d => {
          let wapID = ob.calcWapID(d);
          let i = ob.buildings.indexOf(wapID);
          return ob.brushableYScale(i);
        })
        .attr("width", (d, i) => {
          // TODO figure out how to convey the lack of confidence about certain end times
          if (i + 1 == deviceData.length) {
            let time_end = d3.isoParse(deviceData[i]._time);
            time_end = time_end.setSeconds(time_end.getSeconds() + 5 * 60);
            return (
              ob.brushableXScale(time_end) -
              ob.brushableXScale(d3.isoParse(deviceData[i]._time))
            );
          }
          // investigate whether the next device data point is outside of a reasonable time connection window. seems like greater than 2 hours is pretty obvious.
          let t2 = d3.isoParse(deviceData[i + 1]._time);
          let t1 = d3.isoParse(deviceData[i]._time);
          // dif is normall in ms so convert by  /(1000*60*60) would be hours
          let dif = t2 - t1;
          if (dif / (1000 * 60 * 60) > 4) {
            return 5;
          } else {
            return ob.brushableXScale(t2) - ob.brushableXScale(t1);
          }
        })
        .attr("height", ob.brushableYScale.bandwidth())
        .attr("fill", ob.deviceScheme(device))
        .attr("opacity", 0.7);
    }
    let data = [
      [ob.maxTextWidth, 0],
      [ob.brushableXScale.range()[1] + ob.maxTextWidth, 0]
    ];
    let line = d3
      .line()
      .x(d => {
        return d[0];
      })
      .y(d => {
        return d[1];
      });
    ob.cursorLine = ob.brushSvg
      .append("path")
      .datum(data)
      .attr("id", "brushCursorLine")
      .attr("stroke", "black")
      .attr("d", line);
    ob.cursorLine.lower();

    // brush steps
    // create a brush
    // define functions for start and brushed
    // extent is the possible canvas that can be brushed
    ob.brush = d3
      .brushX()
      .on("end", ob.brushEnd)
      .extent([
        [0, ob.brushableDimensions.margin],
        [ob.brushableDimensions.innerwidth, ob.brushableDimensions.height]
      ]);
    // create a g element, and define a class for the brush
    ob.gbrush = ob.blocksG.append("g").attr("class", "gBrush");
    // call the brush constructor with .call
    ob.gbrush.call(ob.brush);
    // make a couple of horizontal lines that show which data is in which rows
    const svgContainerPad = document
      .querySelector("#brushable")
      .getBoundingClientRect().top;
    // make the 2 lines off by a bandWidth amount
    ob.brushSvg.on("mousemove", function() {
      // calculate the y coordinate, and figure out which rows its in between
      const ypos = d3.event.pageY - svgContainerPad;
      // calculate y below and above the mouse
      // little formula to get the lines above and below using the banded scale
      // get pos of firstline
      ob.cursorLine.attr("transform", `translate(0,${ypos})`);
    });
  })
</script>

<div id="brushableHolder" />
