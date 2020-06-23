<script>
import Map from "./Map.svelte"
import SideView from "./sideView.svelte"
</script>

<style>
#secondVisHolder {
  display:flex;
  height:100%;
  width:99%;

}
</style>

<div id="secondVisHolder">
<Map></Map>
<SideView></SideView>
</div>