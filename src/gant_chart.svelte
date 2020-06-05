<script>
console.log("gant chart")
import {gantBase} from "./gant_base.js"
let svg = document.querySelector("svg")
export let data
export let buildingData
let gb = gantBase(data,buildingData)
gb.setup()
gb.run()

</script>
