import {writable} from "svelte/store"
import {paulData} from "./data.js"
// could have a store that is the brushed time region that we wait for updates on, not the wifi data?
// slightly transform paulData
let modifiedData = paulData.map(e=> {
    // remove eventData nesting
    e = e.eventData
    // make time milliseconds
    e._time = parseInt(e._time)*1000
    return e
})
export const wifiData = writable(modifiedData)
export const timeSelected = writable(0)
export const allDevices = writable({})
export const timeBounds = writable([])
// set default
export const daySelected = writable(0)