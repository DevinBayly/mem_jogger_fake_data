import * as d3 from "d3"
export let gantBase = (data, buildingReferences) => {
    let ob = {}
    console.log("making gantBase");

    ob.dimensions = {
        width: 4500,
        height: 1500,
        margin: 20,
    }
    ob.calcWapID = (e) => {
        let buildingName = ob.buildingNumNameMap[e.apBuildingNumber]
        let wapID = `${buildingName} ${e.apRoomNumber} ${e.apDescription}`
        return wapID
    }
    ob.setup = () => {
        console.log("setting up");

        ob.data = data
        // get an array of the building names, and their other info
        ob.buildings = []
        ob.times = []
        ob.buildingNumNameMap = {}
        buildingReferences.map(e => {
            ob.buildingNumNameMap[e.Alpha] = e.Name
        })
        for (let entry of ob.data) {
            let wapID = ob.calcWapID(entry)
            if (ob.buildings.indexOf(wapID) == -1) {
                ob.buildings.push(wapID)
            }
            ob.times.push(d3.isoParse(entry._time))
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
            .range([0, ob.dimensions.width - ob.dimensions.margin - ob.maxText])
        // calculate length of title
    }
    ob.run = () => {
        console.log("running");

        ob.svg = d3.select("svg")
        ob.svg.attr("width", ob.dimensions.width)
            .attr("height", ob.dimensions.width)
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
        // lines
        for (let i = 0; i < ob.buildings.length + 1; i++) {
            //
            let linedata = [{ x: 0, y: i }, { x: ob.dimensions.width, y: i }]
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
        // make the bottom line

        // actual data in blocks
        ob.datagroup = ob.svg.append("g")
            .attr("transform", `translate(${ob.maxText},0)`)
        ob.occupancyBlocks = ob.datagroup.selectAll("rect").data(ob.data).enter().append("rect")
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

    }
    return ob
}