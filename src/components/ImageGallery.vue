<template>
  <div style="display: flex; flex-direction: column">
    <p class="block-header">Distance table</p>
    <el-table
      class="show-table"
      height="400"
      :data="tableData"
      @row-dblclick="onRowDBClick"
      border
      stripe
      >
      <el-table-column prop="id" label="id" class="col0">
      </el-table-column>

      <el-table-column prop="preview" label="preview" width="180" class="col1">
        <template slot-scope="scope">
          <el-image
            style="width: 64px; height: 64px"
            :src="scope.row.similar_pth"
            :preview-src-list="scope.row.similar_pth_large"
          >
            <div slot="error" class="image-slot">
              <i class="el-icon-picture-outline"></i>
            </div>
          </el-image>
        </template>
      </el-table-column>

      <el-table-column prop="date" label="date" width="180" class="col2">
      </el-table-column>

      <el-table-column prop="distance" label="distance" class="col3">
      </el-table-column>
    </el-table>

    <el-row>
      <el-col :span="10">
        <p class="block-header">Distance to selected area</p>
      </el-col>
      <el-col :span="4">
        <el-button round @click="this._setTableDataFromChosenDates">
          Generate table
        </el-button>
      </el-col>
    </el-row>

    <div id="distance-curve" class="border-base" ref="distance-curve" style="height: 200px; padding-bottom: 10px"></div>
  </div>
</template>

<script>
import * as d3 from "d3"
import common from "./common";

export default {
  name: "ImageGallery",
  data(){
    return {
      width: null,
      height: null,

      distanceData: null,
      tableData: [{ // 是个数组，然后 麻了
        id: 0,
        distance: 1, // 一个参考的距离度量, 这里的小图最好是渲染一下搞成彩色的然后再发过来
        similar_pth: 'http://49.52.18.240:49158/scaledimagegray/aqi/2017-05-16-04.png', // 请求image url 或者直接传给它一个dataurl显示一下得了
        similar_pth_large: 'http://49.52.18.240:49158/scaledimagegray/aqi/2017-05-16-04.png', // 请求image url 或者直接传给它一个dataurl显示一下得了
        date: '2017-05-16-04'
      }]
    }
  },

  methods:{
    setTableData(data){
      this.tableData = data // 既然响应式的 不用重画了
    },
    setChartData(date, latlng){

    },
    _setTableDataFromChosenDates(){
      if(this.markedPos && Array.isArray(this.markedPos) && this.markedPos.length > 0){
        this.tableData = this.markedPos
      }
    },
    draw(dist){
      this.width = common.getLengthFromStyleStr(getComputedStyle(this.$el, null).getPropertyValue('width'))
      this.height = common.getLengthFromStyleStr(this.$refs["distance-curve"].style.height)
      this.distanceData = dist
      d3.selectAll('#distance-curve > *').remove()
      var svg = d3.create('svg').attr('width', this.width).attr('height', this.height)

      //首先，绘制下面的坐标轴
      let margin = {
        left:25,
        right:5,
        top:10,
        bottom:20
      }
      let xScale = d3.scaleTime().domain(common.getTimeRange()).range([margin.left, this.width - margin.right])
      let x = d3.scaleLinear().domain([0, dist.length]).range([margin.left, this.width - margin.right])
      let yScale = d3.scaleLinear().domain([0, 100]).range([this.height - margin.bottom, margin.top])
      let xAxis = d3.axisBottom(xScale).ticks(7) // 手动控制tick数量
      svg.append('g').attr("transform", `translate(0,${this.height - margin.bottom})`).call(xAxis)
      svg.append('g').attr("transform", `translate(${margin.left} ,0)`).call(d3.axisLeft(yScale).ticks(7))

      var area = d3.area()
                  .curve(d3.curveBasis)
                  .x(function(d, i) {return x(i)})
                  .y1(function(d){return yScale(d)})
                  .y0(yScale(0))
      svg.append('path').style('fill', "#63b2ee").attr('d', area(dist))
      svg.append('circle').attr("class", 'top-marker')
      this.markedPos = []
      var interval = common.getInterval()
      svg.on('click', (function (event){
        let x_ = event.offsetX
        let date = common.dateFormatter(interval.round(xScale.invert(x_)))
        x_ = parseInt(x.invert(x_))
        let distance_ = this.distanceData[x_]
        if(0 < x_ && x_ < this.distanceData.length){
          this.markedPos.push({
            'id': this.markedPos.length+1,
            'date': date,
            'distance': distance_,
            'similar_pth': `/static/scaledimage/${common.getCurrentDataset()}/${date}.png`,
            'similar_pth_large': [`/static/dataset/${common.getCurrentDataset()}/${date}.png`]
          });
          console.log(this.markedPos)
          svg.append('circle')
            .attr("fill", "#9987ce")
            .attr("cx", x(x_))
            .attr("cy", yScale(this.distanceData[x_]) )
            .attr("r", 8)
          svg.append('text')
            .text(this.markedPos.length)
            .attr("x", x(x_)-4)
            .attr("y", yScale(this.distanceData[x_]) + 4)
            .attr("text-anchor", "start")
            .style("font-size", "14px")
            .style("font-weight", "bold")

        }
      }).bind(this))

      svg.on('mousemove', (function(event){
        let x_ = event.offsetX
        x_ = parseInt(x.invert(x_))
        if(0 < x_ && x_ < this.distanceData.length){
          svg.select(".top-marker")
            .attr("fill", "#9987ce")
            .attr("cx", x(x_))
            .attr("cy", yScale(this.distanceData[x_]) )
            .attr("r", 8)
        }
      }).bind(this))
      document.getElementById('distance-curve').appendChild(svg.node())

    },
    onRowDBClick(row, column, event){
      console.log({row,column,event})
    }
  },
  mounted() {

  }
}
</script>

<style scoped>
.block-header {
  border-radius: 0.25rem;
  font-size: 20px;
  border: 1px solid rgba(156, 163, 175, 0.5);
  padding-top: 10px;
  padding-bottom: 10px;
  background-color: rgba(156, 163, 175, 0.15);
}
.border-base{
  border: 1px solid rgba(156, 163, 175, 0.5);
}
</style>
