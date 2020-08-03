<script>
    import {onMount} from "svelte"
    import {daySelected} from "./store.js"
    let selectElement
    export let duration
    let actualDates ={}
    let firstDate

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateTimeFormat = new Intl.DateTimeFormat('en-US', options);

    onMount(()=> {
        // break down the duration into a span of days. 
        // loop and add dates in 24hour incs until we are greater than the end duration
        let start = duration[0]
        start.setHours(0)
        start.setMinutes(0)
        start.setSeconds(0)
        let end = duration[1]
        let current = new Date(start.getTime())
        for (let i = 0;;i++) {
            let e = document.createElement("option")
            e.value = JSON.stringify(current)
            e.innerHTML = dateTimeFormat.format(current)
            actualDates[e.value] = new Date(current.getTime())
            document.querySelector("#days").append(e)
            if (i == 0) {
                firstDate = actualDates[e.value]
            }
            current.setMinutes(current.getMinutes() + 60*24)
            if (current > end) {
                break
            }

        }
        daySelected.set(firstDate)
    })
    // when selection changes, set the daySelected, this will trigger an auto brush in the lower view
    let selectionMade = ()=> {
        console.log("change in selection to",selectElement.value);
        daySelected.set(actualDates[selectElement.value])
    }

    
</script>
<style>
</style>
<div id="content">
<select name="" id="days" bind:this={selectElement} on:change={selectionMade}>
<option value="default" selected hidden disabled>Select Day: showing {dateTimeFormat.format(firstDate)} </option></select>
</div>