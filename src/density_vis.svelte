<script>
import Map from "./DensityMap.svelte"
import Brushable from "./brushableDensity.svelte"
import {buildingJSON} from "./buildingData.js"
// setup the store with the data for this application
//
let dims ={
  width:(window.innerWidth)*.8,
  height:100,
  margin:20
}
</script>

<style>
#secondVisHolder {
  display:flex;
  flex-direction: column;
  height:100%;
  width:100%;

}
#bottomViews {
  display:flex;

}
#lower {
  display:flex;

}
</style>

<div id="secondVisHolder">
<Map buildingJSON={buildingJSON}></Map>
<div id="lower">
<Brushable dims={dims}></Brushable>
</div>
</div>