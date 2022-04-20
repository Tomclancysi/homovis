<template>
<div class="axis-bubble" ref="main-div">

</div>
</template>

<script>
import * as d3 from "d3"

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
        left:5,
        right:5,
        top:5,
        bottom:20
      }
      let xScale = d3.scaleTime().domain(this.timeRange).range([margin.left, this.width - margin.right])
      let xAxis = d3.axisBottom(xScale).ticks(7) // 手动控制tick数量
      svg.append('g').attr("transform", `translate(0,${this.height - margin.bottom})`).call(xAxis)

      //然后，绘制圆形在坐标轴上

      let d = this.shownData
      let bubbleNum = Math.min(this.maxBubbleNum, d.length), bbWidth = Math.floor(d.length / bubbleNum)
      d.length = bbWidth * bubbleNum
      let avg, cx, cy, r, clientW = this.width - margin.left - margin.right, clientH = this.height - margin.top - margin.bottom
      for(let i = 0; i < d.length; i += bbWidth){
        avg = 0
        for(let j = 0; j < bbWidth; ++j) avg += d[i + j];
        avg /= bbWidth

        cx = clientW * (i + bbWidth / 2) / d.length + margin.left
        cy = margin.top + clientH / 2
        r = (avg / this.dataRange) * (clientH * 0.5)
        console.log(r)
        // add bubble
        svg.append('g').append('circle').attr('cx',cx).attr('cy',cy).attr('r',r).style('fill', '#c2326c')
        // svg
        //   .append("g")
        //   .selectAll("bubble")
        //   .data([{'cx': cx,'cy': cy, 'r': r}])
        //   .enter()
        //   .append("circle")
        //   .attr("cx", d => x(d.cx) + 50)
        //   .attr("cy", d => y(d.cy))
        //   .attr("r", d => d.r)
        //   .style("fill", "lightcyan")
        //   .style("opacity", "0.7")
        //   .attr("stroke", "black");
      }
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
  // mounted() {
  //   // 此时div的大小应当是确定好了的，因此记录一下
  //   // this.width = this.$refs["main-div"].clientWidth
  //   // this.height = this.$refs["main-div"].clientHeight
  // }
}
</script>

<style scoped>
.axis-bubble{
  width: 500px;
  height: 100px;
}
</style>
