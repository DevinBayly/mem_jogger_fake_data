connectionData = d => {
      // calculate in ms the data in niceDuration
      let parts = d.niceDuration.split(":").map(e => parseInt(e));
      // hour,minute,second, want in ms as that's the getTime resolution
      let totalDuration =
        (parts[0] * 60 * 60 + parts[1] * 60 + parts[2]) * 1000;
      // 15minutes in ms
      if (totalDuration < 15 * 60 * 1000) {
        //console.error("duration is less than 15 mins for ", d);
      }
      return { start: d._time, dur: totalDuration };
    }

MakeFiltered = (ogdata)=> {
  let data = [... ogdata]
  // create a building dictionary
  let buildingsMap = {}
  for (let e of data) {
    if (buildingsMap[e.apBuildingNumber] == undefined) {
      buildingsMap[e.apBuildingNumber] = [connectionData(e)]
    } else {
      buildingsMap[e.apBuildingNumber].push(connectionData(e))
    }
  }
  console.log({...buildingsMap})
  // merge each buildings data , and export a flat array of the buildings again
  let finalArray = []
  for(let bnum in buildingsMap) {
    let times = buildingsMap[bnum]
    // use the mergea algorithm, actually modifies building map
    MergeInterval(times)
    // concatenate new merged building data back in
    finalArray = [... finalArray, ... times.map(e=> {
      let niceDur = `${Math.floor(
                e.dur / (1000 * 60 * 60)
              )}:${Math.floor((e.dur / (1000 * 60)) % 60)}:${Math.floor(
                (e.dur / 1000) % 60
      )}`
      return {_time:e.start,apBuildingNumber:bnum,niceDuration:niceDur}
    })]
  }
  console.log(buildingsMap)
  console.log(finalArray)
  

}
MakeFiltered(data.map(e=> e.eventData))