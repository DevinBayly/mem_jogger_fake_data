<script>
  export let name;
  import { onMount } from "svelte";
  import CB from "./columnBlock.svelte";
  import DaySelector from "./daySelector.svelte"
  import * as d3 from "d3";

  onMount(async () => {
    console.log("loaded");
    
    let paulData = await fetch("paulFebruaryTokenized.csv").then(res =>
      res.text()
    );
    let dsv = d3.dsvFormat(",");
    paulData = dsv.parse(paulData);
    console.log(paulData);
    
    let mockData = paulData
    // loop through the data, and assign durationss, and make the columnBlocks
    let props = [];
    let allTimes = [];
    let id = 0
    for (let d of mockData) {
      let startTime = d3.isoParse(d._time);
      allTimes.push(startTime);
      let duration = new Date(startTime.getTime());
      duration.setSeconds(duration.getSeconds() + 5 );
      // this will set the size of the graphic at the bottom of each block
      let dataDims = {
        height: 100,
        width: 300,
        margin:5
      };
      // likely still need the conversion between numbers and names of places
      props.push({
        id,
        startTime,
        duration,
        buildingName: d.apBuildingNumber,
        room: d.apRoomNumber,
        dataDims
      });
      id+=1
    }
    let lastTime = new Date(d3.max(allTimes).getTime())
    lastTime.setSeconds(lastTime.getSeconds() + 5)
    let timeDomain = [d3.min(allTimes), lastTime];
    let target = document.querySelector("#blockHolder");

    // assign data to the blocks
    for (let prop of props) {
      prop["domain"] =timeDomain
      new CB({
        target,
        props:{
          blockData:prop
        }
      });
    }
    new DaySelector({
      target:document.querySelector("#daySelector"),
      props:{
        axisData:{domain:timeDomain}
      }

    })
  });
</script>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  #mapid {
    height: 100vh;
  }
  svg {
    position: absolute;
  }
  #rightSide {
    display:flex;
    justify-content: right;
    height:100%;
  }
  #Rcolumn {
    width:400px;
    border:2px solid black;
    display:flex;
    flex-direction: column;
  }
  #blockHolder {
    overflow:scroll;
  }
</style>
<div id="rightSide">
<div id="Rcolumn">
  <!-- include the holder of columnBlocks -->
  <div id="blockHolder" />
  <!-- leave space at the bottom for the day selector -->
  <div id="daySelector">
  </div>
</div>
</div>