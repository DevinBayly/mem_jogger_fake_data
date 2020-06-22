<script>
  export let name;
  import { onMount } from "svelte";
  import CB from "./columnBlock.svelte";
  import * as d3 from "d3";
  onMount(async () => {
    console.log("loaded");
    let paulData = await fetch("paulFebruaryTokenized.csv").then(res =>
      res.text()
    );
    let dsv = d3.dsvFormat(",");
    paulData = dsv.parse(paulData);
    console.log(paulData);
    let mockData = [
      {
        _time: "2020-02-03T16:45:47.875+0000",
        userhash:
          "ad3876e02437086654943faf80000b2f1d20ac82d9d9ea3dbee1d898e3505478",
        Called_Station_ID: "73-ODSE-cia1:UAWiFi",
        EndPointMatchedProfile: "Apple-iPhone",
        macHash:
          "621371628f25f04b2bd0d919a9e55e4df2408768006e9ef65e47a03ea6e191af",
        apBuildingNumber: "73",
        apRoomNumber: "ODSE",
        apDescription: "cia1",
        ISEPolicySetName: "UAWiFi - Default",
        psrsvd_gc: "1",
        psrsvd_v: "1"
      },
      {
        _time: "2020-02-03T16:45:52.950+0000",
        userhash:
          "ad3876e02437086654943faf80000b2f1d20ac82d9d9ea3dbee1d898e3505478",
        Called_Station_ID: "73-ODSE-cia1:UAWiFi",
        EndPointMatchedProfile: "Apple-Device",
        macHash:
          "3d87c410523f0cb71cbde446790dafb0e9ba56d4c6cb57e9b74b5d8d9b34824f",
        apBuildingNumber: "73",
        apRoomNumber: "ODSE",
        apDescription: "cia1",
        ISEPolicySetName: "UAWiFi - Default",
        psrsvd_gc: "1",
        psrsvd_v: "1"
      }
    ];
    // loop through the data, and assign durationss, and make the columnBlocks
    let props = [];
    let allTimes = [];
    for (let d of mockData) {
      let startTime = d3.isoParse(d._time);
      allTimes.push(startTime);
      let duration = new Date(startTime.getTime());
      duration = duration.setSeconds(duration.getSeconds() + 5 * 60 * 1000);
      // this will set the size of the graphic at the bottom of each block
      let dataDims = {
        height: 100,
        width: 300,
        margin:5
      };
      // likely still need the conversion between numbers and names of places
      props.push({
        startTime,
        duration,
        buildingName: d.apBuildingNumber,
        room: d.apRoomNumber,
        dataDims
      });
    }
    let timeDomain = [d3.min(allTimes), d3.max(allTimes)];
    let target = document.querySelector("#Rcolumn");

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
</style>

<div id="Rcolumn">
  <!-- include the holder of columnBlocks -->
  <div id="blockHolder" />
  <!-- leave space at the bottom for the day selector -->
</div>
