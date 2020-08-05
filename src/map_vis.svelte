<script>

import {onMount} from "svelte"
import BB from "./backButton.svelte"
import Map from "./Map.svelte"
import Brushable from "./brushableIndividual.svelte"
import Selectors from "./dataSelectors.svelte"
import {buildingJSON} from "./buildingData.js"
import {wifiData } from "./store.js"
// setup the store with the data for this application
let visHolder
let dims ={
  width:window.innerWidth*.5,
  height:100,
  margin:20
}
onMount(()=> {
  new BB({
    target:document.querySelector("#bbHolder"),
  })
})
</script>

<style>
#secondVisHolder {
  display:flex;
  flex-direction: column;
  height:100%;
  width:100%;

}
#topViews {
  display:flex;
  justify-content: space-evenly;
}
</style>

<div id="secondVisHolder" >
<div id="topViews">
<Selectors></Selectors>
<Brushable dims={dims}></Brushable>
</div>
<Map buildingJSON={buildingJSON}></Map>
</div>