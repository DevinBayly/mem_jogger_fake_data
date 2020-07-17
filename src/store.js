import { writable } from "svelte/store"
// could have a store that is the brushed time region that we wait for updates on, not the wifi data?
export const wifiData = writable(null)
export const timeSelected = writable(0)
export const allDevices = writable({})
export const timeBounds = writable([])
// set default
export const daySelected = writable(0)
export const mapData = writable(null)
export const histogramData = writable(null)
export let coordinator
fetch("revised.json").then(res => res.json()).then(data => {
    coordinator = writable({ data, trigger: "", time: "" })
    coordinator.subscribe(async value => {
        // create new trigger
        if (value.trigger == "calendar") {
            // we must update the whole application's data and basically reload
            console.log("updating data via calendar")
            // make sure to remove the unexpected eventData nesting 
            let newData = {}
            for (let i = 0; i < value.data.length;i++){
                let buildings =[]
                newData[i] = buildings
                for (let j = 0 ; j < value.data[i].length;j++){
                    let minuteData = value.data[i][j].eventData
                    // make minute data == epoch ms scale
                    minuteData._time *=1000
                    buildings.push( minuteData)
                }
            }

            data = newData

            mapData.set(data[0])
            histogramData.set(data)
        }
        if (value.trigger == "brush") {
            // expect an array of permitted time indices
            let selectedData = []
            for (let key of value.time) {
                selectedData.push(data[key])
            }
            histogramData.set(selectedData)
        } else if (value.trigger == "cursor") {
            mapData.set(data[value.time])
        }
    })
    mapData.set(data[0])
    histogramData.set(data)
})