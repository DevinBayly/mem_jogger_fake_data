<script>
  export let imgSrc, summaryText;
  import {onMount} from "svelte"
  let imgElement
  let holder
  let content
  onMount(()=> {
    holder.style["background-image"] = `url(${imgSrc})`
  })
</script>

<style>
* {
    z-index: 5;
}
#optionHolder {
    cursor:pointer;
}
#optionHolder img {
    z-index: 1;
}
.textElement {
    box-shadow: 0 7px 23px 0 rgba(32, 44, 62, 0.68);
    border-radius: 10px;
    margin:5%;
    padding:5%;
    background:white;
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
    width:80%;
    margin:0 auto;
    padding-top:18%;
    padding-bottom:20%;
}
</style>


<div id="optionHolder" bind:this={holder}>
  <div id="content" bind:this={content}>
  <div id="summary" class="textElement">
    <p>{summaryText}</p>
  </div>
  </div>
</div>
