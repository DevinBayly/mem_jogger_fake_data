<script>
  export let missingBuildings;
  import { onMount } from "svelte";
  function prettyReport(reportData) {
    let text = "helpful resource for determining names of buildings in cases of inconsistent numbering https://pdc.arizona.edu/Building/\n";
    for (let e of reportData) {
      text += `\n count for building is ${e.count}
               building number: ${e.latestBuilding}
`;
    }
    return text;
  }
  onMount(() => {
    let reportLink = document.querySelector("#missingReport");
    let data = URL.createObjectURL(
      new Blob([prettyReport(missingBuildings)])
    );
    reportLink.href = data;
  });
</script>

<a id="missingReport">see {missingBuildings.length} missing buildings report</a>
