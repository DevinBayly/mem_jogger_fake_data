<script>
  export let imgSrc, title, summaryText;
  import {onMount} from "svelte"
  let imgElement
  let holder
  onMount(()=> {
      // move the image into the top corner of the half
      let holderRect = holder.getBoundingClientRect()
    imgElement.style.position="absolute"
    imgElement.style.top = holderRect.top+"px"
    imgElement.style.left = holderRect.left + "px"

  })
</script>

<style>
* {
    z-index: 5;
}
#optionHolder {
    height:100%;
}
#optionHolder img {
    z-index: 1;
}
.text {
    background:#183055;
    color:white;
    box-shadow: 0 7px 23px 0 rgba(32, 44, 62, 0.68);
    border-radius: 10px;
    margin:5%;
}
#title {
    padding: 2%;
}
#summary{
    text-align:center;
}
#content {
    display:flex;
    flex-direction: column;
    justify-content: center;
    align-items:center;
    height:70%;
    width:80%;
    margin:0 auto;

}
</style>


<div id="optionHolder" bind:this={holder}>
  <img bind:this={imgElement} src={imgSrc} alt="" id="backgroundimage" />
  <div id="content">
  <div id="title" class="text">
    <h3>{title}</h3>
  </div>
  <div id="summary" class="text">
    <p>{summaryText}</p>
  </div>
  </div>
</div>
