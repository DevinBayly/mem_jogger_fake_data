import {writable} from "svelte/store"
// could have a store that is the brushed time region that we wait for updates on, not the wifi data?
// slightly transform paulData
export const wifiData = writable(null)
export const timeSelected = writable(0)
export const allDevices = writable({})
export const timeBounds = writable([])
// set default
export const daySelected = writable(0)