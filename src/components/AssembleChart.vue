<template>

</template>

<script>
// 这个组件只负责组件的组合，为他们提供宽度 样式这些的
// 通过一个配置文件 动态决定如何对其进行组合
// 这部分可以做拓展功能 现在先不搞吧
import bus from "../assets/bus";
import LineChart from "./LineChart";
import DrawPad from "./DrawPad";
import AxisBubble from "./AxisBubble";



export default {
  name: "AssembleChart",
  components: {AxisBubble, DrawPad, LineChart}
  data(){
    return {

    }
  },
  props:{
    cfg: {
      type: Object,
      default: {
        //默认配置对象
      }
    }
  },
  render(createElement, context) {

  }

}
</script>

<style scoped>

</style>
