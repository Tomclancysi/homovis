<template>
<div id="brush">

</div>
</template>

<script>
import * as d3 from "d3"
import bus from "../assets/bus"
import common from "./common";
export default {
  name: "TimeBrush",
  data(){
    return {
        test: '234234',
        finalDist: null
    }
  },
  methods:{
    createTimeBrush(){
      console.log('create new time brush')
      d3.select('#brush').selectAll('*').remove()
      // let cfg = require(`../../static/data/aqi/datasetConfig.json`)
      let height = 120, width = 1024
      let margin = ({top: 10, right: 0, bottom: 20, left: 0}) // svg的边缘，真正用来选取的区域是在里面
      let inter = common.getDatasetConfig("interval"), interval, tickInterval
      // let tickInterval = d3.timeWeek.every(1) // tick的间隔
      if(inter.endsWith('hour')){
        interval = d3.timeHour.every(parseInt(inter.substr(0, inter.indexOf(' ')))) // 相邻两帧的时间间隔
        tickInterval = d3.timeWeek.every(1)
      }
      else if(inter.endsWith('day')){
        interval = d3.timeDay.every(parseInt(inter.substr(0, inter.indexOf(' ')))) // 相邻两帧的时间间隔
        tickInterval = d3.timeMonth.every(3) // tick的间隔
      }
      else if(inter.endsWith('month')){
        interval = d3.timeMonth.every(parseInt(inter.substr(0, inter.indexOf(' ')))) // 相邻两帧的时间间隔
        tickInterval = d3.timeYear.every(1) // tick的间隔
      }

      // let tickInterval = d3.timeWeek.every(1) // tick的间隔

      let svg = d3.select('#brush')
        .append('svg')
        .attr('width', `${width}px`)
        .attr('height', `${height}px`)
        .attr('viewBox', [0,0,width, height])

      // 这些都要是一个function，然后被call的时候才产生真正的g标签，<g.call(func) == func(g)>
      let xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(g => g.append("g")
          .call(d3.axisBottom(x)
            .ticks(tickInterval)
            .tickSize(-height + margin.top + margin.bottom)
            .tickFormat(() => null))
          .call(g => g.select(".domain") // 函数执行到这时候g里面已经有domain和tick line这些东西了，因此设置它
            .attr("fill", "#ddd")
            .attr("stroke", null))
          .call(g => g.selectAll(".tick line")
            .attr("stroke", "#fff")
            .attr("stroke-opacity", d => d <= d3.timeWeek(d) ? 1 : 0.5)))
        .call(g => g.append("g")
          .call(d3.axisBottom(x)
            .ticks(tickInterval)
            .tickPadding(0))
          .attr("text-anchor", null)
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll("text").attr("x", 6)))

      let st = common.getDatasetConfig(["timeStart"]), ed = common.getDatasetConfig("timeEnd")
      let x = d3.scaleTime()  // 这个是用来设置下面的坐标轴的tick range？
        .domain([new Date(st["year"], st["month"], st["day"], st["hour"]), new Date(ed["year"], ed["month"], ed["day"], ed["hour"])])
        .rangeRound([margin.left, width - margin.right])

      const brush = d3.brushX()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("end", brushended);
      // brush 两个事件 end 和 brush， 前者在结束时应该返回选择的区域

      svg.append("g")
        .call(xAxis);

      let gBrush = svg.append("g")
        .call(brush);

      function brushended(event) {
        // debugger
        let range = brush.extent(), date;
        const selection = event.selection;
        // console.log({event,selection})
        if (!event.sourceEvent && !selection) return;
        if (!selection){
          // 处理点击事件
          let t = common.dateFormatter(interval.round(x.invert(event.sourceEvent.clientX))) // 对date要进行一个formatter
          date = {
            "start": t,
            "end": t
          }
          console.log({date})
          common.setCurrentDate(date)
          bus.$emit("UpdateDate", date)
        }
        else {
          // selection is day and the invert to index？
          let x0, x1
          [x0, x1] = selection.map(d => common.dateFormatter(interval.round(x.invert(d))));// 返回时间应该就卡在对应位置上
          date = {
            "start": x0,
            "end": x1
          }
          console.log({date})
          common.setCurrentDate(date)
          bus.$emit("UpdateDate", date)
        }
        //console.log(x0, x1) // 推测一波这个代码在干啥，由坐标数字返回时间，然后根据时间，对其到相应的interval
        //d3.select this指的应该就是那个选中区域的框框了 .call 可以再传入其他参数，第一个参数是func？？
        //d3.select(this).transition().call(brush.move, x1 > x0 ? [x0, x1].map(x) : null);
      }

      let hoverLine = svg.append('line')
        .attr("class", "hoverLine")
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', height);
      let tooltip = d3.select('#brush').append('div')
        .attr('class', 'tooltip')
        .style('visibility', 'hidden')
        .style('position', 'absolute')
        .style('width', 50)
        .style('height', 20)


      // debugger
      let limitMaxTooltipTarX = width - tooltip.node().clientWidth;
      let limitOffsetTooltipX = tooltip.node().clientWidth - 100;

      svg
        .on('mousemove',  (event)=> {
          // let mouseX = d3.pointer(event)[0];
          // console.log({event, mouseX})
          // if (mouseX < 0 || mouseX > width) {
          //   return false;
          // }
          let mouseX = event.offsetX
          let chartX = x.invert(mouseX); // date

          let yy = chartX.getFullYear();
          let mm = chartX.getMonth() + 1;
          let dd = chartX.getDate();
          let hh = chartX.getHours();
          hh = fillZeroWhenItLessThanTen(hh);
          mm = fillZeroWhenItLessThanTen(mm);
          dd = fillZeroWhenItLessThanTen(dd);

          let dataStr = `${yy}-${mm}-${dd}-${hh}`; // TODO:在tooltip中显示坐标轴时间尺度还是数据时间尺度(2小时)?
          //let dataItem = data[parseInt(x(mouseX))];

          // TODO (LCH): 因值范围不准，先注释
          let tooltipText = dataStr;  // + "</br>" + dataItem.densityVal.toFixed(2);

          hoverLine.attr("x1", mouseX + "px")
            .attr("x2", mouseX + "px")
            .style('background-color', '#C3F2A1')

          let tooltipTarX = Math.min(event.offsetX + 30, limitMaxTooltipTarX)
          // if (tooltipTarX > limitMaxTooltipTarX) {
          //   tooltipTarX = event.pageX - limitOffsetTooltipX
          // }
          // debugger
          // console.log(this.$el, this.test)
          tooltip
            .style('left', tooltipTarX + 'px')
            .style('top', this.$el.offsetTop)
            .html(tooltipText)
          // tooltip
        })
        .on('mouseover', () => {
          hoverLine.style("stroke-width", '1px');
          tooltip.style('visibility', 'visible')
        })
        .on('mouseleave', () => {
          hoverLine.style("stroke-width", '0');
          tooltip.style('visibility', 'hidden')
        });

      if(this.finalDist){
        let d = this.finalDist
        let xDomain = [0, d.length];
        let yDomain = [0, d3.max(d)];
        let xRange = [0, width]
        let yRange = [height - margin.bottom, margin.top]
        const xScale = d3.scaleLinear(xDomain, xRange);
        const yScale = d3.scaleLinear(yDomain, yRange);
        // Construct a line generator.
        const line = d3.line()
          .curve(d3.curveLinear) // 表示连线的类型
          .x((v, i) => xScale(i))
          .y(i => yScale(i));

        // 真正画折线图的时候
        svg.append("path")
          .attr("fill", "none")
          .attr("stroke", "#802A2A")
          .attr("stroke-width", 1.5)
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("stroke-opacity", 0.8)
          .attr("d", line(d));

        this.finalDist = undefined
      }
      // Utility function
      function fillZeroWhenItLessThanTen(val) {
        var numVal = parseInt(val);
        var rs = val;
        if (numVal < 10 && numVal > 0) {
          rs = "0" + rs;
        } else if (numVal == 0) {
          rs = "00";
        }
        return rs;
      }
    }
  },
  mounted() {
    // 这里要把框先给准备好
    this.createTimeBrush()
    bus.$on('ChangeDataset', this.createTimeBrush)
  },
  destroyed() {
    bus.$off('ChangeDataset', this.createTimeBrush)
  }

}
</script>

<style scoped>

</style>
