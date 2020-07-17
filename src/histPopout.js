import * as d3 from "d3"
import { histogramData } from "./store.js"
export let histogram = (graphElement, building,dims) => {
    // 
    let ob = {}
    ob.init =()=> {
        console.log("initializing")
        ob.svg = d3.select(graphElement)
        
        console.log(ob.data)
        // this will need to become a timeScale
        ob.xscale = d3.scaleTime()
        .range([0,dims.width - dims.margin*2])
        ob.xscale.ticks(d3.timeMinute.every(1))
        ob.yscale = d3.scaleLinear()
        .range([dims.height - dims.margin*2,0])
        //create the axis
        ob.axisx = d3.axisBottom(ob.xscale) 
        ob.axisy = d3.axisLeft(ob.yscale) 
        //create the groups
        ob.yscale.ticks(3)
        ob.axisgx = ob.svg.append("g").attr("transform",`translate(${dims.margin},${dims.height - dims.margin})`)
        ob.axisgy = ob.svg.append("g").attr("transform",`translate(${dims.margin},${dims.margin})`)

        ob.histg = ob.svg.append("g").attr("transform",`translate(${dims.margin},${dims.margin})`)
    }
    ob.redraw = ()=> {
        console.log("redrawing")
        // could split out so not 2 maps
        let times =ob.data.map(e=> e.time)
        let minTime = new Date(d3.min(times).getTime())
        minTime.setMinutes(minTime.getMinutes() -1)
        let maxTime = new Date(d3.max(times).getTime())
        maxTime.setMinutes(maxTime.getMinutes() +1)
        ob.xscale.domain([minTime,maxTime])
        let counts = ob.data.map(e=>e.count)
        ob.yscale.domain([0,Math.max(...counts)])
        ob.axisgx.call(ob.axisx)
        .selectAll("text")
        .attr("y",0)
        .attr("x",9)
        .attr("transform","rotate(90)")
        .style("text-anchor","start")
        ob.axisgy.call(ob.axisy)
        ob.histg.selectAll("rect").data(ob.data,d=>{d.time}).join(
            enter=> enter
            .append("rect")
            .attr("width",2)
            .attr("x",d=> ob.xscale(d.time))
            .attr("y",d=> ob.yscale(d.count))
            .attr("height",d=> dims.height -2*dims.margin - ob.yscale(d.count))
            .attr("fill","black"),
            update=> update
            .attr("x",d=> ob.xscale(d.time))
            .attr("y",d=> ob.yscale(d.count))
            .attr("height",d=> dims.height -2*dims.margin - ob.yscale(d.count)),
            exit => exit.remove() 
        )

    }
    ob.unsubHist = histogramData.subscribe(allBuildings => {
        //filter out only this buildings info
        if (allBuildings != null) {
            ob.data = []
            //probably will become timestamps
            // start, remove this 
            let start = new Date()
            for (let key in allBuildings) {
                let minuteData = allBuildings[key]
                for (let buildingMinute of minuteData) {
                    //compare each building in the minute to the building we want to draw the hist for
                    if (buildingMinute.latestBuilding == building ) {
                        ob.data.push({time:new Date(start.getTime()),count:buildingMinute.count})
                        break
                    }
                }
                start.setMinutes(start.getMinutes() +1)
            }
            if (ob.svg == undefined) {
                //init
                ob.init()
            }
            ob.redraw()
        }

        //then call setup
        // then do updates
    })
    return ob
}
