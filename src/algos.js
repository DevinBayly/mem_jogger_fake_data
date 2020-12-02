// expects array of [{start:int,dur:int}...]
export let MergeInterval = (data) => {
    data.sort((a, b) => {
        return a.start > b.start
    })
    let i = 0, k = 1
    while (i < data.length) {
        let cur = data[i]
        let next = data[k]
        if (next == undefined) {
            break
        }
        //console.log("cur,",cur)
        //console.log("next",next)
        if (next.start <= (cur.start + cur.dur)) {
            //console.log("overlap",cur,next)
            if ((cur.start + cur.dur) < (next.start + next.dur)) {
                //console.log("updating")
                cur.dur = next.start - cur.start + next.dur
            }
            data.splice(k, 1)
            //console.log("data became",data)
        } else {
            k++
        }
        if (k == data.length) {
            i++
            k = i + 1
        }
    }
    return data
}
// return number of mins in nice duration
let getMinutes = d => {
    let duration = d.niceDuration.split(":").map(e => parseInt(e));
    return duration[0]*60 + duration[1];
};
// go through and make all events that are less than 5 min durations into 5 mins.
// thought is that not representing is worse than over representing
export let assignThreshold = (data) => {
    for(let e of data) {
        let mins = getMinutes(e)
        if (mins < 5) {
            //force set the nice duration
            e.niceDuration = `0:5:0`
        }
    }
}