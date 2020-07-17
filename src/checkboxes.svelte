<script>
  import { allDevices } from "./store.js";
  import { onMount } from "svelte";
  import CB from "./checkBox.svelte";
  let holder;
  onMount(() => {
    console.log("holder is", holder);
    let once = false
    allDevices.subscribe(lst => {
      if (!once) {
        // generate a check box element for each
        for (let device in lst) {
          new CB({
            target: holder,
            props: {
                Content:device
            }
          });
        }
        once =true
      }
    });
  });
</script>
<style>
#checkBoxHolder{
    display:flex;
}
</style>
<div id="checkBoxHolder" bind:this={holder} >
<p>Devices:</p>
</div>
