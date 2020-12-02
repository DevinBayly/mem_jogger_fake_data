<script>
  // change to cause build.
  import UAHeader from "./UAHeader.svelte";
  import NotPermitted from "./NotPermitted.svelte";
  import IV from "./IndividualVis.svelte";
  import {assignThreshold} from "./algos.js"
  import { onMount } from "svelte";
  import { wifiData } from "./store.js";
  let auth, signInButton, signInHolder, introText;
  //Teresa Portela's auth functions
  function loadData() {
        //remove the removable elements
        for (let e of document.querySelectorAll(".removable")) {
          e.remove();
        }
        console.log("Sign in success");
        signInButton.style.color = "white";
        signInHolder.style.position = "absolute";
        signInHolder.style.right = "10px";
        signInHolder.style.top = "20px";
        signInHolder.style.margin = "0px";
        // converted fetch from ajax code
        fetch("my_fake_data_1606869759.json")
          .then(res => res.json())
          .then(jsonData => {
            // load the individual visualizations at this point
            //remove everything except the signout
            // properly format data for vis
            // issue with data being string still? this seems intermittent,
            if (typeof "" === typeof jsonData) {
              jsonData = JSON.parse(jsonData);
            }
            console.log("json data is ", jsonData);
            console.log("type of json data ", typeof jsonData);
            jsonData = jsonData.map(e => {
              return e;
            });
            // bump up the times less than 5 mins
            assignThreshold(jsonData)
            new IV({
              target: document.body,
              props: {
                reportData: jsonData
              }
            });
            wifiData.set(jsonData);
          })
          .catch(e => {
            console.log("error", e);
            //remove the removable elements
            for (let e of document.querySelectorAll(".removable")) {
              e.remove();
            }
            // load the missing data page
            new NotPermitted({
              target: document.body,
              props: {
                reason: "nodata"
              }
            });
          });
      }
  function userButton(auth) {
    var state = signInButton.innerHTML;
    if (state === "Sign Out") {
      signInButton.innerHTML = "Sign In";
      // enssssure that we set up the auth page again
      // prevent auto loading the map

      document.cookie = "gotovis=false";
      //replace the history to remove the access token even on back
      if (document.querySelector("#secondVisHolder")) {
        document.querySelector("#secondVisHolder").remove();
      }
      if (document.querySelector("#holder")) {
        document.querySelector("#holder").remove();
      }
      if (document.querySelector("#signin")) {
document.querySelector("#signin").remove()
      }
      let newURl = `${window.location}`;
      window.history.replaceState({}, "", newURl.replace(/index.*/, ""));
      new NotPermitted({
        target: document.body,
        props: {
          reason: "user is signed out, close Tab or reload page."
        }
      });
      //add a notpermitted page with the reason "you are logged out"
    } else {
      signInButton.innerHTML = "Sign Out";
      loadData()
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
