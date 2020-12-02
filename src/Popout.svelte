<script>
  export let building, time,  screen;
  //

  let holder, svg, xIcon;
  import { onMount } from "svelte";
  onMount(() => {
    holder.style.left = screen.x + "px";
    holder.style.top = screen.y + "px";
  });
</script>

<style>
  #popoutHolder {
    position: absolute;
    background: white;
    border-radius: 10px;
    z-index: 2000;
  }
  #top {
    display: flex;
    justify-content: space-between;
  }
  #exit {
  }
</style>

<div id="popoutHolder" bind:this={holder}>
  <div id="text">
    <p>Estimated Time: {time}</p>
  </div>
</div>
