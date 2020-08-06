<script>
  export let imgSrc, title, summaryText;
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
    height:100%;
    cursor:pointer;
}
#optionHolder img {
    z-index: 1;
    width:200%;
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
    height:70%;
    width:80%;
    margin:0 auto;
}
</style>


<div id="optionHolder" bind:this={holder}>
  <div id="content" bind:this={content}>
  <div id="title" class="textElement">
    <h3>{title}</h3>
  </div>
  <div id="summary" class="textElement">
    <p>{summaryText}</p>
  </div>
  </div>
</div>
