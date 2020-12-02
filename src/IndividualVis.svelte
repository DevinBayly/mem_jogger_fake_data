<script>
  export let reportData;
  import VisOp from "./VisOption.svelte";
  import { onMount } from "svelte";
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
  };
  onMount(() => {
    // look for the gotovis ccookie, and launch map automatically if found
    let cookies = decodeURIComponent(document.cookie);
    cookies.split(";").map(e => {
      console.log("searching cookies", e);
      if (e.match(/gotovis=true/)) {
        // remove the cookie
        document.cookie = "gotovis=false";
        // launch the map
        map();
      }
    });
  });
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
  }
  #subIntro p {
    width: 80%;
    margin: 0 auto;
    padding-bottom: 20px;
  }
  #horizontal {
    padding-top: 5px;
    display: flex;
    align-items: stretch;
    height: 100%;
  }
  #lhs {
    flex: 1 1;
    background: #ededed;
    border-radius: 10px;
    box-shadow: 0 7px 23px 0 rgba(32, 44, 62, 0.68);
    margin-right: 5px;
  }
  #rhs {
    flex: 3 3;
  }
  #introItalic {
    font-style: italic;
    font-size: 12px;
    color: #828181;
  }
  #lhsHeader {
    padding-top: 20%;
  }
ul.basic {
all:unset;
}
.basic li {
  all:unset;
  display:list-item;
  list-style: circle black;
}
li a {
  all:unset;
  color:blue;
  cursor:pointer;
}
.sublhs {
  display:flex;
  padding-left:20%;
}
.sublhs p {
  cursor:pointer;
}
</style>

<div id="holder" bind:this={holder}>
  <div id="horizontal">
    <div id="lhs">
      <div id="lhsHeader" class="sublhs">
        <p id="lhsHeader">
          <b>Memory Map Help</b>
        </p>
      </div>

      <div id="about" class="sublhs">
        <ul class="basic">
          <li>

            <p
              href="#"
              title=" This Memory Jog map is designed to help you remember where
              you’ve been on the UA campus for the two weeks prior to your
              survey. Please understand that the displayed locations and other
              data is a “best guess”, based on UA wifi connection information
              from your internet-enabled devices, such as a smart watch, or
              mobile phone. The connection information can be ambiguous, and
              vary widely from one smart device to another. This tool is only to
              help jog your memory, and is not guaranteed to be completely
              accurate.This Memory Jog map is designed to help you remember
              where you’ve been on the UA campus for the two weeks prior to your
              survey. Please understand that the displayed locations and other
              data is a “best guess”, based on UA wifi connection information
              from your internet-enabled devices, such as a smart watch, or
              mobile phone. The connection information can be ambiguous, and
              vary widely from one smart device to another. This tool is only to
              help jog your memory, and is not guaranteed to be completely
              accurate. ">
              About this tool
            </p>
          </li>
        </ul>
      </div>

      <div id="screencast" class="sublhs">
        <ul class="basic">
          <li>
            <a href="instructions.webm">How-to use (video)</a>
          </li>
        </ul>
      </div>
    </div>
    <div id="rhs">
      <div id="title">
        <h3>Memory Jogger</h3>
      </div>
      <div id="subIntro">
        <p id="introItalic">
          Note: this tool is only intended to help Jog your memory. The
          displayed locations are a "best guess," and aren't guaranteed to be
          completely accurate.
        </p>
      </div>
      <div id="options">
        <div id="map-side" on:click={map}>
          <VisOp
            imgSrc="map_background_updated.png"
            summaryText="Click the image to explore where you've been on campus
            for over 15 minutes at a time overlaid on this campus map" />
        </div>
      </div>
    </div>
  </div>

</div>
