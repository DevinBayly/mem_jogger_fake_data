<script>
export let missingBuildings
let ele
import {onMount} from "svelte"
onMount(()=> {
     let data = URL.createObjectURL(new Blob([JSON.stringify(missingBuildings)]))
     ele.href = data
})
</script>
<a bind:this={ele}>see {missingBuildings.length} missing buildings report</a>