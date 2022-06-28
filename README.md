# zmwork
## Annotate 组件使用方式
/**
 * 创建一个批注则使用下列方式
 * 保存方法目前还没有实现
 * 保存方法：Annotate.prototype.save
 * 
 * */
const an = new Annotate({
    el: '#annotate', // 渲染节点
    imgOrigin: path, // 图片地址
    user: 'renxin', // 用户
    type: 1, // 模式 1 编辑 2 查看
    isShowUser: true, // 初始化时是否显示过往批注数据
    data: [
        {
            startX: 20, // 开始坐标X
            startY: 20, // 开始坐标Y
            endX: 200, // 结束坐标X
            endY: 200, // 结束坐标Y
            element: 'annotate-box0', // 节点class_name 
            optionType: 'horizontalline', // 批注操作类型
            color: 'red', // 颜色，暂时无效
            user: 'admin', // 用户
            data: '' // 批注操作类型为CHAR时有效
        },
        {
            startX: 50,
            startY: 50,
            endX: 200,
            endY: 200,
            color: 'green',
            element: 'annotate-box1',
            optionType: 'rectangle',
            user: 'admin' 
        },
        {
            startX: 350,
            startY: 350,
            endX: 400,
            endY: 400,
            color: 'green',
            element: 'annotate-box2',
            optionType: 'char',
            user: 'admin',
            data: '1'
        },
        {
            startX: 400,
            startY: 400,
            endX: 500,
            endY: 500,
            color: 'green',
            element: 'annotate-box3',
            optionType: 'char',
            user: '张三',
            data: '9'
        }
    ]
})
an.init();


##Annotate组件配置项
const Annotate = function(options) {
    this.type = options.type // 1 编辑 2 查看
    this.isShowUser = options.isShowUser // 是否展示用户的批注
    this.user = options.user ? options.user : 'admin';
    this.el = document.querySelector(options.el);
    this.el.style.display = 'flex';
    this.imgOrigin = options.imgOrigin; // 目标源图像地址
    this.coordinate = []; // 记录坐标
    this.temp_coordinate = []; // 记录临时坐标
    this.optionType = HORIZONTALLINE; // 水平线
    // 画图样式
    this.optionStyle = {
        width: '1px',
        height: '1px',
        color: 'red'
    }
    // 当前坐标
    this.currentCoordinate = { 
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
    };
    // 当前选中的批注DIV
    this.currentAnnotateBox = null;
    // 当前缩放的大小 百分比
    this.currentScale = 100;
    // 数值和正确错误
    this.charVal = '';
    // 当前用户
    this.users = {};
    // 当前数据
    this.initData = options.data && options.data.length > 0 ? options.data : [];
    /**
     * canvas 相关
     */
    // this.ctx = ''; // 画布上下文
    // this.ctxWidth = ''; // 画布宽度
    // this.ctxHeight = ''; // 画布高度
    // this.lineColor = '#000000'; // 画笔颜色默认黑色
    // this.lineWidth = 5; // 画笔默认线宽
    this.isOnOff = false; // 是否在画画
    // this.oldX = null; // 上一次旧坐标的X点
    // this.oldY = null; // 上一次就坐标的Y点
}
