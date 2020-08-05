<script>
  import DD from "./dropdown.svelte";
  import { wifiData, timeSelected } from "./store.js";
  import CB from "./checkboxes.svelte"
  import { onMount } from "svelte";
  import * as d3 from "d3";
  let DDparent;
  // figure out the date range
  onMount(() => {
    let userData;
    let unsub = wifiData.subscribe(data => {
      userData = data;
    });
    let times;
    let unsubTime = timeSelected.subscribe(duration => {
      // this gets used for the drop down, and updating the graph
      if (duration != 0) {
        new DD({
          target: document.querySelector("#selection"),
          props: {
            duration
          }
        });
      }
    });
  });
</script>

<div id="selectorHolder">
<p>Select date and time to view your locations and devices on the map:</p>
  <div id="selection"></div>
  <div id="checkBoxes">
  <CB></CB>
  </div>
</div>
