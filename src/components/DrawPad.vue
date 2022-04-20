<template>
  <div id="timelines" ref="main-div">
    <canvas id="canvasSignature" ref="sigCanvas" @mousedown="this.onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseout="onMouseOut" width="500" height="200"></canvas>
  </div>
</template>

<script>
import bus from "../assets/bus";
import common from './common'

function drawAxis(canvas, ctx, xtick=50, ytick=20){
  var grid_size = 25;// 每一格子的尺寸

  var x_axis_starting_point = { number: xtick, suffix: '' };// tick 每格占多少
  var y_axis_starting_point = { number: ytick, suffix: '' };

  // var canvas = document.getElementById("canvasSignature");
  // var ctx = canvas.getContext("2d");

  var canvas_width = canvas.width;
  var canvas_height = canvas.height;

  var num_lines_x = Math.floor(canvas_height/grid_size); //横轴个数
  var num_lines_y = Math.floor(canvas_width/grid_size);

  var x_axis_distance_grid_lines = num_lines_x - 1;// 第几格代表x y轴
  var y_axis_distance_grid_lines = 1;
// Draw grid lines along X-axis
  for(var i=0; i<=num_lines_x; i++) {
    ctx.beginPath();
    ctx.lineWidth = 1;

    // If line represents X-axis draw in different color
    if(i == x_axis_distance_grid_lines)
      ctx.strokeStyle = "#000000";
    else
      ctx.strokeStyle = "#e9e9e9";

    if(i == num_lines_x) {
      ctx.moveTo(0, grid_size*i);
      ctx.lineTo(canvas_width, grid_size*i);
    }
    else {
      ctx.moveTo(0, grid_size*i+0.5);
      ctx.lineTo(canvas_width, grid_size*i+0.5);
    }
    ctx.stroke();
  }

// Draw grid lines along Y-axis
  for(i=0; i<=num_lines_y; i++) {
    ctx.beginPath();
    ctx.lineWidth = 1;

    // If line represents X-axis draw in different color
    if(i == y_axis_distance_grid_lines)
      ctx.strokeStyle = "#000000";
    else
      ctx.strokeStyle = "#e9e9e9";

    if(i == num_lines_y) {
      ctx.moveTo(grid_size*i, 0);
      ctx.lineTo(grid_size*i, canvas_height);
    }
    else {
      ctx.moveTo(grid_size*i+0.5, 0);
      ctx.lineTo(grid_size*i+0.5, canvas_height);
    }
    ctx.stroke();
  }

// Translate to the new origin. Now Y-axis of the canvas is opposite to the Y-axis of the graph. So the y-coordinate of each element will be negative of the actual
  //ctx.translate(y_axis_distance_grid_lines*grid_size, x_axis_distance_grid_lines*grid_size);

// Ticks marks along the positive X-axis
//   var origin = {x : y_axis_distance_grid_lines*grid_size, y : x_axis_distance_grid_lines*grid_size}
//   for(i=1; i<(num_lines_y - y_axis_distance_grid_lines); i++) {
//     ctx.beginPath();
//     ctx.lineWidth = 1;
//     ctx.strokeStyle = "#000000";
//
//     // Draw a tick mark 6px long (-3 to 3)
//     ctx.moveTo(origin.x + grid_size*i+0.5, origin.y - 3);
//     ctx.lineTo(origin.x + grid_size*i+0.5, origin.y + 3);
//     ctx.stroke();
//
//     // Text value at that point
//     ctx.font = '9px Arial';
//     ctx.textAlign = 'start';
//     ctx.fillText(x_axis_starting_point.number*i, origin.x+grid_size*i-2, origin.y+15);
//   }

// Ticks marks along the negative X-axis
//             for(i=1; i<y_axis_distance_grid_lines; i++) {
//                 ctx.beginPath();
//                 ctx.lineWidth = 1;
//                 ctx.strokeStyle = "#000000";
//
//                 // Draw a tick mark 6px long (-3 to 3)
//                 ctx.moveTo(-grid_size*i+0.5, -3);
//                 ctx.lineTo(-grid_size*i+0.5, 3);
//                 ctx.stroke();
//
//                 // Text value at that point
//                 ctx.font = '9px Arial';
//                 ctx.textAlign = 'end';
//                 ctx.fillText(-x_axis_starting_point.number*i + x_axis_starting_point.suffix, -grid_size*i+3, 15);
//             }

// Ticks marks along the positive Y-axis
// Positive Y-axis of graph is negative Y-axis of the canvas
//   for(i=1; i<(x_axis_distance_grid_lines); i++) {
//     ctx.beginPath();
//     ctx.lineWidth = 1;
//     ctx.strokeStyle = "#000000";
//
//     // Draw a tick mark 6px long (-3 to 3)
//     ctx.moveTo(origin.x-3, origin.y - (grid_size*i+0.5));
//     ctx.lineTo(origin.x + 3, origin.y - (grid_size*i+0.5));
//     ctx.stroke();
//
//     // Text value at that point
//     ctx.font = '9px Arial';
//     ctx.textAlign = 'start';
//     ctx.fillText(y_axis_starting_point.number*i, 8, origin.y - (grid_size*i+3));
//   }

// Ticks marks along the negative Y-axis
// Negative Y-axis of graph is positive Y-axis of the canvas
//   for(i=1; i<x_axis_distance_grid_lines; i++) {
//     ctx.beginPath();
//     ctx.lineWidth = 1;
//     ctx.strokeStyle = "#000000";
//
//     // Draw a tick mark 6px long (-3 to 3)
//     ctx.moveTo(-3, -grid_size*i+0.5);
//     ctx.lineTo(3, -grid_size*i+0.5);
//     ctx.stroke();
//
//     // Text value at that point
//     ctx.font = '9px Arial';
//     ctx.textAlign = 'start';
//     ctx.fillText(y_axis_starting_point.number*i + y_axis_starting_point.suffix, 8, -grid_size*i+3);
//   }
}

export default {
  name: "DrawPad",
  data(){
    return {
      context: null,
      sigCanvas: null,
      width: null,
      height: null,
      positions: null,
      position: null,
      drawing: false,
      offsetLeft: null,
      offsetTop: null
    }
  },
  methods:{
    onMouseDown(mouseEvent) {
        console.log('down')
        this.drawing = true
        this.context.clearRect(0, 0, this.width, this.height);
        drawAxis(this.sigCanvas, this.context)
        this.position = this.getPosition(mouseEvent, this.sigCanvas);
        this.context.moveTo(this.position.X, this.position.Y);
        this.context.beginPath();
        this.positions = new Array()
        // this.$on('mousemove', function (mouseEvent) {
        //   console.log('move')
        //   this.drawLine(mouseEvent, this.sigCanvas, this.context);
        // })
        // this.$on('mouseup', function (mouseEvent) {
        //   this.finishDrawing(mouseEvent, this.sigCanvas, this.context);
        // })
        // this.$on('mouseout', function (mouseEvent) {
        //   this.finishDrawing(mouseEvent, this.sigCanvas, this.context);
        // });
        // $(this).mousemove(function (mouseEvent) {
        //   drawLine(mouseEvent, sigCanvas, context);
        // }).mouseup(function (mouseEvent) {
        //   finishDrawing(mouseEvent, sigCanvas, context);
        // }).mouseout(function (mouseEvent) {
        //   finishDrawing(mouseEvent, sigCanvas, context);
        // });
    },
    onMouseMove(mouseEvent){
      if(!this.drawing)return;
      this.drawLine(mouseEvent, this.sigCanvas, this.context);
    },
    onMouseUp(mouseEvent){
      if(!this.drawing)return;
      this.finishDrawing(mouseEvent, this.sigCanvas, this.context);
      this.drawing = false
    },
    onMouseOut(mouseEvent){
      if(!this.drawing)return;
      this.finishDrawing(mouseEvent, this.sigCanvas, this.context);
      this.drawing = false
    },


    initialize() {
      //this.$refs.sigCanvas.width = 500
      //this.$refs.sigCanvas.height = 200
      this.sigCanvas = this.$refs.sigCanvas
      this.context = this.sigCanvas.getContext("2d")
      this.context.strokeStyle = '#c2326c' // 离谱 这里设置过为啥不行？？
      this.width = this.sigCanvas.width
      this.height = this.sigCanvas.height
      let bbox = this.$refs.sigCanvas.getBoundingClientRect()
      this.offsetLeft = bbox.left
      this.offsetTop = bbox.top
      console.log('canvas',this.sigCanvas, 'context', this.context)
      drawAxis(this.sigCanvas, this.context)
    },
    getPosition(mouseEvent, sigCanvas) {
      return { X: mouseEvent.offsetX, Y: mouseEvent.offsetY  };
      //debugger
      var x, y;
      if (mouseEvent.pageX != undefined && mouseEvent.pageY != undefined) {
        x = mouseEvent.pageX;
        y = mouseEvent.pageY;
      } else {
        x = mouseEvent.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = mouseEvent.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }

      return { X: x - this.offsetLeft, Y: y - this.offsetTop };
    },
    drawLine(mouseEvent, sigCanvas, context) {
      var position = this.getPosition(mouseEvent, sigCanvas);
      //console.log(`draw ${position.X} ${position.Y}`)
      this.positions.push(position);
      context.strokeStyle = '#c2326c'
      context.lineTo(position.X, position.Y);
      context.stroke();
    },
    finishDrawing(mouseEvent, sigCanvas, context) {
      console.log('finish')
      this.drawLine(mouseEvent, sigCanvas, context);
      context.closePath();
      //画完 直接就去请求然后显示了
      let positions = this.postProcessing(sigCanvas)
      // 算positions数组的平均值，相当于平滑了
      var avg = new Array();
      let scale = 32;
      {
        let i = 0, j;
        while (i < positions.length){
          j = Math.min(i + scale, positions.length);
          let sum = 0;
          while(i < j){
            sum += positions[i];
            ++i;
          }
          avg.push(sum / scale)
        }
      }
      console.log(avg)
      // 请求得到相似曲线
      let url = common.queryTimeLineSimilar()
      fetch(url,{
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body:JSON.stringify(avg)
      }).then(
        (response)=>{
          if(!response.ok)return
          response.json().then((json)=>{
            // 发出消息，能够展示的就展示吧
            console.log(json)
            bus.$emit('WhoCanShowThis', json)
          })
        }
      )
    },
    postProcessing(sigCanvas, pNum=896, vRange=255){// 最后要返回多少个采样点，我们说896个，然后平滑在通过NN，最后找相似的
      console.log('post', this.positions)
      let left = 1e9, right = 0, up = 0, bottom = 1e9;
      let h = sigCanvas.height;
      const p = this.positions;
      for(let i = 0; i < p.length; i++){
        left = Math.min(left, p[i].X);
        right = Math.max(right, p[i].X);
        p[i].Y = h - p[i].Y;
        up = Math.max(up, p[i].Y);
        bottom = Math.min(bottom, p[i].Y);
      }
      var ret = new Array(pNum).fill(0);
      let lastpos = 0, revWidth = 1 / (right-left), revHeight = 1 / (up-bottom);// x只增不减
      for(let i = 1; i < p.length; ++i){
        if(p[i].X > p[lastpos].X){
          let l = Math.floor((p[lastpos].X-left) * revWidth * pNum); // 映射到0-900
          let r = Math.floor((p[i].X-left) * revWidth * pNum);
          let u = (p[i].Y-bottom) * revHeight * vRange; // 映射到0-255
          let b = (p[lastpos].Y-bottom) * revHeight * vRange;
          let dy = (u - b) / (r - l);
          for(let t = l; t < r; ++t){
            ret[t] = Math.round(b + dy * (t - l));
          }
          lastpos = i;
        }
      }
      // 理论上经过NN结果应该是平均，实际上有点奇怪，给输入映射到-1,1的锅？
      // 处理完事后，请求服务器找到相似的结果，然后展示出来。这部分通过事件交给展示相似的模块处理
      return ret;
    }
  },
  mounted() {
    this.initialize()
    this.$on('surprise', async (event, positions)=>{



      // TODO 绘制到一张热力图中去
      // const json = await response.json();
      // d3.selectAll('#timelines > *').remove(); // 这个应该只删除子元素,首先清除画布
      // for (let pos in json){
      //   const data = json[pos];
      // }
    })
  }
}
</script>

<style scoped>

</style>
