<template>
<div :style="{height: height+'px', width: width+'px'}" ref="main-div"></div>
</template>

<script>
// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/line-chart
// 通过props传入能够展示的数据，然后自动更新
import * as d3 from "d3"
import common from "./common";

export default {
  name: "LineChart",
  data(){
    return {
      width: 500,
      height: 200
    }
  },
  props: {
    shownData: {
      description: 'array or dict, if array just draw a line, if dict, draw legend and multi line',
      default: ()=>[]
    }
  },
  methods:{
      preprocessArray(a){
        if((typeof a[0]) == 'number')
          return a.map((y, i)=>{return [i, y]})
        return [];
      },
      draw(){
        // 展示一条曲线，直接输入这么一条曲线的值
        // data should be an array of objects, provide x, y function to extract the data
        // 这里对数据进行一下处理，外面使用时应该就穿一个简单数组就完事了，或者一个对象
        d3.select(this.$refs["main-div"]).selectAll('*').remove()
        let node
        let d = this.shownData
        if (Array.isArray(d)){
          d = this.preprocessArray(d)
          node = this.createLineChart({'1': d}, {
            yLabel: '',
            width: this.width,
            height: this.height,
            color: "steelblue",
            marginTop: 0, // top margin, in pixels TODO 调一下这几个参数
            marginRight: 0, // right margin, in pixels
            marginBottom: 0, // bottom margin, in pixels
            marginLeft: 0, // left margin, in pixels
            xType: d3.scaleLinear,
            hiddenAxis: true //认为只存在一个数据的情况下不用画坐标轴
          })
        }
        else{
          let keys = Object.keys(d)
          for(let k in d){
            d[k] = this.preprocessArray(d[k])
          }
          node = this.createLineChart(d, {
            yLabel: "Muti Lines",
            width: this.width,
            height: this.height,
            color: "steelblue",
            xType: d3.scaleLinear,
            hiddenAxis: false
          })
        }
        if (node !== undefined)
          this.$refs["main-div"].appendChild(node)
        else
          console.log('wrong when draw lines')
      },
      createLineChart(dataObject, {
        hiddenAxis = false,
        x = ([x]) => x, // given d in data, returns the (temporal) x-value
        y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
        defined, // for gaps in data
        curve = d3.curveLinear, // method of interpolation between points
        marginTop = 20, // top margin, in pixels TODO 调一下这几个参数
        marginRight = 30, // right margin, in pixels
        marginBottom = 30, // bottom margin, in pixels
        marginLeft = 40, // left margin, in pixels
        width = 640, // outer width, in pixels
        height = 400, // outer height, in pixels
        xType = d3.scaleUtc, // the x-scale type
        xDomain, // [xmin, xmax] TODO
        xRange = [marginLeft, width - marginRight], // [left, right]
        yType = d3.scaleLinear, // the y-scale type
        yDomain, // [ymin, ymax]
        yRange = [height - marginBottom, marginTop], // [bottom, top]
        yFormat, // a format specifier string for the y-axis
        yLabel, // a label for the y-axis
        color = "currentColor", // stroke color of line
        strokeLinecap = "round", // stroke line cap of the line
        strokeLinejoin = "round", // stroke line join of the line
        strokeWidth = 1.5, // stroke width of line, in pixels
        strokeOpacity = 1, // stroke opacity of line
      } = {}) {
        // 计算一下min max 不从零开始展示吧，否则感觉会奇怪,能跑就行
        let min = 1e9, max = -1e9, lll = 0
        for (let k in dataObject) {
          let data = dataObject[k]
          for(let j = 0; j < data.length; ++j){
            min = Math.min(data[j][1], min)
            max = Math.max(data[j][1], max)
          }
          lll = data.length
        }
        if (xDomain === undefined) xDomain = [0, lll];
        if (yDomain === undefined) yDomain = [min, max];
        const xScale = xType(xDomain, xRange);
        const yScale = yType(yDomain, yRange);
        const svg = d3.create("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [0, 0, width, height])
          .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

        // Compute values.
        let idx = 0
        for (let k in dataObject) {
          let data = dataObject[k]
          color = common.colorTheme[idx++]
          const X = d3.map(data, x);
          const Y = d3.map(data, y);
          const I = d3.range(X.length);
          if (defined === undefined) defined = (d, i) => !isNaN(X[i]) && !isNaN(Y[i]);
          const D = d3.map(data, defined); // 判断每个数是不是NaN 没啥用吧

          // Compute default domains.
          // if (xDomain === undefined) xDomain = d3.extent(X);
          // if (yDomain === undefined) yDomain = [0, d3.max(Y)];

          // Construct a line generator.
          const line = d3.line()
            .defined(i => D[i]) // define 用
            .curve(curve) // 表示连线的类型
            .x(i => xScale(X[i]))
            .y(i => yScale(Y[i]));

          // 真正画折线图的时候
          svg.append("path")
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", strokeWidth)
            .attr("stroke-linecap", strokeLinecap)
            .attr("stroke-linejoin", strokeLinejoin)
            .attr("stroke-opacity", strokeOpacity)
            .attr("d", line(I));
        }

        // 画时间线的时候，用另一个scale
        if(!hiddenAxis) {
          let st = new Date(common.getDatasetConfig('timeStart')['string'])
          let ed = new Date(common.getDatasetConfig('timeEnd')['string'])
          let axisXScale = d3.scaleTime().domain([st, ed]).range([marginLeft, width - marginRight])
          const xAxis = d3.axisBottom(axisXScale).ticks(7)
          const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);
          svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(xAxis);

          svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(yAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").clone()
              .attr("x2", width - marginLeft - marginRight)
              .attr("stroke-opacity", 0.1))
            .call(g => g.append("text")
              .attr("x", -marginLeft)
              .attr("y", 10)
              .attr("fill", "currentColor")
              .attr("text-anchor", "start")
              .text(yLabel));
        }

        console.log(svg.node())
        return svg.node();
      }
  },
  mounted() {
    this.$refs.testdiv.appendChild(this.draw())
  },

  // watch: {
  //   shownData: ()=>{
  //     console.log(this.shownData)
  //     // 这个$ref.linechart是什么类型 好像不能select
  //     d3.select(this.$refs.LineChart).selectAll('*').remove()
  //     let child = this.draw()
  //     d3.select(this.$refs.LineChart).append(child)
  //   }
  // }
}
</script>

<style scoped>

</style>
