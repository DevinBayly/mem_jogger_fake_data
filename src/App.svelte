<script>
  //
  import UAHeader from "./UAHeader.svelte";
  import NotPermitted from "./NotPermitted.svelte";
  import IV from "./IndividualVis.svelte";
  import { onMount } from "svelte";
  import { wifiData } from "./store.js";
  import {assignThreshold} from "./algos.js"
  import data from "./data.js"
  let auth, signInButton, signInHolder, introText,jsonData;
  //Teresa Portela's auth functions
  function startApplication() {
    //
    for (let e of document.querySelectorAll(".removable")) {
      e.remove();
    }
    signInButton.style.color = "white";
    signInHolder.style.position = "absolute";
    signInHolder.style.right = "10px";
    signInHolder.style.top = "20px";
    signInHolder.style.margin = "0px";
    // converted fetch from ajax code
    jsonData =data
    if (typeof "" === typeof jsonData) {
      jsonData = JSON.parse(jsonData);
    }
    console.log("json data is ", jsonData);
    console.log("type of json data ", typeof jsonData);
    jsonData = jsonData.map(e => {
      e = e.eventData;
      return e;
    });
    // perfom threshold modification, set all < 5min events to 5mins
    assignThreshold(jsonData)
    console.log("filtered", jsonData);
    new IV({
      target: document.body,
      props: {
        reportData: jsonData
      }
    });
    wifiData.set(jsonData);
  }
  function userButton() {
    var state = signInButton.innerHTML;
    if (state === "Sign Out") {
      signInButton.innerHTML = "Sign In";
    } else {
      startApplication()
      signInButton.innerHTML = "Sign Out"
    }
  }


  onMount(() => {
    signInButton.addEventListener("click", () => {
      userButton();
    });
  });
</script>

<style>
  #small {
    font-size: 12px;
  }
  #title {
    margin: 10%;
  }
  #summary {
    width: 80%;
    margin: 0 auto;
  }
  #signin {
    margin: 5%;
  }
</style>

<UAHeader />
<div bind:this={introText} class="removable">
  <div id="Title">
    <h1>UA Timescape</h1>
  </div>
  <div id="summary">
    <p>
      Minimizing exposure to the novel coronavirus is key to protecting UArizona
      students, faculty and staff from COVID-19. This site has been created to
      support strategic efforts related to crowd density, managing campus
      spaces, mitigating spread, and learning about risk factors.
    </p>
    <p>You will need authorization to log in to this site using your NetID.</p>
  </div>

</div>
<div id="signin" bind:this={signInHolder}>
  <a bind:this={signInButton}>Sign In</a>
</div>
<div id="contact" class="removable">
  <p id="small">For questions, please contact: uacap@list.arizona.edu</p>
</div>
