<template>
<div id="menu">
  <el-menu
    class="el-menu-demo"
    mode="horizontal"
    @select="handleSelect"
    background-color="#545c64"
    text-color="#fff"
    active-text-color="#ffd04b">
    <el-menu-item index="1">DashBoard</el-menu-item>
    <el-submenu index="2">
      <template slot="title">Dataset</template>
<!--      <el-menu-item index="2-1">可能多个，要循环一下</el-menu-item>-->
      <el-menu-item :index="`2-${idx+1}`" v-for="(name,idx) in this.datasetNames" :key="idx">{{name}}</el-menu-item>

    </el-submenu>
    <el-submenu index="3">
      <template slot="title">QueryMethod</template>
      <el-menu-item index="3-1">QueryArea</el-menu-item>
      <el-menu-item index="3-2">QueryCurve</el-menu-item>
<!--      <el-menu-item index="3-3">bubulemap</el-menu-item>-->
    </el-submenu>
<!--    <el-menu-item index="4"><a href="https://www.ele.me" target="_blank">订单管理</a></el-menu-item>-->
  </el-menu>
</div>
</template>

<script>
import bus from "../assets/bus";
import common from "./common";

export default {
  name: "MenuUI",
  data(){
    return {
      lastDataset: null,
      column3: ['QueryArea', 'QueryCurve'],
      datasetNames: common.datasetNames // 灵异事件 我直接data: {}这还不行，必须用函数？
    }
  },
  methods: {
    /**
     *
     * @param key
     * @param keyPath
     */
    handleSelect(key, keyPath) {
      console.log(key, keyPath);
      let path = keyPath[keyPath.length - 1]
      let choice = parseInt(path[path.length-1]) - 1 // 0, 1, 2
      if (key[0] == '2'){// dataset changed
        if(this.lastDataset == choice)
          return;
        this.lastDataset = choice
        // 更换数据集后，可能多个地方需要相应，所以放到bus上
        let newDataset = this.datasetNames[choice]
        common.setCurrentDataset(newDataset)
        bus.$emit('ChangeDataset', newDataset)
      }
      else if(key[0] == '3'){// draw method changed
        this.$parent.queryLayer = this.column3[choice]
      }

    }
  }
}
</script>

<style scoped>

</style>
