<script>
import {histogram} from "./histPopout.js"
import {mapData} from "./store.js"
export let building,headCount,number,screen
//

let holder,svg,xIcon
import {onMount} from "svelte"
onMount(()=> {
    holder.style.left = screen.x + "px"
    holder.style.top = screen.y + "px"
    holder.style.width = svg.getBoundingClientRect().width + "px"
    // create the histogram
    histogram(svg,number,{width:svg.getBoundingClientRect().width,height:svg.getBoundingClientRect().height,margin:40})
    // potential mem leak if too many popouts made and closed without unsubscribing
    mapData.subscribe(data=> {
        // find the building for this popout and updatethe headcount
        if (data!=null) {

        for(let d of data) {
            if (d.latestBuilding == number) {
                console.log("changed building",number,headCount, "to",d.count)
                headCount = d.count
            }
        }
        }
    })

})

let removePopout = ()=> {
    holder.remove()
}
</script>

<style>
#popoutHolder {
    position:absolute;
    background:white;
    border-radius:10px;
    z-index:2000;
}
#top {
    display:flex;
    justify-content: space-between;
}
#exit {
}

</style>

<div id="popoutHolder" bind:this={holder}>
<div id="top">
<div id="text">
<p>Building: {building}</p>
<p>HeadCount: {headCount}</p>
</div>
<div id="exitHolder">
<img src="x.png" alt="" id="exit" on:click={removePopout} bind:this={xIcon}>
</div>
</div>
<svg id="histogram" bind:this={svg}></svg>
</div>