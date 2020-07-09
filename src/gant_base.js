import * as d3 from "d3"
import legend from "d3-svg-legend"
export let gantBase = (data, buildingReferences) => {
    let ob = {}
    ob.deviceScheme = d3.scaleOrdinal(d3.schemePaired)
    ob.data = data
    // later on these are not the same
    ob.mutableData = data
    console.log("making gantBase");
    const outerMargin = 20
    ob.dimensions = {
        width: window.innerWidth - outerMargin,
        height: 900,
        topMargin: 2,
        margin: 20,
    }

    ob.calcWapID = (e) => {
        let buildingName = ob.buildingNumNameMap[e.apBuildingNumber]
        if (buildingName == undefined) {
            console.log("missing pair ", e.apBuildingNumber)
        }
        let wapID = `${buildingName} ${e.apRoomNumber}`
        return wapID
    }
    ob.brushStart = function () {
        console.log("brush starting")
    }
    ob.brushEnd = function () {
        // filter the existing data, trigger the update process for visualization
        const ext = d3.brushSelection(this)
        // convert brush coordinates into dates
        const t1 = ob.brushableXScale.invert(ext[0])
        const t2 = ob.brushableXScale.invert(ext[1])
        ob.mutableData = []
        for (let e of ob.data) {
            // see if it passes brush filter, if so put in mutable data
            const timeE = d3.isoParse(e._time)
            if (timeE > t1 && timeE < t2) {
                ob.mutableData.push(e)
            }
        }
        // convert back from extents to top graph screen dimensions
        // xaxis is the same
        // remove the entire top graph and start over
        ob.redoSetup()
        ob.reRun()
    }
    ob.compare = (a, b) => {
        if (ob.buildingOrder.indexOf(a) > ob.buildingOrder.indexOf(b)) {
            return 1
        }
        if (ob.buildingOrder.indexOf(a) == ob.buildingOrder.indexOf(b)) {
            return 0
        }
        return -1
    }
    ob.compareCounts = (a, b) => {
        if (ob.buildingOccurences[a] > ob.buildingOccurences[b]) {
            return -1
        }
        return 1
    }
    ob.initialSetup = () => {
        // used in calculating the order of buildings for column
        ob.buildingOccurences = {}
        // get an array of the building names, and their other info
        ob.buildings = []
        // map between the building numbers and names people recognize
        ob.buildingNumNameMap = {}
        buildingReferences.map(e => {
            ob.buildingNumNameMap[e.Alpha] = e.Name
        })
        ob.uniqueDevices = []
        for (let entry of ob.data) {
            let wapID = ob.calcWapID(entry)

            if (ob.uniqueDevices.indexOf(entry["deviceType"]) == -1) {
                ob.uniqueDevices.push(entry["deviceType"])
            }
            if (ob.buildings.indexOf(wapID) == -1) {
                ob.buildings.push(wapID)
                ob.buildingOccurences[wapID] = 0
            }
            ob.buildingOccurences[wapID] += 1
        }
        ob.maxTextWidth = 0
        for (let buildingString of ob.buildings) {
            let p = document.createElement("p")
            p.style.display = "hidden"
            p.innerHTML = buildingString
            p.style.position = "absolute"
            p.style.top = 0
            p.className = "b-name"
            document.body.append(p)
            let width = p.getBoundingClientRect().width
            if (width > ob.maxTextWidth) {
                ob.maxTextWidth = width
            }
            p.remove()
        }
        // sort the buildings according to their occurences from most frequent to least
        ob.buildings.sort(ob.compareCounts)


        // create a y scale with banding for spacing control
        ob.yscale = d3.scaleBand()
            .domain(d3.range(ob.buildings.length))
            .range([0, ob.dimensions.height - ob.dimensions.margin])
        // add 5minutes to the final time
        // !! doc this
        ob.redoSetup()
    }
    ob.redoSetup = () => {

        console.log("setting up");

        // use this for calculating the Xscale
        ob.times = []
        ob.devices = {}
        for (let device of ob.uniqueDevices) {
            ob.devices[device] = []
        }
        for (let entry of ob.mutableData) {
            ob.devices[entry["deviceType"]].push(entry)
            ob.times.push(d3.isoParse(entry._time))
        }
        let last_time = new Date(d3.max(ob.times).getTime())
        // Todo make last time the greatest time plus its duration
        last_time.setSeconds(last_time.getSeconds() + 5 * 60)
        // create the xscale that handles time 
        if (ob.xscale == undefined) {
            ob.xscale = d3.scaleTime()
        }
        ob.xscale
            .domain([
                d3.min(ob.times),
                last_time
            ])
            .range([0, ob.dimensions.width - ob.dimensions.margin * 2 - ob.maxTextWidth])
        // calculate length of title
    }

    ob.run = () => {
        console.log("running");

        ob.svg = d3.select("#main")
        ob.svg.attr("width", ob.dimensions.width)
            .attr("height", ob.dimensions.height)
        ob.lAxisGroup = ob.svg.append("g")
        ob.Leftaxis = ob.lAxisGroup.selectAll("rect").data(ob.buildings).enter().append("rect")
        ob.Leftaxis
            .attr("y", (d, i) => {
                return ob.yscale(i)
            })
            .attr("x", 0)
            .attr("width", ob.maxTextWidth)
            .attr("height", ob.yscale.bandwidth())
            .attr("fill", "white")
            .attr("stroke", "black")
        ob.BuildingText = ob.lAxisGroup.selectAll("text").data(ob.buildings).enter().append("text")
            .attr("x", ob.maxTextWidth / 2)
            .attr("y", (d, i) => {
                return ob.yscale(i) + ob.yscale.bandwidth() / 2 // decide on inner margin
            })
            .attr("class", "b-name")
            .text(d => d)

        // actual data in blocks
        ob.datagroup = ob.svg.append("g")
            .attr("transform", `translate(${ob.maxTextWidth},0)`)
        // mouse interaction
        // add a rect in the back that mouse event can trigger on
        ob.dataBackground = ob.datagroup.append("rect")
            .attr("id", "background")
            .attr("transform",`translate(0,20)`)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", ob.dimensions.width - ob.dimensions.margin * 2 - ob.maxTextWidth)
            .attr("height", ob.dimensions.height - ob.dimensions.margin * 2)


        // making the full scale viewer at the bottom
        ob.xAxis = d3.axisTop(ob.xscale)
            .tickPadding(0)
        //
        ob.topAxisHeight = 40
        ob.upperAxisSvg = d3.select("#topaxis")
            .attr("width", ob.dimensions.width)
            .attr("height", ob.topAxisHeight)
        ob.xAxisElement = ob.upperAxisSvg.append("g")
            .attr("class", "top-xaxis")
            .attr("transform", `translate(${ob.maxTextWidth},${ob.topAxisHeight - 1})`) // keeps the bottom line of the axis visible
            .call(ob.xAxis)
        // draw vertical line with time info on it
        ob.vertLineGenerator = d3.line()
            .x((d) => {
                return d.x
            })
            .y((d) => {
                return d.y
            })
        // calculate from left padding 
        const svgContainerPad = { left: document.querySelector("svg").getBoundingClientRect().left, top: document.querySelector("svg").getBoundingClientRect().top }
        ob.mouseTooltip = d3.select("#tooltipHolder")
        ob.tooltipText = d3.select("#tipText")
        // consider on touch also, because of touch screens
        ob.datagroup.on("mousemove", function () {
            // should we use transform translation instead of removing and redrawing line? 
            if (ob.verticalMouseLine) {
                ob.verticalMouseLine.remove()
            }
            // use d3 event to get mouse positions
            let xpos = d3.event.pageX - ob.maxTextWidth - svgContainerPad.left
            const ypos = d3.event.pageY - svgContainerPad.top
            ob.verticalMouseLine = ob.datagroup.append("path")
                // don't forget to subtract whatever padding has been applied to the container of the svg
                .datum([{ x: xpos, y: ob.yscale(0) }, { x: xpos, y: ob.yscale(ob.buildings.length-1) }])
                .attr("class", "vertmouseline")
                .attr("d", ob.vertLineGenerator)
            ob.mouseTooltip.style("left", () => {
                // to prevent the tooltip from going into the building names on the left
                // TODO come up with more accurate shift based on width of tooltip and position of line
                if (xpos + ob.maxTextWidth + 200> ob.xscale.range()[1]) {
                    return xpos + ob.maxTextWidth - 200 + "px"
                }
                return xpos + ob.maxTextWidth + "px"
            }).style("top", (ypos + 20) +  "px")
            ob.tooltipText.text(() => { return ob.xscale.invert(xpos) })

        })

        // horizontal lines
        const start = ob.yscale(0)
        for (let i = 0; i < ob.buildings.length + 1; i++) {
            //
            let linedata = [{ x: 0, y: i }, { x: ob.dimensions.width - ob.dimensions.margin * 2, y: i }]
            ob.lineGenerator = d3.line()
                .x((d) => {
                    return d.x
                })
                .y((d) => {
                    return d.y*ob.yscale.bandwidth()+start
                })
            ob.lines = ob.lAxisGroup.append("path")
                .datum(linedata)
                .attr("class", "horizontalline")
                .attr("d", ob.lineGenerator)

        }
        // do first actual draw of data
        ob.reRun()
    }
    ob.setupBottom = () => {

        ob.brushableDimensions = {
            width: window.innerWidth - outerMargin, // 500 being for the legend width
            height: 200,
            margin: 20

        }
        // subtract for both dimensions, and the building text column size 
        ob.brushableDimensions.innerwidth = ob.brushableDimensions.width
        ob.brushableDimensions.innerheight = ob.brushableDimensions.height - ob.brushableDimensions.margin * 2
        ob.brushSvg = d3.select("#brushable")
            .attr("width", ob.brushableDimensions.innerwidth)
            .attr("height", ob.brushableDimensions.innerheight)
        // set topgraph height so we can see all the data even with the bottom graph fixed to the screen
    }
    ob.reRun = () => {
        // update the xscales
        ob.xAxisElement.transition().call(ob.xAxis)
        // split this by device 
        for (let device in ob.devices) {
            let deviceData = ob.devices[device]
            console.log("device", device, "data", deviceData)
            ob.occupancyBlocks = ob.datagroup.selectAll(`.dataElement${device}`).data(deviceData, function (d) {
                return d._time + d.deviceType + d.apRoomNumber
            })
            let timeParser = d3.timeParse("%H:%M:%S")
            let widthCalc = (d) => {
                // calc new point in time that is the start plus the duration
                let start = d3.isoParse(d._time)
                let durationDate = timeParser(d.niceDuration)
                start.setHours(start.getHours() + durationDate.getHours())
                start.setMinutes(start.getMinutes() + durationDate.getMinutes())
                start.setSeconds(start.getSeconds() + durationDate.getSeconds())
                return start
            }
            ob.occupancyBlocks.join(
                enter => enter.append("rect")
                    .attr("x", (d) => {
                        return 0
                    })
                    .attr("class", `dataElement${device}`)
                    .attr("y", d => {
                        let wapID = ob.calcWapID(d)
                        let i = ob.buildings.indexOf(wapID)
                        return ob.yscale(i)
                    })
                    .attr("width",d=> ob.xscale(widthCalc(d))-ob.xscale(d._time))
                    .attr("height", ob.yscale.bandwidth())
                    .attr("fill", ob.deviceScheme(device))
                    .call(enter => enter.transition().attr("x", d => ob.xscale(d3.isoParse(d._time)))),
                update => update.call(update => update.transition()
                    .attr("width",d=> ob.xscale(widthCalc(d))-ob.xscale(d._time))
                    .attr("x", d => ob.xscale(d3.isoParse(d._time)))
                ),
                exit => exit.call(exit => exit.transition().attr("x", 0).remove())
            )
        }
    }
    ob.generateBrush = () => {
        // calculate the space left to make the brushable region
        d3.select("#topgraph").style("height", document.querySelector("#bottomgraph").getBoundingClientRect().top + "px")
        // make a copy while the data is still for the global view
        ob.brushableXScale = ob.xscale.copy()
        // make the final range larger so it covers the entire bottom of page
        ob.brushableXScale.range([0, ob.brushableDimensions.innerwidth - ob.brushableDimensions.margin * 2 - ob.maxTextWidth])
        // make all the same rectangles but with different ydims
        ob.brushableYScale = d3.scaleBand()
            .domain(d3.range(ob.buildings.length + 1))
            .range([ob.brushableDimensions.margin, ob.brushableDimensions.innerheight])
            .round(true)
        // make a label axis for bottom chart
        ob.brushXAxis = d3.axisTop(ob.brushableXScale).tickPadding(0)
        ob.brushXAxisG = ob.brushSvg.append("g").attr("class", "brushAxis").attr("transform", `translate(${ob.maxTextWidth},${ob.brushableDimensions.margin})`).call(ob.brushXAxis)
        ob.blocksG = ob.brushSvg.append("g").attr("transform", `translate(${ob.maxTextWidth},0)`)
        // split this by device 
        for (let device in ob.devices) {
            let deviceData = ob.devices[device]
            console.log("device", device, "data", deviceData)
            ob.occupancyBlocks = ob.blocksG.selectAll(".dataElement").data(deviceData, function (d) {
                return d._time
            }).enter().append("rect")
            ob.occupancyBlocks
                .attr("x", (d) => {
                    return ob.brushableXScale(d3.isoParse(d._time))
                })
                .attr("y", d => {
                    let wapID = ob.calcWapID(d)
                    let i = ob.buildings.indexOf(wapID)
                    return ob.brushableYScale(i)
                })
                .attr("width", (d, i) => {
                    // TODO figure out how to convey the lack of confidence about certain end times
                    if (i + 1 == deviceData.length) {
                        let time_end = d3.isoParse(deviceData[i]._time)
                        time_end = time_end.setSeconds(time_end.getSeconds() + 5 * 60)
                        return ob.brushableXScale(time_end) - ob.brushableXScale(d3.isoParse(deviceData[i]._time))
                    }
                    // investigate whether the next device data point is outside of a reasonable time connection window. seems like greater than 2 hours is pretty obvious.
                    let t2 = d3.isoParse(deviceData[i + 1]._time)
                    let t1 = d3.isoParse(deviceData[i]._time)
                    // dif is normall in ms so convert by  /(1000*60*60) would be hours
                    let dif = t2 - t1
                    if (dif / (1000 * 60 * 60) > 4) {
                        return 5
                    } else {
                        return ob.brushableXScale(t2) - ob.brushableXScale(t1)
                    }
                })
                .attr("height", ob.brushableYScale.bandwidth())
                .attr("fill", ob.deviceScheme(device))
        }
            let data = [[ob.maxTextWidth, 0], [ob.brushableXScale.range()[1]+ob.maxTextWidth, 0]]
            let line = d3.line()
                .x(d => {
                    return d[0]
                })
                .y(d => {
                    return d[1]
                })
        ob.cursorLine = ob.brushSvg.append("path")
                .datum(data)
                .attr("id","brushCursorLine")
                .attr("stroke", "black")
                .attr("d", line)
        ob.cursorLine.lower()

        // brush steps
        // create a brush
        // define functions for start and brushed
        // extent is the possible canvas that can be brushed
        ob.brush = d3.brushX()
            .on("end", ob.brushEnd)
            .extent([
                [0, ob.brushableDimensions.margin],
                [ob.brushableDimensions.innerwidth, ob.brushableDimensions.height]
            ])
        // create a g element, and define a class for the brush
        ob.gbrush = ob.blocksG.append("g").attr("class", "gBrush")
        // call the brush constructor with .call
        ob.gbrush.call(ob.brush)
        // make a couple of horizontal lines that show which data is in which rows
        const svgContainerPad = document.querySelector("#brushable").getBoundingClientRect().top
        // make the 2 lines off by a bandWidth amount
        ob.brushSvg.on("mousemove", function () {
            // calculate the y coordinate, and figure out which rows its in between 
            const ypos = d3.event.pageY - svgContainerPad
            // calculate y below and above the mouse
            // little formula to get the lines above and below using the banded scale
            // get pos of firstline
            ob.cursorLine.attr("transform",`translate(0,${ypos })`)
        })
}
ob.makeLegend = () => {
    // create the legend from the devices in the data 
    ob.legendSvg = d3.select("#legend")
    ob.legend = legend.legendColor().shapeWidth(20).shapeHeight(20).orient("vertical").labelOffset(20).scale(ob.deviceScheme)
    ob.legendG = ob.brushSvg.append("g").attr("id", "legendG").attr("class", "deviceLegend").call(ob.legend)
    ob.legendWidth = ob.legendG.node().getBoundingClientRect().width
}

return ob
}