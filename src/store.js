import {writable} from "svelte/store"
import {paulData} from "./data.js"
// could have a store that is the brushed time region that we wait for updates on, not the wifi data?
export const wifiData = writable(paulData)