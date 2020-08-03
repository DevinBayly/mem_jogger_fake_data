<script>
  export let Content,Guess;
  import { wifiData, allDevices } from "./store.js";
  // listen on wifidata, 
  let modifiedData
  let once = false
  wifiData.subscribe(value=> {
    if (value != null && ! once) {
      modifiedData = value
      once = true
    }
  })
  // thhis is the step that will be replaced by a fetch from the s3 bucket, can be made into another store so we don't refetch
  let devices;
  // deal with changes that have occured to the data format since original development
  let updateData = () => {
    // reset the data,
    // only include parts of the results that pertain to the devices that are selected
    let updatedData = [];
    for (let entry of modifiedData) {
      if (devices[entry["deviceType"]].checked) {
        updatedData.push(entry);
      }
    }
    // this should kickoff redraw
    wifiData.set(updatedData);
  };
  let updateDevices = () => {
    allDevices.update(devs => {
      console.log("changing devices");
      devs[Guess].checked = !devs[Guess].checked;
      console.log("to", devs[Guess].checked);
      devices = devs;
      // trigger the change of the wifidata
      updateData();
      return devs;
    });
  };
</script>

<style>
label {
  padding:1px;
}</style>

<label title={`Device Guess: "${Guess}"`}> 
  <input type="checkbox" checked on:click={updateDevices} />
  {Content}
</label>
