/**
 * 
 * @param {*} options object
 *      {
 *          el : 节点    
 *      }
 */
/**
 * TODO 
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
// 数字和错误正确 number and error correct
const CHAR = 'char';

const Annotate = function(options, fnSave) {
    this.type = options.type // 1 编辑 2 查看
    this.isShowUser = options.isShowUser // 是否展示用户的批注
    this.user = options.user ? options.user : 'admin';
    this.el = document.querySelector(options.el);
    this.el.style.display = 'flex';
    this.imgOrigin = options.imgOrigin; // 目标源图像地址
    this.imgNaturalWidth = options.imgNaturalWidth;
    this.imgNaturalHeight = options.imgNaturalHeight;
    this.coordinate = []; // 记录坐标
    this.temp_coordinate = []; // 记录临时坐标
    this.optionType = HORIZONTALLINE; // 水平线
    this.currentWidth = 0;
    this.currentHeight = 0;
    this.fnSave = fnSave;

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
    // 当前数据(别人的数据)
    this.initData = options.data && options.data.length > 0 ? options.data : [];
    // 当前我的数据
    this.myData = options.myData && options.myData.length > 0 ? options.myData : [];
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

    // 颜色集合
    this.colors = ['green', 'orange', 'purple', 'blue', 'pink'];
}

// 初始化
Annotate.prototype.init = function() {
    const dom = this.createDom(this.imgOrigin, this.type);
    this.compileDom(dom);

    // 设置画布的宽和高
    const imghw = this.getImageWidthAndHeight();
    this.el.querySelector('.anno-image img').style.width = imghw.width + 'px';
    this.el.querySelector('.anno-image img').style.height = imghw.height + 'px';
    this.setCanvasWidthAndHeight();

    // this.ctx = canvas.getContext('2d');
    const _this = this;
    // 添加画布 画布只是用来划定范围和操作，并不会使用canvas
    const canvas = this.getCanvas();
    this.currentWidth = canvas.width;
    this.currentHeight = canvas.height;

    if(this.type == 1) {
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
                const siblings = [...item.parentNode.children];
                siblings.forEach(function(element) {
                    element.classList.remove('anno-active')
                })
                item.classList.add('anno-active');
                if(this.dataset.optiontype == CHAR) {
                    _this.changeNumberAndErrorCorrect(this.dataset.number)
                }
                _this.changeOptionType(this.dataset.optiontype)
            })
        })
    
        // 获取撤销按钮
        const revokeBtn = this.getRevokeBtn();
        revokeBtn.addEventListener('click', function() {
            if(_this.temp_coordinate.length > 0) {
                const data = _this.temp_coordinate.pop();
                const el = _this.getImageBox();
                const element = el.querySelectorAll('.' + data.element);
                element.forEach(function(item) {
                    el.removeChild(item);
                })
            }
        })
        /** 
         * 
         * 目前缩放功能暂时关闭掉
         * 
         * 
        // 获取缩放按钮
        const scaleBtn = this.getScaleBtn();
        scaleBtn.addEventListener('click', function() {
            const classList = _this.el.querySelector('.anno-scale-btngroup').classList
            if(classList.contains('anno-hide')) {
                _this.el.querySelector('.anno-scale-btngroup').style.display = 'flex';
                classList.add('anno-show');
                classList.remove('anno-hide');
            } else {
                _this.el.querySelector('.anno-scale-btngroup').style.display = 'none';
                classList.add('anno-hide');
                classList.remove('anno-show');
            }
        })
        // 缩放不同比例的按钮点击事件
        const scaleBtnGroup = this.getScaleBtnGroup();
        scaleBtnGroup.forEach(function(item) {
            item.addEventListener('click', function() {
                const siblings = [...item.parentNode.children];
                siblings.forEach(function(element) {
                    element.classList.remove('anno-active')
                })
                item.classList.add('anno-active');
                const val = item.dataset.scale;
                _this.changeImageScale(val);
                _this.handleCoordinateByScale(val)
                // 缩放了重新设置画布的宽和高
                _this.setCanvasWidthAndHeight();
            })
        })
        */

        // 点击取消按钮关闭批注
        const cancelBtn = this.getCancelBtn();
        cancelBtn.addEventListener('click', function(){
                _this.clear();
            });
    }

    // 若数据库有值，先初始化值
    this.handleDataFromDataBase(this.initData);
    this.handleMyDataFromDataBase(this.myData);
    // 往当前用户区域填写用户使用颜色
    // this.fnFillColorForCurrentUser(this.optionStyle.color);
}

// 创建dom
Annotate.prototype.createDom = function(path, type) {
    let dom = `
        <div class='anno-image'>
            <img src="${path}" alt="" srcset="">
            <canvas id="anno-canvas" class='anno-canvas'>
            </canvas>
        </div>
    `;
    dom += `
        <div class='anno-options'>
    `;
    if(type == 1) {
        dom += `
            <div class='anno-current-user'>
                <div class='anno-current-user-name'>当前用户：</div>
                <div class='anno-user-flag'>
                    <div>${this.user}</div>
                </div>
            </div>
            <button class='anno-optiontype anno-active' data-optiontype='${HORIZONTALLINE}'>横线</button>
            <button class='anno-optiontype' data-optiontype='${RECTANGLE}'>矩形</button>
            <button class='anno-optiontype' data-optiontype='${CIRCLE}'>圆形</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='0'>0</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='1'>1</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='2'>2</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='3'>3</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='4'>4</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='5'>5</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='6'>6</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='7'>7</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='8'>8</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='9'>9</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='&#10003'>√</button>
            <button class='anno-optiontype' data-optiontype='${CHAR}' data-number='&#10005'>×</button>
            <div class='anno-option-fn'>
                <button class='anno-revoke anno-btn-danger'>撤销</button>
                <button class='anno-save'>保存</button>
                <button class='anno-cancel anno-btn-danger'>取消</button>
            </div>
            <!-- <button class='anno-scale'>缩放</button> -->
            <div class='anno-scale-btngroup anno-hide'>
                <div class='anno-scale-btn-box'>
                    <button class='anno-scale-btn' data-scale='50'>50%</button>
                    <button class='anno-scale-btn' data-scale='60'>60%</button>
                    <button class='anno-scale-btn' data-scale='70'>70%</button>
                    <button class='anno-scale-btn' data-scale='80'>80%</button>
                    <button class='anno-scale-btn' data-scale='90'>90%</button>
                    <button class='anno-scale-btn anno-active' data-scale='100'>100%</button>
                    <button class='anno-scale-btn' data-scale='110'>110%</button>
                    <button class='anno-scale-btn' data-scale='120'>120%</button>
                    <button class='anno-scale-btn' data-scale='130'>130%</button>
                    <button class='anno-scale-btn' data-scale='140'>140%</button>
                    <button class='anno-scale-btn' data-scale='150'>150%</button>
                    <div></div>
                </div>
            </div>
        `;
    }
    dom += `
        <div class='anno-users-title anno-hide'>其他用户标注:</div>
        <div class='anno-users'>
            <div class='anno-user-box'>
                <div class='anno-user-flag'>
                    <div></div>
                </div>
                <div class='anno-user-name'></div>
            </div>
        </div>
    `;
    dom += '</div>'
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
    canvas.width = canwh.width - 2;
    canvas.height = canwh.height - 2;
}


// 获取图片的宽度与高度
Annotate.prototype.getImageWidthAndHeight = function() {
    let width = this.el.querySelector('.anno-image').offsetWidth;
    let height = 0;

    if (width < this.imgNaturalWidth)
    {
        height = this.imgNaturalHeight * width / this.imgNaturalWidth;
    }
    else
    {
        width = this.imgNaturalWidth;
        height = this.imgNaturalHeight
    }

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

// 获取取消按钮
Annotate.prototype.getCancelBtn = function(){
    return this.el.querySelector('.anno-cancel');
}

// 
Annotate.prototype.getScaleBtnGroup = function() {
    return this.el.querySelectorAll('.anno-scale-btn');
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
            event.offsetY,
            this.charVal
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
        width: this.currentWidth,
        height: this.currentHeight,
        startX: fnMinusNumByScale(this.currentCoordinate.startX, this.currentScale),
        startY: fnMinusNumByScale(this.currentCoordinate.startY, this.currentScale),
        endX: fnMinusNumByScale(this.currentCoordinate.endX, this.currentScale),
        endY: fnMinusNumByScale(this.currentCoordinate.endY, this.currentScale),
        optionType: this.optionType,
        element: this.currentAnnotateBox.dataset.className,
        user: this.user, // 记住操作用户
        color: this.optionStyle.color, // 记住操作用户所用的颜色
        data: this.optionType == CHAR ? this.charVal : ""
    }
    // 给批注标明作者
    // const dom = this.createAnnotateUser(
    //     this.optionType,
    //     this.user,
    //     this.currentAnnotateBox.dataset.className,
    //     this.optionStyle.color,
    //     this.currentCoordinate.startX,
    //     this.currentCoordinate.startY,
    //     this.currentCoordinate.endX,
    //     this.currentCoordinate.endY
    // );
    // const el = this.getImageBox();
    // console.log(dom)
    // el.appendChild(dom)
    this.temp_coordinate.push(data)
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
    y,
    number
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
        case CHAR:
            dom = this.createNumberAndErrorCorrectBox(optionStyle, number, className, style, user, x, y);
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
    style += 'width:' + options.width + ';height:3px;';
    style += 'background-color:' + options.color + ';'
    const dom = document.createElement('div')
    dom.style = style;
    dom.classList.add('annotate-box');
    dom.classList.add('annotate-box-' + user);
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
    style += 'border: 3px solid ' + options.color + ';';
    const dom = document.createElement('div')
    dom.style = style;
    dom.classList.add('annotate-box');
    dom.classList.add('annotate-box-' + user);
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
    style += 'border: 3px solid ' + options.color + ';border-radius:50%';
    const dom = document.createElement('div')
    dom.style = style;
    dom.classList.add('annotate-box');
    dom.classList.add('annotate-box-' + user);
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
    dom.classList.add('annotate-box-' + user);
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

// 生成数字和对错
Annotate.prototype.createNumberAndErrorCorrectBox = function(
    options,
    data,
    className, 
    style, 
    user,
    x,
    y
) {
    const dom = document.createElement('div')
    dom.style = style;
    dom.style.top = y - 25 > 0 ? y - 25 + 'px' : 0 + 'px';
    dom.style.left = x - 25 > 0 ? x - 25 + 'px' : 0 + 'px';
    dom.style.fontSize = '40px';
    dom.style.textAlign = 'center';
    dom.style.lineHeight = '50px';
    dom.style.color = options.color;
    dom.classList.add('annotate-box');
    dom.classList.add('annotate-box-' + user);
    dom.classList.add(className);
    dom.classList.add('anno-errororeorrect');
    dom.dataset.className = className;
    dom.innerText = data;
    dom.setAttribute('title', user)
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
    let mydata = this.temp_coordinate


    const canvas = this.getCanvas();
    const scale = this.imgNaturalWidth / canvas.width;

    // 进行数据转换
    let mydata2 = [];
    for (let i = 0; i < mydata.length; i++)
    {
        mydata2.push({
            "optionType": mydata[i].optionType,
            "data"      : mydata[i].data,
            "startX"    : Math.round(mydata[i].startX * scale),
            "startY"    : Math.round(mydata[i].startY * scale),
            "endX"      : Math.round(mydata[i].endX * scale),
            "endY"      : Math.round(mydata[i].endY * scale),
            "width"     : this.imgNaturalWidth,
            "height"    : this.imgNaturalHeight,
            "element"   : mydata[i].element,
            "color"     : mydata[i].color,
            "user"      : mydata[i].user
        });
    }

    // mydata2 = mydata2.concat(...this.coordinate);
    this.clear();
    this.fnSave(mydata2);
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

// 切换数字和错误正确
Annotate.prototype.changeNumberAndErrorCorrect = function(val) {
    this.charVal = val
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
        const xScale = _this.currentWidth / item.width;
        const yScale = _this.currentHeight / item.height;
        const startX = item.startX * xScale;
        const endX = item.endX * xScale;
        const startY = item.startY * yScale;
        const endY = item.endY * yScale;
        const el = _this.el.querySelectorAll('.' + item.element);
        el.forEach(function(element) {
            element.style.width = (endX - startX) * (val / 100) + 'px';
            element.style.top = startY * (val / 100) + 'px';
            element.style.left = startX * (val / 100) + 'px';
            if(
                item.optionType == RECTANGLE
                || item.optionType == CIRCLE
            ) {
                element.style.height = (endY - startY) * (val / 100) + 'px'
            } else if(
                item.optionType == CHAR
            ) {
                element.style.width = 50 * xScale * (val / 100) + 'px';
                element.style.height = 50 * yScale * (val / 100) + 'px';
                element.style.lineHeight = 50 * yScale * (val / 100) + 'px';
                element.style.fontSize = 40 * xScale * (val / 100) + 'px';
                element.style.top = startY - 25 > 0 ? (startY * (val / 100)) - (25 * yScale * (val / 100))  + 'px' : 0;
                element.style.left = startX - 25 > 0 ? (startX * (val / 100)) - (25 * xScale * (val / 100))  + 'px' : 0;
            }
        })
    })
    this.temp_coordinate.forEach(function(item) {
        const xScale = _this.currentWidth / item.width;
        const yScale = _this.currentHeight / item.height;
        const startX = item.startX * xScale;
        const endX = item.endX * xScale;
        const startY = item.startY * yScale;
        const endY = item.endY * yScale;
        const el = _this.el.querySelectorAll('.' + item.element);
        el.forEach(function(element) {
            element.style.width = (endX - startX) * (val / 100) + 'px';
            element.style.top = startY * (val / 100) + 'px';
            element.style.left = startX * (val / 100) + 'px';
            if(
                item.optionType == RECTANGLE
                || item.optionType == CIRCLE
            ) {
                element.style.height = (endY - startY) * (val / 100) + 'px'
            } else if(
                item.optionType == CHAR
            ) {
                element.style.width = 50 * xScale * (val / 100) + 'px';
                element.style.height = 50 * yScale * (val / 100) + 'px';
                element.style.lineHeight = 50 * yScale * (val / 100) + 'px';
                element.style.fontSize = 40 * xScale * (val / 100) + 'px';
                element.style.top = startY - 25 > 0 ? (startY * (val / 100)) - (25 * yScale * (val / 100))  + 'px' : 0;
                element.style.left = startX - 25 > 0 ? (startX * (val / 100)) - (25 * xScale * (val / 100))  + 'px' : 0;
            }
        })
    })
}

// 处理从数据库获取的数据
Annotate.prototype.handleDataFromDataBase = function(data) {
    // 赋值
    this.coordinate = data;
    const _this = this;
    let temp = 0;
    let userFlagDom = '';
    let user = {};
    data.forEach(function(item) {
        const xScale = _this.currentWidth / item.width;
        const yScale = _this.currentHeight / item.height;
        const style = 'top:' + item.startY * xScale + 'px;left:' + item.startX * xScale + 'px;';
        const el = _this.getImageBox();
        // TODO 为了分辨是哪个用户加的，后续加上用户账号或id
        // annotate-box0-user_id
        const className = item.element;
        // 处理颜色
        const options = JSON.parse(JSON.stringify(_this.optionStyle));
        const color = user[item.user];
        if(!color) {
            // 若当前记录有传入颜色则使用传入的颜色，否则使用颜色池的里的颜色
            user[item.user] = item.color ? item.color : _this.colors.length > 0 ? _this.colors[0] : ranColor();
            if(!item.color) {
                _this.colors.shift();
            }
            userFlagDom += _this.createAnnotateUserFlag(user[item.user], item.user);
        }

        options.color = user[item.user];

        const dom = _this.createAnnotateBox(
            options, 
            item.optionType, 
            className, 
            style, 
            item.user,
            item.startX * xScale,
            item.startY * xScale,
            item.data
        );
        el.appendChild(dom);
        const box = el.querySelector('.' + className)
        _this.handleAnnotateBoxStyle(
            box,
            item.optionType,
            item.startX * xScale,
            item.startY * xScale,
            item.endX * xScale,
            item.endY * xScale
        )
        // const userDom = _this.createAnnotateUser(
        //     item.optionType,
        //     item.user,
        //     className,
        //     options.color,
        //     item.startX,
        //     item.startY,
        //     item.endX,
        //     item.endY,
        //     item.data ? item.data : ''
        // );
        // el.appendChild(userDom);
    })
    // 判断当前用户的颜色
    if(!_this.optionStyle.color) {
        _this.optionStyle.color = COLORS.length > 0 ? COLORS[0] : ranColor();
    }
    if(userFlagDom) {
        _this.el.querySelector('.anno-users-title').classList.remove('anno-hide')
    }
    _this.el.querySelector('.anno-users').innerHTML = userFlagDom;
    _this.el.querySelectorAll('.anno-user-box').forEach(function(item) {
        item.addEventListener('click', function() {
            _this.el.querySelectorAll('.annotate-box-' + item.dataset.name).forEach(function(item2) {
                if(item2.classList.contains('anno-hide')) {
                    item2.classList.add('anno-show');
                    item2.classList.remove('anno-hide');
                } else {
                    item2.classList.remove('anno-show');
                    item2.classList.add('anno-hide');
                }
            });
        })
    })
    if(!_this.isShowUser) {
        _this.el.querySelectorAll('.anno-user-box').forEach(function(item) {
            _this.el.querySelectorAll('.annotate-box-' + item.dataset.name).forEach(function(item2) {
                item2.classList.add('anno-hide'); 
            });
        })
    }
}

// 处理从数据库获取的数据
Annotate.prototype.handleMyDataFromDataBase = function(data) {
    // 赋值
    this.temp_coordinate = data;
    const _this = this;
    data.forEach(function(item) {
        const xScale = _this.currentWidth / item.width;
        const yScale = _this.currentHeight / item.height;
        const style = 'top:' + item.startY * xScale + 'px;left:' + item.startX * xScale + 'px;';
        const el = _this.getImageBox();
        // TODO 为了分辨是哪个用户加的，后续加上用户账号或id
        // annotate-box0-user_id
        const className = item.element;
        // 处理颜色
        const options = JSON.parse(JSON.stringify(_this.optionStyle));
        
        const dom = _this.createAnnotateBox(
            options, 
            item.optionType, 
            className, 
            style, 
            item.user,
            item.startX * xScale,
            item.startY * xScale,
            item.data
        );
        el.appendChild(dom);
        const box = el.querySelector('.' + className)
        _this.handleAnnotateBoxStyle(
            box,
            item.optionType,
            item.startX * xScale,
            item.startY * xScale,
            item.endX * xScale,
            item.endY * xScale
        )
        // const userDom = _this.createAnnotateUser(
        //     item.optionType,
        //     item.user,
        //     className,
        //     options.color,
        //     item.startX,
        //     item.startY,
        //     item.endX,
        //     item.endY,
        //     item.data ? item.data : ''
        // );
        // el.appendChild(userDom);
    })
}

// 生成右侧作者的标识
Annotate.prototype.createAnnotateUserFlag = function(
    color,
    name,
    id
) {
    const dom = `
        <div class='anno-user-box' data-name='${name}'>
            <div class='anno-user-flag'>
                <div style='background-color: ${color}'></div>
            </div>
            <div class='anno-user-name'>${name}</div>
        </div>
    `;
    return dom;
}

// 
Annotate.prototype.fnFillColorForCurrentUser = function(
    color = 'red'
) {
    this.el.querySelector('.anno-current-user .anno-user-flag div').style.backgroundColor = color;
}

// 减去缩放的数值
function fnMinusNumByScale(num, scale) {
    return num / (scale / 100);
}

// 生成随机色
function ranColor() {
    var str = '0123456789abcdef';
    var bgColor = '#';
    for (var i = 0; i < 6; i++) {
        var idx = parseInt(Math.random() * str.length);
        bgColor += str[idx];
    }
    return bgColor;
}

