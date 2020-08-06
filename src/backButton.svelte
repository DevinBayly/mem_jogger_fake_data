<script>
  let goBack = () => {
    location.reload();
  };
  let arrowEle,pEle
  let content
    let entering = ()=> {
        arrowEle.style.color = "black"
        pEle.style.color = "black"
    }
    let leaving =()=> {
        arrowEle.style.color = "white"
        pEle.style.color = "white"
    }
</script>

<style>
  #content {
    display: flex;
  }
  #arrow {
    font-size: 30px;
    margin: 19px 0 20px;
    color: white;
  }
  p {
    margin: 24px 0 20px;
    color: white;
  }
  #content {
    cursor: pointer;
  }
</style>

<div id="content"  on:mouseenter={entering} on:mouseleave={leaving} on:click={goBack} >
  <div bind:this={arrowEle} id="arrow" class="ua-brand-left-arrow" />
  <div id="name">
    <p bind:this={pEle}>Memory Jog Map |</p>
  </div>
</div>
