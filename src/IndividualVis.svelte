<script>
  export let reportData;
  import VisOp from "./VisOption.svelte";
  import MapApplication from "./map_vis.svelte";
  // put in Teresa's signin code
  // include the reachout to the lambda function
  // introduce the page with the options
  let holder;
  let map = () => {
  for (let opHolder of document.querySelectorAll("#holder")) {
    opHolder.remove();
  }
    console.log("loading map");
    // remove holder
    new MapApplication({
      target: document.body
    });
  }
  // look for the gotovis ccookie, and launch map automatically if found
  let cookies = decodeURIComponent(document.cookie)
  cookies.split(";").map(e=> {
    console.log("searching cookies",e)
    if (e.match(/gotovis=true/)){
      // launch the map
      map()
      // remove the cookie
      document.cookie="gotovis=false"
    }
  })
  ;
</script>

<style>
  * {
    z-index: 5;
  }
  #holder {
    height: 100%;
    background: white;
  }
  #title {
    display: flex;
    justify-content: center;
  }
  #options {
    display: flex;
    justify-content: center;
    height: 100%;
  }
  #MJMexplanation p {
    width:80%;
    margin:0 auto;

  }

</style>

<div id="holder" bind:this={holder}>
  <div id="title">
    <h3>Memory Jogger</h3>

  </div>
  <div id="MJMexplanation">
  <p>This Memory Jog map is designed to help you remember where you’ve been on the UA campus for the two weeks prior to your survey. Please understand that the displayed locations and other data is a “best guess”, based on UA wifi connection information from your internet-enabled devices, such as a smart watch, or mobile phone. The connection information can be ambiguous, and vary widely from one smart device to another. This tool is only to help jog your memory, and is not guaranteed to be completely accurate.</p></div>
  <div id="screencast">
  <a href="#">TODO link to screencast</a></div>
  <div id="options">
    <div id="map-side" on:click={map}>
      <VisOp
        imgSrc="map_background.png"
        title="Map Visualization"
        summaryText="Click the image to explore where you've been on campus for over 15 minutes at
        a time overlaid on this campus map" />
    </div>
  </div>
</div>
