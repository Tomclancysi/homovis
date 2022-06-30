<template>
  <div style="margin-bottom: 0">
<!--左边是2个框-->
    <MenuUI></MenuUI>
    <div class="flex-container" style="justify-content: center; align-items: center">
      <div class="font-mono">
        <el-tag type="success" style="width: 132px; height: 32px; box-sizing: content-box;">LatLng:({{this.lat.toFixed(2)}},{{this.lng.toFixed(2)}})</el-tag>
        <el-tag type="success" style="height: 32px; box-sizing: content-box;">CurrentDate:{{this.currentDate.start == this.currentDate.end ? this.currentDate.start : `${this.currentDate.start} to ${this.currentDate.end}`}}</el-tag>
      </div>
      <el-tag type="success" style="height: 32px; box-sizing: content-box">
        <span class="label font-mono" style="font-weight: bold">Mode</span>
        <el-switch
          v-model="timeAxisMode"
          active-color="#13ce66"
          inactive-color="#ff4949">
        </el-switch>
      </el-tag>
    </div>


<!--左边是地图-->
    <el-row class="row2" :gutter="10">
      <el-col :span="12">
        <div id="map" style="width: 820px; height: 820px" ref="main-map"></div>
        <TimeBrush ref="time-brush" >brush</TimeBrush>
      </el-col>

      <el-col :span="10" v-if="timeAxisMode">

        <el-row :span="24">
          <p class="block-header font-mono" >Timelines</p>
          <AxisBubble v-if="timeAxisMode" class="need-shadow" ref="axis-bubble" :addMouseMove="true" style="height: 300px"></AxisBubble>
          <p class="block-header font-mono">Query By Scratch</p>
          <LineChart v-if="timeAxisMode" class="border-base" :shown-data="this.testData" ref="line-chart" style="height: 300px">line chart1</LineChart>
          <DrawPad v-if="timeAxisMode" class="need-shadow" style="height: 233px"></DrawPad>
        </el-row>

      </el-col>
      <el-col :span="10" v-else>

        <ImageGallery class="need-shadow font-mono" ref="image-table" style="height: 750px"></ImageGallery>
        <div style="height: 30px"/>
        <!-- 下面那一栏的一些选项框Panel -->
        <div class="border-base font-mono" ref="panel" style="width: 100%; height: 140px">

          <div>
            <template>
              <i class="el-icon-setting"></i>
              <el-radio-group v-model="op">
                <el-radio label="avg">AVG</el-radio>
                <el-radio label="min">MIN</el-radio>
                <el-radio label="max">MAX</el-radio>
              </el-radio-group>
            </template>
          </div>

          <div>
            <template>
              <i class="el-icon-setting"></i>
              <el-radio-group v-model="drawType">
                <el-radio :disabled="this.disabled" label="heat">heat</el-radio>
                <el-radio :disabled="this.disabled" label="bubble">bubble</el-radio>
                <el-radio :disabled="this.disabled" label="hexbin">hexbin</el-radio>
                <el-radio :disabled="this.disabled" label="scatter">scatter</el-radio>
              </el-radio-group>
            </template>
          </div>

          <div class="slider">
            <span class="demonstration" style="font-weight: bold">brush size of heatmap</span>
            <el-slider v-model="brushSize"></el-slider>
          </div>

          <el-button type="primary" :disabled="this.disabled" :loading="this.generatingData" @click.native="generateHeatMap()">{{this.generatingData?'Loading':'GenerateHeatMap'}}</el-button>
        </div>
      </el-col>
    </el-row>


    <!-- 一些功能性的vue -->
    <CurveQuery v-if="this.queryLayer == 'QueryCurve'" :map="this.map"></CurveQuery>
    <RectSelector v-else-if="this.queryLayer == 'QueryArea'" :map="this.map" ref="rect-selector"></RectSelector>
    <RectSelector v-else-if="this.queryLayer == 'QueryAreaAtALLPos'" :map="this.map" ref="rect-selector" :mode="this.mycommon.atDiffPosition"></RectSelector>

  </div>
</template>

<script>
import * as d3 from 'd3';
window.d3 = d3
// window.onload = function (){
//   let el = document.getElementById('map')
//   let w = getComputedStyle(el,null).getPropertyValue('width')
//   console.log(`width is ${w}`)
//   el.style.height = w
// }
// import "../plugins/leaflet-d3/src/js/hexbin/HexbinLayer";
// import "heatmap.js";
import "@asymmetrik/leaflet-d3";
import '../plugins/leaflet-heat'
require("leaflet-pather")


import common from "./common";
import TimeBrush from "./TimeBrush";
import bus from "../assets/bus"
import LineChart from "./LineChart";
import RectSelector from "./RectSelector"
import MenuUI from "./MenuUI";
import DrawPad from "./DrawPad";
import AxisBubble from "./AxisBubble";
import ImageGallery from "./ImageGallery";
import CurveQuery from "./CurveQuery";
import JSZip from "jszip";
import {saveAs} from 'file-saver'


export default {
  name: "home",
  data(){
    return{
      mycommon: common,
      timeAxisMode: true,
      currentDate: {'start':'2022-03-06-00', 'end':'2022-03-06-00'},
      currentDataset: 'aqi',
      dateSet:[],
      currentType: 'heat',
      typeSet:['scatter','bubble','hexbin','heat'],
      map: null,
      data: {},
      testData: [12,23,132,54,66,33,78,11,33,66,99,44,12,23,67,123,123],
      lat: 1,
      lng: 1,
      heatLayer: null,
      hiddenCanvas: null,
      hiddenCtx: null,
      imgSize: 1024,
      showImgSize: 820,
      markerGroup: null,

      op: 'avg',
      drawType: 'heat',
      brushSize: 25,

      queryLayer: null,

      generatingData: false,
    }
  },
  computed: {
    disabled: function() {
      if(this.currentDataset !== 'covid') // 目前aqi没有原始数据
        return true
      return false
    }
  },
  created() {

  },

  mounted() {
    this.createMap()
    this.loadData()

    let st = new Date(common.getDatasetConfig('timeStart')['string'])
    let ed = new Date(common.getDatasetConfig('timeEnd')['string'])
    this.showImgSize = common.getLengthFromStyleStr(getComputedStyle(this.$refs["main-map"]).getPropertyValue('width'))
    this.hiddenCanvas = document.createElement('canvas')
    this.hiddenCanvas.width = this.imgSize //又又又又又又又又又又又一个hardcode，记得更改
    this.hiddenCanvas.height = this.imgSize
    this.hiddenCtx = this.hiddenCanvas.getContext('2d')

    this.updateHeatLayer()
    this.$refs["main-map"].addEventListener('mouseover', () => {
      this.map.dragging.disable();
    })
    this.$refs["main-map"].addEventListener('mouseout', () => {
      this.map.dragging.enable();
    })

    //menu 触发切换数据集
    bus.$on("ChangeDataset", this.flyTo)

    //TimeBrush触发UpdateDate，在这里Map需要更新展示的数据
    bus.$on("UpdateDate", (date)=>{
      this.currentDate = date // 起始终止日期
      console.log(this.currentDate)
      //请求图片更换热力图 底图！
      let url = common.queryDateRange(date)
      this.$axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*'
      this.$axios.get(url).then(json => {
        console.log(json)
        let heatLayer = this.heatLayer
        let data = json.data // 包含 url status similar path
        // 请求给的这个链接,拿到底层pixel数组，换一下热力图底图
        // 开始一坨极其冗余的代码，这属实南辕北辙了
        let img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = (() => {
          // 再把这个img搞到canvas上获取pixel数组，最后pixel数组colorlize，放到热力图上
          this.hiddenCtx.drawImage(img, 0, 0)
          let offset = (this.imgSize - this.showImgSize) / 2
          let imgData = this.hiddenCtx.getImageData(offset, offset, this.showImgSize, this.showImgSize)
          // 或许直接把这玩意清理一下发过去算了吧，changeGrayData 接受的就是没有着色的imgdata
          for(let i = 0; i < imgData.data.length; i += 4){
            imgData.data[i+3] = imgData.data[i]
            imgData.data[i] = imgData.data[i+1] = imgData.data[i+2] = 0
          }
          // console.log(heatLayer, heatLayer.changeGrayData)
          heatLayer.changeGrayData(imgData)
        }).bind(this)
        img.src = data.url
      })
    })

    // 更改时序曲线的展示方式
    bus.$on("WhoCanShowThis", (json)=>{
      // 在地图上添加marker
      let idx = 0
      this.markerGroup.clearLayers()
      for(let k in json) {
        let p = L.point(k % this.imgSize, k / this.imgSize)
        let latlng = this.map.layerPointToLatLng(p)
        const myCustomColour = common.colorTheme[idx++]

        const markerHtmlStyles = `
            background-color: ${myCustomColour};
            opacity: 0.5;
            width: 3rem;
            height: 3rem;
            display: block;
            left: -1.5rem;
            top: -1.5rem;
            position: relative;
            border-radius: 3rem 3rem 0;
            transform: rotate(45deg);
            border: 1px solid #FFFFFF`

        const myIcon = L.divIcon({
          className: "my-custom-pin",
          iconAnchor: [0, 24],
          labelAnchor: [-6, 0],
          popupAnchor: [0, -36],
          html: `<span style="${markerHtmlStyles}"></span><span style="color: orange;display: inline-block; font-size: 40px; position: absolute;left: 0; top: 0">${idx}</span>`
        })
        let marker = L.marker(latlng, {
          icon: myIcon
        })
        this.markerGroup.addLayer(marker)
      }


      // this.$refs["axis-bubble"].setData(json, [st, ed])
      // this.$refs["axis-bubble"].draw()

      this.$refs["line-chart"].shownData = json
      this.$refs["line-chart"].draw()
    })

    bus.$on('PutToAxisBubble', (json)=>{
      if(this.$refs["axis-bubble"]) {
        this.$refs["axis-bubble"].setData(json, common.getTimeRange())
        this.$refs["axis-bubble"].draw()
      }
    })

    // 用heatmap渲染一下小图，然后交给table展示
    bus.$on("RenderAndShowSimilarDatesLooks", (json)=>{
      console.log({
        json,
        'info': 'show the table data!'
      })
      let tableData = []
      let {distance, similar_pth, final_dist, similar_pth_large, position} = json
      for(let i = 0; i < distance.length; ++i){
        tableData.push({
          'id': i+1,
          'distance': json['distance'][i].toFixed(2),
          'similar_pth': json['similar_pth'][i],
          'similar_pth_large': [],// 必须是数组，暂时设置为空 先渲染好再放上去
          'date': /\d+\-\d+\-\d+\-\d+/.exec(json['similar_pth'][i])
        })
      }
      // this.$refs["time-brush"].finalDist = final_dist
      // this.$refs["time-brush"].createTimeBrush()
      this.$refs["image-table"].draw(final_dist)
      this.$refs["image-table"].tableData = tableData // 更新table
      //预览图colorize
      window.imgs = []; for(let i = 0; i < distance.length; ++i)window.imgs[i] = new Image()
      window.imgs1 = []; for(let i = 0; i < distance.length; ++i)window.imgs1[i] = new Image()
      for(let i = 0; i < distance.length; ++i){
        let img = window.imgs1[i]
        img.onload = async ()=>{
          // debugger
          let canvas = document.createElement('canvas')
          canvas.width = canvas.height = img.width
          let ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          let imgData = ctx.getImageData(0, 0, this.imgSize, this.imgSize)
          let d = imgData.data
          for(let i = 0; i < d.length; i += 4){
            d[i+3] = d[i] // 强度代表透明度
            d[i] = d[i+1] = d[i+2] = 0
          }
          this.heatLayer.colorize(imgData.data)

          ctx.putImageData(imgData, 0, 0)
          let dataurl = canvas.toDataURL()
          // 如何找到相应行set 直接修改数据 利于它的响应式？
          this.$refs["image-table"].tableData[i]['similar_pth'] = dataurl
        }
        img.crossOrigin = 'anonymous'
        img.src = similar_pth[i]
      }
      for(let i = 0; i < distance.length; ++i){
        let img = window.imgs[i]
        let pos = null
        if (position)
          pos = position[i]
        // document.body.appendChild(img) // 图片加载正常
        img.onload = async ()=>{
          // debugger
          let canvas = document.createElement('canvas')
          canvas.width = canvas.height = this.imgSize
          let ctx = canvas.getContext('2d')
          // 读取pixel， image load
          ctx.drawImage(img, 0, 0)
          let imgData = ctx.getImageData(0, 0, this.imgSize, this.imgSize)
          let d = imgData.data
          let counter = []; for(let t = 0; t < 256; ++t)counter[t] = 0;
          for(let i = 0; i < d.length; i += 4){
            counter[d[i]] += 1
            d[i+3] = d[i] // 强度代表透明度
            d[i] = d[i+1] = d[i+2] = 0
          }
          this.heatLayer.colorize(imgData.data)
          if(pos){ // 绘制矩形框this.imgSize
            let [left, bottom, right, top] = pos
            ctx.putImageData(imgData, 0, 0)
            ctx.lineWidth = 3
            ctx.strokeStyle = 'red'
            ctx.strokeRect(left*16, bottom*16, (right-left)*16, (top-bottom)*16)
            imgData = ctx.getImageData(0, 0, this.imgSize, this.imgSize)
            d = imgData.data
          }
          // console.log(counter)
          // ctx.clearRect(0,0,this.imgSize,this.imgSize)
          // ctx.putImageData(await common.getMapContainer(), 0, 0) // 这是putImageData直接修改了底层数据，怪不得没有blend的效果，可能那样要调用drawImage api
          let bg = await common.getMapContainer(), alpha, beta // background map
          function clip(a, b, c){
            return Math.min(Math.max(a, b), c)
          }
          for(let i = 0; i < d.length; i += 4){ // cpu大循环 又笨又慢 垃圾极了
            alpha = d[i + 3] / 255
            beta = 1 - alpha
            d[i]   = clip(d[i]   * alpha + bg[i]   * beta, 0, 255)
            d[i+1] = clip(d[i+1] * alpha + bg[i+1] * beta, 0, 255)
            d[i+2] = clip(d[i+2] * alpha + bg[i+2] * beta, 0, 255)
            d[i+3] = 255 // 一定要加上！！！ 细节太多了
          }
          ctx.putImageData(imgData, 0, 0)
          // if(Math.random() < 0.2)
          //   console.log(imgData)
          let dataurl = canvas.toDataURL()
          // 如何找到相应行set 直接修改数据 利于它的响应式？
          this.$refs["image-table"].tableData[i]['similar_pth_large'] = [dataurl]
        }
        img.crossOrigin = 'anonymous'
        img.src = similar_pth_large[i]
      }
      // 预览图colorize
      // for(let i = 0; i < distance.length; ++i){
      //   var img = new Image()
      //   img.onload = ()=>{
      //     let canvas = document.createElement('canvas')
      //     canvas.width = canvas.height = 64
      //     let ctx = canvas.getContext('2d')
      //     // 读取pixel， image load
      //     ctx.drawImage(img, 0, 0)
      //     let imgData = ctx.getImageData(0, 0, 64, 64)
      //     let d = imgData.data
      //     let s = new Uint8ClampedArray(imgData.data.length / 4)
      //     for(let i = 0, j = 0; i < d.length; i += 4, ++j){
      //       s[j] = d[i]
      //       d[i+3] = parseInt((Number(d[i]) + d[i+1] + d[i+2]) * 0.333334)
      //       d[i] = d[i+1] = d[i+2] = 0
      //     }
      //     this.heatLayer.colorize(imgData.data)
      //     ctx.putImageData(imgData, 0, 0)
      //     for(let i = 0; i < d.length; i += 4){
      //       d[i+3] = 255 // 透明度重新设置 透明度与亮度大小成比例？
      //     }
      //     if(Math.random() < 0.3)
      //       console.log(d)
      //     let dataurl = canvas.toDataURL()
      //     // 如何找到相应行set 直接修改数据 利于它的响应式？
      //     this.$refs["image-table"].tableData[i]['similar_pth'] = dataurl
      //   }
      //   img.crossOrigin = 'anonymous'
      //   img.src = similar_pth[i]
      // }

    })
  },
  destroyed() {
    bus.$off('ChangeDataset')
    bus.$off('UpdateDate')
    bus.$off('WhoCanShowThis')
    bus.$off("RenderAndShowSimilarDatesLooks")
    bus.$off('PutToAxisBubble')
  },
  methods:{
    updateHeatLayer(){
      if(this.heatLayer)
        this.dataLayerGroup.removeLayer(this.heatLayer)
      let colormap = common.getDatasetConfig('colormap')
      let newcolormap = {}
      let keys = Object.keys(colormap)
      for(let i = 0; i < keys.length; ++i) {
        newcolormap[Number(keys[i])] = colormap[keys[i]]
      }
      let heatLayer = L.heatLayer(
        [],
        {
          radius: this.brushSize || 25,
          // gradient:{0.2: tempColor[0], 0.4: tempColor[1],
          //   0.6: tempColor[2], 0.8: tempColor[3], 1: tempColor[4]},
          gradient:newcolormap,
          max: 0.2,
          // blur: 20,
        }
      )//.addTo(this.map);

      this.dataLayerGroup.addLayer(heatLayer)
      this.heatLayer = heatLayer
    },
    generateHeatMap(){
      console.log('[Generate HeatMap]:', this.dateSet)
      window.generatingHeatMap = this.generatingData = true
      var zip = new JSZip()
      let colormap = common.getDatasetConfig('colormap')
      let newcolormap = {}
      let keys = Object.keys(colormap)
      for(let i = 0; i < keys.length; ++i) {
        newcolormap[Number(keys[i])] = colormap[keys[i]]
      }
      // test
      let idx = 0
      for(let key of this.dateSet){
        let heatLayer = L.heatLayer(
          this.data[key],
          {
            radius: this.brushSize || 25,
            gradient:newcolormap,
            max: 0.2,
          }
        ).addTo(this.map);
        zip.file(`${key}.png`, window.imgData.substr(22), {base64: true})
        this.map.removeLayer(heatLayer)
      }
      zip.generateAsync({type:"blob"})
        .then(function(content) {
          // see FileSaver.js
          saveAs(content, "dataset.zip");
        });
      window.generatingHeatMap = this.generatingData = false
    },
    dateChange(val){
      this.currentDate=val
      this.draw(this.currentDate,this.currentType)
    },
    typeChange(val){
      this.currentType=val
      this.map.remove()
      this.createMap()
      this.$refs["rect-selector"].setMap(this.map)
      this.draw(this.currentDate,this.currentType)
    },
    createMap(){
      /* 设置能够移动的范围
        var southWest = L.latLng(40.712, -74.227),
        northEast = L.latLng(40.774, -74.125),
        bounds = L.latLngBounds(southWest, northEast);

        var map = L.map('map', {
            maxBounds: bounds,   // Then add it here..
            maxZoom: 19,
            minZoom: 10
        });
       */
      let mapConfig = common.getDatasetConfig('map')
      this.map = L.map('map',{
        // 这就需要设置好center，zoom，然后锁定住不移动
        center: [mapConfig['centerLat'], mapConfig['centerLng']],
        zoom: mapConfig['zoom'],
        zoomControl: false,
        doubleClickZoom: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        zoomSnap: 0
      });
      L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        //id: 'mapbox/streets-v11',
        // id: 'mapbox/dark-v10',
         id: 'mapbox/light-v10',
      }).addTo(this.map);
      this.map.on('mousemove', (e)=> {
        // console.log(e.latlng)
        // debugger
        // console.log(this.lat, this.lng)
        this.lat = e.latlng.lat
        this.lng = e.latlng.lng
      })

      this.dataLayerGroup = new L.layerGroup().addTo(this.map)
      this.markerGroup = new L.layerGroup().addTo(this.map)
      window.map = this.map
    },
    loadData(){
      let t = require('../../static/data/temp.json');
      for (let i=0;i<t.length;i++){
        if (!(t[i].time in this.data)){
          this.dateSet.push(t[i].time)
          this.data[t[i].time]=[]
        }
        this.data[t[i].time].push([t[i].lat,t[i].lng])
      }
      this.dateSet.sort()
    },
    draw(date,type){// L 负责创建对象，添加到addTo map对象上面去
      // 有的数据精确到2小时，有的只是一天
      let l = Object.keys(this.data)[0].length
      date = date.substr(0, l)
      let data=this.data[date]
      // 绘制的时候都是新建一个层，在这里remove之前的层，合理
      let dataLayerGroup = this.dataLayerGroup;
      dataLayerGroup.clearLayers()
      if (type==='scatter'){
        let circle
        for (let i=0;i<data.length;i++){
          circle = L.circle(data[i],300,{
            color: '#b43232',
            fillColor: '#b43232',
            weight: 1.5,
            fillOpacity: 1,
            opacity: 1,
          })//.addTo(this.map);
          dataLayerGroup.addLayer(circle)
        }
      }
      else if (type==='bubble'){
        let circle;
        //method1 圆的大小都一样 气泡形式
        // for (let i=0;i<data.length;i++){
        //   circle = L.circleMarker(data[i], {
        //     color: '#b43232',
        //     fillColor: '#b43232',
        //     weight: 1.5,
        //     opacity: 0.5,
        //     fillOpacity: 0.5,
        //     radius: 5
        //   }).addTo(this.map);
        // }

        //method2 圆的大小代表密度
        let s=50//行
        let m=50//列
        let mxLat = d3.max(data, function(d) { return +d[0];} );
        let mnLat = d3.min(data, function(d) { return +d[0];} );
        let mxLon = d3.max(data, function(d) { return +d[1];} );
        let mnLon = d3.min(data, function(d) { return +d[1];} );
        let stepLat=(mxLat-mnLat)/m
        let stepLon=(mxLon-mnLon)/s
        let temp=[]
        for (let i=0;i<s;i++){
          for (let j=0;j<m;j++){
            temp.push(0)
          }
        }

        for (let i=0;i<data.length;i++) {
          let d = data[i]
          let k,j
          k=Math.floor((d[0]-mnLat)/stepLat)
          j=Math.floor((d[1]-mnLon)/stepLon)
          temp[k*m+j]+=1
        }

        let max = d3.max(temp, function(d) { return +d;} );
        let min = d3.min(temp, function(d) { return +d;} );

        let scaleLiner = d3.scaleSqrt()
          .domain([min, max])
          .range([5,s]);

        for (let i=0;i<s;i++){
          for (let j=0;j<m;j++){
            let t=i*m+j
            if (temp[t]!==0){
              circle = L.circleMarker([mnLat+i*stepLat, mnLon+j*stepLon], {
                color: '#b43232',
                fillColor: '#b43232',
                weight: 1.5,
                opacity: 0.5,
                fillOpacity: 0.5,
                radius: scaleLiner(temp[t])/5
              })//.addTo(this.map);
              dataLayerGroup.addLayer(circle)
            }
          }
        }
      }
      else if (type==='hexbin'){
        let temp=[]
        for (let i=0;i<data.length;i++) {
          temp.push([data[i][1], data[i][0]])
        }

        let hexLayer = L.hexbinLayer({
          radius : 11,
          opacity: 0.8,
          colorRange: ['#ffbebe','#6d1985'],
          // colorScaleExtent: [ 1,20 ]
        })//.addTo(this.map)
        dataLayerGroup.addLayer(hexLayer)
        hexLayer
          .radiusRange([11, 11])
          .colorValue(function(d) { return d.length; })
          .radiusValue(function(d) { return d.length; });
        hexLayer.data(temp);
      }
      else if (type==='heat'){
        // 先把key从字符串转成float
        let colormap = common.getDatasetConfig('colormap')
        let newcolormap = {}
        let keys = Object.keys(colormap)
        for(let i = 0; i < keys.length; ++i) {
          newcolormap[Number(keys[i])] = colormap[keys[i]]
        }

        let heatLayer = L.heatLayer(
          data,
          {
            radius: this.brushSize || 25,
            gradient:newcolormap,
            max: 0.2,
            // blur: 20,
          }
        )
        dataLayerGroup.addLayer(heatLayer)
        window.heatLayer = heatLayer
        this.heatLayer = heatLayer
      }
    },
    flyTo(){
      let mapConfig = common.getDatasetConfig('map')
      console.log('flying to new pos', common.currentDataset,[mapConfig['centerLat'], mapConfig['centerLng']], mapConfig['zoom'])
      this.currentDataset = common.getCurrentDataset()
      this.markerGroup.clearLayers()
      this.updateHeatLayer()
      this.map.flyTo([mapConfig['centerLat'], mapConfig['centerLng']], mapConfig['zoom'])
    },
    renderImageFromUrl(url, resolver){
      let img = new Image()
      img.onload = async ()=>{
        let canvas = document.createElement('canvas')
        canvas.width = canvas.height = img.width
        let ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        let imgData = ctx.getImageData(0, 0, img.width, img.height)
        let d = imgData.data
        for(let i = 0; i < d.length; i += 4){
          d[i+3] = d[i] // 强度代表透明度
          d[i] = d[i+1] = d[i+2] = 0
        }
        this.heatLayer.colorize(imgData.data)

        ctx.putImageData(imgData, 0, 0)
        let dataurl = canvas.toDataURL()
        // 如何找到相应行set 直接修改数据 利于它的响应式？
        // this.$refs["image-table"].tableData[i]['similar_pth'] = dataurl
        resolver(dataurl)
      }
      img.crossOrigin = 'anonymous'
      img.src = similar_pth[i]
    }
  },
  components:{
    CurveQuery,
    ImageGallery,
    AxisBubble,
    DrawPad,
    MenuUI,
    LineChart,
    TimeBrush,
    RectSelector,
  },
  watch:{
    brushSize: function (){
      if(this.drawType == 'heat')
        this.draw(this.currentDate.start, 'heat')
    },
    drawType: function (){
      this.draw(this.currentDate.start, this.drawType)
    },
    op: function (){
      common.setOp(this.op)
    },
    timeAxisMode: function (newVal){
      this.markerGroup.clearLayers()
    }
  }
}
</script>

<style scoped>
.flex-container{
  display: flex;
  grid-gap: 0.5rem;
  gap: 0.5rem;
}
.need-shadow {
  box-shadow: 0 8px 17px 0 rgba(0, 0, 0, 0.2),
  0 6px 20px 0 rgba(0, 0, 0, 0.19);
}
.block-header {
  border-radius: 0.25rem;
  font-size: 20px;
  border: 1px solid rgba(156, 163, 175, 0.5);
  padding-top: 10px;
  padding-bottom: 10px;
  background-color: rgba(156, 163, 175, 0.15);
}
.border-base{
  border: 1px solid rgba(156, 163, 175, 0.5);
}
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
