<template>
  <el-table
    class="show-table"
    height="1000"
    :data="tableData"
    @row-dblclick="onRowDBClick"
    border
    stripe
    >
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
</template>

<script>
export default {
  name: "ImageGallery",
  data(){
    return {
      tableData: [{ // 是个数组，然后 麻了
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
    onRowDBClick(row, column, event){
      console.log({row,column,event})
    }
  }
}
</script>

<style scoped>
/*.show_table {*/
/*  width: 100%;*/
/*  height: 1000px;*/
/*  overflow: auto*/
/*}*/
</style>
