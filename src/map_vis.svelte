<script>

import Map from "./Map.svelte"
import Brushable from "./brushableIndividual.svelte"
import Selectors from "./dataSelectors.svelte"
import {buildingJSON} from "./buildingData.js"
import {wifiData } from "./store.js"
// setup the store with the data for this application

let dims ={
  width:window.innerWidth*.8,
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
</style>

<div id="secondVisHolder">
<div id="bottomViews">
<Selectors></Selectors>
<Brushable dims={dims}></Brushable>
</div>
<Map buildingJSON={buildingJSON}></Map>
</div>