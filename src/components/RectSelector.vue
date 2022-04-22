<template>
  <div class="RectSelector"></div>
</template>

<script>
import SelectArea from 'leaflet-area-select';
import common from "./common";
import bus from "../assets/bus";

export default {
  name: "RectSelector",
  data: {
    lastRect: null
  },
  props: {
    map: {
      required: true
    }
  },
  methods: {
    setMap(map){
      this.map = map
      console.log('change map')
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

        this.map.dragging.disable()
        let a = this.map.latLngToContainerPoint(e.bounds._northEast), b = this.map.latLngToContainerPoint(e.bounds._southWest)
        let minx = Math.min(a.x, b.x), maxx = Math.max(a.x, b.x)
        let miny = Math.min(a.y, b.y), maxy = Math.max(a.y, b.y)
        this.query(minx, maxx, miny, maxy)
        // TODO 拿到像素位置
          //  去请求api，得到相似的天数，然后在合适的方式展示出来
      })
    },

    /**
     * 请求后端，拿到结果后，做展示
     * @param bound 包含矩形的坐标
     * @param resolver 后面如何进行展示
     * @returns {Promise<void>}
     */
    async query(minx, maxx, miny, maxy){
      minx = parseInt(minx / 1024 * 64);
      miny = parseInt(miny / 1024 * 64);
      maxx = parseInt(maxx / 1024 * 64);
      maxy = parseInt(maxy / 1024 * 64);
      // TODO 日期从哪里来，原来直接是找到这个ToolTip，组件化后，这应该作为一个参数传进来？
      // let reqUrl = `http://49.52.18.240:49159/requestrect?start_date=${st}&end_date=${ed}&minx=${minx}`
      //   + `&miny=${miny}&maxx=${maxx}&maxy=${maxy}`;
      let reqUrl = common.queryRectAreaSimilar(minx, maxx, miny, maxy)
      // debugger
      let response = await fetch(reqUrl,{ // 这玩意老报错，是不是跨域的问题
        method: 'GET',
        mode: 'cors' //这是支持跨域
      });
      if (!response.ok){
        console.log(`no response when get ${reqUrl}`);
        return;
      }

      // TODO 这里应当合适的方式展示出来
      response.json().then(json =>{
        console.log(json)
        bus.$emit("RenderAndShowSimilarDatesLooks", json)
      })
      // response.json().then((data)=>{
      //   for(let i = 0; i < data['similar_pth'].length; ++i){
      //     var image = new Image();
      //     image.onload = function () {
      //       document.getElementById(`${i+1}nd`).setAttribute('src', this.src);
      //     };
      //     image.src = data['similar_pth'][i];
      //     let name = data['similar_pth'][i];
      //     let j = name.length - 1;
      //     while (name[j] != '/') j--;
      //     name = name.substr(j+1);
      //     name = name.substr(0, name.length - 4)
      //     let ele = document.getElementById(`${i+1}nd label`);
      //     ele.innerText = name;
      //     let s = data['similar_pth'][i];
      //     s = CommonDefine.getArg('DATA_PATH_HEATMAP') + s.substr(s.lastIndexOf('/') + 1);
      //     ele.setAttribute('link', s);
      //   }
      // });
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

  },
  destroyed() {
    this.map.selectArea.setValidate(); // 可能是取消绑定事件？
  }
}
</script>

<style scoped>

</style>
