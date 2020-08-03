<script>
  export let missingBuildings;
  import { onMount } from "svelte";
  function prettyReport(reportData) {
    let text =
      "helpful resource for determining names of buildings in cases of inconsistent numbering https://pdc.arizona.edu/Building/\nAlso consider using the Gantt Chart option for viewing your location report\n";
    for (let e of reportData) {
      text += `\nconnection event at ${JSON.stringify(new Date(e._time))}
               building number: ${e.apBuildingNumber}
               room number: ${e.apRoomNumber}
               device: ${e.deviceType}
               duration of connection: ${e.niceDuration} 

`;
    }
    return text;
  }
  onMount(() => {
    let reportLink = document.querySelector("#missingReport");
    // TODO see if we can figure out why sometimes the a element isn't mounted yet at this point?
    if (reportLink) {
      let data = URL.createObjectURL(
        new Blob([prettyReport(missingBuildings)])
      );
      reportLink.href = data;
    }
  });
</script>

<a id="missingReport">see {missingBuildings.length} missing buildings report</a>
