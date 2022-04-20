<template>
  <div style="margin-bottom: 0">
<!--左边是2个框-->
    <MenuUI></MenuUI>
    <el-row :gutter="20" class="row1">
<!--      <el-col :span="6" style="padding: 4px">-->
<!--      <div style="text-align: center;margin-top: 5%;margin-bottom: 5%">-->
<!--        <el-select v-model="currentDate" @change="dateChange" size="large">-->
<!--          <el-option-->
<!--            v-for="(item,index) in dateSet"-->
<!--            :key="index"-->
<!--            :label="item.toString()"-->
<!--            :value="item">-->
<!--          </el-option>-->
<!--        </el-select>-->
<!--      </div>-->
<!--    </el-col>-->

<!--    <el-col :span="6" style="padding: 4px">-->
<!--      <div style="text-align: center;margin-bottom: 5%;margin-bottom: 5%">-->
<!--        <el-select v-model="currentType" @change="typeChange" size="large">-->
<!--          <el-option-->
<!--            v-for="(item,index) in typeSet"-->
<!--            :key="index"-->
<!--            :label="item.toString()"-->
<!--            :value="item">-->
<!--          </el-option>-->
<!--        </el-select>-->
<!--      </div>-->
<!--      </el-col>-->

      <el-col :span="6">
        <el-tag type="success">经度： {{this.lng.toFixed(2)}}</el-tag>
        <el-tag type="success">纬度： {{this.lat.toFixed(2)}}</el-tag>
      </el-col>
      <el-col :span="3" class="current-date-range">
        <el-tag type="success">日期：{{this.currentDate.start == this.currentDate.end ? this.currentDate.start : `${this.currentDate.start} to ${this.currentDate.end}`}}</el-tag>
      </el-col>

    </el-row>


<!--左边是地图-->
    <el-row class="row2">
      <el-col :span="12" style="padding: 4px">
        <div style="height: 1024px; width: 1024px; background-color: #42b983;">
          <div id="map" style="width: 100%;height: 100%" ref="main-map"></div>
        </div>
      </el-col>
      <!--在地图的右边就是几个量表了-->
      <el-col v-if="this.timeAxisMode" :span="12">
        <!--第一行做什么-->
        <el-row :gutter="20" style="width: 500px; height: 200px">
          <LineChart  :shown-data="this.testData" ref="line-chart">line chart1</LineChart>
        </el-row>
        <!--第二行做什么-->
        <!--在这个地方设置宽度高度是否有意义？？？-->
        <el-row style="width: 500px; height: 200px">
          <AxisBubble ref="axis-bubble"></AxisBubble>
        </el-row>

        <el-row :gutter="20" style="width: 500px; height: 200px">
          <DrawPad></DrawPad>
        </el-row>

        <el-row>
          <ImageGallery ref="image-table" style="width: 500px"></ImageGallery>
        </el-row>
      </el-col>
    </el-row>

    <el-row class="row3">
      <el-col :span="12">
        <TimeBrush ref="time-brush">5LiA5Z2o6IO96LeR5b6XIGEgcnVubmluZyBzaGl0</TimeBrush>
      </el-col>
      <el-col :span="6">
        <div ref="panel">

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
            <span class="demonstration">brush size of heatmap</span>
            <el-slider v-model="brushSize"></el-slider>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="6">
      <RectSelector :map="this.map" ref="rect-selector">test</RectSelector>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as d3 from 'd3';
// import "../plugins/leaflet-d3/src/js/hexbin/HexbinLayer";
// import "heatmap.js";
import "@asymmetrik/leaflet-d3";
import '../plugins/leaflet-heat'
import "leaflet-pather"
import axios from "axios"

import common from "./common";
import TimeBrush from "./TimeBrush";
import bus from "../assets/bus"
import LineChart from "./LineChart";
import RectSelector from "./RectSelector"
import MenuUI from "./MenuUI";
import DrawPad from "./DrawPad";
import AxisBubble from "./AxisBubble";
import ImageGallery from "./ImageGallery";



export default {
  name: "home",
  data(){
    return{
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
      markerGroup: null,

      op: 'avg',
      drawType: 'heat',
      brushSize: 25,

      queryLayer: null
    }
  },
  computed: {
    disabled: function() {
      if(this.currentDataset === 'aqi') // 目前aqi没有原始数据
        return true
      return false
    }
  },
  created() {

  },
  mounted() {
    this.createMap()
    this.$refs["rect-selector"].setMap(this.map)
    this.loadData()
    //this.draw(this.currentDate,this.currentType)
    // 测试bubble map用的
    let st = new Date(common.getDatasetConfig('timeStart')['string'])
    let ed = new Date(common.getDatasetConfig('timeEnd')['string'])

    this.$refs["axis-bubble"].setData(this.testData, [st, ed])
    this.$refs["axis-bubble"].draw()

    this.hiddenCanvas = document.createElement('canvas');
    this.hiddenCanvas.width = 1024; //又又又又又又又又又又又一个hardcode，记得更改
    this.hiddenCanvas.height = 1024;
    this.hiddenCtx = this.hiddenCanvas.getContext('2d')

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
      axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*'
      axios.get(url).then(json => {
        console.log(json)
        let heatLayer = this.heatLayer
        let data = json.data // 包含 url status similar path
        // 请求给的这个链接,拿到底层pixel数组，换一下热力图底图
        // 开始一坨极其冗余的代码，这属实南辕北辙了
        let img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          // 再把这个img搞到canvas上获取pixel数组，最后pixel数组colorlize，放到热力图上
          this.hiddenCtx.drawImage(img, 0, 0)
          let imgData = this.hiddenCtx.getImageData(0, 0, this.hiddenCanvas.width, this.hiddenCanvas.height)
          // 或许直接把这玩意清理一下发过去算了吧，changeGrayData 接受的就是没有着色的imgdata
          for(let i = 0; i < imgData.data.length; i += 4){
            imgData.data[i+3] = imgData.data[i]
            imgData.data[i] = imgData.data[i+1] = imgData.data[i+2] = 0
          }
          console.log(heatLayer, heatLayer.changeGrayData)
          heatLayer.changeGrayData(imgData)
        }
        img.src = data.url

        // axios
        //   .get(data.url, {
        //     responseType: 'arraybuffer',
        //   })
        //   .then((response) => {
        //     console.log(response)
        //     return  window.URL.createObjectURL(new Blob(response.data));
        //   })
        //   .then(dataurl => {
        //     let img = new Image()
        //     img.onload = ()=>{
        //       // 再把这个img搞到canvas上获取pixel数组，最后pixel数组colorlize，放到热力图上
        //       this.hiddenCtx.drawImage(img, 0, 0)
        //       let imgData = this.hiddenCtx.getImageData(0, 0, this.hiddenCanvas.width, this.hiddenCanvas.height)
        //       // 或许直接把这玩意清理一下发过去算了吧，changeGrayData 接受的就是没有着色的imgdata
        //       for(let i = 0; i < imgData.data.length; i += 4){
        //         imgData.data[i+3] = imgData.data[i]
        //         imgData.data[i] = imgData.data[i+1] = imgData.data[i+2] = 0
        //       }
        //       this.heatLayer.changeGrayData(imgData)
        //     }
        //     img.src = dataurl
        //   })
      })
    })

    // 更改时序曲线的展示方式
    bus.$on("WhoCanShowThis", (json)=>{
      let K = Object.keys(json)
      let d0 = json[K[0]]

      // 在地图上添加marker
      let idx = 0
      this.markerGroup.clearLayers()
      for(let k in json) {
        let p = L.point(k % 1024, k / 1024)
        let latlng = this.map.layerPointToLatLng(p)
        const myCustomColour = common.colorTheme[idx++]

        const markerHtmlStyles = `
            background-color: ${myCustomColour};
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
          html: `<span style="${markerHtmlStyles}" />`
        })
        let marker = L.marker(latlng, {
          icon: myIcon
        })
        this.markerGroup.addLayer(marker)
      }

      let st = new Date(common.getDatasetConfig('timeStart')['string'])
      let ed = new Date(common.getDatasetConfig('timeEnd')['string'])
      this.$refs["axis-bubble"].setData(d0, [st, ed])
      this.$refs["axis-bubble"].draw()

      this.$refs["line-chart"].shownData = json
      this.$refs["line-chart"].draw()
    })

    // 用heatmap渲染一下小图，然后交给table展示
    bus.$on("RenderAndShowSimilarDatesLooks", (json)=>{
      // debugger
      let tableData = []
      let {distance, similar_pth, final_dist} = json
      for(let i = 0; i < distance.length; ++i){
        tableData.push({
          'distance': json['distance'][i].toFixed(2),
          'similar_pth': json['similar_pth'][i],
          'date': /\d+\-\d+\-\d+\-\d+/.exec(json['similar_pth'][i])
        })
      }
      this.$refs["time-brush"].finalDist = final_dist
      this.$refs["time-brush"].createTimeBrush()
      this.$refs["image-table"].tableData = tableData
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

    // 添加一个queryLayer默认pather
    debugger
    this.queryLayer = new L.Pather()
    this.map.addLayer(this.queryLayer)
  },
  destroyed() {
    bus.$off('ChangeDataset')
    bus.$off('UpdateDate')
    bus.$off('WhoCanShowThis')
    bus.$off("RenderAndShowSimilarDatesLooks")
  },
  methods:{
    dateChange(val){
      this.currentDate=val
      //this.map.remove() // 直接删掉地图对象换新的了。。应该是删掉上面的数据图层罢
      //this.createMap()
      // let map = this.map;
      // map.eachLayer(function (layer) {
      //   console.log(layer)
      //   map.removeLayer(layer);
      // });
      this.draw(this.currentDate,this.currentType)
    },
    typeChange(val){
      //console.log('type',val)
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
      // debugger
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
            // gradient:{0.2: tempColor[0], 0.4: tempColor[1],
            //   0.6: tempColor[2], 0.8: tempColor[3], 1: tempColor[4]},
            gradient:newcolormap,
            max: 0.2,
            // blur: 20,
          }
        )//.addTo(this.map);
        dataLayerGroup.addLayer(heatLayer)
        window.heatLayer = heatLayer
        this.heatLayer = heatLayer
        // console.log({heatLayer})

        // 不能在canvas中取图像，而是直接在heat leaf中去取，这个不行
        // var canvasEl = document.getElementsByClassName("leaflet-heatmap-layer")[0]
        // var dataurl = canvasEl.toDataURL()
        // window.downloadres[date] = dataurl
        // 为了能下载数据搞的愚蠢的代码
        // if(window.downloadres == undefined){
        //   window.downloadres = {}
        // }
        // window.downloadres[date] = window.globaln
      }
    },
    flyTo(){
      let mapConfig = common.getDatasetConfig('map')
      console.log('flying to new pos', common.currentDataset,[mapConfig['centerLat'], mapConfig['centerLng']], mapConfig['zoom'])
      this.currentDataset = common.getCurrentDataset()
      this.map.flyTo([mapConfig['centerLat'], mapConfig['centerLng']], mapConfig['zoom'])
    }
  },
  components:{
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
    }
    // map: function(){
    //   //console.log(map)
    //   console.log('map changed')
    // }
  }
}
</script>

<style scoped>

</style>
