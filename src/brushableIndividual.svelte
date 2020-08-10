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
    let userData,
      svg,
      times,
      buildings,
      devices,
      ogXscale,
      xscale,
      zoom,
      yscale,
      brushXAxis,
      brushXAxisG,
      blocksG,
      brush,
      gbrush,
      t1,
      t2;

    let calcWidth = d => {
      let start = d3.isoParse(d._time);
      let duration = d.niceDuration.split(":").map(e => parseInt(e));
      // if duration is 0 show it as a 1 minute section so its detectable in brush region
      if (duration.reduce((a, b) => a + b, 0) == 0) {
        start.setSeconds(start.getSeconds() + 1);
      } else {
        start.setMinutes(start.getMinutes() + duration[1]);
        start.setSeconds(start.getSeconds() + duration[2]);
        start.setHours(start.getHours() + duration[0]);
      }
      return start;
    };
    function zoomed(e) {
      let rescalex = d3.event.transform.rescaleX(ogXscale);
      xscale = rescalex
      // redraw the contents of the graph, do I also need to change the brush?
      brushXAxis.scale(rescalex);
      brushXAxisG.call(brushXAxis);
      redraw();
    }
    let initialize = () => {
      //scaleExtent controls min and max scale factor
      // translate controls the possible translation , extent is [[x0,y0],[x1,y1]] where the first corresponds  to the top left, and the second the bottom right
      // mostly makes it so you don't pan out of data realm
      zoom = d3
        .zoom()
        .scaleExtent([.8, 20])
        .on("zoom", zoomed);
      svg = d3
        .select("#brushableHolder")
        .append("svg")
        .attr("width", dims.width)
        .attr("height", dims.height);
      svg.call(zoom);
      times = [];
      buildings = [];
      devices = {};
      for (let entry of userData) {
        times.push(d3.isoParse(entry._time));
        if (buildings.indexOf(entry.apBuildingNumber) == -1) {
          buildings.push(entry.apBuildingNumber);
        }
        if (devices[entry["deviceType"]] == undefined) {
          devices[entry["deviceType"]] = { checked: true };
        }
      }
      let last_time = new Date(d3.max(times).getTime());
      last_time.setSeconds(last_time.getSeconds() + 5 * 60);
      // create the xscale that handles time

      xscale = d3
        .scaleTime()
        .domain([d3.min(times), last_time])
        .range([0, dims.width - dims.margin]);
        // allows us to make changes to xscale for everywhere else, except the zoom baseline
      ogXscale = xscale.copy()
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
      // make cursor into pointer on ticks to indicate drag options
      d3.selectAll(".tick").style("cursor","pointer")
      blocksG = svg
        .append("g")
        .attr("transform", `translate(${dims.margin},${dims.margin})`);

      // brush steps
      //define a brush event
      function brushEnd() {
        const ext = d3.brushSelection(this);
        t1 = xscale.invert(ext[0]);
        t2 = xscale.invert(ext[1]);
        // update data shown for the graph, but make it clear that this is not supposed to update the brushable area
        let timeBoundedData = [];
        for (let entry of userData) {
          // 8 cases, TODO this can probably be condensed
          let st = d3.isoParse(entry._time);
          // think about the 0 duration entries?
          let end = calcWidth(entry);
          //replace the st and ends in the entry at the end
          // copy so that we don't accidentally mess up any original data
          let resEntry = { ...entry };
          if (st < t1) {
            resEntry._time = t1.getTime();
            if (end < t2 && end > t1) {
              // substitute the extent for the start because its out of brushable region
              // remove as much time from the end as nec to calculate correct nice duration again
              let delta = end.getTime() - t1.getTime();
              resEntry.niceDuration = `${Math.floor(
                delta / (1000 * 60 * 60)
              )}:${Math.floor((delta / (1000 * 60)) % 60)}:${Math.floor(
                (delta / 1000) % 60
              )}`;
              timeBoundedData.push(resEntry);
            } else if (end > t2) {
              // delta is duration in ms
              let delta = t2.getTime() - t1.getTime();
              resEntry.niceDuration = `${Math.floor(
                delta / (1000 * 60 * 60)
              )}:${Math.floor((delta / (1000 * 60)) % 60)}:${Math.floor(
                (delta / 1000) % 60
              )}`;
              timeBoundedData.push(resEntry);
            }
          } else if (st < t2 && st > t1) {
            //assumption isend is greater than t1 since end > st, so not writing it
            if (end < t1) {
              console.error("data problem with end", end, "check calcwidth");
              continue;
            }
            if (end < t2) {
              // substitute the extent for the start because its out of brushable region
              // don't modify duration
              if (resEntry.niceDuration.match(/16/)) {
                console.log(resEntry.niceDuration);
              }
              timeBoundedData.push(resEntry);
            } else if (end > t2) {
              // delta is duration in ms
              let delta = t2.getTime() - st.getTime();
              resEntry.niceDuration = `${Math.floor(
                delta / (1000 * 60 * 60)
              )}:${Math.floor((delta / (1000 * 60)) % 60)}:${Math.floor(
                (delta / 1000) % 60
              )}`;
              timeBoundedData.push(resEntry);
            }
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
      redraw(xscale);
    };
    let redraw = () => {
      // include the vertical lines at the day intervals
      let start = xscale.domain()[0];
      // truncate start back to beginning of day
      start.setHours(0);
      start.setMinutes(0);
      start.setSeconds(0);
      let end = xscale.domain()[1];
      let current = new Date(start.getTime());
      d3.selectAll(".vertDayMark").remove();
      for (let i = 0; ; i++) {
        let pathData = [
          [xscale(current), 0],
          [xscale(current), yscale.range()[1]]
        ];
        let lineGenerator = d3
          .line()
          .x(d => d[0])
          .y(d => d[1]);
        blocksG
          .append("path")
          .datum(pathData)
          .attr("stroke", "red")
          .attr("class", "vertDayMark")
          .attr("d", lineGenerator);
        current.setMinutes(current.getMinutes() + 60 * 24);
        if (current > end) {
          break;
        }
      }
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
              .attr("width", d => {
                return xscale(calcWidth(d)) - xscale(d._time);
              }),
          update =>
            update
              .attr("x", d => xscale(d3.isoParse(d._time)))
              .attr("width", d => {
                return xscale(calcWidth(d)) - xscale(d._time);
              }),
          exit => exit.remove()
        );
      gbrush.call(brush);
    };
    let unsubscribe = wifiData.subscribe(data => {
      if (data != null) {
        if (svg == undefined) {
          userData = data;
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
              wifiData.set({ type: "brush", data: timeBoundedData });
            }
            userData = data;
            redraw();
          }
        }
      }
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

<div id="brushableHolder">
  <p>Drag To Select Time:</p>
</div>
