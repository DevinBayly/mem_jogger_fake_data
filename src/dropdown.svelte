<script>
    import {onMount} from "svelte"
    export let duration
    onMount(()=> {
        // break down the duration into a span of days. 
        // loop and add dates in 24hour incs until we are greater than the end duration
        let start = duration[0]
        let end = duration[1]
        let current = new Date(start.getTime())
        for (let i = 0;;i++) {
            let e = document.createElement("option")
            e.value = JSON.stringify(current)
            e.innerHTML = JSON.stringify(current) 
            document.querySelector("#days").append(e)
            current.setMinutes(current.getMinutes() + 60*24)
            if (current > end) {
                break
            }

        }
    })
    
</script>
<style>
</style>
<div id="content">
<h3>Date Selector</h3>
<select name="" id="days"></select>
</div>