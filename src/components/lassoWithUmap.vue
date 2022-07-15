<template>
<div id="lasso-umap" style="position: relative">
  <div id="color-bar" flex>
    <span style="padding-top: 5px">start</span>
    <span style="padding-top: 5px">end</span>
  </div>
</div>
</template>

<script>
import common from "./common";
import lasso from "../plugins/lasso.dist";
import bus from "../assets/bus";
export default {
  name: "lassoWithUmap",
  data(){
    return {
        width: 0,
        height: 0
    }
  },
  methods: {
    addBrush(){
      var bar = d3.select('#color-bar')
      if (common.getCurrentDataset() == 'aqi') {
        bar.style('background-image', 'linear-gradient(to right, rgb(235,242,240) , rgb(85,170,153))')
      }
      else if (common.getCurrentDataset() == 'covid') {
        bar.style('background-image', 'linear-gradient(to right, rgb(197,221,234) , rgb(43,31,64))')
      }
      else {
        bar.style('background-image', 'linear-gradient(to right, rgb(236,174,127) , rgb(76,35,98))')
      }
      // function brushed(){
      //   console.log("brushed")
      // }
      // // create brush using d3 brushX()
      // const brush = d3.brushX()
      //     .extent([[0, 0], [this.width - 20, 20]])
      //     .on("start brush", brushed)
      //     .on("end", brushed);
      // // create svg and append brush to svg
      // const svg = d3.select("#color-bar")
      //     .append("svg")
      //     .attr("width", this.width - 29)
      //     .attr("height", 20)
      //     .style("position", "absolute")
      //     .style("left", "10px")
      //     .append("g")
      //     .attr("class", "brush")
      //     .call(brush);
      // const bar = d3.select("#color-bar")
      //   .append('div')
      //   .style("position", "absolute")
      //   .style("top", "0")
      //   .style("left", "10")
      //   .style('width', this.width - 20 + 'px')
      //   .style('height', '20px')
      // const bar = d3.select('.vis-root')
      //   .append('span')
      //   .style('position', 'absolute')
      // add svg to the div
      // d3.select("#lasso-umap").append(svg);
    },

  },
  async mounted() {
    // 看来mounted的时候就可以获取到父组件的值了 长宽就准备好了
    this.width = this.$el.clientWidth;
    this.height = this.$el.clientHeight;
    // general size parameters for the vis
    var width = this.width, height = this.height;
    var padding = { top: 40, right: 40, bottom: 40, left: 40 };
    var plotAreaWidth = width - padding.left - padding.right;
    var plotAreaHeight = height - padding.top - padding.bottom;

    // when a lasso is completed, filter to the points within the lasso polygon
    function handleLassoEnd(lassoPolygon) {
      var selectedPoints = points.filter(function (d) {
        // note we have to undo any transforms done to the x and y to match with the
        // coordinate system in the svg.
        var x = d.x + padding.left;
        var y = d.y + padding.top;

        return d3.polygonContains(lassoPolygon, [x, y]);
      });

      updateSelectedPoints(selectedPoints);
    }

    // reset selected points when starting a new polygon
    function handleLassoStart(lassoPolygon) {
      updateSelectedPoints([]);
    }

    // when we have selected points, update the colors and redraw
    function updateSelectedPoints(selectedPoints) {
      // if no selected points, reset to all tomato
      if (!selectedPoints.length) {
        // reset all
        points.forEach(function (d) {
          d.color = d.originalColor;
        });

        // otherwise gray out selected and color selected black
      } else {
        points.forEach(function (d) {
          d.color = d.originalColor;
        });
        selectedPoints.forEach(function (d) {
          d.color = '#8F3985';
        });
        // and then request the backend for the mean max min value of heat maps
        var allDates = selectedPoints.map(function (d) {
          return d.date;
        });
        window.axios({
          method: 'post',
          url: common.queryOpOfSelected(allDates),
          data: {
            dataset: common.getCurrentDataset(),
            selectedDates: allDates,
            op: common.getOp()
          }
        })
          .then(response => {
            console.log(response.data)
            if(response.data.status == 'success') {
              bus.$emit('changeHeatMapWithURLImg', response.data.url)
            }
          })
          .catch(error => {
            console.log(error)
          })
      }

      // redraw with new colors
      drawPoints();
    }

    // helper to actually draw points on the canvas
    function drawPoints() {
      var context = canvas.node().getContext('2d');
      context.save();
      context.clearRect(0, 0, width, height);
      context.translate(padding.left, padding.top);

      // draw each point as a rectangle
      for (var i = 0; i < points.length; ++i) {
        var point = points[i];

        // draw circles
        context.fillStyle = point.color;
        context.beginPath();
        context.arc(point.x, point.y, point.r, 0, 2 * Math.PI);
        context.fill();
      }

      context.restore();
    }

    // create a container with position relative to handle our canvas layer
    // and our SVG interaction layer
    var visRoot = d3
      .select('#lasso-umap')
      .append('div')
      .attr('class', 'vis-root')
      .style('position', 'relative');

    // main canvas to draw on
    var screenScale = window.devicePixelRatio || 1;
    var canvas = visRoot
      .append('canvas')
      .attr('width', width * screenScale)
      .attr('height', height * screenScale)
      .style('width', (width + "px"))
      .style('height', (height + "px"));
    canvas
      .node()
      .getContext('2d')
      .scale(screenScale, screenScale);

    // add in an interaction layer as an SVG
    var interactionSvg = visRoot
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0);

    // attach lasso to interaction SVG
    var lassoInstance = lasso()
      .on('end', handleLassoEnd)
      .on('start', handleLassoStart);

    interactionSvg.call(lassoInstance);

    // make up fake data
    // var points = d3.range(500).map(function () { return ({
    //   x: Math.random() * plotAreaWidth,
    //   y: Math.random() * plotAreaHeight,
    //   r: Math.random() * 5 + 2,
    //   color: 'tomato',
    //   originalColor: 'tomato'
    // }); });
    var datasetName = common.getCurrentDataset();
    var points = await d3.json(`/static/data/${datasetName}/${datasetName}.json`);
    // find the bound of coordinates
    var xMin = d3.min(points, function (d) { return d.x; });
    var xMax = d3.max(points, function (d) { return d.x; });
    var yMin = d3.min(points, function (d) { return d.y; });
    var yMax = d3.max(points, function (d) { return d.y; });
    var rMin = d3.min(points, function (d) { return d.r; });
    var rMax = d3.max(points, function (d) { return d.r; });
    // normalize the coordinates to the plot area
    points.forEach(function (d) {
      d.x = (d.x - xMin) * plotAreaWidth / (xMax - xMin);
      d.y = (d.y - yMin) * plotAreaHeight / (yMax - yMin);
      d.r = 2 + 5 * (d.r - rMin) / (rMax - rMin);
      d.color = d.originalColor;
    });
    // initial draw of points
    drawPoints();
    this.addBrush();
  }
}
</script>

<style scoped>
#lasso-umap{
  border: 1px solid #ccc;
}

#color-bar {
  height: 8px;
  border: 1px solid #ccc;
  border-radius: 2rem;
  display: flex;
  justify-content: space-between;
}
</style>
