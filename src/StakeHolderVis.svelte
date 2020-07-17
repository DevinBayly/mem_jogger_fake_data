<script>
import VisOp from "./VisOption.svelte"
import DensityMap from "./density_vis.svelte"

  let holder
  let map = ()=> {
    console.log("loading map")
    // remove holders
    for( let opHolder of document.querySelectorAll("#holder")) {
      opHolder.remove()
    }

    new DensityMap({
      target:document.body,
    })
  }
</script>

<style>

* {
    z-index: 5;
}
#holder {
  height:100%;
  background:white;
}
#title {
  display:flex;
  justify-content: center;
}
#options {
  cursor:pointer;
  display:flex;
  justify-content: center;
  height:100%;
}
</style>

<div id="holder" bind:this={holder}>
  <div id="title">
    <h3>Campus Building Density Viewer</h3>
  </div>
  <div id="options">
  <div id="map-side" on:click={map}>
  <VisOp imgSrc="density_map_background.png" title="Crowd Density Map" summaryText="View current counts of individuals around campus where wifi data can be overlaid on buildings." ></VisOp>
  </div>
  </div>
</div>
