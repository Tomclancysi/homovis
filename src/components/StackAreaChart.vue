<template>
<div ref="main-div" id="area-chart"></div>
</template>

<script>
import * as d3 from "d3"
import common from "./common"

export default {
  nae: "StackAreaChart",
  methods:{
    showData(data, keys, {
      // 默认配置项

      margin= {
        top: 20,
        right: 30,
        bottom: 30,
        left: 40
      },
    } = {}){
      // 输入的data应该满足， [{'x', 'y1', 'y2'}...], keys 说明哪些键
      // 参数
      const mainDiv = this.$refs["main-div"]
      let width = mainDiv.style.width
                  ? Number(mainDiv.style.width.substr(0, mainDiv.style.width.length-2))
                  : 500;
      let height = mainDiv.style.height
                   ? Number(mainDiv.style.height.substr(0, mainDiv.style.height.length-2))
                   : 500

      // 区域
      let svg = d3.create('svg')
      let areaChart = svg.append('g')

      // draw function
      let x = d3.scaleLinear()
                    .domain([0, data.length-1])
                    .range([margin.left, width - margin.right])
      let y = d3.scaleLinear()
                    .domain([0, data.length-1])
                    .range([height - margin.bottom, margin.top])
      let color = d3.scaleOrdinal()
                    .domain(keys)
                    .range(d3.schemeSet2)

      let area = d3.area()
                 .x((d, idx)=>x(idx))
                 .y0((d)=>y(d[0]))
                 .y1((d)=>y(d[1]))

      svg.append('g')
          .attr('transform', `translate(0, ${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(5))

      svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .call(d3.axisBottom(x).ticks(5))

      // 数据
      let stack = d3.stack()
        .keys(keys)
        .order(d3.stackOrderDescending)
      let series = stack(data) // [  area1 [ [y0,y1],[] ], ...]
      areaChart.selectAll('myarea')
                .data(series)
                .enter()
                .append('path')
                  .style('fill', (d)=>color(d.key))
                  .attr('d', area)

      d3.selectAll('#area-chart > *').remove()
      this.$refs["main-div"].appendChild(svg.node())
    },
  }
}
</script>

<style scoped>

</style>
