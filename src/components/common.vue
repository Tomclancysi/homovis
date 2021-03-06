<template>

</template>

<script>
import axios from 'axios'
import * as d3 from "d3";

// 定义全局变量和方法
let datasetsConfig = require('../../static/data/datasetsConfig.json')
let datasetNames = Object.keys(datasetsConfig)
let datasetNum = datasetNames.length

let currentDate = {start: null, end: null}
let currentDataset = 'aqi'
let op = 'avg'
let drawType = 'heat'
let mapContainer = {}
window.maps = mapContainer

const atSamePosition = 1
const atDiffPosition = 2

async function getMapContainer(){
  if(mapContainer[currentDataset] !== undefined)
    return mapContainer[currentDataset] // 返回一个uint8 array
  // 这时候手动请求那玩意，然后在获取数组
  var img = new Image()
  img.src = datasetsConfig[currentDataset]['mapUrl']
  img.crossOrigin = 'anonymous'
  await new Promise((resolve, reject) => {
    img.onload = function (){
      let canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1024
      let ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      let imgData = ctx.getImageData(0, 0, 1024, 1024)
      mapContainer[currentDataset] = imgData.data
      // console.log('HELP ME!\n', {imgData})
      resolve() // 当回调函数执行结束之后 promise满足条件，然后自然就同步了
    }
  })
  return mapContainer[currentDataset]
}

function setCurrentDataset(dataset){
  // 对于全局变量，如果我们要修改以及使用的话，要注意使用getter setter方法，否则可能修改的只是个指针，而不是真实值！！类似python对实参修改
  currentDataset = dataset
}
function getCurrentDataset(){
  return currentDataset
}

function setCurrentDate(date){
  currentDate.start = date.start
  currentDate.end = date.end
}
function getCurrentDate(){
  return {...currentDate}
}

function setOp(o){
  op = o
}
function getOp(){
  return op || 'avg'
}

function setDrawType(o){
  drawType = o
}
function getDrawType(){
  return drawType || 'heat'
}

function getLengthFromStyleStr(str){
  if(!str)
    return 0
  if(str.indexOf('px') != -1)
    return Number(str.substr(0, str.length - 2))
  else if(str.indexOf('rem') != -1)
    return Number(str.substr(0, str.length - 3)) * 16
}

let dateFormatter = (date)=>{
  let y = date.getFullYear()
  let m = date.getMonth() + 1
  m = m < 10 ? '0' + String(m) : String(m)
  let d = date.getDate()
  d = d < 10 ? '0' + String(d) : String(d)
  let h = date.getHours()
  h = h < 10 ? '0' + String(h) : String(h)
  return `${y}-${m}-${d}-${h}`
}


export default {
  name: "common",
  currentDataset, // 当前数据集
  datasetNames, // 所有数据集的名字
  datasetNum, // 数据集的个数
  currentDate, // 每次修改的时候修改其成员0 1，而不是替换成新的数组
  op,
  drawType,
  atSamePosition,
  atDiffPosition,

  colorTheme: [
    "#63b2ee",
    "#76da91",
    "#f8cb7f",
    "#f89588",
    "#7cd6cf",
    "#9192ab",
    "#7898e1",
    "#efa666",
    "#eddd86",
    "#9987ce",
    "#63b2ee",
    "#76da91"
  ],

  getMapContainer,
  setCurrentDataset,
  getCurrentDataset,
  setCurrentDate,
  getCurrentDate,
  setOp,
  getOp,
  setDrawType,
  getDrawType,
  getLengthFromStyleStr,

  queryDateRange(Date){
    // console.log(getCurrentDate(), getCurrentDataset())
    return `/query/requestrange?start_date=${Date.start}&end_date=${Date.end}&op=${this.getOp()}&dataset=${getCurrentDataset()}`
  },
  queryRectAreaSimilar(minx, maxx, miny, maxy){// 在这里直接就转成了后端对应的位置，这不合理
    let date = getCurrentDate()
    return `/query/requestrect?start_date=${date.start}&end_date=${date.end}&minx=${minx}` +
           `&miny=${miny}&maxx=${maxx}&maxy=${maxy}&dataset=${getCurrentDataset()}`;
  },
  queryTemplateMatch(minx, maxx, miny, maxy){
    let date = getCurrentDate()// 返回所有的匹配位置，它的时间和空间
    return `/query/templatematch?start_date=${date.start}&end_date=${date.end}&minx=${minx}` +
      `&miny=${miny}&maxx=${maxx}&maxy=${maxy}&dataset=${getCurrentDataset()}`;
  },

  queryTimeLineSimilar(){
    // 这里需要用post请求
    return `/query/api/findsimilarline?dataset=${getCurrentDataset()}`
  },
  queryRegionCluster(minx, maxx, miny, maxy){
    return `/query/api/regioncluster?minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}&dataset=${getCurrentDataset()}`
  },
  queryTimelineOfPoint(){
    return `/query/api/timelineofpoint?dataset=${getCurrentDataset()}`
  },
  dateFormatter, // 格式化str



  getDatasetConfig(opt){
    try{// 不加this的话，currentDataset应该捕捉的是上面定义的那个，后面修改import的输入，是一个引用而不是直接修改上面的本体，这导致什么问题呢？这个永远不会改变！
      return datasetsConfig[getCurrentDataset()][opt]
    }catch (e){
      throw new Error(`dataset property ${opt} is not defined`)
    }
  },
  getTimeRange(){
    let st = new Date(this.getDatasetConfig('timeStart')['string'])
    let ed = new Date(this.getDatasetConfig('timeEnd')['string'])
    return [st, ed];
  },
  getInterval(){
    let inter = this.getDatasetConfig("interval"), interval, tickInterval
    if(inter.endsWith('hour')){
      interval = d3.timeHour.every(parseInt(inter.substr(0, inter.indexOf(' ')))) // 相邻两帧的时间间隔
      // tickInterval = d3.timeWeek.every(1)
    }
    else if(inter.endsWith('day')){
      interval = d3.timeDay.every(parseInt(inter.substr(0, inter.indexOf(' ')))) // 相邻两帧的时间间隔
      // tickInterval = d3.timeMonth.every(3) // tick的间隔
    }
    else if(inter.endsWith('month')){
      interval = d3.timeMonth.every(parseInt(inter.substr(0, inter.indexOf(' ')))) // 相邻两帧的时间间隔
      // tickInterval = d3.timeYear.every(1) // tick的间隔
    }
    return interval
  }
}
</script>

<style scoped>

</style>
