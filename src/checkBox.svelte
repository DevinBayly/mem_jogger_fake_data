<script>
  export let Content;
  import { wifiData, allDevices } from "./store.js";
  // thhis is the step that will be replaced by a fetch from the s3 bucket, can be made into another store so we don't refetch
  import { paulData } from "./data.js";
  let devices;
  let updateData = () => {
    // reset the data,
    // only include parts of the results that pertain to the devices that are selected
    let updatedData = [];
    for (let entry of paulData) {
      if (devices[entry["EndPointMatchedProfile"]].checked) {
        updatedData.push(entry);
      }
    }
    // this should kickoff redraw
    wifiData.set(updatedData);
  };
  let updateDevices = () => {
    allDevices.update(devs => {
      console.log("changing devices");
      devs[Content].checked = !devs[Content].checked;
      console.log("to", devs[Content].checked);
      devices = devs;
      // trigger the change of the wifidata
      updateData();
      return devs;
    });
  };
</script>

<label>
  <input type="checkbox" checked on:click={updateDevices} />
  {Content}
</label>
