<style>
  #innerholder {
    position: relative;
    top: -50%;
    left: -50%;
    background: white;
    border-radius: 6px;
  }
  #vidholder {
      z-index: 5000;
      position:absolute;
      top:25%;
      left:50%;
  }
#overlay {
    position:fixed;
    top:0px;
    left:0px;
    height:100%;
    width:100%;
    background:rgba(100,100,100,.7);
}
video{
    width:750px;
}

</style>

<div id="vidholder">
    <div id="overlay" />
  <div id="innerholder">
    <video src="explanation.webm" id="intro" autoplay controls />
    <div
      id="close"
      on:click={() => {
        document.querySelector('#vidholder').remove();
      }}>
      <h2>Close</h2>
    </div>
  </div>
</div>
