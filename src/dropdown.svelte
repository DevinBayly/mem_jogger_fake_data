<script>
  import { onMount } from "svelte";
  import { daySelected } from "./store.js";
  let selectElement,selectionMade, hideDefault;
  export let duration;
  let actualDates = {};
  // when selection changes, set the daySelected, this will trigger an auto brush in the lower view

  onMount(() => {
    // break down the duration into a span of days.
    // loop and add dates in 24hour incs until we are greater than the end duration
    let start = duration[0];
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    let end = duration[1];
    let current = new Date(start.getTime());
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    };

    const dateTimeFormat = new Intl.DateTimeFormat("en-US", options);

    let firstDate;
    for (let i = 0; ; i++) {
      let e = document.createElement("option");
      e.value = JSON.stringify(current);
      e.innerHTML = dateTimeFormat.format(current);
      actualDates[e.value] = new Date(current.getTime());
      if (i == 0) {
        firstDate = actualDates[e.value];
      }
      document.querySelector("#days").append(e);
      current.setMinutes(current.getMinutes() + 60 * 24);
      if (current > end) {
        break;
      }
    }
    // set date to the  first option in the collection
    daySelected.set(firstDate);
    selectElement.addEventListener("change", () => {
      console.log("change in selection to", selectElement.value);
      daySelected.set(actualDates[selectElement.value]);
    });

  });
</script>

<style>

</style>

<div id="content">
  <select name="" id="days" bind:this={selectElement}>
  <!-- 

    <option bind:this={hideDefault} value="Select Day" selected hidden disabled>
      Select Day
    </option>
   -->
  </select>
</div>
