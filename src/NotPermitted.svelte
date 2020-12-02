<script>
  export let reason;
  let holder;
  import { onMount } from "svelte";
  onMount(() => {
    if (reason == "nodata") {
      // create h1 and other p too, or else just add the p element
      let h2 = document.createElement("h2");
      h2.innerHTML = "Your Memory Location Results";
      let p = document.createElement("p");
      p.innerHTML =
        "There are no location results reported for you at this time. Please check back later.";
      holder.append(h2);
      holder.append(p);
    } else {
      let p = document.createElement("p");
      p.innerHTML = reason;
      holder.append(p);
    }
  });
</script>

<div>
  <div id="Title">
    <h1>UA Timescape</h1>
  </div>
  <div id="hollder" bind:this={holder} />
  <p>Stay safe and sane!</p>
  <p>
    For assistance please contact:
    <a href="mailto:SAFER-Team@arizona.edu">SAFER-Team@arizona.edu</a>
  </p>
</div>
