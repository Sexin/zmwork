/**
 * 
 * @param {*} options object
 *      {
 *          el : 节点    
 *      }
 */
// 横线
const HORIZONTALLINE = 'horizontalline'; 
// 矩形
const RECTANGLE = 'rectangle';
// 圆形
const CIRCLE = 'circle';
// 错误图片
const ERROR = 'error';
// 正确图片
const CORRECT = 'correct';

const Annotate = function(options) {
    this.user = options.user ? options.user : 'admin';
    this.el = document.querySelector(options.el);
    this.el.style.display = 'flex';
    this.imgOrigin = options.imgOrigin; // 目标源图像地址
    this.coordinate = []; // 记录坐标
    this.optionType = HORIZONTALLINE; // 水平线
    // 画图样式
    this.optionStyle = {
        width: '1px',
        height: '1px',
        color: '#000'
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

// 初始化
Annotate.prototype.init = function() {
    const dom = this.createDom(this.imgOrigin);
    this.compileDom(dom);
    // 设置画布的宽和高
    this.setCanvasWidthAndHeight();
    // this.ctx = canvas.getContext('2d');
    const _this = this;
    // 添加画布 画布只是用来划定范围和操作，并不会使用canvas
    const canvas = this.getCanvas();
    canvas.addEventListener('mousemove', this.draw.bind(this), false);
    canvas.addEventListener('mousedown', this.down.bind(this), true);
    canvas.addEventListener('mouseup', this.up.bind(this), false);

    // 保存btn
    const btnSave = this.getSaveBtn();
    btnSave.addEventListener('click', function() {
        _this.save();
    })
    // 切换颜色
    const btnColor = this.getColorBtn();
    btnColor.forEach(function(item) {
        item.addEventListener('click', function() {
            _this.changeOptionStyle(this.dataset.color, 1);
        })
    })

    // 获得操作按钮
    const optionsBtn = this.getOptionTypeBtn();
    optionsBtn.forEach(function(item) {
        item.addEventListener('click', function() {
            _this.changeOptionType(this.dataset.optiontype)
        })
    })

    // 获取撤销按钮
    const revokeBtn = this.getRevokeBtn();
    revokeBtn.addEventListener('click', function() {
        if(_this.coordinate.length > 0) {
            const data = _this.coordinate.pop();
            const el = _this.getImageBox();
            const element = el.querySelectorAll('.' + data.element);
            element.forEach(function(item) {
                el.removeChild(item);
            })
        }
    })

    // 获取缩放按钮
    const scaleBtn = this.getScaleBtn();
    let flag = true;
    scaleBtn.addEventListener('click', function() {
        // 缩放了重新设置画布的宽和高
        if(flag) {
            _this.currentScale = 80;
            _this.changeImageScale(80);
            _this.handleCoordinateByScale(80)
            flag = false
        } else {
            _this.currentScale = 100;
            _this.changeImageScale(100);
            _this.handleCoordinateByScale(100);
            flag = true
        }
        _this.setCanvasWidthAndHeight();
    })
    // 若数据库有值，先初始化值
    this.handleDataFromDataBase();
}

// 创建dom
Annotate.prototype.createDom = function(path) {
    const dom = `
        <div class='anno-image'>
            <img src="${path}" alt="" srcset="">
            <canvas id="anno-canvas" class='anno-canvas'>
            </canvas>
        </div>
        <div class='anno-options'>
            <button class='anno-optiontype' data-optiontype='${HORIZONTALLINE}'>横线</button>
            <button class='anno-optiontype' data-optiontype='${RECTANGLE}'>矩形</button>
            <button class='anno-optiontype' data-optiontype='${CIRCLE}'>圆形</button>
            <button class='anno-optiontype' data-optiontype='${ERROR}'>错误</button>
            <button class='anno-optiontype' data-optiontype='${CORRECT}'>正确</button>
            <button class='anno-color' data-color='red'>红色</button>
            <button class='anno-color' data-color='black'>黑色</button>
            <button class='anno-color' data-color='green'>绿色</button>
            <button class='anno-revoke'>撤销</button>
            <button class='anno-scale'>缩放</button>
            <button class='anno-save'>保存</button>
        </div>
    `;
    return dom;
}

// 渲染dom
Annotate.prototype.compileDom = function(dom) {
    this.el.innerHTML = dom
}

// 获取画布的宽和高
Annotate.prototype.getCanvasWidthAndHeight = function() {
    const width = this.el.querySelector('.anno-image').offsetWidth;
    const height = this.el.querySelector('.anno-image').offsetHeight;
    return {
        width: width,
        height: height
    }
}

// 设置画布的宽和高
Annotate.prototype.setCanvasWidthAndHeight = function() {
    const canwh = this.getImageWidthAndHeight();
    const canvas = this.getCanvas();
    canvas.width = canwh.width;
    canvas.height = canwh.height;
}


// 获取图片的宽度与高度
Annotate.prototype.getImageWidthAndHeight = function() {
    const width = this.el.querySelector('.anno-image img').offsetWidth;
    const height = this.el.querySelector('.anno-image img').offsetHeight;
    return {
        width: width,
        height: height
    }
}

// 获取图像模块
Annotate.prototype.getImageBox = function() {
    return this.el.querySelector('.anno-image');
}

// 获取画布
Annotate.prototype.getCanvas = function() {
    return this.el.querySelector('.anno-canvas');
}

// 获得保存按钮
Annotate.prototype.getSaveBtn = function() {
    return this.el.querySelector('.anno-save')
}

// 获取颜色的按钮
Annotate.prototype.getColorBtn = function() {
    return this.el.querySelectorAll('.anno-color');
}

// 获取操作的按钮
Annotate.prototype.getOptionTypeBtn = function() {
    return this.el.querySelectorAll('.anno-optiontype')
}

// 获取撤销按钮
Annotate.prototype.getRevokeBtn = function() {
    return this.el.querySelector('.anno-revoke');
}

// 获取缩放按钮
Annotate.prototype.getScaleBtn = function() {
    return this.el.querySelector('.anno-scale');
}

// 鼠标按下事件
Annotate.prototype.down = function(event) {
    this.isOnOff = true;
    // this.oldX = event.offsetX;
    // this.oldY = event.offsetY;
    this.currentCoordinate.startX = event.offsetX;
    this.currentCoordinate.startY = event.offsetY;
    if(!this.currentAnnotateBox) {
        const style = 'top:' + event.offsetY + 'px;left:' + event.offsetX + 'px;';
        const el = this.getImageBox();
        // TODO 为了分辨是哪个用户加的，后续加上用户账号或id
        // annotate-box0-user_id
        const className = 'annotate-box' + el.querySelectorAll('.annotate-box').length ++;
        const dom = this.createAnnotateBox(
            this.optionStyle, 
            this.optionType, 
            className, 
            style, 
            this.user,
            event.offsetX,
            event.offsetY
        );
        el.appendChild(dom);
        this.currentAnnotateBox = el.querySelector('.' + className);
    }
}

// 鼠标放起事件
Annotate.prototype.up = function(event) {
    this.isOnOff = false;
    this.currentCoordinate.endX = event.offsetX
    this.currentCoordinate.endY = event.offsetY
    const data = {
        startX: fnMinusNumByScale(this.currentCoordinate.startX, this.currentScale),
        startY: fnMinusNumByScale(this.currentCoordinate.startY, this.currentScale),
        endX: fnMinusNumByScale(this.currentCoordinate.endX, this.currentScale),
        endY: fnMinusNumByScale(this.currentCoordinate.endY, this.currentScale),
        optionType: this.optionType,
        element: this.currentAnnotateBox.dataset.className,
        user: this.user,
        color: this.optionStyle.color
    }
    // 给批注标明作者
    const dom = this.createAnnotateUser(
        this.optionType,
        this.user,
        this.currentAnnotateBox.dataset.className,
        this.optionStyle.color,
        this.currentCoordinate.startX,
        this.currentCoordinate.startY,
        this.currentCoordinate.endX,
        this.currentCoordinate.endY
    );
    const el = this.getImageBox();
    console.log(dom)
    el.appendChild(dom)
    this.coordinate.push(data);
    this.currentCoordinate = {
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
    }
    this.currentAnnotateBox = null // 将操作的当前节点释放
}

// 鼠标移动事件
Annotate.prototype.draw = function(event) {
    if(this.isOnOff) {
        const newX = event.offsetX;
        const newY = event.offsetY;
        /**
         * 画布相关操作
            this.ctx.beginPath();
            this.ctx.moveTo(this.oldX, this.oldY);
            this.ctx.lineTo(newX, newY);
            this.ctx.strokeStyle = this.lineColor;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
            this.oldX = newX;
            this.oldY = newY;
        */
        // this.currentAnnotateBox.style.width = newX - this.currentCoordinate.startX + 'px';
        this.handleAnnotateBoxStyle(
            this.currentAnnotateBox,
            this.optionType,
            this.currentCoordinate.startX,
            this.currentCoordinate.startY,
            newX,
            newY
        )
    }
}

// 生成批注模块
// 不同的模块生成不同的模板
Annotate.prototype.createAnnotateBox = function(
    optionStyle, 
    optionType, 
    className, 
    style, 
    user,
    x,
    y
) {
    let dom = ''
    switch(optionType) {
        case HORIZONTALLINE: 
            dom = this.createHorizontalLineBox(optionStyle, className, style, user);
            return dom;
        case RECTANGLE:
            dom = this.createRectangleBox(optionStyle, className, style, user);
            return dom;
        case CIRCLE: 
            dom = this.createCircleBox(optionStyle, className, style, user);
            return dom;
        case ERROR: 
            dom = this.createErrorOrCorrectBox(optionStyle, className, style, user, x, y);
            return dom;
        case CORRECT: 
            dom = this.createErrorOrCorrectBox(optionStyle, className, style, user, x, y, 0);
            return dom;
        default: 
            return '';
    }
}

// 处理不同批注的操作样式
// 当移动时不同的批注类型有不同的操作方式
Annotate.prototype.handleAnnotateBoxStyle = function(
    el, 
    optionType, 
    oldX, 
    oldY, 
    newX, 
    newY
) {
    const canwh = this.getImageWidthAndHeight();
    switch(optionType) {
        case HORIZONTALLINE: 
            // TODO 这里需要计算画布的相对位置
            if(newX > canwh.width) {
                newX = canwh.width 
            }
            // 处理反向
            if(newX >= oldX) {
                el.style.width = newX - oldX + 'px';
            } else {
                el.style.left = newX + 'px';
                el.style.width = oldX - newX + 'px';
            }
            return;
        case RECTANGLE:
            if(newX > canwh.width) {
                newX = canwh.width 
            }
            if(newY > canwh.height) {
                newY = canwh.height 
            }
            // 处理反向
            if(newX >= oldX) {
                el.style.width = newX - oldX + 'px';
            } else {
                el.style.width = oldX - newX + 'px'; 
                el.style.left = newX + 'px'
            }
            // 处理反向
            if(newY >= oldY) {
                el.style.height = newY - oldY + 'px'; 
            } else {
                el.style.height = oldY - newY + 'px';
                el.style.top = newY + 'px';
            }
            return;
        case CIRCLE:
            if(newX > canwh.width) {
                newX = canwh.width 
            }
            if(newY > canwh.height) {
                newY = canwh.height 
            }
            // 处理反向
            if(newX >= oldX) {
                el.style.width = newX - oldX + 'px';
            } else {
                el.style.width = oldX - newX + 'px'; 
                el.style.left = newX + 'px'
            }
            // 处理反向
            if(newY >= oldY) {
                el.style.height = newY - oldY + 'px'; 
            } else {
                el.style.height = oldY - newY + 'px';
                el.style.top = newY + 'px';
            }
            return;
        default: 
            return '';
    }
}

// 生成横线
Annotate.prototype.createHorizontalLineBox = function(
    options, 
    className, 
    style, 
    user
) {
    style += 'width:' + options.width + ';height:' + options.height + ';';
    style += 'background-color:' + options.color + ';'
    const dom = document.createElement('div')
    dom.style = style;
    dom.classList.add('annotate-box');
    dom.classList.add(className);
    dom.classList.add('anno-horizontalline');
    dom.dataset.className = className;
    dom.setAttribute('title', user)
    return dom;
}

// 生成方形框
Annotate.prototype.createRectangleBox = function(
    options, 
    className, 
    style, 
    user
) {
    style += 'width:' + options.width + ';height:' + options.height + ';';
    style += 'border: 1px solid ' + options.color + ';';
    const dom = document.createElement('div')
    dom.style = style;
    dom.classList.add('annotate-box');
    dom.classList.add(className);
    dom.classList.add('anno-rectangle');
    dom.dataset.className = className;
    dom.setAttribute('title', user)
    return dom; 
}

// 生成圆形
Annotate.prototype.createCircleBox = function(
    options, 
    className, 
    style, 
    user
) {
    style += 'width:' + options.width + ';height:' + options.height + ';';
    style += 'border: 1px solid ' + options.color + ';border-radius:50%';
    const dom = document.createElement('div')
    dom.style = style;
    dom.classList.add('annotate-box');
    dom.classList.add(className);
    dom.classList.add('anno-rectangle');
    dom.dataset.className = className;
    dom.setAttribute('title', user)
    return dom; 
}

// 生成错误和成功图片，点击某个位置放入
Annotate.prototype.createErrorOrCorrectBox = function(
    options, 
    className, 
    style, 
    user,
    x,
    y,
    type = 1
) {
    const dom = document.createElement('div')
    dom.style = style;
    dom.style.top = y - 25 > 0 ? y - 25 + 'px' : 0 + 'px';
    dom.style.left = x - 25 > 0 ? x - 25 + 'px' : 0 + 'px';
    dom.classList.add('annotate-box');
    dom.classList.add(className);
    dom.classList.add('anno-errororeorrect');
    dom.dataset.className = className;
    dom.setAttribute('title', user)
    const img = document.createElement('img');
    img.setAttribute('src', type == 1 ? '../img/error.png' : '../img/correct.png');
    img.style.width = '50px';
    img.style.height = '50px';
    dom.appendChild(img)
    return dom; 
}

// 生成批注作者
// 不同的批注方式批注作者不同的位置
Annotate.prototype.createAnnotateUser = function(
    optionType, 
    user, 
    className,
    color,
    startX, 
    startY, 
    endX, 
    endY
) {
    let dom = '';
    console.log(optionType, ERROR)
    switch(optionType) {
        case HORIZONTALLINE: 
            dom = this.createAnnotateUserBox(
                user, 
                className,
                color,
                startX, 
                startY, 
                endX, 
                startY // 横线位置就在初始值的下面
            );
            return dom;
        case RECTANGLE:
            dom = this.createAnnotateUserBox(
                user, 
                className,
                color,
                startX, 
                startY, 
                endX, 
                endY
            ); 
            return dom;
        case CIRCLE: 
            dom = this.createAnnotateUserBox(
                user, 
                className,
                color,
                startX, 
                startY, 
                endX, 
                endY
            );
            return dom;
        case ERROR: 
            dom = this.createAnnotateUserBox(
                user, 
                className,
                'red',
                startX, 
                startY, 
                startX + 15,
                startY + 15
            );
            return dom;
        case CORRECT: 
            dom = this.createAnnotateUserBox(
                user, 
                className,
                'green',
                startX, 
                startY, 
                startX + 15,
                startY + 15
            );
            return dom; 
        default: 
        return dom;
    }
}

// 生成批注作者模板
Annotate.prototype.createAnnotateUserBox = function(
    user, 
    className,
    color,
    startX, 
    startY, 
    endX, 
    endY
) {
    const style = 'top:' + (endY) + 'px;left:' + endX + 'px;color:' + color;
    const dom = document.createElement('div');
    dom.style = style;
    dom.classList.add('annotate-box-user');
    dom.classList.add(className)
    dom.innerText = user;
    return dom;
}

// 保存
Annotate.prototype.save = function() {
    console.log(this.coordinate);
    this.clear();
}

// 销毁目标
Annotate.prototype.clear = function() {
    this.el.style.display = 'none';
    this.el.innerHTML = '';
}

// 切换批注类型
Annotate.prototype.changeOptionType = function(val) {
    this.optionType = val
}

// 切换样式
Annotate.prototype.changeOptionStyle = function(val, type) {
    // type == 1 修改颜色
    switch(type) {
        case 1: 
            this.optionStyle.color = val;
            return;
        default: 
            return;
    }
}

// 处理缩放
Annotate.prototype.changeImageScale = function(val) {
    this.el.querySelector('.anno-image img').style.width = val + '%';
    this.el.querySelector('.anno-image img').style.height = val + '%';
}

// 处理缩放导致的批注位置
Annotate.prototype.handleCoordinateByScale = function(val) {
    const _this = this;
    this.coordinate.forEach(function(item) {
        console.log(item)
        const el = _this.el.querySelectorAll('.' + item.element);
        el.forEach(function(element) {
            // 判断是否是作者名称
            if(element.classList.value.indexOf('annotate-box-user') > -1) {
                // 处理批注作者名称缩放
                if(
                    item.optionType == RECTANGLE
                    || item.optionType == CIRCLE
                ) {
                    element.style.top = (item.endY * (val / 100)) + (5 * (val / 100)) + 'px';
                    element.style.left = item.endX * (val / 100) + 'px'
                } else if(
                    item.optionType == ERROR
                    || item.optionType == CORRECT
                ) {
                    // 处理错误和正确图片批注作者缩放的时候
                    element.style.top = (item.startY * (val / 100)) + (25 * (val / 100)) + 'px';  
                    element.style.left = (item.startX * (val / 100)) + (25 * (val / 100)) + 'px';
                } else  {
                    element.style.top = (item.startY * (val / 100)) + (5 * (val / 100)) + 'px';
                    element.style.left = item.endX * (val / 100) + 'px' 
                }
            } else {
                element.style.width = (item.endX - item.startX) * (val / 100) + 'px';
                element.style.top = item.startY * (val / 100) + 'px';
                element.style.left = item.startX * (val / 100) + 'px';
                if(
                    item.optionType == RECTANGLE
                    || item.optionType == CIRCLE
                ) {
                    element.style.height = (item.endY - item.startY) * (val / 100) + 'px'
                } else if(
                    item.optionType == ERROR
                    || item.optionType == CORRECT
                ) {
                    // 处理错误和正确图片缩放的时候
                    element.style.width = 50 * (val / 100) + 'px'
                    element.style.height = 50 * (val / 100) + 'px'
                    element.style.top = item.startY - 25 > 0 ? (item.startY * (val / 100)) - (25 * (val / 100))  + 'px' : 0;
                    element.style.left = item.startX - 25 > 0 ? (item.startX * (val / 100)) - (25 * (val / 100))  + 'px' : 0;
                    const img = _this.el.querySelector('.' + item.element + ' img');
                    img.style.width = 50 * (val / 100) + 'px';
                    img.style.height = 50 * (val / 100) + 'px';
                }
                
            }
        })
    })
}

// 处理从数据库获取的数据
Annotate.prototype.handleDataFromDataBase = function() {
    const data = [
        {
            startX: 20,
            startY: 20,
            endX: 200,
            endY: 200,
            element: 'annotate-box0',
            optionType: HORIZONTALLINE,
            color: 'red',
            user: 'admin'
        },
        {
            startX: 50,
            startY: 50,
            endX: 200,
            endY: 200,
            color: 'green',
            element: 'annotate-box1',
            optionType: RECTANGLE,
            user: 'admin' 
        }
    ];
    // 赋值
    this.coordinate = data;
    const _this = this;
    data.forEach(function(item) {
        const style = 'top:' + item.startY + 'px;left:' + item.startX + 'px;';
        const el = _this.getImageBox();
        // TODO 为了分辨是哪个用户加的，后续加上用户账号或id
        // annotate-box0-user_id
        const className = item.element;
        // 处理颜色
        const options = JSON.parse(JSON.stringify(_this.optionStyle));
        if(item.color != '') {
            options.color = item.color
        }
        const dom = _this.createAnnotateBox(
            options, 
            item.optionType, 
            className, 
            style, 
            item.user
        );
        el.appendChild(dom);
        const box = el.querySelector('.' + className)
        _this.handleAnnotateBoxStyle(
            box,
            item.optionType,
            item.startX,
            item.startY,
            item.endX,
            item.endY
        )
        const userDom = _this.createAnnotateUser(
            item.optionType,
            item.user,
            className,
            options.color,
            item.startX,
            item.startY,
            item.endX,
            item.endY
        );
        el.appendChild(userDom);
    })
}

// 减去缩放的数值
function fnMinusNumByScale(num, scale) {
    return num / (scale / 100);
}

