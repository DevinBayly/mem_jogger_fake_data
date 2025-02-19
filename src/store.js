import { writable } from "svelte/store"
// could have a store that is the brushed time region that we wait for updates on, not the wifi data?
export const wifiData = writable(null)
export const timeSelected = writable(0)
export const allDevices = writable(null)
export const timeBounds = writable([])
// set default
export const daySelected = writable(0)
export const mapData = writable(null)
export const histogramData = writable(null)
export const timeRange = writable({
    start:0,
    end:0
})
export let coordinator
//