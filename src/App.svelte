<script>
  import VisOp from "./VisOption.svelte"
  // put in Teresa's signin code
  // include the reachout to the lambda function
  // introduce the page with the options
</script>

<style>
#holder {
  height:100%;
    background:#183055;
  color:white;
}
#title {
  display:flex;
  justify-content: center;
}
#options {
  display:flex;
  justify-content: center;
  height:100%;
}
</style>

<div id="holder">
  <div id="title">
    <h3>Memory Jogger</h3>
  </div>
  <div id="options">
  <div id="gantt-side">
    <VisOp imgSrc="gantt_background.png" title="Gantt Chart" summaryText="View your data from the last 2 weeks with particular attention to the 'when' you were in a location"></VisOp>
  </div>
  <div id="map-side">
  <VisOp imgSrc="map_background.png" title="Map Visualization" summaryText="Explore where you've been on campus for over 15 minutes at a time overlaid on this campus map"></VisOp>
  </div>
  </div>
</div>
