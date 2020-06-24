<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import {
    wifiData,
    timeSelected,
    allDevices,
    daySelected,
    timeBounds
  } from "./store.js";
  // make brushable dimensions element, set this from the view that can query size of other elements on screen
  export let dims;
  onMount(() => {
    // setup, and there may be reason to update some variables that are declared
    let userData,svg,
      times,
      buildings,
      devices,
      xscale,
      yscale,
      brushXAxis,
      brushXAxisG,
      blocksG,
      brush,
      gbrush,
      t1,
      t2;
    let initialize = () => {
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
          devices[entry["EndPointMatchedProfile"]] = { checked: true };
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
      // include the vertical lines at the day intervals
        let start = xscale.domain()[0]
        // truncate start back to beginning of day
        start.setHours(0)
        start.setMinutes(0)
        start.setSeconds(0)
        let end = xscale.domain()[1]
        let current = new Date(start.getTime())
        for (let i = 0;;i++) {
            let pathData =[[xscale(current),0],[xscale(current),yscale.range()[1]]]
            let lineGenerator = d3.line()
            .x(d=> d[0])
            .y(d=> d[1])
            blocksG.append("path")
              .datum(pathData)
              .attr("stroke","red")
              .attr("d",lineGenerator)
            current.setMinutes(current.getMinutes() + 60*24)
            if (current > end) {
                break
            }

        }
      // brush steps
      //define a brush event
      function brushEnd() {
        const ext = d3.brushSelection(this);
        t1 = xscale.invert(ext[0]);
        t2 = xscale.invert(ext[1]);
        // update data shown for the graph, but make it clear that this is not supposed to update the brushable area
        let timeBoundedData = [];
        for (let entry of userData) {
          let etime = d3.isoParse(entry._time);
          if (etime > t1 && etime < t2) {
            timeBoundedData.push(entry);
          }
        }
        // update the map data
        wifiData.set({ type: "brushupdate", data: timeBoundedData });
      }
      // create a brush
      // define functions for start and brushed
      // extent is the possible canvas that can be brushed
      brush = d3
        .brushX()
        .on("end", brushEnd)
        .on("brush", brushEnd)
        .extent([
          [0, 0],
          [dims.width - dims.margin, dims.height - dims.margin]
        ]);
      // create a g element, and define a class for the brush
      gbrush = blocksG.append("g").attr("class", "gBrush");
      gbrush.call(brush);
      // call the brush constructor with .call
      redraw();
    };

    let redraw = () => {
      // make the small blocks
      blocksG
        .selectAll("rect")
        .data(userData, d => d._time)
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
      gbrush.call(brush);
    };
    let unsubscribe = wifiData.subscribe(data => {
      if (svg == undefined) {
        userData = data
        initialize();
      } else {
        // do redraw
        if (data.type != undefined) {
          // this is a brush based update
          console.log("brush updated the data");
        } else {
          // see if we have brush and alter the data
          if (t1 != undefined) {
            let timeBoundedData = [];
            for (let entry of data) {
              let etime = d3.isoParse(entry._time);
              if (etime > t1 && etime < t2) {
                timeBoundedData.push(entry);
              }
            }
            wifiData.set({type:"brush",data:timeBoundedData})
          }
          userData = data
          redraw();
        }
      }
      // connect redraw to this
    });
    let unsubDaySelected = daySelected.subscribe(day => {
      // update the brush
      if (day != 0) {
        console.log("updating brush");
        let nextDay = new Date(day.getTime());
        nextDay.setMinutes(nextDay.getMinutes() + 60 * 24);
        // invert xscale and get the positions of day and day + 24 hours
        let dayX = xscale(day);
        let nextDayX = xscale(nextDay);
        gbrush.call(brush.move, [dayX, nextDayX]);
        // triggers the brushEnd event
      }
    });
  });
</script>

<div id="brushableHolder" />
