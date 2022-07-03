<template>
  <div class="RectSelector"></div>
</template>

<script>
import SelectArea from 'leaflet-area-select';
import common from "./common";
import bus from "../assets/bus";

export default {
  name: "RectSelector",
  props: {
    map: {
      required: true
    },
    mode: {
      default: common.atSamePosition // 1 代表在相同位置， 2 代表在不同位置进行模板匹配
    }
  },
  methods: {
    setMap(map){
      this.map = map
      console.log('[rect selector is set down with current map!]')
      this.map.selectArea.enable();
      //this.map.selectArea.setAutoDisable(true)
      // 绑定事件处理
      this.map.on('areaselected', (e) => {
        // debugger
        // console.log(e)
        // console.log(this.map.latLngToContainerPoint(e.bounds._northEast))
        // console.log(this.map.latLngToContainerPoint(e.bounds._southWest))
        // console.log(e.bounds.toBBoxString()); // lon, lat, lon, lat
        //L.rectangle(e.bounds, { color: "blue", weight: 1 }).addTo(this.map);
        // if (this.lastRect)
        //   this.map.removeLayer(this.lastRect)
        // this.lastRect = L.rectangle(e.bounds, { color: "blue", weight: 1 }).addTo(this.map);
        this.$parent.markerGroup.clearLayers()
        this.$parent.markerGroup.addLayer(L.rectangle(e.bounds, { color: "blue", weight: 1 }))

        // this.map.dragging.disable()
        let a = this.map.latLngToContainerPoint(e.bounds._northEast), b = this.map.latLngToContainerPoint(e.bounds._southWest)
        let offset = (1024 - this.map.getSize().x) / 2
        let minx = Math.min(a.x, b.x) + offset, maxx = Math.max(a.x, b.x) + offset
        let miny = Math.min(a.y, b.y) + offset, maxy = Math.max(a.y, b.y) + offset
        this.query(minx, maxx, miny, maxy)
      })
    },

    /**
     * 请求后端，拿到结果后，做展示
     * @param bound 包含矩形的坐标
     * @param resolver 后面如何进行展示
     * @returns {Promise<void>}
     */
    async query(minx, maxx, miny, maxy){
      // debugger
      if(this.$parent.timeAxisMode){
        // 这里查找聚类的结果
        let reqUrl = common.queryRegionCluster(minx, maxx, miny, maxy)
        this.$axios.get(reqUrl)
          .then((response)=>{
            console.log('QueryRegionCluster:', response)
            let json = response.data
            if(json['status'] == 'success'){
              bus.$emit("PutToAxisBubble", json['trends'])
            }
          })
          .catch(function (error) { // handle error
            console.log(error);
          })
      }
      else{
        let size = 1024
        minx = parseInt(minx / size * 64);
        miny = parseInt(miny / size * 64);
        maxx = parseInt(maxx / size * 64);
        maxy = parseInt(maxy / size * 64);
        let reqUrl
        if(this.mode == common.atSamePosition) {
          reqUrl = common.queryRectAreaSimilar(minx, maxx, miny, maxy)
          console.log('[RectSelector] requesting for similar pattern in the same position...')
        }
        else {
          reqUrl = common.queryTemplateMatch(minx, maxx, miny, maxy)
          console.log('[RectSelector] requesting for similar pattern in different position...')
        }
        let response = await fetch(reqUrl,{ // 这玩意老报错，是不是跨域的问题
          method: 'GET',
          mode: 'cors' //这是支持跨域
        });
        if (!response.ok){
          console.log(`no response when get ${reqUrl}`);
          return;
        }
        response.json().then(json =>{
          if(json['status']!='success'){
            console.log('[RectSelector] Error in server side')
            return
          }
          bus.$emit("RenderAndShowSimilarDatesLooks", json)
        })
      }
    },

    RegionClusterHandler(response){
      let json = response.data
      // 这里应该是聚类后的结果

    }
  },
  // watch:{
  //   map: function(oldval, newval){
  //     if(newval == undefined){
  //       console.log('map undefined')
  //       return
  //     }
  //     else{
  //       console.log('mapdefined')
  //       this.map.selectArea.enable();
  //       // 绑定事件处理
  //       this.map.on('areaselected', (e) => {
  //         //console.log({e})
  //         console.log(e.bounds.toBBoxString()); // lon, lat, lon, lat
  //         L.rectangle(e.bounds, { color: "blue", weight: 1 }).addTo(this.map);
  //         // TODO 拿到像素位置
  //         //  去请求api，得到相似的天数，然后在合适的方式展示出来
  //
  //       });
  //     }
  //   }
  // },
  mounted() {
    this.setMap(map)
  },
  destroyed() {
    this.map.selectArea.setValidate(); // 可能是取消绑定事件？
    this.map.off('areaselected')
  }
}
</script>

<style scoped>

</style>
