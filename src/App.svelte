<script>
import Map from "./Map.svelte"
import Brushable from "./brushableIndividual.svelte"
import {buildingJSON} from "./data.js"
import {wifiData } from "./store.js"
// setup the store with the data for this application

console.log("wifi data is",wifiData)
</script>

<style>
#secondVisHolder {
  display:flex;
  flex-direction: column;
  height:100%;
  width:99%;

}
</style>

<div id="secondVisHolder">
<Map buildingJSON={buildingJSON}></Map>
</div>