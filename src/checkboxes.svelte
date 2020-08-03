<script>
  import { allDevices } from "./store.js";
  import { onMount } from "svelte";
  import CB from "./checkBox.svelte";
  let holder;
  onMount(() => {
    console.log("holder is", holder);
    let once = false;
    allDevices.subscribe(lst => {
      // make sure lst isn't null

      if (lst != null) {
        if (!once) {
          // generate a check box element for each
          let i = 1
          for (let deviceName in lst) {
            new CB({
              target: holder,
              props: {
                Content: `Device ${i}`,
                Guess: deviceName
              }
            });
            i++
          }
          once = true;
        }
      }
    });
  });
</script>

<style>
  #checkBoxHolder {
    display: flex;
  }
</style>

<div id="checkBoxHolder" bind:this={holder}>
  <p>Devices:</p>
</div>
