import * as d3 from "d3"
export let gantBase = (data, buildingReferences) => {
    let ob = {}
    ob.data = data
    // later on these are not the same
    ob.mutableData = data
    console.log("making gantBase");
    const outerMargin = 20
    ob.dimensions = {
        width: window.innerWidth-outerMargin,
        height: window.innerHeight,
        margin: 20,
    }

    ob.calcWapID = (e) => {
        let buildingName = ob.buildingNumNameMap[e.apBuildingNumber]
        if (buildingName == undefined) {
            console.log("missing pair ",e.apBuildingNumber)
        }
        let wapID = `${buildingName} ${e.apRoomNumber} ${e.apDescription}`
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
        d3.select("#top").remove()
        d3.select("#topgraph").append("svg").attr("id", "top")
        ob.setup()
        ob.run()
    }
    ob.compare =(a,b)=> {
        if (ob.buildingOrder.indexOf(a)> ob.buildingOrder.indexOf(b)) {
            return 1
        }
        if (ob.buildingOrder.indexOf(a) == ob.buildingOrder.indexOf(b)) {
            return 0
        }
        return -1
    }
    ob.setup = () => {
        console.log("setting up");

        // get an array of the building names, and their other info
        ob.buildings = []
        ob.times = []
        ob.buildingNumNameMap = {}
        buildingReferences.map(e => {
            ob.buildingNumNameMap[e.Alpha] = e.Name
        })
        for (let entry of ob.mutableData) {
            let wapID = ob.calcWapID(entry)

            if (ob.buildings.indexOf(wapID) == -1) {
                ob.buildings.push(wapID)
            }
            ob.times.push(d3.isoParse(entry._time))
        }
        // create constant building order to use going forward
        if (ob.buildingOrder == undefined) {
            ob.buildingOrder = ob.buildings
        } else {
            // change order of buildings so that column is correct order each time
            ob.buildings.sort(ob.compare)
        }
        ob.maxText = 0
        for (let buildingString of ob.buildings) {
            let p = document.createElement("p")
            p.style.display = "hidden"
            p.innerHTML = buildingString
            p.style.position = "absolute"
            p.style.top = 0
            p.className = "b-name"
            document.body.append(p)
            let width = p.getBoundingClientRect().width
            if (width > ob.maxText) {
                ob.maxText = width
            }
            p.remove()
        }

        // create a y scale with banding for spacing control
        ob.yscale = d3.scaleBand()
            .domain(d3.range(ob.buildings.length + 1))
            .range([ob.dimensions.margin, ob.dimensions.height - ob.dimensions.margin])
            .round(true)
        // create the xscale that handles time 
        ob.xscale = d3.scaleTime()
            .domain([
                d3.min(ob.times),
                d3.max(ob.times)
            ])
            .range([0, ob.dimensions.width - ob.dimensions.margin*2 - ob.maxText])
        // calculate length of title
    }

    ob.run = () => {
        console.log("running");

        ob.svg = d3.select("svg")
        ob.svg.attr("width", ob.dimensions.width )
            .attr("height", ob.dimensions.height)
        ob.lAxisGroup = ob.svg.append("g")
        ob.Leftaxis = ob.lAxisGroup.selectAll("rect").data(ob.buildings).enter().append("rect")
        ob.Leftaxis
            .attr("y", (d, i) => {
                return ob.yscale(i)
            })
            .attr("x", 0)
            .attr("width", ob.maxText)
            .attr("height", ob.yscale.bandwidth())
            .attr("fill", "white")
            .attr("stroke", "black")
        ob.BuildingText = ob.lAxisGroup.selectAll("text").data(ob.buildings).enter().append("text")
            .attr("x", ob.maxText / 2)
            .attr("y", (d, i) => {
                return ob.yscale(i) + ob.yscale.bandwidth() / 2 // decide on inner margin
            })
            .attr("class", "b-name")
            .text(d => d)

        // actual data in blocks
        ob.datagroup = ob.svg.append("g")
            .attr("transform", `translate(${ob.maxText},0)`)
        // mouse interaction
        // add a rect in the back that mouse event can trigger on
        ob.dataBackground = ob.datagroup.append("rect")
            .attr("id", "background")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", ob.dimensions.width - ob.dimensions.margin*2- ob.maxText)
            .attr("height", ob.dimensions.height - ob.dimensions.margin*2)


        // making the full scale viewer at the bottom
        ob.xAxis = d3.axisTop(ob.xscale)
            .tickPadding(0)
        ob.xAxisElement = ob.svg.append("g")
            .attr("class", "top-xaxis")
            .attr("transform", `translate(${ob.maxText},${ob.yscale(0)})`)
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
            let xpos = d3.event.pageX - ob.maxText - svgContainerPad.left
            const ypos = d3.event.pageY - svgContainerPad.top
            ob.verticalMouseLine = ob.datagroup.append("path")
                // don't forget to subtract whatever padding has been applied to the container of the svg
                .datum([{ x: xpos, y: ob.yscale(0) }, { x: xpos, y: ob.yscale(ob.buildings.length) }])
                .attr("class", "vertmouseline")
                .attr("d", ob.vertLineGenerator)
            ob.mouseTooltip.style("left", () => {
                // to prevent the tooltip from going into the building names on the left
                // TODO come up with more accurate shift based on width of tooltip and position of line
                if (xpos < 200) {
                    return (xpos + 220) + "px"
                }
                return xpos - 20 + "px"
            }).style("top", ypos + "px")
            ob.tooltipText.text(() => { return ob.xscale.invert(xpos) })

        })
        // 
        ob.occupancyBlocks = ob.datagroup.selectAll("rect").data(ob.mutableData).enter().append("rect")
        ob.occupancyBlocks
            .attr("x", (d, i) => {
                return ob.xscale(ob.times[i])
            })
            .attr("y", d => {
                let wapID = ob.calcWapID(d)
                let i = ob.buildings.indexOf(wapID)
                return ob.yscale(i)
            })
            .attr("width", (d, i) => {
                return ob.xscale(ob.times[i + 1]) - ob.xscale(ob.times[i])
            })
            .attr("height", ob.yscale.bandwidth())
            .attr("fill", "black")
        // lines
        for (let i = 0; i < ob.buildings.length + 1; i++) {
            //
            let linedata = [{ x: 0, y: i }, { x: ob.dimensions.width - ob.dimensions.margin*2, y: i }]
            ob.lineGenerator = d3.line()
                .x((d) => {
                    return d.x
                })
                .y((d) => {
                    return ob.yscale(d.y)
                })
            ob.lines = ob.lAxisGroup.append("path")
                .datum(linedata)
                .attr("class", "horizontalline")
                .attr("d", ob.lineGenerator)

        }
    }
    ob.generateBrush = () => {
        ob.brushableDimensions = {
            width: window.innerWidth - outerMargin,
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

        d3.select("#topgraph").style("height", document.querySelector("#bottomgraph").getBoundingClientRect().top + "px" )
        // make a copy while the data is still for the global view
        ob.brushableXScale = ob.xscale.copy()
        // make the final range larger so it covers the entire bottom of page
        ob.brushableXScale.range([0,ob.brushableDimensions.innerwidth - ob.brushableDimensions.margin*2])
        // make all the same rectangles but with different ydims
        ob.brushableYScale = d3.scaleBand()
            .domain(d3.range(ob.buildings.length + 1))
            .range([ob.brushableDimensions.margin, ob.brushableDimensions.innerheight])
            .round(true)
        // make a label axis for bottom chart
        ob.brushXAxis = d3.axisTop(ob.brushableXScale).tickPadding(0)
        ob.brushXAxisG = ob.brushSvg.append("g").attr("class","brushAxis").attr("transform",`translate(0,${ob.brushableDimensions.margin})`).call(ob.brushXAxis)

        ob.brushRects = ob.brushSvg.selectAll("rect").data(ob.data).enter().append("rect")
            .attr("x", (d, i) => {
                return ob.brushableXScale(ob.times[i])
            })
            .attr("y", d => {
                let wapID = ob.calcWapID(d)
                let i = ob.buildings.indexOf(wapID)
                return ob.brushableYScale(i)
            })
            .attr("width", (d, i) => {
                return ob.brushableXScale(ob.times[i + 1]) - ob.brushableXScale(ob.times[i])
            })
            .attr("height", ob.brushableYScale.bandwidth())
            .attr("fill", "black")

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
        ob.gbrush = ob.brushSvg.append("g").attr("class", "gBrush")
        ob.gbrush.call(ob.brush)
        // call the brush constructor with .call
    }

    return ob
}