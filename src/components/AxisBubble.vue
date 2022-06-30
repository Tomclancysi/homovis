<template>
<div class="axis-bubble" ref="main-div">

</div>
</template>

<script>
import * as d3 from "d3"
import common from "./common";

export default {
  name: "AxisBubble",
  data(){
    return {
        shownData: null,
        timeRange: null,// 应该是两个时间点utc，然后画一个xtick
        width: 500,
        height: 120,
        maxBubbleNum: 15,
        dataRange: 255
    }
  },
  props:{
    addMouseMove: {
      default: false,
      type: Boolean
    }
  },
  // props: ['shownData', 'timeRange'],
  methods:{
    // getter setter
    setData(data, times){
      this.shownData = data
      this.timeRange = times
    },
    getSVG(){
      console.log(`axis bubble width=${this.width}, height=${this.height}`)
      var svg = d3.create('svg').attr('width', this.width).attr('height', this.height)

      //首先，绘制下面的坐标轴
      let margin = {
        left:20,
        right:5,
        top:5,
        bottom:20
      }
      let xScale = d3.scaleTime().domain(this.timeRange).range([margin.left, this.width - margin.right])
      let xAxis = d3.axisBottom(xScale).ticks(7) // 手动控制tick数量
      svg.append('g').attr("transform", `translate(0,${this.height - margin.bottom})`).call(xAxis)

      //然后，绘制圆形在坐标轴上
      // 循环几次key 也是多行的那种Object.keys()
      let idx = 0, cy, rowH
      for (let K in this.shownData) {
        let d = this.shownData[K]
        let bubbleNum = Math.min(this.maxBubbleNum, d.length), bbWidth = Math.floor(d.length / bubbleNum)
        d.length = bbWidth * bubbleNum
        let avg, cx, r, clientW = this.width - margin.left - margin.right,
          clientH = this.height - margin.top - margin.bottom
        rowH = clientH / Object.keys(this.shownData).length

        for (let i = 0; i < d.length; i += bbWidth) {
          avg = 0
          for (let j = 0; j < bbWidth; ++j) avg += d[i + j];
          avg /= bbWidth

          cx = clientW * (i + bbWidth / 2) / d.length + margin.left
          cy = margin.top + rowH * (idx + 0.5)
          r = (avg / this.dataRange) * (rowH * 1)
          console.log(r)
          // add bubble
          svg.append('g').append('circle').attr('cx', cx).attr('cy', cy).attr('r', r).style('fill', common.colorTheme[idx])
          // add a little circle to show the index
        }
        // svg.append('g').append('circle').attr('cx', 10).attr('cy', cy).attr('r', 10).style('fill', '#d3d3d3')
        ++idx
        // svg.append('g').attr('transform', `translate(10, ${cy})`).append('text').text(`${++idx}`)
      }

      let gBottomCircleSize = 8, leftTextPosX = 12
      let pointArray = new Array(idx)
      for(let i = 0; i < idx; ++i)pointArray[i] = i
      // Left Text and Circle, index of data points
      let gLeftCircles = svg.append("g");
      let leftCircles = gLeftCircles.selectAll(".circle")
        .data(pointArray)
        .enter()
        .append("circle")
        .attr("class", "circle")
        .attr("transform", function (d, i) {
          var deltaX = leftTextPosX;
          var deltaY = i * rowH + rowH / 2 + 2;
          return "translate(" + deltaX + "," + deltaY + ")";
        })
        .attr("r", gBottomCircleSize)
        .style("fill", "grey")
        .style("fill-opacity", "1");

      let gLeftTexts = svg.append("g");
      let leftTexts = gLeftTexts.selectAll(".text")
        .data(pointArray)
        .enter()
        .append("text")
        .attr("transform", function (d, i) {
          var deltaX = leftTextPosX - 5;

          if ((i + 1) > 9 && (i + 1) < 20)
            deltaX = deltaX - 3;
          else if ((i + 1) >= 20)
            deltaX = deltaX - 4;

          var deltaY = i * rowH + rowH / 2 + 8;
          return "translate(" + deltaX + "," + deltaY + ")";
        })
        .text(function (d, i) {
          return i + 1;
        })
        .attr("fill", "white");

      return svg.node()
    },
    draw(){
      // 先清除 后重画
      d3.select(this.$refs["main-div"]).selectAll('*').remove()
      this.$refs["main-div"].appendChild(this.getSVG())
    }
  },
  // watch:{
  //   shownData: ()=>{
  //     console.log('bubble data changed redraw');
  //     this.draw()
  //   }
  // }
  mounted() {
    let w = this.$el.style.width, h = this.$el.style.height
    w = Number(w.substr(0, w.length-2))
    h = Number(h.substr(0, h.length-2))
    this.width = w
    this.height = h
  }
}
</script>

<style scoped>
.axis-bubble{
  width: 500px;
  height: 100px;
}
</style>
