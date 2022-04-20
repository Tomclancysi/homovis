<template>

</template>

<script>
// 定义全局变量和方法
let datasetsConfig = require('../../static/data/datasetsConfig.json')
let datasetNames = Object.keys(datasetsConfig)
let datasetNum = datasetNames.length

let currentDate = {start: null, end: null}
let currentDataset = 'aqi'
let op = 'avg'
let drawType = 'heat'

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
  colorTheme: [
    "#1f77b4",
    // "#aec7e8",
    "#ff7f0e",
    // "#ffbb78",
    "#2ca02c",
    // "#98df8a",
    "#d62728",
    // "#ff9896",
    "#9467bd",
    "#c5b0d5",
    // "#1f77b4",
    // "#aec7e8",
    "#ff7f0e",
    "#ffbb78",
    "#2ca02c",
    "#98df8a",
    "#d62728",
    "#ff9896",
    "#9467bd",
    "#c5b0d5"
  ],

  setCurrentDataset,
  getCurrentDataset,
  setCurrentDate,
  getCurrentDate,
  setOp,
  getOp,
  setDrawType,
  getDrawType,

  queryDateRange(Date){
    // console.log(getCurrentDate(), getCurrentDataset())
    return `/query/requestrange?start_date=${Date.start}&end_date=${Date.end}&op=${this.getOp()}&dataset=${getCurrentDataset()}`
  },
  queryRectAreaSimilar(minx, maxx, miny, maxy){// 在这里直接就转成了后端对应的位置，这不合理
    let date = getCurrentDate()
    return `/query/requestrect?start_date=${date.start}&end_date=${date.end}&minx=${minx}` +
           `&miny=${miny}&maxx=${maxx}&maxy=${maxy}&dataset=${getCurrentDataset()}`;
  },
  queryTimeLineSimilar(){
    // 这里需要用post请求
    return `/query/api/findsimilarline?dataset=${this.currentDataset}`
  },
  dateFormatter, // 格式化str



  getDatasetConfig(opt){
    try{// 不加this的话，currentDataset应该捕捉的是上面定义的那个，后面修改import的输入，是一个引用而不是直接修改上面的本体，这导致什么问题呢？这个永远不会改变！
      return datasetsConfig[getCurrentDataset()][opt]
    }catch (e){
      throw new Error(`dataset property ${opt} is not defined`)
    }
  },
}
</script>

<style scoped>

</style>
