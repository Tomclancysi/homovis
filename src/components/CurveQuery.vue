<template>
<div ref="main-div"></div>
</template>

<script>
import common from "./common";
import bus from "../assets/bus";
require("leaflet-pather")
require("leaflet-label")

export default {
  name: "CurveQuery",
  props: ['map'],
  data(){
    return {
      queryLayer: null,
      lastLine: null
    }
  },
  mounted() {
    if(this.map)
      this.initialize()
  },
  methods: {
    initialize(){
      /** default pather config
       moduleClass: 'pather',
       lineClass: 'drawing-line',
       detectTouch: true,
       elbowClass: 'elbow',
       removePolylines: true,
       strokeColour: 'rgba(0,0,0,.5)',
       strokeWidth: 2,
       width: '100%',
       height: '100%',
       smoothFactor: 10,
       pathColour: 'black',
       pathOpacity: 0.55,
       pathWidth: 3,
       mode: MODES.ALL
       */
      this.queryLayer = new L.Pather({
        smoothFactor: 10,
        pathWidth: 3,
        strokeColour: "#f00"
      })
      this.map.addLayer(this.queryLayer)
      // 处理监听事件
      this.queryLayer.on('created', this.polyCreated)

    },
    polyCreated(query){
      let {polyline, latLngs} = query
      console.log('[QueryCurve]: ', latLngs)
      let points = []
      for(let i = 0; i < latLngs.length; ++i)points.push(this.map.latLngToLayerPoint(latLngs[i]))

      // 清理上一条
      this.clearPolyLine()
      this.lastLine = polyline

      polyline.edges.forEach((edge, i)=>{
        let s = String(i+1)
        edge.bindTooltip(s, {
          permanent: true
        })
      })

      this.query(points)
    },
    query(points){
      // points is array of object Point, which is not serizeabole so change it to normal json
      points = points.map((item)=>{
        return {x: item.x, y: item.y}
      })
      this.$axios({
        url: common.queryTimelineOfPoint(),
        method: 'post',
        data: points
      })
      .then(function (response){
        let json = response.data
        console.log('[QueryCurve]: response =',response)
        // 这个接口应当返回的是 各个位置对应的曲线，整理整理放一个地方展示。
        if(json['status'] == 'success')
          bus.$emit('PutToAxisBubble', json['timelines'])
        else
          console.log('[QueryCurve]: Error happened in server')
      })
      .catch(function (error){
        console.log(error)
      })
    },
    clearPolyLine(){
      if(this.lastLine instanceof L.Pather.Polyline)
        this.queryLayer.removePath(this.lastLine)
    }
  },
  destroyed() {
    this.map.removeLayer(this.queryLayer)
  },
  watch: {
    map: function(){
      if(this.map)
        this.initialize()
    }
  }
}
</script>

<style scoped>

</style>
