<script>

let goBack= ()=> {
location.reload()
}
</script>
<style>
#content {
    display:flex;
}
#arrow{
    font-size:30px;
    margin:19px 0 20px;
    color:white;
}
p {

    margin:24px 0 20px;
    color:white;
}
</style>
<div id="content" >
<div id="arrow" class="ua-brand-left-arrow" on:click={goBack} ></div>
<div id="name">
    <p >Memory Jog Map |</p>
</div>
</div>