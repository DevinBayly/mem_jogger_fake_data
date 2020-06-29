<script>
  export let imgSrc, title, summaryText;
</script>

<style>
#optionHolder {
    display:flex;
    flex-direction: column;
    align-items:center;
    height:100%;
}
#title {
    height:40%;
}
#summary{
    text-align:center;
}
</style>


<div id="optionHolder">
  <img src={imgSrc} alt="" id="background" />
  <div id="title">
    <h3>{title}</h3>
  </div>
  <div id="summary">
    <p>{summaryText}</p>
  </div>
</div>
